-- Badge definitions (seed data)

INSERT INTO badges (name, description, badge_type, tier, points_reward, rule) VALUES
  ('Conversationalist', 'Asked 10 questions', 'interaction', 'bronze', 10, '{"metric":"chat_events","op":"gte","threshold":10}'),
  ('Enthusiast', 'Asked 50 questions', 'interaction', 'silver', 25, '{"metric":"chat_events","op":"gte","threshold":50}'),
  ('Expert', 'Asked 100 questions', 'interaction', 'gold', 50, '{"metric":"chat_events","op":"gte","threshold":100}'),
  ('Guru', 'Asked 500 questions', 'interaction', 'platinum', 100, '{"metric":"chat_events","op":"gte","threshold":500}'),
  ('Prayer Expert', 'Asked 5 prayer-related questions', 'topic', 'gold', 30, '{"metric":"prayer_queries","op":"gte","threshold":5}'),
  ('Scholar', 'Asked 5 Quran study questions', 'topic', 'gold', 30, '{"metric":"quran_queries","op":"gte","threshold":5}'),
  ('Community Builder', 'Asked 5 community questions', 'topic', 'gold', 30, '{"metric":"community_queries","op":"gte","threshold":5}'),
  ('Trusted Member', 'Verified email address', 'verification', 'bronze', 15, '{"conditions":["email_verified"]}'),
  ('Verified Member', 'Verified both email and phone', 'verification', 'silver', 30, '{"conditions":["email_verified","phone_verified"]}'),
  ('Advocate', 'Referred 3 friends', 'referral', 'silver', 20, '{"metric":"referrals","op":"gte","threshold":3}'),
  ('Ambassador', 'Referred 10 friends', 'referral', 'gold', 50, '{"metric":"referrals","op":"gte","threshold":10}'),
  ('Brand Champion', 'Referred 50 friends', 'referral', 'platinum', 100, '{"metric":"referrals","op":"gte","threshold":50}'),
  ('Influencer', 'Shared on social media (5+ times)', 'social', 'silver', 25, '{"metric":"social_shares","op":"gte","threshold":5}'),
  ('YouTuber', 'Subscribed to YouTube channel', 'social', 'bronze', 10, '{"action":"youtube_subscribe"}')
ON CONFLICT (name) DO NOTHING;
