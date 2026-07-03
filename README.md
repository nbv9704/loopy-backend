# Loopy Backend

Loopy Backend là API server cho nền tảng học lập trình Loopy. Backend xử lý xác thực, quản lý nội dung học tập, thực thi code, kiểm tra bài làm, lưu tiến độ học tập, dashboard quản trị và PvP coding match theo thời gian thực.

## Vai trò trong hệ thống

Backend chịu trách nhiệm cho các luồng chính:

- Xác thực người dùng qua Supabase Auth.
- Quản lý hồ sơ người dùng và tiến độ học tập.
- Cung cấp API cho lộ trình, chương học, bài học và practice set.
- Chạy thử code và trả output.
- Kiểm tra bài làm bằng deterministic checker, rule, regex hoặc test case.
- Lưu trạng thái hoàn thành bài học sau khi `completeLesson` thành công.
- Quản lý PvP match, participant, submission, điểm số và kết quả.
- Cung cấp API quản trị nội dung, dashboard và CMS.

## Công nghệ chính

- Node.js / TypeScript
- Express.js
- Supabase PostgreSQL + Supabase Auth
- Socket.IO
- Zod
- Jest
- Winston
- Groq / Gemini cho các luồng AI có cấu hình

## Hướng dẫn cài đặt

- Tiếng Việt: [INSTALL.vi.md](./INSTALL.vi.md)
- English: [INSTALL.en.md](./INSTALL.en.md)

## Liên kết liên quan

- Frontend app: `../loopy-frontend`
- Tài liệu backend: [docs/README.md](./docs/README.md)
- License: [LICENSE](./LICENSE)

## License

Dự án sử dụng MIT License. Xem chi tiết tại [LICENSE](./LICENSE).
