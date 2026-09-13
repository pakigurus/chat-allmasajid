# chat.allmasajid.com

**System:** Claude Code (C4) — Autonomous AI-driven development
**Do NOT mix with:** ChatGPT/Codex workflows

Public chatbot for allMasajid visitors. Covers prayer times, Quran study, masjid directory, and community resources.

## Quick Start

```bash
npm install
npm run dev
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
