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

export async function startSession(deviceInfo, geoData, source, referrer) {
  try {
    const result = await pool.query(
      `INSERT INTO analytics_sessions (device_info, geo_data, source, referrer)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [deviceInfo || {}, geoData || {}, source, referrer]
    );
    return result.rows[0].id;
  } catch (err) {
    console.error('startSession failed:', err.message);
    return null;
  }
}

export async function recordChatEvent(sessionId, userId, query, response, confidenceScore, isFallback, tokensUsed, model) {
  try {
    await pool.query(
      `INSERT INTO analytics_chat_events
       (session_id, user_id, query, response, confidence_score, is_fallback, tokens_used, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, userId, query, response, confidenceScore, isFallback, tokensUsed, model]
    );
  } catch (err) {
    console.error('recordChatEvent failed:', err.message);
  }
}

export async function recordFallbackEvent(sessionId, chatEventId, leadId, query, confidenceScore, reason) {
  try {
    await pool.query(
      `INSERT INTO analytics_fallback_events
       (session_id, chat_event_id, lead_id, query, confidence_score, fallback_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [sessionId, chatEventId, leadId, query, confidenceScore, reason]
    );
  } catch (err) {
    console.error('recordFallbackEvent failed:', err.message);
  }
}

export async function recordVerificationEvent(leadId, sessionId, method, success) {
  try {
    await pool.query(
      `INSERT INTO analytics_verification_events
       (lead_id, session_id, method, success, verified_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [leadId, sessionId, method, success, success ? new Date() : null]
    );
  } catch (err) {
    console.error('recordVerificationEvent failed:', err.message);
  }
}

export async function recordConversion(leadId, channel, conversionValue) {
  try {
    await pool.query(
      `INSERT INTO analytics_conversions (lead_id, channel, conversion_value)
       VALUES ($1, $2, $3)`,
      [leadId, channel, conversionValue]
    );
  } catch (err) {
    console.error('recordConversion failed:', err.message);
  }
}

export async function recordEvent(sessionId, eventType, eventData) {
  try {
    await pool.query(
      `INSERT INTO analytics_events (session_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [sessionId, eventType, eventData || {}]
    );
  } catch (err) {
    console.error('recordEvent failed:', err.message);
  }
}
