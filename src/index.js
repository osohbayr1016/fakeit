#!/usr/bin/env node

// This file is created to satisfy Render's default behavior
// It will start our backend server from the backend directory

const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

console.log("🚀 Starting backend server...");
console.log("📁 Current directory:", process.cwd());
console.log("📁 Backend directory:", path.join(process.cwd(), "backend"));
console.log(
  "📁 Backend exists:",
  fs.existsSync(path.join(process.cwd(), "backend"))
);
console.log(
  "📁 Backend index.js exists:",
  fs.existsSync(path.join(process.cwd(), "backend", "index.js"))
);
console.log(
  "📁 Backend package.json exists:",
  fs.existsSync(path.join(process.cwd(), "backend", "package.json"))
);

// Check if backend directory exists
const backendDir = path.join(process.cwd(), "backend");
if (!fs.existsSync(backendDir)) {
  console.error("❌ Backend directory not found:", backendDir);
  process.exit(1);
}

// Check if backend index.js exists
const backendIndex = path.join(backendDir, "index.js");
if (!fs.existsSync(backendIndex)) {
  console.error("❌ Backend index.js not found:", backendIndex);
  process.exit(1);
}

// Change to backend directory and start the server
console.log("📁 Changing to backend directory...");
process.chdir(backendDir);
console.log("📁 New current directory:", process.cwd());

// Start the backend server
console.log("🚀 Starting backend process...");
const backendProcess = spawn("node", ["index.js"], {
  stdio: "inherit",
  env: process.env,
});

backendProcess.on("error", (error) => {
  console.error("❌ Failed to start backend:", error);
  process.exit(1);
});

backendProcess.on("exit", (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down backend...");
  backendProcess.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down backend...");
  backendProcess.kill("SIGINT");
});
