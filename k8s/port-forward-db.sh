#!/bin/bash
# Port forward PostgreSQL database for local development
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "Port-forwarding PostgreSQL from Kubernetes..."
echo "Database will be available at: localhost:5432"
echo "Press Ctrl+C to stop"
echo ""

kubectl port-forward -n $NAMESPACE svc/postgresql 5432:5432
