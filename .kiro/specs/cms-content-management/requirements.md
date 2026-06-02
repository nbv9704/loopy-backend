# Requirements Document

## Introduction

### Objective
Xây dựng tính năng quản lý nội dung tĩnh (CMS) trong admin UI, cho phép admin chỉnh sửa text trên website mà không cần code.

### Scope
- Quản lý text navigation (header, footer, sidebar)
- Quản lý text các trang (landing, languages, library, learn, playground, docs, onboarding, settings, pvp)
- Quản lý bản dịch EN/VI
- Export/Import content
- Audit logging cho mỗi lần chỉnh sửa

### Stakeholders
- **Admin:** Chỉnh sửa content, export/import, xem audit logs
- **Public Users:** Xem content (read-only)
- **Product Team:** Quản lý nội dung website

## Requirements

### Functional Requirements

#### R1: Content Manager Page
- **Description:** Admin có thể xem danh sách tất cả content items
- **User Story:** Là admin, tôi muốn xem danh sách tất cả content items để quản lý chúng
- **Acceptance Criteria:**
  1. Trang `/admin/content` hiển thị danh sách content items
  2. Mỗi item hiển thị: Key, Category, Language, Value (preview), Updated at
  3. Có pagination (50 items/page)
  4. Có search box để tìm theo key hoặc value
  5. Có filter theo category (sidebar)
  6. Có filter theo language (dropdown)

#### R2: Create Content Item
- **Description:** Admin có thể tạo content item mới
- **User Story:** Là admin, tôi muốn tạo content item mới để thêm text mới vào website
- **Acceptance Criteria:**
  1. Có button "New Item" trên sidebar
  2. Click button mở Content Editor modal
  3. Modal có fields: Category, Language, Value, Description, Type
  4. Có validation: Key unique per category+language, Value required
  5. Click Save tạo item mới và close modal
  6. Hiển thị success toast

#### R3: Edit Content Item
- **Description:** Admin có thể chỉnh sửa content item
- **User Story:** Là admin, tôi muốn chỉnh sửa content item để cập nhật text trên website
- **Acceptance Criteria:**
  1. Click "Edit" button trên item mở Content Editor modal
  2. Modal hiển thị current values (Key read-only)
  3. Có validation: Value required, max 5000 chars
  4. Click Save cập nhật item và close modal
  5. Hiển thị success toast
  6. Audit log được tạo với action='update'

#### R4: Delete Content Item
- **Description:** Admin có thể xóa content item
- **User Story:** Là admin, tôi muốn xóa content item để loại bỏ text không cần thiết
- **Acceptance Criteria:**
  1. Click "Delete" button trên item hiển thị confirm dialog
  2. Dialog hỏi "Bạn chắc chắn muốn xóa item này?"
  3. Click "Xóa" xóa item
  4. Hiển thị success toast
  5. Audit log được tạo với action='delete'

#### R5: Export Content
- **Description:** Admin có thể export content theo language
- **User Story:** Là admin, tôi muốn export content theo language để backup hoặc migrate
- **Acceptance Criteria:**
  1. Có button "Export" trên sidebar
  2. Click button hiển thị dialog chọn language (VI, EN)
  3. Click "Export" download JSON file
  4. JSON file có format: `{ categories: { [categoryName]: { [key]: value } } }`
  5. File name: `content-[language]-[timestamp].json`

#### R6: Import Content
- **Description:** Admin có thể import content từ JSON file
- **User Story:** Là admin, tôi muốn import content từ JSON file để restore backup hoặc migrate
- **Acceptance Criteria:**
  1. Có button "Import" trên sidebar
  2. Click button hiển thị file upload dialog
  3. Upload JSON file
  4. Hiển thị preview (show diff: new items, updated items)
  5. Click "Confirm" import content
  6. Hiển thị results: imported count, errors (nếu có)
  7. Audit log được tạo với action='import'

#### R7: V2 Pages Integration
- **Description:** V2 pages dùng content từ API
- **User Story:** Là user, tôi muốn thấy text trên website được quản lý bởi admin
- **Acceptance Criteria:**
  1. V2 pages fetch content từ `/api/content` API
  2. Nếu content không tìm thấy, fallback sang i18n key
  3. Content được cache 5 minutes để tránh quá nhiều API calls
  4. Nếu API error, hiển thị fallback text

#### R8: EN Translation Management
- **Description:** Admin có thể chỉnh sửa EN translations
- **User Story:** Là admin, tôi muốn chỉnh sửa bản dịch EN trực tiếp trong CMS
- **Acceptance Criteria:**
  1. Content Editor modal có Language dropdown (VI, EN)
  2. Admin có thể chọn EN để chỉnh sửa bản dịch
  3. Khi save EN content, i18n JSON file được auto-update
  4. V2 pages hiển thị EN text khi user chọn EN language

#### R9: Audit Logging
- **Description:** Log mỗi lần admin chỉnh sửa content
- **User Story:** Là admin, tôi muốn xem audit log để theo dõi ai đã chỉnh sửa content
- **Acceptance Criteria:**
  1. Mỗi lần create/update/delete content, audit log được tạo
  2. Audit log lưu: admin_id, action, resource_type, resource_id, changes, timestamp
  3. Audit log có thể xem tại `/admin/audit-logs`
  4. Có filter theo resource_type='content_item'

### Non-Functional Requirements

#### Performance
- Content API response time < 200ms
- Content cache 5 minutes
- Pagination 50 items/page

#### Security
- Chỉ admin có thể create/update/delete content
- Tất cả content phải được sanitize trước khi render (XSS prevention)
- Validate input: max 5000 chars, no script tags

#### Usability
- Content Manager page dễ sử dụng, có search/filter
- Editor modal có validation messages
- Success/error toasts cho mỗi action

#### Maintainability
- Code modular: ContentService, ContentController, ContentManagerPage
- Zod schemas cho validation
- Audit logging cho mỗi change

## Glossary

| Term | Definition |
|------|-----------|
| **Content Item** | Một mục nội dung (text) được quản lý bởi CMS, có key, language, value |
| **Content Category** | Phân loại nội dung (header, footer, landing, languages, v.v.) |
| **Key** | Định danh duy nhất cho content item (e.g., "nav.learn", "landing.hero.title") |
| **Language** | Ngôn ngữ của content item (VI, EN) |
| **Value** | Nội dung thực tế của content item (text, markdown, html) |
| **Export** | Xuất content theo language thành JSON file |
| **Import** | Nhập content từ JSON file vào database |
| **Audit Log** | Ghi lại mỗi lần admin chỉnh sửa content (create, update, delete) |
| **Fallback** | Dùng i18n key nếu content không tìm thấy trong database |
| **Cache** | Lưu content tạm thời để tránh quá nhiều API calls |
| **RLS** | Row Level Security - Chính sách bảo mật ở cấp row trong database |
| **Sanitize** | Loại bỏ các ký tự/code nguy hiểm (XSS prevention) |
