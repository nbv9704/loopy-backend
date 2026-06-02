# Prompt: Redesign Learn Page / Lesson Viewer

## Current Route

- `/learn/:language/*`
- Main files:
- `src/pages/LearnPage.tsx`
- `src/components/learn/LessonViewer.tsx`
- `src/components/learn/LessonSidebar.tsx`
- `src/components/common/CodeEditor.tsx`
- `src/components/common/Terminal.tsx`

## Current Goal

Core learning experience: read lesson, edit code, run code, check answer, get hints, complete lesson, move to next lesson.

## Current Problems

- See → Change → Run → Fix → Build exists but feels like a status indicator, not the actual guided flow.
- User may not understand why “Check bài” is hidden until code changes.
- Lesson guide can lose context when switching from theory to task.
- Terminal/grading may require scrolling.
- AI hint is not integrated as a mentor panel.
- Sidebar is hidden by default, reducing journey awareness.

## Redesign Goal

Make LearnPage the signature Loopy experience: a guided coding loop with one tiny win per lesson.

## Required Structure

1. Top context bar
- Back to journey.
- Current chapter/lesson.
- Step progress.
- Streak/points compact.

2. Main layout desktop
- Left: instruction/mentor panel.
- Center/right: code editor.
- Bottom/right: terminal + check result.
- Sidebar roadmap as collapsible mini-map.

3. Step flow
- See: show example and expected idea.
- Change: tell user exactly what to modify.
- Run: primary CTA “Chạy thử”.
- Fix: show beginner-friendly error help.
- Build: submit/check and complete.

4. Pass state
- “Bạn vừa học được gì?”
- Unlock next lesson.
- CTA: “Bài tiếp theo”.
- Secondary: “Thử thêm trong Playground”.

## Functional Requirements

- Preserve APIs:
- `api.executeCode()`.
- `api.checkLesson()`.
- `api.completeLesson()`.
- `api.getAIHint()`.
- Preserve keyboard shortcuts.
- Preserve open-in-playground flow.

## Copy Tone

- Use short sentences.
- Avoid expert jargon.
- Reward attempts, not only success.
