#!/bin/bash
# Validate deployment configuration
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "=== Validating Deployment Configuration ==="
echo ""

# Check namespace exists
echo "1. Checking namespace..."
if kubectl get namespace $NAMESPACE &>/dev/null; then
  echo "   ✅ Namespace '$NAMESPACE' exists"
else
  echo "   ❌ Namespace '$NAMESPACE' not found"
  exit 1
fi

# Check PostgreSQL
echo ""
echo "2. Checking PostgreSQL..."
if kubectl get statefulset postgresql -n $NAMESPACE &>/dev/null; then
  echo "   ✅ PostgreSQL StatefulSet exists"
  READY=$(kubectl get statefulset postgresql -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  DESIRED=$(kubectl get statefulset postgresql -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ]; then
    echo "   ✅ PostgreSQL is running ($READY/$DESIRED pods ready)"
  else
    echo "   ⚠️  PostgreSQL not ready ($READY/$DESIRED pods)"
  fi
else
  echo "   ❌ PostgreSQL StatefulSet not found"
fi

# Check backend
echo ""
echo "3. Checking Backend..."
if kubectl get deployment backend -n $NAMESPACE &>/dev/null; then
  echo "   ✅ Backend Deployment exists"
  IMAGE=$(kubectl get deployment backend -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
  echo "   📦 Image: $IMAGE"
  READY=$(kubectl get deployment backend -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  DESIRED=$(kubectl get deployment backend -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ]; then
    echo "   ✅ Backend is running ($READY/$DESIRED pods ready)"
  else
    echo "   ⚠️  Backend not ready ($READY/$DESIRED pods)"
  fi
else
  echo "   ❌ Backend Deployment not found"
fi

# Check frontend
echo ""
echo "4. Checking Frontend..."
if kubectl get deployment frontend -n $NAMESPACE &>/dev/null; then
  echo "   ✅ Frontend Deployment exists"
  IMAGE=$(kubectl get deployment frontend -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
  echo "   📦 Image: $IMAGE"
  READY=$(kubectl get deployment frontend -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  DESIRED=$(kubectl get deployment frontend -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  if [ "$READY" = "$DESIRED" ] && [ "$READY" != "0" ]; then
    echo "   ✅ Frontend is running ($READY/$DESIRED pods ready)"
  else
    echo "   ⚠️  Frontend not ready ($READY/$DESIRED pods)"
  fi
else
  echo "   ❌ Frontend Deployment not found"
fi

# Check services
echo ""
echo "5. Checking Services..."
for svc in backend frontend postgresql; do
  if kubectl get svc $svc -n $NAMESPACE &>/dev/null; then
    echo "   ✅ Service '$svc' exists"
  else
    echo "   ❌ Service '$svc' not found"
  fi
done

# Check ingress
echo ""
echo "6. Checking Ingress..."
if kubectl get ingress frontend-ingress -n $NAMESPACE &>/dev/null; then
  echo "   ✅ Ingress exists"
  HOSTS=$(kubectl get ingress frontend-ingress -n $NAMESPACE -o jsonpath='{.spec.rules[*].host}' 2>/dev/null || echo "")
  echo "   🌐 Hosts: $HOSTS"
else
  echo "   ❌ Ingress not found"
fi

# Check ConfigMaps
echo ""
echo "7. Checking ConfigMaps..."
for cm in backend-config frontend-config; do
  if kubectl get configmap $cm -n $NAMESPACE &>/dev/null; then
    echo "   ✅ ConfigMap '$cm' exists"
  else
    echo "   ❌ ConfigMap '$cm' not found"
  fi
done

# Check Secrets
echo ""
echo "8. Checking Secrets..."
for secret in backend-secret frontend-secret postgresql-secret; do
  if kubectl get secret $secret -n $NAMESPACE &>/dev/null; then
    echo "   ✅ Secret '$secret' exists"
  else
    echo "   ❌ Secret '$secret' not found"
  fi
done

# Check PVCs
echo ""
echo "9. Checking PersistentVolumeClaims..."
PVC_COUNT=$(kubectl get pvc -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
echo "   📦 Found $PVC_COUNT PVC(s)"

# Validate image references
echo ""
echo "10. Validating Image References..."
BACKEND_IMAGE=$(kubectl get deployment backend -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")
FRONTEND_IMAGE=$(kubectl get deployment frontend -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")

if [[ "$BACKEND_IMAGE" == *"marekhotshot/igormraz-backend"* ]]; then
  echo "   ✅ Backend image correct: $BACKEND_IMAGE"
else
  echo "   ⚠️  Backend image: $BACKEND_IMAGE (expected: marekhotshot/igormraz-backend:0.1)"
fi

if [[ "$FRONTEND_IMAGE" == *"marekhotshot/igormraz-frontend"* ]]; then
  echo "   ✅ Frontend image correct: $FRONTEND_IMAGE"
else
  echo "   ⚠️  Frontend image: $FRONTEND_IMAGE (expected: marekhotshot/igormraz-frontend:0.1)"
fi

echo ""
echo "=== Validation Complete ==="
