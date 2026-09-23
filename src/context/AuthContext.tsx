import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiLogin, apiRegister, apiGetMe } from '../utils/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'admin' | 'user') => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: 'admin' | 'user') => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'bookquiz_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Validate and load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (savedToken) {
        try {
          const fetchedUser = await apiGetMe(savedToken);
          setUser(fetchedUser);
          setToken(savedToken);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    setAuthModalOpen(false);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ) => {
    const res = await apiRegister(name, email, password, role);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    setAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (role: 'admin' | 'user') => {
    if (role === 'admin') {
      await login('admin@bookquiz.uz', 'admin123');
    } else {
      await login('talaba@bookquiz.uz', 'user123');
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin,
        authModalOpen,
        setAuthModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
