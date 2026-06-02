# Prompt: Redesign Library Page

## Current Route

- `/library/:language`
- Main file: `src/pages/LibraryPage.tsx`

## Current Goal

Show authenticated learner their curriculum, progress, locked/unlocked lessons, and next lesson.

## Current Problems

- It is closer to a course list than a journey map.
- Locking is not explained enough.
- “Destination” copy is hardcoded by language, not user goal.
- Progress may be affected by `useLessonData` loading bug.

## Redesign Goal

Make Library a “Journey Map” that tells the learner where they are, what they unlocked, and what to do next.

## Required Structure

1. Journey header
- “Bạn đang học: Python Foundations” etc.
- Current streak/points compact.
- Primary CTA: “Tiếp tục bài tiếp theo”.

2. Next step card
- Lesson title.
- Estimated time.
- What learner will do.
- CTA: “Học 5 phút”.

3. Roadmap
- Chapters as milestone cards.
- Current chapter expanded.
- Completed lessons checkmarked.
- Locked lessons with reason.

4. Milestones
- Aha lessons.
- Mini-projects.
- Checkpoints.

## UX Requirements

- Empty curriculum state must be friendly.
- Loading skeleton should preserve layout.
- Explain locked state: “Hoàn thành bài trước để mở khóa.”
- Keep route to `/learn/:language/:lessonId`.

## Technical Note

Before or during redesign, inspect `useLessonData` progress-loading dependencies because completed lesson state may not load reliably after curriculum loads.
