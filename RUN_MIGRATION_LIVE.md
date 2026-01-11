# Run Migration on Live Database

The live version is failing because the `featured` column doesn't exist in the database yet.

## Quick Fix

Run the migration script on the live backend pod:

```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

# Get the backend pod name
BACKEND_POD=$(kubectl get pods -n $NAMESPACE -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run all migrations (this will add the featured column)
kubectl exec -n $NAMESPACE $BACKEND_POD -- node run-all-migrations.js
```

## Alternative: Run Migration Directly on Database

If you have direct database access:

```bash
# Connect to database
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
kubectl port-forward -n igormraz svc/postgresql 5432:5432

# In another terminal, run the migration SQL
psql postgresql://postgres:postgres@localhost:5432/simple_ai_shop -f db/migrations/007_add_featured_products.sql
```

Or manually:

```sql
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
```

## Verify Migration

After running the migration, verify the column exists:

```bash
kubectl exec -n $NAMESPACE $BACKEND_POD -- node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='featured'\")
  .then(r => console.log(r.rows.length > 0 ? 'Column exists' : 'Column missing'))
  .finally(() => pool.end());
"
```
