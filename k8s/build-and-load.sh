#!/bin/bash
# Build image and load into K3s
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
echo "Building on node: $NODE"

cd /workspaces/simple-ai-shop

# Create a build pod
echo "Creating build pod..."
kubectl run build-$(date +%s) \
  --image=docker:24-dind \
  --restart=Never \
  --namespace=igormraz \
  --overrides='{
  "spec": {
    "containers": [{
      "name": "docker",
      "image": "docker:24-dind",
      "securityContext": {
        "privileged": true
      },
      "command": ["sleep", "600"],
      "volumeMounts": [{
        "name": "workspace",
        "mountPath": /workspace
      }]
    }],
    "volumes": [{
      "name": "workspace",
      "emptyDir": {}
    }]
  }
}' 2>&1 | grep -v "already exists" || true

sleep 2
POD=$(kubectl get pods -n igormraz -l run=build-* -o jsonpath='{.items[0].metadata.name}' | head -1)
echo "Build pod: $POD"

kubectl wait --for=condition=ready pod/$POD -n igormraz --timeout=60s || true

echo "Copying source..."
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf - . 2>/dev/null | \
kubectl exec -i -n igormraz $POD -- tar -xzf - -C /workspace

echo "Building..."
kubectl exec -n igormraz $POD -- sh -c "
cd /workspace
apk add --no-cache nodejs npm
npm install -g pnpm@9.0.0
pnpm install --frozen-lockfile
pnpm build
docker build -f Dockerfile.backend -t simple-ai-shop-backend:latest .
docker save simple-ai-shop-backend:latest -o /tmp/backend.tar
"

echo "Copying image..."
kubectl cp igormraz/$POD:/tmp/backend.tar /tmp/backend.tar

echo "Loading into K3s..."
kubectl debug node/$NODE -it --image=busybox --rm --overrides='{
  "spec": {
    "containers": [{
      "name": "debugger",
      "image": "busybox",
      "stdin": true,
      "tty": true,
      "command": ["sh"]
    }]
  }
}' < /tmp/backend.tar -- sh -c "cat | ctr -n k8s.io images import -" 2>&1 || \
kubectl cp /tmp/backend.tar igormraz/$POD:/host/tmp/backend.tar && \
kubectl exec -n igormraz $POD -- sh -c "cat /host/tmp/backend.tar | ctr -n k8s.io images import -" || \
echo "Please manually load: ctr -n k8s.io images import /tmp/backend.tar on node $NODE"

kubectl delete pod $POD -n igormraz --ignore-not-found=true
rm -f /tmp/backend.tar

echo "Build complete! Image: simple-ai-shop-backend:latest"
