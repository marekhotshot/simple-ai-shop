#!/bin/bash
# Run both backend and frontend locally with port-forwarded database
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIG="${SCRIPT_DIR}/kubeconfig"
NAMESPACE=igormraz

echo "=== Starting Complete Local Development Environment ==="
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "Stopping all services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Setup .env files
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
fi

if [ ! -f commerce/.env.local ]; then
  echo "Creating commerce/.env.local file..."
  cp commerce/.env.local.example commerce/.env.local
  echo "⚠️  Please update commerce/.env.local with your Shopify credentials"
fi

# Step 2: Start PostgreSQL port-forward
echo "Starting PostgreSQL port-forward..."
# Use --kubeconfig flag to ensure correct config in background processes
kubectl --kubeconfig="${KUBECONFIG}" port-forward -n $NAMESPACE svc/postgresql 5432:5432 > /tmp/db-portforward.log 2>&1 &
PF_PG=$!
sleep 3

# Wait for database
echo "Waiting for database connection..."
for i in {1..30}; do
  if PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✓ Database connected"
    break
  fi
  sleep 1
done

# Step 3: Run migration if needed
echo "Checking database schema..."
TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
  echo "Running database migration..."
  node run-migration.js
else
  echo "✓ Database schema ready ($TABLE_COUNT tables)"
fi

echo ""
echo "=== Starting Services ==="
echo ""

# Step 4: Start backend
echo "Starting Backend API..."
if [ -d "dist" ]; then
  npx --yes pnpm@9.0.0 start > /tmp/backend.log 2>&1 &
else
  npx --yes pnpm@9.0.0 dev > /tmp/backend.log 2>&1 &
fi
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend running on http://localhost:3000"
    break
  fi
  sleep 1
done

# Step 5: Start frontend
echo "Starting Frontend..."
cd commerce
npx --yes pnpm@9.0.0 dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend
sleep 3

echo ""
echo "=== Services Running ==="
echo "  PostgreSQL: localhost:5432 (port-forwarded from K8s)"
echo "  Backend:    http://localhost:3000"
echo "  Frontend:   http://localhost:3000 (or 3001 if 3000 is taken)"
echo ""
echo "Logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait
