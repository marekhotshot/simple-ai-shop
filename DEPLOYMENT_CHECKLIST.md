# Deployment Checklist for igormraz.com

## Pre-Deployment

- [x] Shop name updated to "igormraz"
- [x] Domain configured: igormraz.com
- [x] Docker images configured: marekhotshot/igormraz-backend:0.1, marekhotshot/igormraz-frontend:0.1
- [x] Build script created: `./build-and-push.sh`
- [ ] Docker images built and pushed to Docker Hub
- [ ] DNS configured (point to 188.245.193.10)

## Deployment Steps

### 1. Build and Push Images
```bash
docker login
./build-and-push.sh
```

### 2. Deploy to Kubernetes
```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig

# Deploy PostgreSQL (if not already)
kubectl apply -f k8s/postgresql.yaml

# Deploy Backend
kubectl apply -f k8s/backend.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend.yaml

# Wait for deployments
kubectl wait --for=condition=available deployment/backend -n igormraz --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n igormraz --timeout=300s
```

### 3. Run Database Migration
```bash
# Get backend pod
BACKEND_POD=$(kubectl get pods -n igormraz -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run migration
kubectl exec -n igormraz $BACKEND_POD -- node run-migration.js
```

### 4. Verify Deployment
```bash
./validate-deployment.sh
```

## Configuration Summary

### Backend
- **Image**: `marekhotshot/igormraz-backend:0.1`
- **API URL**: `https://igormraz.com/api`
- **Image Base URL**: `https://igormraz.com`
- **Database**: PostgreSQL in same namespace

### Frontend
- **Image**: `marekhotshot/igormraz-frontend:0.1`
- **Public API URL**: `https://igormraz.com/api` (for browser)
- **Internal API URL**: `http://backend:3000` (for server-side)
- **Site Name**: igormraz

### Ingress
- **Domain**: igormraz.com, www.igormraz.com
- **Controller**: Traefik
- **Routes**:
  - `/` → Frontend
  - `/api` → Backend
  - `/uploads` → Backend

### DNS
- **Point to**: `188.245.193.10`
- **Records**: A record for `@` and `www`

## Post-Deployment

- [ ] Verify site loads at https://igormraz.com
- [ ] Test API endpoints
- [ ] Verify database connection
- [ ] Check pod logs for errors
- [ ] Configure SSL/TLS (recommended)

## Troubleshooting

### Images not pulling
```bash
# Check if images exist
docker pull marekhotshot/igormraz-backend:0.1
docker pull marekhotshot/igormraz-frontend:0.1

# Check pod events
kubectl describe pod -n igormraz <pod-name>
```

### Pods not starting
```bash
# Check logs
kubectl logs -n igormraz deployment/backend
kubectl logs -n igormraz deployment/frontend

# Check events
kubectl get events -n igormraz --sort-by='.lastTimestamp'
```

### Database connection issues
```bash
# Check PostgreSQL
kubectl get pods -n igormraz -l app=postgresql
kubectl logs -n igormraz postgresql-0

# Test connection
kubectl exec -n igormraz postgresql-0 -- psql -U postgres -d simple_ai_shop -c "SELECT 1;"
```
