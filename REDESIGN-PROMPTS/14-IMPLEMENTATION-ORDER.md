# Suggested Redesign Implementation Order

## Phase 1: Fix Product Story

1. Landing page.
2. Sample lesson.
3. Auth page contextual messaging.
4. Onboarding Journey Builder.

Reason: these decide whether a new user understands and enters the product.

## Phase 2: Fix Core Learning Journey

1. Library as Journey Map.
2. LearnPage/LessonViewer guided loop.
3. Playground as Loopy Lab.
4. Settings as Learning Profile.

Reason: these are the actual learning experience and should be most polished.

## Phase 3: Secondary Features

1. PvP Lobby.
2. PvP Match.
3. Docs page.

Reason: useful, but should support learning rather than distract from it.

## Phase 4: Admin Console

1. Admin layout/theme.
2. Admin dashboard.
3. Lesson editor.
4. Bulk import.
5. Admin login polish.

Reason: admin needs consistency and safety, but learner experience should come first unless content authoring is currently blocking.

## Important Technical Fixes To Consider During Redesign

- Inspect `useLessonData` progress loading; progress may not load after curriculum because it relies on a ref that does not trigger effect rerun.
- Ensure mobile Header has navigation.
- Avoid dynamic Tailwind class names like `bg-brand-${color}` unless safelisted.
- Keep API contracts stable unless backend changes are planned.
- Run `yarn lint:strict && yarn build` after each page group.
