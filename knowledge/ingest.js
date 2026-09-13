// Knowledge ingestion pipeline — chunks + embeds source docs into knowledge_vectors
// Run: npm run ingest
// Execution: Claude Code

import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { pool } from '../db/pool.js';
import { chunkText } from './chunk.js';
import { embed } from './embed.js';

dotenv.config();

// Sources to ingest: CAP-001 (constraints) + the live system prompt.
// Add more .md paths here as the knowledge base grows.
const SOURCES = [
  process.env.CAP_001_PATH,
  new URL('../prompts/system.md', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
].filter(Boolean);

async function ingestSource(sourcePath) {
  const text = readFileSync(sourcePath, 'utf-8');
  const chunks = chunkText(text);
  console.log(`${sourcePath}: ${chunks.length} chunk(s)`);

  const embeddings = await embed(chunks);

  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `INSERT INTO knowledge_vectors (source, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (source, chunk_index)
       DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
      [sourcePath, i, chunks[i], `[${embeddings[i].join(',')}]`]
    );
  }
}

async function run() {
  for (const source of SOURCES) {
    await ingestSource(source);
  }
  console.log(`Ingestion complete: ${SOURCES.length} source(s)`);
  await pool.end();
}

run().catch((err) => {
  console.error('Ingestion failed:', err.message);
  process.exit(1);
});
