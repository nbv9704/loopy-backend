# Prompt: Redesign Public Language Detail Page

## Current Route

- `/languages/:language`
- Main file: `src/pages/PublicLanguageDetailPage.tsx`

## Current Goal

Show a public preview of one language path and let the user start that path.

## Current Problems

- Detail page is informative but can feel like marketing instead of a concrete roadmap.
- Curriculum preview should be framed around beginner milestones.
- CTA copy should make the next step explicit.
- If data is missing, fallback states should feel intentional, not broken.

## Redesign Goal

Make each language page feel like a starter roadmap with a visible first win.

## Required Structure

1. Hero
- Language name and icon.
- “Best for” learner type.
- First win example.
- Primary CTA: “Bắt đầu lộ trình này”.
- Secondary CTA: “Thử bài mẫu”.

2. Path fit section
- Who should choose this path.
- Who should choose another path.
- Link back to `/languages` or onboarding quiz.

3. First session preview
- First lesson title.
- What user will type/change.
- What output they will see.
- Estimated time.

4. Roadmap preview
- Chapters as milestone cards.
- First 3 lessons expanded.
- Locked/future items explained as progression.

5. Reassurance section
- No installation.
- Browser editor.
- Errors explained.
- Progress saved after login.

## Functional Requirements

- Preserve `api.getCurriculum(language)`.
- Preserve existing path start redirect behavior.
- Handle invalid language with a friendly “path not found” screen.
- Avoid fake career promises or salary claims.
