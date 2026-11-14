import { useMemo } from 'react';

const rand = (a, b) => a + Math.random() * (b - a);

function makeBoard() {
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
  const cells = Array(9).fill(null);
  let mark = Math.random() < 0.5 ? 'X' : 'O';
  const count = Math.floor(rand(3, 7));
  for (let i = 0; i < count; i++) {
    cells[order[i]] = mark;
    mark = mark === 'X' ? 'O' : 'X';
  }
  return {
    cells,
    size: rand(80, 170),
    left: rand(-2, 94),
    top: rand(-2, 92),
    r: rand(-18, 18),
    r2: rand(-18, 18),
    dx: rand(-60, 60),
    dy: rand(-60, 60),
    dur: rand(16, 32),
  };
}

export default function BoardsBg({ count = 14 }) {
  const boards = useMemo(() => Array.from({ length: count }, makeBoard), [count]);
  return (
    <div className="boards-bg" aria-hidden="true">
      {boards.map((b, i) => (
        <div
          key={i}
          className="mini"
          style={{
            width: b.size, height: b.size, left: `${b.left}%`, top: `${b.top}%`, fontSize: b.size * 0.14,
            '--r': `${b.r}deg`, '--r2': `${b.r2}deg`, '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--d': `${b.dur}s`,
          }}
        >
          {b.cells.map((c, j) => (
            <span className="mini-cell" key={j}>
              {c && <span className={`mini-piece ${c}`}>{c}</span>}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
