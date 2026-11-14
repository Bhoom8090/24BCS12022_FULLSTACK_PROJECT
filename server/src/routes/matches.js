import { Router } from 'express';
import Match from '../models/Match.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/matches/me?page=1&limit=10&result=win|loss|draw
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { 'players.user': uid };
    if (req.query.result === 'win') filter.winner = uid;
    else if (req.query.result === 'loss') Object.assign(filter, { result: 'win', winner: { $ne: uid } });
    else if (req.query.result === 'draw') filter.result = 'draw';

    const [total, docs] = await Promise.all([
      Match.countDocuments(filter),
      Match.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);

    const matches = docs.map((m) => {
      const me = m.players.find((p) => String(p.user) === uid);
      const opp = m.players.find((p) => String(p.user) !== uid);
      const outcome = m.result === 'draw' ? 'draw' : String(m.winner) === uid ? 'win' : 'loss';
      return {
        id: m._id,
        outcome,
        symbol: me.symbol,
        opponent: opp.username,
        reason: m.reason,
        moves: m.moves.length,
        playedAt: m.createdAt,
      };
    });

    res.json({ matches, page, pages: Math.max(1, Math.ceil(total / limit)), total });
  })
);

export default router;
