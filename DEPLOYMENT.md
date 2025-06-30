# MirrorMind Interview Platform - Deployment Guide

## Overview
This guide covers deploying the complete MirrorMind platform with:
- Next.js frontend (Vercel/Netlify)
- Python speech analysis backend (Railway/Render)
- Supabase database
- Tavus AI integration

## Prerequisites

### 1. Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get your credentials:
   - Project URL
   - Anon public key
   - Service role key (keep secret)
4. Run the database migration from `frontend/supabase/migrations/20250628141357_copper_canyon.sql`

### 2. Tavus AI Setup (Optional)
1. Get API key from Tavus AI
2. Note your persona and replica IDs

## Frontend Deployment (Vercel - Recommended)

### Step 1: Prepare Environment Variables
Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_key
NEXT_PUBLIC_TAVUS_BASE_URL=https://api.tavus.io/v2
```

### Step 2: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Deploy: `vercel`
4. Follow prompts and add environment variables in Vercel dashboard

### Alternative: Netlify Deployment
1. Build the project: `npm run build`
2. Deploy `out` folder to Netlify
3. Add environment variables in Netlify dashboard

## Backend Deployment (Railway - Recommended)

### Step 1: Prepare Backend for Deployment
Create `requirements.txt` in root directory:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
torch==2.1.0
torchaudio==2.1.0
transformers==4.35.0
librosa==0.10.1
soundfile==0.12.1
scipy==1.11.4
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.24.3
matplotlib==3.8.2
seaborn==0.13.0
opensmile==2.5.0
python-multipart==0.0.6
aiofiles==23.2.1
```

### Step 2: Create Railway Configuration
Create `railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
PYTHONPATH = "/app"
PORT = "8000"
```

### Step 3: Deploy to Railway
1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repository
3. Deploy from root directory
4. Set environment variables in Railway dashboard

### Alternative: Render Deployment
Create `render.yaml`:

```yaml
services:
  - type: web
    name: mirrormind-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: "/health"
```

## Docker Deployment (Advanced)

### Step 1: Update Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/raw_audio data/annotations data/processed_features models

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Docker Compose (Optional)
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONPATH=/app
      - PORT=8000
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - backend
```

## Environment Configuration

### Frontend Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Tavus AI (Optional)
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_key
NEXT_PUBLIC_TAVUS_BASE_URL=https://api.tavus.io/v2

# API Endpoint
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### Backend Environment Variables
```env
# Application
PYTHONPATH=/app
PORT=8000
ENVIRONMENT=production

# Model Configuration
DEVICE=cpu
BATCH_SIZE=8
MAX_AUDIO_SIZE=52428800

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

## Post-Deployment Setup

### 1. Test Supabase Connection
Visit your frontend URL and try to sign up/sign in to verify database connectivity.

### 2. Test Speech Analysis API
```bash
curl -X GET https://your-backend-url/health
```

### 3. Configure CORS (if needed)
Update CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Set up Domain (Optional)
- Configure custom domain in Vercel/Netlify
- Update Supabase redirect URLs
- Update CORS origins

## Monitoring and Maintenance

### Health Checks
- Frontend: Monitor Vercel/Netlify dashboard
- Backend: Use `/health` endpoint
- Database: Monitor Supabase dashboard

### Logging
- Check Railway/Render logs for backend issues
- Monitor Vercel/Netlify function logs
- Set up error tracking (Sentry recommended)

### Scaling
- Backend: Increase Railway/Render resources as needed
- Frontend: Vercel/Netlify auto-scales
- Database: Monitor Supabase usage

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors**
   - Verify environment variables
   - Check RLS policies
   - Ensure database migration ran successfully

2. **Speech Analysis Errors**
   - Check backend logs
   - Verify audio file formats
   - Monitor memory usage

3. **CORS Issues**
   - Update allowed origins
   - Check preflight requests
   - Verify headers

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs

### Performance Optimization

1. **Frontend**
   - Enable Next.js image optimization
   - Use CDN for static assets
   - Implement proper caching

2. **Backend**
   - Use connection pooling
   - Implement request queuing
   - Cache model predictions

3. **Database**
   - Optimize queries
   - Add proper indexes
   - Monitor connection limits

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use platform-specific secret management
   - Rotate keys regularly

2. **API Security**
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only

3. **Database Security**
   - Enable RLS on all tables
   - Use least-privilege access
   - Monitor for suspicious activity

## Cost Optimization

1. **Vercel/Netlify**: Free tier sufficient for development
2. **Railway/Render**: Start with basic plan, scale as needed
3. **Supabase**: Free tier includes 500MB database
4. **Tavus AI**: Pay-per-use pricing

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database migration executed
- [ ] Frontend environment variables set
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Backend requirements.txt created
- [ ] Backend deployed to Railway/Render
- [ ] API endpoints tested
- [ ] Authentication flow verified
- [ ] Speech analysis functionality tested
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up