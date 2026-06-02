# Prompt: Redesign Admin Lesson Editor Page

## Current Routes

- `/admin/lessons/new`
- `/admin/lessons/:id`
- Main file: `src/pages/admin/LessonEditorPage.tsx`

## Current Goal

Create and edit lessons, code starter, tests, hints, and publishing data.

## Current Problems

- Lesson authoring has many fields and needs clearer structure.
- Admin should understand how learner-facing See → Change → Run → Fix → Build maps to fields.
- Test case editing must be safer and more readable.
- Needs unsaved-change protection.

## Redesign Goal

Make Lesson Editor a structured authoring workflow for Loopy’s guided lesson model.

## Required Structure

1. Sticky top bar
- Lesson title or “New lesson”.
- Status: draft/published if supported.
- Save.
- Save & preview.
- Back.

2. Basic info
- Language.
- Chapter.
- Slug.
- Title.
- Difficulty/order.

3. Learner journey sections
- See: explanation and example.
- Change: task description.
- Run: starter code and expected output.
- Fix: hints/common mistakes.
- Build: success criteria.

4. Tests
- Add/remove test case.
- Mark hidden/visible if supported.
- Validate test input/output format.

5. Preview
- Side panel or tab showing how lesson appears to learner.

## Functional Requirements

- Preserve current lesson create/update API.
- Preserve CodeMirror/editor usage if present.
- Add validation before save.
- Warn before leaving with unsaved changes.
