-- 034-seed-python-first-steps-chapter-01-lessons.sql
-- Pilot seed: Python / first_steps / Chapter 01.
-- Design rule: one lesson has one primary interaction type.

BEGIN;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'code_fix';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lessons_lesson_type_check'
  ) THEN
    ALTER TABLE lessons
    ADD CONSTRAINT lessons_lesson_type_check
    CHECK (lesson_type IN (
      'concept',
      'true_false',
      'multiple_choice',
      'fill_blank',
      'short_answer',
      'code_fix',
      'code_output',
      'code_build'
    ));
  END IF;
END $$;

DO $$
DECLARE
  target_chapter_id uuid;
  seeded_lesson_ids text[] := ARRAY[
    'python-print-concept',
    'python-print-true-false',
    'python-print-multiple-choice',
    'python-print-fill-blank',
    'python-print-code-fix',
    'python-number-code-build'
  ];
BEGIN
  SELECT id
  INTO target_chapter_id
  FROM chapters
  WHERE language_id = 'python'
    AND title = 'Python đầu tiên của bạn'
  LIMIT 1;

  IF target_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Missing target chapter: language_id=python, title=Python đầu tiên của bạn';
  END IF;

  CREATE TEMP TABLE tmp_python_lessons (
    lesson_id text PRIMARY KEY,
    lesson_type text NOT NULL,
    title text NOT NULL,
    description text,
    code text,
    insight text,
    order_index integer NOT NULL,
    difficulty text,
    estimated_time integer,
    starter_code text,
    task_description text,
    hint text,
    hint_level_1 text,
    hint_level_2 text,
    hint_level_3 text,
    common_mistakes text,
    solution_code text,
    is_aha_lesson boolean,
    status text,
    validation_type text,
    validation_rules jsonb,
    success_output text,
    failure_hint text,
    grading_mode text,
    debug_starter_code text,
    debug_task_description text,
    debug_validation_rules jsonb,
    debug_hint text
  ) ON COMMIT DROP;

  INSERT INTO tmp_python_lessons VALUES
  (
    'python-print-concept',
    'concept',
    'Python nói chuyện với bạn bằng print',
    'Trong Python, `print(...)` là cách đơn giản nhất để hiển thị chữ hoặc số ra màn hình. Bài này chỉ cần nắm ý tưởng: bên trong dấu ngoặc là thứ Python sẽ in ra.',
    'print("Xin chào, Python!")',
    'Nếu thấy dòng chữ xuất hiện trong output, bạn đã có phản hồi đầu tiên từ chương trình.',
    1,
    'beginner',
    5,
    '',
    'Đọc phần lý thuyết và xác nhận rằng bạn hiểu `print` dùng để hiển thị thông tin.',
    'Hãy nhìn vào cặp ngoặc tròn sau chữ print.',
    'Đọc `print("Xin chào")` như: hãy in dòng chữ Xin chào.',
    'Dấu ngoặc kép giữ phần chữ cần in.',
    'Đừng viết `Print` hoa chữ P. Python phân biệt chữ hoa và chữ thường.',
    '',
    '',
    true,
    'published',
    'rule',
    '{}'::jsonb,
    'Đã hiểu khái niệm print.',
    'Đọc lại ví dụ print một lần nữa.',
    'stdout',
    '',
    '',
    '{}'::jsonb,
    ''
  ),
  (
    'python-print-true-false',
    'true_false',
    'Đúng hay sai: Print và print',
    'Python phân biệt chữ hoa và chữ thường. Vì vậy `print` và `Print` không phải là cùng một tên lệnh.',
    '',
    'Tên lệnh trong Python cần viết chính xác từng ký tự.',
    2,
    'beginner',
    4,
    '',
    'Chọn đúng hoặc sai cho nhận định ở phần trả lời.',
    'Hãy chú ý chữ P viết hoa.',
    'Python xem `print` và `Print` là hai tên khác nhau.',
    'Lệnh chuẩn để in ra màn hình là `print` chữ thường.',
    'Đừng đoán theo tiếng Anh thông thường; hãy theo cú pháp Python.',
    '',
    '',
    false,
    'published',
    'rule',
    '{}'::jsonb,
    'Đáp án đúng.',
    'Hãy nhớ Python phân biệt chữ hoa/thường.',
    'stdout',
    '',
    '',
    '{}'::jsonb,
    ''
  ),
  (
    'python-print-multiple-choice',
    'multiple_choice',
    'Dự đoán output của print',
    'Khi chạy `print("Chao ban!")`, Python sẽ hiển thị phần chữ nằm trong dấu ngoặc kép, không in dấu ngoặc kép ra output.',
    '',
    'Output là thứ người dùng nhìn thấy sau khi chương trình chạy.',
    3,
    'beginner',
    5,
    '',
    'Chọn output đúng của đoạn code `print("Chao ban!")`.',
    'Dấu ngoặc kép chỉ đánh dấu chuỗi trong code.',
    'Output không bao gồm chữ `print`.',
    'Output cũng không bao gồm dấu ngoặc kép bao quanh chuỗi.',
    'Lỗi thường gặp là chọn cả `print(...)` thay vì chỉ nội dung được in.',
    '',
    '',
    false,
    'published',
    'rule',
    '{}'::jsonb,
    'Đáp án đúng.',
    'Hãy phân biệt code và output.',
    'stdout',
    '',
    '',
    '{}'::jsonb,
    ''
  ),
  (
    'python-print-fill-blank',
    'fill_blank',
    'Điền lệnh in ra màn hình',
    'Để in chữ trong Python, bạn dùng lệnh `print`. Bài này giúp bạn nhớ chính xác tên lệnh đầu tiên.',
    '',
    '`print` là một trong những lệnh bạn sẽ dùng liên tục khi mới học.',
    4,
    'beginner',
    4,
    '',
    'Điền phần còn thiếu để tạo lệnh hợp lệ: `____("Hello!")`.',
    'Tên lệnh có 5 chữ cái.',
    'Viết thường toàn bộ.',
    'Đáp án là lệnh bắt đầu bằng chữ p.',
    'Không thêm dấu ngoặc vào đáp án; chỉ nhập tên lệnh.',
    '',
    '',
    false,
    'published',
    'rule',
    '{}'::jsonb,
    'Đáp án đúng.',
    'Nhập đúng tên lệnh, chữ thường.',
    'stdout',
    '',
    '',
    '{}'::jsonb,
    ''
  ),
  (
    'python-print-code-fix',
    'code_fix',
    'Sửa câu lệnh print bị thiếu dấu ngoặc kép',
    'Giờ bạn sửa một lỗi thật: chuỗi bắt đầu bằng dấu ngoặc kép thì cũng cần được đóng lại bằng dấu ngoặc kép.',
    'print("Toi dang hoc Python!")',
    'Một lỗi nhỏ trong dấu ngoặc kép có thể làm cả chương trình không chạy.',
    5,
    'beginner',
    8,
    'print("Toi dang hoc Python.)',
    'Sửa code để chương trình in chính xác `Toi dang hoc Python!`.',
    'Kiểm tra xem chuỗi đã có đủ dấu ngoặc kép mở và đóng chưa.',
    'Dấu `!` nằm bên trong chuỗi cần in.',
    'Code đúng vẫn cần giữ `print(...)`.',
    'Đừng chỉ xóa dòng code; checker cần output đúng.',
    '',
    'print("Toi dang hoc Python!")',
    false,
    'published',
    'stdout',
    '{}'::jsonb,
    'Toi dang hoc Python!',
    'Output cần đúng từng ký tự.',
    'stdout',
    'print("Toi dang hoc Python!")
print(ten_chua_khai_bao)',
    'Sửa hoặc xóa dòng dùng biến chưa khai báo để chương trình chạy lại bình thường.',
    '{"expected_stdout":"Toi dang hoc Python!"}'::jsonb,
    'Biến `ten_chua_khai_bao` chưa được tạo trước khi dùng.'
  ),
  (
    'python-number-code-build',
    'code_build',
    'Tự in ba con số đầu tiên',
    'Python không chỉ in chữ. Bạn cũng có thể in số bằng `print(8)`, không cần dấu ngoặc kép.',
    'print(8)
print(12)
print(14)',
    'Số có thể được in trực tiếp. Chuỗi chữ thì cần dấu ngoặc kép.',
    6,
    'beginner',
    8,
    '# Viết 3 dòng print bên dưới
',
    'Viết code để in lần lượt 3 dòng: `8`, `12`, `14`.',
    'Mỗi số nên nằm trong một lệnh print riêng.',
    'Số không cần đặt trong dấu ngoặc kép.',
    'Thứ tự output phải là 8 rồi 12 rồi 14.',
    'Đừng in cả ba số trên cùng một dòng nếu đề yêu cầu 3 dòng.',
    '',
    'print(8)
print(12)
print(14)',
    false,
    'published',
    'stdout',
    '{}'::jsonb,
    '8
12
14',
    'Output cần có 3 dòng đúng thứ tự.',
    'stdout',
    'print(8)
print(12)
print(14)
print(so_chua_khai_bao)',
    'Sửa lỗi biến chưa khai báo để chương trình chỉ in 3 số đúng yêu cầu.',
    '{"expected_stdout":"8\n12\n14"}'::jsonb,
    'Dòng cuối đang dùng một biến chưa tồn tại.'
  );

  -- Clear dependent data for idempotent reseeding of this pilot only.
  DELETE FROM lesson_submissions
  WHERE lesson_id IN (
    SELECT id FROM lessons WHERE chapter_id = target_chapter_id AND lesson_id = ANY(seeded_lesson_ids)
  );

  DELETE FROM user_progress
  WHERE lesson_id IN (
    SELECT id FROM lessons WHERE chapter_id = target_chapter_id AND lesson_id = ANY(seeded_lesson_ids)
  );

  DELETE FROM lesson_test_cases
  WHERE lesson_id IN (
    SELECT id FROM lessons WHERE chapter_id = target_chapter_id AND lesson_id = ANY(seeded_lesson_ids)
  );

  DELETE FROM lesson_steps
  WHERE lesson_id IN (
    SELECT id FROM lessons WHERE chapter_id = target_chapter_id AND lesson_id = ANY(seeded_lesson_ids)
  );

  DELETE FROM lessons
  WHERE chapter_id = target_chapter_id
    AND lesson_id = ANY(seeded_lesson_ids);

  INSERT INTO lessons (
    chapter_id,
    lesson_id,
    lesson_type,
    title,
    description,
    code,
    insight,
    order_index,
    difficulty,
    estimated_time,
    starter_code,
    task_description,
    hint,
    hint_level_1,
    hint_level_2,
    hint_level_3,
    common_mistakes,
    solution_code,
    is_aha_lesson,
    status,
    validation_type,
    validation_rules,
    success_output,
    failure_hint,
    grading_mode,
    debug_starter_code,
    debug_task_description,
    debug_validation_rules,
    debug_hint
  )
  SELECT
    target_chapter_id,
    lesson_id,
    lesson_type,
    title,
    description,
    code,
    insight,
    order_index,
    difficulty,
    estimated_time,
    starter_code,
    task_description,
    hint,
    hint_level_1,
    hint_level_2,
    hint_level_3,
    common_mistakes,
    solution_code,
    is_aha_lesson,
    status,
    validation_type,
    validation_rules,
    success_output,
    failure_hint,
    grading_mode,
    debug_starter_code,
    debug_task_description,
    debug_validation_rules,
    debug_hint
  FROM tmp_python_lessons
  ORDER BY order_index;

  INSERT INTO lesson_steps (
    lesson_id,
    type,
    title,
    prompt,
    options,
    correct_answer,
    explanation,
    hint,
    is_required,
    order_index
  )
  SELECT l.id, 'note', 'Đã hiểu print', 'Xác nhận bạn đã hiểu `print(...)` dùng để hiển thị thông tin.', '[]'::jsonb, NULL, 'Tốt. Bây giờ bạn đã biết lệnh đầu tiên để Python hiển thị dữ liệu.', 'Đọc lại ví dụ print nếu chưa chắc.', true, 1
  FROM lessons l WHERE l.chapter_id = target_chapter_id AND l.lesson_id = 'python-print-concept'
  UNION ALL
  SELECT l.id, 'true_false', 'Print và print có giống nhau không?', '`Print` và `print` là cùng một lệnh trong Python.', '["Đúng", "Sai"]'::jsonb, to_jsonb('Sai'::text), 'Đúng. Python phân biệt chữ hoa và chữ thường, lệnh chuẩn là `print`.', 'Hãy chú ý chữ P viết hoa.', true, 1
  FROM lessons l WHERE l.chapter_id = target_chapter_id AND l.lesson_id = 'python-print-true-false'
  UNION ALL
  SELECT l.id, 'multiple_choice', 'Output của print', 'Output của `print("Chao ban!")` là gì?', '["print(\"Chao ban!\")", "\"Chao ban!\"", "Chao ban!", "Chao ban"]'::jsonb, to_jsonb('Chao ban!'::text), 'Đúng. Output là nội dung bên trong chuỗi, không gồm dấu ngoặc kép.', 'Output không bao gồm chữ print hay dấu ngoặc kép.', true, 1
  FROM lessons l WHERE l.chapter_id = target_chapter_id AND l.lesson_id = 'python-print-multiple-choice'
  UNION ALL
  SELECT l.id, 'fill_blank', 'Điền tên lệnh', 'Điền phần còn thiếu: `____("Hello!")`', '[]'::jsonb, to_jsonb('print'::text), 'Đúng. `print` là lệnh in ra màn hình.', 'Viết thường toàn bộ.', true, 1
  FROM lessons l WHERE l.chapter_id = target_chapter_id AND l.lesson_id = 'python-print-fill-blank';

  INSERT INTO lesson_test_cases (lesson_id, input, expected_output, description, is_hidden, order_index)
  SELECT l.id, '""'::jsonb, to_jsonb('Toi dang hoc Python!'::text), 'In đúng dòng chữ sau khi sửa cú pháp print.', false, 1
  FROM lessons l
  WHERE l.chapter_id = target_chapter_id
    AND l.lesson_id = 'python-print-code-fix'
  UNION ALL
  SELECT l.id, '""'::jsonb, to_jsonb('8
12
14'::text), 'In 3 số đúng thứ tự, mỗi số một dòng.', false, 1
  FROM lessons l
  WHERE l.chapter_id = target_chapter_id
    AND l.lesson_id = 'python-number-code-build';
END $$;

COMMIT;
