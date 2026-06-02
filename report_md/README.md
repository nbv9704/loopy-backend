# Quy trình viết báo cáo Loopy

Thư mục này dùng để viết báo cáo theo từng phần, tránh sửa một file dài gây rời rạc.

## Cách làm

1. Bạn cập nhật nội dung mẫu vào `D:\Loopy\source.md`.
2. Agent đọc `source.md`, rút ra cấu trúc và cách hành văn của mẫu.
3. Agent viết lại nội dung tương ứng cho dự án Loopy.
4. Nội dung được lưu vào file chương phù hợp trong thư mục này.

## Nguyên tắc nội dung

- Viết tự nhiên, học thuật vừa đủ, không máy móc.
- Không copy nội dung dự án mẫu nếu không liên quan.
- Không bịa số liệu, khảo sát, testimonial hoặc claim chưa có dữ liệu.
- Luôn giữ đúng logic Loopy:
  - `Chạy thử` chỉ chạy code và hiển thị output/lỗi.
  - `Kiểm tra` mới validate bằng rule/test case/checker.
  - Lesson chỉ hoàn thành sau khi backend lưu progress thành công.
  - Không celebration trước khi progress được lưu.

## Các file

- `00_muc_luc.md`: mục lục chuẩn đã chuyển hóa cho Loopy.
- `01_gioi_thieu.md`: Chương 1.
- `02_co_so_ly_thuyet.md`: Chương 2.
- `03_thiet_ke_he_thong.md`: Chương 3.
- `04_noi_dung_thuc_hien.md`: Chương 4.
- `05_thuc_nghiem_danh_gia.md`: Chương 5.
- `06_ket_luan_huong_phat_trien.md`: Chương 6.

## Trạng thái

- Đã tạo mục lục khung.
- Các chương đang là file khung, sẽ được viết dần theo từng phần từ `source.md`.
