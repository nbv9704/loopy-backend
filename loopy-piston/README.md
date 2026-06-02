# Loopy Piston Runner

`loopy-piston` là service chạy code cho Loopy qua Piston.
Backend Loopy gọi service này để chạy Python, C++, Java, Go và Rust.

## Kiến trúc

```txt
loopy-frontend -> loopy-backend -> loopy-piston
```

Frontend không gọi Piston trực tiếp.

## Yêu cầu deploy

- Server/VPS có Docker và Docker Compose.
- Nền tảng deploy phải hỗ trợ container `privileged`.
- Không phù hợp với Vercel/Netlify/serverless functions.

> [!WARNING]
> Piston chạy untrusted code nên không nên expose public nếu không cần.
> Tốt nhất là chỉ cho backend gọi qua network nội bộ hoặc firewall.

## Setup

Copy env mẫu:

```powershell
Copy-Item .env.example .env
```

Chỉnh `.env` nếu cần:

```env
PISTON_PORT=2000
PISTON_REPO_URL=
```

Chạy service trên server:

```powershell
docker compose up -d
```

Xem trạng thái:

```powershell
docker compose ps
```

Xem logs:

```powershell
docker compose logs -f piston
```

## Kiểm tra runtime

Trên server chạy Piston:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/runtimes
```

Test Python:

```powershell
Invoke-RestMethod http://localhost:2000/api/v2/execute `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"language":"python","version":"*","files":[{"name":"main.py","content":"print(\"hi\")"}]}'
```

Nếu dùng bash/curl:

```bash
curl http://localhost:2000/api/v2/runtimes

curl -X POST http://localhost:2000/api/v2/execute \
  -H 'Content-Type: application/json' \
  -d '{"language":"python","version":"*","files":[{"name":"main.py","content":"print(\"hi\")"}]}'
```

## Cấu hình backend Loopy

Nếu backend chạy trên cùng server và gọi qua host port:

```env
PISTON_API_URL=http://localhost:2000/api/v2/execute
PISTON_API_KEY=
```

Nếu backend và Piston cùng Docker network trong một compose chung:

```env
PISTON_API_URL=http://piston:2000/api/v2/execute
PISTON_API_KEY=
```

Nếu Piston deploy riêng domain sau reverse proxy:

```env
PISTON_API_URL=https://runner.your-domain.com/api/v2/execute
PISTON_API_KEY=
```

Sau khi đổi env backend, restart backend.

## Kiểm tra từ Loopy backend

Gọi:

```txt
GET /api/execute/capabilities
```

Kỳ vọng các ngôn ngữ Piston-backed có:

```json
{
  "supported": true,
  "runner": "piston",
  "requiresRunner": true,
  "reason": null
}
```

## Bảo mật production

- Không publish port `2000` ra Internet nếu không cần.
- Nếu cần public, đặt sau reverse proxy có HTTPS, auth/rate limit/firewall.
- Backend vẫn là nơi áp rate limit và validate request của app.
- Không lưu `.env` vào git.

## Cập nhật image

```powershell
docker compose pull
docker compose up -d
```
