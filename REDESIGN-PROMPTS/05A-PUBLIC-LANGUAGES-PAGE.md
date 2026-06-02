# Prompt: Redesign Public Languages Page

## Current Route

- `/languages`
- Main file: `src/pages/PublicLanguagesPage.tsx`

## Current Goal

Let users explore available learning paths before signing in or choosing a course.

## Current Problems

- Page starts from languages, but beginners usually think in goals.
- Cards are useful but feel like a catalog.
- CTA behavior is okay, but the page does not clearly explain whether user will enter onboarding, auth, or library.
- Dynamic color classes should be avoided unless Tailwind safelists them.

## Redesign Goal

Make this page answer: “Which starting path is right for me?”

## Required Structure

1. Hero
- Headline: “Chọn cách bắt đầu phù hợp với bạn.”
- Subcopy: explain Loopy can recommend a path or user can choose directly.
- Primary CTA: “Làm quiz chọn lộ trình”.
- Secondary CTA: “Xem tất cả ngôn ngữ”.

2. Goal-first cards
- “Mình chưa biết gì” → recommend Python.
- “Mình muốn làm web” → recommend JavaScript.
- “Mình học ở trường” → recommend C++.
- “Mình chỉ muốn thử” → sample lesson.

3. Language cards
- Python: easiest first win, automation/basic logic.
- JavaScript: web interaction, browser-first.
- C++: school/algorithm foundation.

4. How Loopy teaches
- Short loop: mini lesson → run code → fix errors → unlock next lesson.

5. Final CTA
- “Không chắc bắt đầu từ đâu?” → onboarding/auth flow.

## Functional Requirements

- Preserve `api.getLanguages()`.
- Preserve loading/error states.
- Preserve redirect logic for authenticated vs guest users.
- Avoid Tailwind dynamic class names such as `bg-brand-${color}` unless safelisted.

## Mobile Requirements

- Goal cards stack first.
- Language cards should be compact.
- CTA should remain visible without forcing long scrolling.
