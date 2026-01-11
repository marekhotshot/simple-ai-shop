#!/bin/bash
# Port forward PostgreSQL database for local development
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KUBECONFIG="${SCRIPT_DIR}/kubeconfig"
NAMESPACE=igormraz

echo "Port-forwarding PostgreSQL from Kubernetes..."
echo "Database will be available at: localhost:5432"
echo "Press Ctrl+C to stop"
echo ""

kubectl --kubeconfig="${KUBECONFIG}" port-forward -n $NAMESPACE svc/postgresql 5432:5432
