-- Add deterministic validation columns to lessons table
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS validation_type TEXT DEFAULT 'rule' CHECK (validation_type IN ('rule', 'exact', 'regex', 'stdout', 'function')),
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_output TEXT,
ADD COLUMN IF NOT EXISTS failure_hint TEXT,
ADD COLUMN IF NOT EXISTS grading_mode TEXT DEFAULT 'stdout' CHECK (grading_mode IN ('stdout', 'function'));

-- Sửa cột code và insight thành NULLABLE vì Aha lessons không cần bắt buộc hai cột này
ALTER TABLE lessons 
ALTER COLUMN code DROP NOT NULL,
ALTER COLUMN insight DROP NOT NULL;
