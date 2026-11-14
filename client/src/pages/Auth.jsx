import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api/api.js';
import Logo from '../components/Logo.jsx';

export default function Auth() {
  const { authenticate, playAsGuest } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authenticate(mode, username, password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const guest = async () => {
    setError('');
    setBusy(true);
    try {
      await playAsGuest();
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <Logo />
      <form className="panel auth-card" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>
        <input
          className="input" placeholder="Nick" value={username} maxLength={16} autoComplete="username"
          onChange={(e) => setUsername(e.target.value)} required
        />
        <input
          className="input" type="password" placeholder="Password" value={password} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onChange={(e) => setPassword(e.target.value)} required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-green btn-lg" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Play' : 'Create account'}
        </button>
        <div className="or"><span>or</span></div>
        <button type="button" className="btn btn-blue btn-lg" onClick={guest} disabled={busy}>
          Play as guest
        </button>
        <p className="hint">3-16 letters, numbers or _ for your nick. Password 6+ characters.</p>
      </form>
    </main>
  );
}
