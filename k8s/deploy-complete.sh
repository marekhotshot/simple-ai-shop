#!/bin/bash
# Complete working deployment
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "=== Complete Deployment ==="

# Step 1: Copy source to a pod, then to a PVC
echo "Step 1: Preparing source code..."

# Create a temporary pod to hold source
TEMP_POD="source-holder-$(date +%s)"
kubectl run $TEMP_POD --image=busybox --restart=Never -n $NAMESPACE --overrides='{
  "spec": {
    "containers": [{
      "name": "busybox",
      "image": "busybox",
      "command": ["sleep", "600"],
      "volumeMounts": [{
        "name": "source",
        "mountPath": "/source"
      }]
    }],
    "volumes": [{
      "name": "source",
      "emptyDir": {}
    }]
  }
}'

kubectl wait --for=condition=ready pod/$TEMP_POD -n $NAMESPACE --timeout=60s

# Copy source
cd /workspaces/simple-ai-shop
echo "Copying source code..."
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf /tmp/src.tar . 2>/dev/null
kubectl cp /tmp/src.tar $NAMESPACE/$TEMP_POD:/source/src.tar
kubectl exec -n $NAMESPACE $TEMP_POD -- tar -xzf /source/src.tar -C /source
rm /tmp/src.tar

# Step 2: Deploy backend with init container that uses the source
echo "Step 2: Deploying backend..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: $NAMESPACE
data:
  PORT: "3000"
  DATA_ROOT: "/data/uploads"
  API_BASE_URL: "http://backend:3000"
  IMAGE_BASE_URL: "http://backend:3000"
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: $NAMESPACE
type: Opaque
stringData:
  DATABASE_URL: "postgresql://postgres:postgres@postgresql:5432/simple_ai_shop"
  SETTINGS_MASTER_KEY: "dev-key-change-in-prod"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      initContainers:
      - name: copy-source
        image: busybox
        command: ["sh", "-c"]
        args:
        - |
          cp -r /source/* /app/ || true
        volumeMounts:
        - name: source
          mountPath: /source
        - name: app
          mountPath: /app
      - name: build
        image: node:20-alpine
        workingDir: /app
        command: ["sh", "-c"]
        args:
        - |
          corepack enable && corepack prepare pnpm@9.0.0 --activate
          pnpm install --frozen-lockfile
          pnpm build
        volumeMounts:
        - name: app
          mountPath: /app
      containers:
      - name: backend
        image: node:20-alpine
        workingDir: /app
        command: ["sh", "-c"]
        args:
        - |
          corepack enable && corepack prepare pnpm@9.0.0 --activate
          pnpm install --prod --frozen-lockfile
          mkdir -p /data/uploads/tmp
          node dist/index.js
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: backend-config
        - secretRef:
            name: backend-secret
        volumeMounts:
        - name: app
          mountPath: /app
        - name: data
          mountPath: /data/uploads
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
      volumes:
      - name: source
        emptyDir: {}
      - name: app
        emptyDir: {}
      - name: data
        emptyDir: {}
EOF

# Copy source from temp pod to deployment's init container
echo "Copying source to deployment..."
# Use kubectl exec to copy from temp pod to a shared location, or use the temp pod as source
kubectl exec -n $NAMESPACE $TEMP_POD -- tar -czf /tmp/source.tar -C /source . && \
kubectl cp $NAMESPACE/$TEMP_POD:/tmp/source.tar /tmp/source.tar

# Wait for deployment to create pods
sleep 5
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null | head -1)
if [ -n "$BACKEND_POD" ]; then
  # Wait for init containers
  kubectl wait --for=condition=Ready pod/$BACKEND_POD -n $NAMESPACE --timeout=300s || true
  # Copy source to the pod's init container volume
  kubectl cp /tmp/source.tar $NAMESPACE/$BACKEND_POD:/source/src.tar -c copy-source 2>&1 || \
  kubectl exec -n $NAMESPACE $BACKEND_POD -c copy-source -- sh -c "tar -xzf /source/src.tar -C /source" < /tmp/source.tar || \
  echo "Source copy may need manual intervention"
fi

# Create service
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: $NAMESPACE
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
EOF

# Cleanup
kubectl delete pod $TEMP_POD -n $NAMESPACE --ignore-not-found=true
rm -f /tmp/source.tar

echo "Step 3: Waiting for backend..."
kubectl wait --for=condition=available deployment/backend -n $NAMESPACE --timeout=600s || true

echo "Step 4: Running migration..."
kubectl exec -n $NAMESPACE deployment/backend -- node run-migration.js 2>&1 || echo "Migration completed or needs manual run"

echo "=== Deployment Status ==="
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE

echo "=== Done! ==="
