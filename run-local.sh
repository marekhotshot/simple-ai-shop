#!/bin/bash
# Run the application locally with port-forwarded database
# Note: Using set +e for kubectl operations as they may have transient errors

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export KUBECONFIG="${SCRIPT_DIR}/kubeconfig"
NAMESPACE=igormraz

echo "=== Starting Local Development Setup ==="
echo ""

# Verify kubeconfig is accessible
if [ ! -f "${SCRIPT_DIR}/kubeconfig" ]; then
  echo "❌ Error: kubeconfig file not found at ${SCRIPT_DIR}/kubeconfig"
  exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
  echo "Please review and update .env file if needed"
fi

# Check if port 5432 is already in use
PORT_IN_USE=false
if command -v ss >/dev/null 2>&1; then
  if ss -tulpn 2>/dev/null | grep -q ":5432 "; then
    PORT_IN_USE=true
  fi
elif command -v netstat >/dev/null 2>&1; then
  if netstat -tulpn 2>/dev/null | grep -q ":5432 "; then
    PORT_IN_USE=true
  fi
fi

# Always kill any existing kubectl port-forwards for port 5432 before starting a new one
# This ensures we have a clean, fresh connection instead of multiple competing instances
if [ "$PORT_IN_USE" = true ]; then
  echo "Port 5432 is in use. Killing existing kubectl port-forward processes..."
  pkill -f "kubectl.*port-forward.*5432" 2>/dev/null || true
  pkill -f "kubectl.*port-forward.*postgresql" 2>/dev/null || true
  sleep 2  # Give processes time to fully terminate
fi

# Start fresh PostgreSQL port-forward
echo "Starting PostgreSQL port-forward in background..."
# Use --kubeconfig flag instead of KUBECONFIG env var for background processes
# This ensures kubectl uses the correct config file even in background processes
set +e
kubectl --kubeconfig="${SCRIPT_DIR}/kubeconfig" port-forward -n $NAMESPACE svc/postgresql 5432:5432 > /tmp/db-portforward.log 2>&1 &
PF_PID=$!
set -e
echo "Port-forward PID: $PF_PID"
sleep 5  # Give kubectl time to establish connection

# Verify port-forward is actually working
if [ ! -z "$PF_PID" ] && ! ps -p $PF_PID > /dev/null 2>&1; then
  echo "⚠️  Warning: Port-forward process exited immediately. Check /tmp/db-portforward.log for errors."
  cat /tmp/db-portforward.log 2>&1 | tail -5
  echo ""
  echo "If port is still in use, manually kill the process:"
  echo "  pkill -f 'kubectl.*port-forward.*5432'"
  exit 1
fi

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "Stopping database port-forward..."
  if [ ! -z "$PF_PID" ] && ps -p $PF_PID > /dev/null 2>&1; then
    kill $PF_PID 2>/dev/null || true
  fi
  # Kill any remaining database port-forwards as a safety measure
  pkill -f "kubectl.*port-forward.*5432" 2>/dev/null || true
  pkill -f "kubectl.*port-forward.*postgresql" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Wait for database to be ready
echo "Waiting for database connection..."
DB_CONNECTED=false
for i in {1..30}; do
  if PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✓ Database connection successful!"
    DB_CONNECTED=true
    break
  fi
  if [ $i -eq 30 ]; then
    echo "⚠️  Warning: Could not connect to database after 30 seconds."
    echo "   Make sure port-forward is running: kubectl port-forward -n $NAMESPACE svc/postgresql 5432:5432"
    echo "   Continuing anyway - backend will retry connection..."
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

# Ensure port 3000 is free for local backend (kill any port-forwards to Kubernetes backend)
# Since we're running the backend locally, we don't need to port-forward the Kubernetes backend
echo "Checking port 3000 availability..."
if ss -tulpn 2>/dev/null | grep -q ":3000 " || netstat -tulpn 2>/dev/null | grep -q ":3000 "; then
  echo "⚠️  Port 3000 is in use. Killing any Kubernetes backend port-forwards..."
  pkill -f "kubectl.*port-forward.*backend" 2>/dev/null || true
  pkill -f "kubectl.*port-forward.*3000" 2>/dev/null || true
  sleep 2
  # Check again - if still in use, warn user
  if ss -tulpn 2>/dev/null | grep -q ":3000 " || netstat -tulpn 2>/dev/null | grep -q ":3000 "; then
    echo "⚠️  Warning: Port 3000 is still in use by another process."
    echo "   The backend may fail to start. Kill the process using port 3000 first."
  fi
