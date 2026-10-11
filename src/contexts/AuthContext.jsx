import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchUserProfile,
  login as requestLogin,
  logout as requestLogout,
  verifySession,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const handleUnauthorized = () => {
      setUser(null);
      if (window.location.pathname !== '/login') {
        navigate('/login', {
          replace: true,
          state: { message: 'Sua sessão expirou. Entre novamente para continuar.' },
        });
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const restoreSession = async () => {
      try {
        await verifySession();
        const profile = await fetchUserProfile();
        if (active) setUser(profile);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void restoreSession();

    return () => {
      active = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    await requestLogin(email, password);
    const profile = await fetchUserProfile();
    setUser(profile);
    return profile;
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await fetchUserProfile();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await requestLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refreshUser,
  }), [user, isLoading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
