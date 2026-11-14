import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import userRoutes from './routes/users.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { initSockets } from './sockets/gameSocket.js';

const {
  PORT = 5000,
  MONGO_URI,
  JWT_SECRET,
  CLIENT_URL = 'http://localhost:5173',
  NODE_ENV,
} = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET in server/.env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

if (NODE_ENV === 'production') {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

initSockets(server, CLIENT_URL);

connectDB(MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Server running on :${PORT}`)))
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
