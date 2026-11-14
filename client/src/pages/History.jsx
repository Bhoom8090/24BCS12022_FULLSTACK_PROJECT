import { useEffect, useState } from 'react';
import api, { errMsg } from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatsPanel from '../components/StatsPanel.jsx';

const FILTERS = [['', 'All'], ['win', 'Wins'], ['loss', 'Losses'], ['draw', 'Draws']];
const LABEL = { win: 'Win', loss: 'Loss', draw: 'Draw' };
const COLOR = { win: 'green', loss: 'red', draw: 'blue' };

export default function History() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ matches: [], pages: 1, total: 0 });
  const [form, setForm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/matches/me', { params: { limit: 10 } }).then(({ data: d }) => setForm(d.matches)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/matches/me', { params: { page, limit: 10, result: filter || undefined } })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [filter, page]);

  const pick = (f) => { setFilter(f); setPage(1); };

  return (
    <main className="page">
      <h2 className="page-title outline">Match history</h2>
      <section className="panel">
        <StatsPanel user={user} />
        {form.length > 0 && (
          <div className="form-row">
            <span className="stat-label">Recent form</span>
            <div className="form-blobs">
              {[...form].reverse().map((m) => (
                <span key={m.id} className={`form-blob ${COLOR[m.outcome]}`} title={`${LABEL[m.outcome]} vs ${m.opponent}`}>
                  {LABEL[m.outcome][0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="tabs tabs-inline">
          {FILTERS.map(([v, l]) => (
            <button key={l} className={filter === v ? 'active' : ''} onClick={() => pick(v)}>{l}</button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Result</th><th>Opponent</th><th>Played as</th><th>How</th><th>Moves</th><th>Date</th></tr>
            </thead>
            <tbody>
              {data.matches.map((m) => (
                <tr key={m.id}>
                  <td><span className={`badge ${COLOR[m.outcome]}`}>{LABEL[m.outcome]}</span></td>
                  <td>{m.opponent}</td>
                  <td>{m.symbol}</td>
                  <td>{m.reason === 'forfeit' ? 'Forfeit' : 'Normal'}</td>
                  <td>{m.moves}</td>
                  <td>{new Date(m.playedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && data.matches.length === 0 && <p className="empty">No matches here yet. Hit Play online to start your streak.</p>}
        <div className="pager">
          <button className="btn btn-blue btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {data.page || page} of {data.pages}</span>
          <button className="btn btn-blue btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </section>
    </main>
  );
}
