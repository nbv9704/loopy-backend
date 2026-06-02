# Loopy Code Runner

Loopy dùng 2 loại runner:

- JavaScript: chạy local bằng `isolated-vm` trong backend.
- Python/C++/Java/Go/Rust: ưu tiên Piston self-host; nếu chưa có Piston thì có thể fallback tạm sang Glot.io public API.

## Vì sao vẫn ưu tiên Piston self-host?

Piston là open-source và có sandbox/runtime orchestration tốt hơn việc tự gọi compiler bằng `child_process`.
Cách này miễn phí về license; chi phí chỉ là máy/server đang chạy container.

Glot.io fallback giúp unblock khi chưa tạo được VPS/Oracle instance, nhưng nên xem là giải pháp tạm thời vì phụ thuộc API bên ngoài và token/quota của Glot.

Không nên chạy Python/C++ trực tiếp trên server production nếu chưa có sandbox thật.

## Biến môi trường

Trong `loopy-backend/.env`:

```env
# Ưu tiên production khi có VPS/Docker runner
PISTON_API_URL=http://localhost:2000/api/v2/execute
PISTON_API_KEY=

# Fallback tạm thời nếu chưa có Piston
GLOT_API_URL=https://glot.io/api/run
GLOT_API_TOKEN=
```

`PISTON_API_KEY` có thể để trống nếu Piston self-host không bật auth. `GLOT_API_TOKEN` lấy từ tài khoản Glot.io, thường tại `https://glot.io/account/token`.

## Deploy runner

Repo này có folder [loopy-piston](file:///D:/Loopy/loopy-piston/README.md) để deploy Piston runner riêng.

Cách deploy khuyến nghị:

```txt
loopy-frontend -> loopy-backend -> loopy-piston
```

Trên VPS/Docker server:

```powershell
# trong D:\Loopy\loopy-piston
docker compose up -d
```

Nếu backend và Piston cùng Docker network, backend nên dùng:

```env
PISTON_API_URL=http://piston:2000/api/v2/execute
```

Nếu backend gọi qua host port trên cùng server:

```env
PISTON_API_URL=http://localhost:2000/api/v2/execute
```

Không nên expose Piston public nếu không cần; nếu expose thì đặt sau reverse proxy/rate limit/firewall.

## Capability API

Backend expose:

```http
GET /api/execute/capabilities
```

Response trả metadata cho từng ngôn ngữ:

```json
{
  "success": true,
  "data": {
    "capabilities": {
      "javascript": {
        "supported": true,
        "runner": "local",
        "requiresRunner": false,
        "reason": null
      },
      "python": {
        "supported": true,
        "runner": "piston",
        "requiresRunner": true,
        "reason": null
      }
    }
  }
}
```

Nếu chưa cấu hình `PISTON_API_URL`, các ngôn ngữ Piston-backed sẽ có `supported: false` và `reason` rõ ràng.

## Supported language ids

- `javascript`, alias `js`
- `python`, alias `py`
- `cpp`, alias `c++`
- `java`
- `go`, alias `golang`
- `rust`, alias `rs`

## Verification

Backend:

```powershell
yarn lint && yarn build && yarn test --runInBand
```

Frontend:

```powershell
yarn lint:strict && yarn build
```

Smoke test khi Piston đang chạy:

```powershell
yarn smoke:test
```

## Product rule

- `Chạy thử` chỉ execute và hiển thị output.
- `Kiểm tra` mới validate bằng deterministic checker/test cases.
- Không celebration trước khi backend `completeLesson` lưu progress thành công.
