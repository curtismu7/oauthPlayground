#!/bin/bash

# PingOne OAuth/OIDC Playground Setup Script
# This script helps set up the development environment

echo "🚀 Starting PingOne OAuth/OIDC Playground setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14 or later and try again."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check npm version
NPM_VERSION=$(npm -v)
if [[ ${NPM_VERSION:0:2} -lt 60 ]]; then
    echo "⚠️  Your npm version ($NPM_VERSION) is outdated. Consider updating to npm 6.0.0 or later."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file from .env.example..."
    cp .env.example .env
    echo "   Please update the .env file with your PingOne credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✨ Setup complete!"
echo "Next steps:"
echo "1. Update the .env file with your PingOne credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🚀"

exit 0
