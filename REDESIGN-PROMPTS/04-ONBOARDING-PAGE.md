# Prompt: Redesign Onboarding Page

## Current Route

- `/onboarding`
- Main file: `src/pages/OnboardingPage.tsx`

## Current Goal

User chooses learning goal and experience level, then Loopy saves profile and sends user to a language library.

## Current Problems

- Good concept, but it feels like selecting cards rather than building a journey.
- No preview of what path will look like.
- User does not see first lesson, first milestone, or why a language was recommended.
- API failure may still navigate forward.

## Redesign Goal

Make onboarding a “Journey Builder” that gives confidence: Loopy chooses a starting path for the learner.

## Required Flow

1. Goal step
- Question: “Bạn muốn Loopy giúp bạn đạt điều gì trước?”
- Options:
- “Mình chưa biết gì cả”
- “Mình muốn làm website”
- “Mình học để phục vụ môn học”
- “Mình chỉ muốn thử xem code có hợp mình không”

2. Experience step
- Question: “Bạn đang ở vạch xuất phát nào?”
- Options should be simple and reassuring.

3. Preview step
- Show recommended path:
- Language.
- First lesson.
- First milestone.
- Estimated first session: “5 phút”.
- CTA: “Bắt đầu hành trình”.

## UX Requirements

- Show progress: 1/3, 2/3, 3/3.
- User can go back.
- Do not auto-submit immediately on option click unless interaction feels intentional.
- Loading state: “Đang tạo lộ trình cho bạn...”.
- Error state should not navigate forward if save fails.

## Visual Direction

- Journey map, compass, path cards.
- Warm mentor tone.
- Less form-like, more guided.
