#!/bin/bash
# Port forward PostgreSQL from Kubernetes to localhost
# Usage: ./k8s/port-forward-postgres.sh

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl port-forward -n igormraz svc/postgresql 5432:5432
