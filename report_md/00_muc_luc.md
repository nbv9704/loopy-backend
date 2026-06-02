# MỤC LỤC

## Chương 1: Giới thiệu tổng quan

### 1.1. Lý do thực hiện đề tài
#### 1.1.1. Hiện trạng học lập trình trực tuyến cho người mới bắt đầu
#### 1.1.2. Thách thức khi người mới tự học lập trình
#### 1.1.3. Tính cần thiết của đề tài
#### 1.1.4. Phát biểu bài toán

### 1.2. Mục tiêu và sản phẩm của đồ án
#### 1.2.1. Mục tiêu tổng quát
#### 1.2.2. Mục tiêu chức năng
#### 1.2.3. Sản phẩm đầu ra của đồ án

### 1.3. Phạm vi của đồ án
#### 1.3.1. Phạm vi người dùng
#### 1.3.2. Phạm vi chức năng
#### 1.3.3. Phạm vi công nghệ

### 1.4. Ràng buộc, giả định và phụ thuộc
#### 1.4.1. Ràng buộc trong quá trình xây dựng
#### 1.4.2. Giả định về người dùng và dữ liệu
#### 1.4.3. Phụ thuộc kỹ thuật của hệ thống

### 1.5. Kết quả cần đạt

### 1.6. Tính ứng dụng của đề tài

---

## Chương 2: Cơ sở lý thuyết và công nghệ sử dụng

### 2.1. Cơ sở lý thuyết
#### 2.1.1. Tổng quan về website học lập trình trực tuyến
#### 2.1.2. Đặc điểm của người mới học lập trình
#### 2.1.3. Mô hình học có hướng dẫn theo từng bước
#### 2.1.4. Thực hành lập trình trực tiếp trên trình duyệt
#### 2.1.5. Kiểm tra bài làm tự động bằng rule/test case
#### 2.1.6. Quản lý tiến độ học tập
#### 2.1.7. Quản lý nội dung học tập bằng CMS

### 2.2. Công nghệ sử dụng
#### 2.2.1. Công nghệ frontend
#### 2.2.2. Công nghệ backend
#### 2.2.3. Cơ sở dữ liệu
#### 2.2.4. Dịch vụ thực thi mã nguồn
#### 2.2.5. Công cụ kiểm thử và quản lý mã nguồn

### 2.3. Cách tiếp cận và giải quyết vấn đề
#### 2.3.1. Tiếp cận theo hướng newbie-first guided journey
#### 2.3.2. Phân tách rõ chạy thử và kiểm tra
#### 2.3.3. Phát triển hệ thống theo từng module

---

## Chương 3: Thiết kế hệ thống

### 3.1. Sơ đồ Use Case
#### 3.1.1. Tác nhân Người học
#### 3.1.2. Tác nhân Quản trị viên
#### 3.1.3. Các nhóm chức năng chính

### 3.2. Kiến trúc logic phân tầng
#### 3.2.1. Lớp giao diện người dùng
#### 3.2.2. Lớp API và xử lý nghiệp vụ
#### 3.2.3. Lớp dữ liệu
#### 3.2.4. Dịch vụ thực thi mã nguồn

### 3.3. Sơ đồ tuần tự các luồng chính
#### 3.3.1. Luồng đăng ký, đăng nhập và onboarding
#### 3.3.2. Luồng chọn ngôn ngữ và mở lộ trình học
#### 3.3.3. Luồng học bài 5 bước
#### 3.3.4. Luồng chạy thử mã nguồn
#### 3.3.5. Luồng kiểm tra bài làm và lưu tiến độ

### 3.4. Sơ đồ hoạt động của luồng học

### 3.5. Thiết kế cơ sở dữ liệu
#### 3.5.1. Nhóm bảng người dùng và phân quyền
#### 3.5.2. Nhóm bảng nội dung học tập
#### 3.5.3. Nhóm bảng kiểm tra bài làm
#### 3.5.4. Nhóm bảng tiến độ học tập
#### 3.5.5. Nhóm bảng CMS content

