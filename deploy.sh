#!/bin/bash

echo "🚀 FakeIt Game Deployment Script"
echo "================================"

echo ""
echo "1. Backend Deployment to Render"
echo "   - Go to https://render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repo"
echo "   - Select backend folder"
echo "   - Set environment variables:"
echo "     NODE_ENV=production"
echo "     PORT=10000"
echo "     FRONTEND_URL=https://your-frontend-url.vercel.app"
echo ""

echo "2. Frontend Deployment to Vercel"
echo "   - Go to https://vercel.com"
echo "   - Create new project"
echo "   - Import your GitHub repo"
echo "   - Select frontend folder"
echo "   - Set environment variable:"
echo "     NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api"
echo ""

echo "3. Update Backend CORS"
echo "   - After getting frontend URL, update FRONTEND_URL in Render"
echo ""

echo "4. Test Deployment"
echo "   - Visit your frontend URL"
echo "   - Test game functionality"
echo "   - Check backend logs"
echo ""

echo "✅ Your FakeIt game will be live at your Vercel URL!"
echo "🔗 Backend API will be available at your Render URL"
