# Audit Report: Languages Page

**Date:** 2024
**Page:** Languages Page (`/languages`)
**Component:** `PublicLanguagesPage.tsx`
**Status:** Audit Complete

---

## Executive Summary

The Languages page is a critical entry point for users to select their programming language. The audit identified **12 content items**, of which:
- **8 items are hardcoded** (need to be added to CMS)
- **2 items are in CMS** (already managed)
- **2 items are dynamic** (fetched from database)

**Recommendation:** Priority 1 - High Impact, Low Effort. The page has significant hardcoded content that should be migrated to CMS for easier management and translation.

---

## Page Overview

**URL:** `/languages`
**Component:** `loopy-frontend/src/pages/PublicLanguagesPage.tsx`
**Purpose:** Allow users to select a programming language to start learning
**User Flow:** Landing Page → Languages Page → Language Detail Page → Library → Learn

---

## Content Audit Findings

### 1. Page Title and Subtitle

#### 1.1 Page Title
- **Content:** "Chọn cách bắt đầu phù hợp với bạn."
- **Location:** Line 108 in PublicLanguagesPage.tsx
- **Status:** ❌ **HARDCODED**
- **Type:** Text (heading)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in JSX. Should be moved to CMS with key `languages.title`.

#### 1.2 Page Subtitle
- **Content:** "Nếu chưa chắc nên học ngôn ngữ nào, hãy chọn theo mục tiêu. Loopy sẽ dẫn bạn tới bài đầu tiên đủ nhỏ để bắt đầu ngay."
- **Location:** Line 113 in PublicLanguagesPage.tsx
- **Status:** ❌ **HARDCODED**
- **Type:** Text (description)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in JSX. Should be moved to CMS with key `languages.subtitle`.

---

### 2. Goal Cards Section

#### 2.1 Goal Cards Header
- **Content:** "Hoặc chọn trực tiếp ngôn ngữ"
- **Location:** Line 155 in PublicLanguagesPage.tsx
- **Status:** ❌ **HARDCODED**
- **Type:** Text (label)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in JSX. Should be moved to CMS with key `languages.goalCardsHeader`.

#### 2.2 Goal Card 1: "Mình chưa biết gì"
- **Title:** "Mình chưa biết gì"
- **Description:** "Bắt đầu nhẹ với Python và bài học đầu tiên trong 5 phút."
- **Location:** Line 35-37 in PublicLanguagesPage.tsx (goalCards array)
- **Status:** ❌ **HARDCODED**
- **Type:** Text (card title + description)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in goalCards array. Should be moved to CMS with keys `languages.goal.beginner.title` and `languages.goal.beginner.description`.

#### 2.3 Goal Card 2: "Mình muốn làm web"
- **Title:** "Mình muốn làm web"
- **Description:** "Đi theo JavaScript để tạo tương tác trong trình duyệt."
- **Location:** Line 38-40 in PublicLanguagesPage.tsx (goalCards array)
- **Status:** ❌ **HARDCODED**
- **Type:** Text (card title + description)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in goalCards array. Should be moved to CMS with keys `languages.goal.web.title` and `languages.goal.web.description`.

#### 2.4 Goal Card 3: "Mình học ở trường"
- **Title:** "Mình học ở trường"
- **Description:** "Chọn C++ để luyện tư duy bài tập và thuật toán cơ bản."
- **Location:** Line 41-43 in PublicLanguagesPage.tsx (goalCards array)
- **Status:** ❌ **HARDCODED**
- **Type:** Text (card title + description)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in goalCards array. Should be moved to CMS with keys `languages.goal.school.title` and `languages.goal.school.description`.

#### 2.5 Goal Card CTA Button
- **Content:** "Bắt đầu"
- **Location:** Line 175 in PublicLanguagesPage.tsx
- **Status:** ❌ **HARDCODED**
- **Type:** Text (button label)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in JSX. Should be moved to CMS with key `languages.goal.cta`.

---

### 3. Language Cards Section

