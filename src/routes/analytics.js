import express from 'express';
import {
  startSession,
  recordChatEvent,
  recordFallbackEvent,
  recordVerificationEvent,
  recordConversion,
  recordEvent
} from '../../analytics/track.js';

const router = express.Router();

router.post('/api/analytics/session-start', async (req, res) => {
  const { device_info, geo_data, source, referrer } = req.body;
  const sessionId = await startSession(device_info, geo_data, source, referrer);
  res.json({ session_id: sessionId });
});

router.post('/api/analytics/chat-event', async (req, res) => {
  const { session_id, user_id, query, response, confidence_score, is_fallback, tokens_used, model } = req.body;
  await recordChatEvent(session_id, user_id, query, response, confidence_score, is_fallback, tokens_used, model);
  res.json({ ok: true });
});

router.post('/api/analytics/fallback', async (req, res) => {
  const { session_id, chat_event_id, lead_id, query, confidence_score, reason } = req.body;
  await recordFallbackEvent(session_id, chat_event_id, lead_id, query, confidence_score, reason);
  res.json({ ok: true });
});

router.post('/api/analytics/verification', async (req, res) => {
  const { lead_id, session_id, method, success } = req.body;
  await recordVerificationEvent(lead_id, session_id, method, success);
  res.json({ ok: true });
});

router.post('/api/analytics/conversion', async (req, res) => {
  const { lead_id, channel, conversion_value } = req.body;
  await recordConversion(lead_id, channel, conversion_value);
  res.json({ ok: true });
});

router.post('/api/analytics/event', async (req, res) => {
  const { session_id, event_type, event_data } = req.body;
  await recordEvent(session_id, event_type, event_data);
  res.json({ ok: true });
});

export default router;
