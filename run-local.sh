#!/bin/bash
# Run the application locally with port-forwarded database
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "=== Starting Local Development Setup ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please review and update .env file if needed"
fi

# Check if port-forward is already running
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
  echo "Port 5432 is already in use. Assuming port-forward is active."
else
  echo "Starting PostgreSQL port-forward in background..."
  ./k8s/port-forward-db.sh &
  PF_PID=$!
  echo "Port-forward PID: $PF_PID"
  sleep 3
  
  # Function to cleanup on exit
  cleanup() {
    echo ""
    echo "Stopping port-forward..."
    kill $PF_PID 2>/dev/null || true
    exit 0
  }
  trap cleanup SIGINT SIGTERM
fi

# Wait for database to be ready
echo "Waiting for database connection..."
for i in {1..30}; do
  if PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Database connection successful!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Warning: Could not connect to database. Make sure port-forward is running."
  fi
  sleep 1
done

# Check if migration has been run
echo "Checking database schema..."
TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
  echo "Running database migration..."
  node run-migration.js
else
  echo "Database schema exists ($TABLE_COUNT tables found)"
fi

echo ""
echo "=== Starting Backend Server ==="
echo "Backend will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo ""
echo "To start the frontend, open another terminal and run:"
echo "  ./run-frontend.sh"
echo ""
echo "Or to run both together:"
echo "  ./run-all-local.sh"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the backend
if [ -d "dist" ]; then
  echo "Using production build..."
  npx --yes pnpm@9.0.0 start
else
  echo "Using development mode..."
  npx --yes pnpm@9.0.0 dev
fi
