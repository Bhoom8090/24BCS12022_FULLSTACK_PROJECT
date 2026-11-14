import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();
const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const GUEST_DAYS = 7;
const guestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

function validate(username, password) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username.trim()))
    throw new HttpError(400, 'Username must be 3-16 characters: letters, numbers or _');
  if (typeof password !== 'string' || password.length < 6 || password.length > 72)
    throw new HttpError(400, 'Password must be 6-72 characters');
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    validate(username, password);
    const name = username.trim();
    if (/^guest_/i.test(name)) throw new HttpError(400, 'Usernames starting with "Guest_" are reserved');
    if (await User.findOne({ usernameLower: name.toLowerCase() }))
      throw new HttpError(409, 'Username already taken');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: name, usernameLower: name.toLowerCase(), passwordHash });
    res.status(201).json({ token: signToken(user.id), user: user.toPublic() });
  })
);

router.post(
  '/guest',
  guestLimiter,
  asyncHandler(async (req, res) => {
    let user = null;
    for (let i = 0; i < 5 && !user; i++) {
      const name = `Guest_${Math.floor(10000 + Math.random() * 90000)}`;
      try {
        user = await User.create({
          username: name,
          usernameLower: name.toLowerCase(),
          isGuest: true,
          expiresAt: new Date(Date.now() + GUEST_DAYS * 24 * 60 * 60 * 1000),
        });
      } catch (err) {
        if (err.code !== 11000) throw err; // name collision, try another
      }
    }
    if (!user) throw new HttpError(503, 'Could not create a guest, try again');
    res.status(201).json({ token: signToken(user.id, `${GUEST_DAYS}d`), user: user.toPublic() });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string')
      throw new HttpError(400, 'Username and password are required');
    const user = await User.findOne({ usernameLower: username.trim().toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
      throw new HttpError(401, 'Invalid username or password');
    res.json({ token: signToken(user.id), user: user.toPublic() });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    res.json({ user: user.toPublic() });
  })
);

export default router;
