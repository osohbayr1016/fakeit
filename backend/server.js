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

// Initialize database
initializeDatabase()
  .then(() => {
    console.log("✅ Database initialized successfully");
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
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
  console.log(`🗄️  Database: PostgreSQL (Neon)`);
});
