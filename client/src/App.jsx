import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { GameProvider } from './context/GameContext.jsx';
import BoardsBg from './components/BoardsBg.jsx';
import Navbar from './components/Navbar.jsx';
import Auth from './pages/Auth.jsx';
import Lobby from './pages/Lobby.jsx';
import Game from './pages/Game.jsx';
import Practice from './pages/Practice.jsx';
import History from './pages/History.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen outline">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <GameProvider>
      <Navbar />
      <Outlet />
    </GameProvider>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <BoardsBg />
      <div className="app">
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route element={<Protected />}>
            <Route path="/" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/history" element={<History />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
