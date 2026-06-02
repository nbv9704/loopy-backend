# Note rà soát backend Loopy

## Mục tiêu backend

- Backend là API Node.js/Express + TypeScript cho nền tảng học lập trình tương tác Loopy.
- Cung cấp API học tập, xác thực, hồ sơ người dùng, tiến độ, chạy code, kiểm tra bài, chấm điểm tự động, AI hint, PvP realtime và admin CMS.
- Dữ liệu chính dùng Supabase/PostgreSQL; realtime PvP dùng Socket.IO; session admin production dùng Redis.

## Kiến trúc chính

- Entry: `loopy-backend/src/index.ts`.
- Route tổng hợp: `loopy-backend/src/routes/index.ts`.
- Tổ chức theo `routes`, `controllers`, `services`, `middleware`, `schemas`, `db`.
- Validation dùng Zod, logging dùng Winston, test dùng Jest/ts-jest và fast-check.
- Các middleware quan trọng: Helmet, CORS whitelist, CSRF Origin/Referer, rate limit, session, auth, error handler.

## Module chức năng

- Auth user: signup, login, logout, me, refresh; token chuyển sang httpOnly cookie.
- Learning/curriculum: languages, chapters, lessons, learning paths.
- Progress: theo dõi bài hoàn thành, streak, points, badges.
- Code execution: `/api/execute`, JavaScript sandbox bằng `isolated-vm`, Python/C++ qua Piston nếu cấu hình.
- Lesson checking: `/api/lessons/:lessonId/check`, hỗ trợ rule/exact/regex/stdout/function.
- Auto-grading: test case, AI scoring, final score, grade level, grading cache.
- PvP: REST API + Socket.IO, room code, matchmaking, submit answer/code, leaderboard.
- Admin: session auth, dashboard stats, lesson CRUD, bulk import nội dung.

## Bảo mật backend

- User auth dùng httpOnly cookie, `secure` trong production, refresh token 7 ngày.
- Admin session dùng `express-session`, Redis store và cookie `loopy.admin.sid`.
- Production bắt buộc `REDIS_URL` và `ADMIN_SESSION_SECRET`.
- CORS whitelist exact origin, credentials enabled.
- CSRF kiểm tra Origin/Referer cho request mutate.
- Rate limit tổng, auth login, submission và code execution.
- Code execution có concurrency limit và timeout/memory/output limit.
- Swagger production cấu hình yêu cầu auth qua `SWAGGER_REQUIRE_AUTH=true`.

## Test, build, CI, deploy

- Scripts chính: `yarn lint`, `yarn build`, `yarn test`.
- CI backend dùng Node 22, Yarn, Redis service, chạy install/lint/build/test.
- Deploy backend trên Render qua `loopy-backend/render.yaml`.
- Verification gần nhất: `yarn lint && yarn build && yarn test --runInBand` pass, 141/141 tests pass.

## Điểm cần chú ý

- Code admin đang query `user_profiles.is_admin`, nhưng `database/schema-v2.sql` chưa khai báo cột này; cần xác nhận migration/DB production có cột tương ứng.
- Một số policy hỗ trợ dev như `lesson_submissions.user_id IS NULL` nên kiểm tra lại trước production.
- `/api/execute` có thể dùng anonymous nhưng đã được rate/concurrency limit; vẫn cần theo dõi abuse thực tế.