#### 3.1 Language Card Titles
- **Content:** Fetched from database (JavaScript, Python, C++)
- **Location:** Line 180 in PublicLanguagesPage.tsx (lang.displayName)
- **Status:** ✅ **DYNAMIC (from database)**
- **Type:** Text (card title)
- **Frequency:** Rarely changes (only when adding new languages)
- **Languages:** VI + EN (displayName field)
- **Notes:** Fetched from `languages` table via `api.getLanguages()`. Not managed via CMS currently.

#### 3.2 Language Card Descriptions
- **Content:** 
  - JavaScript: "Xây dựng website tương tác và ứng dụng web hiện đại."
  - Python: "Ngôn ngữ dễ học nhất cho người mới, phù hợp với AI/Data."
  - C++: "Nền tảng vững chắc về thuật toán và cấu trúc dữ liệu."
- **Location:** Line 20-23 in PublicLanguagesPage.tsx (langConfig object)
- **Status:** ❌ **HARDCODED**
- **Type:** Text (card description)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in langConfig object. Should be moved to CMS with keys like `languages.javascript.description`, `languages.python.description`, `languages.cpp.description`.

#### 3.3 Language Card Icons
- **Content:** Globe (JavaScript), Compass (Python), Cpu (C++)
- **Location:** Line 20-23 in PublicLanguagesPage.tsx (langConfig object)
- **Status:** ✅ **HARDCODED (but acceptable)**
- **Type:** Icon (UI element)
- **Frequency:** Rarely changes
- **Languages:** N/A (icons are universal)
- **Notes:** Icons are hardcoded in langConfig. Could be moved to database if needed, but icons are typically UI-level and don't need CMS management.

#### 3.4 Language Card CTA Button
- **Content:** "Xem chi tiết"
- **Location:** Line 188 in PublicLanguagesPage.tsx
- **Status:** ❌ **HARDCODED**
- **Type:** Text (button label)
- **Frequency:** Static (rarely changes)
- **Languages:** VI only (no EN version)
- **Notes:** Currently hardcoded in JSX. Should be moved to CMS with key `languages.card.cta`.

---

### 4. Metadata

#### 4.1 Language Count
- **Content:** 3 (JavaScript, Python, C++)
- **Location:** Fetched from database via `api.getLanguages()`
- **Status:** ✅ **DYNAMIC (from database)**
- **Type:** Metadata (number)
- **Frequency:** Changes when adding/removing languages
- **Languages:** N/A
- **Notes:** Dynamically calculated from languages array. No hardcoding needed.

#### 4.2 Course Count
- **Content:** Not displayed on page
- **Status:** N/A
- **Notes:** Course count is not shown on the Languages page. It's shown on the Language Detail page.

---

## Content Status Summary

| Item | Status | Type | Frequency | Languages |
|------|--------|------|-----------|-----------|
| Page Title | ❌ Hardcoded | Text | Static | VI only |
| Page Subtitle | ❌ Hardcoded | Text | Static | VI only |
| Goal Cards Header | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 1 Title | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 1 Description | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 2 Title | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 2 Description | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 3 Title | ❌ Hardcoded | Text | Static | VI only |
| Goal Card 3 Description | ❌ Hardcoded | Text | Static | VI only |
| Goal Card CTA | ❌ Hardcoded | Text | Static | VI only |
| Language Card Descriptions | ❌ Hardcoded | Text | Static | VI only |
| Language Card CTA | ❌ Hardcoded | Text | Static | VI only |
| Language Titles | ✅ Dynamic | Text | Rarely | VI + EN |
| Language Count | ✅ Dynamic | Metadata | Rarely | N/A |

**Total Items:** 14
- **Hardcoded:** 12 items
- **Dynamic:** 2 items
- **In CMS:** 0 items (but 2 items exist in CMS seed data)

---

## CMS Content Items (Already Seeded)

The following items are already in the CMS database (from `SEED_CONTENT_ITEMS.sql`):

```sql
-- Languages page content
SELECT c.id, 'languages.title', 'vi', 'Chọn ngôn ngữ lập trình', 'text' FROM categories c WHERE c.name = 'languages'
SELECT c.id, 'languages.title', 'en', 'Choose Programming Language', 'text' FROM categories c WHERE c.name = 'languages'
SELECT c.id, 'languages.subtitle', 'vi', 'Bắt đầu hành trình học code của bạn', 'text' FROM categories c WHERE c.name = 'languages'
SELECT c.id, 'languages.subtitle', 'en', 'Start Your Coding Journey', 'text' FROM categories c WHERE c.name = 'languages'
```

