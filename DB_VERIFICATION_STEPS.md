# Database Verification Steps for Practice Sets

**Last Updated:** 2026-06-03

---

## Step 1: Verify Practice Tables Created

Go to **Supabase SQL Editor** and run:

```sql
-- Check if practice tables were created by migrations 027 & 028
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'practice%'
ORDER BY table_name;
```

**Expected Result:**
```
table_name
─────────────────────────
practice_attempts
practice_questions
practice_sets
practice_submissions
```

If result is empty → Migrations were NOT applied. Contact DevOps to run 027-practice-sets.sql and 028-practice-question-types.sql manually.

---

## Step 2: Verify CMS Content Imported

### 2a. Check if practice keys exist in database

```sql
-- Count practice-related CMS content keys
SELECT COUNT(*) as total_practice_keys, language
FROM cms_content
WHERE key LIKE 'practice.%' OR key = 'nav.practice'
GROUP BY language
ORDER BY language;
```

**Expected Result:**
```
total_practice_keys | language
───────────────────┼──────────
        19         | en
        19         | vi
```

If result shows 0 → Seed files were NOT imported.

### 2b. Check specific practice keys

```sql
-- List all practice keys
SELECT language, key, value FROM cms_content
WHERE key LIKE 'practice.%' OR key = 'nav.practice'
ORDER BY language, key;
```

**Expected Result:** Should show 19 keys per language:
- `nav.practice` (1 key in common category)
- `practice.title`, `practice.subtitle` (2 keys)
- `practice.compete.*` (3 keys: title, desc, cta)
- `practice.sets.*` (11 keys)
- `practice.official.*` (2 keys)
- `practice.user.*` (2 keys)

---

## Step 3: If CMS Content Missing → Import Seed Files

### 3a. Go to Admin Dashboard

1. Navigate to http://localhost:3000/admin (or your production URL)
2. Login as admin user
3. Click **"Content Manager"** in sidebar

### 3b. Import VI Seed

1. Click **"Import JSON"** button
2. Open file: `docs/seeds/cms_content_seed_vi.json`
3. Verify preview shows 303 items
4. Click **"Import"**
5. Should see success message: "Import completed: 303 items"

### 3c. Import EN Seed

1. Click **"Import JSON"** button again
2. Open file: `docs/seeds/cms_content_seed_en.json`
3. Verify preview shows 303 items
4. Click **"Import"**
5. Should see success message: "Import completed: 303 items"

---

## Step 4: Verify Frontend Can Fetch Content

### 4a. Browser Developer Tools

1. Open http://localhost:3000/practice
2. Open **Network tab** (F12 → Network)
3. Reload page (Ctrl+R)
4. Look for request: **`POST /api/content/batch`**
5. Click it → **Response tab**
6. Should see practice.* keys with values

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "practice.title": "Luyện tập sau khi học.",
    "practice.subtitle": "Chọn cách ôn phù hợp...",
    "practice.compete.title": "Thi đấu",
    ...
  }
}
```

### 4b. Check Page Rendering

1. After page loads, inspect HTML (Right-click → Inspect)
2. Look for heading containing "Luyện tập sau khi học." (VI) or "Practice after learning." (EN)
3. If heading shows fallback text ("Luyện tập sau khi học.") → Content loaded from seed
4. If heading is empty or "undefined" → CMS fetch failed

---

## Step 5: Test Language Switching

### 5a. Change Language in UI

1. Go to profile or look for language switcher (typically in header)
2. Switch language from VI → EN
3. Navigate to `/practice` again (force reload: Ctrl+Shift+R)

### 5b. Verify EN Content Displays

Should see:
- Heading: "Practice after learning."
- Button: "Enter compete mode" (instead of "Vào phòng thi đấu")
- Card title: "Compete" (instead of "Thi đấu")

If EN content does NOT display → Language switching failed or EN seed not imported.

---

## Step 6: Check Database Logs for Errors

### 6a. Backend Console Logs

If running locally:
```bash
# Terminal window where backend is running
# Should NOT see errors like:
# "Failed to fetch content for language vi"
# "Practice keys not found in database"
```

### 6b. Supabase Function Logs

1. Go to Supabase Dashboard
2. Click **Functions** → **Logs**
3. Search for errors related to `cms_content` or `practice`
4. Should be clean (no RED error indicators)

---

## Step 7: Query Practice Content (Detailed Check)

### 7a. Count all practice content

```sql
-- Total count by category within practice
SELECT 
  COUNT(*) as total_keys,
  COUNT(DISTINCT key) as unique_keys,
  COUNT(DISTINCT language) as languages
