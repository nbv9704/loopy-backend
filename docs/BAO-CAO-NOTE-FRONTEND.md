# Note rà soát frontend Loopy

## Mục tiêu frontend

- Frontend là ứng dụng React + TypeScript + Vite cho nền tảng học lập trình Loopy.
- Tập trung trải nghiệm người mới bắt đầu: onboarding, lộ trình học, thư viện bài học, editor/terminal, kiểm tra bài, AI hint, playground, PvP và admin CMS.

## Kiến trúc chính

- Entry: `loopy-frontend/src/main.tsx`, `src/App.tsx`.
- Router tập trung tại `loopy-frontend/src/routes/AppRouter.tsx`.
- Tổ chức theo `pages`, `components`, `hooks`, `services`, `lib`, `contexts`, `store`, `types`, `utils`.
- Stack: React 18, TypeScript, Vite, Tailwind CSS, React Router, React Query, Zustand, CodeMirror, Socket.IO client, i18next, Vitest.
- Vite có manual chunks để tách CodeMirror, icon và Framer Motion.

## Màn hình và flow chính

- Landing page giới thiệu Loopy.
- Auth page cho đăng nhập/đăng ký user.
- Onboarding 2 bước: chọn mục tiêu học và trình độ.
- Languages và library để chọn ngôn ngữ/lộ trình/chương/bài.
- Learn page với lesson viewer, CodeMirror editor và terminal.
- Playground nhiều file, auto-save localStorage, chạy code qua backend.
- Settings hiển thị profile, preferences, progress, heatmap.
- PvP lobby và match realtime.
- Admin login, dashboard, lesson editor và bulk import.

## Auth và API

- User auth dùng `AuthContext`, gọi backend với `credentials: include`.
- Không lưu access token trong localStorage; backend quản lý httpOnly cookie.
- Auto refresh session mỗi 14 phút.
- Admin auth tách riêng bằng Zustand store và Axios API client.
- Admin protected route kiểm tra session và quyền admin.

## Lesson/editor UX

- Learning loop: See, Change, Run, Fix, Build.
- Chạy code qua `/api/execute`.
- Kiểm tra bài qua `/api/lessons/:lessonId/check`.
- Khi pass sẽ gọi progress complete, hiện celebration và mở bài tiếp theo.
- Có AI hint và keyboard shortcuts.
- Editor dùng CodeMirror, hỗ trợ JavaScript, Python, C++.

## Test, build, CI, deploy

- Scripts chính: `yarn lint:strict`, `yarn build`, `yarn test`.
- CI frontend dùng Node 22, Yarn, lint/build/test; build có `VITE_API_URL=http://localhost:3000`.
- Deploy frontend qua Vercel, `vercel.json` có SPA rewrite và security headers.
- Verification gần nhất: `yarn lint:strict && yarn build && yarn test` pass, 3/3 tests pass.

## Điểm cần chú ý

- CSP frontend hiện còn rộng: `unsafe-inline`, `unsafe-eval`, `connect-src https://* wss://*`; nên siết lại sau khi xác nhận các domain production.
- Test coverage frontend còn mỏng, hiện chủ yếu test helper xử lý lỗi code execution.
- Cần kiểm thử E2E các flow user auth, onboarding, learn, admin và PvP với backend thật.
