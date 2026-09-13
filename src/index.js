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

// CORS configuration for WordPress widget embedding
const allowedOrigins = [
  'https://www.allmasajid.com',
  'https://allmasajid.com',
  'https://stage.allmasajid.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

app.use(express.json());

// CSP header for iframe embedding
app.use((req, res, next) => {
  res.set('Content-Security-Policy', "frame-ancestors 'self' https://www.allmasajid.com https://allmasajid.com https://stage.allmasajid.com");
  next();
});

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

// Health check for Docker HEALTHCHECK
app.get('/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

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

// Standalone embed page for iframe
app.get('/embed', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat.allMasajid</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    #chat-container { max-width: 100%; height: 100vh; display: flex; flex-direction: column; }
    #messages { flex: 1; overflow-y: auto; padding: 20px; }
    .message { margin-bottom: 15px; padding: 12px 16px; border-radius: 8px; max-width: 85%; }
    .message.user { background: #007bff; color: white; margin-left: auto; }
    .message.assistant { background: #e9ecef; color: #333; }
    #input-area { padding: 20px; background: white; border-top: 1px solid #ddd; display: flex; gap: 10px; }
    #message-input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    #send-btn { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
    #send-btn:hover { background: #0056b3; }
  </style>
</head>
<body>
  <div id="chat-container">
    <div id="messages"></div>
    <div id="input-area">
      <input type="text" id="message-input" placeholder="Ask about prayer times, Quran, or community..." />
      <button id="send-btn">Send</button>
    </div>
  </div>

  <script>
    const messagesDiv = document.getElementById('messages');
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const sessionId = new URLSearchParams(window.location.search).get('sid') ||
                     sessionStorage.getItem('chat_session_id') ||
                     '${randomUUID()}';

    sessionStorage.setItem('chat_session_id', sessionId);

    function addMessage(text, isUser) {
      const div = document.createElement('div');
      div.className = 'message ' + (isUser ? 'user' : 'assistant');
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, true);
      input.value = '';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, session_id: sessionId })
        });
        const data = await response.json();
        addMessage(data.reply || 'No response', false);
      } catch (err) {
        addMessage('Error: ' + err.message, false);
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    addMessage('Hello! How can I help you today?', false);
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`Chat.allMasajid running on http://localhost:${PORT}`);
  console.log(`Execution: Claude Code (C4)`);
});