fi

# Start the backend - try multiple methods to get pnpm
PNPM_CMD=""

# Method 1: Try corepack (built into Node.js 16.9+, but may not work in WSL)
if command -v corepack >/dev/null 2>&1 && ! echo "$(which corepack)" | grep -q "/mnt/c/"; then
  echo "Attempting to use corepack..."
  if corepack enable >/dev/null 2>&1 && corepack prepare pnpm@9.0.0 --activate >/dev/null 2>&1; then
    if command -v pnpm >/dev/null 2>&1; then
      PNPM_CMD="pnpm"
      echo "✓ Using corepack pnpm"
    fi
  fi
fi

# Method 2: Try locally installed pnpm (if corepack failed or unavailable)
if [ -z "$PNPM_CMD" ] && [ -f "node_modules/.bin/pnpm" ]; then
  PNPM_CMD="./node_modules/.bin/pnpm"
  echo "✓ Using locally installed pnpm"
fi

# Method 3: Try globally installed pnpm
if [ -z "$PNPM_CMD" ] && command -v pnpm >/dev/null 2>&1; then
  PNPM_CMD="pnpm"
  echo "✓ Using globally installed pnpm"
fi

# Method 4: Fallback to npx (may have proxy issues, but we'll try)
if [ -z "$PNPM_CMD" ]; then
  echo "⚠️  pnpm not found. Will try npx (may have proxy issues)..."
  PNPM_CMD="npx --yes pnpm@9.0.0"
  echo "   If this fails, install pnpm: npm install -g pnpm"
fi

# Start the backend with the determined command
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
  # Production build exists - can run directly with node (no pnpm needed!)
  echo "Using production build (running directly with node)..."
  if [ -z "$PNPM_CMD" ] || echo "$PNPM_CMD" | grep -q "npx"; then
    echo "✓ Running with node directly (bypassing pnpm/npm)"
    node dist/index.js || {
      echo ""
      echo "❌ Failed to start backend."
      echo ""
      echo "Troubleshooting:"
      echo "  1. Check if port 3000 is free: ss -tulpn | grep 3000"
      echo "  2. Check if .env file exists and has correct database settings"
      echo "  3. Verify database connection is working"
      echo "  4. Check backend logs above for errors"
      exit 1
    }
  else
    $PNPM_CMD start || {
      echo ""
      echo "❌ Failed to start backend."
      echo ""
      echo "Troubleshooting:"
      echo "  1. Check if port 3000 is free: ss -tulpn | grep 3000"
      echo "  2. Check if .env file exists and has correct database settings"
      echo "  3. Verify database connection is working"
      exit 1
    }
  fi
else
  # Development mode - need pnpm to handle TypeScript/ts-node
  echo "Using development mode..."
  if [ -z "$PNPM_CMD" ] || echo "$PNPM_CMD" | grep -q "npx"; then
    echo ""
    echo "❌ Development mode requires pnpm but it's not available."
    echo ""
    echo "Solutions:"
    echo "  1. Install pnpm: npm install -g pnpm"
    echo "  2. Or configure npm proxy and run: npm install -g pnpm"
    echo "  3. Or build production first: npm run build (or pnpm build)"
    echo "  4. Or configure npm proxy: npm config set proxy http://proxy:port"
    exit 1
  else
    $PNPM_CMD dev || {
      echo ""
      echo "❌ Failed to start backend in development mode."
      echo ""
      echo "Troubleshooting:"
      echo "  1. Check if port 3000 is free: ss -tulpn | grep 3000"
      echo "  2. Verify all dependencies are installed"
      exit 1
    }
  fi
fi
