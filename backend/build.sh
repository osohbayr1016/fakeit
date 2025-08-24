#!/bin/bash
echo "🚀 Building FakeIt Backend..."
echo "📦 Installing dependencies..."
npm ci --only=production
echo "✅ Build complete!"
