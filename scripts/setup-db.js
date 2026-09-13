// Database setup — applies db/schema.sql
// Run: npm run setup
// Execution: Claude Code

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from '../db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf-8');

const run = async () => {
  console.log(`Connecting to ${process.env.POSTGRES_DB}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}...`);
  await pool.query(schema);
  console.log('Schema applied: chats, knowledge_vectors, leads, audit_log');
  await pool.end();
};

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
