import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http.js';

export const signToken = (id, expiresIn = process.env.JWT_EXPIRES_IN || '7d') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Not authenticated'));
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
