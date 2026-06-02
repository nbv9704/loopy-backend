# Hướng dẫn Seed Content Items

Vấn đề: Frontend đang gọi API `/api/content/:key` nhưng database chưa có dữ liệu content items.

## Giải pháp

Cần chạy migration `024-seed-content-items.sql` để populate dữ liệu.

### Cách 1: Dùng Supabase SQL Editor (Recommended)

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project `loopy`
3. Vào **SQL Editor** (bên trái)
4. Click **New Query**
5. Copy toàn bộ nội dung từ file `loopy-backend/database/migrations/024-seed-content-items.sql`
6. Paste vào SQL editor
7. Click **Run** (hoặc Ctrl+Enter)
8. Chờ query hoàn thành

### Cách 2: Dùng psql (Command Line)

```bash
# Kết nối tới Supabase database
psql "postgresql://postgres:[PASSWORD]@pbqwkqvdnagkefikxwsv.supabase.co:5432/postgres"

# Chạy migration file
\i loopy-backend/database/migrations/024-seed-content-items.sql
```

### Cách 3: Dùng Node.js Script

```bash
cd loopy-backend
node seed_content_direct.js
```

## Verify

Sau khi chạy migration, kiểm tra xem dữ liệu đã được insert:

```sql
SELECT COUNT(*) FROM content_items;
-- Kết quả: 76 rows
```

Hoặc test API:

```bash
curl "http://localhost:3000/api/content/nav.learn?language=en"
```

Kết quả mong đợi:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "key": "nav.learn",
    "language": "en",
    "value": "Learn",
    ...
  }
}
```

## Nội dung được seed

- **Header Navigation** (12 items): nav.learn, nav.playground, nav.pvp, nav.docs, nav.settings, nav.logout
- **Footer** (24 items): footer.about*, footer.resources, footer.docs, footer.blog, footer.faq, footer.privacy, footer.terms
- **Landing** (8 items): landing.hero.title, landing.hero.subtitle, landing.cta.*
- **Languages** (4 items): languages.title, languages.subtitle
- **Library** (4 items): library.title, library.subtitle
- **Learn** (4 items): learn.title, learn.subtitle
- **Playground** (4 items): playground.title, playground.subtitle
- **Docs** (4 items): docs.title, docs.subtitle
- **Onboarding** (4 items): onboarding.title, onboarding.subtitle
- **Settings** (4 items): settings.title, settings.subtitle
- **PvP** (4 items): pvp.title, pvp.subtitle

Mỗi item có 2 ngôn ngữ: VI (Tiếng Việt) và EN (Tiếng Anh)

**Tổng cộng: 76 content items**

## Troubleshooting

### Lỗi: "null value in column "admin_id""

Điều này xảy ra vì trigger audit log yêu cầu admin_id. Migration đã fix bằng cách disable trigger tạm thời.

### Lỗi: "UNIQUE constraint failed"

Có thể dữ liệu đã được seed trước đó. Migration sử dụng `ON CONFLICT ... DO NOTHING` nên sẽ bỏ qua các duplicate.

### Frontend vẫn hiển thị 404

1. Kiểm tra backend đang chạy: `http://localhost:3000/api/content/nav.learn?language=en`
2. Kiểm tra database có dữ liệu: `SELECT * FROM content_items LIMIT 5;`
3. Kiểm tra frontend cache: Clear localStorage hoặc hard refresh (Ctrl+Shift+R)

## Sau khi seed

Frontend sẽ tự động:
1. Fetch content từ API
2. Cache trong localStorage (5 phút)
3. Fallback sang i18n keys nếu API error
4. Hiển thị content trên các trang V2

Không cần restart frontend hoặc backend.
