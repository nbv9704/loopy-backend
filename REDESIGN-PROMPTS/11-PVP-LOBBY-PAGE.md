# Prompt: Redesign PvP Lobby

## Current Route

- `/pvp`
- Main file: `src/pages/PvPLobbyPage.tsx`

## Current Goal

Entry to PvP challenge mode: quick match, difficulty, room code join.

## Current Problems

- PvP feels like a primary product pillar, but it should be secondary to learning.
- Gate for `points === 0` is only a message; CTAs still appear usable.
- Disabled Battle Royale takes too much visual space.
- Not enough connection to current learning path.
- Language of challenge is unclear.

## Redesign Goal

Make PvP a learner-friendly challenge hub: practice after learning, not a standalone esport mode.

## Required Structure

1. Header
- “Thử thách nhanh sau bài học.”
- Explain: luyện phản xạ, củng cố kiến thức.

2. Eligibility card
- If user has no completed lesson/points: locked state.
- CTA: “Hoàn thành bài đầu tiên”.
- Disable quick match/join room until eligible if that is product rule.

3. Quick challenge card
- Mode: 1v1 only.
- Recommended difficulty.
- Current language/path.
- CTA: “Bắt đầu thử thách 1v1”.

4. Join room card
- Compact room code input.
- Helper text: “Nhập mã 6 ký tự từ bạn bè.”

5. Challenge benefits
- Short bullets: realtime, quick rounds, review after match.

## Functional Requirements

- Preserve `pvpService.findMatch()`.
- Preserve `pvpService.joinMatch()`.
- Preserve auth/onboarding redirects.
- Fix gate behavior to match copy.
