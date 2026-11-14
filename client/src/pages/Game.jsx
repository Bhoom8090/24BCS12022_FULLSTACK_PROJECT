import { Navigate, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Board from '../components/Board.jsx';

export default function Game() {
  const { game, makeMove, leaveGame, clearGame, joinQueue } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!game) return <Navigate to="/" replace />;

  const over = game.status === 'over';
  const myTurn = !over && game.turn === game.symbol;
  const result = game.result;
  const outcome = !over ? null : result.winner === null ? 'draw' : result.winner === game.symbol ? 'win' : 'loss';
  const opp = game.symbol === 'X' ? 'O' : 'X';

  const status = over
    ? ''
    : !game.opponentConnected
      ? 'Opponent disconnected. Waiting for them to come back...'
      : myTurn ? 'Your turn' : `${game.opponent.username}'s turn`;

  const leave = () => {
    if (window.confirm('Leave the match? You will lose by forfeit.')) leaveGame();
  };
  const playAgain = () => { clearGame(); joinQueue(); navigate('/'); };
  const toLobby = () => { clearGame(); navigate('/'); };

  return (
    <main className="page game">
      <div className="versus">
        <div className={`player${game.turn === game.symbol && !over ? ' active' : ''}`}>
          <span className={`piece ${game.symbol} outline`}>{game.symbol}</span>
          <span className="player-name">{user.username} (you)</span>
        </div>
        <span className="vs outline">vs</span>
        <div className={`player${game.turn === opp && !over ? ' active' : ''}`}>
          <span className={`piece ${opp} outline`}>{opp}</span>
          <span className="player-name">{game.opponent.username}</span>
        </div>
      </div>

      <p className={`status${myTurn ? ' mine' : ''}`}>{status}</p>

      <Board
        board={game.board}
        onPlay={makeMove}
        disabled={over || !myTurn}
        winLine={result?.line || []}
        ghost={myTurn ? game.symbol : null}
      />

      {over ? (
        <div className={`panel result ${outcome}`}>
          <h2 className="result-title outline">
            {outcome === 'win' ? 'You won!' : outcome === 'loss' ? 'You lost' : "It's a draw"}
          </h2>
          {result.reason === 'forfeit' && (
            <p>{outcome === 'win' ? 'Your opponent left the match.' : 'You left the match.'}</p>
          )}
          {result.stats && (
            <p className="result-stats">
              Win streak <b>{result.stats.currentStreak}</b> · Best <b>{result.stats.bestStreak}</b> ·{' '}
              {result.stats.wins}W / {result.stats.losses}L / {result.stats.draws}D
            </p>
          )}
          <div className="row">
            <button className="btn btn-green" onClick={playAgain}>Play again</button>
            <button className="btn btn-blue" onClick={toLobby}>Lobby</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-red btn-sm" onClick={leave}>Leave match</button>
      )}
    </main>
  );
}
