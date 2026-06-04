-- Seed script for content_items table
-- This script populates the content_items table with default content for VI and EN languages

-- Get category IDs
WITH categories AS (
  SELECT id, name FROM content_categories
)

-- Insert header navigation content
INSERT INTO content_items (category_id, key, language, value, type)
SELECT c.id, 'nav.learn', 'vi', 'Học tập', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.learn', 'en', 'Learn', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.playground', 'vi', 'Sân chơi', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.playground', 'en', 'Playground', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.pvp', 'vi', 'Thử thách', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.pvp', 'en', 'Challenges', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.docs', 'vi', 'Tài liệu', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.docs', 'en', 'Docs', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.settings', 'vi', 'Cài đặt', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.settings', 'en', 'Settings', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.logout', 'vi', 'Đăng xuất', 'text' FROM categories c WHERE c.name = 'header'
UNION ALL
SELECT c.id, 'nav.logout', 'en', 'Logout', 'text' FROM categories c WHERE c.name = 'header'

-- Insert footer content
UNION ALL
SELECT c.id, 'footer.aboutLoopy', 'vi', 'Về Loopy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.aboutLoopy', 'en', 'About Loopy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.about', 'vi', 'Giới thiệu', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.about', 'en', 'About', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.team', 'vi', 'Đội ngũ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.team', 'en', 'Team', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.contact', 'vi', 'Liên hệ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.contact', 'en', 'Contact', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.resources', 'vi', 'Tài nguyên', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.resources', 'en', 'Resources', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.docs', 'vi', 'Tài liệu', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.docs', 'en', 'Docs', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.blog', 'vi', 'Blog', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.blog', 'en', 'Blog', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.faq', 'vi', 'FAQ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.faq', 'en', 'FAQ', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.description', 'vi', 'Nền tảng học lập trình hiện đại với AI hỗ trợ và chế độ đối kháng. Học code thông qua thực hành và thi đấu.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.description', 'en', 'Modern programming learning platform with AI support and competitive mode. Learn code through practice and competition.', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.allRightsReserved', 'vi', 'Bản quyền được bảo lưu', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.allRightsReserved', 'en', 'All rights reserved', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.privacy', 'vi', 'Quyền riêng tư', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.privacy', 'en', 'Privacy', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.terms', 'vi', 'Điều khoản', 'text' FROM categories c WHERE c.name = 'footer'
UNION ALL
SELECT c.id, 'footer.terms', 'en', 'Terms', 'text' FROM categories c WHERE c.name = 'footer'

-- Insert landing page content
UNION ALL
SELECT c.id, 'landing.hero.title', 'vi', 'Hành trình học code từ con số 0', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.title', 'en', 'Start Your Coding Journey from Zero', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.subtitle', 'vi', 'Thực hành thật, hướng dẫn rõ ràng, miễn phí', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.hero.subtitle', 'en', 'Real practice, clear guidance, completely free', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.primary', 'vi', 'Thử bài đầu tiên miễn phí', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.primary', 'en', 'Try First Lesson Free', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.secondary', 'vi', 'Tìm lộ trình phù hợp', 'text' FROM categories c WHERE c.name = 'landing'
UNION ALL
SELECT c.id, 'landing.cta.secondary', 'en', 'Find Your Path', 'text' FROM categories c WHERE c.name = 'landing'

-- Insert languages page content
UNION ALL
SELECT c.id, 'languages.title', 'vi', 'Chọn ngôn ngữ lập trình', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.title', 'en', 'Choose Programming Language', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.subtitle', 'vi', 'Bắt đầu hành trình học code của bạn', 'text' FROM categories c WHERE c.name = 'languages'
UNION ALL
SELECT c.id, 'languages.subtitle', 'en', 'Start Your Coding Journey', 'text' FROM categories c WHERE c.name = 'languages'

-- Insert library page content
UNION ALL
SELECT c.id, 'library.title', 'vi', 'Lộ trình học', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.title', 'en', 'Learning Path', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.subtitle', 'vi', 'Library không chỉ là danh sách bài. Nó là bản đồ bước tiếp theo.', 'text' FROM categories c WHERE c.name = 'library'
UNION ALL
SELECT c.id, 'library.subtitle', 'en', 'Library is not just a list of lessons. It is a map of your next steps.', 'text' FROM categories c WHERE c.name = 'library'

-- Insert learn page content
UNION ALL
SELECT c.id, 'learn.title', 'vi', 'Học lập trình', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.title', 'en', 'Learn Programming', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.subtitle', 'vi', 'Thực hành code và hoàn thành bài tập', 'text' FROM categories c WHERE c.name = 'learn'
UNION ALL
SELECT c.id, 'learn.subtitle', 'en', 'Practice coding and complete exercises', 'text' FROM categories c WHERE c.name = 'learn'

-- Insert playground page content
UNION ALL
SELECT c.id, 'playground.title', 'vi', 'Sân chơi code', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.title', 'en', 'Code Playground', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.subtitle', 'vi', 'Thử nghiệm code mà không lưu tiến độ', 'text' FROM categories c WHERE c.name = 'playground'
UNION ALL
SELECT c.id, 'playground.subtitle', 'en', 'Experiment with code without saving progress', 'text' FROM categories c WHERE c.name = 'playground'

-- Insert docs page content
UNION ALL
SELECT c.id, 'docs.title', 'vi', 'Tài liệu tham khảo', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.title', 'en', 'Documentation', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.subtitle', 'vi', 'Hỗ trợ cho hành trình học của bạn', 'text' FROM categories c WHERE c.name = 'docs'
UNION ALL
SELECT c.id, 'docs.subtitle', 'en', 'Support for your learning journey', 'text' FROM categories c WHERE c.name = 'docs'

-- Insert onboarding page content
UNION ALL
SELECT c.id, 'onboarding.title', 'vi', 'Mục tiêu của bạn là gì?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.title', 'en', 'What is your goal?', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.subtitle', 'vi', 'Chọn một con đường phù hợp nhất với bạn lúc này', 'text' FROM categories c WHERE c.name = 'onboarding'
UNION ALL
SELECT c.id, 'onboarding.subtitle', 'en', 'Choose the path that suits you best right now', 'text' FROM categories c WHERE c.name = 'onboarding'

-- Insert settings page content
UNION ALL
SELECT c.id, 'settings.title', 'vi', 'Cài đặt', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.title', 'en', 'Settings', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.subtitle', 'vi', 'Quản lý hồ sơ và tùy chỉnh', 'text' FROM categories c WHERE c.name = 'settings'
UNION ALL
SELECT c.id, 'settings.subtitle', 'en', 'Manage profile and preferences', 'text' FROM categories c WHERE c.name = 'settings'

-- Insert PvP page content
UNION ALL
SELECT c.id, 'pvp.title', 'vi', 'Chế độ Thử thách', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.title', 'en', 'Challenge Mode', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.subtitle', 'vi', 'Rèn luyện kỹ năng qua các bài tập đối kháng thời gian thực', 'text' FROM categories c WHERE c.name = 'pvp'
UNION ALL
SELECT c.id, 'pvp.subtitle', 'en', 'Sharpen your skills through real-time competitive challenges', 'text' FROM categories c WHERE c.name = 'pvp'

ON CONFLICT (category_id, key, language) DO NOTHING;
