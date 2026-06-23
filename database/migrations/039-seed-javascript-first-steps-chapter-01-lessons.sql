-- 039-seed-javascript-first-steps-chapter-01-lessons.sql
-- Seed: JavaScript / first_steps / Chapter 01.
-- Source: docs/data/javascript_first_steps_chapter_01_complete.json
-- Normalized for current Learn runtime:
-- - lesson_type is explicit per lesson.
-- - grading_mode uses stdout.
-- - lesson_test_cases.input and expected_output are JSONB strings.
-- - lesson_steps keep varied interaction types for newbie-first checkpoints.

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
  payload jsonb := $javascript_json$
{
  "lessons": [
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-chuong-trinh-dau-tien",
      "title": "Chương trình JavaScript đầu tiên",
      "description": "Làm quen với một chương trình JavaScript chạy bằng Node.js. Người học sửa lệnh console.log() đầu tiên và quan sát nội dung xuất hiện trên màn hình kết quả.",
      "order_index": 1,
      "difficulty": "beginner",
      "estimated_time": 10,
      "status": "published",
      "is_aha_lesson": true,
      "code": "console.log(\"Xin chao, JavaScript!\");",
      "starter_code": "console.log(\"Xin chao!\");",
      "task_description": "Thay đổi nội dung bên trong console.log() để chương trình hiển thị chính xác: Xin chao, JavaScript!",
      "solution_code": "console.log(\"Xin chao, JavaScript!\");",
      "hint": "Chỉ cần thay đổi phần văn bản nằm giữa hai dấu ngoặc kép.",
      "hint_level_1": "Tìm nội dung hiện tại bên trong console.log().",
      "hint_level_2": "Giữ nguyên console.log và cặp ngoặc tròn.",
      "hint_level_3": "Dòng hoàn chỉnh là console.log(\"Xin chao, JavaScript!\");.",
      "common_mistakes": "Thiếu dấu ngoặc đóng; thiếu một dấu ngoặc kép; viết Console.log thay vì console.log; in sai chữ hoa, khoảng trắng hoặc dấu chấm than.",
      "insight": "Một thay đổi nhỏ trong chỉ dẫn tạo ra kết quả mới ngay lập tức. Đây là vòng lặp cơ bản khi học code: sửa, chạy và quan sát.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Tuyệt vời! Bạn vừa sửa và chạy chương trình JavaScript đầu tiên.",
      "failure_hint": "Kết quả phải đúng từng chữ, khoảng trắng và dấu chấm than. Hãy kiểm tra nội dung trong console.log().",
      "grading_mode": "test_cases",
      "debug_starter_code": "console.log(\"Xin chao, JavaScript!\";",
      "debug_task_description": "Chương trình đang thiếu một ký tự nên không thể chạy. Hãy sửa để in ra Xin chao, JavaScript!.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Xin chao, JavaScript!"},
      "debug_hint": "Đếm số ngoặc mở và ngoặc đóng trong console.log().",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Code tạo ra kết quả",
          "prompt": "console.log() là cách đơn giản để đưa một thông điệp ra console. Hãy chạy code mẫu và quan sát phần văn bản giữa dấu ngoặc kép xuất hiện trong kết quả.",
          "options": null,
          "correct_answer": null,
          "explanation": "Node.js cung cấp console.log() để chương trình JavaScript ghi nội dung ra stdout.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Dự đoán kết quả",
          "prompt": "console.log(\"Chao ban!\"); sẽ hiển thị gì?",
          "options": ["console", "Chao ban!", "\"Chao ban!\"", "Không hiển thị gì"],
          "correct_answer": "Chao ban!",
          "explanation": "console.log() hiển thị nội dung chuỗi nhưng không in hai dấu ngoặc kép bao quanh chuỗi.",
          "hint": "Phần nằm giữa dấu ngoặc kép là thông điệp.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "true_false",
          "title": "Chữ hoa và chữ thường",
          "prompt": "Trong JavaScript, Console và console là cùng một tên.",
          "options": [true, false],
          "correct_answer": false,
          "explanation": "JavaScript phân biệt chữ hoa và chữ thường. Tên đúng trong bài là console.",
          "hint": "So sánh chữ C ở đầu hai cách viết.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "fill_blank",
          "title": "Điền tên phương thức",
          "prompt": "Điền phần còn thiếu: console.____(\"Hello!\");",
          "options": null,
          "correct_answer": "log",
          "explanation": "Tên đầy đủ là console.log().",
          "hint": "Đáp án gồm ba chữ cái và bắt đầu bằng l.",
          "is_required": true,
          "order_index": 4
        },
        {
          "type": "code_prompt",
          "title": "Lời chào JavaScript",
          "prompt": "Viết một dòng JavaScript để hiển thị chính xác Xin chao, JavaScript!.",
          "options": null,
          "correct_answer": "console.log(\"Xin chao, JavaScript!\");",
          "explanation": "Thông điệp được đặt trong dấu ngoặc kép rồi truyền vào console.log().",
          "hint": "Dùng console.log(\"...\");.",
          "is_required": true,
          "order_index": 5
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Xin chao, JavaScript!"},
          "description": "Hiển thị chính xác lời chào JavaScript đầu tiên",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-hien-thi-van-ban",
      "title": "Hiển thị văn bản với console.log()",
      "description": "Tìm hiểu cách JavaScript biểu diễn văn bản bằng chuỗi và cách nhiều lần gọi console.log() tạo ra nhiều dòng kết quả. Người học nhận diện rồi sửa lỗi liên quan đến dấu ngoặc kép.",
      "order_index": 2,
      "difficulty": "beginner",
      "estimated_time": 12,
      "status": "published",
      "is_aha_lesson": false,
      "code": "console.log(\"Dong thu nhat\");\nconsole.log(\"Dong thu hai\");",
      "starter_code": "console.log(\"Toi dang hoc JavaScript.);\nconsole.log(\"Lap trinh rat thu vi!\");",
      "task_description": "Sửa lỗi ở dòng đầu để chương trình chạy và hiển thị đúng hai dòng: Toi dang hoc JavaScript. và Lap trinh rat thu vi!",
      "solution_code": "console.log(\"Toi dang hoc JavaScript.\");\nconsole.log(\"Lap trinh rat thu vi!\");",
      "hint": "Mỗi chuỗi cần có một dấu ngoặc kép ở đầu và một dấu ngoặc kép ở cuối.",
      "hint_level_1": "Lỗi nằm trong lời gọi console.log đầu tiên.",
      "hint_level_2": "Chuỗi chưa được đóng trước dấu ngoặc tròn.",
      "hint_level_3": "Thêm dấu ngoặc kép ngay sau dấu chấm trong JavaScript.",
      "common_mistakes": "Đóng ngoặc kép sai vị trí; viết consolelog thay vì console.log; xóa nhầm dấu chấm trong nội dung; đặt cả hai câu trong một chuỗi.",
      "insight": "Dấu ngoặc kép xác định ranh giới của văn bản, còn ngoặc tròn xác định dữ liệu được đưa vào console.log().",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Chính xác! Bạn đã sửa chuỗi và tạo kết quả gồm hai dòng.",
      "failure_hint": "Kiểm tra dấu ngoặc kép, ngoặc tròn và thứ tự hai dòng kết quả.",
      "grading_mode": "test_cases",
      "debug_starter_code": "consolelog(\"Xin chao!\");",
      "debug_task_description": "Tên lệnh đang thiếu một ký tự ngăn cách. Hãy sửa để chương trình in ra Xin chao!.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Xin chao!"},
      "debug_hint": "Giữa console và log cần có một dấu chấm.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Văn bản cần có ranh giới",
          "prompt": "Trong JavaScript, văn bản được gọi là chuỗi. Chuỗi có thể nằm giữa hai dấu ngoặc kép. Nếu thiếu dấu đóng, JavaScript không biết chuỗi kết thúc ở đâu.",
          "options": null,
          "correct_answer": null,
          "explanation": "Hai dấu ngoặc kép tạo ranh giới bắt đầu và kết thúc của chuỗi.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Chọn lệnh hợp lệ",
          "prompt": "Dòng nào hiển thị Xin chao đúng cú pháp?",
          "options": ["console.log(Xin chao);", "console.log(\"Xin chao\");", "consolelog(\"Xin chao\");", "Console.Log(\"Xin chao\");"],
          "correct_answer": "console.log(\"Xin chao\");",
          "explanation": "Tên đúng là console.log và chuỗi nằm trong dấu ngoặc kép.",
          "hint": "Tìm đáp án có console.log, ngoặc tròn và cặp ngoặc kép.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Sửa chuỗi chưa hoàn chỉnh",
          "prompt": "Sửa dòng sau: console.log(\"Hoc JavaScript);",
          "options": null,
          "correct_answer": "console.log(\"Hoc JavaScript\");",
          "explanation": "Cần thêm dấu ngoặc kép đóng trước dấu ngoặc tròn.",
          "hint": "Chuỗi có dấu mở nhưng chưa có dấu đóng.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Giải thích lỗi",
          "prompt": "Vì sao console.log(Xin chao); không phải cách đúng để in văn bản Xin chao?",
          "options": null,
          "correct_answer": "Vì Xin chao chưa được đặt trong dấu ngoặc kép nên JavaScript không nhận đó là một chuỗi.",
          "explanation": "Không có dấu ngoặc kép, JavaScript cố hiểu nội dung như tên trong chương trình.",
          "hint": "Hãy nhắc đến chuỗi và dấu ngoặc kép.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Toi dang hoc JavaScript.\nLap trinh rat thu vi!"},
          "description": "Sửa lỗi và hiển thị hai câu trên hai dòng",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-in-so-va-phep-tinh",
      "title": "In số và kết quả phép tính",
      "description": "Khám phá sự khác nhau giữa in một chuỗi và yêu cầu JavaScript tính toán. Người học dùng console.log() để xây một bảng kết quả số học nhỏ.",
      "order_index": 3,
      "difficulty": "beginner",
      "estimated_time": 15,
      "status": "published",
      "is_aha_lesson": false,
      "code": "console.log(2 + 3);\nconsole.log(4 * 2);",
      "starter_code": "// Thay cac so 0 bang phep tinh phu hop\nconsole.log(0);\nconsole.log(0);\nconsole.log(0);",
      "task_description": "Thay ba số 0 bằng biểu thức JavaScript. Dòng 1 dùng 3 + 5, dòng 2 dùng 4 * 3 và dòng 3 dùng 20 - 6. Kết quả cần in là 8, 12 và 14.",
      "solution_code": "console.log(3 + 5);\nconsole.log(4 * 3);\nconsole.log(20 - 6);",
      "hint": "Viết phép tính trực tiếp trong console.log() và không đặt phép tính trong dấu ngoặc kép.",
      "hint_level_1": "Bạn cần lần lượt dùng phép cộng, nhân và trừ.",
      "hint_level_2": "JavaScript dùng dấu * cho phép nhân.",
      "hint_level_3": "Ba biểu thức là 3 + 5, 4 * 3 và 20 - 6.",
      "common_mistakes": "Đặt biểu thức trong dấu ngoặc kép; dùng chữ x thay cho *; viết trực tiếp kết quả thay vì biểu thức; thay đổi thứ tự ba dòng.",
      "insight": "console.log(\"3 + 5\") in nguyên văn, còn console.log(3 + 5) đánh giá biểu thức rồi in số 8.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Hoàn thành! Bạn đã dùng JavaScript để tính và hiển thị ba kết quả.",
      "failure_hint": "Kiểm tra toán tử, thứ tự ba dòng và bảo đảm phép tính không nằm trong dấu ngoặc kép.",
      "grading_mode": "test_cases",
      "debug_starter_code": "console.log(7 + );",
      "debug_task_description": "Biểu thức đang thiếu một số. Hãy sửa để chương trình tính và in ra 12.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "12"},
      "debug_hint": "Thêm số 5 vào bên phải dấu cộng.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Tính trước, hiển thị sau",
          "prompt": "Khi bên trong console.log() là biểu thức số học, JavaScript tính biểu thức trước rồi hiển thị kết quả. console.log(2 + 3) in ra 5.",
          "options": null,
          "correct_answer": null,
          "explanation": "Biểu thức 2 + 3 được đánh giá thành 5 trước khi console.log() nhận giá trị.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "fill_blank",
          "title": "Điền toán tử",
          "prompt": "Điền toán tử để có kết quả 15: console.log(3 __ 5);",
          "options": null,
          "correct_answer": "*",
          "explanation": "Dấu * là toán tử nhân trong JavaScript.",
          "hint": "JavaScript không dùng chữ x để nhân.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Tạo hai kết quả",
          "prompt": "Viết hai dòng console.log(): dùng phép cộng để in 10 và phép trừ để in 6.",
          "options": null,
          "correct_answer": "console.log(4 + 6);\nconsole.log(10 - 4);",
          "explanation": "Đáp án mẫu dùng 4 + 6 và 10 - 4; các biểu thức tương đương cũng đúng về ý tưởng.",
          "hint": "Mỗi kết quả dùng một console.log riêng.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Chuỗi hay phép tính?",
          "prompt": "console.log(\"3 + 5\") khác console.log(3 + 5) như thế nào?",
          "options": null,
          "correct_answer": "Lệnh đầu in nguyên văn 3 + 5, còn lệnh sau tính phép cộng và in 8.",
          "explanation": "Dấu ngoặc kép biến nội dung thành chuỗi nên phép tính không được thực hiện.",
          "hint": "Chú ý dấu ngoặc kép ở lệnh đầu.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "8\n12\n14"},
          "description": "Tính và hiển thị đúng ba kết quả số học",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-thu-tu-thuc-thi",
      "title": "Nhiều câu lệnh và thứ tự thực thi",
      "description": "Quan sát cách JavaScript thực hiện chương trình đơn giản từ trên xuống dưới. Người học dự đoán kết quả rồi sắp xếp các câu lệnh theo đúng trình tự.",
      "order_index": 4,
      "difficulty": "beginner",
      "estimated_time": 15,
      "status": "published",
      "is_aha_lesson": false,
      "code": "console.log(\"Buoc 1\");\nconsole.log(\"Buoc 2\");\nconsole.log(\"Buoc 3\");",
      "starter_code": "console.log(\"Buoc 2: Viet code\");\nconsole.log(\"Buoc 1: Doc yeu cau\");\nconsole.log(\"Buoc 3: Chay chuong trinh\");",
      "task_description": "Sắp xếp lại ba dòng console.log() để kết quả xuất hiện theo đúng thứ tự từ bước 1 đến bước 3. Không thay đổi nội dung chuỗi.",
      "solution_code": "console.log(\"Buoc 1: Doc yeu cau\");\nconsole.log(\"Buoc 2: Viet code\");\nconsole.log(\"Buoc 3: Chay chuong trinh\");",
      "hint": "Dòng code nằm trên được thực hiện trước dòng nằm dưới.",
      "hint_level_1": "Đưa dòng chứa Buoc 1 lên đầu.",
      "hint_level_2": "Sau bước 1 phải là bước 2.",
      "hint_level_3": "Thứ tự là Doc yeu cau, Viet code rồi Chay chuong trinh.",
      "common_mistakes": "Đổi số trong chuỗi thay vì di chuyển cả câu lệnh; xóa mất một dòng; để bước 3 trước bước 2; thay đổi nội dung khi sắp xếp.",
      "insight": "Cùng ba câu lệnh nhưng đặt ở vị trí khác nhau sẽ tạo ra một trình tự kết quả khác nhau.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Chính xác! Bạn đã điều khiển thứ tự thực hiện của chương trình JavaScript.",
      "failure_hint": "Đọc kết quả từ trên xuống và kiểm tra các bước đã theo thứ tự 1, 2, 3 chưa.",
      "grading_mode": "test_cases",
      "debug_starter_code": "console.log(\"Dong 2\");\nconsole.log(\"Dong 1\");",
      "debug_task_description": "Chương trình chạy nhưng hai dòng xuất hiện sai thứ tự. Hãy sắp xếp để in Dong 1 rồi Dong 2.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Dong 1\nDong 2"},
      "debug_hint": "Di chuyển cả dòng in Dong 1 lên trên.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "JavaScript đọc từ trên xuống",
          "prompt": "Trong chương trình đơn giản, JavaScript bắt đầu ở dòng đầu rồi chuyển xuống từng dòng tiếp theo. Thứ tự code quyết định thứ tự kết quả.",
          "options": null,
          "correct_answer": null,
          "explanation": "Đọc code theo thứ tự giúp dự đoán chương trình làm gì trước và sau.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Dòng nào xuất hiện trước?",
          "prompt": "Nếu console.log(\"A\") nằm trên console.log(\"B\"), nội dung nào xuất hiện trước?",
          "options": ["A", "B", "AB cùng lúc", "Không có nội dung"],
          "correct_answer": "A",
          "explanation": "Lời gọi console.log in A được thực hiện trước.",
          "hint": "Nhìn vào vị trí dòng code.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "true_false",
          "title": "Đổi vị trí câu lệnh",
          "prompt": "Đổi vị trí hai dòng console.log() có thể làm thay đổi thứ tự kết quả.",
          "options": [true, false],
          "correct_answer": true,
          "explanation": "Thứ tự code thay đổi thì thứ tự hai lần ghi ra console cũng thay đổi.",
          "hint": "Mỗi dòng chạy theo vị trí của nó.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "fill_blank",
          "title": "Điền bước còn thiếu",
          "prompt": "Hoàn thiện trình tự: Buoc 1, ____, Buoc 3",
          "options": null,
          "correct_answer": "Buoc 2",
          "explanation": "Bước 2 nằm giữa bước 1 và bước 3.",
          "hint": "Số nào nằm giữa 1 và 3?",
          "is_required": true,
          "order_index": 4
        },
        {
          "type": "code_prompt",
          "title": "Tạo trình tự ba dòng",
          "prompt": "Viết ba dòng console.log() để lần lượt in Bat dau, Dang chay và Ket thuc.",
          "options": null,
          "correct_answer": "console.log(\"Bat dau\");\nconsole.log(\"Dang chay\");\nconsole.log(\"Ket thuc\");",
          "explanation": "Ba câu lệnh được đặt theo đúng trình tự cần hiển thị.",
          "hint": "Mỗi nội dung dùng một console.log riêng.",
          "is_required": true,
          "order_index": 5
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Buoc 1: Doc yeu cau\nBuoc 2: Viet code\nBuoc 3: Chay chuong trinh"},
          "description": "Hiển thị ba bước theo đúng thứ tự",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-comment",
      "title": "Ghi chú bằng comment",
      "description": "Tìm hiểu comment một dòng bắt đầu bằng // trong JavaScript. Người học sửa một dòng giải thích đang bị hiểu là code và dùng comment để tạm bỏ qua một lệnh.",
      "order_index": 5,
      "difficulty": "beginner",
      "estimated_time": 12,
      "status": "published",
      "is_aha_lesson": false,
      "code": "// Dong nay la ghi chu\nconsole.log(\"Dong nay duoc chay\");",
      "starter_code": "console.log(\"Bat dau\");\nconsole.log(\"Dong thu nghiem\");\nconsole.log(\"Hoan thanh\");",
      "task_description": "Thêm một comment mô tả chương trình. Sau đó biến dòng in Dong thu nghiem thành comment để kết quả chỉ còn Bat dau và Hoan thanh.",
      "solution_code": "// Chuong trinh minh hoa comment\nconsole.log(\"Bat dau\");\n// console.log(\"Dong thu nghiem\");\nconsole.log(\"Hoan thanh\");",
      "hint": "Comment một dòng trong JavaScript bắt đầu bằng //.",
      "hint_level_1": "Đặt // trước câu lệnh bạn không muốn thực hiện.",
      "hint_level_2": "Dòng in Dong thu nghiem cần trở thành comment.",
      "hint_level_3": "Viết // trước console.log ở dòng thử nghiệm.",
      "common_mistakes": "Dùng # như Python; chỉ dùng một dấu /; đặt // sau câu lệnh nên câu lệnh vẫn chạy; comment nhầm dòng Bat dau hoặc Hoan thanh.",
      "insight": "Comment vẫn tồn tại để con người đọc nhưng bị JavaScript bỏ qua. Nó giúp giải thích hoặc tạm tắt code mà không xóa code.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Đúng rồi! Comment đã giúp chương trình bỏ qua dòng thử nghiệm.",
      "failure_hint": "Nếu Dong thu nghiem vẫn xuất hiện, // chưa được đặt trước console.log tương ứng.",
      "grading_mode": "test_cases",
      "debug_starter_code": "Day la chuong trinh dau tien\nconsole.log(\"Xin chao!\");",
      "debug_task_description": "Dòng đầu chỉ là lời giải thích nhưng JavaScript đang cố chạy nó như code. Hãy biến dòng đó thành comment để in Xin chao!.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Xin chao!"},
      "debug_hint": "Thêm // vào đầu dòng giải thích.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Comment dành cho người đọc",
          "prompt": "Hai dấu // khiến phần còn lại của dòng trở thành comment. JavaScript bỏ qua comment nên nó không tạo ra kết quả.",
          "options": null,
          "correct_answer": null,
          "explanation": "Comment giúp code dễ đọc hơn mà không thay đổi hành vi chương trình.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Nhận diện comment",
          "prompt": "Dòng nào là comment một dòng hợp lệ trong JavaScript?",
          "options": ["# In loi chao", "// In loi chao", "-- In loi chao", "console.comment In loi chao"],
          "correct_answer": "// In loi chao",
          "explanation": "JavaScript dùng // cho comment một dòng.",
          "hint": "Ký hiệu gồm hai dấu gạch chéo.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Tạm bỏ qua câu lệnh",
          "prompt": "Biến console.log(\"Khong in\"); thành comment.",
          "options": null,
          "correct_answer": "// console.log(\"Khong in\");",
          "explanation": "Đặt // ở đầu khiến toàn bộ câu lệnh phía sau bị bỏ qua.",
          "hint": "Không xóa code, chỉ thêm hai ký tự.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Tại sao cần comment?",
          "prompt": "Comment có ích gì nếu JavaScript không thực hiện nó?",
          "options": null,
          "correct_answer": "Comment giúp giải thích mục đích của code hoặc ghi chú cho người đọc mà không làm thay đổi kết quả.",
          "explanation": "Comment hỗ trợ đọc và bảo trì chương trình.",
          "hint": "Hãy nghĩ đến người đọc lại code sau này.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Bat dau\nHoan thanh"},
          "description": "Bỏ qua dòng thử nghiệm bằng comment",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "javascript",
      "goal_id": "first_steps",
      "chapter_title": "JavaScript đầu tiên của bạn",
      "lesson_id": "javascript-thu-thach-dau-tien",
      "title": "Thử thách: Tấm danh thiếp JavaScript",
      "description": "Kết hợp console.log(), văn bản, phép tính đơn giản, thứ tự thực thi và comment để hoàn thành chương trình JavaScript nhỏ đầu tiên.",
      "order_index": 6,
      "difficulty": "beginner",
      "estimated_time": 20,
      "status": "published",
      "is_aha_lesson": true,
      "code": "// Mot tam the don gian\nconsole.log(\"=== HOC VIEN ===\");\nconsole.log(\"Ten: Binh\");",
      "starter_code": "// Hoan thanh tam danh thiep cua An\nconsole.log(\"=== THE LAP TRINH ===\");\n// Viet cac dong con lai o ben duoi",
      "task_description": "Hoàn thiện tấm danh thiếp bằng năm dòng console.log(). Kết quả phải là:\n=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc JavaScript\n=====================",
      "solution_code": "// Tam danh thiep cua An\nconsole.log(\"=== THE LAP TRINH ===\");\nconsole.log(\"Ten: An\");\nconsole.log(\"Tuoi: 18\");\nconsole.log(\"Muc tieu: Hoc JavaScript\");\nconsole.log(\"=====================\");",
      "hint": "Mỗi dòng trong kết quả mẫu tương ứng với một console.log().",
      "hint_level_1": "Giữ nguyên dòng đầu và thêm bốn console.log phía dưới.",
      "hint_level_2": "Các dòng còn thiếu là tên, tuổi, mục tiêu và đường viền cuối.",
      "hint_level_3": "Dùng console.log(\"noi dung\"); cho từng dòng của mẫu.",
      "common_mistakes": "In toàn bộ tấm thẻ trên một dòng; thiếu dấu hai chấm; sắp xếp sai các dòng; đường viền có số dấu = không đúng; in thêm lời giải thích.",
      "insight": "Một yêu cầu lớn có thể được chia thành từng dòng kết quả, rồi chuyển mỗi dòng thành một câu lệnh JavaScript nhỏ.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Xuất sắc! Bạn đã hoàn thành chương trình JavaScript nhỏ đầu tiên.",
      "failure_hint": "So sánh từng dòng với mẫu, đặc biệt là dấu hai chấm, khoảng trắng và hai đường viền.",
      "grading_mode": "test_cases",
      "debug_starter_code": "console.log(\"=== THE LAP TRINH ===\");\nconsole.log(\"Ten: An\");\nconsole.log(\"Tuoi: 18\");\nconsole.log(\"Muc tieu: Hoc JavaScript\";\nconsole.log(\"=====================\");",
      "debug_task_description": "Tấm danh thiếp không chạy vì một console.log() chưa hoàn chỉnh. Hãy sửa lỗi mà không thay đổi kết quả.",
      "debug_validation_rules": {"must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc JavaScript\n====================="},
      "debug_hint": "Kiểm tra cặp ngoặc tròn ở dòng in mục tiêu.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Chia chương trình thành từng dòng",
          "prompt": "Nhìn kết quả mẫu, tách nó thành năm dòng rồi tạo một console.log() cho mỗi dòng. Sau đó đặt các câu lệnh theo đúng thứ tự.",
          "options": null,
          "correct_answer": null,
          "explanation": "Chia yêu cầu lớn thành phần nhỏ giúp người mới biết bắt đầu từ đâu.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "fill_blank",
          "title": "Hoàn thiện dòng tên",
          "prompt": "Điền chuỗi còn thiếu: console.log(\"____\"); để hiển thị Ten: An",
          "options": null,
          "correct_answer": "Ten: An",
          "explanation": "Nội dung cần hiển thị được đặt trong dấu ngoặc kép.",
          "hint": "Điền chính xác dòng trong mẫu.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Tạo tấm thẻ ba dòng",
          "prompt": "Viết ba dòng console.log() để hiển thị === THE ===, Ten: An và =========.",
          "options": null,
          "correct_answer": "console.log(\"=== THE ===\");\nconsole.log(\"Ten: An\");\nconsole.log(\"=========\");",
          "explanation": "Mỗi phần của tấm thẻ được tạo bằng một câu lệnh riêng.",
          "hint": "Viết ba console.log() theo đúng thứ tự mẫu.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Đổi thứ tự kết quả",
          "prompt": "Muốn tuổi xuất hiện trước tên, bạn cần thay đổi điều gì?",
          "options": null,
          "correct_answer": "Di chuyển dòng console.log in tuổi lên trước dòng console.log in tên.",
          "explanation": "Vị trí câu lệnh quyết định thứ tự dòng kết quả.",
          "hint": "Không cần đổi chuỗi, chỉ đổi vị trí hai câu lệnh.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc JavaScript\n====================="},
          "description": "Hiển thị đầy đủ tấm danh thiếp JavaScript",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    }
  ]
}

