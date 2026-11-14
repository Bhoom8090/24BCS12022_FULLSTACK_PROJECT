import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [token, logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const startSession = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setToken(data.token);
  };

  // mode: 'login' | 'register'
  const authenticate = async (mode, username, password) => {
    const { data } = await api.post(`/auth/${mode}`, { username, password });
    startSession(data);
  };

  const playAsGuest = async () => {
    const { data } = await api.post('/auth/guest');
    startSession(data);
  };

  return (
    <AuthCtx.Provider value={{ token, user, loading, authenticate, playAsGuest, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
