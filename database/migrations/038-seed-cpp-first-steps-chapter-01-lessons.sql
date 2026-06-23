-- 038-seed-cpp-first-steps-chapter-01-lessons.sql
-- Seed: C++ / first_steps / Chapter 01.
-- Source: docs/data/cpp_first_steps_chapter_01_complete.json
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
  payload jsonb := $cpp_json$
{
  "lessons": [
    {
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-chuong-trinh-dau-tien",
      "title": "Chương trình C++ đầu tiên",
      "description": "Làm quen với khung cơ bản của một chương trình C++ và chạy lệnh đầu tiên. Người học chưa cần ghi nhớ toàn bộ khung code mà chỉ tập trung vào dòng std::cout tạo ra kết quả trên màn hình.",
      "order_index": 1,
      "difficulty": "beginner",
      "estimated_time": 12,
      "status": "published",
      "is_aha_lesson": true,
      "code": "#include <iostream>\n\nint main() {\n    std::cout << \"Xin chao, C++!\" << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Xin chao!\" << std::endl;\n    return 0;\n}",
      "task_description": "Chỉ thay đổi phần văn bản trong dòng std::cout để chương trình hiển thị chính xác: Xin chao, C++!",
      "solution_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Xin chao, C++!\" << std::endl;\n    return 0;\n}",
      "hint": "Giữ nguyên khung chương trình và chỉ sửa nội dung nằm giữa hai dấu ngoặc kép.",
      "hint_level_1": "Tìm dòng chứa std::cout.",
      "hint_level_2": "Không thay đổi #include, main() hoặc return 0.",
      "hint_level_3": "Dòng cần có là std::cout << \"Xin chao, C++!\" << std::endl;.",
      "common_mistakes": "Xóa nhầm dấu chấm phẩy; thiếu một dấu ngoặc kép; viết cout nhưng bỏ std::; thay đổi hoặc xóa dấu ngoặc nhọn của main().",
      "insight": "Một chương trình C++ có phần khung và phần công việc chính. Ở bước đầu, bạn có thể chỉnh một dòng bên trong khung và tạo ra kết quả mà chưa cần hiểu mọi chi tiết.",
      "validation_type": "stdout",
      "validation_rules": {
        "comparison": "exact",
        "trim_output": true,
        "case_sensitive": true
      },
      "success_output": "Tuyệt vời! Bạn vừa sửa, biên dịch và chạy chương trình C++ đầu tiên.",
      "failure_hint": "Kiểm tra lại nội dung trong dấu ngoặc kép và dấu chấm phẩy ở cuối dòng std::cout.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Xin chao, C++!\" << std::endl\n    return 0;\n}",
      "debug_task_description": "Chương trình thiếu một ký tự ở cuối dòng std::cout nên không biên dịch được. Hãy sửa để in ra Xin chao, C++!.",
      "debug_validation_rules": {
        "must_compile": true,
        "must_run_without_error": true,
        "comparison": "exact",
        "trim_output": true,
        "case_sensitive": true,
        "expected_stdout": "Xin chao, C++!"
      },
      "debug_hint": "Mỗi câu lệnh C++ trong ví dụ này cần kết thúc bằng dấu chấm phẩy.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Nhìn vào khung chương trình",
          "prompt": "#include <iostream> chuẩn bị công cụ xuất dữ liệu, main() là nơi chương trình bắt đầu và return 0 báo chương trình kết thúc bình thường. Hiện tại, bạn chỉ cần tập trung vào dòng std::cout.",
          "options": null,
          "correct_answer": null,
          "explanation": "Tách phần cần học khỏi phần khung giúp người mới không phải ghi nhớ quá nhiều cú pháp cùng lúc.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Dòng nào tạo kết quả?",
          "prompt": "Trong chương trình mẫu, phần nào trực tiếp hiển thị lời chào?",
          "options": [
            "#include <iostream>",
            "int main()",
            "std::cout",
            "return 0"
          ],
          "correct_answer": "std::cout",
          "explanation": "std::cout là đối tượng xuất dữ liệu ra màn hình trong các bài C++ đầu tiên.",
          "hint": "Tên này chứa từ out, gợi ý việc đưa dữ liệu ra ngoài.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "true_false",
          "title": "Dấu kết thúc câu lệnh",
          "prompt": "Dòng std::cout trong ví dụ cần kết thúc bằng dấu chấm phẩy.",
          "options": [true, false],
          "correct_answer": true,
          "explanation": "Dấu ; đánh dấu điểm kết thúc của câu lệnh std::cout.",
          "hint": "Quan sát ký tự cuối dòng code mẫu.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "fill_blank",
          "title": "Điền công cụ xuất dữ liệu",
          "prompt": "Điền phần còn thiếu: std::____ << \"Hello!\";",
          "options": null,
          "correct_answer": "cout",
          "explanation": "Tên đầy đủ là std::cout.",
          "hint": "Đáp án bắt đầu bằng c và kết thúc bằng out.",
          "is_required": true,
          "order_index": 4
        },
        {
          "type": "code_prompt",
          "title": "Lời chào C++",
          "prompt": "Viết dòng std::cout để hiển thị Xin chao, C++! và kết thúc dòng bằng std::endl.",
          "options": null,
          "correct_answer": "std::cout << \"Xin chao, C++!\" << std::endl;",
          "explanation": "Dữ liệu được đưa vào std::cout bằng <<, còn std::endl tạo dòng mới.",
          "hint": "Nhớ dấu ; ở cuối câu lệnh.",
          "is_required": true,
          "order_index": 5
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Xin chao, C++!"},
          "description": "Hiển thị chính xác lời chào C++ đầu tiên",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-hien-thi-van-ban-voi-cout",
      "title": "Hiển thị văn bản với std::cout",
      "description": "Tìm hiểu cách đặt văn bản trong dấu ngoặc kép, đưa nó vào std::cout bằng toán tử << và dùng std::endl để chuyển sang dòng mới.",
      "order_index": 2,
      "difficulty": "beginner",
      "estimated_time": 15,
      "status": "published",
      "is_aha_lesson": false,
      "code": "#include <iostream>\n\nint main() {\n    std::cout << \"Dong thu nhat\" << std::endl;\n    std::cout << \"Dong thu hai\" << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Toi dang hoc C++. << std::endl;\n    std::cout << \"Lap trinh rat thu vi!\" << std::endl;\n    return 0;\n}",
      "task_description": "Sửa lỗi ở dòng std::cout đầu tiên để chương trình hiển thị đúng hai dòng: Toi dang hoc C++. và Lap trinh rat thu vi!",
      "solution_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Toi dang hoc C++.\" << std::endl;\n    std::cout << \"Lap trinh rat thu vi!\" << std::endl;\n    return 0;\n}",
      "hint": "Chuỗi ở dòng đầu chưa có dấu ngoặc kép đóng đúng vị trí.",
      "hint_level_1": "Lỗi nằm ngay sau dấu chấm trong C++.",
      "hint_level_2": "Đóng chuỗi trước toán tử << dẫn tới std::endl.",
      "hint_level_3": "Phần đúng là \"Toi dang hoc C++.\" << std::endl;.",
      "common_mistakes": "Thiếu dấu ngoặc kép đóng; dùng một dấu < thay vì <<; quên std:: trước cout hoặc endl; quên dấu chấm phẩy cuối câu lệnh.",
      "insight": "Dấu ngoặc kép đánh dấu văn bản, << chỉ hướng dữ liệu đi vào std::cout và std::endl kết thúc dòng hiện tại.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Chính xác! Bạn đã sửa chuỗi và tạo kết quả gồm hai dòng trong C++.",
      "failure_hint": "Kiểm tra cặp ngoặc kép, các toán tử << và thứ tự hai dòng kết quả.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    std::cout \"Xin chao!\" << std::endl;\n    return 0;\n}",
      "debug_task_description": "Dòng xuất dữ liệu đang thiếu toán tử. Hãy sửa để chương trình in ra Xin chao!.",
      "debug_validation_rules": {"must_compile": true, "must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Xin chao!"},
      "debug_hint": "Thêm << ngay sau std::cout.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Đưa dữ liệu ra màn hình",
          "prompt": "Trong std::cout << \"Xin chao\";, toán tử << đưa chuỗi ở bên phải vào luồng kết quả ở bên trái. std::endl có thể được nối thêm để xuống dòng.",
          "options": null,
          "correct_answer": null,
          "explanation": "Cách đọc đơn giản là: đưa nội dung này vào cout.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Chọn câu lệnh hợp lệ",
          "prompt": "Câu lệnh nào hiển thị Xin chao đúng cú pháp?",
          "options": [
            "std::cout \"Xin chao\";",
            "std::cout << \"Xin chao\";",
            "cout >> \"Xin chao\";",
            "std::Print(\"Xin chao\");"
          ],
          "correct_answer": "std::cout << \"Xin chao\";",
          "explanation": "std::cout dùng toán tử << để nhận dữ liệu cần hiển thị.",
          "hint": "Tìm đáp án có std::cout, << và dấu ;.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Sửa chuỗi chưa hoàn chỉnh",
          "prompt": "Sửa dòng sau: std::cout << \"Hoc C++ << std::endl;",
          "options": null,
          "correct_answer": "std::cout << \"Hoc C++\" << std::endl;",
          "explanation": "Cần đóng chuỗi bằng dấu ngoặc kép trước khi nối std::endl.",
          "hint": "Chuỗi có dấu mở nhưng chưa có dấu đóng.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Vai trò của std::endl",
          "prompt": "std::endl giúp thay đổi kết quả hiển thị như thế nào?",
          "options": null,
          "correct_answer": "std::endl kết thúc dòng hiện tại để nội dung tiếp theo xuất hiện ở dòng mới.",
          "explanation": "Trong chapter đầu, có thể hiểu std::endl như thao tác xuống dòng.",
          "hint": "Hãy nghĩ đến phím Enter khi viết văn bản.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "Toi dang hoc C++.\nLap trinh rat thu vi!"},
          "description": "Sửa lỗi và hiển thị hai câu trên hai dòng",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    },
    {
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-in-so-va-phep-tinh",
      "title": "In số và kết quả phép tính",
      "description": "Khám phá cách std::cout hiển thị số và kết quả của biểu thức. Người học dùng C++ như một máy tính nhỏ mà chưa cần khai báo biến.",
      "order_index": 3,
      "difficulty": "beginner",
      "estimated_time": 15,
      "status": "published",
      "is_aha_lesson": false,
      "code": "#include <iostream>\n\nint main() {\n    std::cout << 2 + 3 << std::endl;\n    std::cout << 4 * 2 << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    // Thay cac so 0 bang phep tinh phu hop\n    std::cout << 0 << std::endl;\n    std::cout << 0 << std::endl;\n    std::cout << 0 << std::endl;\n    return 0;\n}",
      "task_description": "Thay ba số 0 bằng biểu thức C++. Dòng 1 dùng 3 + 5, dòng 2 dùng 4 * 3 và dòng 3 dùng 20 - 6. Kết quả cần in là 8, 12 và 14.",
      "solution_code": "#include <iostream>\n\nint main() {\n    std::cout << 3 + 5 << std::endl;\n    std::cout << 4 * 3 << std::endl;\n    std::cout << 20 - 6 << std::endl;\n    return 0;\n}",
      "hint": "Viết biểu thức trực tiếp sau << và không đặt phép tính trong dấu ngoặc kép.",
      "hint_level_1": "Bạn cần lần lượt dùng phép cộng, nhân và trừ.",
      "hint_level_2": "C++ dùng dấu * cho phép nhân.",
      "hint_level_3": "Ba biểu thức là 3 + 5, 4 * 3 và 20 - 6.",
      "common_mistakes": "Đặt biểu thức trong dấu ngoặc kép; dùng chữ x thay cho *; viết trực tiếp kết quả thay vì biểu thức; đặt std::endl vào giữa phép tính.",
      "insight": "Khi biểu thức số không nằm trong dấu ngoặc kép, C++ tính biểu thức trước rồi std::cout mới hiển thị kết quả.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Hoàn thành! Bạn đã dùng C++ để tính và hiển thị ba kết quả.",
      "failure_hint": "Kiểm tra toán tử, thứ tự ba dòng và bảo đảm phép tính không nằm trong dấu ngoặc kép.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    std::cout << 7 + << std::endl;\n    return 0;\n}",
      "debug_task_description": "Biểu thức đang thiếu một số. Hãy sửa để chương trình tính và in ra 12.",
      "debug_validation_rules": {"must_compile": true, "must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "12"},
      "debug_hint": "Thêm số 5 vào bên phải dấu cộng.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Tính trước, hiển thị sau",
          "prompt": "Với std::cout << 2 + 3;, C++ tính 2 + 3 thành 5 rồi đưa số 5 ra màn hình.",
          "options": null,
          "correct_answer": null,
          "explanation": "Biểu thức được đánh giá trước khi kết quả được gửi vào std::cout.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "fill_blank",
          "title": "Điền toán tử",
          "prompt": "Điền toán tử để có kết quả 15: std::cout << 3 __ 5;",
          "options": null,
          "correct_answer": "*",
          "explanation": "Dấu * là toán tử nhân trong C++.",
          "hint": "Không dùng chữ x.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Tạo hai kết quả",
          "prompt": "Viết hai dòng std::cout để dùng phép cộng in 10 và phép trừ in 6. Mỗi kết quả nằm trên một dòng.",
          "options": null,
          "correct_answer": "std::cout << 4 + 6 << std::endl;\nstd::cout << 10 - 4 << std::endl;",
          "explanation": "Đáp án mẫu dùng 4 + 6 và 10 - 4; các biểu thức tương đương cũng đúng về ý tưởng.",
          "hint": "Mỗi biểu thức đặt sau một toán tử <<.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Chuỗi hay phép tính?",
          "prompt": "std::cout << \"3 + 5\"; khác std::cout << 3 + 5; như thế nào?",
          "options": null,
          "correct_answer": "Dòng đầu in nguyên văn 3 + 5, còn dòng sau tính phép cộng và in 8.",
          "explanation": "Dấu ngoặc kép biến nội dung thành văn bản nên phép tính không được thực hiện.",
          "hint": "Chú ý dấu ngoặc kép ở dòng đầu.",
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
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-thu-tu-thuc-thi",
      "title": "Nhiều câu lệnh và thứ tự thực thi",
      "description": "Quan sát cách các câu lệnh trong main() thường được thực hiện từ trên xuống dưới và sắp xếp chúng để tạo đúng trình tự.",
      "order_index": 4,
      "difficulty": "beginner",
      "estimated_time": 15,
      "status": "published",
      "is_aha_lesson": false,
      "code": "#include <iostream>\n\nint main() {\n    std::cout << \"Buoc 1\" << std::endl;\n    std::cout << \"Buoc 2\" << std::endl;\n    std::cout << \"Buoc 3\" << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Buoc 2: Viet code\" << std::endl;\n    std::cout << \"Buoc 1: Doc yeu cau\" << std::endl;\n    std::cout << \"Buoc 3: Chay chuong trinh\" << std::endl;\n    return 0;\n}",
      "task_description": "Sắp xếp lại ba dòng std::cout để kết quả xuất hiện theo đúng thứ tự từ bước 1 đến bước 3. Không thay đổi nội dung chuỗi.",
      "solution_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Buoc 1: Doc yeu cau\" << std::endl;\n    std::cout << \"Buoc 2: Viet code\" << std::endl;\n    std::cout << \"Buoc 3: Chay chuong trinh\" << std::endl;\n    return 0;\n}",
      "hint": "Dòng nằm trên trong main() được thực hiện trước dòng nằm dưới.",
      "hint_level_1": "Đưa dòng chứa Buoc 1 lên đầu.",
      "hint_level_2": "Sau bước 1 phải là bước 2.",
      "hint_level_3": "Thứ tự là Doc yeu cau, Viet code rồi Chay chuong trinh.",
      "common_mistakes": "Đổi số trong chuỗi thay vì di chuyển câu lệnh; xóa dấu ; khi sắp xếp; để bước 3 trước bước 2; di chuyển câu lệnh ra ngoài main().",
      "insight": "Cùng các câu lệnh nhưng thứ tự khác nhau sẽ tạo ra một trình tự kết quả khác nhau.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Chính xác! Bạn đã điều khiển thứ tự thực thi trong main().",
      "failure_hint": "Đọc kết quả từ trên xuống và kiểm tra các bước đã theo thứ tự 1, 2, 3 chưa.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Dong 1\" << std::endl\n    std::cout << \"Dong 2\" << std::endl;\n    return 0;\n}",
      "debug_task_description": "Dòng đầu thiếu ký tự kết thúc câu lệnh. Hãy sửa để chương trình in Dong 1 rồi Dong 2.",
      "debug_validation_rules": {"must_compile": true, "must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Dong 1\nDong 2"},
      "debug_hint": "Kiểm tra ký tự cuối của dòng std::cout đầu tiên.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Thứ tự trong main()",
          "prompt": "Trong chương trình đơn giản, các câu lệnh bên trong main() thường chạy từ trên xuống dưới. Vì vậy, vị trí của từng std::cout quyết định thứ tự kết quả.",
          "options": null,
          "correct_answer": null,
          "explanation": "Đọc code theo thứ tự giúp dự đoán chương trình sẽ làm gì trước và sau.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Dự đoán dòng đầu",
          "prompt": "Nếu dòng in A nằm trên dòng in B, nội dung nào thường xuất hiện trước?",
          "options": ["A", "B", "AB cùng lúc", "Không có nội dung"],
          "correct_answer": "A",
          "explanation": "Dòng std::cout in A được thực hiện trước.",
          "hint": "Nhìn vào vị trí dòng code.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "true_false",
          "title": "Di chuyển câu lệnh",
          "prompt": "Đổi vị trí hai dòng std::cout có thể làm thay đổi thứ tự kết quả.",
          "options": [true, false],
          "correct_answer": true,
          "explanation": "Thứ tự code thay đổi thì thứ tự hai lần xuất dữ liệu cũng thay đổi.",
          "hint": "Mỗi dòng được chạy theo vị trí của nó.",
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
          "prompt": "Viết ba dòng std::cout để lần lượt in Bat dau, Dang chay và Ket thuc, mỗi nội dung trên một dòng.",
          "options": null,
          "correct_answer": "std::cout << \"Bat dau\" << std::endl;\nstd::cout << \"Dang chay\" << std::endl;\nstd::cout << \"Ket thuc\" << std::endl;",
          "explanation": "Ba câu lệnh được đặt theo đúng trình tự cần hiển thị.",
          "hint": "Mỗi dòng cần std::cout, <<, std::endl và dấu ;.",
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
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-comment",
      "title": "Ghi chú bằng comment",
      "description": "Tìm hiểu comment một dòng bắt đầu bằng // trong C++. Người học sửa lỗi do một dòng giải thích chưa được đánh dấu và dùng comment để tạm bỏ qua một câu lệnh.",
      "order_index": 5,
      "difficulty": "beginner",
      "estimated_time": 12,
      "status": "published",
      "is_aha_lesson": false,
      "code": "#include <iostream>\n\nint main() {\n    // Dong nay la ghi chu\n    std::cout << \"Dong nay duoc chay\" << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"Bat dau\" << std::endl;\n    std::cout << \"Dong thu nghiem\" << std::endl;\n    std::cout << \"Hoan thanh\" << std::endl;\n    return 0;\n}",
      "task_description": "Thêm một comment mô tả chương trình. Sau đó biến dòng in Dong thu nghiem thành comment để kết quả chỉ còn Bat dau và Hoan thanh.",
      "solution_code": "#include <iostream>\n\nint main() {\n    // Chuong trinh minh hoa comment\n    std::cout << \"Bat dau\" << std::endl;\n    // std::cout << \"Dong thu nghiem\" << std::endl;\n    std::cout << \"Hoan thanh\" << std::endl;\n    return 0;\n}",
      "hint": "Comment một dòng trong C++ bắt đầu bằng //.",
      "hint_level_1": "Đặt // trước câu lệnh bạn không muốn chạy.",
      "hint_level_2": "Dòng in Dong thu nghiem cần trở thành comment.",
      "hint_level_3": "Viết // trước std::cout ở dòng thử nghiệm.",
      "common_mistakes": "Dùng # như comment của Python; chỉ dùng một dấu /; đặt // sau câu lệnh nên câu lệnh vẫn chạy; comment nhầm dấu ngoặc nhọn của main().",
      "insight": "Comment vẫn tồn tại để con người đọc nhưng được trình biên dịch bỏ qua. Nó giúp giải thích hoặc tạm tắt code mà không xóa code.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Đúng rồi! Comment đã giúp C++ bỏ qua dòng thử nghiệm.",
      "failure_hint": "Nếu Dong thu nghiem vẫn xuất hiện, // chưa nằm trước dòng std::cout tương ứng.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    Day la chuong trinh dau tien\n    std::cout << \"Xin chao!\" << std::endl;\n    return 0;\n}",
      "debug_task_description": "Dòng giải thích đang bị hiểu là code. Hãy biến nó thành comment để chương trình biên dịch và in Xin chao!.",
      "debug_validation_rules": {"must_compile": true, "must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "Xin chao!"},
      "debug_hint": "Thêm // vào đầu dòng giải thích.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Comment dành cho người đọc",
          "prompt": "Hai dấu // khiến phần còn lại của dòng trở thành comment. Trình biên dịch bỏ qua comment nên nó không tạo kết quả.",
          "options": null,
          "correct_answer": null,
          "explanation": "Comment giúp code dễ đọc hơn mà không thay đổi hành vi chương trình.",
          "hint": null,
          "is_required": true,
          "order_index": 1
        },
        {
          "type": "multiple_choice",
          "title": "Nhận diện comment C++",
          "prompt": "Dòng nào là comment một dòng hợp lệ trong C++?",
          "options": ["# In loi chao", "// In loi chao", "-- In loi chao", "std::comment In loi chao"],
          "correct_answer": "// In loi chao",
          "explanation": "C++ dùng // cho comment một dòng.",
          "hint": "Ký hiệu gồm hai dấu gạch chéo.",
          "is_required": true,
          "order_index": 2
        },
        {
          "type": "code_prompt",
          "title": "Tạm bỏ qua câu lệnh",
          "prompt": "Biến std::cout << \"Khong in\"; thành comment.",
          "options": null,
          "correct_answer": "// std::cout << \"Khong in\";",
          "explanation": "Đặt // ở đầu khiến toàn bộ câu lệnh phía sau bị bỏ qua.",
          "hint": "Không xóa code, chỉ thêm hai ký tự.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Tại sao cần comment?",
          "prompt": "Comment có ích gì nếu trình biên dịch không thực hiện nó?",
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
      "language_id": "cpp",
      "goal_id": "first_steps",
      "chapter_title": "C++ đầu tiên của bạn",
      "lesson_id": "cpp-thu-thach-dau-tien",
      "title": "Thử thách: Tấm danh thiếp C++",
      "description": "Kết hợp khung main(), std::cout, std::endl, thứ tự thực thi và comment để hoàn thành chương trình C++ nhỏ đầu tiên.",
      "order_index": 6,
      "difficulty": "beginner",
      "estimated_time": 22,
      "status": "published",
      "is_aha_lesson": true,
      "code": "#include <iostream>\n\nint main() {\n    // Mot tam the don gian\n    std::cout << \"=== HOC VIEN ===\" << std::endl;\n    std::cout << \"Ten: Binh\" << std::endl;\n    return 0;\n}",
      "starter_code": "#include <iostream>\n\nint main() {\n    // Hoan thanh tam danh thiep cua An\n    std::cout << \"=== THE LAP TRINH ===\" << std::endl;\n    // Viet cac dong con lai o ben duoi\n    return 0;\n}",
      "task_description": "Hoàn thiện tấm danh thiếp bằng năm dòng std::cout. Kết quả phải là:\n=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc C++\n=====================",
      "solution_code": "#include <iostream>\n\nint main() {\n    // Tam danh thiep cua An\n    std::cout << \"=== THE LAP TRINH ===\" << std::endl;\n    std::cout << \"Ten: An\" << std::endl;\n    std::cout << \"Tuoi: 18\" << std::endl;\n    std::cout << \"Muc tieu: Hoc C++\" << std::endl;\n    std::cout << \"=====================\" << std::endl;\n    return 0;\n}",
      "hint": "Mỗi dòng kết quả tương ứng với một dòng std::cout.",
      "hint_level_1": "Giữ nguyên dòng đầu và thêm bốn dòng std::cout phía dưới.",
      "hint_level_2": "Các dòng còn thiếu là tên, tuổi, mục tiêu và đường viền cuối.",
      "hint_level_3": "Mỗi dòng dùng std::cout << \"noi dung\" << std::endl;.",
      "common_mistakes": "Quên dấu ; ở cuối dòng; thiếu << trước std::endl; in sai thứ tự; thiếu std:: trước cout; đặt một câu lệnh ra ngoài main().",
      "insight": "Một yêu cầu lớn có thể được chia thành từng dòng kết quả, rồi chuyển mỗi dòng thành một câu lệnh C++ nhỏ.",
      "validation_type": "stdout",
      "validation_rules": {"comparison": "exact", "trim_output": true, "case_sensitive": true},
      "success_output": "Xuất sắc! Bạn đã hoàn thành chương trình C++ nhỏ đầu tiên.",
      "failure_hint": "So sánh từng dòng với mẫu và kiểm tra dấu ;, toán tử << cùng std::endl.",
      "grading_mode": "test_cases",
      "debug_starter_code": "#include <iostream>\n\nint main() {\n    std::cout << \"=== THE LAP TRINH ===\" << std::endl;\n    std::cout << \"Ten: An\" << std::endl;\n    std::cout << \"Tuoi: 18\" << std::endl;\n    std::cout << \"Muc tieu: Hoc C++\" << std::endl\n    std::cout << \"=====================\" << std::endl;\n    return 0;\n}",
      "debug_task_description": "Tấm danh thiếp không biên dịch vì một câu lệnh chưa kết thúc đúng cách. Hãy sửa mà không thay đổi kết quả.",
      "debug_validation_rules": {"must_compile": true, "must_run_without_error": true, "comparison": "exact", "trim_output": true, "case_sensitive": true, "expected_stdout": "=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc C++\n====================="},
      "debug_hint": "Kiểm tra cuối dòng in mục tiêu.",
      "lesson_steps": [
        {
          "type": "note",
          "title": "Chia chương trình thành từng dòng",
          "prompt": "Nhìn kết quả mẫu, tách nó thành năm dòng rồi tạo một std::cout cho mỗi dòng. Cuối cùng, đặt các câu lệnh theo đúng thứ tự bên trong main().",
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
          "prompt": "Điền chuỗi còn thiếu: std::cout << \"____\" << std::endl; để hiển thị Ten: An",
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
          "prompt": "Viết ba dòng std::cout để hiển thị === THE ===, Ten: An và =========.",
          "options": null,
          "correct_answer": "std::cout << \"=== THE ===\" << std::endl;\nstd::cout << \"Ten: An\" << std::endl;\nstd::cout << \"=========\" << std::endl;",
          "explanation": "Mỗi phần của tấm thẻ được tạo bằng một câu lệnh xuất dữ liệu.",
          "hint": "Mỗi câu lệnh kết thúc bằng std::endl và dấu ;.",
          "is_required": true,
          "order_index": 3
        },
        {
          "type": "short_answer",
          "title": "Đổi thứ tự kết quả",
          "prompt": "Muốn tuổi xuất hiện trước tên, bạn cần thay đổi điều gì?",
          "options": null,
          "correct_answer": "Di chuyển dòng std::cout in tuổi lên trước dòng std::cout in tên.",
          "explanation": "Vị trí câu lệnh quyết định thứ tự dòng kết quả.",
          "hint": "Không cần đổi chuỗi, chỉ đổi vị trí hai câu lệnh.",
          "is_required": true,
          "order_index": 4
        }
      ],
      "lesson_test_cases": [
        {
          "input": {"stdin": ""},
          "expected_output": {"stdout": "=== THE LAP TRINH ===\nTen: An\nTuoi: 18\nMuc tieu: Hoc C++\n====================="},
          "description": "Hiển thị đầy đủ tấm danh thiếp C++",
          "weight": 10,
          "timeout": 1000,
          "is_hidden": false,
          "order_index": 1
        }
      ]
    }
  ]
}

$cpp_json$::jsonb;
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
  WHERE language_id = 'cpp'
    AND title = 'C++ đầu tiên của bạn'
  LIMIT 1;

  IF target_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Missing target chapter: language_id=cpp, title=C++ đầu tiên của bạn';
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
      WHEN 'cpp-chuong-trinh-dau-tien' THEN 'code_fix'
      WHEN 'cpp-hien-thi-van-ban-voi-cout' THEN 'code_fix'
      WHEN 'cpp-in-so-va-phep-tinh' THEN 'code_build'
      WHEN 'cpp-thu-tu-thuc-thi' THEN 'code_fix'
      WHEN 'cpp-comment' THEN 'code_fix'
      WHEN 'cpp-thu-thach-dau-tien' THEN 'code_build'
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
