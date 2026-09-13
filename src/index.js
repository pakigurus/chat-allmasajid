import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatbot } from '../chatbot/index.js';
import { createLead, routeToSupport } from '../leads/routing.js';
import { verifyOtp } from '../leads/otp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const reply = await chatbot.handle(message, history);
    res.json({ reply });
  } catch (err) {
    console.error('chatbot.handle failed:', err);
    res.status(502).json({ error: 'Chat service unavailable' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const result = await createLead(req.body);
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
  const routed = await routeToSupport(req.params.id);
  res.json({ ...result, ...routed });
});

app.listen(PORT, () => {
  console.log(`Chat.allMasajid running on http://localhost:${PORT}`);
  console.log(`Execution: Claude Code (C4)`);
});
