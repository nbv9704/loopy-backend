-- Legacy seed, development only. Prefer reviewed JSON import; never replay on authored production data.
-- Ensure CMS categories used by migrated frontend keys exist.
INSERT INTO content_categories (name, description, display_order) VALUES
  ('nav', 'Shared navigation content', 1),
  ('header', 'Legacy header category', 1),
  ('footer', 'Footer content', 2),
  ('landing', 'Landing page content', 3),
  ('languages', 'Languages page content', 4),
  ('detail', 'Language detail page content', 5),
  ('library', 'Library page content', 6),
  ('learn', 'Learn page content', 7),
  ('playground', 'Playground page content', 8),
  ('docs', 'Documentation page content', 9),
  ('onboarding', 'Onboarding page content', 10),
  ('settings', 'Settings page content', 11),
  ('profile', 'Profile page content', 12),
  ('pvp', 'PvP pages content', 13),
  ('practice', 'Practice pages content', 14),
  ('grading', 'Grading result components content', 15),
  ('common', 'Common/shared content', 16)
ON CONFLICT (name) DO NOTHING;

WITH categories AS (
  SELECT id, name FROM content_categories
)
INSERT INTO content_items (category_id, key, language, value, type)
SELECT c.id, 'auth.ctx.default', 'vi', 'Tiếp tục hành trình học code của bạn trên Loopy.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.default', 'en', 'Continue your coding journey on Loopy.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.learn', 'vi', 'Đăng nhập để lưu tiến độ, streak và bài tiếp theo trong hành trình học.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.learn', 'en', 'Sign in to save progress, streaks, and the next lesson in your journey.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.onboarding', 'vi', 'Tạo tài khoản để lưu lộ trình đầu tiên và quay lại đúng bài đang học.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.onboarding', 'en', 'Create an account to save your first path and return to the exact lesson you were learning.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.onboarding2', 'vi', 'Chọn mục tiêu học một lần, Loopy sẽ gợi ý bước bắt đầu phù hợp.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.onboarding2', 'en', 'Choose your learning goal once, and Loopy will suggest a practical starting point.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.pvp', 'vi', 'Đăng nhập để tham gia thử thách, đồng bộ kết quả và quay lại trận của bạn.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.ctx.pvp', 'en', 'Sign in to join challenges, sync results, and return to your match.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat1', 'vi', 'Lưu tiến độ bài học', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat1', 'en', 'Save lesson progress', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat2', 'vi', 'Tiếp tục đúng bước kế tiếp', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat2', 'en', 'Continue from the right next step', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat3', 'vi', 'Theo dõi streak, điểm và thử thách', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat3', 'en', 'Track streaks, points, and challenges', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat4', 'vi', 'Bắt đầu miễn phí với lộ trình cốt lõi', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.feat4', 'en', 'Start free with the core learning path', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.login1', 'vi', 'Chào mừng trở lại.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.login1', 'en', 'Welcome back.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.login2', 'vi', 'Đăng nhập vào Loopy', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.login2', 'en', 'Sign in to Loopy', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.signup1', 'vi', 'Tạo tài khoản để lưu hành trình.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.signup1', 'en', 'Create an account to save your journey.', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.signup2', 'vi', 'Tạo tài khoản Loopy', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'auth.title.signup2', 'en', 'Create your Loopy account', 'text' FROM categories c WHERE c.name = 'auth'
UNION ALL
SELECT c.id, 'bottom.btn', 'vi', 'Tìm lộ trình phù hợp', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'bottom.btn', 'en', 'Find the right path', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'bottom.desc', 'vi', 'Chọn mục tiêu học, mở bài đầu tiên và để Loopy dẫn bạn qua từng bước thực hành.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'bottom.desc', 'en', 'Choose a learning goal, open the first lesson, and let Loopy guide you through each practice step.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'bottom.title', 'vi', 'Bắt đầu bằng một bài nhỏ.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'bottom.title', 'en', 'Start with one small lesson.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'cta.primary', 'vi', 'Thử bài đầu tiên', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'cta.primary', 'en', 'Try the first lesson', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'cta.secondary', 'vi', 'Xem lộ trình', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'cta.secondary', 'en', 'View the journey', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'detail.back_btn', 'vi', 'Quay lại các lộ trình', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.back_btn', 'en', 'Back to paths', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.btn1', 'vi', 'Mở bài đầu tiên', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.btn1', 'en', 'Open the first lesson', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.btn2', 'vi', 'Đổi lộ trình', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.btn2', 'en', 'Choose another path', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.desc', 'vi', 'Nếu bạn mới học, hãy bắt đầu từ bài đầu tiên thay vì chọn ngẫu nhiên giữa quá nhiều chủ đề.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.desc', 'en', 'If you are new, start with the first lesson instead of choosing randomly from too many topics.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.title', 'vi', 'Chọn một bài nhỏ để bắt đầu.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.cta.title', 'en', 'Pick one small lesson to begin.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.empty', 'vi', 'Chưa có bài published cho lộ trình này.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.empty', 'en', 'No published lessons are available for this path yet.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.first_win_label', 'vi', 'Thắng lợi đầu tiên', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.first_win_label', 'en', 'First win', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.fit_label', 'vi', 'Phù hợp với', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.fit_label', 'en', 'Best for', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.hero.badge', 'vi', 'Lộ trình {name}', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.hero.badge', 'en', 'Lộ trình {name}', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.hero.title', 'vi', 'Học {name} bằng một syllabus có đường đi rõ.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.hero.title', 'en', 'Học {name} bằng một syllabus có đường đi rõ.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.loading', 'vi', 'Đang tải lộ trình...', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.loading', 'en', 'Loading path...', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.loading_detail', 'vi', 'Loading language detail...', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.loading_detail', 'en', 'Loading language detail...', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.preview.output_label', 'vi', 'Output', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.preview.output_label', 'en', 'Output', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.preview.run_label', 'vi', 'Kiểm tra', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.preview.run_label', 'en', 'Kiểm tra', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.start_btn', 'vi', 'Bắt đầu học', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.start_btn', 'en', 'Start learning', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.badge', 'vi', 'Syllabus-first', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.badge', 'en', 'Syllabus-first', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.chapter_label', 'vi', 'Chapter', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.chapter_label', 'en', 'Chapter', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.desc', 'vi', 'Mỗi chapter mở dần qua bài học có ví dụ, editor, output và kiểm tra rõ ràng.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.desc', 'en', 'Each chapter unlocks through lessons with examples, an editor, output, and clear checks.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.lesson_count', 'vi', '{count} bài', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.lesson_count', 'en', '{count} bài', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.title', 'vi', 'Học theo thứ tự nhỏ, không nhảy cóc.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus.title', 'en', 'Learn in small ordered steps, without skipping ahead.', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus_btn', 'vi', 'Xem syllabus', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'detail.syllabus_btn', 'en', 'View syllabus', 'text' FROM categories c WHERE c.name = 'detail'
UNION ALL
SELECT c.id, 'docs.bottom.btn1', 'vi', 'Quay lại Journey Map', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.btn1', 'en', 'Back to Journey Map', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.btn2', 'vi', 'Tìm lộ trình', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.btn2', 'en', 'Find a path', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.desc', 'vi', 'Khi chưa biết học tiếp gì, hãy quay lại Library thay vì lạc trong tài liệu tham khảo.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.desc', 'en', 'When you are not sure what to learn next, return to Library instead of wandering through reference pages.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.title', 'vi', 'Docs hỗ trợ journey, không thay journey.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.bottom.title', 'en', 'Docs support the journey; they do not replace it.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.check.badge', 'vi', 'Khi cần Kiểm tra', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.check.badge', 'en', 'When to use Check', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.check.desc', 'vi', 'Quay lại lesson để Loopy chấm bằng rule/test case. Chỉ khi kiểm tra đạt và lưu progress thành công, bài mới được tính hoàn thành.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.check.desc', 'en', 'Return to the lesson so Loopy can grade with rules or test cases. A lesson is complete only after the check passes and progress is saved.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.code.output', 'vi', 'Xin chào Loopy', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.code.output', 'en', 'Hello Loopy', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group1.items', 'vi', 'Console log|Biến|String template|Function|Điều kiện', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group1.items', 'en', 'Console log|Variables|Template strings|Functions|Conditions', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group1.title', 'vi', 'JavaScript cơ bản', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group1.title', 'en', 'JavaScript basics', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group2.items', 'vi', 'print()|input()|Biến|f-string|Lỗi thường gặp', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group2.items', 'en', 'print()|input()|Variables|f-strings|Common errors', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group2.title', 'vi', 'Python cơ bản', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group2.title', 'en', 'Python basics', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group3.items', 'vi', 'Đọc error|So sánh output|Dùng Playground', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group3.items', 'en', 'Read errors|Compare output|Use Playground', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group3.title', 'vi', 'Khi bị kẹt', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.group3.title', 'en', 'When you get stuck', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.badge', 'vi', 'Bước tiếp theo', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.badge', 'en', 'Next step', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.btn1', 'vi', 'Mở Playground', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.btn1', 'en', 'Open Playground', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.btn2', 'vi', 'Vào Journey Map', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.btn2', 'en', 'Go to Journey Map', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.desc', 'vi', 'Dùng Playground để thử khái niệm, hoặc vào Learn để được kiểm tra và lưu tiến độ.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.desc', 'en', 'Use Playground to test a concept, or go to Learn for checked practice and saved progress.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.title', 'vi', 'Đọc xong thì code thử.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.next.title', 'en', 'After reading, try coding.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.play.badge', 'vi', 'Khi dùng Chạy thử', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.play.badge', 'en', 'When to use Run', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.play.desc', 'vi', 'Dùng khi bạn muốn xem output thật. Đây là execute code, không phải validation.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.play.desc', 'en', 'Use it when you want to inspect real output. It executes code; it does not validate the lesson.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.badge', 'vi', 'JavaScript reference', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.badge', 'en', 'JavaScript reference', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.desc', 'vi', 'Khi mới học, `console.log` là cách đơn giản nhất để kiểm tra một giá trị đang là gì. Nó phù hợp cho Playground và bước Chạy thử trong lesson.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.desc', 'en', 'For beginners, `console.log` is the simplest way to see what a value is. It works well in Playground and during the Run step inside a lesson.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.title', 'vi', 'console.log dùng để xem output nhanh.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.ref.title', 'en', 'console.log helps you inspect output quickly.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.sandbox.badge', 'vi', 'Tài liệu thực hành', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.sandbox.badge', 'en', 'Practice reference', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.search.hint', 'vi', 'Thử tìm: `console.log`, `input`, `đọc error`', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.search.hint', 'en', 'Try: `console.log`, `input`, `read errors`', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.search.quick', 'vi', 'Tìm nhanh', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.search.quick', 'en', 'Quick search', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.subtitle', 'vi', 'Khi bị kẹt, bạn có thể tra nhanh khái niệm ở Docs. Sau đó hãy quay lại Journey Map để học theo thứ tự và lưu progress đúng cách.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.subtitle', 'en', 'When you get stuck, use Docs to look up a concept quickly. Then return to the Journey Map to learn in order and save progress correctly.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.terminal.badge', 'vi', 'Từ docs sang thực hành', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.terminal.badge', 'en', 'From docs to practice', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.terminal.desc', 'vi', 'Docs giúp hiểu khái niệm. Playground giúp thử nhanh. Learn giúp hoàn thành bài có kiểm tra.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.terminal.desc', 'en', 'Docs explain concepts. Playground lets you try quickly. Learn helps you complete checked lessons.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.tips.desc', 'vi', 'Nếu output không giống bạn nghĩ, hãy đổi từng biến nhỏ, chạy lại, rồi so sánh. Đừng sửa nhiều dòng cùng lúc khi mới học.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.tips.desc', 'en', 'If the output is not what you expected, change one small variable, run again, and compare. Avoid editing many lines at once while learning.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.tips.title', 'vi', 'Mẹo đọc output', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.tips.title', 'en', 'How to read output', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.title', 'vi', 'Docs là kệ tham khảo, không phải lộ trình chính.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.title', 'en', 'Docs are your reference shelf, not the main path.', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.toc.items', 'vi', 'Khi nào dùng docs?|Ví dụ console.log|Run khác Check|Đi tiếp ở đâu?', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.toc.items', 'en', 'When to use docs|console.log example|Run vs Check|Where to go next', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.toc.title', 'vi', 'Trong trang', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.toc.title', 'en', 'On this page', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.topic.title', 'vi', 'Chủ đề', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.topic.title', 'en', 'Topics', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'errorBoundary.componentStack', 'vi', 'Component Stack', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'errorBoundary.componentStack', 'en', 'Component Stack', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'errorBoundary.errorMessage', 'vi', 'Error Message:', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'errorBoundary.errorMessage', 'en', 'Error Message:', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'errorBoundary.stackTrace', 'vi', 'Stack Trace', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'errorBoundary.stackTrace', 'en', 'Stack Trace', 'text' FROM categories c WHERE c.name = 'errorBoundary'
UNION ALL
SELECT c.id, 'faq.badge', 'vi', 'FAQ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq.badge', 'en', 'FAQ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq.title', 'vi', 'Loopy giúp người mới học thế nào?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq.title', 'en', 'How does Loopy help beginners learn?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq1.a', 'vi', 'Tài liệu để tra cứu. Loopy đưa bạn vào một lộ trình có bài tiếp theo, editor, terminal, kiểm tra tự động và lưu tiến độ.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq1.a', 'en', 'Docs are for reference. Loopy gives you a guided path with the next lesson, an editor, a terminal, automatic checks, and saved progress.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq1.q', 'vi', 'Loopy khác một trang tài liệu ở điểm nào?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq1.q', 'en', 'How is Loopy different from documentation?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq2.a', 'vi', 'Không. Chạy thử chỉ execute code để xem output. Kiểm tra mới dùng rule/test case để quyết định bài làm đã đạt yêu cầu chưa.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq2.a', 'en', 'No. Run only executes your code so you can inspect the output. Check uses rules or test cases to decide whether the lesson requirement is met.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq2.q', 'vi', 'Chạy thử và Kiểm tra có giống nhau không?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq2.q', 'en', 'Are Run and Check the same thing?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq3.a', 'vi', 'Có. Các bài đầu được thiết kế nhỏ, có ví dụ mẫu và yêu cầu cụ thể để bạn làm từng bước thay vì tự mò trong IDE.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq3.a', 'en', 'Yes. Early lessons are intentionally small, with examples and concrete requirements so you can move step by step instead of guessing inside an IDE.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq3.q', 'vi', 'Tôi mới hoàn toàn có bắt đầu được không?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'faq3.q', 'en', 'Can I start if I am completely new?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'footer.about', 'vi', 'Giới thiệu', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.about', 'en', 'About', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.aboutLoopy', 'vi', 'Về Loopy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.aboutLoopy', 'en', 'About Loopy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.allRightsReserved', 'vi', 'Đã đăng ký bản quyền.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.allRightsReserved', 'en', 'All rights reserved.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.blog', 'vi', 'Blog', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.blog', 'en', 'Blog', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.contact', 'vi', 'Liên hệ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.contact', 'en', 'Contact', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.copyright', 'vi', '© {{year}} Loopy. Nền tảng học lập trình tương tác.', 'text' FROM categories c WHERE c.name = 'common'
UNION ALL
SELECT c.id, 'footer.copyright', 'en', '© {{year}} Loopy. Interactive coding learning platform.', 'text' FROM categories c WHERE c.name = 'common'
UNION ALL
SELECT c.id, 'footer.description', 'vi', 'Loopy giúp người mới học lập trình theo từng bước nhỏ: quan sát, thay đổi, chạy thử, kiểm tra và sửa lỗi thật.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.description', 'en', 'Loopy helps beginners learn programming through small guided steps: observe, edit, run, check, and debug real code.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.docs', 'vi', 'Tài liệu', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.docs', 'en', 'Docs', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.faq', 'vi', 'FAQ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.faq', 'en', 'FAQ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.privacy', 'vi', 'Quyền riêng tư', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.privacy', 'en', 'Privacy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.resources', 'vi', 'Tài nguyên', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.resources', 'en', 'Resources', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.team', 'vi', 'Đội ngũ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.team', 'en', 'Team', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.terms', 'vi', 'Điều khoản', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.terms', 'en', 'Terms', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'grading.breakdown.ai_score', 'vi', 'AI đánh giá', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.breakdown.ai_score', 'en', 'AI đánh giá', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.breakdown.test_score', 'vi', 'Đúng/Sai', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.breakdown.test_score', 'en', 'Đúng/Sai', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.submission.test_label', 'vi', 'Test', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.submission.test_label', 'en', 'Test', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.actual', 'vi', '❌ Code của bạn cho ra', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.actual', 'en', '❌ Code của bạn cho ra', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.case_label', 'vi', 'Bài kiểm tra', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.case_label', 'en', 'Bài kiểm tra', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.compare_hint', 'vi', '💡 So sánh hai kết quả và kiểm tra lại code của bạn nhé!', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.compare_hint', 'en', '💡 So sánh hai kết quả và kiểm tra lại code của bạn nhé!', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.error_message', 'vi', '⚠️ Có lỗi xảy ra khi chạy bài kiểm tra này.', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.error_message', 'en', '⚠️ Có lỗi xảy ra khi chạy bài kiểm tra này.', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.expected', 'vi', '✅ Kết quả mong đợi', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.expected', 'en', '✅ Kết quả mong đợi', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.title', 'vi', 'Kiểm tra kết quả', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.title', 'en', 'Kiểm tra kết quả', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.your_result', 'vi', 'Kết quả của bạn', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'grading.tests.your_result', 'en', 'Kết quả của bạn', 'text' FROM categories c WHERE c.name = 'grading'
UNION ALL
SELECT c.id, 'hero.subtitle', 'vi', 'Loopy dẫn bạn qua một flow rõ ràng: quan sát code mẫu, sửa một dòng, chạy thử output, kiểm tra bằng test case, rồi debug lỗi nhỏ như khi lập trình thật.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'hero.subtitle', 'en', 'Loopy guides you through a clear flow: observe sample code, edit one line, run the output, check with test cases, then debug small real mistakes.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'hero.title', 'vi', 'Học code bằng từng bước nhỏ, không bị ném vào IDE một mình.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'hero.title', 'en', 'Learn to code in small steps, not by being dropped into an IDE alone.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.badge', 'vi', 'Journey map', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.badge', 'en', 'Journey map', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.desc', 'vi', 'Loopy ưu tiên hành trình rõ ràng hơn catalog rời rạc: bài đã xong, bài đang học và bài bị khóa được tách bạch để người mới không phải tự đoán bước kế tiếp.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.desc', 'en', 'Loopy favors a clear journey over a loose catalog: completed, active, and locked lessons are separated so beginners do not have to guess the next step.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node1', 'vi', 'Hello code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node1', 'en', 'Hello code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node2', 'vi', 'Biến', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node2', 'en', 'Variables', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node3', 'vi', 'In output', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node3', 'en', 'Print output', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node4', 'vi', 'Điều kiện', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node4', 'en', 'Conditions', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node5', 'vi', 'Vòng lặp', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.node5', 'en', 'Loops', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.title', 'vi', 'Biết mình đang ở đâu, bài nào mở tiếp theo.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'journey.title', 'en', 'Know where you are and what unlocks next.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.btn', 'vi', 'Tìm lộ trình phù hợp', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.btn', 'en', 'Find the right path', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.desc', 'vi', 'Chọn mục tiêu học, mở bài đầu tiên và để Loopy dẫn bạn qua từng bước thực hành.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.desc', 'en', 'Choose a learning goal, open the first lesson, and let Loopy guide you through each practice step.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.title', 'vi', 'Bắt đầu bằng một bài nhỏ.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.bottom.title', 'en', 'Start with one small lesson.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.primary', 'vi', 'Thử bài đầu tiên', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.primary', 'en', 'Try the first lesson', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.secondary', 'vi', 'Xem lộ trình', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.secondary', 'en', 'View the journey', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq.badge', 'vi', 'FAQ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq.badge', 'en', 'FAQ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq.title', 'vi', 'Loopy giúp người mới học thế nào?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq.title', 'en', 'How does Loopy help beginners learn?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq1.a', 'vi', 'Tài liệu để tra cứu. Loopy đưa bạn vào một lộ trình có bài tiếp theo, editor, terminal, kiểm tra tự động và lưu tiến độ.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq1.a', 'en', 'Docs are for reference. Loopy gives you a guided path with the next lesson, an editor, a terminal, automatic checks, and saved progress.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq1.q', 'vi', 'Loopy khác một trang tài liệu ở điểm nào?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq1.q', 'en', 'How is Loopy different from documentation?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq2.a', 'vi', 'Không. Chạy thử chỉ execute code để xem output. Kiểm tra mới dùng rule/test case để quyết định bài làm đã đạt yêu cầu chưa.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq2.a', 'en', 'No. Run only executes your code so you can inspect the output. Check uses rules or test cases to decide whether the lesson requirement is met.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq2.q', 'vi', 'Chạy thử và Kiểm tra có giống nhau không?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq2.q', 'en', 'Are Run and Check the same thing?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq3.a', 'vi', 'Có. Các bài đầu được thiết kế nhỏ, có ví dụ mẫu và yêu cầu cụ thể để bạn làm từng bước thay vì tự mò trong IDE.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq3.a', 'en', 'Yes. Early lessons are intentionally small, with examples and concrete requirements so you can move step by step instead of guessing inside an IDE.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq3.q', 'vi', 'Tôi mới hoàn toàn có bắt đầu được không?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.faq3.q', 'en', 'Can I start if I am completely new?', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.subtitle', 'vi', 'Loopy dẫn bạn qua một flow rõ ràng: quan sát code mẫu, sửa một dòng, chạy thử output, kiểm tra bằng test case, rồi debug lỗi nhỏ như khi lập trình thật.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.subtitle', 'en', 'Loopy guides you through a clear flow: observe sample code, edit one line, run the output, check with test cases, then debug small real mistakes.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.title', 'vi', 'Học code bằng từng bước nhỏ, không bị ném vào IDE một mình.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.title', 'en', 'Learn to code in small steps, not by being dropped into an IDE alone.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.badge', 'vi', 'Journey map', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.badge', 'en', 'Journey map', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.desc', 'vi', 'Loopy ưu tiên hành trình rõ ràng hơn catalog rời rạc: bài đã xong, bài đang học và bài bị khóa được tách bạch để người mới không phải tự đoán bước kế tiếp.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.desc', 'en', 'Loopy favors a clear journey over a loose catalog: completed, active, and locked lessons are separated so beginners do not have to guess the next step.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node1', 'vi', 'Hello code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node1', 'en', 'Hello code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node2', 'vi', 'Biến', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node2', 'en', 'Variables', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node3', 'vi', 'In output', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node3', 'en', 'Print output', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node4', 'vi', 'Điều kiện', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node4', 'en', 'Conditions', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node5', 'vi', 'Vòng lặp', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.node5', 'en', 'Loops', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.title', 'vi', 'Biết mình đang ở đâu, bài nào mở tiếp theo.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.journey.title', 'en', 'Know where you are and what unlocks next.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.learn.badge', 'vi', 'Learn by doing', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.learn.badge', 'en', 'Learn by doing', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.learn.title', 'vi', 'Mỗi bài học có một việc rõ ràng.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.learn.title', 'en', 'Every lesson has one clear job.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.badge', 'vi', 'Lesson 03', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.badge', 'en', 'Lesson 03', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.desc', 'vi', 'Bạn không cần đọc hết lý thuyết trước. Hãy quan sát, sửa code nhỏ, chạy thử, rồi kiểm tra bằng tiêu chí rõ ràng.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.desc', 'en', 'You do not need to read all the theory first. Observe, make a small edit, run it, then check against a clear target.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item1', 'vi', 'Quan sát code mẫu', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item1', 'en', 'Observe sample code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item2', 'vi', 'Sửa yêu cầu nhỏ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item2', 'en', 'Edit a small requirement', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item3', 'vi', 'Kiểm tra bằng rule', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item3', 'en', 'Check with rules', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item4', 'vi', 'Debug lỗi thật', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.item4', 'en', 'Debug real errors', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.status', 'vi', 'Đang học', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.status', 'en', 'In progress', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.title', 'vi', 'Thay đổi một dòng, thấy output ngay', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.pmock.title', 'en', 'Change one line and see the output immediately', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step1.desc', 'vi', 'Đọc ví dụ ngắn, chạy code mẫu và hiểu output trước khi tự viết.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step1.desc', 'en', 'Read a short example, run the sample code, and understand the output before writing on your own.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step1.title', 'vi', 'Quan sát', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step1.title', 'en', 'Observe', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step2.desc', 'vi', 'Sửa một phần nhỏ trong editor. Loopy kiểm tra đúng yêu cầu bằng rule/test case.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step2.desc', 'en', 'Change one small part in the editor. Loopy checks the requirement with deterministic rules or tests.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step2.title', 'vi', 'Thay đổi', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step2.title', 'en', 'Edit', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step3.desc', 'vi', 'Gặp lỗi nhỏ có chủ đích, đọc terminal và debug từng bước như khi code thật.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step3.desc', 'en', 'Meet small intentional errors, read the terminal, and debug step by step like real programming.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step3.title', 'vi', 'Sửa lỗi', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.step3.title', 'en', 'Debug', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'languages.badge', 'vi', 'Learning paths', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.badge', 'en', 'Learning paths', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.browse.badge', 'vi', 'Browse paths', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.browse.badge', 'en', 'Browse paths', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.browse.title', 'vi', 'Lộ trình hiện có', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.browse.title', 'en', 'Available paths', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.btn_find', 'vi', 'Tìm lộ trình phù hợp', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.btn_find', 'en', 'Find the right path', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.btn_first', 'vi', 'Bắt đầu bài đầu tiên', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.btn_first', 'en', 'Start the first lesson', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.badge', 'vi', 'Start small', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.badge', 'en', 'Start small', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.btn1', 'vi', 'Làm onboarding', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.btn1', 'en', 'Do onboarding', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.btn2', 'vi', 'Xem Journey Map', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.btn2', 'en', 'View Journey Map', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.command', 'vi', 'recommend --for beginner', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.command', 'en', 'recommend --for beginner', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.desc', 'vi', 'Hãy chọn mục tiêu gần nhất. Bạn có thể đổi lộ trình sau khi hiểu mình thích kiểu bài nào hơn.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.desc', 'en', 'Pick the nearest goal. You can change paths after you learn what kind of practice fits you best.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.title', 'vi', 'Không cần chọn hoàn hảo ngay từ đầu.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.cta.title', 'en', 'You do not need to choose perfectly on day one.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.badge', 'vi', 'Không chắc nên học gì?', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.badge', 'en', 'Not sure what to learn?', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_data', 'vi', 'Muốn làm việc với dữ liệu', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_data', 'en', 'Muốn làm việc với dữ liệu', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_logic', 'vi', 'Muốn code logic dễ hiểu', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_logic', 'en', 'Muốn code logic dễ hiểu', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_web', 'vi', 'Muốn web hiển thị đẹp', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.goal_web', 'en', 'Muốn web hiển thị đẹp', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.suggestion', 'vi', 'Loopy gợi ý lộ trình và bài đầu phù hợp.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.help.suggestion', 'en', 'Loopy gợi ý lộ trình và bài đầu phù hợp.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.badge', 'vi', 'How it works', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.badge', 'en', 'How it works', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.step_label', 'vi', 'Step', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.step_label', 'en', 'Step', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.title', 'vi', 'Loopy dẫn bạn học như thế nào?', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.how.title', 'en', 'How does Loopy guide your learning?', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.loading', 'vi', 'Đang tải lộ trình...', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.loading', 'en', 'Loading paths...', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.subtitle', 'vi', 'Mỗi ngôn ngữ trong Loopy được tổ chức thành journey nhỏ, có bài mở đầu rõ ràng và kiểm tra bằng code thật.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.subtitle', 'en', 'Each Loopy language path is organized as a small journey with a clear first lesson and real code checks.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.title', 'vi', 'Chọn lộ trình học đầu tiên của bạn.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.title', 'en', 'Choose your first learning path.', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'learn.action.build.helper', 'vi', 'learn.action.build.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.build.helper', 'en', 'learn.action.build.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.build.label', 'vi', 'learn.action.build.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.build.label', 'en', 'learn.action.build.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change.helper', 'vi', 'learn.action.change.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change.helper', 'en', 'learn.action.change.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change.label', 'vi', 'learn.action.change.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change.label', 'en', 'learn.action.change.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change_passed', 'vi', 'learn.action.change_passed', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.change_passed', 'en', 'learn.action.change_passed', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.current_step', 'vi', 'learn.action.current_step', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.current_step', 'en', 'learn.action.current_step', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.debug_passed', 'vi', 'learn.action.debug_passed', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.debug_passed', 'en', 'learn.action.debug_passed', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.fix.helper', 'vi', 'learn.action.fix.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.fix.helper', 'en', 'learn.action.fix.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.fix.label', 'vi', 'learn.action.fix.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.fix.label', 'en', 'learn.action.fix.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.hint_button', 'vi', 'learn.action.hint_button', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.hint_button', 'en', 'learn.action.hint_button', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.processing', 'vi', 'Đang xử lý...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.processing', 'en', 'Đang xử lý...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.run.helper', 'vi', 'learn.action.run.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.run.helper', 'en', 'learn.action.run.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.run.label', 'vi', 'learn.action.run.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.run.label', 'en', 'learn.action.run.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.see.helper', 'vi', 'learn.action.see.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.see.helper', 'en', 'learn.action.see.helper', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.see.label', 'vi', 'learn.action.see.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.action.see.label', 'en', 'learn.action.see.label', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.back_btn', 'vi', 'Quay lại lộ trình', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.back_btn', 'en', 'Back to path', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.badge', 'vi', 'Learn by doing', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.badge', 'en', 'Learn by doing', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.chapter', 'vi', 'Chương', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.chapter', 'en', 'Chapter', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.comingSoon', 'vi', 'Sắp ra mắt', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.comingSoon', 'en', 'Coming Soon', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.btn', 'vi', 'Mở Journey Map', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.btn', 'en', 'Open Journey Map', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.desc', 'vi', 'Mở Journey Map, chọn bài đang active và làm từng bước trong editor.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.desc', 'en', 'Open the Journey Map, choose the active lesson, and work through the editor one step at a time.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.title', 'vi', 'Sẵn sàng làm bài đầu tiên?', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.cta.title', 'en', 'Ready for your first lesson?', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.developingContent', 'vi', 'Đang phát triển nội dung {{language}}', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.developingContent', 'en', 'Developing {{language}} content', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.example', 'vi', 'Ví dụ', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.example', 'en', 'Example', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.exercise', 'vi', 'Bài tập', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.exercise', 'en', 'Exercise', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat1.desc', 'vi', 'Bạn xem code mẫu và output trước khi bị yêu cầu viết từ đầu.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat1.desc', 'en', 'You see sample code and output before being asked to write from scratch.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat1.title', 'vi', 'Quan sát trước', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat1.title', 'en', 'Observe first', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat2.desc', 'vi', 'Chạy thử chỉ giúp xem output. Nó không đánh dấu bài là đúng.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat2.desc', 'en', 'Run only lets you inspect output. It does not mark the lesson as correct.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat2.title', 'vi', 'Chạy thử không chấm điểm', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat2.title', 'en', 'Run is not grading', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat3.desc', 'vi', 'Khi bấm Kiểm tra, backend mới validate và lưu progress nếu hoàn thành.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat3.desc', 'en', 'When you click Check, the backend validates your answer and saves progress if it is complete.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat3.title', 'vi', 'Kiểm tra bằng rule/test case', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.feat3.title', 'en', 'Check with rules or tests', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.flow.label', 'vi', 'Flow 5 bước', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.flow.label', 'en', '5-step flow', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.getHint', 'vi', 'Gợi ý', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.getHint', 'en', 'Get Hint', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.mentor.label', 'vi', 'Mentor note', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.mentor.label', 'en', 'Mentor note', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.noLessonsYet', 'vi', 'Hiện chưa có bài học cho ngôn ngữ này', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.noLessonsYet', 'en', 'No lessons available for this language yet', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.readMore', 'vi', 'Xem chi tiết', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.readMore', 'en', 'Read More', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.readyToRun', 'vi', 'Sẵn sàng chạy code...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.readyToRun', 'en', 'Ready to run code...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.runCode', 'vi', 'Chạy code', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.runCode', 'en', 'Run Code', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.aha', 'vi', 'Aha!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.aha', 'en', 'Aha!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.continue', 'vi', 'Tiếp tục học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.continue', 'en', 'Tiếp tục học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.next', 'vi', 'Tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.sidebar.next', 'en', 'Tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.subtitle', 'vi', 'Loopy chia bài học thành các bước nhỏ để bạn hiểu code, thử thay đổi, kiểm tra đúng/sai và sửa lỗi có chủ đích.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.subtitle', 'en', 'Loopy splits lessons into small steps so you can understand code, try edits, check correctness, and debug intentional mistakes.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.summary', 'vi', 'Tóm tắt', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.summary', 'en', 'Summary', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.theory', 'vi', 'Lý thuyết', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.theory', 'en', 'Theory', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.title', 'vi', 'Mỗi bài học có một việc rõ ràng.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.title', 'en', 'Every lesson has one clear job.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.aha_complete_desc', 'vi', 'Đây chính là khoảnh khắc Aha! đầu tiên của bạn. Hành trình vừa bắt đầu!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.aha_complete_desc', 'en', 'Đây chính là khoảnh khắc Aha! đầu tiên của bạn. Hành trình vừa bắt đầu!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_busy', 'vi', '🤖 Đang suy nghĩ...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_busy', 'en', '🤖 Đang suy nghĩ...', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_hint_title', 'vi', '🤖 AI Mentor chỉ gợi ý', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_hint_title', 'en', '🤖 AI Mentor chỉ gợi ý', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_unavailable', 'vi', 'Hiện tại AI Mentor đang bận. Hãy thử đọc lại các gợi ý bên trên nhé!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ai_unavailable', 'en', 'Hiện tại AI Mentor đang bận. Hãy thử đọc lại các gợi ý bên trên nhé!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ask_ai_hint', 'vi', '🤖 Hỏi AI Mentor gợi ý thêm', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.ask_ai_hint', 'en', '🤖 Hỏi AI Mentor gợi ý thêm', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.back_button', 'vi', 'Back', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.back_button', 'en', 'Back', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.back_to_journey', 'vi', 'Quay lại Journey Map', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.back_to_journey', 'en', 'Quay lại Journey Map', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.check_lesson_prefix', 'vi', 'Kiểm tra bài:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.check_lesson_prefix', 'en', 'Kiểm tra bài:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.check_result_title', 'vi', 'Kết quả kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.check_result_title', 'en', 'Kết quả kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.checker_desc', 'vi', 'Checker deterministic của Loopy.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.checker_desc', 'en', 'Checker deterministic của Loopy.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.close_check_result', 'vi', 'Đóng kết quả kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.close_check_result', 'en', 'Đóng kết quả kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.common_mistakes_prefix', 'vi', 'Lỗi thường gặp:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.common_mistakes_prefix', 'en', 'Lỗi thường gặp:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.complete_desc', 'vi', 'Tiếp tục phát huy nhé, bạn đang tiến bộ rất nhanh!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.complete_desc', 'en', 'Tiếp tục phát huy nhé, bạn đang tiến bộ rất nhanh!', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.completed_badge', 'vi', 'Đã hoàn thành', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.completed_badge', 'en', 'Đã hoàn thành', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.current_task_label', 'vi', 'Việc cần làm ngay', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.current_task_label', 'en', 'Việc cần làm ngay', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.editor_current_step', 'vi', 'Bước hiện tại', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.editor_current_step', 'en', 'Bước hiện tại', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.editor_hint_button', 'vi', 'Gợi ý', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.editor_hint_button', 'en', 'Gợi ý', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.empty_desc', 'vi', 'Nội dung đang được chuẩn bị. Bạn có thể quay lại Journey Map để chọn lộ trình khác.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.empty_desc', 'en', 'Nội dung đang được chuẩn bị. Bạn có thể quay lại Journey Map để chọn lộ trình khác.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.empty_title', 'vi', 'Lộ trình này chưa có bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.empty_title', 'en', 'Lộ trình này chưa có bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.hint_count', 'vi', 'Gợi ý {current}/{total}', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.hint_count', 'en', 'Gợi ý {current}/{total}', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.hints_title', 'vi', 'Gợi ý cho bạn', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.hints_title', 'en', 'Gợi ý cho bạn', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.lesson_content_label', 'vi', 'Nội dung bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.lesson_content_label', 'en', 'Nội dung bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.lesson_fallback_title', 'vi', 'Bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.lesson_fallback_title', 'en', 'Bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.mini_checkpoint_desc', 'vi', 'Trả lời nhanh để chắc bạn hiểu trước khi code.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.mini_checkpoint_desc', 'en', 'Trả lời nhanh để chắc bạn hiểu trước khi code.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.mini_checkpoint_title', 'vi', 'Mini checkpoint', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.mini_checkpoint_title', 'en', 'Mini checkpoint', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.next_button', 'vi', 'Next', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.next_button', 'en', 'Next', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.next_lesson_button', 'vi', 'Bài tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.next_lesson_button', 'en', 'Bài tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.no_authored_hint', 'vi', 'Bài này chưa có gợi ý sẵn.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.no_authored_hint', 'en', 'Bài này chưa có gợi ý sẵn.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.no_check_result', 'vi', 'Chưa có kết quả kiểm tra. Khi bấm “Kiểm tra”, kết quả sẽ hiện ở panel này.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.no_check_result', 'en', 'Chưa có kết quả kiểm tra. Khi bấm “Kiểm tra”, kết quả sẽ hiện ở panel này.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.output_check_desc', 'vi', 'Chạy thử xem output. Kiểm tra mới validate đúng/sai.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.output_check_desc', 'en', 'Chạy thử xem output. Kiểm tra mới validate đúng/sai.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.output_check_title', 'vi', 'Output / Kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.output_check_title', 'en', 'Output / Kiểm tra', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.progress_label', 'vi', 'Journey progress', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.progress_label', 'en', 'Journey progress', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.progress_saved', 'vi', 'Tuyệt vời! Progress đã được lưu.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.progress_saved', 'en', 'Tuyệt vời! Progress đã được lưu.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.reveal_more_hint', 'vi', 'Tôi vẫn bị kẹt, cho gợi ý tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.reveal_more_hint', 'en', 'Tôi vẫn bị kẹt, cho gợi ý tiếp theo', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.rules_body', 'vi', 'learn.viewer.rules_body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.rules_body', 'en', 'learn.viewer.rules_body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.rules_label', 'vi', 'Luật Loopy:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.rules_label', 'en', 'Luật Loopy:', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.body', 'vi', 'Bạn đã đi qua quan sát, sửa, chạy thử và debug. Bấm Lưu hoàn thành để backend ghi nhận progress.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.body', 'en', 'Bạn đã đi qua quan sát, sửa, chạy thử và debug. Bấm Lưu hoàn thành để backend ghi nhận progress.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.label', 'vi', 'Hoàn thành', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.label', 'en', 'Hoàn thành', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.title', 'vi', 'Lưu tiến độ bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.build.title', 'en', 'Lưu tiến độ bài học', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.body', 'vi', 'learn.viewer.step.change.body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.body', 'en', 'learn.viewer.step.change.body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.label', 'vi', 'Thay đổi', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.label', 'en', 'Thay đổi', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.title', 'vi', 'Sửa đúng một yêu cầu nhỏ', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.change.title', 'en', 'Sửa đúng một yêu cầu nhỏ', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.body', 'vi', 'Đọc lỗi trong terminal, sửa code rồi kiểm tra lại. Đây là bài tập đọc lỗi thực tế cho người mới.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.body', 'en', 'Đọc lỗi trong terminal, sửa code rồi kiểm tra lại. Đây là bài tập đọc lỗi thực tế cho người mới.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.label', 'vi', 'Sửa lỗi', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.label', 'en', 'Sửa lỗi', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.title', 'vi', 'Debug một lỗi nhỏ trong terminal', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.fix.title', 'en', 'Debug một lỗi nhỏ trong terminal', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.body', 'vi', 'Bước này chỉ execute code và hiển thị output. Nó không thay thế bước Kiểm tra.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.body', 'en', 'Bước này chỉ execute code và hiển thị output. Nó không thay thế bước Kiểm tra.', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.label', 'vi', 'Chạy thử', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.label', 'en', 'Chạy thử', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.title', 'vi', 'Xem output thật của code đã pass', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.run.title', 'en', 'Xem output thật của code đã pass', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.body', 'vi', 'learn.viewer.step.see.body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.body', 'en', 'learn.viewer.step.see.body', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.label', 'vi', 'Quan sát', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.label', 'en', 'Quan sát', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.title', 'vi', 'Đọc nhanh, chạy mẫu, hiểu output', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.viewer.step.see.title', 'en', 'Đọc nhanh, chạy mẫu, hiểu output', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'library.back_btn', 'vi', 'Quay lại chọn lộ trình', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.back_btn', 'en', 'Back to paths', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.badge', 'vi', 'Library', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.badge', 'en', 'Library', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.btn_change', 'vi', 'Đổi lộ trình', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.btn_change', 'en', 'Choose another path', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.btn_next', 'vi', 'Học bài tiếp theo', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.btn_next', 'en', 'Learn the next lesson', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.desc', 'vi', 'Đừng cố học nhiều chủ đề cùng lúc. Chọn bài active và hoàn thành flow của nó.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.desc', 'en', 'Do not try to learn many topics at once. Choose the active lesson and complete its flow.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.title', 'vi', 'Đi tiếp bằng một bài nhỏ.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.cta.title', 'en', 'Move forward with one small lesson.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.empty', 'vi', 'Chưa có bài published trong lộ trình này.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.empty', 'en', 'There are no published lessons in this path yet.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat1.desc', 'vi', 'Bài đã được backend lưu progress thành công.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat1.desc', 'en', 'Progress has been saved successfully by the backend.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat1.title', 'vi', 'Done', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat1.title', 'en', 'Done', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat2.desc', 'vi', 'Bài nên học tiếp theo ngay bây giờ.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat2.desc', 'en', 'The lesson you should learn next right now.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat2.title', 'vi', 'Active', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat2.title', 'en', 'Active', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat3.desc', 'vi', 'Bài sẽ mở sau khi bạn hoàn thành các bước trước.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat3.desc', 'en', 'This lesson opens after you finish earlier steps.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat3.title', 'vi', 'Locked', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.feat3.title', 'en', 'Locked', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.loading', 'vi', 'Đang tải Journey Map...', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.loading', 'en', 'Loading Journey Map...', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.lock_rule.badge', 'vi', 'Quy tắc mở khóa', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.lock_rule.badge', 'en', 'Unlock rule', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.lock_rule.desc', 'vi', 'Loopy mở bài theo thứ tự để người mới không nhảy vào chủ đề quá khó quá sớm.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.lock_rule.desc', 'en', 'Loopy opens lessons in order so beginners do not jump into topics that are too hard too early.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.active_desc', 'vi', 'Bài này đang mở. Hoàn thành nó để mở bước tiếp theo trong journey.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.active_desc', 'en', 'This lesson is open. Complete it to unlock the next step in your journey.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.badge', 'vi', 'Bài tiếp theo', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.badge', 'en', 'Next lesson', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.btn', 'vi', 'Vào bài học', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.btn', 'en', 'Open lesson', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.empty', 'vi', 'Chưa có bài tiếp theo phù hợp.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.empty', 'en', 'No suitable next lesson is available yet.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.goal_badge', 'vi', 'Mục tiêu hôm nay', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.goal_badge', 'en', 'Today’s goal', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.goal_desc', 'vi', 'Hoàn thành một bài nhỏ là đủ để giữ nhịp học.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.goal_desc', 'en', 'Completing one small lesson is enough to keep your rhythm.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.locked_desc', 'vi', 'Bài này đang khóa. Hãy hoàn thành bài trước đó trước.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.next.locked_desc', 'en', 'This lesson is locked. Finish the previous lesson first.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.progress.done', 'vi', 'bài đã hoàn thành', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.progress.done', 'en', 'lessons completed', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.progress.label', 'vi', 'Tiến độ', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.progress.label', 'en', 'Progress', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.subtitle', 'vi', 'Theo dõi bài đã xong, bài đang học và bài bị khóa để luôn biết bước tiếp theo.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.subtitle', 'en', 'Track completed, active, and locked lessons so you always know the next step.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.title', 'vi', 'Journey Map của bạn.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.title', 'en', 'Your Journey Map.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'nav.docs', 'vi', 'Tài liệu', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.docs', 'en', 'Docs', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.learn', 'vi', 'Học', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.learn', 'en', 'Learn', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.logout', 'vi', 'Đăng xuất', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.logout', 'en', 'Log out', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.playground', 'vi', 'Playground', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.playground', 'en', 'Playground', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.practice', 'vi', 'Luyện tập', 'text' FROM categories c WHERE c.name = 'common'
UNION ALL
SELECT c.id, 'nav.practice', 'en', 'Practice', 'text' FROM categories c WHERE c.name = 'common'
UNION ALL
SELECT c.id, 'nav.pvp', 'vi', 'PvP', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.pvp', 'en', 'PvP', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.settings', 'vi', 'Cài đặt', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'nav.settings', 'en', 'Settings', 'text' FROM categories c WHERE c.name = 'nav'
UNION ALL
SELECT c.id, 'onboarding.badge', 'vi', 'Journey builder', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.badge', 'en', 'Journey builder', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.exp.desc', 'vi', 'Kinh nghiệm hiện tại giúp Loopy chọn bài mở đầu vừa sức hơn.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.exp.desc', 'en', 'Your current experience helps Loopy choose a first lesson that is not too hard or too slow.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.exp.title', 'vi', 'Bạn đã từng code chưa?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.exp.title', 'en', 'Have you coded before?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.desc', 'vi', 'Chọn mục tiêu gần nhất. Loopy sẽ dùng nó để gợi ý lộ trình ban đầu.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.desc', 'en', 'Choose the nearest goal. Loopy uses it to suggest your starting path.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.hint', 'vi', 'Bạn có thể đổi mục tiêu sau, đừng lo chọn sai.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.hint', 'en', 'You can change this later, so do not worry about picking perfectly.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.title', 'vi', 'Bạn muốn học để làm gì?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.goal.title', 'en', 'Why do you want to learn coding?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.badge', 'vi', 'Preview', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.badge', 'en', 'Preview', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_back', 'vi', 'Quay lại', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_back', 'en', 'Back', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_journey', 'vi', 'Lưu và mở Journey Map', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_journey', 'en', 'Save and open Journey Map', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_next', 'vi', 'Tiếp tục', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.btn_next', 'en', 'Continue', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.desc', 'vi', 'Bắt đầu bằng bài nhỏ, có hướng dẫn rõ ràng và kiểm tra bằng code thật.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.desc', 'en', 'Start with a small lesson, clear guidance, and real code checks.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.title', 'vi', 'Lộ trình đề xuất của bạn', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.preview.title', 'en', 'Your suggested path', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.progress', 'vi', 'Tiến trình thiết lập', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.progress', 'en', 'Setup progress', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.badge', 'vi', 'Newbie-first', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.badge', 'en', 'Newbie-first', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.desc', 'vi', 'Loopy không bắt bạn tự chọn giữa hàng chục chủ đề ngay từ đầu.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.desc', 'en', 'Loopy does not force you to choose from dozens of topics on day one.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.why.desc', 'vi', 'Một điểm bắt đầu rõ ràng giúp bạn học đều hơn và ít bỏ cuộc khi gặp lỗi đầu tiên.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.why.desc', 'en', 'A clear starting point helps you keep learning and avoid quitting at the first error.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.why.title', 'vi', 'Vì sao cần onboarding?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.sidebar.why.title', 'en', 'Why onboarding matters', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.exp', 'vi', 'Kinh nghiệm', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.exp', 'en', 'Experience', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.goal', 'vi', 'Mục tiêu', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.goal', 'en', 'Goal', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.preview', 'vi', 'Xem trước', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.step.preview', 'en', 'Preview', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.subtitle', 'vi', 'Trả lời vài câu ngắn để Loopy gợi ý điểm bắt đầu dễ theo nhất.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.subtitle', 'en', 'Answer a few short questions so Loopy can suggest the easiest starting point to follow.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.title', 'vi', 'Tạo lộ trình học phù hợp với bạn.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.title', 'en', 'Build a learning path that fits you.', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'playground.autoSaved', 'vi', 'Files được lưu tự động', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.autoSaved', 'en', 'Auto-saved', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.badge', 'vi', 'Code sandbox', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.badge', 'en', 'Code sandbox', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cancel', 'vi', 'Hủy', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cancel', 'en', 'Cancel', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.confirmDeleteAll', 'vi', 'Bạn có chắc muốn xóa tất cả files và reset về mặc định?', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.confirmDeleteAll', 'en', 'Are you sure you want to delete all files and reset to default?', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.createFile', 'vi', 'Tạo file', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.createFile', 'en', 'Create File', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.createNewFile', 'vi', 'Tạo file mới', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.createNewFile', 'en', 'Create New File', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.btn_journey', 'vi', 'Mở Journey Map', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.btn_journey', 'en', 'Open Journey Map', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.btn_path', 'vi', 'Chọn lộ trình', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.btn_path', 'en', 'Choose a path', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.desc', 'vi', 'Mở Journey Map để chọn bài active, được hướng dẫn và lưu progress sau khi hoàn thành.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.desc', 'en', 'Open the Journey Map to choose the active lesson, get guidance, and save progress after completion.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.title', 'vi', 'Muốn học theo lộ trình?', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.cta.title', 'en', 'Want a guided path?', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.deleteAll', 'vi', 'Xóa tất cả', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.deleteAll', 'en', 'Delete All', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.enterFileName', 'vi', 'Vui lòng nhập tên file!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.enterFileName', 'en', 'Please enter file name!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat1.desc', 'vi', 'Viết vài dòng code và xem output ngay mà không cần mở bài học.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat1.desc', 'en', 'Write a few lines of code and inspect the output without opening a lesson.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat1.title', 'vi', 'Thử nhanh', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat1.title', 'en', 'Try quickly', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat2.desc', 'vi', 'Playground không chấm đúng/sai. Nó chỉ giúp bạn hiểu code đang chạy thế nào.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat2.desc', 'en', 'Playground does not grade correctness. It only helps you understand how code runs.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat2.title', 'vi', 'Tách khỏi kiểm tra', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat2.title', 'en', 'Separate from grading', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat3.desc', 'vi', 'Muốn lưu tiến độ, hãy làm bài trong Learn và vượt qua Kiểm tra.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat3.desc', 'en', 'To save progress, complete the lesson inside Learn and pass Check.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat3.title', 'vi', 'Quay lại Learn khi sẵn sàng', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.feat3.title', 'en', 'Return to Learn when ready', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileList', 'vi', 'Danh sách file', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileList', 'en', 'File List', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileName', 'vi', 'Tên file', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileName', 'en', 'File Name', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileNamePlaceholder', 'vi', 'example.js, script.py, main.cpp, index.html...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.fileNamePlaceholder', 'en', 'example.js, script.py, main.cpp, index.html...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.filesCount', 'vi', '{{count}}/{{max}} files', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.filesCount', 'en', '{{count}}/{{max}} files', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_create_file', 'vi', 'tạo file mới', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_create_file', 'en', 'tạo file mới', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_delete_all', 'vi', 'xóa tất cả file', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_delete_all', 'en', 'xóa tất cả file', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_run_code', 'vi', 'chạy code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.action_run_code', 'en', 'chạy code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.auth_notice', 'vi', 'Bạn có thể xem và sửa code. Đăng nhập để chạy và lưu Lab.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.auth_notice', 'en', 'Bạn có thể xem và sửa code. Đăng nhập để chạy và lưu Lab.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.cancel_button', 'vi', 'Hủy', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.cancel_button', 'en', 'Hủy', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.delete_button', 'vi', 'Xóa', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.delete_button', 'en', 'Xóa', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.desc', 'vi', 'Thử nghiệm tự do với code. Loopy chỉ chạy file đang mở: {file}.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.desc', 'en', 'Thử nghiệm tự do với code. Loopy chỉ chạy file đang mở: {file}.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment1', 'vi', 'Đổi một giá trị và dự đoán output trước khi chạy.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment1', 'en', 'Đổi một giá trị và dự đoán output trước khi chạy.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment2', 'vi', 'Thêm một dòng print/log để kiểm tra suy nghĩ của bạn.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment2', 'en', 'Thêm một dòng print/log để kiểm tra suy nghĩ của bạn.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment3', 'vi', 'Cố tình tạo một lỗi nhỏ rồi đọc terminal để sửa.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment3', 'en', 'Cố tình tạo một lỗi nhỏ rồi đọc terminal để sửa.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment_label', 'vi', 'Thử', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.experiment_label', 'en', 'Thử', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.from_lesson', 'vi', 'Từ bài học: {title}', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.from_lesson', 'en', 'Từ bài học: {title}', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.login_required', 'vi', 'Vui lòng đăng nhập để {action}', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.login_required', 'en', 'Vui lòng đăng nhập để {action}', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.login_to_run', 'vi', 'Đăng nhập để chạy code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.login_to_run', 'en', 'Đăng nhập để chạy code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.run_error', 'vi', 'LỖI', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.run_error', 'en', 'LỖI', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.run_failed', 'vi', 'Không thể thực thi mã nguồn.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.run_failed', 'en', 'Không thể thực thi mã nguồn.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.title', 'vi', 'Loopy Lab', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.lab.title', 'en', 'Loopy Lab', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.languageAutoDetect', 'vi', 'Ngôn ngữ sẽ tự động nhận diện từ extension', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.languageAutoDetect', 'en', 'Language will be auto-detected from extension', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.maxFilesReached', 'vi', 'Tối đa {{max}} file!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.maxFilesReached', 'en', 'Maximum {{max}} files!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.mustKeepOneFile', 'vi', 'Phải giữ ít nhất 1 file!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.mustKeepOneFile', 'en', 'Must keep at least 1 file!', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.newFile', 'vi', 'File mới', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.newFile', 'en', 'New File', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.no_input', 'vi', 'Không có input', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.no_input', 'en', 'No input', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.output.label', 'vi', 'Output', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.output.label', 'en', 'Output', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.readyToRun', 'vi', 'Sẵn sàng chạy code...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.readyToRun', 'en', 'Ready to run code...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runCode', 'vi', 'Chạy code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runCode', 'en', 'Run Code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runSuccessNoOutput', 'vi', '(Chạy thành công nhưng không có lệnh in nào)', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runSuccessNoOutput', 'en', '(Ran successfully but no print statements)', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.run_btn', 'vi', 'Chạy thử', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.run_btn', 'en', 'Run', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runner.label', 'vi', 'Runner', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runner.label', 'en', 'Runner', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runtime_label', 'vi', 'Runtime', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.runtime_label', 'en', 'Runtime', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.sandbox_note', 'vi', 'Sandbox lưu cục bộ trên trình duyệt này và không tính là hoàn thành lesson.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.sandbox_note', 'en', 'This sandbox is saved locally in this browser and does not count as lesson completion.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.badge', 'vi', 'Run khác Check', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.badge', 'en', 'Run is not Check', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.desc', 'vi', 'Output có thể nhìn ổn, nhưng lesson cần rule/test case để xác nhận bạn đã làm đúng mục tiêu học.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.desc', 'en', 'Output can look fine, but a lesson needs rules or test cases to confirm the learning goal is met.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.title', 'vi', 'Chạy được chưa chắc đã đúng yêu cầu.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.separate.title', 'en', 'Running code does not always mean it meets the requirement.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.subtitle', 'vi', 'Playground là sandbox để thử ý tưởng, input và output. Muốn hoàn thành bài, hãy quay lại Learn và bấm Kiểm tra.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.subtitle', 'en', 'Playground is a sandbox for testing ideas, input, and output. To complete a lesson, return to Learn and click Check.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.supportedExtensions', 'vi', 'Hỗ trợ: .js, .ts, .py, .cpp, .html, .css, .json, .md, .php, .rs, .java, .sql...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.supportedExtensions', 'en', 'Supported: .js, .ts, .py, .cpp, .html, .css, .json, .md, .php, .rs, .java, .sql...', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.terminal', 'vi', 'Terminal', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.terminal', 'en', 'Terminal', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.title', 'vi', 'Thử code nhanh, không ảnh hưởng progress.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.title', 'en', 'Try code quickly without affecting progress.', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'pmock.badge', 'vi', 'Lesson 03', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.badge', 'en', 'Lesson 03', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.desc', 'vi', 'Bạn không cần đọc hết lý thuyết trước. Hãy quan sát, sửa code nhỏ, chạy thử, rồi kiểm tra bằng tiêu chí rõ ràng.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.desc', 'en', 'You do not need to read all the theory first. Observe, make a small edit, run it, then check against a clear target.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item1', 'vi', 'Quan sát code mẫu', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item1', 'en', 'Observe sample code', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item2', 'vi', 'Sửa yêu cầu nhỏ', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item2', 'en', 'Edit a small requirement', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item3', 'vi', 'Kiểm tra bằng rule', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item3', 'en', 'Check with rules', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item4', 'vi', 'Debug lỗi thật', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.item4', 'en', 'Debug real errors', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.status', 'vi', 'Đang học', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.status', 'en', 'In progress', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.title', 'vi', 'Thay đổi một dòng, thấy output ngay', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'pmock.title', 'en', 'Change one line and see the output immediately', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'practice.compete.cta', 'vi', 'Vào phòng thi đấu', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.compete.cta', 'en', 'Enter compete mode', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.compete.desc', 'vi', 'Vào phòng 1v1 realtime để luyện phản xạ với câu hỏi ngắn sau khi học.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.compete.desc', 'en', 'Join a realtime 1v1 room and practice reactions with short questions after learning.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.compete.title', 'vi', 'Thi đấu', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.compete.title', 'en', 'Compete', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.blank_placeholder', 'vi', 'Type the expected answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.blank_placeholder', 'en', 'Type the expected answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.correct_blank', 'vi', 'Correct blank answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.correct_blank', 'en', 'Correct blank answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.create_title', 'vi', 'Create question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.create_title', 'en', 'Create question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.edit_title', 'vi', 'Edit question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.edit_title', 'en', 'Edit question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.explanation', 'vi', 'Answer explanation', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.explanation', 'en', 'Answer explanation', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.explanation_placeholder', 'vi', 'Optional explanation shown after the learner answers.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.explanation_placeholder', 'en', 'Optional explanation shown after the learner answers.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.help', 'vi', 'Tick an answer to mark it correct. Empty options stay disabled and will be skipped when saving.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.help', 'en', 'Tick an answer to mark it correct. Empty options stay disabled and will be skipped when saving.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.multi_correct', 'vi', 'Multiple correct answers:', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.multi_correct', 'en', 'Multiple correct answers:', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.options_desc', 'vi', 'Fill 2-4 answers. Empty answers will not be included.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.options_desc', 'en', 'Fill 2-4 answers. Empty answers will not be included.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.options_title', 'vi', 'Answer options', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.options_title', 'en', 'Answer options', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.points', 'vi', 'Points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.points', 'en', 'Points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.prompt', 'vi', 'Question prompt', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.prompt', 'en', 'Question prompt', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.prompt_placeholder', 'vi', 'Type question here', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.prompt_placeholder', 'en', 'Type question here', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.save_question', 'vi', 'Save question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.save_question', 'en', 'Save question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.setup', 'vi', 'Question setup', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.setup', 'en', 'Question setup', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.type', 'vi', 'Question type', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.editor.type', 'en', 'Question type', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.empty', 'vi', 'No matching questions found.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.empty', 'en', 'No matching questions found.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.from_sets', 'vi', 'From sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.from_sets', 'en', 'From sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.idle', 'vi', 'Search existing sets, then add matching questions into this set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.idle', 'en', 'Search existing sets, then add matching questions into this set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.placeholder', 'vi', 'Search for questions on any topic', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.placeholder', 'en', 'Search for questions on any topic', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.searching', 'vi', 'Searching...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.searching', 'en', 'Searching...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.title', 'vi', 'Find questions', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.library.title', 'en', 'Find questions', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.loading', 'vi', 'Loading set builder...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.loading', 'en', 'Loading set builder...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.create_question', 'vi', 'Create question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.create_question', 'en', 'Create question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.empty_desc', 'vi', 'Create a question or find one from existing practice sets.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.empty_desc', 'en', 'Create a question or find one from existing practice sets.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.empty_title', 'vi', 'No questions yet', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.empty_title', 'en', 'No questions yet', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.publish_set', 'vi', 'Publish Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.publish_set', 'en', 'Publish Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.publishing', 'vi', 'Publishing...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.publishing', 'en', 'Publishing...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.settings', 'vi', 'Settings', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.settings', 'en', 'Settings', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.summary', 'vi', '{questions} Questions • {points} Points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.summary', 'en', '{questions} Questions • {points} Points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.update_set', 'vi', 'Update Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.main.update_set', 'en', 'Update Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.draft', 'vi', 'Draft', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.draft', 'en', 'Draft', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.easy', 'vi', 'Easy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.easy', 'en', 'Easy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.hard', 'vi', 'Hard', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.hard', 'en', 'Hard', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.medium', 'vi', 'Medium', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.medium', 'en', 'Medium', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.official', 'vi', 'Official', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.official', 'en', 'Official', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.private', 'vi', 'Private', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.private', 'en', 'Private', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.public', 'vi', 'Public', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.public', 'en', 'Public', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.published', 'vi', 'Published', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.published', 'en', 'Published', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.unlisted', 'vi', 'Unlisted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.option.unlisted', 'en', 'Unlisted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.seo_title', 'vi', 'Create Practice Set | Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.seo_title', 'en', 'Create Practice Set | Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.badge', 'vi', 'Set settings', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.badge', 'en', 'Set settings', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.description', 'vi', 'Description', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.description', 'en', 'Description', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.description_placeholder', 'vi', 'Short note about this practice set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.description_placeholder', 'en', 'Short note about this practice set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.difficulty', 'vi', 'Difficulty', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.difficulty', 'en', 'Difficulty', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.language', 'vi', 'Language', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.language', 'en', 'Language', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_help', 'vi', 'When filled, learners must complete this many lessons in the selected language before starting the set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_help', 'en', 'When filled, learners must complete this many lessons in the selected language before starting the set.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_lessons', 'vi', 'Required completed lessons', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_lessons', 'en', 'Required completed lessons', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_placeholder', 'vi', 'Leave empty for no requirement', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.required_placeholder', 'en', 'Leave empty for no requirement', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.set_title', 'vi', 'Set title', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.set_title', 'en', 'Set title', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.status', 'vi', 'Status', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.status', 'en', 'Status', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.title', 'vi', 'Practice set details', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.title', 'en', 'Practice set details', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.topic', 'vi', 'Topic', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.topic', 'en', 'Topic', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.topic_placeholder', 'vi', 'Arrays, loops, functions...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.topic_placeholder', 'en', 'Arrays, loops, functions...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.visibility', 'vi', 'Visibility', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.settings.visibility', 'en', 'Visibility', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.add_question', 'vi', 'Add at least one question before publishing', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.add_question', 'en', 'Add at least one question before publishing', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.created', 'vi', 'Practice set created successfully', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.created', 'en', 'Practice set created successfully', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.load_error', 'vi', 'Unable to load set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.load_error', 'en', 'Unable to load set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.restricted', 'vi', 'This set contains restricted keywords', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.restricted', 'en', 'This set contains restricted keywords', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.save_error', 'vi', 'Unable to save practice set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.save_error', 'en', 'Unable to save practice set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.updated', 'vi', 'Practice set updated successfully', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.toast.updated', 'en', 'Practice set updated successfully', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.warning.message', 'vi', 'Found restricted keyword{s}: {keywords}. Please revise this content before publishing.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.warning.message', 'en', 'Found restricted keyword{s}: {keywords}. Please revise this content before publishing.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.warning.title', 'vi', 'Content warning', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.create.warning.title', 'en', 'Content warning', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.attempt_badge', 'vi', 'Practice attempt', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.attempt_badge', 'en', 'Practice attempt', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_my_sets', 'vi', 'Back to my set library', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_my_sets', 'en', 'Back to my set library', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_official_sets', 'vi', 'Back to official sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_official_sets', 'en', 'Back to official sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_overview', 'vi', 'Back to set overview', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_overview', 'en', 'Back to set overview', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_sets', 'vi', 'Back to sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.back_sets', 'en', 'Back to sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.completed_title', 'vi', 'Practice completed', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.completed_title', 'en', 'Practice completed', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.correct', 'vi', 'Correct', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.correct', 'en', 'Correct', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.earned_points', 'vi', 'Earned {earned}/{points} points.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.earned_points', 'en', 'Earned {earned}/{points} points.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.language', 'vi', 'Language: {language}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.language', 'en', 'Language: {language}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.loading', 'vi', 'Loading practice set...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.loading', 'en', 'Loading practice set...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.next_question', 'vi', 'Next question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.next_question', 'en', 'Next question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.not_found', 'vi', 'Practice set not found', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.not_found', 'en', 'Practice set not found', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.points', 'vi', '{points} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.points', 'en', '{points} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.progress_summary', 'vi', '{submitted}/{total} submitted · {earned}/{max} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.progress_summary', 'en', '{submitted}/{total} submitted · {earned}/{max} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_count', 'vi', '{count} questions', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_count', 'en', '{count} questions', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_fallback', 'vi', 'Practice question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_fallback', 'en', 'Practice question', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_label', 'vi', 'Question {index}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.question_label', 'en', 'Question {index}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.score_summary', 'vi', 'Your score: {earned}/{max} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.score_summary', 'en', 'Your score: {earned}/{max} points', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.seo_fallback', 'vi', 'Practice Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.seo_fallback', 'en', 'Practice Set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.starting', 'vi', 'Starting...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.starting', 'en', 'Starting...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submit_answer', 'vi', 'Submit answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submit_answer', 'en', 'Submit answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submitted', 'vi', 'Submitted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submitted', 'en', 'Submitted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submitting', 'vi', 'Submitting...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.submitting', 'en', 'Submitting...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.choose_answer', 'vi', 'Choose an answer first', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.choose_answer', 'en', 'Choose an answer first', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.choose_one', 'vi', 'Choose at least one answer first', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.choose_one', 'en', 'Choose at least one answer first', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.correct', 'vi', 'Correct answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.correct', 'en', 'Correct answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.fill_blank', 'vi', 'Fill in the answer before submitting', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.fill_blank', 'en', 'Fill in the answer before submitting', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.started', 'vi', 'Started practice attempt ({count} questions)', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.started', 'en', 'Started practice attempt ({count} questions)', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.submit_error', 'vi', 'Unable to submit answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.submit_error', 'en', 'Unable to submit answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.submitted', 'vi', 'Answer submitted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.submitted', 'en', 'Answer submitted', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.unavailable', 'vi', 'You have not met the requirements, or this practice set is unavailable', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.toast.unavailable', 'en', 'You have not met the requirements, or this practice set is unavailable', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.topic', 'vi', 'Topic: {topic}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.topic', 'en', 'Topic: {topic}', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.your_answer', 'vi', 'Your answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.detail.your_answer', 'en', 'Your answer', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.back', 'vi', 'Back to practice', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.back', 'en', 'Back to practice', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.badge', 'vi', 'Official', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.badge', 'en', 'Official', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.desc', 'vi', 'Đội phát triển có thể phát hành bộ bài theo ngôn ngữ, cấp độ và chủ đề.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.desc', 'en', 'The team can publish sets by language, difficulty, and topic.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.empty_desc', 'vi', 'Đội ngũ phát triển hiện đang chuẩn bị các nội dung chính thức. Bạn hãy quay lại sau nhé!', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.empty_desc', 'en', 'Đội ngũ phát triển hiện đang chuẩn bị các nội dung chính thức. Bạn hãy quay lại sau nhé!', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.empty_title', 'vi', 'Chưa có bộ bài tập chính thức nào', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.empty_title', 'en', 'Chưa có bộ bài tập chính thức nào', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.loading', 'vi', 'Loading official sets...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.loading', 'en', 'Loading official sets...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.seo_desc', 'vi', 'Bộ bài tập chính thức từ đội ngũ Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.seo_desc', 'en', 'Bộ bài tập chính thức từ đội ngũ Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.seo_title', 'vi', 'Official Sets | Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.seo_title', 'en', 'Official Sets | Loopy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.subtitle', 'vi', 'Các bộ bài tập chuẩn do đội ngũ phát triển xây dựng để đánh giá chính xác kiến thức của bạn.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.subtitle', 'en', 'Các bộ bài tập chuẩn do đội ngũ phát triển xây dựng để đánh giá chính xác kiến thức của bạn.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.title', 'vi', 'Bộ chính thức', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.official.title', 'en', 'Official sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.badge', 'vi', 'Practice sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.badge', 'en', 'Practice sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.create', 'vi', 'Tạo bộ', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.create', 'en', 'Create set', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.cta', 'vi', 'Duyệt bộ bài tập', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.cta', 'en', 'Browse sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.desc', 'vi', 'Làm bộ câu hỏi có sẵn hoặc tự tạo bộ luyện tập tối đa 30 câu.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.desc', 'en', 'Work through prepared question sets or create your own set with up to 30 questions.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.empty.desc', 'vi', 'Backend đã sẵn sàng cho bộ bài tập. Khi team hoặc người dùng publish bộ public, danh sách sẽ hiển thị tại đây.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.empty.desc', 'en', 'The backend is ready for practice sets. Public sets will appear here after the team or learners publish them.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.empty.title', 'vi', 'Chưa có bộ bài tập công khai', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.empty.title', 'en', 'No public practice sets yet', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.all_difficulties', 'vi', 'Tất cả độ khó', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.all_difficulties', 'en', 'Tất cả độ khó', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.easy', 'vi', 'Easy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.easy', 'en', 'Easy', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.hard', 'vi', 'Hard', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.hard', 'en', 'Hard', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.language', 'vi', 'Ngôn ngữ, ví dụ javascript', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.language', 'en', 'Ngôn ngữ, ví dụ javascript', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.medium', 'vi', 'Medium', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.medium', 'en', 'Medium', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.mine_only', 'vi', 'Của tôi', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.mine_only', 'en', 'Của tôi', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.reset', 'vi', 'Reset', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.reset', 'en', 'Reset', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.topic', 'vi', 'Chủ đề', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.filter.topic', 'en', 'Chủ đề', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.loading', 'vi', 'Loading practice sets...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.loading', 'en', 'Loading practice sets...', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.locked', 'vi', 'Chưa mở khóa', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.locked', 'en', 'Locked', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.page.subtitle', 'vi', 'Duyệt bộ bài tập chính thức hoặc bộ công khai do người học tạo để ôn theo chủ đề.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.page.subtitle', 'en', 'Browse official sets or public learner-created sets to review by topic.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.page.title', 'vi', 'Bộ bài tập', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.page.title', 'en', 'Practice sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.question_count', 'vi', '{count} câu', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.question_count', 'en', '{count} câu', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.start', 'vi', 'Bắt đầu', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.start', 'en', 'Start', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.title', 'vi', 'Bộ bài tập', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.sets.title', 'en', 'Practice sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.subtitle', 'vi', 'Chọn cách ôn phù hợp: thi đấu realtime để luyện phản xạ, hoặc làm bộ bài tập để củng cố từng chủ đề.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.subtitle', 'en', 'Choose how to review: compete in realtime for speed, or work through practice sets to reinforce each topic.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.title', 'vi', 'Luyện tập sau khi học.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.title', 'en', 'Practice after learning.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.user.desc', 'vi', 'Người dùng tạo bộ luyện tập riêng, đặt tên, chủ đề, yêu cầu mở khóa và tối đa 30 câu.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.user.desc', 'en', 'Learners can create private practice sets with a title, topic, unlock requirement, and up to 30 questions.', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.user.title', 'vi', 'Bộ cá nhân', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'practice.user.title', 'en', 'Personal sets', 'text' FROM categories c WHERE c.name = 'practice'
UNION ALL
SELECT c.id, 'profile.activity.current_journey_desc', 'vi', 'Journey Map đang mở theo {language}.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.current_journey_desc', 'en', 'Journey Map đang mở theo {language}.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.current_journey_title', 'vi', 'Lộ trình hiện tại', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.current_journey_title', 'en', 'Lộ trình hiện tại', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.no_progress_desc', 'vi', 'Hoàn thành một lesson bằng nút Kiểm tra để backend ghi nhận tiến độ.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.no_progress_desc', 'en', 'Hoàn thành một lesson bằng nút Kiểm tra để backend ghi nhận tiến độ.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.no_progress_title', 'vi', 'Chưa có progress đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.no_progress_title', 'en', 'Chưa có progress đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_done_desc', 'vi', 'Mục tiêu học và ngôn ngữ ưu tiên đã được lưu trong profile.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_done_desc', 'en', 'Mục tiêu học và ngôn ngữ ưu tiên đã được lưu trong profile.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_done_title', 'vi', 'Onboarding đã hoàn tất', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_done_title', 'en', 'Onboarding đã hoàn tất', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_missing_desc', 'vi', 'Chạy onboarding để Loopy gợi ý lộ trình đầu tiên.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_missing_desc', 'en', 'Chạy onboarding để Loopy gợi ý lộ trình đầu tiên.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_missing_title', 'vi', 'Onboarding chưa hoàn tất', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.onboarding_missing_title', 'en', 'Onboarding chưa hoàn tất', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.progress_saved_desc', 'vi', '{count} đã được backend ghi nhận qua progress.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.progress_saved_desc', 'en', '{count} đã được backend ghi nhận qua progress.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.progress_saved_title', 'vi', 'Progress đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.activity.progress_saved_title', 'en', 'Progress đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.badge', 'vi', 'Hồ sơ', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.badge', 'en', 'Profile', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.build_web', 'vi', 'profile.goal.build_web', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.build_web', 'en', 'profile.goal.build_web', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.explore', 'vi', 'profile.goal.explore', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.explore', 'en', 'profile.goal.explore', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.school_work', 'vi', 'profile.goal.school_work', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.school_work', 'en', 'profile.goal.school_work', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.start_from_zero', 'vi', 'profile.goal.start_from_zero', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goal.start_from_zero', 'en', 'profile.goal.start_from_zero', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.current_goal', 'vi', 'Mục tiêu hiện tại', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.current_goal', 'en', 'Current goal', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.experience_empty', 'vi', 'Chưa chọn', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.experience_empty', 'en', 'Chưa chọn', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.experience_level', 'vi', 'Mức kinh nghiệm', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.experience_level', 'en', 'Mức kinh nghiệm', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.newbie_path_desc', 'vi', 'Loopy ưu tiên một bước tiếp theo rõ ràng thay vì bắt bạn tự chọn giữa nhiều chủ đề.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.newbie_path_desc', 'en', 'Loopy prioritizes one clear next step instead of making you choose from too many topics.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.newbie_path_title', 'vi', 'Lộ trình cho người mới', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.newbie_path_title', 'en', 'Newbie-first path', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.preferred_language', 'vi', 'Ngôn ngữ ưu tiên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.preferred_language', 'en', 'Preferred language', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.tab.desc', 'vi', 'Giữ mục tiêu đủ nhỏ để làm được ngay hôm nay. Bạn có thể đổi lộ trình mà không mất progress đã lưu.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.tab.desc', 'en', 'Keep the goal small enough to act on today. You can update your path without losing saved progress.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.tab.title', 'vi', 'Mục tiêu học tập', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.tab.title', 'en', 'Learning goals', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.update_btn', 'vi', 'Cập nhật lộ trình', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.update_btn', 'en', 'Update my path', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.view_all_paths', 'vi', 'Xem tất cả lộ trình', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.goals.view_all_paths', 'en', 'View all paths', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.badge', 'vi', 'Tiến độ học tập', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.badge', 'en', 'Journey progress', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.empty', 'vi', 'Chưa có lesson nào được lưu. Hãy hoàn thành bài đầu tiên bằng nút Kiểm tra.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.empty', 'en', 'Chưa có lesson nào được lưu. Hãy hoàn thành bài đầu tiên bằng nút Kiểm tra.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.lessons_done', 'vi', 'bài đã hoàn thành', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.lessons_done', 'en', 'lessons completed', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card1', 'vi', 'Tiếp tục từ Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card1', 'en', 'Continue from the Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card2', 'vi', 'Trang library tách bài đã xong, bài hiện tại, bài kế tiếp và bài bị khóa để bạn không phải đoán.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card2', 'en', 'The library page separates completed, current, next, and locked lessons so you do not have to guess.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card3', 'vi', 'Mở Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.card3', 'en', 'Open Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.desc', 'vi', 'Tóm tắt này dùng progress đã lưu và dữ liệu tài khoản. Mở Journey Map để xem chính xác bài tiếp theo.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.desc', 'en', 'This summary uses saved progress and account data. Open Journey Map for the exact next lesson.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.title', 'vi', 'Hành trình đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.tab.title', 'en', 'Your saved journey', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.title', 'vi', 'Bạn đang xây thói quen học code từng bước.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.journey.title', 'en', 'You are building a coding habit one step at a time.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.loading', 'vi', 'Đang tải hồ sơ…', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.loading', 'en', 'Loading profile...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.complete_lesson', 'vi', 'Đã hoàn thành và lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.complete_lesson', 'en', 'Completed and saved', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.daily_habit', 'vi', 'Thói quen học mỗi ngày', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.daily_habit', 'en', 'daily habit', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.saved_lessons', 'vi', 'Bài học đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.metric.note.saved_lessons', 'en', 'saved lessons', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.badge', 'vi', 'Bài học tiếp theo', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.badge', 'en', 'Next lesson', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.btn_journey', 'vi', 'Vào Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.btn_journey', 'en', 'Go to Journey Map', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.btn_path', 'vi', 'Xem lộ trình', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.btn_path', 'en', 'View paths', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.desc', 'vi', 'Tiếp tục bài active thay vì chọn ngẫu nhiên một chủ đề mới.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.desc', 'en', 'Continue the active lesson instead of picking a random new topic.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.headline', 'vi', 'Quay lại đúng bước đang mở.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.headline', 'en', 'Return to the step that is already open.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.title', 'vi', 'Bài nên học tiếp theo', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.next.title', 'en', 'Recommended next lesson', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.desc', 'vi', 'Loopy không celebration trước khi backend xác nhận bài học đã hoàn thành.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.desc', 'en', 'Loopy does not celebrate before the backend confirms the lesson is complete.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.docs_rule', 'vi', 'Docs là tài liệu tham khảo; progress chỉ lưu sau khi lesson được Kiểm tra thành công.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.docs_rule', 'en', 'Docs là tài liệu tham khảo; progress chỉ lưu sau khi lesson được Kiểm tra thành công.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.no_progress', 'vi', 'Chưa có progress backend; hoàn thành lesson đầu tiên để profile cập nhật.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.no_progress', 'en', 'Chưa có progress backend; hoàn thành lesson đầu tiên để profile cập nhật.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.progress_saved', 'vi', 'Progress đang đọc từ backend. Mở Journey Map để tiếp tục đúng bước.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.progress_saved', 'en', 'Progress đang đọc từ backend. Mở Journey Map để tiếp tục đúng bước.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.title', 'vi', 'Progress chỉ tăng sau khi lưu thành công.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notice.title', 'en', 'Progress only increases after a successful save.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item1', 'vi', 'Hiển thị nhắc nhở khi bài tiếp theo đã sẵn sàng.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item1', 'en', 'Show a reminder when the next lesson is available.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item2', 'vi', 'Hiển thị ghi chú khi progress đã lưu thành công.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item2', 'en', 'Show a note when progress was saved successfully.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item3', 'vi', 'Hiển thị hướng dẫn trước khi vào PvP quá sớm.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.item3', 'en', 'Show guidance before entering PvP too early.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.tab.desc', 'vi', 'Các nhắc nhở này hiển thị trong Loopy. Email và push notification chưa bật cho đến khi backend hỗ trợ.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.tab.desc', 'en', 'These reminders are shown inside Loopy. Email and push delivery are not enabled until backend support exists.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.tab.title', 'vi', 'Thông báo trong app', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notifications.tab.title', 'en', 'In-app notifications', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notify.badge', 'vi', 'Thông báo', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.notify.badge', 'en', 'Notice', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.saved_lessons.plural', 'vi', '{count} bài học đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.saved_lessons.plural', 'en', '{count} saved lessons', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.saved_lessons.singular', 'vi', '1 bài học đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.saved_lessons.singular', 'en', '1 saved lesson', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.account', 'vi', 'Tài khoản', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.account', 'en', 'Account', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.account_title', 'vi', 'Thông tin tài khoản', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.account_title', 'en', 'Thông tin tài khoản', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.avatar_title', 'vi', 'Ảnh đại diện', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.avatar_title', 'en', 'Ảnh đại diện', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio', 'vi', 'Giới thiệu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio', 'en', 'Bio', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio_limit', 'vi', '(tối đa 500 ký tự)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio_limit', 'en', '(tối đa 500 ký tự)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio_placeholder', 'vi', 'Giới thiệu ngắn về bản thân...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.bio_placeholder', 'en', 'Giới thiệu ngắn về bản thân...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.choose_preset', 'vi', 'Chọn ảnh có sẵn', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.choose_preset', 'en', 'Chọn ảnh có sẵn', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.display_name', 'vi', 'Tên hiển thị', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.display_name', 'en', 'Tên hiển thị', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.display_name_placeholder', 'vi', 'Nhập tên hiển thị...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.display_name_placeholder', 'en', 'Nhập tên hiển thị...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.email_label', 'vi', 'Email (không thể thay đổi)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.email_label', 'en', 'Email (không thể thay đổi)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.build_web', 'vi', 'Làm website', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.build_web', 'en', 'Làm website', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.explore', 'vi', 'Khám phá xem code có hợp không', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.explore', 'en', 'Khám phá xem code có hợp không', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.school_work', 'vi', 'Phục vụ việc học ở trường', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.school_work', 'en', 'Phục vụ việc học ở trường', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.start_from_zero', 'vi', 'Bắt đầu từ số 0', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.goal.start_from_zero', 'en', 'Bắt đầu từ số 0', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language', 'vi', 'Ngôn ngữ ưu tiên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language', 'en', 'Preferred language', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.cpp', 'vi', 'C++', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.cpp', 'en', 'C++', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.javascript', 'vi', 'JavaScript', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.javascript', 'en', 'JavaScript', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.python', 'vi', 'Python', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.language.python', 'en', 'Python', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.learning_goal', 'vi', 'Mục tiêu học', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.learning_goal', 'en', 'Mục tiêu học', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.learning_path_title', 'vi', 'Lộ trình học', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.learning_path_title', 'en', 'Lộ trình học', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.locked', 'vi', 'Khóa', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.locked', 'en', 'Khóa', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding', 'vi', 'Thiết lập lộ trình', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding', 'en', 'Onboarding', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_button', 'vi', 'Chạy lại onboarding', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_button', 'en', 'Chạy lại onboarding', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_desc', 'vi', 'Chạy lại onboarding để Loopy gợi ý lại lộ trình phù hợp nhất với bạn.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_desc', 'en', 'Chạy lại onboarding để Loopy gợi ý lại lộ trình phù hợp nhất với bạn.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_title', 'vi', 'Cập nhật onboarding', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.onboarding_title', 'en', 'Cập nhật onboarding', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.preferred_language', 'vi', 'Ngôn ngữ ưu tiên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.preferred_language', 'en', 'Ngôn ngữ ưu tiên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.remove_avatar', 'vi', 'Xóa ảnh', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.remove_avatar', 'en', 'Xóa ảnh', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_button', 'vi', 'Lưu thay đổi', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_button', 'en', 'Lưu thay đổi', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_desc', 'vi', 'Cập nhật tên, bio và lộ trình học của bạn.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_desc', 'en', 'Cập nhật tên, bio và lộ trình học của bạn.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_title', 'vi', 'Lưu thay đổi', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.save_title', 'en', 'Lưu thay đổi', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.saving', 'vi', 'Đang lưu...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.saving', 'en', 'Đang lưu...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.tab.desc', 'vi', 'Chỉ hiển thị các thao tác tóm tắt an toàn. Hành động xóa/nhạy cảm cần backend hỗ trợ trước.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.tab.desc', 'en', 'Only safe account summary actions are shown here. Destructive actions need backend support first.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.tab.title', 'vi', 'Cài đặt tài khoản', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.tab.title', 'en', 'Account settings', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_button', 'vi', 'Chọn ảnh... (Tự nén)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_button', 'en', 'Chọn ảnh... (Tự nén)', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_help', 'vi', 'Ảnh sẽ được tự động nén thu nhỏ để tiết kiệm dữ liệu.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_help', 'en', 'Ảnh sẽ được tự động nén thu nhỏ để tiết kiệm dữ liệu.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_label', 'vi', 'Hoặc tự tải ảnh lên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.settings.upload_label', 'en', 'Hoặc tự tải ảnh lên', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.sidebar.role', 'vi', 'Người học Loopy', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.sidebar.role', 'en', 'Loopy learner', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.points', 'vi', 'Điểm', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.points', 'en', 'Points', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.saved', 'vi', 'Progress đã lưu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.saved', 'en', 'Progress saved', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.streak', 'vi', 'Chuỗi ngày học', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.stats.streak', 'en', 'Streak', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.subtitle', 'vi', 'Xem tiến độ, streak, điểm và bài nên học tiếp theo trong hành trình Loopy.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.subtitle', 'en', 'Review your progress, streak, points, and the next lesson in your Loopy journey.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.goals', 'vi', 'Mục tiêu', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.goals', 'en', 'Goals', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.journey', 'vi', 'Hành trình', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.journey', 'en', 'Journey', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.notifications', 'vi', 'Thông báo', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.notifications', 'en', 'Notifications', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.overview', 'vi', 'Tổng quan', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.overview', 'en', 'Overview', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.settings', 'vi', 'Cài đặt', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.tab.settings', 'en', 'Settings', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.title', 'vi', 'Hồ sơ học tập của bạn.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.title', 'en', 'Your learning profile.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.connection_error', 'vi', 'Lỗi kết nối. Vui lòng thử lại.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.connection_error', 'en', 'Lỗi kết nối. Vui lòng thử lại.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.image_only', 'vi', 'Chỉ hỗ trợ file ảnh', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.image_only', 'en', 'Chỉ hỗ trợ file ảnh', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.save_error', 'vi', 'Cập nhật thất bại', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.save_error', 'en', 'Cập nhật thất bại', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.save_success', 'vi', 'Cập nhật thông tin thành công! Trang sẽ tự làm mới...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.toast.save_success', 'en', 'Cập nhật thông tin thành công! Trang sẽ tự làm mới...', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.badge', 'vi', 'Mục tiêu hôm nay', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.badge', 'en', 'Today focus', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.desc', 'vi', 'Mục tiêu hôm nay: hoàn thành một lesson có kiểm tra thành công.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.desc', 'en', 'Today’s goal: complete one lesson with a successful Check.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.progress', 'vi', 'Tiến độ hôm nay', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.progress', 'en', 'Today’s progress', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.title', 'vi', 'Một bài nhỏ là đủ.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'profile.today.title', 'en', 'One small lesson is enough.', 'text' FROM categories c WHERE c.name = 'profile'
UNION ALL
SELECT c.id, 'pvp.arena.players_title', 'vi', 'Người chơi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.players_title', 'en', 'Người chơi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.question_label', 'vi', 'Câu hỏi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.question_label', 'en', 'Câu hỏi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.round_over_title', 'vi', 'Hết vòng!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.round_over_title', 'en', 'Hết vòng!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submit_answer', 'vi', 'Gửi đáp án', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submit_answer', 'en', 'Gửi đáp án', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submit_code', 'vi', 'Gửi code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submit_code', 'en', 'Gửi code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submitted', 'vi', 'Đã gửi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.submitted', 'en', 'Đã gửi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.your_solution', 'vi', 'Lời giải của bạn', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.arena.your_solution', 'en', 'Lời giải của bạn', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.btn.start1v1', 'vi', 'Bắt đầu 1v1', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.btn.start1v1', 'en', 'Start 1v1', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.challenge_hub', 'vi', 'Challenge Hub', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.challenge_hub', 'en', 'Challenge Hub', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.completeOnboardingFirst', 'vi', 'Bạn cần hoàn thành bài học đầu tiên để tham gia thử thách!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.completeOnboardingFirst', 'en', 'Please complete your first lesson to join challenges!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.diff.title', 'vi', 'Độ khó', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.diff.title', 'en', 'Difficulty', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.duel', 'vi', 'Thử thách 1v1', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.duel', 'en', '1v1 Challenge', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat1.desc', 'vi', 'Tập trung vào một kỹ năng cụ thể thay vì bài toán quá lớn.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat1.desc', 'en', 'Focus on one specific skill instead of a problem that is too large.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat1.title', 'vi', 'Câu hỏi nhỏ', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat1.title', 'en', 'Small questions', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat2.desc', 'vi', 'Theo dõi trạng thái trận, thời gian và lượt nộp bài trong cùng một phòng.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat2.desc', 'en', 'Track match state, time, and submissions inside the same room.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat2.title', 'vi', 'Realtime feedback', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat2.title', 'en', 'Realtime feedback', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat3.desc', 'vi', 'PvP phù hợp để ôn lại kỹ năng đã học trong Journey Map.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat3.desc', 'en', 'PvP works best for reviewing skills you have already practiced in the Journey Map.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat3.title', 'vi', 'Luyện sau khi học', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.feat3.title', 'en', 'Practice after learning', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.header.title', 'vi', 'PvP Coding Room', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.header.title', 'en', 'PvP Coding Room', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.input.code', 'vi', 'Nhập mã phòng', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.input.code', 'en', 'Enter room code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.invalidRoomCode', 'vi', 'Mã phòng không hợp lệ hoặc không tồn tại', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.invalidRoomCode', 'en', 'Invalid or non-existent room code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.joinRoom', 'vi', 'Tham gia phòng', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.joinRoom', 'en', 'Join Room', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.joining', 'vi', 'Đang tham gia...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.joining', 'en', 'Joining...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.anonymous', 'vi', 'pvp.lobby.anonymous', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.anonymous', 'en', 'pvp.lobby.anonymous', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.copy_room_code', 'vi', 'pvp.lobby.copy_room_code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.copy_room_code', 'en', 'pvp.lobby.copy_room_code', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.difficulty_label', 'vi', 'pvp.lobby.difficulty_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.difficulty_label', 'en', 'pvp.lobby.difficulty_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.language_label', 'vi', 'pvp.lobby.language_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.language_label', 'en', 'pvp.lobby.language_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.leave_room', 'vi', 'pvp.lobby.leave_room', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.leave_room', 'en', 'pvp.lobby.leave_room', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.mode_label', 'vi', 'pvp.lobby.mode_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.mode_label', 'en', 'pvp.lobby.mode_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.need_more_players', 'vi', 'pvp.lobby.need_more_players', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.need_more_players', 'en', 'pvp.lobby.need_more_players', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.questions_label', 'vi', 'pvp.lobby.questions_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.questions_label', 'en', 'pvp.lobby.questions_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.ready', 'vi', 'pvp.lobby.ready', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.ready', 'en', 'pvp.lobby.ready', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.ready_button', 'vi', 'pvp.lobby.ready_button', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.ready_button', 'en', 'pvp.lobby.ready_button', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.room_code_label', 'vi', 'pvp.lobby.room_code_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.room_code_label', 'en', 'pvp.lobby.room_code_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.room_title', 'vi', 'pvp.lobby.room_title', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.room_title', 'en', 'pvp.lobby.room_title', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.settings_title', 'vi', 'pvp.lobby.settings_title', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.settings_title', 'en', 'pvp.lobby.settings_title', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.share_code_desc', 'vi', 'pvp.lobby.share_code_desc', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.share_code_desc', 'en', 'pvp.lobby.share_code_desc', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.starting_match', 'vi', 'pvp.lobby.starting_match', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.starting_match', 'en', 'pvp.lobby.starting_match', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.time_per_question_label', 'vi', 'pvp.lobby.time_per_question_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.time_per_question_label', 'en', 'pvp.lobby.time_per_question_label', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting', 'vi', 'pvp.lobby.waiting', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting', 'en', 'pvp.lobby.waiting', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting_others', 'vi', 'pvp.lobby.waiting_others', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting_others', 'en', 'pvp.lobby.waiting_others', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting_players', 'vi', 'pvp.lobby.waiting_players', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.waiting_players', 'en', 'pvp.lobby.waiting_players', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.you_marker', 'vi', 'pvp.lobby.you_marker', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.lobby.you_marker', 'en', 'pvp.lobby.you_marker', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.btn', 'vi', 'Quay lại học', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.btn', 'en', 'Back to learning', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.desc', 'vi', 'PvP sẽ dễ hơn khi bạn đã quen flow chạy thử, kiểm tra và đọc output trong Learn.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.desc', 'en', 'PvP is easier after you are comfortable with Run, Check, and reading output inside Learn.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.title', 'vi', 'Hoàn thành vài bài trước khi vào PvP.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.locked.title', 'en', 'Complete a few lessons before entering PvP.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.loginToPlay', 'vi', 'Vui lòng đăng nhập để tham gia thử thách', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.loginToPlay', 'en', 'Please login to join challenges', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.backToLobby', 'vi', 'Quay lại sảnh', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.backToLobby', 'en', 'Back to Lobby', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.completed', 'vi', 'Trận đấu kết thúc!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.completed', 'en', 'Match completed!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.forfeit', 'vi', '🏳️ {{name}} đã bị xử thua do mất kết nối.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.forfeit', 'en', '🏳️ {{name}} forfeited due to disconnection.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.newQuestion', 'vi', 'Câu hỏi mới!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.newQuestion', 'en', 'New question!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.notfound.desc', 'vi', 'Mã phòng có thể sai hoặc trận đã kết thúc. Hãy kiểm tra lại mã hoặc tạo trận mới.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.notfound.desc', 'en', 'The room code may be wrong or the match may have ended. Check the code or create a new match.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.notfound.title', 'vi', 'Không tìm thấy trận đấu', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.notfound.title', 'en', 'Match not found', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.paused', 'vi', '⏸️ {{name}} đã mất kết nối. Đợi {{seconds}}s...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.paused', 'en', '⏸️ {{name}} disconnected. Waiting {{seconds}}s...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.pausedTitle', 'vi', 'Trận đấu tạm dừng', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.pausedTitle', 'en', 'Match Paused', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerJoined', 'vi', '{{name}} đã tham gia!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerJoined', 'en', '{{name}} joined!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerLeft', 'vi', '{{name}} đã rời đi', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerLeft', 'en', '{{name}} left', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerReady', 'vi', '{{name}} đã sẵn sàng!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.playerReady', 'en', '{{name}} is ready!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.preparingNext', 'vi', 'Chuẩn bị câu hỏi tiếp theo...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.preparingNext', 'en', 'Preparing next question...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.reconHint', 'vi', 'Nếu không kết nối lại kịp, người chơi sẽ bị xử thua', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.reconHint', 'en', 'If not reconnected in time, player will forfeit', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.resumed', 'vi', '🔄 {{name}} đã kết nối lại! Tiếp tục trận đấu.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.resumed', 'en', '🔄 {{name}} reconnected! Resuming match.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.started', 'vi', 'Trận đấu bắt đầu!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.started', 'en', 'Match started!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.summarizing', 'vi', 'Đang tổng hợp kết quả chung cuộc...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.summarizing', 'en', 'Summarizing final results...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.waitingRecon', 'vi', 'Đang chờ kết nối lại', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.match.waitingRecon', 'en', 'Waiting for reconnection', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.matchFound', 'vi', 'Đã tìm thấy thử thách!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.matchFound', 'en', 'Challenge found!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.1v1.desc', 'vi', 'Ghép với một người học khác trong trận ngắn, tập trung vào một câu hỏi.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.1v1.desc', 'en', 'Match with one learner in a short round focused on a single question.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.br.desc', 'vi', 'Chế độ nhiều người đang được chuẩn bị. Hãy bắt đầu với 1v1 trước.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.br.desc', 'en', 'The multi-player mode is being prepared. Start with 1v1 first.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.br.title', 'vi', 'Battle Royale', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.br.title', 'en', 'Battle Royale', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.title', 'vi', 'Chọn chế độ', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.mode.title', 'en', 'Choose a mode', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.or', 'vi', 'hoặc', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.or', 'en', 'or', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.correct', 'vi', 'Đúng', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.correct', 'en', 'Đúng', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.disconnected', 'vi', 'Mất kết nối', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.disconnected', 'en', 'Mất kết nối', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.score', 'vi', 'Điểm', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.score', 'en', 'Điểm', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.you_marker', 'vi', '(Bạn)', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.participant.you_marker', 'en', '(Bạn)', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.back_to_journey', 'vi', 'Về lộ trình', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.back_to_journey', 'en', 'Về lộ trình', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.complete_desc', 'vi', 'Bạn kết thúc ở hạng #{rank}. Đây là tín hiệu tốt để biết phần nào cần ôn lại.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.complete_desc', 'en', 'Bạn kết thúc ở hạng #{rank}. Đây là tín hiệu tốt để biết phần nào cần ôn lại.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.complete_title', 'vi', 'Trận đấu hoàn thành', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.complete_title', 'en', 'Trận đấu hoàn thành', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.draw_desc', 'vi', 'Bạn giữ được nhịp rất tốt. Lần sau thử tăng độ khó.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.draw_desc', 'en', 'Bạn giữ được nhịp rất tốt. Lần sau thử tăng độ khó.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.draw_title', 'vi', 'Hòa ở hạng nhất!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.draw_title', 'en', 'Hòa ở hạng nhất!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.loading', 'vi', 'Đang tải kết quả...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.loading', 'en', 'Đang tải kết quả...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.play_again', 'vi', 'Đấu lại', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.play_again', 'en', 'Đấu lại', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.points_label', 'vi', 'điểm', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.points_label', 'en', 'điểm', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.rank_label', 'vi', 'Hạng #{rank}', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.rank_label', 'en', 'Hạng #{rank}', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.win_desc', 'vi', 'Tốt lắm. Hãy xem lại câu nào giúp bạn ghi điểm nhanh nhất.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.win_desc', 'en', 'Tốt lắm. Hãy xem lại câu nào giúp bạn ghi điểm nhanh nhất.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.win_title', 'vi', 'Bạn thắng vòng này!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.win_title', 'en', 'Bạn thắng vòng này!', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.you_marker', 'vi', '(Bạn)', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.results.you_marker', 'en', '(Bạn)', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.searching', 'vi', 'Đang tìm người chơi...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.searching', 'en', 'Searching for player...', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.subtitle', 'vi', 'Vào phòng 1v1, giải câu hỏi nhỏ và so sánh cách xử lý. PvP giúp luyện phản xạ, không thay thế lộ trình học chính.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.subtitle', 'en', 'Join a 1v1 room, solve a small question, and compare how you handled it. PvP helps you practice reactions; it does not replace the main learning path.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.title', 'vi', 'Thử thách code realtime với bạn học.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.title', 'en', 'Code in real-time challenges with other learners.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.badge', 'vi', 'Practice mode', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.badge', 'en', 'Practice mode', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.desc', 'vi', 'Hoàn thành lesson trước, rồi dùng PvP để luyện tốc độ và độ chắc tay.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.desc', 'en', 'Complete lessons first, then use PvP to improve speed and confidence.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.title', 'vi', 'Hoàn thành bài học đầu tiên để mở khóa thử thách.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.title', 'en', 'Hoàn thành bài học đầu tiên để mở khóa thử thách.', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.toast', 'vi', 'Hoàn thành bài học đầu tiên để mở khóa PvP', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.unlock.toast', 'en', 'Hoàn thành bài học đầu tiên để mở khóa PvP', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'settings.achievements', 'vi', 'Thành tích đạt được', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.achievements', 'en', 'Achievements', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.avatar', 'vi', 'Ảnh đại diện', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.avatar', 'en', 'Avatar', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.bio', 'vi', 'Giới thiệu', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.bio', 'en', 'Bio', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.bioPlaceholder', 'vi', 'Giới thiệu về bản thân...', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.bioPlaceholder', 'en', 'Tell us about yourself...', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.completedLessons', 'vi', 'Bài học hoàn thành', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.completedLessons', 'en', 'Completed Lessons', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.completionRate', 'vi', 'Tỷ lệ hoàn thành', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.completionRate', 'en', 'Completion Rate', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.customize', 'vi', 'Tùy chỉnh', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.customize', 'en', 'Customize', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.displayName', 'vi', 'Tên hiển thị', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.displayName', 'en', 'Display Name', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.displayNamePlaceholder', 'vi', 'Nhập tên hiển thị', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.displayNamePlaceholder', 'en', 'Enter display name', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.editorFontSize', 'vi', 'Cỡ chữ editor: {{size}}px', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.editorFontSize', 'en', 'Editor font size: {{size}}px', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.email', 'vi', 'Email', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.email', 'en', 'Email', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.fontSizeHint', 'vi', 'Điều chỉnh kích thước chữ trong code editor để dễ đọc hơn', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.fontSizeHint', 'en', 'Adjust code editor font size for better readability', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.learningPoints', 'vi', 'Điểm học tập', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.learningPoints', 'en', 'Learning Points', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.learningStreak', 'vi', 'Chuỗi học tập: {{count}} ngày', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.learningStreak', 'en', 'Learning Streak: {{count}} days', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.longestStreak', 'vi', 'Chuỗi dài nhất: {{count}} ngày', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.longestStreak', 'en', 'Longest Streak: {{count}} days', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.overallProgress', 'vi', 'Tiến độ tổng thể', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.overallProgress', 'en', 'Overall Progress', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.personalProfile', 'vi', 'Hồ sơ cá nhân', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.personalProfile', 'en', 'Personal Profile', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.photoFormat', 'vi', 'JPG, PNG hoặc GIF (tối đa 2MB)', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.photoFormat', 'en', 'JPG, PNG or GIF (max 2MB)', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.preview', 'vi', 'Xem trước', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.preview', 'en', 'Preview', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.progressTitle', 'vi', 'Tiến trình học tập', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.progressTitle', 'en', 'Learning Progress', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.saveChanges', 'vi', 'Lưu thay đổi', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.saveChanges', 'en', 'Save Changes', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.savedSuccessfully', 'vi', 'Đã lưu thành công!', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.savedSuccessfully', 'en', 'Saved successfully!', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.saving', 'vi', 'Đang lưu...', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.saving', 'en', 'Saving...', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.totalLessonsOf', 'vi', 'Tổng số {{count}} bài', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.totalLessonsOf', 'en', '{{count}} lessons in total', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.uploadPhoto', 'vi', 'Tải ảnh lên', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.uploadPhoto', 'en', 'Upload Photo', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'step1.desc', 'vi', 'Đọc ví dụ ngắn, chạy code mẫu và hiểu output trước khi tự viết.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step1.desc', 'en', 'Read a short example, run the sample code, and understand the output before writing on your own.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step1.title', 'vi', 'Quan sát', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step1.title', 'en', 'Observe', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step2.desc', 'vi', 'Sửa một phần nhỏ trong editor. Loopy kiểm tra đúng yêu cầu bằng rule/test case.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step2.desc', 'en', 'Change one small part in the editor. Loopy checks the requirement with deterministic rules or tests.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step2.title', 'vi', 'Thay đổi', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step2.title', 'en', 'Edit', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step3.desc', 'vi', 'Gặp lỗi nhỏ có chủ đích, đọc terminal và debug từng bước như khi code thật.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step3.desc', 'en', 'Meet small intentional errors, read the terminal, and debug step by step like real programming.', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step3.title', 'vi', 'Sửa lỗi', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'step3.title', 'en', 'Debug', 'text' FROM categories c WHERE c.name = 'landing'
ON CONFLICT (category_id, key, language) DO UPDATE SET
  value = EXCLUDED.value,
  type = EXCLUDED.type,
  updated_at = NOW();
