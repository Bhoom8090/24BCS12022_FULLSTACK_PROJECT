import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import User from '../models/User.js';
import { calculateWinner } from '../utils/gameLogic.js';
import { recordMatch } from '../services/matchService.js';

const GRACE_MS = 15000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const queue = [];             // [{ userId, username, socketId }]
const rooms = new Map();      // code -> player
const games = new Map();      // gameId -> game
const userGame = new Map();   // userId -> gameId

const other = (s) => (s === 'X' ? 'O' : 'X');

export function initSockets(httpServer, clientUrl) {
  const io = new Server(httpServer, { cors: { origin: clientUrl, credentials: true } });

  const emitTo = (p, event, payload) => io.to(p.socketId).emit(event, payload);
  const both = (game, event, payload) => ['X', 'O'].forEach((s) => emitTo(game.players[s], event, payload));
  const broadcastOnline = () => io.emit('online:count', io.of('/').sockets.size);

  const snapshot = (game, sym) => ({
    gameId: game.id,
    symbol: sym,
    opponent: { username: game.players[other(sym)].username },
    board: game.board,
    turn: game.turn,
    opponentConnected: !game.timers[other(sym)],
  });

  function cancelPending(userId) {
    for (let i = queue.length - 1; i >= 0; i--) if (queue[i].userId === userId) queue.splice(i, 1);
    for (const [code, p] of rooms) if (p.userId === userId) rooms.delete(code);
  }

  function startGame(p1, p2) {
    const [X, O] = Math.random() < 0.5 ? [p1, p2] : [p2, p1];
    const game = { id: randomUUID(), players: { X, O }, board: Array(9).fill(null), turn: 'X', moves: [], timers: {}, over: false };
    games.set(game.id, game);
    userGame.set(X.userId, game.id);
    userGame.set(O.userId, game.id);
    ['X', 'O'].forEach((s) => emitTo(game.players[s], 'game:start', snapshot(game, s)));
  }

  async function endGame(game, winnerSymbol, reason, line = null) {
    if (game.over) return;
    game.over = true;
    Object.values(game.timers).forEach(clearTimeout);
    ['X', 'O'].forEach((s) => userGame.delete(game.players[s].userId));
    games.delete(game.id);

    let users = {};
    try {
      users = await recordMatch(game, winnerSymbol, reason);
    } catch (err) {
      console.error('Failed to record match', err);
    }
    ['X', 'O'].forEach((s) =>
      emitTo(game.players[s], 'game:over', {
        winner: winnerSymbol,
        line,
        reason,
        board: game.board,
        stats: users[s] ? users[s].toPublic() : null,
      })
    );
  }

  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(id).select('username');
      if (!user) return next(new Error('Unauthorized'));
      socket.data.user = { id: user.id, username: user.username };
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const me = socket.data.user;
    const asPlayer = () => ({ userId: me.id, username: me.username, socketId: socket.id });
    const myGame = () => games.get(userGame.get(me.id));
    const mySymbol = (game) => ['X', 'O'].find((s) => game.players[s].userId === me.id);
    const notice = (msg) => socket.emit('notice', msg);

    broadcastOnline();

    // Resume a running game (page refresh / second tab)
    const running = myGame();
    if (running) {
      const sym = mySymbol(running);
      clearTimeout(running.timers[sym]);
      delete running.timers[sym];
      running.players[sym].socketId = socket.id;
      socket.emit('game:start', snapshot(running, sym));
      emitTo(running.players[other(sym)], 'opponent:status', { connected: true });
    }

    const canStart = () => {
      if (userGame.has(me.id)) {
        notice('You are already in a match');
        return false;
      }
      cancelPending(me.id);
      return true;
    };

    socket.on('queue:join', () => {
      if (!canStart()) return;
      const idx = queue.findIndex((p) => p.userId !== me.id);
      if (idx >= 0) {
        const [opp] = queue.splice(idx, 1);
        startGame(opp, asPlayer());
      } else {
        queue.push(asPlayer());
        socket.emit('queue:waiting');
      }
    });

    socket.on('room:create', () => {
      if (!canStart()) return;
      let code;
      do {
        code = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
      } while (rooms.has(code));
      rooms.set(code, asPlayer());
      socket.emit('room:created', { code });
    });

    socket.on('room:join', ({ code } = {}) => {
      if (!canStart()) return;
      const key = String(code || '').trim().toUpperCase();
      const host = rooms.get(key);
      if (!host) return notice('Room not found');
      if (host.userId === me.id) return notice("You can't join your own room");
      rooms.delete(key);
      startGame(host, asPlayer());
    });

    const cancel = () => {
      cancelPending(me.id);
      socket.emit('pending:cancelled');
    };
    socket.on('queue:leave', cancel);
    socket.on('room:cancel', cancel);

    socket.on('game:move', ({ index } = {}) => {
      const game = myGame();
      if (!game || game.over) return;
      const sym = mySymbol(game);
      if (game.turn !== sym) return notice('Not your turn');
      if (!Number.isInteger(index) || index < 0 || index > 8 || game.board[index]) return;

      game.board[index] = sym;
      game.moves.push({ symbol: sym, index });

      const res = calculateWinner(game.board);
      if (res) return endGame(game, res.winner, 'normal', res.line);
      if (game.board.every(Boolean)) return endGame(game, null, 'normal');

      game.turn = other(sym);
      both(game, 'game:update', { board: game.board, turn: game.turn });
    });

    socket.on('game:leave', () => {
      const game = myGame();
      if (game) endGame(game, other(mySymbol(game)), 'forfeit');
    });

    socket.on('disconnect', () => {
      cancelPending(me.id);
      setTimeout(broadcastOnline, 200);
      const game = myGame();
      if (!game || game.over) return;
      const sym = mySymbol(game);
      if (game.players[sym].socketId !== socket.id) return; // another tab took over
      emitTo(game.players[other(sym)], 'opponent:status', { connected: false });
      game.timers[sym] = setTimeout(() => endGame(game, other(sym), 'forfeit'), GRACE_MS);
    });
  });

  return io;
}
