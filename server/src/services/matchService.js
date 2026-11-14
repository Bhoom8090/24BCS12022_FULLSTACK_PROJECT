import Match from '../models/Match.js';
import User from '../models/User.js';

// stat updates run as one atomic pipeline update (needs MongoDB 4.2+)
const PIPELINES = {
  win: [
    { $set: { wins: { $add: ['$wins', 1] }, currentStreak: { $add: ['$currentStreak', 1] } } },
    { $set: { bestStreak: { $max: ['$bestStreak', '$currentStreak'] } } },
  ],
  loss: [{ $set: { losses: { $add: ['$losses', 1] }, currentStreak: 0 } }],
  draw: [{ $set: { draws: { $add: ['$draws', 1] } } }],
};

const applyOutcome = (userId, outcome) =>
  User.findByIdAndUpdate(userId, PIPELINES[outcome], { new: true, timestamps: false });

export async function recordMatch(game, winnerSymbol, reason) {
  const { X, O } = game.players;
  await Match.create({
    players: [
      { user: X.userId, username: X.username, symbol: 'X' },
      { user: O.userId, username: O.username, symbol: 'O' },
    ],
    winner: winnerSymbol ? game.players[winnerSymbol].userId : null,
    result: winnerSymbol ? 'win' : 'draw',
    reason,
    moves: game.moves,
  });

  const outcomeFor = (sym) => (!winnerSymbol ? 'draw' : winnerSymbol === sym ? 'win' : 'loss');
  const [x, o] = await Promise.all([
    applyOutcome(X.userId, outcomeFor('X')),
    applyOutcome(O.userId, outcomeFor('O')),
  ]);
  return { X: x, O: o };
}
