# Local Development Guide

This guide explains how to run the Simple AI Shop locally while using the PostgreSQL database from Kubernetes.

## Prerequisites

1. **kubectl** installed and configured with access to the cluster
2. **Node.js** (v20 or higher)
3. **pnpm** (will be installed automatically via npx)
4. **PostgreSQL client** (optional, for direct database access)

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# This will:
# - Start port-forward to PostgreSQL
# - Check database connection
# - Run migrations if needed
# - Start the backend server
./run-local.sh
```

### Option 2: Manual Steps

1. **Start PostgreSQL port-forward** (in a separate terminal):
   ```bash
   export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
   ./k8s/port-forward-db.sh
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env if needed (DATABASE_URL should point to localhost:5432)
   ```

3. **Run database migration**:
   ```bash
   node run-migration.js
   ```

4. **Start the backend**:
   ```bash
   # Development mode
   npx --yes pnpm@9.0.0 dev
   
   # Or production build
   npx --yes pnpm@9.0.0 build
   npx --yes pnpm@9.0.0 start
   ```

5. **Start the frontend** (in another terminal):
   ```bash
   # Option 1: Using the script (recommended)
   ./run-frontend.sh
   
   # Option 2: Manual
   cd commerce
   npx --yes pnpm@9.0.0 dev
   ```

### Option 3: Run Everything Together

```bash
# This will start:
# - PostgreSQL port-forward
# - Backend API
# - Frontend
./run-all-local.sh
```

## Port-Forwarding

### PostgreSQL Only
```bash
./k8s/port-forward-db.sh
```

### All Services (PostgreSQL, Backend, Frontend)
```bash
./k8s/port-forward-all.sh
```

## Database Connection

When port-forward is active:
- **Host**: localhost
- **Port**: 5432
- **Database**: simple_ai_shop
- **User**: postgres
- **Password**: postgres

Connection string:
```
postgresql://postgres:postgres@localhost:5432/simple_ai_shop
```

## Environment Variables

### Backend (`.env` file)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simple_ai_shop
SETTINGS_MASTER_KEY=dev-master-key-change-in-production
PORT=3000
DATA_ROOT=./data/uploads
API_BASE_URL=http://localhost:3000
IMAGE_BASE_URL=http://localhost:3000
```

### Frontend (`commerce/.env.local` file)
```env
# Backend API URL
NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:3000
EXPRESS_API_URL=http://localhost:3000

# Image base URL
NEXT_PUBLIC_IMAGE_BASE_URL=http://localhost:3000
IMAGE_BASE_URL=http://localhost:3000

# Shopify Configuration (required)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token

# Site Configuration
SITE_NAME=Simple AI Shop
COMPANY_NAME=Simple AI Shop
```

## Testing the Setup

1. **Check port-forward**:
   ```bash
   # Should show port 5432 listening
   lsof -i :5432
   ```

2. **Test database connection**:
   ```bash
   PGPASSWORD=postgres psql -h localhost -U postgres -d simple_ai_shop -c "SELECT version();"
   ```

3. **Check backend health**:
   ```bash
   curl http://localhost:3000/health
   ```

## Troubleshooting

### Port 5432 already in use
If you have a local PostgreSQL running, either:
- Stop it: `sudo systemctl stop postgresql` (or equivalent)
- Use a different port: `kubectl port-forward -n igormraz svc/postgresql 5433:5432`
- Update `.env` to use the different port

### Cannot connect to database
- Make sure port-forward is running: `./k8s/port-forward-db.sh`
- Check if PostgreSQL pod is running: `kubectl get pods -n igormraz -l app=postgresql`
- Verify kubeconfig: `kubectl get pods -n igormraz`

### Migration fails
- Ensure port-forward is active
- Check database exists: `kubectl exec -n igormraz postgresql-0 -- psql -U postgres -l`
- Run migration manually: `node run-migration.js`

## Next Steps

Once local testing is complete:
1. Build Docker images (you mentioned doing this in another IDE)
2. Push images to registry
3. Deploy to Kubernetes using the manifests in `k8s/` directory
