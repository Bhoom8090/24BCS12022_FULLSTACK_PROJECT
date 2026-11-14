import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const [sort, setSort] = useState('wins');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get('/users/leaderboard', { params: { sort } })
      .then(({ data }) => setRows(data.users))
      .catch((e) => setError(errMsg(e)));
  }, [sort]);

  return (
    <main className="page">
      <section className="panel panel-dark board-list">
        <h2 className="lb-title outline">Leaderboard</h2>
        <div className="tabs tabs-inline tabs-dark">
          <button className={sort === 'wins' ? 'active' : ''} onClick={() => setSort('wins')}>Most wins</button>
          <button className={sort === 'streak' ? 'active' : ''} onClick={() => setSort('streak')}>Best streak</button>
        </div>
        {error && <p className="error">{error}</p>}
        <ol className="lb">
          {rows.map((r) => (
            <li key={r.id} className={r.id === user.id ? 'me' : ''}>
              <span className="lb-rank">{r.rank}.</span>
              <span className="lb-name">{r.username}</span>
              <span className="lb-val">{sort === 'wins' ? `${r.wins} wins` : `${r.bestStreak} in a row`}</span>
            </li>
          ))}
        </ol>
        {rows.length === 0 && !error && <p className="empty light">Nobody has played yet. Be the first.</p>}
      </section>
    </main>
  );
}
