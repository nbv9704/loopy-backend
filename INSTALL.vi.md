# Cài đặt Loopy Backend

Tài liệu này hướng dẫn chạy backend Loopy trên máy local.

## Yêu cầu

- Node.js 22.x.
- Yarn.
- Supabase project đã tạo sẵn.
- Python 3.8+ nếu dùng luồng chạy code Python.
- G++ nếu dùng luồng chạy code C++.

## 1. Cài dependencies

Chạy trong thư mục `loopy-backend`:

```powershell
yarn install
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

## 3. Chuẩn bị database

Backend dùng Supabase PostgreSQL. Cần đảm bảo schema/migration của dự án đã được áp dụng trong Supabase.

Nếu dùng script hoặc SQL migration trong repo, chạy theo quy trình hiện tại của dự án/Supabase trước khi mở app cho người dùng.

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

## 6. Build và chạy production local

```powershell
yarn build
yarn start
```

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

Kiểm tra máy local đã có:

- `python` hoặc `python3`.
- `g++` trong PATH.
