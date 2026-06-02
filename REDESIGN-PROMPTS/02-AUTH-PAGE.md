# Prompt: Redesign Auth Page

## Current Route

- `/auth`
- Main file: `src/pages/AuthPage.tsx`

## Current Goal

Login/signup for learner accounts. After login, redirect to intended route if onboarding is complete, otherwise to onboarding.

## Current Problems

- Auth page is functional but generic.
- It does not explain why signing up matters: save progress, continue journey, unlock PvP, keep streak.
- Back button now correctly goes home, but the page still lacks context when user came from `/pvp`, `/playground`, `/sample-lesson`, or `/library`.
- Signup/login toggle is simple but not journey-oriented.

## Redesign Goal

Make auth feel like a continuation of the learning journey, not a wall.

## Required UX

- If `location.state.from` exists, show contextual copy:
- From sample lesson: “Lưu bài học đầu tiên của bạn.”
- From PvP: “Đăng nhập để tham gia thử thách.”
- From library/learn: “Đăng nhập để lưu tiến độ.”
- Otherwise: “Tiếp tục hành trình học code của bạn.”

## Layout Direction

- Two-column desktop layout:
- Left: value/context card with journey progress visual.
- Right: login/signup form.
- Mobile: form first, value proof below.

## Copy Direction

- Login headline: “Chào mừng trở lại.”
- Signup headline: “Tạo tài khoản để lưu hành trình.”
- Benefits:
- Lưu tiến độ bài học.
- Tiếp tục đúng bài đang học.
- Mở khóa streak, điểm, challenge.
- Không paywall cho lộ trình cốt lõi.

## Functional Requirements

- Preserve `from` redirect logic.
- Preserve email/password login/signup.
- Preserve production email confirmation behavior.
- Preserve dev login only in development.
- Back button should navigate home with `replace: true`.

## Error/Loading States

- Make errors more human-readable.
- Loading button should clearly indicate login/signup is in progress.
- Add disabled state to toggle while loading.
