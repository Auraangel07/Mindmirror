# Quick Deployment Guide

## 🚀 Deploy in 15 Minutes

### 1. Supabase Setup (5 minutes)
```bash
# 1. Go to https://supabase.com and create account
# 2. Create new project
# 3. Go to SQL Editor and run the migration:
```
Copy the SQL from `frontend/supabase/migrations/20250628141357_copper_canyon.sql`

### 2. Frontend Deployment - Vercel (5 minutes)
```bash
cd frontend
npm install -g vercel
vercel

# Add these environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Backend Deployment - Railway (5 minutes)
```bash
# 1. Go to https://railway.app
# 2. Connect GitHub repository
# 3. Deploy from root directory
# 4. Railway will auto-detect Python and use requirements.txt
```

### 4. Connect Frontend to Backend
Update your frontend environment variables:
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

## ✅ Verification Checklist
- [ ] Frontend loads at your Vercel URL
- [ ] Can sign up/sign in (tests Supabase)
- [ ] Backend health check: `https://your-railway-app.railway.app/health`
- [ ] Speech analysis works (upload audio file)

## 🔧 Troubleshooting
- **Frontend won't load**: Check Vercel build logs
- **Can't sign in**: Verify Supabase environment variables
- **Backend errors**: Check Railway logs
- **CORS issues**: Update allowed origins in main.py

## 💰 Cost Estimate
- Vercel: Free tier (sufficient for development)
- Railway: $5/month (starter plan)
- Supabase: Free tier (500MB database)
- **Total: ~$5/month**

## 🎯 Next Steps
1. Configure custom domain (optional)
2. Set up monitoring/alerts
3. Add Tavus AI integration for video interviews
4. Scale resources as needed