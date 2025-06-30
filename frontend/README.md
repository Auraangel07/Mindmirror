# MirrorMind: AI Interview Multiverse

An AI-powered interview practice platform with 3D avatars, real-time feedback, and gamified learning.

## 🚀 Quick Setup Guide

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/Login with GitHub or email
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `mirrormind-interviews`
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"

### 2. Get Your Supabase Keys

Once your project is created:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Configure Environment Variables

1. Open the `.env.local` file in your project
2. Replace the placeholder values with your actual Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire content from `supabase/migrations/20250628141357_copper_canyon.sql`
4. Click "Run" to create all tables and security policies

### 5. Configure Authentication

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

#### Enable Google OAuth (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - **Client ID** and **Client Secret** from Google Cloud Console
   - **Redirect URL**: Use the one provided by Supabase

### 6. Test the Connection

1. Start your development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Try signing up with email/password
4. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created

## 🔧 Troubleshooting

### Common Issues:

**"Invalid API key" error:**
- Double-check your environment variables
- Ensure no extra spaces in the keys
- Restart your development server after changing `.env.local`

**"Failed to create user" error:**
- Make sure you ran the database migration
- Check Supabase logs in the dashboard

**OAuth redirect issues:**
- Verify redirect URLs in Supabase settings
- Ensure callback route exists at `/auth/callback`

### Database Schema Verification

To verify your database was set up correctly, go to **Database** → **Tables** in Supabase and you should see:
- `users`
- `interview_sessions` 
- `interview_responses`
- `user_achievements`
- `user_skills`

## 🎯 Features

- **AI-Powered Interviews**: Practice with realistic 3D avatar interviewers
- **Role-Based Questions**: Frontend, Backend, Data Analyst, Product Manager, UX Designer, DevOps
- **Real-time Feedback**: AI evaluation with detailed scoring
- **Gamification**: XP, levels, achievements, and skill progression
- **Voice Recording**: Practice speaking with speech-to-text
- **Progress Tracking**: Comprehensive analytics and improvement insights

## 🛠️ Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **3D Graphics**: Three.js, React Three Fiber
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Speech**: Web Speech API
- **AI Evaluation**: Custom scoring algorithms

## 📱 Usage

1. **Sign Up**: Create an account with email or Google
2. **Choose Role**: Select from 6+ interview roles
3. **Practice**: Answer questions with the 3D AI interviewer
4. **Get Feedback**: Receive detailed AI evaluation
5. **Track Progress**: Monitor your improvement over time
6. **Unlock Achievements**: Earn XP and level up your skills

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Secure API endpoints with user verification
- Data isolation per user

## 🚀 Deployment

Ready to deploy? The app works great on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**

Just make sure to add your environment variables to your hosting platform!