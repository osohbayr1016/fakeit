# 📚 GitHub Repository Setup

## Option 1: Single Repository (Recommended)
Create one repository for the entire project:

```bash
# In your project root
git init
git add .
git commit -m "Initial commit: FakeIt game with backend and frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fakeit.git
git push -u origin main
```

## Option 2: Separate Repositories
Create separate repositories for backend and frontend:

### Backend Repository
```bash
cd backend
git init
git add .
git commit -m "Initial commit: Express backend for FakeIt game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fakeit-backend.git
git push -u origin main
```

### Frontend Repository
```bash
cd frontend
git init
git add .
git commit -m "Initial commit: Next.js frontend for FakeIt game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fakeit-frontend.git
git push -u origin main
```

## Repository Structure
```
fakeit/
├── backend/          # Express.js backend
├── frontend/         # Next.js frontend
├── deploy.sh         # Deployment script
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## Next Steps
1. Choose your preferred repository structure
2. Create the repository(ies) on GitHub
3. Push your code
4. Follow the deployment guide for Render and Vercel
