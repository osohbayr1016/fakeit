const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import routes and middleware
const apiRoutes = require("./routes/api");
const errorHandler = require("./middleware/errorHandler");
const initializeDatabase = require("./config/initDb");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Initialize database with graceful fallback
let dbInitialized = false;
initializeDatabase()
  .then(() => {
    console.log("✅ Database initialized successfully");
    dbInitialized = true;
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error);
    console.log("⚠️  Server will continue without database functionality");
    console.log("🔗 Some API endpoints may not work properly");
    dbInitialized = false;
  });

// Add database status to health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
    timestamp: new Date().toISOString(),
    database: dbInitialized ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api", apiRoutes);

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(
    `📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `🗄️  Database: ${
      dbInitialized ? "PostgreSQL (Connected)" : "PostgreSQL (Disconnected)"
    }`
  );
});
