import { supabaseAdmin } from '../db/supabase'
import { logger } from '../utils/logger'

async function main() {
  try {
    logger.info('🌱 Starting reworked database seed...')

    // 1. Seed Languages
    const languages = [
      { id: 'javascript', name: 'JavaScript', display_name: 'JavaScript', icon: '🟨', can_run_in_browser: true },
      { id: 'python', name: 'Python', display_name: 'Python', icon: '🐍', can_run_in_browser: false },
      { id: 'cpp', name: 'C++', display_name: 'C++', icon: '🔵', can_run_in_browser: false },
    ]
    await supabaseAdmin.from('languages').upsert(languages)
    logger.info('✓ Seeded languages')

    // 2. Seed Learning Paths
    const paths = [
      {
        goal_id: 'start_from_zero',
        title: 'Lập trình từ con số 0',
        description: 'Bắt đầu hành trình chinh phục thế giới code với Python - ngôn ngữ dễ học nhất.',
        language_id: 'python',
        icon: '🚀',
        color: 'cyan'
      },
      {
        goal_id: 'build_web',
        title: 'Làm website cơ bản',
        description: 'Tạo ra những trang web đầu tiên của riêng bạn với JavaScript.',
        language_id: 'javascript',
        icon: '🌐',
        color: 'teal'
      },
      {
        goal_id: 'school_work',
        title: 'Học trên trường',
        description: 'Vượt qua các bài tập môn C++ trên giảng đường dễ dàng hơn.',
        language_id: 'cpp',
        icon: '🎓',
        color: 'ocean'
      },
      {
        goal_id: 'explore',
        title: 'Khám phá cái mới',
        description: 'Dạo chơi trong thế giới lập trình Python.',
        language_id: 'python',
        icon: '🔭',
        color: 'cyan'
      }
    ]
    const { data: seededPaths } = await supabaseAdmin
      .from('learning_paths')
      .upsert(paths, { onConflict: 'goal_id,language_id' })
      .select()
    logger.info('✓ Seeded learning paths')

    // 3. Seed Chapters
    const chapters = [
      {
        language_id: 'python',
        chapter_number: 1,
        title: 'Cái nhìn đầu tiên',
        description: 'Làm quen với cách máy tính thực thi mệnh lệnh của bạn.',
        order_index: 1
      },
      {
        language_id: 'javascript',
        chapter_number: 1,
        title: 'Sức mạnh của trình duyệt',
        description: 'Biến những dòng code thành hành động trên website.',
        order_index: 1
      },
      {
        language_id: 'cpp',
        chapter_number: 1,
        title: 'Nhập môn C++',
        description: 'Nền tảng sức mạnh của máy tính.',
        order_index: 1
      }
    ]
    const { data: seededChapters } = await supabaseAdmin
      .from('chapters')
      .upsert(chapters, { onConflict: 'language_id,chapter_number' })
      .select()
    logger.info('✓ Seeded chapters')

    // 4. Map Chapters to Paths
    if (seededPaths && seededChapters) {
      const pythonPathZero = seededPaths.find(p => p.goal_id === 'start_from_zero')
      const pythonPathExplore = seededPaths.find(p => p.goal_id === 'explore')
      const jsPath = seededPaths.find(p => p.goal_id === 'build_web')
      const cppPath = seededPaths.find(p => p.goal_id === 'school_work')
      
      const pythonChapter = seededChapters.find(c => c.language_id === 'python')
      const jsChapter = seededChapters.find(c => c.language_id === 'javascript')
      const cppChapter = seededChapters.find(c => c.language_id === 'cpp')

      if (!pythonPathZero || !pythonPathExplore || !jsPath || !cppPath || !pythonChapter || !jsChapter || !cppChapter) {
        throw new Error('Missing paths or chapters for mapping!')
      }

      const pathChapters = [
        { path_id: pythonPathZero.id, chapter_id: pythonChapter.id, order_index: 1 },
        { path_id: pythonPathExplore.id, chapter_id: pythonChapter.id, order_index: 1 },
        { path_id: jsPath.id, chapter_id: jsChapter.id, order_index: 1 },
        { path_id: cppPath.id, chapter_id: cppChapter.id, order_index: 1 }
      ]
      await supabaseAdmin.from('path_chapters').upsert(pathChapters, { onConflict: 'path_id,chapter_id' })
      logger.info('✓ Mapped chapters to paths')

      // 5. Seed Aha Lessons
      const lessons = [
        {
          chapter_id: pythonChapter.id,
          lesson_id: 'phep-mau-man-hinh',
          title: 'Phép màu của màn hình',
          description: 'Chào mừng bạn! Trong thế giới lập trình, `print` là câu lệnh đầu tiên giúp bạn giao tiếp với máy tính.',
          starter_code: 'print("Chào Loopy!")',
          task_description: 'Hãy thay đổi chữ "Chào Loopy!" trong ngoặc thành tên của bạn (ví dụ: "Chào Nam!") và chạy thử nhé.',
          hint: 'Đảm bảo tên bạn nằm trong cặp dấu ngoặc kép "" và cả câu lệnh nằm trong dấu ngoặc đơn ().',
          common_mistakes: 'Quên dấu ngoặc kép hoặc gõ sai chữ print thành Print (viết hoa).',
          solution_code: 'print("Chào Nam!")',
          code: '',
          insight: '',
          is_aha_lesson: true,
          order_index: 1,
          difficulty: 'beginner',
          grading_mode: 'stdout',
          validation_type: 'regex',
          validation_rules: {
            regex: 'print\\s*\\(\\s*[\'"]Chào\\s+\\S+![\'"]\\s*\\)',
            checks: [
              { label: 'Giữ lại câu lệnh print', regex: 'print\\s*\\(' },
              { label: 'In ra nội dung bắt đầu bằng Chào', regex: 'Chào\\s+' },
              { label: 'Thay thế Loopy bằng tên của bạn (kết thúc bằng dấu chấm cảm !)', regex: 'Chào\\s+(?!Loopy!)[^\'"]+!' }
            ]
          },
          success_output: '✓ Tuyệt vời! Bạn đã hoàn thành bài học đầu tiên về Python.',
          failure_hint: 'Hãy giữ nguyên cú pháp print("Chào ...!") và chỉ thay thế chữ Loopy bằng tên của bạn nhé.'
        },
        {
          chapter_id: jsChapter.id,
          lesson_id: 'loi-chao-tu-web',
          title: 'Lời chào từ Web',
          description: 'JavaScript giúp website trở nên sống động. Câu lệnh `console.log` sẽ in ra một thông báo trong bảng điều khiển.',
          starter_code: 'console.log("Chào mừng bạn đến với Web!");',
          task_description: 'Hãy thay đổi nội dung thông báo thành "Học code thật vui!" và nhấn chạy.',
          hint: 'Đừng quên dấu chấm phẩy (;) ở cuối câu lệnh nhé, nó giống như dấu chấm kết thúc câu vậy.',
          common_mistakes: 'Viết sai chữ console.log hoặc thiếu dấu ngoặc kép.',
          solution_code: 'console.log("Học code thật vui!");',
          code: '',
          insight: '',
          is_aha_lesson: true,
          order_index: 1,
          difficulty: 'beginner',
          grading_mode: 'stdout',
          validation_type: 'regex',
          validation_rules: {
            regex: 'console\\.log\\s*\\(\\s*[\'"]Học\\s+code\\s+thật\\s+vui![\'"]\\s*\\)',
            checks: [
              { label: 'Sử dụng console.log', regex: 'console\\.log\\s*\\(' },
              { label: 'In ra chính xác chữ Học code thật vui!', regex: 'Học\\s+code\\s+thật\\s+vui!' }
            ]
          },
          success_output: '✓ Tuyệt vời! JavaScript đã ghi nhận thông điệp từ bạn.',
          failure_hint: 'Đảm bảo bạn thay đổi toàn bộ chuỗi ký tự thành "Học code thật vui!" và giữ nguyên cặp dấu nháy kép.'
        },
        {
          chapter_id: cppChapter.id,
          lesson_id: 'cpp-hello-world',
          title: 'Hello World',
          description: 'C++ có cấu trúc khá khắt khe nhưng rất nhanh. Thử in ra dòng Hello World nhé.',
          starter_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello Loopy!";\n  return 0;\n}',
          task_description: 'Thay "Hello Loopy!" thành "Hello World!"',
          hint: 'Chỉ thay nội dung trong ngoặc kép.',
          common_mistakes: 'Thiếu dấu chấm phẩy ; ở cuối cout',
          solution_code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello World!";\n  return 0;\n}',
          code: '',
          insight: '',
          is_aha_lesson: true,
          order_index: 1,
          difficulty: 'beginner',
          grading_mode: 'stdout',
          validation_type: 'regex',
          validation_rules: {
            regex: 'cout\\s*<<\\s*[\'"]Hello\\s+World![\'"]',
            checks: [
              { label: 'Sử dụng câu lệnh cout', regex: 'cout\\s*<<' },
              { label: 'Thay đổi nội dung thành Hello World!', regex: 'Hello\\s+World!' },
              { label: 'Không được xóa dấu chấm phẩy kết thúc câu lệnh', regex: 'cout\\s*<<\\s*[\'"]Hello\\s+World![\'"]\\s*;\\s*\\n*' }
            ]
          },
          success_output: '✓ Xuất sắc! Bạn đã vượt qua thử thách cú pháp nghiêm ngặt của C++.',
          failure_hint: 'Hãy thay thế chuỗi "Hello Loopy!" thành "Hello World!" trong câu lệnh cout và giữ nguyên dấu chấm phẩy ; ở cuối câu.'
        }
      ]
      const { data: seededLessons, error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .upsert(lessons, { onConflict: 'chapter_id,lesson_id' })
        .select()
      
      if (lessonsError) {
        logger.error('Failed to seed lessons:', lessonsError)
      }
      logger.info('✓ Seeded Aha lessons')

      // 6. Seed Test Cases for Aha Lessons
      if (seededLessons) {
        logger.info(`Seeded lessons count: ${seededLessons.length}`)
        const pythonLesson = seededLessons.find(l => l.lesson_id === 'phep-mau-man-hinh')
        const jsLesson = seededLessons.find(l => l.lesson_id === 'loi-chao-tu-web')
        const cppLesson = seededLessons.find(l => l.lesson_id === 'cpp-hello-world')

        if (!pythonLesson || !jsLesson || !cppLesson) {
          logger.warn(`Missing pythonLesson (${!!pythonLesson}), jsLesson (${!!jsLesson}), or cppLesson (${!!cppLesson})`)
        }

        if (pythonLesson && jsLesson && cppLesson) {
          // Delete existing test cases first to prevent duplicates during testing
          await supabaseAdmin.from('lesson_test_cases').delete().in('lesson_id', [pythonLesson.id, jsLesson.id, cppLesson.id])

          const testCases = [
            {
              lesson_id: pythonLesson.id,
              input: [],
              expected_output: "Chào Nam!",
              weight: 100,
              timeout: 1000,
              description: 'In ra lời chào với tên',
              order_index: 1
            },
            {
              lesson_id: jsLesson.id,
              input: [],
              expected_output: "Học code thật vui!",
              weight: 100,
              timeout: 1000,
              description: 'In ra chữ Học code thật vui!',
              order_index: 1
            },
            {
              lesson_id: cppLesson.id,
              input: [],
              expected_output: "Hello World!",
              weight: 100,
              timeout: 1000,
              description: 'In ra chữ Hello World!',
              order_index: 1
            }
          ]
          await supabaseAdmin.from('lesson_test_cases').insert(testCases)
          logger.info('✓ Seeded test cases for Aha lessons')
        }
      }
    }

    // 7. Seed PvP Questions
    logger.info('🎮 Seeding PvP questions...')
    
    // Clean old PvP questions
    await supabaseAdmin.from('pvp_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const pvpQuestions = [
      // === JAVASCRIPT QUESTIONS (15 total) ===
      // Easy (5)
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Từ khóa nào được dùng để khai báo hằng số trong ES6?',
        options: [
          { id: 'A', text: 'const' },
          { id: 'B', text: 'let' },
          { id: 'C', text: 'var' },
          { id: 'D', text: 'static' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Kết quả của typeof null là gì?',
        options: [
          { id: 'A', text: 'object' },
          { id: 'B', text: 'null' },
          { id: 'C', text: 'undefined' },
          { id: 'D', text: 'string' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Hàm nào dùng để in dữ liệu ra tab console của Trình duyệt?',
        options: [
          { id: 'A', text: 'console.log()' },
          { id: 'B', text: 'print()' },
          { id: 'C', text: 'document.write()' },
          { id: 'D', text: 'alert()' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Để kiểm tra độ dài của một mảng arr, ta dùng thuộc tính nào?',
        options: [
          { id: 'A', text: 'arr.length' },
          { id: 'B', text: 'arr.size' },
          { id: 'C', text: 'arr.count' },
          { id: 'D', text: 'arr.len()' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Đâu không phải là kiểu dữ liệu nguyên thủy (Primitive Type) trong Javascript?',
        options: [
          { id: 'A', text: 'Array' },
          { id: 'B', text: 'String' },
          { id: 'C', text: 'Number' },
          { id: 'D', text: 'Boolean' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },

      // Medium (5)
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Phương thức nào dùng để chuyển một chuỗi thành số nguyên?',
        options: [
          { id: 'A', text: 'parseInt()' },
          { id: 'B', text: 'parseFloat()' },
          { id: 'C', text: 'Number.toInteger()' },
          { id: 'D', text: 'Math.round()' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Kết quả của phép so sánh [] + [] trong Javascript là gì?',
        options: [
          { id: 'A', text: '"" (chuỗi rỗng)' },
          { id: 'B', text: '[]' },
          { id: 'C', text: 'undefined' },
          { id: 'D', text: 'NaN' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Phương thức nào dùng để gộp các phần tử của một mảng thành một chuỗi?',
        options: [
          { id: 'A', text: 'join()' },
          { id: 'B', text: 'concat()' },
          { id: 'C', text: 'split()' },
          { id: 'D', text: 'push()' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Câu lệnh nào dùng để dừng vòng lặp ngay lập tức?',
        options: [
          { id: 'A', text: 'break' },
          { id: 'B', text: 'continue' },
          { id: 'C', text: 'return' },
          { id: 'D', text: 'exit' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Hàm mũi tên (Arrow Function) thừa hưởng từ khóa "this" từ đâu?',
        options: [
          { id: 'A', text: 'Từ Lexical Scope bao quanh nó' },
          { id: 'B', text: 'Từ đối tượng gọi hàm đó' },
          { id: 'C', text: 'Từ đối tượng toàn cục (window/global)' },
          { id: 'D', text: 'Không có "this"' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },

      // Hard (5)
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Kết quả của biểu thức so sánh 0.1 + 0.2 === 0.3 trong Javascript?',
        options: [
          { id: 'A', text: 'false' },
          { id: 'B', text: 'true' },
          { id: 'C', text: 'undefined' },
          { id: 'D', text: 'NaN' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Khái niệm nào mô tả việc JavaScript tự động tìm kiếm biến ở phạm vi bên ngoài khi biến đó không tồn tại ở phạm vi hiện tại?',
        options: [
          { id: 'A', text: 'Scope Chain' },
          { id: 'B', text: 'Closure' },
          { id: 'C', text: 'Hoisting' },
          { id: 'D', text: 'Strict Mode' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Đối tượng nào trong JS dùng để tạo ra một cơ chế bất đồng bộ có thể giải quyết được callback hell?',
        options: [
          { id: 'A', text: 'Promise' },
          { id: 'B', text: 'Async/Await' },
          { id: 'C', text: 'Generator' },
          { id: 'D', text: 'Event Loop' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Phương thức Object.freeze() khác Object.seal() ở chỗ nào?',
        options: [
          { id: 'A', text: 'Object.freeze() không cho phép chỉnh sửa giá trị thuộc tính cũ, còn Object.seal() thì có' },
          { id: 'B', text: 'Object.seal() không cho phép chỉnh sửa giá trị thuộc tính cũ, còn Object.freeze() thì có' },
          { id: 'C', text: 'Cả hai phương thức hoàn toàn giống nhau' },
          { id: 'D', text: 'Không phương thức nào ngăn chặn việc thêm thuộc tính mới' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'javascript',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Kết quả của biểu thức typeof (typeof 1) là gì?',
        options: [
          { id: 'A', text: '"string"' },
          { id: 'B', text: '"number"' },
          { id: 'C', text: '"object"' },
          { id: 'D', text: '"undefined"' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },

      // === PYTHON QUESTIONS (15 total) ===
      // Easy (5)
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Hàm nào dùng để in ra màn hình trong Python?',
        options: [
          { id: 'A', text: 'print()' },
          { id: 'B', text: 'echo()' },
          { id: 'C', text: 'console.log()' },
          { id: 'D', text: 'cout' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Từ khóa nào dùng để định nghĩa một hàm trong Python?',
        options: [
          { id: 'A', text: 'def' },
          { id: 'B', text: 'func' },
          { id: 'C', text: 'function' },
          { id: 'D', text: 'define' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Ký tự nào dùng để viết comment trên 1 dòng trong Python?',
        options: [
          { id: 'A', text: '#' },
          { id: 'B', text: '//' },
          { id: 'C', text: '/*' },
          { id: 'D', text: '--' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Đâu là cách tạo ra một List (danh sách) rỗng trong Python?',
        options: [
          { id: 'A', text: '[] hoặc list()' },
          { id: 'B', text: '{} hoặc dict()' },
          { id: 'C', text: '()' },
          { id: 'D', text: 'set()' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Kiểu dữ liệu Boolean trong Python gồm hai giá trị nào?',
        options: [
          { id: 'A', text: 'True và False (viết hoa chữ đầu)' },
          { id: 'B', text: 'true và false (viết thường)' },
          { id: 'C', text: '1 và 0' },
          { id: 'D', text: 'yes và no' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },

      // Medium (5)
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Kết quả của phép chia nguyên 10 // 3 trong Python?',
        options: [
          { id: 'A', text: '3' },
          { id: 'B', text: '3.3333333333333335' },
          { id: 'C', text: '1' },
          { id: 'D', text: '3.0' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Phương thức nào dùng để thêm phần tử vào cuối List?',
        options: [
          { id: 'A', text: 'append()' },
          { id: 'B', text: 'add()' },
          { id: 'C', text: 'insert()' },
          { id: 'D', text: 'push()' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Kết quả của phép toán nhân chuỗi "A" * 3 trong Python là gì?',
        options: [
          { id: 'A', text: '"AAA"' },
          { id: 'B', text: 'Lỗi biên dịch' },
          { id: 'C', text: '"A3"' },
          { id: 'D', text: '["A", "A", "A"]' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Để lấy số lượng phần tử của list `my_list`, ta dùng hàm nào?',
        options: [
          { id: 'A', text: 'len(my_list)' },
          { id: 'B', text: 'my_list.length()' },
          { id: 'C', text: 'my_list.size()' },
          { id: 'D', text: 'count(my_list)' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Trong Python, Tuple khác List ở điểm mấu chốt nào?',
        options: [
          { id: 'A', text: 'Tuple là bất biến (Immutable), List có thể thay đổi (Mutable)' },
          { id: 'B', text: 'List là bất biến, Tuple có thể thay đổi' },
          { id: 'C', text: 'Tuple chỉ chứa số, List có thể chứa chuỗi' },
          { id: 'D', text: 'List nhanh hơn Tuple' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },

      // Hard (5)
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Kiểu dữ liệu set trong Python có cho phép trùng lặp phần tử không?',
        options: [
          { id: 'A', text: 'Không' },
          { id: 'B', text: 'Có' },
          { id: 'C', text: 'Chỉ cho phép trùng lặp số nguyên' },
          { id: 'D', text: 'Tùy thuộc vào phiên bản Python' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Từ khóa "nonlocal" trong Python dùng để làm gì?',
        options: [
          { id: 'A', text: 'Tham chiếu đến biến thuộc phạm vi hàm bao ngoài gần nhất (không phải toàn cục)' },
          { id: 'B', text: 'Tham chiếu đến biến toàn cục (global)' },
          { id: 'C', text: 'Khai báo biến cục bộ' },
          { id: 'D', text: 'Định nghĩa biến không thuộc class' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Phương thức copy.deepcopy() khác copy.copy() ở điểm nào?',
        options: [
          { id: 'A', text: 'deepcopy() sao chép đệ quy mọi đối tượng con lồng nhau, còn copy() chỉ tạo sao chép nông (shallow copy)' },
          { id: 'B', text: 'copy() sao chép đệ quy mọi đối tượng con lồng nhau, còn deepcopy() chỉ tạo sao chép nông' },
          { id: 'C', text: 'Cả hai hoàn toàn giống nhau' },
          { id: 'D', text: 'deepcopy() chỉ hoạt động trên các class tự định nghĩa' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Kết quả của biểu thức [i for i in range(5) if i % 2 == 0] là gì?',
        options: [
          { id: 'A', text: '[0, 2, 4]' },
          { id: 'B', text: '[2, 4]' },
          { id: 'C', text: '[0, 1, 2, 3, 4]' },
          { id: 'D', text: '[1, 3]' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'python',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Hàm generator trong Python trả về giá trị thông qua từ khóa nào?',
        options: [
          { id: 'A', text: 'yield' },
          { id: 'B', text: 'return' },
          { id: 'C', text: 'generate' },
          { id: 'D', text: 'emit' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },

      // === C++ QUESTIONS (15 total) ===
      // Easy (5)
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Câu lệnh nào dùng để in dữ liệu ra console trong C++?',
        options: [
          { id: 'A', text: 'std::cout' },
          { id: 'B', text: 'std::cin' },
          { id: 'C', text: 'print()' },
          { id: 'D', text: 'printf' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Mỗi câu lệnh trong C++ kết thúc bắt buộc bằng ký tự nào?',
        options: [
          { id: 'A', text: 'dấu chấm phẩy ;' },
          { id: 'B', text: 'dấu chấm .' },
          { id: 'C', text: 'dấu phẩy ,' },
          { id: 'D', text: 'dấu hai chấm :' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Thư viện cơ bản nào dùng để thực hiện nhập xuất (input/output) trong C++?',
        options: [
          { id: 'A', text: '<iostream>' },
          { id: 'B', text: '<vector>' },
          { id: 'C', text: '<string>' },
          { id: 'D', text: '<cmath>' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Hàm bắt buộc phải có mặt trong mọi chương trình C++ thực thi được là hàm nào?',
        options: [
          { id: 'A', text: 'main()' },
          { id: 'B', text: 'start()' },
          { id: 'C', text: 'init()' },
          { id: 'D', text: 'run()' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'easy',
        question_text: 'Từ khóa nào dùng để khai báo kiểu số nguyên trong C++?',
        options: [
          { id: 'A', text: 'int' },
          { id: 'B', text: 'float' },
          { id: 'C', text: 'double' },
          { id: 'D', text: 'char' }
        ],
        correct_answer: 'A',
        points: 100,
        time_limit: 300,
        tags: ['basics']
      },

      // Medium (5)
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Kích thước của kiểu dữ liệu char trong C++ thường là bao nhiêu byte?',
        options: [
          { id: 'A', text: '1 byte' },
          { id: 'B', text: '2 byte' },
          { id: 'C', text: '4 byte' },
          { id: 'D', text: '8 byte' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Từ khóa nào dùng để chỉ định kế thừa ở dạng công khai (Public Inheritance) trong C++?',
        options: [
          { id: 'A', text: 'public' },
          { id: 'B', text: 'extends' },
          { id: 'C', text: 'implements' },
          { id: 'D', text: 'inherits' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Để lưu trữ danh sách động (dynamic array) trong C++, thư viện chuẩn cung cấp container nào?',
        options: [
          { id: 'A', text: 'std::vector' },
          { id: 'B', text: 'std::list' },
          { id: 'C', text: 'std::array' },
          { id: 'D', text: 'std::map' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Toán tử nào dùng để lấy địa chỉ của một biến trong C++?',
        options: [
          { id: 'A', text: 'Toán tử &' },
          { id: 'B', text: 'Toán tử *' },
          { id: 'C', text: 'Toán tử ->' },
          { id: 'D', text: 'Toán tử ::' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'medium',
        question_text: 'Hàm giải phóng (Destructor) của một class trong C++ bắt đầu bằng ký tự nào?',
        options: [
          { id: 'A', text: 'Ký tự ngã ~' },
          { id: 'B', text: 'Ký tự gạch dưới _' },
          { id: 'C', text: 'Ký tự gạch nối -' },
          { id: 'D', text: 'Ký tự chấm than !' }
        ],
        correct_answer: 'A',
        points: 150,
        time_limit: 300,
        tags: ['basics']
      },

      // Hard (5)
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Lớp trừu tượng (Abstract Class) trong C++ được định nghĩa bằng cơ chế nào?',
        options: [
          { id: 'A', text: 'Khai báo ít nhất một hàm thuần ảo (pure virtual function)' },
          { id: 'B', text: 'Khai báo lớp bằng từ khóa abstract' },
          { id: 'C', text: 'Sử dụng từ khóa interface' },
          { id: 'D', text: 'Kế thừa đa lớp' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Biến con trỏ thông minh nào trong C++11 tự động giải phóng tài nguyên và KHÔNG cho phép chia sẻ quyền sở hữu (độc quyền)?',
        options: [
          { id: 'A', text: 'std::unique_ptr' },
          { id: 'B', text: 'std::shared_ptr' },
          { id: 'C', text: 'std::weak_ptr' },
          { id: 'D', text: 'std::auto_ptr' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Trong C++, cơ chế nào cho phép một hàm tự chọn nạp chồng (overload) tại thời điểm chạy (runtime polymorphism)?',
        options: [
          { id: 'A', text: 'Hàm ảo (virtual function)' },
          { id: 'B', text: 'Hàm inline' },
          { id: 'C', text: 'Template' },
          { id: 'D', text: 'Macro' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Vấn đề "Diamond Problem" trong đa kế thừa C++ được giải quyết bằng cách sử dụng từ khóa nào?',
        options: [
          { id: 'A', text: 'virtual' },
          { id: 'B', text: 'override' },
          { id: 'C', text: 'friend' },
          { id: 'D', text: 'mutable' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      },
      {
        language_id: 'cpp',
        type: 'multiple_choice',
        difficulty: 'hard',
        question_text: 'Lệnh "std::move" trong C++11 thực hiện điều gì?',
        options: [
          { id: 'A', text: 'Ép kiểu đối tượng thành một tham chiếu rvalue để kích hoạt move constructor/assignment' },
          { id: 'B', text: 'Tự động giải phóng biến con trỏ cũ' },
          { id: 'C', text: 'Di chuyển vị trí của đối tượng trong bộ nhớ RAM vật lý' },
          { id: 'D', text: 'Sao chép sâu toàn bộ dữ liệu đối tượng' }
        ],
        correct_answer: 'A',
        points: 200,
        time_limit: 300,
        tags: ['basics']
      }
    ]

    await supabaseAdmin.from('pvp_questions').insert(pvpQuestions)
    logger.info('✓ Seeded PvP questions')

    logger.info('✅ Database rework seed completed!')
  } catch (error) {
    logger.error('❌ Rework seed failed:', error)
    process.exit(1)
  }
}

main()
