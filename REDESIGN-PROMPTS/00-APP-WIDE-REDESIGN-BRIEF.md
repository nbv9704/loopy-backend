# App-wide Redesign Brief

## Product Direction

Redesign Loopy as a “Guided Coding Journey” for absolute beginners, not as a generic coding platform with many unrelated features.

The app should feel like a friendly mentor helping a new learner take the next small step:

- Choose a goal.
- See a clear path.
- Complete one tiny coding win.
- Run code in the browser.
- Understand mistakes.
- Continue with confidence.

## Inspiration

Learn from:

- Mimo: short lessons, friendly onboarding, step-by-step guidance, clear Learn-Practice-Build structure.
- Codecademy: goal-based paths, progress-oriented learning, clean subject/course selection.
- freeCodeCamp: clarity, trust, “free” promise, practical curriculum, outcome-first copy.

Do not copy their UI. Use these patterns to make Loopy clearer and more motivating.

## Loopy Positioning

Primary message:

> Học lập trình từ số 0, từng bước nhỏ, code ngay trong trình duyệt.

Supporting message:

> Loopy dẫn bạn qua bài học ngắn, thử thách vừa sức và phản hồi dễ hiểu để bạn không bị ngợp trong 20 giờ đầu tiên.

## Design Principles

- Beginner-first: every page must answer “What should I do next?”
- One primary CTA per screen.
- Reduce generic feature marketing; show the learning journey.
- Make progress visible: current step, next step, milestone, unlock.
- Use warm, reassuring copy instead of “pro developer” language too early.
- Keep dark teal/cyan Loopy identity for learner-facing pages.
- Admin pages should use a practical light console style, not consumer glow styling.
- PvP should be secondary challenge mode, not the core product promise.
- Playground should support Learn, not compete with Learn.

## Shared UI Improvements

- Add mobile navigation to Header.
- Make all landing copy i18n-ready or choose Vietnamese-first consistently.
- Reduce oversized glow sections where they hurt readability.
- Prefer compact cards, progress bars, roadmap visuals, sticky CTA areas.
- Add clear empty/error/loading states for all API-dependent pages.
- Avoid fake social proof numbers unless real.
- Use “free” as a trust promise, not the only differentiator.

## Technical Constraints

- React + TypeScript + Vite + Tailwind.
- Preserve existing API contracts unless explicitly changing backend.
- Keep `credentials: include` auth flow.
- Do not add new paid services or image dependencies.
- Prefer component reuse where it makes the journey clearer.
- Ensure desktop and mobile layouts are both first-class.
