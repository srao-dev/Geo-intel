# Deployment Guide

## Backend → Railway

1. Go to [railway.app](https://railway.app) and sign up / log in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `geo-intel` repo
4. Set **Root Directory** to `backend`
5. Add environment variables:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `FRONTEND_URL` — your Vercel URL (add after frontend deploy)
6. Railway auto-detects Python and deploys

Your backend URL will be: `https://geo-intel-backend-xxxx.railway.app`

---

## Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and sign up / log in
2. Click **Add New → Project → Import Git Repository**
3. Select your `geo-intel` repo
4. Set **Root Directory** to `frontend`
5. Add environment variables:
   - `VITE_API_WS_URL` — `wss://your-railway-url/ws/audit`
   - `VITE_API_URL` — `https://your-railway-url`
6. Click Deploy

Your frontend URL will be: `https://geo-intel.vercel.app`

---

## Update Railway with frontend URL

After Vercel deploys:
1. Go to Railway → your project → Variables
2. Update `FRONTEND_URL` to your Vercel URL
3. Railway auto-redeploys

---

## Local development

```bash
# Backend
cd backend
cp .env.example .env
# Fill in ANTHROPIC_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000  
API docs: http://localhost:8000/docs
