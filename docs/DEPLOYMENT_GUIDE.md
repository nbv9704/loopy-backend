# Hướng Dẫn Deploy Loopy lên Vercel

## Tổng Quan

Loopy gồm 2 phần:
1. **Backend** (Node.js + Express + Socket.IO)
2. **Frontend** (React + Vite)

## ⚠️ Lưu Ý Quan Trọng

**Socket.IO trên Vercel:**
- Vercel serverless functions có giới hạn về WebSocket
- PvP real-time features có thể không hoạt động tốt
- **Khuyến nghị:** Deploy backend lên Railway hoặc Render để Socket.IO hoạt động tốt hơn

**Nếu vẫn muốn dùng Vercel:**
- Frontend: Vercel (hoạt động tốt)
- Backend: Railway/Render (tốt hơn cho Socket.IO)

## Thứ Tự Deploy

### Bước 1: Deploy Backend TRƯỚC
Vì frontend cần backend URL để config

### Bước 2: Deploy Frontend SAU
Dùng backend URL từ bước 1

### Bước 3: Update CORS
Update backend với frontend URL

## Chi Tiết Từng Bước

### 📦 BACKEND

Xem file: `DEPLOY_VERCEL.md` trong thư mục backend

**Tóm tắt:**
1. Push code lên GitHub
2. Import project vào Vercel
3. Add environment variables (Supabase, CORS, etc.)
4. Deploy
5. Lấy URL: `https://loopy-backend-xxx.vercel.app`

**Environment Variables cần thiết:**
- `NODE_ENV=production`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `FRONTEND_URL` (update sau)
- `ADMIN_SESSION_SECRET` (random string)

### 🎨 FRONTEND

Xem file: `DEPLOY_VERCEL.md` trong thư mục frontend

**Tóm tắt:**
1. Push code lên GitHub
2. Import project vào Vercel
3. Add environment variables (Backend URL, Supabase)
4. Deploy
5. Lấy URL: `https://loopy-frontend-xxx.vercel.app`

**Environment Variables cần thiết:**
- `VITE_API_URL=https://loopy-backend-xxx.vercel.app`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 🔄 UPDATE CORS

Sau khi có frontend URL:
1. Vào Vercel Backend
2. Settings → Environment Variables
3. Update `FRONTEND_URL=https://loopy-frontend-xxx.vercel.app`
4. Redeploy backend

## Checklist Deploy

### Backend ✅
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Deployed successfully
- [ ] Health check works: `/health`
- [ ] Swagger works: `/api-docs` (if enabled)

### Frontend ✅
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added (with backend URL)
- [ ] Deployed successfully
- [ ] Homepage loads
- [ ] Can navigate pages

### Integration ✅
- [ ] Backend CORS updated with frontend URL
- [ ] Backend redeployed
- [ ] Authentication works (signup/login)
- [ ] API calls work
- [ ] PvP features work (if using Railway/Render for backend)

### Supabase ✅
- [ ] Redirect URLs added in Supabase
- [ ] Site URL configured
- [ ] Email templates configured (if needed)

## Alternative: Railway (Recommended cho Socket.IO)

### Backend trên Railway:
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Init project
railway init

# 4. Add environment variables
railway variables set NODE_ENV=production
railway variables set SUPABASE_URL=...
# ... (add all variables)

# 5. Deploy
railway up
```

**Lợi ích:**
- ✅ WebSocket support tốt
- ✅ Không có timeout 10s
- ✅ Persistent connections
- ✅ Better cho real-time features

### Frontend vẫn dùng Vercel:
Frontend không cần WebSocket nên Vercel vẫn OK

## Custom Domains

### Backend:
```
api.yourdomain.com → Backend
```

### Frontend:
```
yourdomain.com → Frontend
www.yourdomain.com → Frontend
```

## Monitoring & Logs

### Vercel:
- Deployments → View Function Logs
- Analytics (nếu enable)

### Railway:
- Deployments → View Logs
- Metrics tab

## Costs

### Vercel Free Plan:
- 100GB bandwidth/month
- Unlimited deployments
- Serverless functions: 100GB-hours

### Railway Free Plan:
- $5 credit/month
- ~500 hours runtime
- Good cho hobby projects

## Troubleshooting

### Socket.IO không hoạt động trên Vercel:
→ Deploy backend lên Railway/Render

### CORS errors:
→ Check `FRONTEND_URL` trong backend env vars

### Build failed:
→ Check logs, fix errors locally, push lại

### Authentication failed:
→ Check Supabase keys và redirect URLs

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs

## Next Steps

1. Deploy và test
2. Setup custom domains
3. Configure monitoring
4. Setup CI/CD (optional)
5. Performance optimization
