# Deploy Backend lên Vercel

## Bước 1: Chuẩn bị

### 1.1. Đảm bảo code đã push lên GitHub
```bash
git status
git push origin master
```

### 1.2. Kiểm tra file `vercel.json` đã có
File này đã được tạo sẵn trong project.

## Bước 2: Tạo tài khoản Vercel

1. Truy cập: https://vercel.com/signup
2. Chọn "Continue with GitHub"
3. Authorize Vercel truy cập GitHub của bạn

## Bước 3: Import Project

### 3.1. Từ Vercel Dashboard
1. Click "Add New..." → "Project"
2. Chọn "Import Git Repository"
3. Tìm và chọn `loopy-backend`
4. Click "Import"

### 3.2. Configure Project
**Framework Preset:** Other (để mặc định)
**Root Directory:** `./` (để mặc định)
**Build Command:** `npm run build`
**Output Directory:** `dist`
**Install Command:** `npm install`

## Bước 4: Thêm Environment Variables

Click "Environment Variables" và thêm các biến sau:

### Required Variables:
```
NODE_ENV=production
PORT=3000

# Supabase (lấy từ Supabase Dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# CORS (sẽ update sau khi deploy frontend)
FRONTEND_URL=https://your-frontend.vercel.app

# Code Execution
CODE_EXECUTION_TIMEOUT=5000
MAX_CODE_LENGTH=10000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_CODE_EXECUTION=50

# Logging
LOG_LEVEL=info

# Cache
CACHE_TTL=300
MAX_CONTENT_ITEMS_PER_PAGE=50

# Swagger
SWAGGER_ENABLED=true
SWAGGER_REQUIRE_AUTH=false
SWAGGER_INCLUDE_DEBUG=false

# Admin
ADMIN_SESSION_SECRET=your-random-secret-here-change-this
ADMIN_SESSION_MAX_AGE=28800000
ADMIN_CSRF_ENABLED=true
ADMIN_ITEMS_PER_PAGE=25

# AI (Optional - nếu dùng AI grading)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
AI_PRIMARY_PROVIDER=groq
AI_FALLBACK_ENABLED=true
```

**Lưu ý:** 
- Thay `your-project.supabase.co` bằng URL Supabase thật
- Thay `your-anon-key` và `your-service-key` bằng keys từ Supabase
- `ADMIN_SESSION_SECRET` phải là chuỗi random dài (dùng: `openssl rand -base64 32`)

## Bước 5: Deploy

1. Click "Deploy"
2. Đợi build hoàn thành (2-3 phút)
3. Sau khi deploy xong, bạn sẽ có URL: `https://loopy-backend-xxx.vercel.app`

## Bước 6: Verify Deployment

### 6.1. Test API
Mở browser và truy cập:
```
https://loopy-backend-xxx.vercel.app/health
```

Kết quả mong đợi:
```json
{
  "status": "ok",
  "timestamp": "2026-05-03T..."
}
```

### 6.2. Test Swagger (nếu enabled)
```
https://loopy-backend-xxx.vercel.app/api-docs
```

## Bước 7: Configure CORS

Sau khi deploy frontend, quay lại Vercel Backend:
1. Settings → Environment Variables
2. Tìm `FRONTEND_URL`
3. Update thành URL frontend: `https://loopy-frontend-xxx.vercel.app`
4. Click "Save"
5. Redeploy: Deployments → Latest → "..." → "Redeploy"

## Bước 8: Setup Custom Domain (Optional)

1. Settings → Domains
2. Add domain: `api.yourdomain.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-10 phút)

## Troubleshooting

### Build Failed
- Check logs trong Vercel Dashboard
- Đảm bảo `package.json` có đúng dependencies
- Đảm bảo TypeScript compile thành công locally

### 500 Error
- Check Function Logs trong Vercel Dashboard
- Verify environment variables đã set đúng
- Check Supabase connection

### CORS Error
- Verify `FRONTEND_URL` đã set đúng
- Check CORS config trong `src/index.ts`

## Notes

- Vercel serverless functions có timeout 10s (Hobby plan) hoặc 60s (Pro plan)
- WebSocket (Socket.IO) có thể không hoạt động tốt trên Vercel serverless
- Nếu cần WebSocket, consider deploy backend lên Railway, Render, hoặc DigitalOcean

## Alternative: Deploy với Railway (Recommended cho Socket.IO)

Nếu cần Socket.IO hoạt động tốt:
1. Truy cập: https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy
5. Railway support WebSocket tốt hơn Vercel
