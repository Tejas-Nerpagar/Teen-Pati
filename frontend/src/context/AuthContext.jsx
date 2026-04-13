import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // ── Create the axios instance ONCE (avoids interceptor pile-up on re-render)
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = axios.create({ baseURL: 'http://localhost:5000/api' });
  }
  const api = apiRef.current;

  // Keep a ref so the interceptor always reads the latest token
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Attach interceptor exactly once
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      if (tokenRef.current) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fetchUser ────────────────────────────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Token is invalid / expired — clear auth state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Sync token → localStorage and user on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token, fetchUser]);

  // ── login ─────────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    const res = await api.post('/login', { username, password });
    // Update the ref immediately so the next request (fetchUser) carries the token
    tokenRef.current = res.data.token;
    setToken(res.data.token);
    setUser(res.data.user);
  };

  // ── register ─────────────────────────────────────────────────────────────────
  // Backend now returns {token, user} directly from /register — no second login call needed
  const register = async (username, password) => {
    const res = await api.post('/register', { username, password });
    tokenRef.current = res.data.token;
    setToken(res.data.token);
    setUser(res.data.user);
  };

  // ── logout ────────────────────────────────────────────────────────────────────
  const logout = () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, api, login, register, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
