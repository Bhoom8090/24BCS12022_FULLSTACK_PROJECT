import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import Logo from '../components/Logo.jsx';
import StatsPanel from '../components/StatsPanel.jsx';

export default function Lobby() {
  const { user } = useAuth();
  const g = useGame();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const inMatch = g.game?.status === 'playing';

  return (
    <main className="page lobby">
      <Logo />
      <div className="lobby-grid">
        <section className="panel">
          <h2 className="panel-title">Your stats</h2>
          <StatsPanel user={user} />
        </section>

        <section className="panel play-panel">
          <h2 className="panel-title">Hi, {user.username}</h2>
          {user.isGuest && (
            <p className="hint guest-note">
              Guest account: your record is deleted after 7 days and you won't show on the leaderboard.
              Log out and register for a permanent account.
            </p>
          )}

          {inMatch ? (
            <>
              <p>You have a match in progress against <b>{g.game.opponent.username}</b>.</p>
              <button className="btn btn-green btn-lg" onClick={() => navigate('/game')}>Return to match</button>
            </>
          ) : g.phase === 'queue' ? (
            <div className="waiting">
              <div className="spinner" />
              <p>Looking for an opponent...</p>
              <button className="btn btn-red" onClick={g.leaveQueue}>Cancel</button>
            </div>
          ) : g.phase === 'room' ? (
            <div className="waiting">
              <p>Share this code with your friend</p>
              <div className="room-code outline">{g.roomCode}</div>
              <p className="hint">Waiting for them to join...</p>
              <button className="btn btn-red" onClick={g.cancelRoom}>Cancel</button>
            </div>
          ) : (
            <>
              <button className="btn btn-green btn-lg" onClick={g.joinQueue}>Play online</button>
              <button className="btn btn-blue btn-lg" onClick={g.createRoom}>Create private room</button>
              <form
                className="join-row"
                onSubmit={(e) => { e.preventDefault(); if (code.trim()) g.joinRoom(code); }}
              >
                <input
                  className="input" placeholder="Room code" value={code} maxLength={5}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button className="btn btn-blue" disabled={!code.trim()}>Join</button>
              </form>
              <button className="btn btn-ghost" onClick={() => navigate('/practice')}>Practice vs bot</button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
