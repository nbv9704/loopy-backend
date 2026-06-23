-- 040-seed-official-practice-sets.sql
-- Seed official Practice Sets for newbie-first quiz practice.
-- Practice is separate from Learn: these sets do not complete lessons.

BEGIN;

DO $$
DECLARE
  payload jsonb := $practice_sets$
[
  {
    "title": "JavaScript: Console & output cơ bản",
    "description": "Ôn cách dùng console.log(), nhận diện output và lỗi cú pháp rất thường gặp ở bài JavaScript đầu tiên.",
    "topic": "console.log, output, syntax",
    "language_id": "javascript",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Lệnh in ra console","prompt":"Lệnh nào hiển thị chữ Xin chao trong JavaScript?","options":["print(\"Xin chao\")","console.log(\"Xin chao\");","cout << \"Xin chao\";","Console.WriteLine(\"Xin chao\");"],"correct_answer":"console.log(\"Xin chao\");","explanation":"JavaScript chạy bằng Node.js thường dùng console.log() để ghi nội dung ra stdout."},
      {"type":"true_false","title":"Chữ hoa chữ thường","prompt":"Trong JavaScript, console.log và Console.log là giống nhau.","correct_answer":"false","explanation":"JavaScript phân biệt chữ hoa và chữ thường. Tên đúng là console.log."},
      {"type":"fill_blank","title":"Điền method","prompt":"Điền phần còn thiếu: console.____(\"Hello\");","correct_answer":"log","explanation":"Tên method là log."},
      {"type":"multiple_select","title":"Dòng hợp lệ","prompt":"Chọn tất cả dòng JavaScript hợp lệ để in văn bản.","options":["console.log(\"A\");","console.log(A);","console.log(\"B\");","Console.log(\"C\");"],"correct_answer":"[\"console.log(\\\"A\\\");\",\"console.log(\\\"B\\\");\"]","explanation":"Văn bản cần đặt trong dấu ngoặc kép và tên đúng là console.log."}
    ]
  },
  {
    "title": "JavaScript: Chuỗi, số và phép tính",
    "description": "Phân biệt chuỗi với biểu thức số học khi đưa vào console.log().",
    "topic": "strings, numbers, arithmetic",
    "language_id": "javascript",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Kết quả phép cộng","prompt":"console.log(3 + 5); hiển thị gì?","options":["3 + 5","8","35","Không chạy"],"correct_answer":"8","explanation":"Không có dấu ngoặc kép nên JavaScript tính biểu thức trước rồi in kết quả."},
      {"type":"multiple_choice","title":"Chuỗi nguyên văn","prompt":"console.log(\"3 + 5\"); hiển thị gì?","options":["8","35","3 + 5","Lỗi cú pháp"],"correct_answer":"3 + 5","explanation":"Dấu ngoặc kép biến 3 + 5 thành chuỗi, nên chương trình in nguyên văn."},
      {"type":"fill_blank","title":"Toán tử nhân","prompt":"Điền toán tử để có kết quả 12: console.log(3 __ 4);","correct_answer":"*","explanation":"JavaScript dùng dấu * cho phép nhân."},
      {"type":"true_false","title":"Số trong ngoặc kép","prompt":"console.log(\"10\") và console.log(10) đều hiển thị 10, nhưng giá trị đầu là chuỗi còn giá trị sau là số.","correct_answer":"true","explanation":"Output nhìn giống nhau, nhưng kiểu dữ liệu bên trong khác nhau."}
    ]
  },
  {
    "title": "JavaScript: Thứ tự chạy và comment",
    "description": "Luyện đọc chương trình từ trên xuống và hiểu comment một dòng bằng //.",
    "topic": "execution order, comments",
    "language_id": "javascript",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Dòng chạy trước","prompt":"Nếu console.log(\"A\") nằm trên console.log(\"B\"), dòng nào xuất hiện trước?","options":["A","B","Cả hai cùng lúc","Không dòng nào"],"correct_answer":"A","explanation":"Chương trình đơn giản chạy từ trên xuống dưới."},
      {"type":"true_false","title":"Đổi vị trí dòng code","prompt":"Đổi vị trí hai dòng console.log() có thể làm đổi thứ tự output.","correct_answer":"true","explanation":"Thứ tự câu lệnh quyết định thứ tự hiển thị."},
      {"type":"multiple_choice","title":"Comment một dòng","prompt":"Ký hiệu comment một dòng trong JavaScript là gì?","options":["#","//","--","/* only"],"correct_answer":"//","explanation":"JavaScript dùng // để biến phần còn lại của dòng thành comment."},
      {"type":"multiple_select","title":"Code bị bỏ qua","prompt":"Dòng nào sẽ không tạo output?","options":["// console.log(\"A\");","console.log(\"B\");","// Ghi chú","console.log(\"C\");"],"correct_answer":"[\"// console.log(\\\"A\\\");\",\"// Ghi chú\"]","explanation":"Các dòng bắt đầu bằng // là comment và bị JavaScript bỏ qua."}
    ]
  },
  {
    "title": "Python: Print và text cơ bản",
    "description": "Ôn cách in văn bản với print(), dấu ngoặc và dấu nháy trong Python.",
    "topic": "print, strings, syntax",
    "language_id": "python",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Lệnh print đúng","prompt":"Dòng nào in ra Xin chao trong Python?","options":["print(\"Xin chao\")","console.log(\"Xin chao\")","cout << \"Xin chao\"","print Xin chao"],"correct_answer":"print(\"Xin chao\")","explanation":"Python dùng print() để hiển thị nội dung."},
      {"type":"true_false","title":"Dấu nháy cho text","prompt":"Trong Python, văn bản thường cần đặt trong dấu nháy.","correct_answer":"true","explanation":"Chuỗi văn bản cần ranh giới bằng dấu nháy đơn hoặc nháy kép."},
      {"type":"fill_blank","title":"Điền hàm","prompt":"Điền tên hàm: ____(\"Hello\")","correct_answer":"print","explanation":"Hàm in ra màn hình là print."},
      {"type":"multiple_select","title":"Dòng Python hợp lệ","prompt":"Chọn các dòng Python hợp lệ.","options":["print(\"A\")","print(A)","print('B')","console.log('C')"],"correct_answer":"[\"print(\\\"A\\\")\",\"print('B')\"]","explanation":"Chuỗi A/B được đặt trong dấu nháy và dùng print()."}
    ]
  },
  {
    "title": "Python: Biến và phép tính nhập môn",
    "description": "Luyện biến, phép tính đơn giản và output khi học Python những bước đầu.",
    "topic": "variables, arithmetic",
    "language_id": "python",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Gán biến","prompt":"Dòng nào gán giá trị 18 cho biến age trong Python?","options":["age = 18","let age = 18","int age = 18;","age :=: 18"],"correct_answer":"age = 18","explanation":"Python dùng dấu = để gán giá trị cho biến."},
      {"type":"multiple_choice","title":"In biến","prompt":"Nếu age = 18, print(age) hiển thị gì?","options":["age","18","print(age)","Lỗi vì thiếu dấu nháy"],"correct_answer":"18","explanation":"Không có dấu nháy nên Python lấy giá trị của biến age."},
      {"type":"fill_blank","title":"Kết quả phép tính","prompt":"2 + 3 * 4 bằng bao nhiêu?","correct_answer":"14","explanation":"Phép nhân được tính trước phép cộng."},
      {"type":"true_false","title":"Tên biến có khoảng trắng","prompt":"Tên biến Python có thể chứa khoảng trắng, ví dụ my age = 18.","correct_answer":"false","explanation":"Tên biến không được chứa khoảng trắng."}
    ]
  },
  {
    "title": "C++: Output với cout",
    "description": "Ôn cú pháp xuất dữ liệu cơ bản bằng cout và toán tử << trong C++.",
    "topic": "cout, output, syntax",
    "language_id": "cpp",
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"Lệnh cout","prompt":"Dòng nào in Xin chao trong C++?","options":["cout << \"Xin chao\";","console.log(\"Xin chao\");","print(\"Xin chao\")","echo \"Xin chao\""],"correct_answer":"cout << \"Xin chao\";","explanation":"C++ dùng cout với toán tử << để đưa dữ liệu ra output."},
      {"type":"fill_blank","title":"Toán tử output","prompt":"Điền toán tử còn thiếu: cout __ \"Hello\";","correct_answer":"<<","explanation":"Toán tử chèn output trong C++ là <<."},
      {"type":"true_false","title":"Dấu chấm phẩy","prompt":"Nhiều câu lệnh C++ cần kết thúc bằng dấu chấm phẩy ;.","correct_answer":"true","explanation":"Dấu ; đánh dấu kết thúc câu lệnh trong C++."},
      {"type":"multiple_select","title":"Dòng C++ hợp lệ","prompt":"Chọn các dòng output C++ hợp lệ.","options":["cout << \"A\";","cout >> \"B\";","cout << 123;","console.log(\"C\");"],"correct_answer":"[\"cout << \\\"A\\\";\",\"cout << 123;\"]","explanation":"C++ output dùng cout << giá trị;."}
    ]
  },
  {
    "title": "C++: Cú pháp cơ bản và comment",
    "description": "Nhận diện comment, header và các lỗi cú pháp cơ bản khi mới học C++.",
    "topic": "comments, syntax, main",
    "language_id": "cpp",
    "difficulty": "medium",
    "questions": [
      {"type":"multiple_choice","title":"Comment một dòng","prompt":"Comment một dòng trong C++ bắt đầu bằng gì?","options":["#","//","--","<!--"],"correct_answer":"//","explanation":"C++ dùng // cho comment một dòng."},
      {"type":"true_false","title":"main function","prompt":"Một chương trình C++ đơn giản thường bắt đầu chạy từ hàm main().","correct_answer":"true","explanation":"main() là điểm bắt đầu thực thi của chương trình C++ thông thường."},
      {"type":"multiple_choice","title":"Header iostream","prompt":"Header nào thường cần khi dùng cout?","options":["#include <iostream>","#include <stdio.py>","import iostream","using cout"],"correct_answer":"#include <iostream>","explanation":"iostream cung cấp cout/cin trong C++."},
      {"type":"fill_blank","title":"Namespace std","prompt":"Điền từ khóa còn thiếu: using namespace ____;","correct_answer":"std","explanation":"std là namespace chứa cout nếu dùng cú pháp using namespace std;."}
    ]
  },
  {
    "title": "Newbie mixed: Nhận diện lỗi hay gặp",
    "description": "Bộ ôn tổng hợp giúp người mới phân biệt cú pháp JavaScript, Python và C++ ở các lỗi đầu tiên.",
    "topic": "newbie errors, syntax, language differences",
    "language_id": null,
    "difficulty": "easy",
    "questions": [
      {"type":"multiple_choice","title":"JavaScript hay Python?","prompt":"console.log(\"Hello\"); thuộc ngôn ngữ nào trong các bài hiện tại?","options":["Python","JavaScript","C++","SQL"],"correct_answer":"JavaScript","explanation":"console.log() là cách in quen thuộc trong JavaScript/Node.js."},
      {"type":"multiple_choice","title":"Python print","prompt":"print(\"Hello\") phù hợp nhất với ngôn ngữ nào?","options":["Python","C++","JavaScript","HTML"],"correct_answer":"Python","explanation":"Python dùng print() để in output."},
      {"type":"multiple_select","title":"Dấu comment một dòng","prompt":"Chọn các ký hiệu comment một dòng đúng trong các ngôn ngữ đang học.","options":["// trong JavaScript","// trong C++","# trong Python","-- trong JavaScript"],"correct_answer":"[\"// trong JavaScript\",\"// trong C++\",\"# trong Python\"]","explanation":"JavaScript/C++ dùng //, Python dùng # cho comment một dòng."},
      {"type":"fill_blank","title":"Thiếu dấu nháy","prompt":"Trong câu lệnh console.log(\"Hello);, lỗi chính là thiếu dấu ____ đóng.","correct_answer":"nháy","explanation":"Chuỗi mở bằng dấu nháy kép nhưng chưa được đóng lại."}
    ]
  }
]
$practice_sets$::jsonb;
  set_item jsonb;
  question_item jsonb;
  inserted_set_id uuid;
  seeded_titles text[];
  question_order integer;
