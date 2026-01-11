#!/bin/bash
# Port forward all services for local development
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "Starting port-forwards for local development..."
echo "Press Ctrl+C to stop all port-forwards"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "Stopping port-forwards..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

# Port forward PostgreSQL
echo "Forwarding PostgreSQL (localhost:5432 -> postgresql:5432)..."
kubectl port-forward -n $NAMESPACE svc/postgresql 5432:5432 &
PF_PG=$!

# Port forward Backend (if deployed)
echo "Forwarding Backend API (localhost:3000 -> backend:3000)..."
kubectl port-forward -n $NAMESPACE svc/backend 3000:3000 2>/dev/null &
PF_BACKEND=$!

# Port forward Frontend (if deployed)
echo "Forwarding Frontend (localhost:3001 -> frontend:3001)..."
kubectl port-forward -n $NAMESPACE svc/frontend 3001:3001 2>/dev/null &
PF_FRONTEND=$!

echo ""
echo "Port-forwards active:"
echo "  PostgreSQL: localhost:5432"
echo "  Backend:    localhost:3000 (if deployed)"
echo "  Frontend:   localhost:3001 (if deployed)"
echo ""
echo "Waiting... (Press Ctrl+C to stop)"

# Wait for all background jobs
wait
