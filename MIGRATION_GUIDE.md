# Database Migration Guide

## Running Migrations

### Local Development

Migrations run automatically when using `./run-all-local.sh`, or you can run them manually:

```bash
node run-all-migrations.js
```

### Production / Live Database

Since you're connected to the live database, run migrations directly:

```bash
# Make sure DATABASE_URL points to your live database
export DATABASE_URL="postgresql://user:password@host:port/database"
node run-all-migrations.js
```

Or connect to the database via kubectl:

```bash
export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig

# Option 1: Run migration script via kubectl exec
kubectl exec -n igormraz deployment/backend -- node run-all-migrations.js

# Option 2: Port-forward database and run locally
kubectl port-forward -n igormraz svc/postgresql 5432:5432
# In another terminal:
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/simple_ai_shop"
node run-all-migrations.js
```

## Migration Script

The `run-all-migrations.js` script:
- Tracks which migrations have been applied in the `schema_migrations` table
- Runs only pending migrations
- Runs migrations in order (alphabetically sorted by filename)
- Rolls back on error

## New Migrations

When adding new migrations:
1. Create SQL file in `db/migrations/` with format: `NNN_description.sql`
2. Use sequential numbers (001, 002, 003, etc.)
3. Run `node run-all-migrations.js` to apply

## Stripe Migrations

The following migrations add Stripe support:
- `005_add_stripe_support.sql` - Adds Stripe payment fields to orders table
- `006_add_stripe_product_sync.sql` - Adds Stripe product sync fields to products table

Both need to be run for full Stripe integration.
