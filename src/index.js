import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { chatbot } from '../chatbot/index.js';
import { createLead, routeToSupport } from '../leads/routing.js';
import { verifyOtp } from '../leads/otp.js';
import analyticsRouter from './routes/analytics.js';
import badgesRouter from './routes/badges.js';
import { recordChatEvent, recordFallbackEvent, recordConversion } from '../analytics/track.js';
import { evaluateAndAwardBadges } from '../badges/engine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Session tracking middleware
app.use((req, res, next) => {
  const sessionId = req.headers['x-session-id'] || randomUUID();
  req.sessionId = sessionId;
  res.set('X-Session-Id', sessionId);
  next();
});

// Mount analytics and badges routes
app.use(analyticsRouter);
app.use(badgesRouter);

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const result = await chatbot.handle(message, history);
    const { reply, confidence, isFallback, usage } = result;

    // Track chat event
    await recordChatEvent(
      req.sessionId,
      req.body.user_id || null,
      message,
      reply,
      confidence,
      isFallback,
      (usage.input_tokens + usage.output_tokens) || 0,
      process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
    );

    // Check if should trigger fallback (low confidence)
    if (isFallback || confidence < 0.5) {
      await recordFallbackEvent(
        req.sessionId,
        null,
        req.body.user_id || null,
        message,
        confidence,
        'low_confidence'
      );
    }

    // Evaluate badges
    const newBadges = await evaluateAndAwardBadges(req.body.user_id || null, 'chat_event', { query: message });

    res.json({
      reply,
      session_id: req.sessionId,
      confidence,
      should_fallback: isFallback || confidence < 0.5,
      badges_earned: newBadges
    });
  } catch (err) {
    console.error('chatbot.handle failed:', err);
    res.status(502).json({ error: 'Chat service unavailable' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const result = await createLead(req.body);

    // Track fallback event
    if (result.leadId) {
      await recordFallbackEvent(
        req.sessionId,
        null,
        result.leadId,
        req.body.query || 'unknown',
        0.3,
        'fallback_lead_created'
      );
    }

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/leads/:id/verify', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  const result = await verifyOtp(req.params.id, code);
  if (!result.ok) return res.status(400).json(result);

  // Track conversion
  if (result.ok) {
    await recordConversion(
      parseInt(req.params.id),
      result.channel || 'unknown',
      `${result.status}_verified`
    );

    // Award "Verified Member" badge
    const badges = await evaluateAndAwardBadges(parseInt(req.params.id), 'verification', { verified: true });
    result.badges_earned = badges;
  }

  const routed = await routeToSupport(req.params.id);
  res.json({ ...result, ...routed });
});

app.listen(PORT, () => {
  console.log(`Chat.allMasajid running on http://localhost:${PORT}`);
  console.log(`Execution: Claude Code (C4)`);
});
