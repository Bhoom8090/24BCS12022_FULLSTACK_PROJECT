import { useEffect, useState } from 'react';
import Board from '../components/Board.jsx';
import { botMove, calculateWinner } from '../utils/gameLogic.js';

const HUMAN = 'X';
const BOT = 'O';
const empty = () => Array(9).fill(null);

export default function Practice() {
  const [board, setBoard] = useState(empty);
  const [level, setLevel] = useState('hard');
  const [score, setScore] = useState({ you: 0, bot: 0, draws: 0 });

  const res = calculateWinner(board);
  const full = board.every(Boolean);
  const over = !!res || full;
  const botTurn = !over && board.filter(Boolean).length % 2 === 1;

  useEffect(() => {
    if (!botTurn) return undefined;
    const t = setTimeout(() => {
      setBoard((b) => {
        const next = b.slice();
        next[botMove(b, BOT, level)] = BOT;
        return next;
      });
    }, 450);
    return () => clearTimeout(t);
  }, [botTurn, level]);

  useEffect(() => {
    if (!over) return;
    setScore((s) => (res ? (res.winner === HUMAN ? { ...s, you: s.you + 1 } : { ...s, bot: s.bot + 1 }) : { ...s, draws: s.draws + 1 }));
  }, [over]);

  const play = (i) => {
    if (over || botTurn || board[i]) return;
    const next = board.slice();
    next[i] = HUMAN;
    setBoard(next);
  };

  return (
    <main className="page game">
      <h2 className="page-title outline">Practice</h2>
      <div className="tabs tabs-inline">
        {['easy', 'hard'].map((l) => (
          <button key={l} className={level === l ? 'active' : ''} onClick={() => { setLevel(l); setBoard(empty()); }}>
            {l === 'easy' ? 'Easy' : 'Hard'}
          </button>
        ))}
      </div>
      <p className="status">
        {over
          ? res ? (res.winner === HUMAN ? 'You won!' : 'The bot won') : "It's a draw"
          : botTurn ? 'Bot is thinking...' : 'Your turn'}
      </p>
      <Board board={board} onPlay={play} disabled={over || botTurn} winLine={res?.line || []} ghost={HUMAN} />
      <p className="hint">You {score.you} · Bot {score.bot} · Draws {score.draws} (practice games are not saved)</p>
      <button className="btn btn-green" onClick={() => setBoard(empty())}>{over ? 'Play again' : 'Restart'}</button>
    </main>
  );
}
