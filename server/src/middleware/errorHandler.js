import { HttpError } from '../utils/http.js';

export const notFound = (req, res, next) =>
  next(new HttpError(404, `Route not found: ${req.originalUrl}`));

export function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    err.status = 409;
    err.message = 'Username already taken';
  }
  if (err.name === 'ValidationError') {
    err.status = 400;
    err.message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'CastError') {
    err.status = 400;
    err.message = 'Invalid id';
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
}
