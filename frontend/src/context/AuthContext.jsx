import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kitchenos_auth_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify stored session
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('kitchenos_auth_token');
      if (storedToken) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          setToken(storedToken);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem('kitchenos_auth_token');
          localStorage.removeItem('kitchenos_auth_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('kitchenos_auth_token', data.access_token);
    localStorage.setItem('kitchenos_auth_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (email, password, fullName) => {
    const data = await api.auth.register(email, password, fullName);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('kitchenos_auth_token', data.access_token);
    localStorage.setItem('kitchenos_auth_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kitchenos_auth_token');
    localStorage.removeItem('kitchenos_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
