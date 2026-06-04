# Hướng dẫn Thiết lập & Nâng cấp Cơ sở dữ liệu Loopy

Tài liệu này hướng dẫn cách thiết lập cơ sở dữ liệu PostgreSQL (Supabase) cho các môi trường phát triển mới hoặc nâng cấp hệ thống hiện tại.

---

## 🚀 Trường hợp 1: Thiết lập mới hoàn toàn (Fresh Developer DB)

Nếu bạn là nhà phát triển mới hoặc muốn xóa sạch toàn bộ dữ liệu để cài đặt lại hệ thống từ đầu:

1. **Khởi tạo lại cấu trúc bảng**:
   Chạy trực tiếp file script reset [schema-v2.sql](file:///d:/Loopy/loopy-backend/database/schema-v2.sql) trong trình quản lý SQL của Supabase hoặc qua công cụ CLI.
   > [!WARNING]  
   > Lệnh này sẽ `DROP` toàn bộ các bảng hiện có. Tuyệt đối **không chạy trên môi trường Production**.

2. **Khởi tạo dữ liệu mẫu (Seed Data)**:
   Chạy lệnh dưới đây ở thư mục backend để tự động tạo toàn bộ lộ trình học mẫu cho cả 4 onboarding goals (Python, JavaScript, C++):
   ```bash
   npm run seed:rework
   ```

---

## 🔄 Trường hợp 2: Nâng cấp Cơ sở dữ liệu hiện có (Existing DB Upgrade)

Nếu bạn đang nâng cấp hệ thống đã có dữ liệu người dùng hoạt động (ví dụ trên môi trường Staging/Production) và muốn giữ lại dữ liệu:

1. **Chạy các Migration tích lũy**:
   Chạy tuần tự các file migration trong thư mục [database/migrations](file:///d:/Loopy/loopy-backend/database/migrations). Đặc biệt là file:
   - [010-beginner-flow.sql](file:///d:/Loopy/loopy-backend/database/migrations/010-beginner-flow.sql): Bản nâng cấp an toàn hỗ trợ các cột onboarding, bảng lesson-centric grading mới, và tự động ép kiểu/typecast an toàn kiểu dữ liệu cũ của cột `current_path_id` sang UUID.

2. **Đồng bộ hóa lại dữ liệu lộ trình học (Seed Data)**:
   Cập nhật các bản ghi lộ trình học (Paths, Chapters, Lessons) tương thích với cấu trúc mới mà không ảnh hưởng tới bảng thông tin cá nhân của người dùng:
   ```bash
   npm run seed:rework
   ```
