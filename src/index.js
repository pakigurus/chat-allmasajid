import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes (to be built by Claude Code)
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  res.json({ reply: "Chatbot response — coming soon (Claude Code execution)" });
});

app.listen(PORT, () => {
  console.log(`Chat.allMasajid running on http://localhost:${PORT}`);
  console.log(`Execution: Claude Code (C4)`);
});
