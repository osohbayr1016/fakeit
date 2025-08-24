#!/usr/bin/env node

// This file is created to satisfy Render's default behavior
// It will start our backend server from the backend directory

const path = require("path");
const { spawn } = require("child_process");

console.log("🚀 Starting backend server...");
console.log("📁 Current directory:", process.cwd());
console.log("📁 Backend directory:", path.join(process.cwd(), "backend"));

// Change to backend directory and start the server
process.chdir(path.join(process.cwd(), "backend"));

// Start the backend server
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
