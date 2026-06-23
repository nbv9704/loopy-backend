-- Migration 033: Learn-scoped lesson steps
-- Purpose: Add inline Learn activities without reusing Practice domain tables.

CREATE TABLE IF NOT EXISTS lesson_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'multiple_choice', 'true_false', 'fill_blank', 'short_answer', 'code_prompt')),
  title TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT,
  hint TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_steps_lesson_order ON lesson_steps(lesson_id, order_index);

DROP TRIGGER IF EXISTS update_lesson_steps_updated_at ON lesson_steps;
CREATE TRIGGER update_lesson_steps_updated_at
  BEFORE UPDATE ON lesson_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lesson_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lesson steps are viewable through published lessons" ON lesson_steps;
CREATE POLICY "Lesson steps are viewable through published lessons" ON lesson_steps
  FOR SELECT USING (
    lesson_id IN (
      SELECT id FROM lessons WHERE status = 'published'
    )
  );
