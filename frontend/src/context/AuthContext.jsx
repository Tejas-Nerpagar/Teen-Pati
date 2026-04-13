import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // ── Create the axios instance ONCE (avoids interceptor pile-up on re-render)
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = axios.create({ baseURL: 'http://localhost:5000/api' });
  }
  const api = apiRef.current;

  // Keep a ref to token so interceptor always reads the latest without being recreated
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Attach interceptor once
  useEffect(() => {
    const id = api.interceptors.request.use((config) => {
      if (tokenRef.current) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

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

  const login = async (username, password) => {
    const res = await api.post('/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (username, password) => {
    await api.post('/register', { username, password });
    return login(username, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, api, login, register, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
