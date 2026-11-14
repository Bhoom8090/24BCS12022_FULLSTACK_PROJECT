export default function StatsPanel({ user }) {
  const items = [
    ['Wins', user.wins, 'green'],
    ['Losses', user.losses, 'red'],
    ['Draws', user.draws, 'blue'],
    ['Win rate', `${user.winRate}%`, 'purple'],
    ['Win streak', user.currentStreak, 'yellow'],
    ['Best streak', user.bestStreak, 'pink'],
  ];
  return (
    <div className="stats">
      {items.map(([label, value, color]) => (
        <div className="stat" key={label}>
          <span className={`stat-dot ${color}`} />
          <div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
