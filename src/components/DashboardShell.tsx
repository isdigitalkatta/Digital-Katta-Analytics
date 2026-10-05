import React, { useState } from 'react';
import {
  Home,
  FileText,
  BarChart3,
  ListTodo,
  FileCheck2,
  BookOpen,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Download,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { DigitalKattaBrandLogo } from './DigitalKattaBrandLogo';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';
import { AlertSubscriptionModal } from './alerts/AlertSubscriptionModal';
import { useAppLanguage } from '../hooks/useAppLanguage';

export type DashboardTab =
  | 'home'
  | 'my-reports'
  | 'analysis'
  | 'action-plan'
  | 'future-outlook'
  | 'disputes'
  | 'resources'
  | 'profile'
  // Preserving granular sub-tabs for complete backward compatibility
  | 'negative'
  | 'history'
  | 'utilization'
  | 'enquiries'
  | 'accounts'
  | 'letter'
  | 'export'
  | 'admin';

interface DashboardShellProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  children: React.ReactNode;
  negativeAccountsCount?: number;
  disputeCount?: number;
  instantDisputeCount?: number;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onDownloadPdf?: () => void;
  borrowerName?: string;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentTab,
  onSelectTab,
  children,
  negativeAccountsCount = 0,
  disputeCount = 0,
  instantDisputeCount = 0,
  onToggleChat,
  isChatOpen = false,
  onDownloadPdf,
  borrowerName,
}) => {
  const { user, logout, isStaff, staffRole } = useAuth();
  const { t } = useAppLanguage();
  const userName = borrowerName || (user && !user.isDemo ? user.name : 'Demo Borrower');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Primary Navigation Items - Staff CRM is ONLY visible if user is authorized staff
  const navItems = [
    { id: 'home' as DashboardTab, label: t('nav.home', 'Home'), icon: Home },
    { id: 'my-reports' as DashboardTab, label: t('nav.myReports', 'My Reports'), icon: FileText },
    { id: 'analysis' as DashboardTab, label: t('nav.analysis', 'Analysis'), icon: BarChart3 },
    { id: 'action-plan' as DashboardTab, label: t('nav.actionPlan', 'Action Plan'), icon: ListTodo },
    { id: 'future-outlook' as DashboardTab, label: t('nav.futureOutlook', 'Future Outlook'), icon: TrendingUp },
    {
      id: 'disputes' as DashboardTab,
      label: t('nav.disputeSupport', 'Dispute Support'),
      icon: FileCheck2,
      badge: instantDisputeCount > 0 ? `⚡ ${instantDisputeCount} Instant` : (disputeCount > 0 ? `${disputeCount}` : undefined),
      isInstantBadge: instantDisputeCount > 0,
    },
    { id: 'resources' as DashboardTab, label: t('nav.resources', 'Resources'), icon: BookOpen },
    { id: 'profile' as DashboardTab, label: t('nav.profile', 'Profile'), icon: User },
  ];

  // Helper to determine active status including secondary sub-tabs
  const isNavActive = (tabId: DashboardTab) => {
    if (currentTab === tabId) return true;
    if (
      tabId === 'analysis' &&
      (currentTab === 'negative' ||
        currentTab === 'history' ||
        currentTab === 'utilization' ||
        currentTab === 'enquiries' ||
        currentTab === 'accounts')
    ) {
      return true;
    }
    if (tabId === 'disputes' && currentTab === 'letter') {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex font-sans text-[#12233F] relative">
      {/* ========================================================= */}
      {/* 1. PERSISTENT LEFT SIDEBAR (Desktop & Tablet Rail)       */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E8ECF0] shrink-0 select-none z-30 justify-between h-screen sticky top-0">
        {/* Top: Brand Logo + Wordmark */}
        <div>
          <div className="p-6 border-b border-[#E8ECF0] flex items-center justify-center">
            <button
              onClick={() => onSelectTab('home')}
              className="text-left cursor-pointer focus:outline-none"
            >
              <DigitalKattaBrandLogo size="md" showTagline={true} tagline="ठिकाण एक, सुविधा अनेक..!" subTagline="Theekan Ek, Suvidha Anek" framed={false} />
            </button>
          </div>

          {/* Nav items: generous vertical spacing */}
          <nav className="p-4 sm:p-5 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FFF4ED] text-[#FF6A00] font-semibold shadow-2xs'
                      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-[#12233F]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        active ? 'text-[#FF6A00]' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.isInstantBadge
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-orange-100 text-[#FF6A00]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Ask AI Bot & Logout pinned */}
        <div className="p-4 border-t border-[#E8ECF0] space-y-2">
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-[#FF6A00] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#FF6A00]" />
              <span>{t('nav.askAiBot', 'Ask AI Credit Bot')}</span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>{t('nav.signOut', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE DRAWER OVERLAY (Narrow Viewports)                  */}
      {/* ========================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 bg-white h-full overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div>
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <DigitalKattaBrandLogo size="sm" showTagline={false} framed={false} />
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        active
                          ? 'bg-[#FFF2E8] text-[#F56B2B]'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${active ? 'text-[#F56B2B]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.isInstantBadge
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-orange-100 text-[#FF6A00]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2">
              <div className="pb-1">
                <LanguageSelector variant="compact" className="w-full" />
              </div>

              {onDownloadPdf && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onDownloadPdf();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{t('common.downloadAiPdf', 'Download AI Analysis (PDF)')}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.signOut', 'Logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN VIEW AREA + TOP BAR                               */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Persistent Top Bar */}
        <header className="h-20 bg-white border-b border-[#E8ECF0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Left: Mobile hamburger & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-[#12233F]" />
            </button>

            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('common.portalTitle', 'Digital Katta Portal')}
              </span>
              <p className="text-sm font-bold text-[#12233F]">
                {navItems.find((n) => isNavActive(n.id))?.label || t('nav.dashboard', 'Dashboard')}
              </p>
            </div>
          </div>

          {/* Right Side: Language Selector, PDF, AI Assistant, Notifications & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Multilingual Selector */}
            <LanguageSelector variant="nav" />

            {/* Download AI Analysis PDF Button */}
            {onDownloadPdf && (
              <button
                onClick={onDownloadPdf}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                title="Download AI CIBIL Analysis (PDF)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('common.download', 'Download PDF')}</span>
              </button>
            )}

            {/* Ask AI Assistant Quick Launcher */}
            {onToggleChat && (
              <button
                onClick={onToggleChat}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 text-[#FF6A00] text-xs font-bold hover:bg-orange-100 transition-colors cursor-pointer border border-orange-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('nav.askAi', 'AI Assistant')}</span>
              </button>
            )}

            {/* Bell / Notification Icon */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-[#12233F] transition-colors relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Unread indicator dot */}
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF6A00] ring-2 ring-white" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8ECF0] p-4 text-left z-40 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#12233F]">{t("common.notifications", "Notifications & Bureau Alerts")}</span>
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        setIsAlertModalOpen(true);
                      }}
                      className="text-[10px] text-[#FF6A00] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Bell className="w-3 h-3" />
                      <span>{t("common.alertSettings", "Alert Settings")}</span>
                    </button>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#12233F]">{t("common.monitoredAlerts", "Monitored Email Alerts")}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{t("common.active", "Active")}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{t("common.monitoredAlertsDesc", "Tracking credit score shifts and detected dispute outcomes.")}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="font-bold text-[#12233F]">{t("common.analysisReady", "CIBIL Analysis Ready")}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">{t("common.analysisReadyDesc", "Review your key issues, trade lines and dispute items.")}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        setIsAlertModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors cursor-pointer text-center"
                    >
                      {t("common.configureAlerts", "Configure Score & Dispute Email Alerts")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar + Name + Chevron */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1 sm:px-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer select-none"
              >
                {/* User Avatar Photo / Graphic */}
                <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-orange-200 overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userName.trim().charAt(0).toUpperCase() || 'B'}</span>
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-xs sm:text-sm font-bold text-[#12233F] leading-tight">
                    {userName}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {t("common.activeMember", "Active Member")}
                  </p>
                </div>

                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 text-left z-40 animate-in fade-in">
                  <button
                    onClick={() => {
                      onSelectTab('profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{t("nav.profile", "Profile")}</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('my-reports');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t("nav.myReports", "My Reports")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsAlertModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-[#FF6A00]" />
                    <span>{t("common.monitoredAlerts", "Email Alerts & Monitoring")}</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View Body (Padding, Cream Background #FFF8F0) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global Alert Subscription Modal */}
      <AlertSubscriptionModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
};
