# 🚀 Deployment Guide for FakeIt Game

## 🗄️ Database Setup (PostgreSQL - Neon)

Your backend is now configured with a PostgreSQL database hosted on Neon. The connection string is already configured in the deployment files.

## Backend Deployment to Render

### 1. Create Render Account

- Go to [render.com](https://render.com) and sign up
- Connect your GitHub account

### 2. Deploy Backend

1. **Create New Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository (or create one first)
   - Select the `backend` folder

2. **Configure Service**

   - **Name**: `fakeit-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend` (important!)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Environment Variables**

   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-frontend-url.vercel.app
   DATABASE_URL=postgresql://neondb_owner:npg_sK9dx2BGqpbQ@ep-patient-wave-a14112fy-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment
   - Note your backend URL (e.g., `https://fakeit-backend.onrender.com`)

### ⚠️ Important: Root Directory Setting

Make sure to set the **Root Directory** to `backend` in Render. This ensures the build process runs from the correct folder and uses npm instead of yarn.

## Frontend Deployment to Vercel

### 1. Create Vercel Account

- Go to [vercel.com](https://vercel.com) and sign up
- Connect your GitHub account

### 2. Deploy Frontend

1. **Import Project**

   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` folder

2. **Configure Project**

   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Environment Variables**

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build and deployment
   - Note your frontend URL

## Update Backend CORS

After getting your frontend URL, update the backend environment variable:

```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Test Your Deployment

1. Visit your frontend URL
2. Try creating a game room
3. Test the API endpoints
4. Check backend logs in Render dashboard
5. Verify database connections in Render logs

## Troubleshooting

- **CORS Issues**: Ensure `FRONTEND_URL` is set correctly in backend
- **Build Failures**: Check package.json scripts and dependencies
- **API Errors**: Verify environment variables and API endpoints
- **Database Issues**: Check `DATABASE_URL` and database logs in Render
- **Yarn Workspace Errors**: Ensure Root Directory is set to `backend` in Render

## URLs to Remember

- **Backend**: `https://your-backend-name.onrender.com`
- **Frontend**: `https://your-project-name.vercel.app`
- **API Base**: `https://your-backend-name.onrender.com/api`
- **Database**: PostgreSQL on Neon (already configured)

## Database Features

✅ **Persistent Storage**: Game rooms and players are stored in PostgreSQL
✅ **Real-time Data**: All game state is persisted in the database
✅ **Scalable**: Neon provides automatic scaling and backups
✅ **Secure**: SSL connections with proper authentication
