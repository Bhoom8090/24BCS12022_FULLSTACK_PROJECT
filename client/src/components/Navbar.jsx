import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import Logo from './Logo.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { online, connected } = useGame();
  return (
    <header className="nav">
      <NavLink to="/" className="nav-logo"><Logo size="sm" /></NavLink>
      <nav className="nav-links">
        <NavLink to="/" end>Play</NavLink>
        <NavLink to="/practice">Practice</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </nav>
      <div className="nav-user">
        <span className={`dot ${connected ? 'on' : 'off'}`} title={connected ? 'Connected' : 'Reconnecting...'} />
        <span className="nav-online">{online} online</span>
        <span className="chip">
          {user.username}
          {user.isGuest && <span className="guest-tag">guest</span>}
          {user.currentStreak > 1 && <b className="streak"> 🔥{user.currentStreak}</b>}
        </span>
        <button className="btn btn-red btn-sm" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
