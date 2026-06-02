# Note rà soát database, bảo mật, deploy và tài liệu Loopy

## Database và schema

- CSDL dùng Supabase/PostgreSQL.
- Schema chính: `loopy-backend/database/schema-v2.sql`.
- Nhóm bảng chính: `user_profiles`, `languages`, `learning_paths`, `chapters`, `path_chapters`, `lessons`, `lesson_test_cases`, `lesson_submissions`, `code_executions`, `user_progress`, `user_streaks`, `badges`, `user_badges`, các bảng PvP.
- `schema-v2.sql` là script reset có `DROP TABLE ... CASCADE`, không dùng trực tiếp cho production nếu cần giữ dữ liệu.

## Migrations quan trọng

- `010-beginner-flow.sql`: thêm beginner-first flow, learning paths, chapters, test cases, submissions.
- `012-add-deterministic-validation.sql`: thêm validation deterministic cho lessons.
- `013-fix-test-cases-rls.sql`: public chỉ đọc test case không ẩn.
- `014-restrict-user-profiles-rls.sql`: chỉ authenticated user đọc `user_profiles`.
- `003_pvp_system.sql`, `004_pvp_room_code.sql`: hệ PvP và room code.
- `999-drop-cms-tables.sql`: bỏ CMS tables cũ, chuyển static content sang constants.

## RLS và bảo mật dữ liệu

- Public read cho nội dung học cơ bản như languages, chapters, paths, lessons, badges.
- `lesson_test_cases` chỉ public nếu `is_hidden = false`.
- Dữ liệu tiến độ, submissions, streak, daily activity, code executions giới hạn theo user sở hữu.
- PvP match/submissions/reactions chỉ participant được xem/sửa theo policy.
- `user_profiles` đã đổi từ public read sang authenticated-only.

## Deploy và CI

- Backend deploy Render qua `loopy-backend/render.yaml`.
- Frontend deploy Vercel qua `loopy-frontend/vercel.json`.
- Backend CI: Node 22, Yarn, Redis service, lint/build/test.
- Frontend CI: Node 22, Yarn, lint/build/test.
- Production env quan trọng: Supabase URL/key, service role key, `REDIS_URL`, `ADMIN_SESSION_SECRET`, `GEMINI_API_KEY`, `VITE_API_URL`, `SWAGGER_REQUIRE_AUTH=true`.

## Tài liệu nghiên cứu

- `mimo_research.md`: onboarding, micro-learning, gamification.
- `freecodecamp_research.md`: thực chiến, workspace 3-pane, feedback tức thì, heatmap.
- `codecademy_research.md`: survey kỹ năng, catalog, checklist, resume dashboard.
- `loopy-backend/plan.md` và `loopy-frontend/plan.md`: định vị Loopy là guided coding journey cho người mới.

## Việc cần làm tiếp

- Apply migration `013` và `014` trên Supabase production.
- Xác nhận DB production có cột/quyền admin phù hợp với code `is_admin`.
- Xác nhận Render/Vercel env production đầy đủ.
- Siết CSP frontend sau khi chốt domain API/WebSocket.
- Tăng test coverage và bổ sung E2E cho flow chính.
