#!/bin/bash
# Run frontend locally
set -e

cd commerce

echo "=== Starting Frontend (Next.js) ==="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local from .env.local.example..."
  cp .env.local.example .env.local
  echo ""
  echo "⚠️  Please update commerce/.env.local with your configuration:"
  echo "   - NEXT_PUBLIC_EXPRESS_API_URL (should be http://localhost:3000)"
  echo "   - SHOPIFY_STORE_DOMAIN"
  echo "   - SHOPIFY_STOREFRONT_ACCESS_TOKEN"
  echo ""
  read -p "Press Enter to continue after updating .env.local..."
fi

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
  echo "⚠️  Warning: Backend doesn't seem to be running on http://localhost:3000"
  echo "   Make sure to start the backend first (./run-local.sh or manually)"
  echo ""
fi

echo "Starting Next.js development server..."
echo "Frontend will be available at: http://localhost:3000 (or 3001 if backend is on 3000)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npx --yes pnpm@9.0.0 dev
