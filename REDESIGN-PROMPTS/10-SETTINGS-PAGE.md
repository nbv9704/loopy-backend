# Prompt: Redesign Settings Page

## Current Route

- `/settings`
- Main files:
- `src/pages/SettingsPage.tsx`
- `src/components/settings/ProfileSettings.tsx`
- `src/components/settings/PreferencesSettings.tsx`
- `src/components/settings/ProgressStats.tsx`
- `src/components/settings/ActivityHeatmap.tsx`

## Current Goal

Edit profile, editor preferences, and view progress.

## Current Problems

- Progress is hidden inside Settings even though progress is central to learning.
- Profile form has limited feedback and may not initialize all fields.
- Preferences only has editor font size.
- Progress answers “stats” but not “what should I do next?”

## Redesign Goal

Make Settings a “Learning Profile & Preferences” area.

## Required Structure

1. Learning profile
- Current goal.
- Preferred language.
- Experience level.
- CTA to adjust path.

2. Account profile
- Avatar, display name, bio, email.

3. Editor comfort
- Font size.
- Theme if supported.
- Reduced motion.
- Hint style: gentle/direct.

4. Progress recap
- Current streak.
- Completed lessons.
- Current chapter.
- Next lesson CTA.
- Heatmap.

## Functional Requirements

- Preserve `api.updateProfile()`.
- Preserve `api.getUserProgress()`.
- Preserve localStorage font size behavior.
- Add clearer save/error states.