### 3.6. Đặc tả API
#### 3.6.1. API xác thực người dùng
#### 3.6.2. API bài học và lộ trình
#### 3.6.3. API chạy mã nguồn
#### 3.6.4. API kiểm tra bài làm
#### 3.6.5. API lưu tiến độ
#### 3.6.6. API quản trị nội dung

### 3.7. Mô tả chi tiết các thành phần cốt lõi
#### 3.7.1. Lesson Viewer
#### 3.7.2. Code Editor và Terminal
#### 3.7.3. Lesson Checker
#### 3.7.4. Progress Service
#### 3.7.5. Admin Lesson Manager
#### 3.7.6. CMS Content Manager

---

## Chương 4: Nội dung thực hiện

### 4.1. Kiến trúc hạ tầng và tổ chức mã nguồn
#### 4.1.1. Tổng quan cấu trúc frontend
#### 4.1.2. Tổng quan cấu trúc backend
#### 4.1.3. Tổ chức dữ liệu và seed content

### 4.2. Xây dựng giao diện người học
#### 4.2.1. Trang giới thiệu
#### 4.2.2. Trang onboarding
#### 4.2.3. Trang chọn ngôn ngữ
#### 4.2.4. Trang thư viện/lộ trình học
#### 4.2.5. Trang học bài
#### 4.2.6. Playground
#### 4.2.7. Trang hồ sơ người dùng

### 4.3. Xây dựng luồng học 5 bước
#### 4.3.1. Bước Quan sát
#### 4.3.2. Bước Thay đổi
#### 4.3.3. Bước Chạy thử
#### 4.3.4. Bước Sửa lỗi
#### 4.3.5. Bước Hoàn thành

### 4.4. Xây dựng backend API
#### 4.4.1. API xác thực
#### 4.4.2. API lesson và learning path
#### 4.4.3. API execute code
#### 4.4.4. API check lesson
#### 4.4.5. API progress

### 4.5. Xây dựng khu vực quản trị
#### 4.5.1. Admin Dashboard
#### 4.5.2. Lesson Management
#### 4.5.3. Lesson Editor
#### 4.5.4. Test Case Manager
#### 4.5.5. Content Manager
#### 4.5.6. Bulk Import

### 4.6. Xây dựng cơ chế CMS-driven content

### 4.7. Tích hợp dịch vụ thực thi mã nguồn

### 4.8. Kiểm thử trong quá trình xây dựng

### 4.9. Thiết lập và vận hành hệ thống

---

## Chương 5: Thực nghiệm và đánh giá

### 5.1. Mô tả môi trường thực nghiệm

### 5.2. Kịch bản kiểm thử chức năng
#### 5.2.1. Kiểm thử luồng người học mới
#### 5.2.2. Kiểm thử luồng học bài
#### 5.2.3. Kiểm thử chạy thử mã nguồn
#### 5.2.4. Kiểm thử kiểm tra bài làm
#### 5.2.5. Kiểm thử lưu tiến độ
#### 5.2.6. Kiểm thử khu vực quản trị

### 5.3. Kết quả giao diện và chức năng
#### 5.3.1. Kết quả giao diện người học
#### 5.3.2. Kết quả luồng học 5 bước
#### 5.3.3. Kết quả chạy thử và kiểm tra bài làm
#### 5.3.4. Kết quả quản lý tiến độ
#### 5.3.5. Kết quả quản trị nội dung

### 5.4. Đánh giá hệ thống
#### 5.4.1. Ưu điểm
#### 5.4.2. Hạn chế
#### 5.4.3. Bài học kinh nghiệm

---

## Chương 6: Kết luận và hướng phát triển

### 6.1. Kết quả đối chiếu với mục tiêu

### 6.2. Các hạn chế của đồ án

### 6.3. Hướng phát triển tương lai
#### 6.3.1. Mở rộng nội dung và ngôn ngữ lập trình
#### 6.3.2. Hoàn thiện bộ kiểm tra bài làm
#### 6.3.3. Cải tiến dữ liệu debug challenge
#### 6.3.4. Cá nhân hóa lộ trình học
#### 6.3.5. Hoàn thiện vận hành và triển khai thực tế
