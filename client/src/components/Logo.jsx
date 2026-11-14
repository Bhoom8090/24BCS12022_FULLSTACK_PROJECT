const COLORS = ['#ff4d5a', '#ffd93b', '#54c600', '#3f9be8', '#a05cff', '#ff7ab6', '#ffd93b', '#54c600', '#3f9be8'];

export default function Logo({ size = 'lg' }) {
  return (
    <div className={`logo logo-${size} outline`} role="img" aria-label="tictac.io">
      {'tictac.io'.split('').map((ch, i) => (
        <span key={i} style={{ color: COLORS[i % COLORS.length] }}>{ch}</span>
      ))}
    </div>
  );
}
