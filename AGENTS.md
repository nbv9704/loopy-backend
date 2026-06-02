# AGENTS.md

## Mục tiêu khi làm việc trong repo này
- Đọc `info.md` trước khi phân tích dự án từ đầu.
- Cập nhật `info.md` sau mỗi thay đổi đáng kể: đã sửa gì, file nào, verify bằng lệnh nào, vấn đề còn lại.
- Ưu tiên sửa flow gãy và UX cho người mới trước khi thêm feature mới.
- Không bịa số liệu, social proof hoặc claim chưa có dữ liệu.

## Cách làm việc
- Trả lời user bằng tiếng Việt, ngắn gọn, thực tế.
- Dùng Yarn cho frontend/backend verification.
- Trước khi sửa code, đọc file liên quan và hiểu luồng hiện tại.
- Dùng thay đổi nhỏ nhất đúng yêu cầu.
- Không revert hoặc sửa thay đổi lạ trong worktree nếu không được yêu cầu.
- Nếu task liên quan Learn/LessonViewer, kiểm tra kỹ khác biệt giữa `Chạy thử` và `Kiểm tra`.

## Verify thường dùng
- Frontend: chạy trong `D:\Loopy\loopy-frontend`
  - `yarn lint:strict && yarn build`
- Backend: chạy trong `D:\Loopy\loopy-backend`
  - `yarn lint && yarn build && yarn test --runInBand`

## Quy tắc quan trọng của Loopy
- `Chạy thử` chỉ execute code và hiển thị output.
- `Kiểm tra` mới validate bằng deterministic checker/rule/test case.
- Lesson chỉ được xem là hoàn thành sau khi backend `completeLesson` thành công và progress được lưu.
- Không celebration trước khi lưu progress thành công.
- Định vị sản phẩm: newbie-first, free, guided journey, thực hành thật, không chỉ là catalog content.

## File trạng thái dự án
- `info.md` là nguồn tóm tắt chính cho agent lần sau.
- Khi hoàn thành việc mới, cập nhật phần `Recent Work`, `Current State`, `Known Issues`, và `Verification` trong `info.md` nếu liên quan.
