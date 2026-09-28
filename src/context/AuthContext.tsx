import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_LANG_KEY, DEFAULT_LANGUAGE } from '../i18n/types';
import { CustomerProfile } from '../types';

export type StaffRole = 'ADMIN' | 'LEAD_HANDLER' | 'CREDIT_EXPERT';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  provider?: 'email' | 'phone_otp' | 'whatsapp' | 'google' | 'demo' | 'staff';
  role: 'user' | 'demo' | 'admin' | StaffRole;
  isDemo: boolean;
  avatarUrl?: string;
  createdAt: string;
  profile?: CustomerProfile | null;
  isProfileComplete?: boolean;
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
  customerProfile: CustomerProfile | null;
  isProfileComplete: boolean;
  isMandatoryProfileModalOpen: boolean;
  mandatoryProfileFeatureEnabled: boolean;
  isStaff: boolean;
  staffRole: StaffRole | null;
  setActiveAuthTab: (tab: AuthMethodTab) => void;
  openAuthModal: (initialTab?: AuthMethodTab) => void;
  closeAuthModal: () => void;
  openMandatoryProfileModal: () => void;
  closeMandatoryProfileModal: () => void;
  saveCustomerProfile: (data: CustomerProfile) => Promise<{ success: boolean; error?: string; profile?: CustomerProfile }>;
  refreshProfile: () => Promise<void>;
  setAuthSession: (token: string, user: User) => void;
  login: (email: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (profile?: { email: string; name?: string; avatarUrl?: string }) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (phone: string, channel: 'sms' | 'whatsapp') => Promise<{ success: boolean; error?: string; demoCode?: string; message?: string }>;
  verifyOtp: (phone: string, otp: string, channel: 'sms' | 'whatsapp', name?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (customInfo?: { email?: string; name?: string; phone?: string; identifier?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginAsStaff: (role: StaffRole, email?: string) => Promise<{ success: boolean; error?: string }>;
  switchStaffRole: (role: StaffRole) => Promise<{ success: boolean; error?: string }>;
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
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [isMandatoryProfileModalOpen, setIsMandatoryProfileModalOpen] = useState<boolean>(false);
  const [mandatoryProfileFeatureEnabled, setMandatoryProfileFeatureEnabled] = useState<boolean>(true);

  const openAuthModal = (initialTab?: AuthMethodTab) => {
    if (initialTab) setActiveAuthTab(initialTab);
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openMandatoryProfileModal = () => setIsMandatoryProfileModalOpen(true);
  const closeMandatoryProfileModal = () => setIsMandatoryProfileModalOpen(false);

  // Checks server profile status for the active user
  const checkProfileStatus = async (authToken: string, currentUser?: User | null) => {
    try {
      const res = await fetch('/api/profile/status', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMandatoryProfileFeatureEnabled(data.featureEnabled !== false);
        if (data.profile) {
          setCustomerProfile(data.profile);
        }
        const effectiveUser = currentUser || user;
        const isNonDemo = effectiveUser ? !effectiveUser.isDemo : false;
        
        // If non-demo user has an incomplete profile and feature is enabled, open mandatory form
        if (isNonDemo && data.featureEnabled !== false && !data.isProfileComplete) {
          setIsMandatoryProfileModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Profile status check offline notice:', err);
    }
  };

  const setAuthSession = (sessionToken: string, sessionUser: User) => {
    setToken(sessionToken);
    setUser(sessionUser);
    if (sessionUser?.profile) {
      setCustomerProfile(sessionUser.profile);
    }
    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    if (!sessionUser.isDemo && mandatoryProfileFeatureEnabled && !sessionUser.isProfileComplete) {
      setIsMandatoryProfileModalOpen(true);
    }
    setIsAuthModalOpen(false);
  };

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      // Check if user was redirected back from OAuth with auth_token in query params
      let storedToken = localStorage.getItem(TOKEN_KEY);
      let storedUser = localStorage.getItem(USER_KEY);

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlToken = searchParams.get('auth_token') || searchParams.get('token');
        if (urlToken) {
          storedToken = urlToken;
          searchParams.delete('auth_token');
          searchParams.delete('token');
          searchParams.delete('auth_provider');
          const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
          window.history.replaceState({}, document.title, `${window.location.pathname}${cleanSearch}`);
        }
      } catch (err) {
        console.warn('Could not parse URL auth token', err);
      }

      if (storedToken) {
        try {
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(parsedUser);
            if (parsedUser.profile) {
              setCustomerProfile(parsedUser.profile);
            }
          }

          // Verify token with server
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.authenticated && data.user) {
            setToken(storedToken);
            setUser(data.user);
            if (data.user.profile) {
              setCustomerProfile(data.user.profile);
            }
            localStorage.setItem(TOKEN_KEY, storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            await checkProfileStatus(storedToken, data.user);
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

    // Listen for OAuth messages from popups
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (
        !origin.endsWith('.run.app') &&
        !origin.includes('localhost') &&
        origin !== window.location.origin
      ) {
        return;
      }
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data?.token && event.data?.user) {
        setAuthSession(event.data.token, event.data.user);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  const initializeDemo = async (customInfo?: { email?: string; name?: string; phone?: string; identifier?: string }) => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customInfo || {}),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        setIsMandatoryProfileModalOpen(false);
        setCustomerProfile(null);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
    } catch (err: any) {
      console.warn('Demo session init offline notice:', err);
      return { success: false, error: err?.message || 'Demo session failed' };
    }
    return { success: false, error: 'Failed to initialize demo' };
  };

  const refreshProfile = async () => {
    if (!token) return;
    await checkProfileStatus(token, user);
  };

  const saveCustomerProfile = async (profileData: CustomerProfile) => {
    if (!token) {
      return { success: false, error: 'Authentication required to save customer profile.' };
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerProfile(data.profile);
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
        if (data.token) {
          setToken(data.token);
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setIsMandatoryProfileModalOpen(false);
        return { success: true, profile: data.profile };
      } else {
        return { success: false, error: data.error || 'Failed to save customer profile.' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error saving customer profile.' };
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
        if (data.user?.profile) {
          setCustomerProfile(data.user.profile);
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Check if mandatory customer profile is required
        if (!data.user.isDemo && mandatoryProfileFeatureEnabled && !data.user.isProfileComplete) {
          setIsMandatoryProfileModalOpen(true);
        }

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
        if (data.user?.profile) {
          setCustomerProfile(data.user.profile);
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Check if mandatory customer profile is required
        if (!data.user.isDemo && mandatoryProfileFeatureEnabled && !data.user.isProfileComplete) {
          setIsMandatoryProfileModalOpen(true);
        }

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
        if (data.user?.profile) {
          setCustomerProfile(data.user.profile);
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Check if mandatory customer profile is required
        if (!data.user.isDemo && mandatoryProfileFeatureEnabled && !data.user.isProfileComplete) {
          setIsMandatoryProfileModalOpen(true);
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Invalid or expired OTP' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error verifying OTP' };
    }
  };

  const loginAsDemo = async (customInfo?: { email?: string; name?: string; phone?: string; identifier?: string }) => {
    return await initializeDemo(customInfo);
  };

  const loginAsStaff = async (role: StaffRole, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Staff authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during staff authentication' };
    }
  };

  const switchStaffRole = async (role: StaffRole) => {
    return loginAsStaff(role);
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
    setCustomerProfile(null);
    setIsMandatoryProfileModalOpen(false);
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
      ...((token ? { Authorization: `Bearer ${token}` } : {}) as Record<string, string>),
    };
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
    // Avoid triggering customer modal for staff/CRM admin endpoints
    if (response.status === 401 || (response.status === 403 && !url.includes('/api/v1/admin/'))) {
      setIsAuthModalOpen(true);
    }

    return response;
  };

  const isProfileComplete = Boolean(user?.isDemo || user?.isProfileComplete || customerProfile?.pan);

  const isStaff = Boolean(
    user &&
      !user.isDemo &&
      (user.role === 'ADMIN' ||
        user.role === 'LEAD_HANDLER' ||
        user.role === 'CREDIT_EXPERT' ||
        user.role === 'admin' ||
        (user.email && (
          user.email.toLowerCase() === 'isdigitalkatta@gmail.com' ||
          user.email.toLowerCase() === 'admin@digitalkatta.com' ||
          user.email.toLowerCase() === 'leadhandler@digitalkatta.com' ||
          user.email.toLowerCase() === 'leads@digitalkatta.com' ||
          user.email.toLowerCase() === 'creditexpert@digitalkatta.com' ||
          user.email.toLowerCase() === 'expert@digitalkatta.com' ||
          user.email.toLowerCase().endsWith('@digitalkatta.com')
        )))
  );

  const staffRole: StaffRole | null = ((): StaffRole | null => {
    if (!user || user.isDemo) return null;
    const email = user.email?.toLowerCase();
    if (email === 'isdigitalkatta@gmail.com' || email === 'admin@digitalkatta.com') return 'ADMIN';
    if (email === 'leadhandler@digitalkatta.com' || email === 'leads@digitalkatta.com') return 'LEAD_HANDLER';
    if (email === 'creditexpert@digitalkatta.com' || email === 'expert@digitalkatta.com') return 'CREDIT_EXPERT';
    if (user.role === 'ADMIN' || user.role === 'LEAD_HANDLER' || user.role === 'CREDIT_EXPERT') {
      return user.role as StaffRole;
    }
    if (user.role === 'admin') return 'ADMIN';
    if (email && email.endsWith('@digitalkatta.com')) {
      if (email.includes('lead') || email.includes('desk')) return 'LEAD_HANDLER';
      if (email.includes('expert') || email.includes('analyst')) return 'CREDIT_EXPERT';
      return 'ADMIN';
    }
    return null;
  })();

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
        customerProfile,
        isProfileComplete,
        isMandatoryProfileModalOpen,
        mandatoryProfileFeatureEnabled,
        isStaff,
        staffRole,
        setActiveAuthTab,
        openAuthModal,
        closeAuthModal,
        openMandatoryProfileModal,
        closeMandatoryProfileModal,
        saveCustomerProfile,
        refreshProfile,
        setAuthSession,
        login,
        loginWithGoogle,
        sendOtp,
        verifyOtp,
        loginAsDemo,
        loginAsStaff,
        switchStaffRole,
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
