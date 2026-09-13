import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'chat_allmasajid',
  user: process.env.POSTGRES_USER || 'chat_allmasajid',
  password: process.env.POSTGRES_PASS,
});

export async function evaluateAndAwardBadges(userId, eventType, eventData) {
  try {
    const badges = await pool.query('SELECT * FROM badges');
    const newBadges = [];

    for (const badge of badges.rows) {
      const rule = badge.rule;
      if (!rule) continue;

      const shouldAward = await evaluateRule(userId, badge.id, rule, eventType, eventData);
      if (shouldAward) {
        const result = await awardBadge(userId, badge.id);
        if (result) {
          newBadges.push({
            id: badge.id,
            name: badge.name,
            tier: badge.tier,
            points: badge.points_reward
          });

          if (badge.points_reward > 0) {
            await awardPoints(userId, badge.points_reward, `badge_earned: ${badge.name}`, badge.id);
          }
        }
      }
    }

    return newBadges;
  } catch (err) {
    console.error('evaluateAndAwardBadges failed:', err.message);
    return [];
  }
}

async function evaluateRule(userId, badgeId, rule, eventType, eventData) {
  try {
    // Interaction-based badges
    if (rule.metric === 'chat_events') {
      const result = await pool.query(
        'SELECT COUNT(*) as count FROM analytics_chat_events WHERE user_id = $1',
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    // Topic-based badges
    if (rule.metric === 'prayer_queries') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM analytics_chat_events
         WHERE user_id = $1 AND query ILIKE '%prayer%'`,
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    if (rule.metric === 'quran_queries') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM analytics_chat_events
         WHERE user_id = $1 AND query ILIKE '%quran%'`,
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    if (rule.metric === 'community_queries') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM analytics_chat_events
         WHERE user_id = $1 AND query ILIKE '%community%'`,
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    // Referral badges
    if (rule.metric === 'referrals') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM leads
         WHERE referred_by = $1 AND status = 'verified'`,
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    // Social sharing badges
    if (rule.metric === 'social_shares') {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM social_actions
         WHERE user_id = $1`,
        [userId]
      );
      const count = parseInt(result.rows[0].count);
      if (rule.op === 'gte' && count >= rule.threshold) {
        return true;
      }
    }

    // Verification-based badges
    if (rule.conditions) {
      const leadResult = await pool.query(
        `SELECT * FROM leads WHERE id = $1`,
        [userId]
      );
      if (leadResult.rows.length === 0) return false;

      const lead = leadResult.rows[0];
      const emailVerified = lead.verified && lead.contact_method === 'email';
      const phoneVerified = lead.verified && lead.contact_method === 'phone';

      let allMet = true;
      for (const condition of rule.conditions) {
        if (condition === 'email_verified' && !emailVerified) allMet = false;
        if (condition === 'phone_verified' && !phoneVerified) allMet = false;
      }
      return allMet;
    }

    return false;
  } catch (err) {
    console.error('evaluateRule failed:', err.message);
    return false;
  }
}

async function awardBadge(userId, badgeId) {
  try {
    const result = await pool.query(
      `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING id`,
      [userId, badgeId]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error('awardBadge failed:', err.message);
    return false;
  }
}

async function awardPoints(userId, points, reason, badgeId) {
  try {
    await pool.query(
      `INSERT INTO points_ledger (user_id, points, reason, related_badge_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, points, reason, badgeId]
    );
  } catch (err) {
    console.error('awardPoints failed:', err.message);
  }
}

export async function getUserBadges(userId) {
  try {
    const result = await pool.query(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('getUserBadges failed:', err.message);
    return [];
  }
}

export async function getUserPoints(userId) {
  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(points), 0) as total_points FROM points_ledger WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0].total_points;
  } catch (err) {
    console.error('getUserPoints failed:', err.message);
    return 0;
  }
}
