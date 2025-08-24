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

// Enhanced CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://fakeit-iota.vercel.app", // Your Vercel domain
  "http://localhost:3000", // Local development
  "http://localhost:3001", // Alternative local port
];

// Remove undefined origins
const validOrigins = allowedOrigins.filter((origin) => origin);

console.log("🌐 Allowed CORS origins:", validOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (validOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("🚫 CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", cors());
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

// Debug: Log all registered routes
console.log("🔗 Registered API routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(
      `  ${Object.keys(middleware.route.methods).join(",").toUpperCase()} ${
        middleware.route.path
      }`
    );
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(
          `  ${Object.keys(handler.route.methods)
            .join(",")
            .toUpperCase()} /api${handler.route.path}`
        );
      }
    });
  }
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  console.log(`🚫 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "GET /api/health",
      "GET /api/hello",
      "POST /api/data",
      "GET /api/users",
      "POST /api/rooms",
      "GET /api/rooms/:code/validate",
      "POST /api/rooms/join",
      "GET /api/rooms/:code/players",
    ],
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
