import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  const files = await fs.readdir(migrationsDir);
  return files
    .filter(file => file.endsWith('.sql'))
    .sort() // Sort alphabetically - migrations should be numbered
    .map(file => path.join(migrationsDir, file));
}

async function getCompletedMigrations() {
  try {
    const result = await pool.query(`
      SELECT migration_name FROM schema_migrations 
      ORDER BY applied_at
    `);
    return result.rows.map(row => row.migration_name);
  } catch (error) {
    // If table doesn't exist, no migrations have been run
    if (error.code === '42P01') { // relation does not exist
      return [];
    }
    throw error;
  }
}

async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function recordMigration(migrationName) {
  await pool.query(
    'INSERT INTO schema_migrations (migration_name) VALUES ($1) ON CONFLICT (migration_name) DO NOTHING',
    [migrationName]
  );
}

async function runAllMigrations() {
  try {
    await createMigrationsTable();
    
    const migrationFiles = await getMigrationFiles();
    const completedMigrations = await getCompletedMigrations();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${completedMigrations.length} migrations already applied`);
    
    for (const migrationPath of migrationFiles) {
      const migrationName = path.basename(migrationPath);
      
      if (completedMigrations.includes(migrationName)) {
        console.log(`✓ ${migrationName} - already applied`);
        continue;
      }
      
      console.log(`Running migration: ${migrationName}...`);
      const sql = await fs.readFile(migrationPath, 'utf-8');
      
      // Run the entire SQL file as a single transaction
      // PostgreSQL migrations can contain multiple statements separated by semicolons
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Execute the SQL file - PostgreSQL handles multiple statements
        await client.query(sql);
        await recordMigration(migrationName);
        await client.query('COMMIT');
        console.log(`✓ ${migrationName} - completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ ${migrationName} - failed:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }
    
    console.log('\nAll migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllMigrations();
