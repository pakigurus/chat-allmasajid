# chat.allmasajid.com

**System:** Claude Code (C4) — Autonomous AI-driven development
**Do NOT mix with:** ChatGPT/Codex workflows

Public chatbot for allMasajid visitors. Covers prayer times, Quran study, masjid directory, and community resources.

## Quick Start

```bash
npm install
npm run dev
```

## Setup Prerequisites (Before Running)

### 1. Anthropic API Key
```bash
# Add to .env:
ANTHROPIC_API_KEY=sk-<your-key-here>
```
Get key from: https://console.anthropic.com/keys

### 2. Ingest Knowledge Base
```bash
npm run ingest
```
This embeds CAP-001 into knowledge_vectors table. Chat will fail until this runs.

### 3. SendGrid + Twilio (Optional, for production)
```bash
# Add to .env:
SENDGRID_API_KEY=<key>
SENDGRID_FROM_EMAIL=support@allmasajid.com
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_PHONE_NUMBER=+1234567890
```
Dev mode uses console logging if keys missing.

### 4. Start & Test
```bash
npm start
# Server runs on http://localhost:3000
# /api/chat — Claude-powered chat (needs API key)
# /api/leads — Capture unhandled queries (works immediately)
```

## Architecture

- **Frontend**: Next.js + React
- **Backend**: Node.js (Express/Fastify) + PostgreSQL
- **Intelligence**: Claude API (Sonnet 4.6) + RAG (pgvector)
- **Execution**: Claude Code (C4)
- **Source of Truth**: CAP-001_allmasajid_bot_source_of_truth.md

## Setup

1. Copy `.env.template` to `.env` and fill values
2. `npm install`
3. `npm run setup` — initializes PostgreSQL schema
4. `npm run dev` — local development
5. `npm run build && npm start` — production

## Development (Claude Code)

This project is developed by Claude Code. All git commits, deployments, and major decisions require MK approval at production gates.

**Do NOT touch this project with ChatGPT/Codex.** Separate workspace boundary maintained.

## Knowledge Pipeline

- Ingests CAP-001 (scope/constraints)
- Connects to allMasajid Laravel backend (api.allmasajid.net)
- Embeds + vectorizes knowledge (pgvector)
- Serves via Claude API with RAG fallback

## Fallback System

If chatbot is unsure:
1. Prompt user for contact (email/phone/WhatsApp)
2. Verify at least one via OTP
3. Route to support (email + SMS + dashboard queue)

## Deployment

- Frontend: Vercel / Netlify
- Backend: Heroku / Contabo / self-hosted
- Database: AWS RDS / DigitalOcean managed / self-hosted

## Team & Execution

- **MK** (Founder, Product, Approval Gates)
- **Claude Code** (Autonomous Development, C4 Execution)
