import express from 'express';
import { getUserBadges, getUserPoints } from '../../badges/engine.js';

const router = express.Router();

router.get('/api/user/:user_id/badges', async (req, res) => {
  const { user_id } = req.params;
  const badges = await getUserBadges(parseInt(user_id));
  res.json({ badges });
});

router.get('/api/user/:user_id/points', async (req, res) => {
  const { user_id } = req.params;
  const points = await getUserPoints(parseInt(user_id));
  res.json({ points });
});

export default router;
