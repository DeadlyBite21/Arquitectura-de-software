import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = localStorage.getItem('sgpe_token');
    const userData = localStorage.getItem('sgpe_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('sgpe_token', res.data.token);
    localStorage.setItem('sgpe_user',  JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('sgpe_token');
    localStorage.removeItem('sgpe_user');
    setUser(null);
  };

  const isAdmin     = user?.rol === 'Administrador';
  const isEncargado = user?.rol === 'Encargado';
  const isDirigente = user?.rol === 'Dirigente';
  const canManage   = isAdmin || isEncargado;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEncargado, isDirigente, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);