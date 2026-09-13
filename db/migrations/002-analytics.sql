-- Analytics schema for chat.allmasajid.com (Phase 2A)
-- Tracks all user interactions, sessions, and fallback events

-- Sessions (identify unique user journeys)
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT,
  device_info JSONB,
  geo_data JSONB,
  source VARCHAR(100),
  referrer VARCHAR(500),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INT,
  interaction_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_created_at ON analytics_sessions(created_at);

-- Chat interactions (every query + response)
CREATE TABLE IF NOT EXISTS analytics_chat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analytics_sessions(id),
  user_id INT,
  query TEXT,
  response TEXT,
  confidence_score FLOAT,
  is_fallback BOOLEAN DEFAULT false,
  tokens_used INT,
  model VARCHAR(100),
  retrieval_top_similarity FLOAT,
  retrieved_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_chat_events_session_id ON analytics_chat_events(session_id);
CREATE INDEX idx_analytics_chat_events_created_at ON analytics_chat_events(created_at);
CREATE INDEX idx_analytics_chat_events_fallback ON analytics_chat_events(is_fallback);

-- Fallback triggers (when CB couldn't answer confidently)
CREATE TABLE IF NOT EXISTS analytics_fallback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analytics_sessions(id),
  chat_event_id UUID REFERENCES analytics_chat_events(id),
  lead_id INT REFERENCES leads(id),
  query TEXT,
  confidence_score FLOAT,
  fallback_reason VARCHAR(100),
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_fallback_events_session_id ON analytics_fallback_events(session_id);
CREATE INDEX idx_analytics_fallback_events_created_at ON analytics_fallback_events(triggered_at);

-- OTP verification tracking
CREATE TABLE IF NOT EXISTS analytics_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INT NOT NULL REFERENCES leads(id),
  session_id UUID REFERENCES analytics_sessions(id),
  method VARCHAR(50),
  attempts INT,
  success BOOLEAN,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_verification_events_lead_id ON analytics_verification_events(lead_id);
CREATE INDEX idx_analytics_verification_events_created_at ON analytics_verification_events(created_at);

-- Conversions (leads that completed verification)
CREATE TABLE IF NOT EXISTS analytics_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id INT NOT NULL REFERENCES leads(id),
  channel VARCHAR(50),
  conversion_value VARCHAR(255),
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_conversions_lead_id ON analytics_conversions(lead_id);
CREATE INDEX idx_analytics_conversions_created_at ON analytics_conversions(created_at);

-- Generic events (clickthrough, link clicks, recommendations)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analytics_sessions(id),
  event_type VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
