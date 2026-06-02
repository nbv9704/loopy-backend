# Prompt: Redesign PvP Match Page

## Current Route

- `/pvp/match/:roomCode`
- Main files:
- `src/pages/PvPMatchPage.tsx`
- `src/components/pvp/MatchLobby.tsx`
- `src/components/pvp/MatchArena.tsx`
- `src/components/pvp/MatchResults.tsx`

## Current Goal

Realtime challenge match with lobby, active question, submissions, reactions, pause/reconnect, results.

## Current Problems

- Many strings are English while app is Vietnamese-first.
- Loading/not-found screen exposes debug info.
- Room code has no copy/invite flow.
- In-progress reconnect may lack current question if socket event was missed.
- Results focus on winner, not learning feedback.
- Mobile layout can bury question under participant sidebar.

## Redesign Goal

Make PvP match feel like a quick learning challenge, not a hardcore game arena.

## Required Structure

1. Lobby
- Room code with copy button.
- Invite helper.
- Compact participant list.
- Ready CTA.

2. Active match
- Top compact scoreboard.
- Timer prominent.
- Question center stage.
- Answer/code area large and focused.
- Reactions small and non-distracting.

3. Pause/reconnect
- Friendly Vietnamese copy.
- Clear countdown.

4. Results
- Ranking.
- What you did well.
- What to review.
- CTA: “Đấu lại”, “Ôn bài liên quan”, “Về lộ trình”.

## Functional Requirements

- Preserve socket events.
- Preserve REST join flow.
- Add resilient load of current question if entering match mid-game if backend supports it.
- Avoid debug UI in production.
