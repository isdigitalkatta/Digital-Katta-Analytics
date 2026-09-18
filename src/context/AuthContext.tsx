import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_LANG_KEY, DEFAULT_LANGUAGE } from '../i18n/types';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  provider?: 'email' | 'phone_otp' | 'whatsapp' | 'google' | 'demo';
  role: 'user' | 'demo' | 'admin';
  isDemo: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export type AuthMethodTab = 'otp' | 'google' | 'email' | 'whatsapp';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isDemo: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  activeAuthTab: AuthMethodTab;
  setActiveAuthTab: (tab: AuthMethodTab) => void;
  openAuthModal: (initialTab?: AuthMethodTab) => void;
  closeAuthModal: () => void;
  login: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (profile?: { email: string; name?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string, channel: 'sms' | 'whatsapp') => Promise<{ success: boolean; error?: string; demoCode?: string; message?: string }>;
  verifyOtp: (phone: string, otp: string, channel: 'sms' | 'whatsapp', name?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  authenticatedFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'digitalkatta_auth_token';
const USER_KEY = 'digitalkatta_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeAuthTab, setActiveAuthTab] = useState<AuthMethodTab>('otp');

  const openAuthModal = (initialTab?: AuthMethodTab) => {
    if (initialTab) setActiveAuthTab(initialTab);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Verify token with server
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            // Expired, switch to fresh demo session
            await initializeDemo();
          }
        } catch (e) {
          await initializeDemo();
        }
      } else {
        // Automatically initiate anonymous guest demo session for frictionless evaluation
        await initializeDemo();
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const initializeDemo = async () => {
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn('Demo session init offline notice:', err);
    }
  };

  const login = async (email: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const loginWithGoogle = async (profile?: { email?: string; name?: string; avatarUrl?: string }) => {
    try {
      const targetEmail = profile?.email || 'user.google@digitalkatta.com';
      const targetName = profile?.name || 'Google Verified User';
      const avatarUrl = profile?.avatarUrl;

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Google authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during Google login' };
    }
  };

  const sendOtp = async (phone: string, channel: 'sms' | 'whatsapp') => {
    try {
      const endpoint = channel === 'whatsapp' ? '/api/auth/whatsapp/send' : '/api/auth/otp/send';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          demoCode: data.demoCode,
          message: data.message,
        };
      } else {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while requesting OTP' };
    }
  };

  const verifyOtp = async (phone: string, otp: string, channel: 'sms' | 'whatsapp', name?: string) => {
    try {
      const endpoint = channel === 'whatsapp' ? '/api/auth/whatsapp/verify' : '/api/auth/otp/verify';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid or expired OTP' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying OTP' };
    }
  };

  const loginAsDemo = async () => {
    await initializeDemo();
  };

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try {
      sessionStorage.removeItem('digitalkatta_session_unlocked');
      window.dispatchEvent(new Event('digitalkatta_logout'));
    } catch (_) {}
    setUser(null);
    setToken(null);
    // Restart as fresh demo session
    initializeDemo();
  };

  const getCurrentLanguage = (): string => {
    try {
      return localStorage.getItem(STORAGE_LANG_KEY) || DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const currentLang = getCurrentLanguage();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Language': currentLang,
      'Accept-Language': currentLang,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const authenticatedFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    let currentToken = token || localStorage.getItem(TOKEN_KEY);

    // If token is completely absent, obtain an instant guest session first
    if (!currentToken) {
      try {
        const res = await fetch('/api/auth/demo', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          currentToken = data.token;
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('Anonymous session auto-provision error:', err);
      }
    }

    const currentLang = getCurrentLanguage();
    const customHeaders = (init?.headers as Record<string, string>) || {};
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Language': currentLang,
      'Accept-Language': currentLang,
      ...customHeaders,
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...init,
      headers,
    });

    // Handle 401 (token expired/invalid) or 403 (action requires non-demo full user)
    if (response.status === 401 || response.status === 403) {
      setIsAuthModalOpen(true);
    }

    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !user.isDemo,
        isDemo: !user || user.isDemo,
        isLoading,
        isAuthModalOpen,
        activeAuthTab,
        setActiveAuthTab,
        openAuthModal,
        closeAuthModal,
        login,
        loginWithGoogle,
        sendOtp,
        verifyOtp,
        loginAsDemo,
        logout,
        getAuthHeaders,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
