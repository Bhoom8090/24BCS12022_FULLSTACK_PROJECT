import { useMemo } from 'react';

const COLORS = ['#ff4d5a', '#3f9be8', '#54c600', '#ffd93b', '#a05cff', '#ff7ab6', '#27c4b8'];
const rand = (a, b) => a + Math.random() * (b - a);

export default function Blobs({ count = 18 }) {
  const blobs = useMemo(
    () => Array.from({ length: count }, () => ({
      size: rand(36, 190),
      left: rand(-3, 97),
      top: rand(-3, 97),
      color: COLORS[Math.floor(rand(0, COLORS.length))],
      dur: rand(14, 30),
      dx: rand(-70, 70),
      dy: rand(-70, 70),
    })),
    [count]
  );
  return (
    <div className="blobs" aria-hidden="true">
      {blobs.map((b, i) => (
        <span
          key={i}
          className="blob"
          style={{
            width: b.size, height: b.size, left: `${b.left}%`, top: `${b.top}%`,
            background: b.color, '--d': `${b.dur}s`, '--dx': `${b.dx}px`, '--dy': `${b.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
