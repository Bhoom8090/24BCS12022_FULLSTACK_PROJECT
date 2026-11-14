import { Router } from 'express';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/users/leaderboard?sort=wins|streak
router.get(
  '/leaderboard',
  asyncHandler(async (req, res) => {
    const sort = req.query.sort === 'streak' ? { bestStreak: -1, wins: -1 } : { wins: -1, losses: 1 };
    const users = await User.find({ isGuest: { $ne: true }, $or: [{ wins: { $gt: 0 } }, { losses: { $gt: 0 } }, { draws: { $gt: 0 } }] })
      .sort(sort)
      .limit(10);
    res.json({ users: users.map((u, i) => ({ rank: i + 1, ...u.toPublic() })) });
  })
);

router.get(
  '/:username',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ usernameLower: String(req.params.username).toLowerCase() });
    if (!user) throw new HttpError(404, 'Player not found');
    res.json({ user: user.toPublic() });
  })
);

export default router;
