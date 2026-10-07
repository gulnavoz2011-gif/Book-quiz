import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import {
  apiLogin,
  apiRegister,
  apiGetMe,
  apiVerifyAdminCode,
  apiGetAdminStatus,
  apiStudentLogin,
} from '../utils/apiClient';

interface AdminStatusInfo {
  adminCount: number;
  maxAdmins: number;
  availableSlots: number;
  canRegisterAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  adminPasscode: string | null;
  isAdminVerified: boolean;
  adminStatus: AdminStatusInfo | null;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (studentName: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'admin' | 'user',
    adminCode?: string
  ) => Promise<void>;
  verifyAdminPasscode: (code: string) => Promise<boolean>;
  logoutAdminSession: () => void;
  refreshAdminStatus: () => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: 'admin' | 'user') => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'bookquiz_auth_token';
const ADMIN_PASSCODE_KEY = 'bookquiz_admin_passcode';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_PASSCODE_KEY) : null;
  });
  const [adminStatus, setAdminStatus] = useState<AdminStatusInfo | null>(null);

  const refreshAdminStatus = async () => {
    try {
      const status = await apiGetAdminStatus();
      setAdminStatus({
        adminCount: status.adminCount,
        maxAdmins: status.maxAdmins,
        availableSlots: status.availableSlots,
        canRegisterAdmin: status.canRegisterAdmin,
      });
    } catch (e) {
      console.warn('Could not fetch admin status:', e);
    }
  };

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
      await refreshAdminStatus();
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
    await refreshAdminStatus();
  };

  const studentLogin = async (studentName: string) => {
    const res = await apiStudentLogin(studentName);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    setAuthModalOpen(false);
    await refreshAdminStatus();
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'user' = 'user',
    adminCode?: string
  ) => {
    const res = await apiRegister(name, email, password, role, adminCode);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    if (role === 'admin' && adminCode) {
      setAdminPasscode(adminCode);
      sessionStorage.setItem(ADMIN_PASSCODE_KEY, adminCode);
    }
    setAuthModalOpen(false);
    await refreshAdminStatus();
  };

  const verifyAdminPasscode = async (code: string): Promise<boolean> => {
    try {
      const result = await apiVerifyAdminCode(code);
      if (result.verified) {
        setAdminPasscode(code);
        sessionStorage.setItem(ADMIN_PASSCODE_KEY, code);
        if (result.token && result.user) {
          setToken(result.token);
          setUser(result.user);
          localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
        }
        await refreshAdminStatus();
        return true;
      }
      return false;
    } catch (err: any) {
      throw err;
    }
  };

  const logoutAdminSession = () => {
    setAdminPasscode(null);
    sessionStorage.removeItem(ADMIN_PASSCODE_KEY);
    if (user?.role === 'admin') {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_PASSCODE_KEY);
    setToken(null);
    setUser(null);
    setAdminPasscode(null);
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
  const isAdminVerified = Boolean(isAdmin && Boolean(adminPasscode));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        adminPasscode,
        isAdminVerified,
        adminStatus,
        login,
        studentLogin,
        register,
        verifyAdminPasscode,
        logoutAdminSession,
        refreshAdminStatus,
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
