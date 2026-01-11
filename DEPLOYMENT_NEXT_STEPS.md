# Deployment Status - Next Steps

## Current Status

✅ **Deployments Created**: Backend and Frontend deployments are created
❌ **Images Not Available**: Docker images need to be built and pushed first

## Issue

The pods are failing with `ErrImagePull` because the images `marekhotshot/igormraz-backend:0.1` and `marekhotshot/igormraz-frontend:0.1` don't exist in Docker Hub yet.

## Solution

### Step 1: Build and Push Images

Run the build script to create and push the images:

```bash
./build-and-push.sh
```

This will:
1. Build `marekhotshot/igormraz-backend:0.1`
2. Build `marekhotshot/igormraz-frontend:0.1`
3. Push both to Docker Hub

### Step 2: Wait for Images to be Available

After pushing, wait a few seconds for Docker Hub to make them available.

### Step 3: Restart Pods

Once images are pushed, restart the deployments:

```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig

# Delete pods to force them to pull new images
kubectl delete pods -n igormraz -l app=backend
kubectl delete pods -n igormraz -l app=frontend

# Or restart deployments
kubectl rollout restart deployment/backend -n igormraz
kubectl rollout restart deployment/frontend -n igormraz
```

### Step 4: Check Status

```bash
kubectl get pods -n igormraz
kubectl get deployment -n igormraz
```

### Step 5: Run Database Migration

Once backend is running:

```bash
# Get backend pod name
BACKEND_POD=$(kubectl get pods -n igormraz -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run migration
kubectl exec -n igormraz $BACKEND_POD -- node run-migration.js
```

## What's Already Deployed

✅ PostgreSQL - Running
✅ Backend Deployment - Created (waiting for image)
✅ Frontend Deployment - Created (waiting for image)
✅ Services - Created
✅ Ingress - Created and configured for `igormraz.com`

## After Images are Available

Once the images are pushed and pods are running:
- Backend will be available at: `http://backend:3000` (internal)
- Frontend will be available at: `http://frontend:3000` (internal)
- Public access: `http://igormraz.com` (after DNS is configured)