BEGIN
  SELECT array_agg(value->>'title')
  INTO seeded_titles
  FROM jsonb_array_elements(payload);

  DELETE FROM practice_submissions
  WHERE attempt_id IN (
    SELECT pa.id
    FROM practice_attempts pa
    JOIN practice_sets ps ON ps.id = pa.set_id
    WHERE ps.visibility = 'official'
      AND ps.title = ANY(seeded_titles)
  );

  DELETE FROM practice_attempts
  WHERE set_id IN (
    SELECT id FROM practice_sets
    WHERE visibility = 'official'
      AND title = ANY(seeded_titles)
  );

  DELETE FROM practice_questions
  WHERE set_id IN (
    SELECT id FROM practice_sets
    WHERE visibility = 'official'
      AND title = ANY(seeded_titles)
  );

  DELETE FROM practice_sets
  WHERE visibility = 'official'
    AND title = ANY(seeded_titles);

  FOR set_item IN SELECT value FROM jsonb_array_elements(payload)
  LOOP
    INSERT INTO practice_sets (
      owner_type,
      created_by,
      title,
      description,
      topic,
      language_id,
      difficulty,
      visibility,
      status,
      requirements
    ) VALUES (
      'official',
      NULL,
      set_item->>'title',
      set_item->>'description',
      set_item->>'topic',
      NULLIF(set_item->>'language_id', 'null'),
      set_item->>'difficulty',
      'official',
      'published',
      '{}'::jsonb
    ) RETURNING id INTO inserted_set_id;

    question_order := 0;

    FOR question_item IN SELECT value FROM jsonb_array_elements(set_item->'questions')
    LOOP
      INSERT INTO practice_questions (
        set_id,
        type,
        title,
        prompt,
        options,
        correct_answer,
        explanation,
        points,
        order_index
      ) VALUES (
        inserted_set_id,
        question_item->>'type',
        question_item->>'title',
        question_item->>'prompt',
        CASE
          WHEN question_item ? 'options' THEN question_item->'options'
          WHEN question_item->>'type' = 'true_false' THEN '["true", "false"]'::jsonb
          ELSE NULL
        END,
        question_item->>'correct_answer',
        question_item->>'explanation',
        10,
        question_order
      );

      question_order := question_order + 1;
    END LOOP;
  END LOOP;
END $$;

COMMIT;
