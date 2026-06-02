from pathlib import Path
path = Path(r'D:\Loopy\info.md')
text = path.read_text(encoding='utf-8').rstrip()
entry = '''

Follow-up 2026-06-02 report workflow reset:
- User đã xóa các file báo cáo cũ và chuyển sang workflow mới: `source.md` là file mẫu đầu vào theo từng phần; agent đọc mẫu rồi viết lại thành nội dung phù hợp Loopy.
- Đã tạo thư mục `D:\Loopy\report_md` để lưu báo cáo theo từng file markdown riêng, tránh bulk edit một file dài.
- Files created:
  - `report_md/README.md`
  - `report_md/00_muc_luc.md`
  - `report_md/01_gioi_thieu.md`
  - `report_md/02_co_so_ly_thuyet.md`
  - `report_md/03_thiet_ke_he_thong.md`
  - `report_md/04_noi_dung_thuc_hien.md`
  - `report_md/05_thuc_nghiem_danh_gia.md`
  - `report_md/06_ket_luan_huong_phat_trien.md`
- `00_muc_luc.md` là mục lục Loopy chuyển hóa từ mẫu `source.md`, giữ khung 6 chương nhưng nội dung đúng dự án học lập trình đa ngôn ngữ.
- Các file chương hiện là khung heading để viết dần theo từng phần người dùng cập nhật vào `source.md`.
- Verification: đọc `source.md` và `info.md`; tạo file bằng tool write_to_file. Chưa chạy yarn vì chỉ thay đổi tài liệu.
- Next: khi user cập nhật một phần mẫu vào `source.md`, đọc file đó và viết nội dung tương ứng vào file chương phù hợp trong `report_md`.
'''
path.write_text(text + entry + '\n', encoding='utf-8')
