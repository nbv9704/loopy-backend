# Prompt: Redesign Admin Bulk Import Page

## Current Route

- `/admin/import`
- Main file: `src/pages/admin/BulkImportPage.tsx`

## Current Goal

Import lesson data in bulk.

## Current Problems

- Bulk import is powerful but risky.
- Admin needs validation, preview, and clear rollback expectations.
- JSON errors should be easy to locate.

## Redesign Goal

Make bulk import a safe three-step operation.

## Required Structure

1. Step 1: Choose target
- Language.
- Chapter.
- Import mode if supported: append/update.

2. Step 2: Add content
- Paste JSON.
- Upload JSON if supported.
- Show sample template.
- Format JSON button if easy to add.

3. Step 3: Validate and preview
- Show lesson count.
- Show warnings/errors per item.
- Confirm import button disabled until valid.

4. Result state
- Imported count.
- Failed count.
- Links to created lessons.

## Functional Requirements

- Preserve existing import API contract.
- Do not silently import invalid items.
- Keep the admin on page after errors so pasted content is not lost.
