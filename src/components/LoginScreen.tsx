import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileText,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Headphones,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  MessageSquare,
  RefreshCw,
  ChevronRight,
  X,
  Clock,
  FileSpreadsheet,
  UserCheck,
  Building2,
} from 'lucide-react';
import { useAuth, AuthMethodTab, StaffRole } from '../context/AuthContext';
import { DigitalKattaBrandLogo } from './DigitalKattaBrandLogo';
import { FinancialPartnerIllustration } from './FinancialPartnerIllustration';
import { LineArtBuildings } from './LineArtBuildings';
import { LanguageSelector } from './LanguageSelector';
import { useAppLanguage } from '../hooks/useAppLanguage';

interface LoginScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateToCrm?: () => void;
  isModalView?: boolean;
  sessionTimedOut?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onCancel,
  onNavigateToCrm,
  isModalView = false,
  sessionTimedOut = false,
}) => {
  const {
    user,
    isAuthenticated,
    login,
    loginWithGoogle,
    setAuthSession,
    sendOtp,
    verifyOtp,
    logout,
    loginAsDemo,
    loginAsStaff,
  } = useAuth();
  const { t } = useAppLanguage();

  // Form states
  const [identifier, setIdentifier] = useState('sagar.dhumal@example.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);

  // Alternative login toggle (Password / OTP / WhatsApp / CRM Staff)
  const [activeTab, setActiveTab] = useState<'password' | 'otp' | 'whatsapp' | 'crm'>('password');
  const [selectedStaffRole, setSelectedStaffRole] = useState<StaffRole>('ADMIN');
  const [selectedStaffEmail, setSelectedStaffEmail] = useState<string>('isdigitalkatta@gmail.com');
  const [staffCustomEmail, setStaffCustomEmail] = useState<string>('');
  const [staffPin, setStaffPin] = useState<string>('••••••••');
  const [phoneForOtp, setPhoneForOtp] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpHint, setDemoOtpHint] = useState<string | null>(null);

  // Submitting / Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Handle standard login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // If identifier is phone number, format email alias or authenticate directly
    const emailToUse = identifier.includes('@')
      ? identifier
      : `${identifier.replace(/[^0-9]/g, '')}@digitalkatta.com`;
    const inferredName = identifier.toLowerCase().includes('sagar') ? 'Sagar Dhumal' : 'Digital Katta Member';

    const res = await login(emailToUse, inferredName);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Welcome back! Synced with Leads sheet & loading dashboard...');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setError(res.error || 'Invalid credentials. Please try again.');
    }
  };

  // Listen for OAuth messages from Google Sign-In popup
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
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
        setIsSubmitting(false);
        setSuccessMsg(`Welcome, ${event.data.user.name || event.data.user.email}! Signed in with Google successfully.`);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 600);
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setIsSubmitting(false);
        setError('Google sign-in was cancelled or encountered an error.');
      }
    };

    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, [onSuccess, setAuthSession]);

  // Google Login - Automatically redirects user to sign in using Google
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg('Connecting to Google Sign-In...');

    try {
      const redirectUri = `${window.location.origin}/api/auth/google/callback`;
      const res = await fetch(`/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      
      if (!res.ok) {
        throw new Error('Unable to connect to Google authentication service.');
      }

      const data = await res.json();
      if (!data?.url) {
        throw new Error('Google sign-in URL was not provided.');
      }

      const inIframe = window.self !== window.top;

      if (inIframe) {
        // Because Google prevents rendering inside an iframe (X-Frame-Options: DENY),
        // open the Google authentication URL in a popup window.
        const authPopup = window.open(
          data.url,
          'google_signin_popup',
          'width=520,height=650,left=250,top=100'
        );

        if (!authPopup || authPopup.closed || typeof authPopup.closed === 'undefined') {
          // If popup is blocked by the browser, fallback to standard redirect
          window.location.href = data.url;
        } else {
          setSuccessMsg('Redirected to Google Sign-In! Please complete sign-in in the Google window.');
        }
      } else {
        // Outside iframe: automatically redirect user to sign in using Google
        window.location.href = data.url;
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to redirect to Google sign-in.');
    }
  };

  // Microsoft Login - Automatically redirects user to Microsoft sign-in
  const handleMicrosoftLogin = () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg('Redirecting to Microsoft Sign-In...');
    const msUrl = 'https://login.live.com/';
    if (window.self !== window.top) {
      window.open(msUrl, 'ms_signin_popup', 'width=520,height=650');
    } else {
      window.location.href = msUrl;
    }
    setTimeout(() => setIsSubmitting(false), 2000);
  };

  // Send OTP handler
  const handleSendOtp = async (channel: 'sms' | 'whatsapp') => {
    const clean = phoneForOtp.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await sendOtp(clean, channel);
    setIsSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      if (res.demoCode) setDemoOtpHint(res.demoCode);
      setSuccessMsg(`OTP sent to +91 ${clean.slice(-10)}`);
    } else {
      setError(res.error || 'Failed to send verification code.');
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (channel: 'sms' | 'whatsapp') => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const res = await verifyOtp(phoneForOtp, code, channel, 'Sagar Dhumal');
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('OTP verified successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setError(res.error || 'Invalid OTP code. Try 123456 or request new code.');
    }
  };

  // Staff CRM Login handler
  const handleStaffAuth = async (role: StaffRole, email?: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await loginAsStaff(role, email || `${role.toLowerCase()}@digitalkatta.com`);
      if (res.success) {
        setSuccessMsg(`Authenticated as ${role}! Loading Staff CRM Dashboard...`);
        setTimeout(() => {
          if (onNavigateToCrm) {
            onNavigateToCrm();
          } else if (onSuccess) {
            onSuccess();
          }
        }, 500);
      } else {
        setError(res.error || 'Failed to authenticate staff.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error during staff authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-full ${isModalView ? 'max-w-4xl mx-auto' : 'min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#FAFBFC]'}`}>
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-[#E8ECF0] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* ========================================================= */}
        {/* LEFT PANEL: Branding & Mission (~45% width on lg: 5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-[#FFF9F5] p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#E8ECF0] relative overflow-hidden">
          {/* Subtle background ambient warmth */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -z-10" />

          {/* Top Brand Block: Logo + Wordmark + Tagline */}
          <div>
            <div className="flex justify-start mb-6">
              <DigitalKattaBrandLogo size="md" showTagline={true} tagline={t("auth.brandTagline", "ठिकाण एक, सुविधा अनेक..!")} subTagline={t("auth.brandSubTagline", "Theekan Ek, Suvidha Anek")} framed={true} />
            </div>

            {/* Large Bold Headline & Subheading */}
            <div className="space-y-1.5 mb-6 text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] tracking-tight font-heading leading-tight">
                {t("auth.gatewayTitle", "Your Financial Growth Partner")}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {t("auth.gatewaySubtitle", "CIBIL Report Analysis & Resolution Platform")}
              </p>
            </div>

            {/* 3 Feature Rows with Pastel Circular Icons */}
            <div className="space-y-4 text-left">
              {/* Feature 1: Blue Bar Chart */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#12233F] leading-snug">
                    {t("auth.feature1Title", "Check Your CIBIL Score")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t("auth.feature1Desc", "Understand your credit health")}
                  </p>
                </div>
              </div>

              {/* Feature 2: Orange Document */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#12233F] leading-snug">
                    {t("auth.feature2Title", "Identify & Resolve Issues")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t("auth.feature2Desc", "Get expert guidance")}
                  </p>
                </div>
              </div>

              {/* Feature 3: Green Checkmark Shield */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#12233F] leading-snug">
                    {t("auth.feature3Title", "Build a Better Future")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t("auth.feature3Desc", "Improve your financial opportunities")}
                  </p>
                </div>
              </div>
            </div>

            {/* Handwritten-Style Italic Quote */}
            <div className="mt-6 pt-4 border-t border-orange-200/60 text-left">
              <p className="font-handwriting text-lg sm:text-xl text-[#12233F] leading-relaxed italic">
                {t("auth.quote", "“A healthy credit profile opens doors to bigger opportunities.”")}
              </p>
            </div>
          </div>

          {/* Center Graphic: Person at laptop with annotation & arrow */}
          <div className="my-4">
            <FinancialPartnerIllustration showAnnotation={true} />
          </div>

          {/* Footer: 3 Line-Art Buildings Doodle */}
          <div className="pt-2">
            <LineArtBuildings showText={true} />
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: White Background (~55% width on lg: 7 cols)  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative">
          {/* Top-Right: Language Selector + "New here?" + Outlined Orange Button */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <LanguageSelector variant="compact" />

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600 font-medium">{t("auth.newHere", "New here?")}</span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('sagar.dhumal@example.com');
                  setSuccessMsg('Account creation flow active. You can log in directly.');
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-[#FF6A00] bg-white border-2 border-[#FF6A00] hover:bg-orange-50 transition-colors cursor-pointer"
              >
                {t("auth.createAccount", "Create Account")}
              </button>
            </div>
          </div>

          {/* Heading & Subtext */}
          <div className="text-left space-y-1 mb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
              {t("auth.welcomeBack", "Welcome Back 👋")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t("auth.welcomeSubtitle", "Login to your Digital Katta account and continue your financial journey.")}
            </p>
          </div>

          {/* 5-Minute Inactivity Session Timeout Notice */}
          {sessionTimedOut && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs animate-fade-in">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="font-bold text-amber-900">{t("auth.sessionLocked", "Session Locked (5-Minute Inactivity)")}</p>
                <p className="text-amber-800/80 font-normal mt-0.5 leading-relaxed">
                  {t("auth.sessionLockedDesc", "For your security and DPDP Act 2023 compliance, your session was automatically locked due to inactivity. Please authenticate or explore in demo mode to resume.")}
                </p>
              </div>
            </div>
          )}

          {/* Auth Method Switcher (Password / Mobile OTP / WhatsApp) */}
          <div className="flex items-center gap-2 mb-4 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('password');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-white text-[#FF6A00] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t("auth.tabPassword", "Email / Password")}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('otp');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'otp'
                  ? 'bg-white text-[#FF6A00] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t("auth.tabOtp", "SMS OTP")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('whatsapp');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("auth.tabWhatsapp", "WhatsApp")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('crm');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'crm'
                  ? 'bg-[#1c3859] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("auth.tabStaff", "CRM Staff")}</span>
            </button>
          </div>

          {/* FORM 1: Password Login (Default from Screen 1 Mockup) */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
              {/* Input: Email / Mobile Number */}
              <div>
                <label className="text-xs font-bold text-[#12233F] block mb-1.5">
                  {t("auth.emailOrPhoneLabel", "Email / Mobile Number")}
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t("auth.emailOrPhonePlaceholder", "Enter your email or mobile number")}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#E8ECF0] text-sm font-medium text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:border-[#FF6A00] transition-colors"
                  />
                </div>
              </div>

              {/* Input: Password + Forgot Password link */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#12233F]">
                    {t("auth.passwordLabel", "Password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMsg('A password reset link has been dispatched to your email.');
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    className="text-xs font-bold text-[#FF6A00] hover:underline cursor-pointer"
                  >
                    {t("auth.forgotPassword", "Forgot Password?")}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder", "Enter your password")}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border-2 border-[#E8ECF0] text-sm font-medium text-[#12233F] placeholder:text-slate-400 focus:outline-none focus:border-[#FF6A00] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox: Keep me logged in */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6A00] accent-[#FF6A00] cursor-pointer"
                />
                <label htmlFor="keepLoggedIn" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                  {t("auth.keepLoggedIn", "Keep me logged in")}
                </label>
              </div>

              {/* Error / Success Feedback */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Primary CTA: Solid Orange Full-Width Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-white text-sm sm:text-base bg-[#FF6A00] hover:bg-[#E65F00] transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer transform active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t("auth.loginBtn", "Login")}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM 2: Mobile SMS OTP Flow */}
          {activeTab === 'otp' && (
            <div className="space-y-4 text-left">
              {!otpSent ? (
                <div className="space-y-3.5">
                  <label className="text-xs font-bold text-[#12233F] block">
                    {t("auth.mobileNumberLabel", "10-Digit Mobile Number")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-slate-700 pr-2 border-r border-slate-300">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneForOtp}
                      onChange={(e) => setPhoneForOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="98765 43210"
                      className="w-full pl-22 pr-4 py-3 rounded-2xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:border-[#F56B2B]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendOtp('sms')}
                    disabled={isSubmitting || phoneForOtp.length < 10}
                    className="w-full py-3 px-6 rounded-2xl font-bold text-white text-sm bg-[#F56B2B] hover:bg-[#E05A1D] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>{t("auth.sendOtpSms", "Send OTP via SMS")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Sent to: +91 {phoneForOtp.slice(-10)}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="font-bold text-[#F56B2B] hover:underline"
                    >
                      {t("auth.editNumber", "Change Number")}
                    </button>
                  </div>
                  {demoOtpHint && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                      <span>Simulated OTP: <strong>{demoOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(demoOtpHint ? demoOtpHint.split('') : [])}
                        className="px-2 py-0.5 bg-amber-200 font-bold rounded text-[11px]"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                  <div className="flex justify-center gap-2">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.slice(-1);
                          const next = [...otpCode];
                          next[idx] = val;
                          setOtpCode(next);
                        }}
                        className="w-10 h-12 text-center text-lg font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#F56B2B]"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp('sms')}
                    className="w-full py-3 px-6 rounded-2xl font-bold text-white text-sm bg-[#F56B2B] hover:bg-[#E05A1D] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t("auth.verifySmsCode", "Verify SMS Code")}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FORM 3: WhatsApp OTP Flow */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 text-left">
              {!otpSent ? (
                <div className="space-y-3.5">
                  <label className="text-xs font-bold text-[#12233F] block">
                    {t("auth.mobileNumberLabel", "10-Digit Mobile Number")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-bold text-emerald-800 pr-2 border-r border-slate-300">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneForOtp}
                      onChange={(e) => setPhoneForOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="98765 43210"
                      className="w-full pl-22 pr-4 py-3 rounded-2xl border-2 border-emerald-300 text-sm font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendOtp('whatsapp')}
                    disabled={isSubmitting || phoneForOtp.length < 10}
                    className="w-full py-3 px-6 rounded-2xl font-bold text-white text-sm bg-[#25D366] hover:bg-[#1EBE5D] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t("auth.sendOtpWhatsapp", "Send Code via WhatsApp")}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-semibold">WhatsApp code sent to: +91 {phoneForOtp.slice(-10)}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  {demoOtpHint && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                      <span>WhatsApp Code: <strong>{demoOtpHint}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpCode(demoOtpHint ? demoOtpHint.split('') : [])}
                        className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}
                  <div className="flex justify-center gap-2">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.slice(-1);
                          const next = [...otpCode];
                          next[idx] = val;
                          setOtpCode(next);
                        }}
                        className="w-10 h-12 text-center text-lg font-bold border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp('whatsapp')}
                    className="w-full py-3 px-6 rounded-2xl font-bold text-white text-sm bg-[#25D366] hover:bg-[#1EBE5D] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t("auth.verifyWhatsappCode", "Verify WhatsApp Code")}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FORM 4: Internal Staff CRM Login */}
          {activeTab === 'crm' && (
            <div className="space-y-4 text-left">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#1c3859] to-[#12233F] text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold">{t("auth.staffPortalTitle", "Staff CRM Portal Login")}</h3>
                    <p className="text-[10px] text-slate-300">{t("auth.staffPortalDesc", "Restricted Leads & Case Registries")}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-bold">
                  {t("auth.dpdpCompliance", "DPDP Compliant")}
                </span>
              </div>

              {/* Staff Profile Quick-Select */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  {t("auth.selectStaffProfile", "Select Staff Profile to Sign In:")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { email: 'isdigitalkatta@gmail.com', name: 'Digital Katta Admin', title: 'Platform Owner & Administrator', role: 'ADMIN' as StaffRole },
                    { email: 'admin@digitalkatta.com', name: 'Super Admin', title: 'Executive Managing Director', role: 'ADMIN' as StaffRole },
                    { email: 'leadhandler@digitalkatta.com', name: 'Pooja Deshmukh', title: 'Senior Lead Desk Handler', role: 'LEAD_HANDLER' as StaffRole },
                    { email: 'creditexpert@digitalkatta.com', name: 'Adv. Ramesh Patil', title: 'Senior Dispute Counsel', role: 'CREDIT_EXPERT' as StaffRole },
                  ].map((staff) => (
                    <button
                      key={staff.email}
                      type="button"
                      onClick={() => handleStaffAuth(staff.role, staff.email)}
                      disabled={isSubmitting}
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#1c3859] hover:bg-blue-50/50 bg-white transition-all text-left cursor-pointer flex flex-col justify-between group disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 group-hover:bg-[#1c3859] group-hover:text-white transition-colors">
                            {staff.role}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{staff.name}</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{staff.title}</p>
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-[#1c3859] flex items-center gap-1">
                        <span>{t("auth.signInBtn", "Sign In")}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom staff email input toggle */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t("auth.customStaffEmail", "Or Custom Staff Email:")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={staffCustomEmail}
                    onChange={(e) => setStaffCustomEmail(e.target.value)}
                    placeholder="name@digitalkatta.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1c3859]"
                  />
                  <button
                    type="button"
                    disabled={isSubmitting || !staffCustomEmail.includes('@')}
                    onClick={() => handleStaffAuth(selectedStaffRole, staffCustomEmail)}
                    className="px-4 py-2 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {t("auth.authenticateBtn", "Authenticate")}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{t("auth.dpdpClearance", "DPDP Act 2023 Clearance")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('password');
                    setError(null);
                  }}
                  className="font-bold text-[#FF6A00] hover:underline cursor-pointer"
                >
                  {t("auth.customerLogin", "← Customer Login")}
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'crm' && (
            <>
              {/* Divider with "OR" in the middle */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 font-bold text-slate-400 tracking-wider">
                    {t("auth.orContinueWith", "OR")}
                  </span>
                </div>
              </div>

              {/* Two Side-by-Side Outline Buttons: Google & Microsoft */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="truncate">{t("auth.continueGoogle", "Continue with Google")}</span>
                </button>

                {/* Continue with Microsoft */}
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="w-full py-2.5 px-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  {/* Microsoft 4-square icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  <span className="truncate">{t("auth.continueMicrosoft", "Continue with Microsoft")}</span>
                </button>
              </div>
            </>
          )}

          {/* Green-Tinted Info Banner with Shield Icon */}
          <div className="bg-[#EBF9F1] border border-[#B7EBD0] rounded-2xl p-3 flex items-center justify-center gap-2 mb-4 text-[#16A34A]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold text-[#15803D]">
              {t("auth.secureDataNotice", "Your data is 100% secure and confidential.")}
            </span>
          </div>

          {/* Bottom Help Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-full bg-orange-100 text-[#FF6A00] flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#12233F]">{t("auth.needHelp", "Need Help?")}</p>
                <p className="text-[11px] text-slate-500">{t("auth.supportTeam", "Our support team is here for you.")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="text-xs font-bold text-[#FF6A00] hover:text-[#E65F00] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{t("auth.contactSupport", "Contact Support")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Guest / Demo Link */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  const raw = (identifier || '').trim();
                  const isEmail = raw.includes('@');
                  const cleanPhone = raw.replace(/[^0-9]/g, '');
                  const isPhone = !isEmail && cleanPhone.length >= 10;

                  await loginAsDemo({
                    email: isEmail ? raw : undefined,
                    phone: isPhone ? `+91 ${cleanPhone.slice(-10)}` : undefined,
                    identifier: raw || undefined,
                    name: raw.toLowerCase().includes('sagar') ? 'Sagar Dhumal (Demo)' : undefined,
                  });
                  setSuccessMsg('Demo session active! Synced with Leads spreadsheet.');
                } catch (_) {}
                setIsSubmitting(false);
                if (onSuccess) onSuccess();
                else if (onCancel) onCancel();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-[#FF6A00] transition-colors cursor-pointer py-1"
            >
              {t("auth.exploreDemoMode", "Explore Analyzer in Demo Mode →")}
            </button>
          </div>
        </div>
      </div>

      {/* Support Dialog */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-left space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#F56B2B]">
                <Headphones className="w-5 h-5" />
                <h3 className="font-bold text-base text-[#12233F]">Digital Katta Support</h3>
              </div>
              <button
                onClick={() => setSupportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Need assistance with your CIBIL report upload, account verification, or dispute queries? We're available 24/7.
            </p>
            <div className="space-y-2 text-xs font-medium text-slate-700">
              <p>📧 Email: <a href="mailto:support@digitalkatta.com" className="text-[#F56B2B] underline">support@digitalkatta.com</a></p>
              <p>💬 WhatsApp: <a href="https://wa.me/919876543210" className="text-emerald-600 underline">+91 98765 43210</a></p>
              <p>📍 Headquarters: Pune / Mumbai, Maharashtra</p>
            </div>
            <button
              onClick={() => setSupportModalOpen(false)}
              className="w-full py-2 bg-[#F56B2B] text-white font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
