# Deployment Guide for igormraz.com

## Quick Start

### 1. Build and Push Images

```bash
./build-and-push.sh
```

This will:
- Build backend and frontend Docker images
- Tag them as `marekhotshot/igormraz-backend:0.1` and `marekhotshot/igormraz-frontend:0.1`
- Push to Docker Hub

### 2. Deploy to Kubernetes

```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig

# Deploy PostgreSQL (if not already deployed)
kubectl apply -f k8s/postgresql.yaml

# Deploy backend
kubectl apply -f k8s/backend.yaml

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Check status
kubectl get pods -n igormraz
kubectl get svc -n igormraz
kubectl get ingress -n igormraz
```

### 3. DNS Configuration

Point your DNS to: **188.245.193.10**

**A Records:**
- `@` (root) → `188.245.193.10`
- `www` → `188.245.193.10`

**Note:** If you're using a LoadBalancer or different ingress setup, check the ingress controller's external IP instead.

### 4. Verify Deployment

```bash
# Check pods are running
kubectl get pods -n igormraz

# Check services
kubectl get svc -n igormraz

# Check ingress
kubectl get ingress -n igormraz

# View logs
kubectl logs -n igormraz deployment/backend
kubectl logs -n igormraz deployment/frontend
```

## Environment Variables

The deployment uses:
- **Site Name**: igormraz
- **Domain**: igormraz.com
- **Backend API**: https://igormraz.com/api
- **Image Base URL**: https://igormraz.com

## Updating Images

To update to a new version:

1. Update version in `build-and-push.sh`
2. Run `./build-and-push.sh`
3. Update image tags in `k8s/backend.yaml` and `k8s/frontend.yaml`
4. Apply: `kubectl apply -f k8s/backend.yaml k8s/frontend.yaml`
5. Restart pods: `kubectl rollout restart deployment/backend deployment/frontend -n igormraz`

## Troubleshooting

### Images not pulling
- Check Docker Hub credentials: `docker login`
- Verify image exists: `docker pull marekhotshot/igormraz-backend:0.1`

### DNS not working
- Check DNS propagation: `dig igormraz.com`
- Verify ingress is configured: `kubectl describe ingress -n igormraz`
- Check ingress controller is running

### Pods not starting
- Check logs: `kubectl logs -n igormraz <pod-name>`
- Check events: `kubectl describe pod -n igormraz <pod-name>`
- Verify database is running: `kubectl get pods -n igormraz -l app=postgresql`
