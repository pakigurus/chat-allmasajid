// Chatbot entry point (Claude Code)
// Wires the Claude API to the CAP-001-constrained system prompt.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { retrieve } from '../knowledge/retrieve.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(
  path.join(__dirname, '..', 'prompts', 'system.md'),
  'utf-8'
);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildSystemPrompt(message) {
  let retrieved = [];
  try {
    retrieved = await retrieve(message);
  } catch (err) {
    // Knowledge base not ingested yet, or DB unreachable — fall back to base prompt.
    console.warn('RAG retrieval skipped:', err.message);
  }
  if (retrieved.length === 0) return SYSTEM_PROMPT;

  const context = retrieved.map((r) => `- ${r.content}`).join('\n');
  return `${SYSTEM_PROMPT}\n\n## Retrieved knowledge for this question\n${context}`;
}

function stripMetaTag(text) {
  const metaRegex = /<<META confidence=([\d.]+) fallback=(yes|no)>>$/;
  const match = text.match(metaRegex);
  if (match) {
    return {
      text: text.replace(metaRegex, '').trim(),
      confidence: parseFloat(match[1]),
      isFallback: match[2] === 'yes'
    };
  }
  return {
    text,
    confidence: 0.5,
    isFallback: false
  };
}

export const chatbot = {
  init: () => console.log('Chatbot initialized by Claude Code'),
  handle: async (message, history = []) => {
    const system = await buildSystemPrompt(message);
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages: [...history, { role: 'user', content: message }],
    });

    const rawText = response.content[0]?.text ?? '';
    const { text, confidence, isFallback } = stripMetaTag(rawText);

    return {
      reply: text,
      confidence,
      isFallback,
      usage: {
        input_tokens: response.usage?.input_tokens ?? 0,
        output_tokens: response.usage?.output_tokens ?? 0
      }
    };
  },
};