$javascript_json$::jsonb;
  lesson_item jsonb;
  step_item jsonb;
  test_case_item jsonb;
  inserted_lesson_id uuid;
  seeded_lesson_ids text[];
  lesson_type_value text;
BEGIN
  SELECT id
  INTO target_chapter_id
  FROM chapters
  WHERE language_id = 'javascript'
    AND title = 'JavaScript đầu tiên của bạn'
  LIMIT 1;

  IF target_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Missing target chapter: language_id=javascript, title=JavaScript đầu tiên của bạn';
  END IF;

  SELECT array_agg(item->>'lesson_id')
  INTO seeded_lesson_ids
  FROM jsonb_array_elements(payload->'lessons') AS item;

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

  FOR lesson_item IN
    SELECT value FROM jsonb_array_elements(payload->'lessons')
  LOOP
    lesson_type_value := CASE lesson_item->>'lesson_id'
      WHEN 'javascript-chuong-trinh-dau-tien' THEN 'code_fix'
      WHEN 'javascript-hien-thi-van-ban' THEN 'code_fix'
      WHEN 'javascript-in-so-va-phep-tinh' THEN 'code_build'
      WHEN 'javascript-thu-tu-thuc-thi' THEN 'code_fix'
      WHEN 'javascript-comment' THEN 'code_fix'
      WHEN 'javascript-thu-thach-dau-tien' THEN 'code_build'
      ELSE 'code_fix'
    END;

    INSERT INTO lessons (
      chapter_id, lesson_id, lesson_type, title, description, code, insight,
      order_index, difficulty, estimated_time, starter_code, task_description,
      hint, hint_level_1, hint_level_2, hint_level_3, common_mistakes,
      solution_code, is_aha_lesson, status, validation_type, validation_rules,
      success_output, failure_hint, grading_mode, debug_starter_code,
      debug_task_description, debug_validation_rules, debug_hint
    ) VALUES (
      target_chapter_id,
      lesson_item->>'lesson_id',
      lesson_type_value,
      lesson_item->>'title',
      lesson_item->>'description',
      lesson_item->>'code',
      lesson_item->>'insight',
      (lesson_item->>'order_index')::integer,
      lesson_item->>'difficulty',
      (lesson_item->>'estimated_time')::integer,
      lesson_item->>'starter_code',
      lesson_item->>'task_description',
      lesson_item->>'hint',
      lesson_item->>'hint_level_1',
      lesson_item->>'hint_level_2',
      lesson_item->>'hint_level_3',
      lesson_item->>'common_mistakes',
      lesson_item->>'solution_code',
      COALESCE((lesson_item->>'is_aha_lesson')::boolean, false),
      COALESCE(lesson_item->>'status', 'published'),
      lesson_item->>'validation_type',
      COALESCE(lesson_item->'validation_rules', '{}'::jsonb),
      lesson_item->>'success_output',
      lesson_item->>'failure_hint',
      'stdout',
      lesson_item->>'debug_starter_code',
      lesson_item->>'debug_task_description',
      COALESCE(lesson_item->'debug_validation_rules', '{}'::jsonb),
      lesson_item->>'debug_hint'
    )
    RETURNING id INTO inserted_lesson_id;

    FOR step_item IN
      SELECT value FROM jsonb_array_elements(COALESCE(lesson_item->'lesson_steps', '[]'::jsonb))
    LOOP
      INSERT INTO lesson_steps (
        lesson_id, type, title, prompt, options, correct_answer,
        explanation, hint, is_required, order_index
      ) VALUES (
        inserted_lesson_id,
        step_item->>'type',
        step_item->>'title',
        step_item->>'prompt',
        CASE
          WHEN step_item ? 'options' AND step_item->'options' <> 'null'::jsonb
            THEN step_item->'options'
          ELSE '[]'::jsonb
        END,
        CASE
          WHEN step_item ? 'correct_answer' AND step_item->'correct_answer' <> 'null'::jsonb
            THEN step_item->'correct_answer'
          ELSE NULL
        END,
        step_item->>'explanation',
        step_item->>'hint',
        COALESCE((step_item->>'is_required')::boolean, true),
        COALESCE((step_item->>'order_index')::integer, 1)
      );
    END LOOP;

    FOR test_case_item IN
      SELECT value FROM jsonb_array_elements(COALESCE(lesson_item->'lesson_test_cases', '[]'::jsonb))
    LOOP
      INSERT INTO lesson_test_cases (
        lesson_id, input, expected_output, description, is_hidden, order_index
      ) VALUES (
        inserted_lesson_id,
        to_jsonb(COALESCE(test_case_item->'input'->>'stdin', '')),
        to_jsonb(COALESCE(test_case_item->'expected_output'->>'stdout', '')),
        test_case_item->>'description',
        COALESCE((test_case_item->>'is_hidden')::boolean, false),
        COALESCE((test_case_item->>'order_index')::integer, 1)
      );
    END LOOP;
  END LOOP;
END $$;

COMMIT;
