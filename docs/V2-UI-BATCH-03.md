# V2 UI Batch 03: Onboarding, Profile, Goals, Notifications

Batch này đọc các capture logged-in/profile/onboarding để làm nền cho `/v2/profile` và các trang account/onboarding sau này. Không copy mascot, exact copy, asset hoặc class của Coddy.

## Files Read
- `references/captured/2026-05-26T18-15-59-131Z-coddy-tech-onboard-lang-javascript.html`
  - URL: `https://coddy.tech/onboard?lang=JavaScript`
  - Title: `Coddy - Code Makes Perfect`
  - Template: onboarding first step.
- `references/captured/2026-05-26T18-17-51-163Z-coddy-tech-profile.html`
  - URL: `https://coddy.tech/profile`
  - Title: `Coddy - My Profile`
  - Template: profile/account.
- `references/captured/2026-05-26T18-17-28-595Z-coddy-tech-goals.html`
  - URL: `https://coddy.tech/goals`
  - Title: `Coddy - Goals`
  - Template: goals/daily challenges.
- `references/captured/2026-05-26T18-18-00-348Z-coddy-tech-notifications.html`
  - URL: `https://coddy.tech/notifications`
  - Title: `My Notifications - Coddy`
  - Template: notifications center.

## Shared Logged-In App Shell
Observed structure:
- App shell differs from public shell.
- Side navigation appears with icon-only or compact nav.
- Top bar contains journey/language status and stats.
- Content sits in central panels/cards.
- Theme is dark app-like, with surfaces and stats widgets.

Class/component families seen:
- `Layout_*`
- `ExploreWrapper_*`
- `ExploreSideBar_*`
- `ExploreTopBar_*`
- `Stats_*`

Loopy adaptation:
- Keep v2 sandbox public for now, but profile preview should show how logged-in app shell might look.
- Do not replace production settings/profile yet.
- Use Loopy concepts: current journey, completed lessons, streak, points, next action, saved progress.
- Avoid fake public social proof. Mock personal stats are fine if clearly sandbox/sample.

## Onboarding Capture
Observed:
- Full-screen onboarding questionnaire.
- Conversational welcome style with character/assistant.
- URL can be language-intent aware, e.g. `?lang=JavaScript`.
- First step focuses on greeting and guiding user through choices.

Loopy adaptation:
- Onboarding v2 should preserve Loopy rule: do not navigate forward if save profile fails.
- Better direction: compact “Journey Builder” with clear choices and preview of resulting path.
- Avoid copying mascot Bit.
- Could become `/v2/onboarding` later.

## Profile Capture
Observed:
- Logged-in app shell with sidebar and top stats.
- Profile/account page is part of app dashboard, not public marketing page.
- Likely combines avatar/account identity with progress/stats.

Loopy adaptation:
- `/v2/profile` should show:
  - learner card/avatar placeholder.
  - current journey and next lesson.
  - progress/streak/points as personal stats.
  - recent completed lessons.
  - account/preferences quick links.
- Important: keep progress copy honest. “Saved after completeLesson” should remain explicit.

## Goals Capture
Observed:
- Logged-in shell and top stats reused.
- Goals/daily challenges route is focused on habits and daily targets.

Loopy adaptation:
- Do not over-prioritize habit gamification over guided learning.
- Profile page can include a small “today’s goal” card as support, not main product promise.
- Avoid fabricated leaderboards or competitive claims.

## Notifications Capture
Observed:
- Logged-in shell and top stats reused.
- Notifications center is secondary account utility.

Loopy adaptation:
- Not a standalone v2 priority.
- Profile page can include a small notification/activity feed showing product events:
  - progress saved.
  - next lesson unlocked.
  - reminder to continue journey.

## Route Decision
Next implementation route:
- `/v2/profile`

Why:
- It uses the logged-in shell captures without needing real account wiring.
- It completes a natural user view after Journey/Learn/Playground/Docs.
- It can reinforce product rules around saved progress and next action.

Later possible routes:
- `/v2/onboarding`
- `/v2/goals`
- `/v2/notifications`

## V2 Profile Requirements
- Public sandbox route `/v2/profile`, not replacing production settings.
- Static mock data first.
- Use a v2 app-style shell or app-like layout inside public shell.
- Include:
  - profile header.
  - current journey card.
  - stats cards.
  - today goal card.
  - recent activity/progress feed.
  - CTA to `/v2/library` and `/v2/learn`.
- Make clear this is sample personal data.

## Do Not Copy
- Coddy mascot/Bit.
- Coddy exact sidebar icons/assets.
- Social ranking/leaderboard claims.
- Any certificate/account claims that Loopy does not support.
