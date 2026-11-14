import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

export function GameProvider({ children }) {
  const { token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [online, setOnline] = useState(0);
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | queue | room
  const [roomCode, setRoomCode] = useState(null);
  const [game, setGame] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const s = io(import.meta.env.VITE_SERVER_URL || undefined, { auth: { token } });
    socketRef.current = s;

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('online:count', setOnline);
    s.on('queue:waiting', () => setPhase('queue'));
    s.on('room:created', ({ code }) => { setRoomCode(code); setPhase('room'); });
    s.on('pending:cancelled', () => { setPhase('idle'); setRoomCode(null); });
    s.on('game:start', (g) => {
      setPhase('idle');
      setRoomCode(null);
      setGame({ ...g, status: 'playing', result: null });
      navigate('/game');
    });
    s.on('game:update', ({ board, turn }) => setGame((g) => g && { ...g, board, turn }));
    s.on('opponent:status', ({ connected: c }) => setGame((g) => g && { ...g, opponentConnected: c }));
    s.on('game:over', (result) => {
      setGame((g) => g && { ...g, board: result.board, status: 'over', result });
      refreshUser();
    });
    s.on('notice', setNotice);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setGame(null);
      setPhase('idle');
    };
  }, [token]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const emit = (event, payload) => socketRef.current?.emit(event, payload);
  const dropFinished = () => setGame((g) => (g && g.status === 'over' ? null : g));

  const value = {
    online, connected, phase, roomCode, game,
    joinQueue: () => { dropFinished(); emit('queue:join'); },
    leaveQueue: () => emit('queue:leave'),
    createRoom: () => { dropFinished(); emit('room:create'); },
    joinRoom: (code) => { dropFinished(); emit('room:join', { code }); },
    cancelRoom: () => emit('room:cancel'),
    makeMove: (index) => emit('game:move', { index }),
    leaveGame: () => emit('game:leave'),
    clearGame: useCallback(() => setGame(null), []),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      {notice && <div className="toast" role="status">{notice}</div>}
    </Ctx.Provider>
  );
}
