// RAG retrieval — embeds a query and finds the closest knowledge_vectors rows
// Execution: Claude Code

import { pool } from '../db/pool.js';
import { embed } from './embed.js';

export async function retrieve(query, topK = 5) {
  const queryEmbedding = await embed(query);
  const { rows } = await pool.query(
    `SELECT source, content, 1 - (embedding <=> $1) AS similarity
     FROM knowledge_vectors
     ORDER BY embedding <=> $1
     LIMIT $2`,
    [`[${queryEmbedding.join(',')}]`, topK]
  );
  return rows;
}
