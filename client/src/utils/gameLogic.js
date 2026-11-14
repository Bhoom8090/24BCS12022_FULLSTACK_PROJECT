const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function calculateWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return null;
}

const other = (s) => (s === 'X' ? 'O' : 'X');

function score(board, turn, bot) {
  const r = calculateWinner(board);
  if (r) return r.winner === bot ? 10 : -10;
  if (board.every(Boolean)) return 0;
  let best = turn === bot ? -Infinity : Infinity;
  board.forEach((cell, i) => {
    if (cell) return;
    const next = board.slice();
    next[i] = turn;
    const s = score(next, other(turn), bot);
    best = turn === bot ? Math.max(best, s) : Math.min(best, s);
  });
  return best;
}

export function botMove(board, bot, level = 'hard') {
  const empty = board.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  if (level === 'easy' && Math.random() < 0.7) return empty[Math.floor(Math.random() * empty.length)];
  let best = -Infinity;
  let picks = [];
  for (const i of empty) {
    const next = board.slice();
    next[i] = bot;
    const s = score(next, other(bot), bot);
    if (s > best) { best = s; picks = [i]; } else if (s === best) picks.push(i);
  }
  return picks[Math.floor(Math.random() * picks.length)];
}
