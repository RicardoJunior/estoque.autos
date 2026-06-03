# Estoque.autos SaaS - Deployment Guide

This guide covers deploying the Estoque.autos SaaS platform to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Database Setup](#database-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Prerequisites

- Node.js 20.x LTS
- npm or yarn package manager
- Supabase account (for database, auth, storage, and realtime)
- GitHub account (for CI/CD)
- Deployment platform accounts:
  - Backend: Railway, Render, or Vercel
  - Frontend: Vercel, Netlify, or Cloudflare Pages

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES_PER_VEHICLE=30
```

### Frontend (.env.production)

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
VITE_APP_NAME=Estoque.autos
VITE_APP_URL=https://yourdomain.com
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2. Run Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the migration files in order:

1. `backend/supabase/migrations/20260212000001_initial_schema.sql`
2. `backend/supabase/migrations/20260212000002_rls_policies.sql`

### 3. Configure Storage

1. Go to Storage in Supabase Dashboard
2. Create buckets:
   - `vehicle-photos` (public)
   - `tenant-logos` (public)
3. Set bucket policies to allow authenticated uploads

### 4. Enable Realtime

1. Go to Database → Replication in Supabase Dashboard
2. Enable realtime for `leads` table
3. Enable realtime for `vehicle_status_log` table (optional)

---

## Backend Deployment

### Option 1: Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` directory as the root
4. Add environment variables from the Backend section above
5. Deploy!

```bash
# Build command (auto-detected)
npm run build

# Start command
npm start
```

### Option 2: Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables
5. Deploy!

### Option 3: Vercel (Serverless)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod
```

Add `vercel.json` in backend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

Or connect via Vercel Dashboard:

1. Import your GitHub repository
2. Select the `frontend` directory
3. Add environment variables from Frontend section
4. Deploy!

### Option 2: Netlify

1. Connect your GitHub repository on [Netlify](https://netlify.com)
2. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Add environment variables
4. Deploy!

### Option 3: Cloudflare Pages

1. Create a new Pages project on [Cloudflare](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Build Output**: `dist`
4. Add environment variables
5. Deploy!

---

## CI/CD Pipeline

The project includes GitHub Actions workflows for automated testing and deployment.

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Backend: Lint, type check, tests, build
   - Frontend: Lint, type check, tests, build
   - Security audit with npm audit

2. **CodeQL Security** (`.github/workflows/codeql.yml`)
   - Runs weekly and on PRs to main
   - Scans for security vulnerabilities

3. **Dependabot** (`.github/dependabot.yml`)
   - Weekly dependency updates
   - Separate PRs for backend, frontend, and GitHub Actions

### GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
VITE_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
RAILWAY_TOKEN (if using Railway)
VERCEL_TOKEN (if using Vercel)
VERCEL_ORG_ID (if using Vercel)
VERCEL_PROJECT_ID (if using Vercel)
```

### Manual Deployment

To manually trigger deployment:

1. Push to `main` branch
2. GitHub Actions will automatically run tests
3. If tests pass, deployment will proceed (if configured)

---

## Monitoring and Logging

### Backend Monitoring

- **Error Tracking**: Integrate Sentry or similar
- **Performance**: Use New Relic or Datadog
- **Logs**: Check your platform's logs (Railway, Render, etc.)

### Frontend Monitoring

- **Analytics**: Google Analytics 4 (see Bloco 9 - P3)
- **Error Tracking**: Sentry for React
- **Performance**: Vercel Analytics or Lighthouse CI

### Database Monitoring

- **Supabase Dashboard**: Monitor usage, queries, and performance
- **Alerts**: Set up alerts for high query times or failed connections

---

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test user registration and login
- [ ] Test file uploads (vehicle photos, logos)
- [ ] Verify Supabase Realtime is working (lead notifications)
- [ ] Check public landing pages are accessible
- [ ] Test SEO (meta tags, sitemap)
- [ ] Verify RLS policies are working (test multi-tenant isolation)
- [ ] Set up domain and SSL certificates
- [ ] Configure CORS for your production domain
- [ ] Test all critical user flows:
  - Signup → Onboarding → Dashboard
  - Create vehicle → Upload photos → Publish
  - Receive lead → Assign → Convert to sale
  - Register sale → View financial reports
- [ ] Set up monitoring and alerting
- [ ] Create backups strategy for Supabase

---

## Rollback Procedure

If deployment fails:

1. **Frontend**: Revert to previous deployment in Vercel/Netlify dashboard
2. **Backend**: Rollback to previous Railway/Render deployment
3. **Database**: Use Supabase point-in-time recovery if needed
4. **Code**: Revert Git commit and redeploy

---

## Support

For issues or questions:

- Check the [README.md](./README.md)
- Review project documentation in [project.md](./project.md)
- Check GitHub Issues
- Contact: noreply@anthropic.com (development support)

---

## License

Copyright © 2026 Estoque.autos. All rights reserved.