FROM cms_content
WHERE key LIKE 'practice.%' OR key = 'nav.practice';
```

**Expected:**
- `total_keys`: 38 (19 keys × 2 languages: VI + EN)
- `unique_keys`: 19
- `languages`: 2

### 7b. List missing keys

```sql
-- Find keys that exist in VI but NOT in EN (or vice versa)
WITH vi_keys AS (
  SELECT DISTINCT key FROM cms_content 
  WHERE language = 'vi' AND (key LIKE 'practice.%' OR key = 'nav.practice')
),
en_keys AS (
  SELECT DISTINCT key FROM cms_content 
  WHERE language = 'en' AND (key LIKE 'practice.%' OR key = 'nav.practice')
)
SELECT 
  COALESCE(vi_keys.key, en_keys.key) as key,
  CASE WHEN vi_keys.key IS NOT NULL THEN '✓' ELSE '✗' END as in_vi,
  CASE WHEN en_keys.key IS NOT NULL THEN '✓' ELSE '✗' END as in_en
FROM vi_keys
FULL OUTER JOIN en_keys ON vi_keys.key = en_keys.key
ORDER BY key;
```

**Expected:** All rows should have ✓ in both columns.

---

## Troubleshooting

### Problem: Practice tables don't exist

**Solution:**
1. Check if migrations were applied: Go to Supabase → SQL Editor → Look for migration history
2. If migrations failed, manually run:
   - First: Copy content from `loopy-backend/database/migrations/027-practice-sets.sql` → Paste into SQL Editor → Run
   - Then: Copy content from `loopy-backend/database/migrations/028-practice-question-types.sql` → Paste → Run

### Problem: Practice keys don't exist in CMS

**Solution:**
1. Go to Admin Dashboard → Content Manager
2. Click "Import JSON"
3. Select `docs/seeds/cms_content_seed_vi.json`
4. Preview should show 303 items to import
5. Click "Import" and wait for success message

### Problem: Frontend shows fallback text (not CMS content)

**Solution:**
1. Open browser DevTools → Network tab
2. Check if `POST /api/content/batch` request returns success
3. If returns 404 or error → CMS API might be broken
   - Check backend logs for errors
   - Verify `/api/content/batch` endpoint is working: `curl http://localhost:3000/api/content/batch -X POST`
4. If request succeeds but page still shows fallback → Browser might have cached old data
   - Hard refresh: `Ctrl+Shift+R` (clear cache and reload)

### Problem: EN content doesn't show when switching language

**Solution:**
1. Check if EN seed was imported: Query database with language='en'
2. Check if frontend language switcher actually changes the language:
   - Open DevTools → Application → LocalStorage
   - Look for key `i18nextLng` or `language`
   - Should change when you switch language
3. If language changes but content doesn't:
   - Check if page makes new `POST /api/content/batch` request with new language
   - If not, try hard refresh: `Ctrl+Shift+R`

---

## Success Criteria Checklist

- [ ] Practice tables exist in database (practice_sets, practice_questions, practice_attempts, practice_submissions)
- [ ] `nav.practice` key exists in both VI and EN
- [ ] All 19 practice.* keys exist in VI
- [ ] All 19 practice.* keys exist in EN
- [ ] Frontend page `/practice` loads without errors
- [ ] Heading displays CMS content (not fallback text)
- [ ] Language switcher changes VI ↔ EN content correctly
- [ ] Network request `POST /api/content/batch` returns 200 OK with practice keys
- [ ] No console errors about missing content keys
- [ ] No database errors in Supabase logs

---

## Verification Command (After Seed Import)

Run this in Supabase SQL Editor to confirm everything is ready:

```sql
-- Complete practice CMS readiness check
SELECT 
  'Tables created' as check_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='practice_sets') 
      AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='practice_questions')
      AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='practice_attempts')
      AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='practice_submissions')
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END as status
UNION ALL
SELECT 
  'VI practice.* keys',
  CASE 
    WHEN (SELECT COUNT(*) FROM cms_content WHERE language='vi' AND key LIKE 'practice.%') >= 18 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END
UNION ALL
SELECT 
  'EN practice.* keys',
  CASE 
    WHEN (SELECT COUNT(*) FROM cms_content WHERE language='en' AND key LIKE 'practice.%') >= 18 
    THEN '✅ PASS' 
    ELSE '❌ FAIL' 
  END
UNION ALL
SELECT 
  'nav.practice VI+EN',
  CASE 
    WHEN (SELECT COUNT(*) FROM cms_content WHERE key='nav.practice') = 2
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END;
```

**Expected Output:**
```
check_name                  | status
───────────────────────────┼────────
Tables created              | ✅ PASS
VI practice.* keys          | ✅ PASS
EN practice.* keys          | ✅ PASS
nav.practice VI+EN          | ✅ PASS
```

If all are ✅ PASS → **Ready for production! 🚀**

---

## Final Sign-Off

Once all checks pass:

1. Update `info.md`:
   ```
   - [ ] Practice database setup complete (migrations + CMS seed)
   ```

2. Commit changes:
   ```bash
   git add VERIFICATION_REPORT_2026-06-03.md PRACTICE_CMS_AUDIT_2026-06-03.md
   git commit -m "docs: Practice CMS verification complete - all 26 keys ready"
   git push
   ```

3. Announce to team: "Practice Sets feature is now live on [branch/environment]. Migrations applied, seed data imported, frontend ready."

---

**Questions?** Check backend logs or contact DevOps if migrations failed to apply.
