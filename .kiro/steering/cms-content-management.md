# CMS - Content Management System for Static Content

## Mục tiêu
Xây dựng tính năng quản lý nội dung tĩnh trong admin UI, cho phép admin chỉnh sửa text trên website mà không cần code:
- Text navigation (header, footer, sidebar)
- Text các trang (landing, languages, library, learn, playground, docs, onboarding, settings)
- Bản dịch EN của các phần nội dung
- Quản lý theo ngôn ngữ (hiện tại: VI, EN)

## Tình hình hiện tại
- **Giao diện cũ (dark theme):** Có thể đã có tính năng CMS nhưng chưa rõ
- **Giao diện V2 (light theme):** Chưa kết nối với hệ thống CMS, chỉ dùng mock data hoặc i18n keys
- **i18n:** Đã setup với react-i18next, nhưng chỉ dùng static JSON files, không có admin UI để chỉnh sửa

## Phạm vi triển khai

### Phase 1: Database & Backend
1. **Database schema:**
   - Bảng `content_items`: Lưu các item nội dung (id, key, type, language, value, description, created_at, updated_at)
   - Bảng `content_categories`: Phân loại nội dung (header, footer, landing, languages, library, learn, playground, docs, onboarding, settings)
   - RLS policies: Chỉ admin có thể xem/edit

2. **Backend API:**
   - `GET /api/admin/content` - Lấy danh sách content items (filter by category, language)
   - `POST /api/admin/content` - Tạo content item mới
   - `PUT /api/admin/content/:id` - Cập nhật content item
   - `DELETE /api/admin/content/:id` - Xóa content item
   - `GET /api/admin/content/export` - Export content theo language (JSON)
   - `POST /api/admin/content/import` - Import content từ JSON

3. **Audit logging:**
   - Log mỗi lần admin chỉnh sửa content (action: create/update/delete, resource_type: content_item)

### Phase 2: Frontend Admin UI
1. **Content Manager page** (`/admin/content`):
   - Sidebar: Filter by category (header, footer, landing, languages, v.v.)
   - Main area: Danh sách content items
   - Columns: Key, Category, Language, Value (preview), Updated at, Actions (edit, delete)
   - Pagination: 50 items/page
   - Search: Tìm theo key hoặc value

2. **Content Editor modal:**
   - Key (read-only)
   - Category (dropdown)
   - Language (dropdown: VI, EN)
   - Value (textarea, hỗ trợ markdown hoặc plain text)
   - Description (ghi chú về content item này)
   - Save/Cancel buttons

3. **Bulk actions:**
   - Export content theo language (download JSON)
   - Import content từ JSON file
   - Duplicate content item (copy từ VI sang EN, v.v.)

### Phase 3: Frontend Integration
1. **V2 pages integration:**
   - Thay thế mock data/hardcoded text bằng API calls
   - Fetch content từ `/api/admin/content` khi render
   - Cache content để tránh quá nhiều API calls
   - Fallback: Nếu content không tìm thấy, dùng default text hoặc i18n key

2. **i18n integration:**
   - Sync content từ database với i18n JSON files
   - Admin có thể chỉnh sửa bản dịch EN trực tiếp trong CMS
   - Tự động update i18n files khi admin save content

### Phase 4: Content Categories & Keys
Danh sách các content items cần quản lý:

**Header Navigation:**
- `nav.learn` - "Học tập"
- `nav.playground` - "Sân chơi"
- `nav.pvp` - "Thử thách"
- `nav.docs` - "Tài liệu"
- `nav.settings` - "Cài đặt"
- `nav.logout` - "Đăng xuất"

**Landing Page:**
- `landing.hero.title` - "Hành trình học code từ con số 0"
- `landing.hero.subtitle` - "Thực hành thật, hướng dẫn rõ ràng, miễn phí"
- `landing.cta.primary` - "Thử bài đầu tiên miễn phí"
- `landing.cta.secondary` - "Tìm lộ trình phù hợp"
- v.v.

**Languages Page:**
- `languages.title` - "Chọn ngôn ngữ lập trình"
- `languages.subtitle` - "Bắt đầu hành trình học code của bạn"
- v.v.

**Library Page:**
- `library.title` - "Lộ trình học"
- `library.nextStep` - "Bước tiếp theo"
- v.v.

**Learn Page:**
- `learn.runCode` - "Chạy code mẫu"
- `learn.checkChanges` - "Kiểm tra thay đổi"
- `learn.runResult` - "Chạy thử kết quả"
- `learn.checkDebug` - "Kiểm tra sửa lỗi"
- `learn.completeLesson` - "Hoàn thành bài học"
- v.v.

**Playground Page:**
- `playground.title` - "Sân chơi lập trình"
- `playground.subtitle` - "Thử nghiệm code mà không lưu tiến độ"
- v.v.

**Docs Page:**
- `docs.title` - "Tài liệu tham khảo"
- `docs.subtitle` - "Hỗ trợ cho hành trình học của bạn"
- v.v.

**Onboarding Page:**
- `onboarding.step1.title` - "Mục tiêu học tập"
- `onboarding.step2.title` - "Kinh nghiệm lập trình"
- `onboarding.step3.title` - "Xác nhận lộ trình"
- v.v.

**Settings Page:**
- `settings.profile` - "Hồ sơ"
- `settings.progress` - "Tiến độ"
- `settings.preferences` - "Tùy chỉnh"
- v.v.

**PvP Pages:**
- `pvp.duel` - "Đấu 1v1"
- `pvp.battleRoyale` - "Battle Royale"
- `pvp.easy` - "Dễ"
- `pvp.medium` - "Trung bình"
- `pvp.hard` - "Khó"
- v.v.

## Triển khai từng bước

### Bước 1: Database & Backend
1. Tạo migration để tạo bảng `content_items` và `content_categories`
2. Tạo Zod schema validation cho content items
3. Tạo service layer (`ContentService`) để quản lý CRUD operations
4. Tạo controller (`ContentController`) để expose API endpoints
5. Thêm routes vào admin routes
6. Thêm audit logging cho content changes

### Bước 2: Frontend Admin UI
1. Tạo `ContentManagerPage` component
2. Tạo `ContentEditorModal` component
3. Tạo `ContentService` (frontend) để fetch/update content từ API
4. Thêm route `/admin/content` vào AppRouter
5. Thêm sidebar item "Content Manager" trong admin layout

### Bước 3: Frontend Integration
1. Tạo `useContent` hook để fetch content từ API
2. Update V2 pages để dùng `useContent` hook thay vì mock data
3. Thêm fallback logic nếu content không tìm thấy
4. Cache content để tránh quá nhiều API calls

### Bước 4: i18n Integration
1. Tạo script để sync content từ database với i18n JSON files
2. Update admin UI để cho phép chỉnh sửa bản dịch EN
3. Tự động update i18n files khi admin save content

## Lợi ích
- Admin có thể chỉnh sửa text trên website mà không cần code
- Dễ dàng quản lý bản dịch EN/VI
- Audit trail cho mỗi lần chỉnh sửa
- Có thể export/import content để backup hoặc migrate

## Rủi ro & Lưu ý
- Cần cẩn thận với caching để tránh stale content
- Cần validate input để tránh XSS attacks
- Cần backup content trước khi import
- Cần test kỹ lưỡng trước khi deploy lên production