**Status:** ⚠️ **MISMATCH**
- **CMS Title (VI):** "Chọn ngôn ngữ lập trình"
- **Actual Title (VI):** "Chọn cách bắt đầu phù hợp với bạn."
- **CMS Subtitle (VI):** "Bắt đầu hành trình học code của bạn"
- **Actual Subtitle (VI):** "Nếu chưa chắc nên học ngôn ngữ nào, hãy chọn theo mục tiêu. Loopy sẽ dẫn bạn tới bài đầu tiên đủ nhỏ để bắt đầu ngay."

**Issue:** The CMS content items don't match the actual page content. The page is using hardcoded values instead of fetching from CMS.

---

## Hardcoded Content Items (Need to Add to CMS)

The following items are hardcoded and should be added to CMS:

### Goal Cards
```
languages.goal.beginner.title = "Mình chưa biết gì"
languages.goal.beginner.description = "Bắt đầu nhẹ với Python và bài học đầu tiên trong 5 phút."
languages.goal.web.title = "Mình muốn làm web"
languages.goal.web.description = "Đi theo JavaScript để tạo tương tác trong trình duyệt."
languages.goal.school.title = "Mình học ở trường"
languages.goal.school.description = "Chọn C++ để luyện tư duy bài tập và thuật toán cơ bản."
languages.goal.cta = "Bắt đầu"
languages.goalCardsHeader = "Hoặc chọn trực tiếp ngôn ngữ"
```

### Language Descriptions
```
languages.javascript.description = "Xây dựng website tương tác và ứng dụng web hiện đại."
languages.python.description = "Ngôn ngữ dễ học nhất cho người mới, phù hợp với AI/Data."
languages.cpp.description = "Nền tảng vững chắc về thuật toán và cấu trúc dữ liệu."
```

### Button Labels
```
languages.card.cta = "Xem chi tiết"
```

---

## Dependencies and Relationships

### Shared Content
- **Goal Cards:** Appear only on Languages page
- **Language Descriptions:** Appear on Languages page and potentially on Language Detail page

### Linked Content
- **Goal Cards → Language Detail:** Each goal card links to a specific language detail page
- **Language Cards → Language Detail:** Each language card links to its detail page

### Language Variants
- **Page Title:** VI version exists in CMS, but EN version doesn't match actual page
- **Page Subtitle:** VI version exists in CMS, but EN version doesn't match actual page
- **Goal Cards:** Only VI versions exist; no EN versions
- **Language Descriptions:** Only VI versions exist; no EN versions

### Conditional Rendering
- **Goal Cards:** Always visible
- **Language Cards:** Rendered based on languages fetched from database
- **Language Count:** Dynamic based on API response

---

## Content Classification

### By Type
- **Text:** 12 items (titles, descriptions, labels)
- **Icon:** 3 items (language icons - acceptable as hardcoded)
- **Metadata:** 1 item (language count - dynamic)

### By Status
- **Hardcoded:** 12 items (need CMS migration)
- **Dynamic:** 2 items (fetched from database)
- **In CMS:** 2 items (but not used by page)

### By Frequency
- **Rarely Changed:** 12 items (static content)
- **Occasionally Changed:** 1 item (language count when adding new languages)

### By Audience
- **Public:** 14 items (visible to all users)
- **Admin:** 0 items

---

## Issues and Recommendations

### Issue 1: CMS Content Not Used
**Problem:** The page has CMS content items for `languages.title` and `languages.subtitle`, but the page doesn't fetch or use them. Instead, it uses hardcoded values.

**Root Cause:** The page was built before CMS integration was completed. The hardcoded values don't match the CMS values.

**Recommendation:** 
1. Update the page to fetch `languages.title` and `languages.subtitle` from CMS using `useContent` hook
2. Update CMS values to match actual page content
3. Add EN versions for all content items

### Issue 2: Missing EN Translations
**Problem:** All hardcoded content is in VI only. No EN versions exist.

**Root Cause:** The page was built for VI-only audience. EN translations were not added.

