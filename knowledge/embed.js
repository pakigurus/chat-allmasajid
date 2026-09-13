// Embeddings via Voyage AI (Anthropic's recommended embedding provider — Claude has no embeddings API)
// Claude Code

import axios from 'axios';

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-2'; // 1024 dims — must match db/schema.sql VECTOR(1024)

export async function embed(texts) {
  const input = Array.isArray(texts) ? texts : [texts];
  const { data } = await axios.post(
    VOYAGE_URL,
    { input, model: MODEL },
    { headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` } }
  );
  const vectors = data.data.map((d) => d.embedding);
  return Array.isArray(texts) ? vectors : vectors[0];
}
