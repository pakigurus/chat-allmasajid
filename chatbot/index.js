// Chatbot entry point (Claude Code)
// Wires the Claude API to the CAP-001-constrained system prompt.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(
  path.join(__dirname, '..', 'prompts', 'system.md'),
  'utf-8'
);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const chatbot = {
  init: () => console.log('Chatbot initialized by Claude Code'),
  handle: async (message, history = []) => {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: 'user', content: message }],
    });
    return response.content[0]?.text ?? '';
  },
};
