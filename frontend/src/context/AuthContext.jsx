import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  // Create axios instance once
  const apiRef = useRef(null);
  if (!apiRef.current) {
    apiRef.current = axios.create({ baseURL: 'http://localhost:5000/api' });
  }
  const api = apiRef.current;

  // Keep username ref for interceptor
  const usernameRef = useRef(username);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // Attach X-Username interceptor once
  useEffect(() => {
    const id = api.interceptors.request.use((config) => {
      if (usernameRef.current) {
        config.headers['X-Username'] = usernameRef.current;
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user data from backend whenever username changes
  const fetchUser = useCallback(async () => {
    if (!usernameRef.current) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/me');
      setUser(res.data);
    } catch (error) {
      console.error('fetchUser failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username);
      usernameRef.current = username;
      fetchUser();
    } else {
      localStorage.removeItem('username');
      setUser(null);
      setLoading(false);
    }
  }, [username, fetchUser]);

  // Enter game with just a name
  const enterGame = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    usernameRef.current = trimmed;
    setUsername(trimmed);
  };

  const logout = () => {
    usernameRef.current = null;
    setUsername(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, username, api, enterGame, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
