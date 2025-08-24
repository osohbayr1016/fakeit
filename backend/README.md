# Backend Server

Express.js backend server for the fakeit project.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp env.example .env
```

3. Update `.env` file with your configuration.

## Running the Server

### Development (with auto-reload):

```bash
npm run dev
```

### Production:

```bash
npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/hello` - Sample endpoint
- `POST /api/data` - Sample POST endpoint

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

## Features

- Express.js server
- CORS enabled for frontend communication
- Security headers with Helmet
- Request logging with Morgan
- Error handling middleware
- Environment variable support
