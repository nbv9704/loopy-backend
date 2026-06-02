# Prompt: Redesign Landing Page

## Current Route

- `/`
- Main files:
- `src/pages/LandingPage.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/FeaturesSection.tsx`
- `src/components/landing/HowItWorksSection.tsx`
- `src/components/landing/LanguagesSection.tsx`
- `src/components/landing/CTASection.tsx`

## Current Problem

Landing looks polished but feels generic. It shows features, languages, and AI/PvP-like value, but it does not strongly sell the beginner journey.

Hero copy is not sharp enough. Sections feel like a feature showcase instead of a story. Guest primary CTA goes to sample lesson, which is good, but the page does not clearly say “try the first lesson without signing up”.

## Redesign Goal

Make the landing page instantly communicate:

> Loopy is the easiest way for a beginner to complete their first coding win and continue through a guided path.

## Required Structure

1. Hero
- Headline: “Học lập trình từ số 0, từng bước nhỏ, code ngay trong trình duyệt.”
- Subcopy: explain short lessons, real coding, helpful feedback, free.
- Primary CTA: “Thử bài đầu tiên miễn phí”.
- Secondary CTA: “Tìm lộ trình phù hợp”.
- Add microcopy: “Không cần cài đặt. Không cần thẻ. Bắt đầu trong 2 phút.”

2. Trust/value strip
- Do not fake user numbers.
- Use product truths:
- “Không cần cài môi trường”
- “Bài học nhỏ 2-5 phút”
- “Chạy code thật”
- “Sai có gợi ý sửa”

3. Problem section
- “Người mới thường kẹt ở đâu?”
- Cards: không biết bắt đầu từ đâu, cài đặt rối, lỗi không hiểu, học xong không biết tiếp theo.

4. Loopy solution
- Map each problem to Loopy:
- Goal-based onboarding.
- Guided journey map.
- Editor + terminal.
- AI/helpful feedback.

5. Learning loop section
- Highlight See → Change → Run → Fix → Build.
- This is the product signature.

6. Paths section
- Reframe languages as goals:
- “Mình chưa biết gì” → Python foundations.
- “Mình muốn làm web” → JavaScript.
- “Mình học ở trường” → C++.

7. Sample lesson preview
- Show a mini lesson/editor preview.
- CTA: “Thử bài đầu tiên”.

8. Final CTA
- “Bắt đầu bằng một bài học nhỏ hôm nay.”
- Primary CTA to sample lesson.

## Style Direction

- Keep dark Loopy palette but make layout warmer and more readable.
- Use fewer giant sections and more focused storytelling.
- Visual language: journey map, loop, small wins, mentor guidance.
- Reduce generic “AI platform” feeling.

## Flow Requirements

- Guest primary CTA should go to `/sample-lesson`.
- Logged-in + onboarded user should go to `/library/:language`.
- Logged-in but not onboarded user should go to `/onboarding`.
- Secondary “find path” CTA should go to `/onboarding` if logged in, `/auth` or `/sample-lesson` depending chosen product strategy.

## Things To Fix

- Make hero text not depend only on image banner.
- Remove hard-coded Vietnamese from components or make copy consistently Vietnamese-first.
- Add mobile nav consideration in Header if landing redesign touches navigation.
