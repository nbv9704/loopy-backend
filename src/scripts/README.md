# Content Migration Scripts

This directory contains scripts for migrating hardcoded content from the frontend to the database.

## Prerequisites

Before running the migration scripts, you must:

1. **Apply the database schema** by running `backend/database/content-management-schema.sql` in your Supabase SQL Editor
2. **Grant admin privileges** to at least one user by updating the `user_profiles` table

## Scripts

### 1. migrate-content.ts

Extracts hardcoded content from frontend components and populates the database.

**What it migrates:**

- Documentation technologies and links (from `DocsPage.tsx`)
- Landing page features (from `FeaturesSection.tsx`)
- Landing page statistics (from `StatsSection.tsx`)
- Landing page languages (from `LanguagesSection.tsx`)
- How-it-works steps (from `HowItWorksSection.tsx`)
- Navigation items (from `Header.tsx` and `Footer.tsx`)

**Usage:**

```bash
cd backend
npm run migrate:content
```

**Features:**

- Sets `display_order` based on array index
- Sets `status='published'` for all migrated content
- Skips duplicate entries (logs warnings)
- Generates detailed migration report with counts
- Handles errors gracefully

### 2. rollback-content.ts

Deletes all migrated content from the database. Use this if migration fails or you need to start over.

**Usage:**

```bash
cd backend
npm run rollback:content
```

**Warning:** This action cannot be undone! It will delete ALL content from the content management tables.

## Migration Process

### Step 1: Apply Database Schema

1. Open Supabase SQL Editor
2. Copy the contents of `backend/database/content-management-schema.sql`
3. Execute the SQL script
4. Verify all tables were created successfully

### Step 2: Grant Admin Privileges

Update the `user_profiles` table to grant admin access to your user:

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
UPDATE user_profiles
SET is_admin = true
WHERE id = 'YOUR_USER_ID_HERE';
```

To find your user ID:

```sql
SELECT id, email FROM auth.users;
```

### Step 3: Run Migration

```bash
cd backend
npm run migrate:content
```

### Step 4: Verify Migration

Check the migration report in the console output. It should show:

- Number of items migrated for each content type
- Total items migrated
- Any errors or warnings

You can also verify in Supabase:

```sql
-- Check documentation technologies
SELECT COUNT(*) FROM documentation_technologies;

-- Check documentation links
SELECT COUNT(*) FROM documentation_links;

-- Check landing features
SELECT COUNT(*) FROM landing_features;

-- Check landing stats
SELECT COUNT(*) FROM landing_stats;

-- Check landing languages
SELECT COUNT(*) FROM landing_languages;

-- Check how-it-works steps
SELECT COUNT(*) FROM landing_how_it_works;

-- Check navigation items
SELECT COUNT(*) FROM navigation_items;
```

## Troubleshooting

### Migration fails with "relation does not exist"

The database schema hasn't been applied. Run the SQL script in Supabase SQL Editor first.

### Migration fails with "duplicate key value"

Content already exists in the database. Either:

- Run `npm run rollback:content` to delete existing content
- Or manually delete specific duplicate entries

### Migration completes but some items are skipped

Check the migration report for warnings. Duplicate entries are automatically skipped and logged.

## Expected Results

After successful migration, you should have:

- **27 documentation technologies** (HTML5, CSS3, JavaScript, TypeScript, Python, C++, React, Next.js, Node.js, Vite, CRA, Redux, Context API, Zustand, React Router, Formik, Yup, Axios, Fetch API, Tailwind CSS, CSS Modules, Styled Components, Jest, React Testing Library, Git)
- **~100+ documentation links** (varies by technology)
- **6 landing features**
- **3 landing stats**
- **3 landing languages**
- **3 how-it-works steps**
- **6 navigation items** (3 header + 3 footer)

## Rollback

If you need to undo the migration:

```bash
cd backend
npm run rollback:content
```

This will delete all content from the content management tables. You can then re-run the migration if needed.
