-- Badge system schema (Phase 2B)

-- Badge definitions
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description VARCHAR(500),
  badge_type VARCHAR(50),
  icon_url VARCHAR(500),
  tier VARCHAR(50),
  points_reward INT DEFAULT 0,
  rule JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_badges_type ON badges(badge_type);

-- User badges (which users earned which badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  badge_id INT NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visibility VARCHAR(50) DEFAULT 'private',
  UNIQUE(user_id, badge_id)
);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- Social actions (track sharing + referrals)
CREATE TABLE IF NOT EXISTS social_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  action_type VARCHAR(100),
  action_data JSONB,
  social_platform VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_social_actions_user_id ON social_actions(user_id);
CREATE INDEX idx_social_actions_platform ON social_actions(social_platform);

-- Points ledger
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  points INT,
  reason VARCHAR(255),
  related_badge_id INT REFERENCES badges(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description VARCHAR(500),
  points_cost INT,
  reward_type VARCHAR(50),
  reward_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
