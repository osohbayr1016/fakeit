#!/usr/bin/env node

// Fallback entry point - redirect to src/index.js
console.log("🔄 Root index.js called, redirecting to src/index.js...");

try {
  require("./src/index.js");
} catch (error) {
  console.error("❌ Failed to load src/index.js:", error);
  console.log("📁 Current directory:", process.cwd());
  console.log("📁 Files in current directory:", require("fs").readdirSync("."));

  // Try to start backend directly if src doesn't work
  console.log("🔄 Trying to start backend directly...");
  try {
    process.chdir("./backend");
    require("./index.js");
  } catch (backendError) {
    console.error("❌ Failed to start backend directly:", backendError);
    process.exit(1);
  }
}
