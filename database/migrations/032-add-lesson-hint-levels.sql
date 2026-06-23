-- Migration 032: Add progressive hint levels to lessons
-- AI remains hint-only. Lesson pass/fail must continue to use deterministic validation.

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS hint_level_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hint_level_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS hint_level_3 TEXT DEFAULT '';

-- Preserve existing authored hints as the first, lowest-friction hint.
UPDATE lessons
SET hint_level_1 = hint
WHERE COALESCE(hint_level_1, '') = ''
  AND COALESCE(hint, '') <> '';

COMMENT ON COLUMN lessons.hint_level_1 IS 'Progressive hint level 1: direct nudge/spoon-feeding for stuck beginners';
COMMENT ON COLUMN lessons.hint_level_2 IS 'Progressive hint level 2: conceptual explanation of the relevant idea';
COMMENT ON COLUMN lessons.hint_level_3 IS 'Progressive hint level 3: safety net, common mistake warning, or final non-AI guidance';
