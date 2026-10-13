import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fixflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fixflow_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('fixflow_token');
      if (storedToken) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('fixflow_user', JSON.stringify(res.data.user));
          }
        } catch {
          logout(false);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('fixflow_token', token);
        localStorage.setItem('fixflow_user', JSON.stringify(user));
        toast.success(`Welcome back, ${user.name}! (${user.role.toUpperCase()})`);
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = (notify = true) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fixflow_token');
    localStorage.removeItem('fixflow_user');
    if (notify) toast.success('Logged out successfully');
  };

  const quickSwitchRole = async (targetRole) => {
    try {
      const email = targetRole === 'admin' ? 'admin@fixflow.io' : 'tech@fixflow.io';
      const password = 'Password123!';
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('fixflow_token', token);
        localStorage.setItem('fixflow_user', JSON.stringify(user));
        toast.success(`Switched active role to ${user.name} (${user.role.toUpperCase()})`);
        return true;
      }
    } catch {
      toast.error('Could not switch demo user. Ensure backend is running.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickSwitchRole,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isTechnician: user?.role === 'technician',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
