import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const api = axios.create({
      baseURL: 'http://localhost:5000/api'
  });

  api.interceptors.request.use((config) => {
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

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
