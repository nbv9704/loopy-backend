# Cài đặt Loopy Backend

Tài liệu này hướng dẫn chạy backend Loopy trên máy local.

## Yêu cầu

- Node.js 22.x.
- Yarn Classic 1.22.x (đã verify với Node 22.15.0 / Yarn 1.22.22).
- Supabase project đã tạo sẵn.
- JavaScript chạy bằng `isolated-vm`. Python/C++/Java/Go/Rust cần runner Piston hoặc Glot; cài Python/G++ vào máy API không tự bật các ngôn ngữ này.

## 1. Cài dependencies

Chạy trong thư mục `loopy-backend`:

```powershell
yarn install --frozen-lockfile
```

## 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`, sau đó điền giá trị thật:

```powershell
Copy-Item .env.example .env
```

Các biến quan trọng:

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Ghi chú:

- Không commit file `.env`.
- `FRONTEND_URL` phải khớp URL frontend để CORS và cookie auth hoạt động đúng.
- Các API key AI chỉ cần thiết cho các luồng có dùng AI feedback/grading.
- Runner đa ngôn ngữ: cấu hình `PISTON_API_URL` (và `PISTON_API_KEY` nếu runner yêu cầu), hoặc `GLOT_ENABLED=true` cho Glot public (`GLOT_API_URL=https://glot.io/api/mux`). Glot public hiện không dùng token cũ; deployment Glot riêng theo legacy protocol vẫn cần `GLOT_API_TOKEN`. Khi không có cờ enabled, token cũ vẫn bật Glot để tương thích cấu hình hiện hữu; `GLOT_ENABLED=false` tắt rõ ràng. Không bật provider nào thì chỉ JavaScript có live execution; xem `GET /api/execute/capabilities`.
- Production bắt buộc `API_URL`, `FRONTEND_URL` là HTTPS origin, `ADMIN_SESSION_SECRET` riêng ít nhất32 ký tự và `REDIS_URL`; development có thể dùng session memory. Xem `config/production.env.example`. `ALLOWED_ORIGINS` nhận danh sách HTTPS origin cách nhau bởi dấu phẩy; không còn tự cho phép domain deployment cũ. `COOKIE_DOMAIN` chỉ đặt khi deployment thực sự cần.
- `yarn config:check` xác minh config mà không mở kết nối ngoài. Số/boolean sai, secret mẫu hoặc Dev Login/Swagger debug bật ở production sẽ làm startup dừng; lỗi chỉ ghi tên biến, không in giá trị.
- Dotenv mặc định đọc `.env`. Đặt `NODE_ENV=production` không tự làm nó đọc `.env.production`; production nên truyền environment từ hosting/process manager.

## 3. Chuẩn bị database

Backend dùng Supabase PostgreSQL. Cần đảm bảo schema/migration của dự án đã được áp dụng trong Supabase.

Xem [database/README.md](database/README.md) trước khi chạy SQL. Không chạy glob thư mục migrations hoặc reset `schema-v2.sql` trên dữ liệu thật. Sau `yarn build`, `yarn migrate` chỉ in plan, không kết nối DB. Runtime hiện cần forward contract041–052 được review/rollout; không replay migration đã có ledger hợp lệ.

Local đang dùng DB thật phải giữ `LOOPY_DATABASE_KIND=production` (mặc định an toàn nếu bỏ trống). Chỉ DB development riêng mới đặt `LOOPY_DATABASE_KIND=development` để bypass email confirmation. Dev Login mặc định tắt; chỉ bật với `ENABLE_DEV_LOGIN=true` ở backend và `VITE_ENABLE_DEV_LOGIN=true` ở frontend trên DB disposable.

Database hiện tại của user đã được ghi nhận apply041–052 ở lượt trước. Điều đó không bootstrap một project mới; staging/DB mới vẫn cần review baseline, legacy CMS, forward plan và kiểm tra RLS/grants riêng. Không dùng production để test write.

## 4. Chạy môi trường development

```powershell
yarn dev
```

API mặc định chạy tại:

```txt
http://localhost:3000
```

Health check:

```txt
GET http://localhost:3000/api/health
```

## 5. Kiểm tra chất lượng trước khi commit

```powershell
yarn lint && yarn build && yarn test --runInBand
```

Jest mặc định dùng cấu hình giả, mock Supabase/AI và chặn fetch; không cần `.env` thật hoặc Redis. Đây là unit/in-process integration tests, chưa thay thế E2E và test concurrency trên PostgreSQL nhiều kết nối.

## 6. Build và chạy production local

```powershell
yarn build
yarn config:check
yarn start
```

Truyền environment production phù hợp trước `yarn start`; không chỉ đổi tên file env. Build làm sạch đúng `dist` của repo và không compile tests/test-utils vào runtime output. Source handoff cần cài lại native `isolated-vm` trên host đích. `/api/ready` phải200 với database/schema/adminSessions=true; xem `../docs/RELEASE.md` cho quy trình đóng gói và các bước staging.

## Lỗi thường gặp

### Frontend bị CORS hoặc không giữ đăng nhập

Kiểm tra:

- `FRONTEND_URL` trong backend đúng với URL frontend.
- Frontend `VITE_API_URL` đúng với URL backend.
- Cookie/auth config không bị chặn bởi môi trường deploy.

### Lỗi Supabase permission hoặc không tìm thấy profile

Kiểm tra:

- `SUPABASE_SERVICE_KEY` đúng và còn hiệu lực.
- Migration/trigger tạo `user_profiles` đã được áp dụng.
- Bảng và policy cần thiết đã tồn tại.

### Lỗi chạy code C++ hoặc Python

Kiểm tra `GET /api/execute/capabilities`, kết nối runner và `PISTON_API_URL` hoặc `GLOT_ENABLED`. URL Glot public cũ `/api/run` được adapter chuyển sang `/api/mux`; không tự gửi lại code nếu một request đã thất bại. Không cấu hình runner thì backend trả lỗi cấu hình, không coi là code đã chạy thành công.
