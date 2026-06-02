# Prompt: Redesign Public Languages Pages

## Current Routes

- `/languages`
- `/languages/:language`
- Main files:
- `src/pages/PublicLanguagesPage.tsx`
- `src/pages/PublicLanguageDetailPage.tsx`

## Current Goal

Let guest/user explore languages and curriculum before entering authenticated learning flow.

## Current Problems

- Starts with “which language?” but Loopy strategy says beginner should often choose a goal first.
- Language detail pages are marketing-heavy and sometimes career-heavy.
- Dynamic Tailwind classes like `bg-brand-${info.color}` may not compile reliably unless safelisted.
- Curriculum preview is useful but not framed as beginner milestones.
- CTA redirects correctly, but copy does not explain login/onboarding requirements.

## Redesign Goal

Reframe language pages as “paths by goal”, not just language catalog.

## `/languages` Required Structure

1. Header: “Bạn muốn bắt đầu theo cách nào?”
2. Goal cards first:
- Start from zero.
- Build web.
- School/algorithm path.
3. Language cards second:
- Python, JavaScript, C++.
4. CTA: “Không chắc? Làm quiz chọn lộ trình”.

## `/languages/:language` Required Structure

1. Hero
- Language name.
- Who this path is for.
- What first win looks like.
2. Roadmap preview
- Chapters as milestones.
- First 3 lessons.
- Aha moment.
3. Beginner reassurance
- “Không cần cài đặt.”
- “Học bằng bài nhỏ.”
- “Code chạy trong trình duyệt.”
4. CTA
- “Bắt đầu lộ trình này.”

## Functional Requirements

- Preserve API calls:
- `api.getLanguages()`.
- `api.getCurriculum(language)`.
- Preserve login/onboarding redirect logic.
- Avoid dynamic class names that Tailwind cannot detect.
