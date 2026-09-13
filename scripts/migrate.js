import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'chat_allmasajid',
  user: process.env.POSTGRES_USER || 'chat_allmasajid',
  password: process.env.POSTGRES_PASS,
});

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(result.rows.map(r => r.filename));
}

async function runMigration(client, filename, content) {
  console.log(`Applying ${filename}...`);

  await client.query(content);

  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1)',
    [filename]
  );

  console.log(`✓ Applied ${filename}`);
}

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await ensureMigrationsTable();

    const applied = await getAppliedMigrations();
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f !== 'schema.sql')
      .sort();

    let count = 0;
    for (const file of files) {
      if (!applied.has(file)) {
        const content = readFileSync(path.join(migrationsDir, file), 'utf-8');
        await runMigration(client, file, content);
        count++;
      }
    }

    await client.query('COMMIT');
    console.log(`\nMigrations complete. Applied ${count} new migration(s).`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
