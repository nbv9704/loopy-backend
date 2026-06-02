# Prompt: Redesign Sample Lesson Page

## Current Route

- `/sample-lesson`
- Main file: `src/pages/SampleLessonPage.tsx`

## Current Goal

Guest can try a real mini lesson without login. After changing/running code successfully, a success modal asks them to sign up and continue.

## Current Problems

- Completion logic is too loose: if user changes starter code and length > 5, it counts as completed.
- It runs code but does not use real lesson validation/checking.
- The experience is close to core Loopy, but it lacks the signature See → Change → Run → Fix → Build loop.
- Header is minimal and not consistent with main Header.
- Success modal is useful but could better connect to “save this first win”.

## Redesign Goal

Turn sample lesson into the strongest proof of Loopy: a guest completes one tiny coding win in under 2 minutes.

## Required Structure

1. Top bar
- Logo.
- “Bài học thử - không cần đăng nhập”.
- CTA login/signup.

2. Left guide panel
- Step indicator: See → Change → Run → Win.
- Very short instructions.
- Mission card.
- Reassurance: “Sai cũng được, cứ chạy thử.”

3. Right coding area
- Code editor.
- Terminal output.
- Primary CTA: “Chạy thử”.
- Optional secondary: “Gợi ý”.

4. Success state
- Celebrate first win.
- Explain what was learned.
- CTA: “Lưu tiến độ và học tiếp”.
- Secondary: “Thử lại”.

## Functional Requirements

- Keep `api.getSampleLesson()`.
- Keep `api.executeCode()` unless backend validation is added later.
- Preserve redirect to `/auth` with `from: /library/:language` after success.
- Add clearer failure output and retry guidance.

## Future Improvement Note

If backend supports public sample lesson validation later, use `checkLesson` or a dedicated public check endpoint instead of loose changed-code detection.
