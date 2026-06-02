# Prompt: Redesign Admin Area

## Current Routes

- `/admin/login`
- `/admin`
- `/admin/dashboard`
- `/admin/import`
- `/admin/lessons/new`
- `/admin/lessons/:id`

## Current Problem

Admin UI is inconsistent. Layout is light, but pages often use dark/glow consumer styling. Some copy still says Interloop/CMS. Admin needs to be a practical tool, not a marketing page.

## Redesign Goal

Create a utilitarian Loopy Admin console: fast, readable, consistent, low-risk for content operations.

## Global Admin Requirements

- Use consistent light theme.
- No consumer glow/hero effects.
- Fixed sidebar + responsive mobile behavior.
- Header should show route title, breadcrumbs, current admin, logout.
- Sidebar should include Dashboard, Lessons, Chapters, Bulk Import, Submissions, PvP, Settings if available.
- Vietnamese-first or English-first consistently; do not mix randomly.

## Admin Login

- Brand: “Loopy Admin”.
- Clean centered card or two-column layout.
- Security note for remember me.
- Error states readable.
- Link back to main site.

## Dashboard

- Key metrics cards.
- Last updated time.
- Quick actions: create lesson, bulk import, view submissions.
- Recent activity/errors panel instead of “Phase 2” placeholder.

## Bulk Import

- Three-step flow:
- Choose chapter.
- Paste/upload JSON and validate.
- Preview and confirm import.
- Add sample template, JSON formatter, per-item errors.

## Lesson Editor

- Sticky action bar.
- Sections: Basic Info, See, Change, Build, Test Cases, Publishing.
- CodeMirror for code fields.
- Slug auto-generation.
- Validation before save.
- Unsaved changes warning.
- Preview side panel.
- Buttons: Save, Save & Preview, Save & Create Another.
