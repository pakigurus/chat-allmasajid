-- chat.allmasajid.com — database schema (Claude Code)
-- Applied by scripts/setup-db.js via `npm run setup`

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chats_session ON chats(session_id);

CREATE TABLE IF NOT EXISTS knowledge_vectors (
  id SERIAL PRIMARY KEY,
  source VARCHAR(255) NOT NULL,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, chunk_index)
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  session_id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  contact_method VARCHAR(20) CHECK (contact_method IN ('email', 'phone', 'whatsapp')),
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  query_summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'routed', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  session_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
