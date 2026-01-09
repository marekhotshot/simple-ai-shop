# Setup Guide

## Prerequisites

1. **Node.js** (v20 or higher)
2. **PostgreSQL** database (deployed in Kubernetes namespace `igormraz`)
3. **kubectl** (installed and configured with kubeconfig)
4. **pnpm** package manager (will be installed automatically via npx)

## Installation Steps

### 1. Install Dependencies

Dependencies have been installed. If you need to reinstall:

```bash
# Root dependencies
npx --yes pnpm@9.0.0 install

# Commerce dependencies
cd commerce && npx --yes pnpm@9.0.0 install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/simple_ai_shop
SETTINGS_MASTER_KEY=your-master-key-change-this-in-production

# Optional (with defaults)
PORT=3000
DATA_ROOT=./data/uploads
API_BASE_URL=http://localhost:3000
IMAGE_BASE_URL=http://localhost:3000
```

For the commerce frontend, create `commerce/.env.local`:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
```

### 3. Set Up Database

PostgreSQL is deployed in the Kubernetes cluster in the `igormraz` namespace.

**Option A: Using Kubernetes PostgreSQL (Recommended)**

1. Port-forward PostgreSQL to localhost (run in a separate terminal):
   ```bash
   export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
   ./k8s/port-forward-postgres.sh
   ```
   Or manually:
   ```bash
   export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
   kubectl port-forward -n igormraz svc/postgresql 5432:5432
   ```

2. Update your `.env` file with:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simple_ai_shop
   ```

3. Run the migration:
   ```bash
   export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
   node run-migration.js
   ```

**Option B: Using Local PostgreSQL**

1. Create a PostgreSQL database:
   ```bash
   createdb simple_ai_shop
   ```

2. Update your `.env` file with your local connection string

3. Run the migration:
   ```bash
   node run-migration.js
   ```

### 4. Run the Application

**Option A: Development Mode (with TypeScript)**

Backend Server:
```bash
npx --yes pnpm@9.0.0 dev
```

**Option B: Production Build (recommended)**

1. Build the backend:
   ```bash
   npx --yes pnpm@9.0.0 build
   ```

2. Start the backend:
   ```bash
   npx --yes pnpm@9.0.0 start
   ```

**Commerce Frontend (in a separate terminal):**
```bash
cd commerce && npx --yes pnpm@9.0.0 dev
```

**Note:** The backend and frontend both default to port 3000. If running both, Next.js will automatically use port 3001 for the frontend.

## Kubernetes PostgreSQL

PostgreSQL is deployed in the `igormraz` namespace. To manage it:

**Check PostgreSQL status:**
```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl get pods -n igormraz -l app=postgresql
kubectl get svc -n igormraz postgresql
```

**View PostgreSQL logs:**
```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl logs -n igormraz postgresql-0
```

**Connect to PostgreSQL directly:**
```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl exec -it -n igormraz postgresql-0 -- psql -U postgres -d simple_ai_shop
```

**Re-deploy PostgreSQL:**
```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl apply -f k8s/postgresql.yaml
```

## Notes

- The `DATA_ROOT` directory will be created automatically if it doesn't exist
- Make sure PostgreSQL is running (or port-forward is active) before starting the backend
- Update the `SETTINGS_MASTER_KEY` with a secure random string for production
- The Kubernetes PostgreSQL credentials are: `postgres/postgres` (stored in Secret `postgresql-secret`)