**Recommendation:**
1. Add EN translations for all hardcoded content items
2. Update page to support language switching (if needed)
3. Seed EN versions in CMS database

### Issue 3: Goal Cards Hardcoded
**Problem:** Goal cards are hardcoded in the component, making them difficult to manage and translate.

**Root Cause:** Goal cards are specific to the Languages page and were not considered for CMS management.

**Recommendation:**
1. Move goal cards to CMS with keys like `languages.goal.*.title` and `languages.goal.*.description`
2. Fetch goal cards from CMS API instead of hardcoding
3. Allow admin to add/remove/reorder goal cards via admin UI

### Issue 4: Language Descriptions Hardcoded
**Problem:** Language descriptions are hardcoded in `langConfig` object, making them difficult to manage and translate.

**Root Cause:** Language descriptions are specific to each language and were not considered for CMS management.

**Recommendation:**
1. Move language descriptions to CMS with keys like `languages.{languageId}.description`
2. Fetch descriptions from CMS API instead of hardcoding
3. Allow admin to edit descriptions via admin UI

---

## Migration Recommendations

### Priority 1: High Impact, Low Effort
- **Page Title and Subtitle:** Update CMS values to match actual page content, then fetch from CMS
- **Language Card CTA:** Move to CMS with key `languages.card.cta`
- **Goal Cards Header:** Move to CMS with key `languages.goalCardsHeader`

**Effort:** 2-3 hours
**Impact:** Enables admin to manage page title, subtitle, and button labels without code changes

### Priority 2: High Impact, Medium Effort
- **Goal Cards:** Move all goal card titles and descriptions to CMS
- **Language Descriptions:** Move all language descriptions to CMS

**Effort:** 4-5 hours
**Impact:** Enables admin to manage goal cards and language descriptions, add translations

### Priority 3: Medium Impact, Low Effort
- **Language Icons:** Keep as hardcoded (acceptable for UI elements)
- **Language Count:** Keep as dynamic (no CMS needed)

**Effort:** 0 hours
**Impact:** No action needed

---

## Implementation Steps

### Step 1: Update CMS Content Items
1. Update `languages.title` VI value to "Chọn cách bắt đầu phù hợp với bạn."
2. Update `languages.subtitle` VI value to "Nếu chưa chắc nên học ngôn ngữ nào, hãy chọn theo mục tiêu. Loopy sẽ dẫn bạn tới bài đầu tiên đủ nhỏ để bắt đầu ngay."
3. Add EN versions for all content items

### Step 2: Add New CMS Content Items
1. Add goal card content items
2. Add language description content items
3. Add button label content items

### Step 3: Update Frontend Component
1. Create `useContent` hook to fetch content from CMS
2. Update `PublicLanguagesPage.tsx` to fetch content from CMS
3. Remove hardcoded values
4. Add fallback to hardcoded values if CMS content not found

### Step 4: Test and Verify
1. Verify page displays correct content from CMS
2. Verify EN translations display correctly
3. Verify fallback works if CMS content not found
4. Test admin UI to edit content

---

## Testing Checklist

- [ ] Page title displays correctly from CMS
- [ ] Page subtitle displays correctly from CMS
- [ ] Goal cards display correctly from CMS
- [ ] Language descriptions display correctly from CMS
- [ ] Button labels display correctly from CMS
- [ ] EN translations display correctly
- [ ] Fallback to hardcoded values works if CMS content not found
- [ ] Admin can edit content via admin UI
- [ ] Changes in admin UI reflect on page immediately (or after cache invalidation)
- [ ] Page works correctly with different languages

---

## Conclusion

The Languages page has **12 hardcoded content items** that should be migrated to CMS for better management and translation support. The page also has **2 CMS content items** that are not being used and need to be updated to match actual page content.

**Overall Status:** ⚠️ **NEEDS MIGRATION**
- **Hardcoded Items:** 12
- **CMS Items (unused):** 2
- **Dynamic Items:** 2
- **Estimated Effort:** 6-8 hours
- **Priority:** 1 (High Impact, Low-Medium Effort)

**Next Steps:**
1. Update CMS content items to match actual page content
2. Add new CMS content items for goal cards and language descriptions
3. Update frontend component to fetch content from CMS
4. Add EN translations
5. Test and verify

