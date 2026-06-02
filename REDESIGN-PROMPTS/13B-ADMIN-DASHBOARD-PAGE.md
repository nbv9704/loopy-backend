# Prompt: Redesign Admin Dashboard Page

## Current Route

- `/admin` and `/admin/dashboard`
- Main file: `src/pages/admin/DashboardPage.tsx`

## Current Goal

Show admin overview metrics and shortcuts.

## Current Problems

- Some dashboard areas still feel placeholder-like.
- Metrics should map to current schema and real API responses.
- Admin needs quick operational actions, not marketing-style cards.

## Redesign Goal

Make dashboard a practical command center for content and learner operations.

## Required Structure

1. Header
- Title: “Dashboard”.
- Last updated time.
- Refresh button if supported.

2. Metrics
- Users.
- Languages.
- Chapters.
- Lessons.
- Submissions.
- PvP matches.

3. Quick actions
- Create lesson.
- Bulk import lessons.
- Review submissions if route exists.
- View public site.

4. Operational panels
- Recent submissions or recent content changes if API supports it.
- System warnings/errors if available.
- Empty states if not available.

## Functional Requirements

- Use current `/api/admin-auth/dashboard/stats` response shape.
- Do not query legacy CMS tables.
- Keep admin layout consistent and light.
