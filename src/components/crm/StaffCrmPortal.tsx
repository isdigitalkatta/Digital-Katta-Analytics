import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  ArrowRight,
  LogOut,
  Building2,
  ChevronDown,
  ArrowLeft,
  Briefcase,
  Users,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Scale,
  KeyRound,
} from 'lucide-react';
import { useAuth, StaffRole } from '../../context/AuthContext';
import { LeadHandlerDashboard } from './LeadHandlerDashboard';
import { CreditExpertDashboard } from './CreditExpertDashboard';
import { AdminExecutiveDashboard } from './AdminExecutiveDashboard';
import { DigitalKattaBrandLogo } from '../DigitalKattaBrandLogo';

interface StaffCrmPortalProps {
  onReturnToCustomer: () => void;
}

interface StaffDirectoryMember {
  role: StaffRole;
  name: string;
  title: string;
  email: string;
  avatarColor: string;
  description: string;
}

const STAFF_MEMBERS: StaffDirectoryMember[] = [
  {
    role: 'LEAD_HANDLER',
    name: 'Lead Desk Officer',
    title: 'Senior Lead Desk Handler',
    email: 'leadhandler@digitalkatta.com',
    avatarColor: 'bg-orange-500',
    description: 'Inbound customer inquiry calling, intake verification & pipeline stage management',
  },
  {
    role: 'LEAD_HANDLER',
    name: 'Lead Operations Executive',
    title: 'Lead Operations Executive',
    email: 'leads@digitalkatta.com',
    avatarColor: 'bg-orange-600',
    description: 'WhatsApp inquiries, follow-up scheduling & borrower document collection',
  },
  {
    role: 'CREDIT_EXPERT',
    name: 'Senior Dispute Counsel',
    title: 'Senior Dispute Counsel',
    email: 'creditexpert@digitalkatta.com',
    avatarColor: 'bg-emerald-600',
    description: 'Statutory dispute claims under Section 21 CICRA 2005 & lender notices',
  },
  {
    role: 'CREDIT_EXPERT',
    name: 'Principal Credit Analyst',
    title: 'Principal Credit Analyst',
    email: 'expert@digitalkatta.com',
    avatarColor: 'bg-teal-600',
    description: 'Forensic trade-line analysis, DPD rectification & account settlement advisory',
  },
  {
    role: 'ADMIN',
    name: 'Digital Katta Admin',
    title: 'Platform Owner & Administrator',
    email: 'isdigitalkatta@gmail.com',
    avatarColor: 'bg-blue-600',
    description: 'Master pipeline, dual Google Sheets live sync, team allocation & platform revenue',
  },
  {
    role: 'ADMIN',
    name: 'Super Admin',
    title: 'Executive Managing Director',
    email: 'admin@digitalkatta.com',
    avatarColor: 'bg-slate-800',
    description: 'Executive oversight, Razorpay webhook settlements & legal compliance audit',
  },
];

export const StaffCrmPortal: React.FC<StaffCrmPortalProps> = ({ onReturnToCustomer }) => {
  const { user, isStaff, staffRole, loginAsStaff, switchStaffRole, logout } = useAuth();

  // Current view role (defaults to authenticated staffRole, but Admins can switch views)
  const [activeViewRole, setActiveViewRole] = useState<StaffRole>('ADMIN');

  // Staff Login State (when not yet authenticated as staff)
  const [selectedRoleTab, setSelectedRoleTab] = useState<StaffRole>('LEAD_HANDLER');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customPin, setCustomPin] = useState<string>('••••••••');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Sync active view role when user's staff role changes
  useEffect(() => {
    if (staffRole) {
      setActiveViewRole(staffRole);
    }
  }, [staffRole]);

  // Handle staff login
  const handleStaffLogin = async (role: StaffRole, email?: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    setLoginSuccess(null);

    try {
      const res = await loginAsStaff(role, email);
      if (res.success) {
        setLoginSuccess(`Signed in as ${role.replace(/_/g, ' ')}. Loading role dashboard...`);
        setActiveViewRole(role);
      } else {
        setLoginError(res.error || 'Authentication failed. Please verify staff credentials.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Network error during staff authentication');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // =========================================================================
  // VIEW 1: SEPARATE STAFF CRM LOGIN (When not authenticated as staff)
  // =========================================================================
  if (!isStaff || !user || user.isDemo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 text-slate-100 font-sans">
        {/* Top Header */}
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-white shadow-xs">
              DK
            </div>
            <div>
              <span className="font-heading font-black text-lg text-white tracking-tight">
                DIGITAL KATTA
              </span>
              <span className="text-[10px] block font-bold text-orange-400 tracking-wider uppercase">
                Staff &amp; Partner CRM Portal
              </span>
            </div>
          </div>

          <button
            onClick={onReturnToCustomer}
            className="px-3.5 py-2 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-900 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Portal (Home)</span>
          </button>
        </header>

        {/* Main Staff Login Box */}
        <main className="max-w-4xl mx-auto w-full py-8 my-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="space-y-2 text-center max-w-lg mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                <span>Restricted Access · Authorized Personnel Only</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                Staff CRM Login
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select your designated role to enter the Lead Desk, Dispute Advisory Desk, or Executive Admin Console.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRoleTab('LEAD_HANDLER')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                  selectedRoleTab === 'LEAD_HANDLER'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Lead Handler</span>
                <span className="text-[10px] font-normal opacity-80 hidden sm:inline">Inquiry Calling Desk</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleTab('CREDIT_EXPERT')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                  selectedRoleTab === 'CREDIT_EXPERT'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>Credit Expert</span>
                <span className="text-[10px] font-normal opacity-80 hidden sm:inline">Dispute Legal Notices</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleTab('ADMIN')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                  selectedRoleTab === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Administrator</span>
                <span className="text-[10px] font-normal opacity-80 hidden sm:inline">Master Oversight</span>
              </button>
            </div>

            {/* Error or Success notification */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}
            {loginSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {/* Profile Selection for Active Role */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">
                  Select {selectedRoleTab.replace(/_/g, ' ')} Profile:
                </span>
                <span>Fast verified 1-click authentication</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAFF_MEMBERS.filter((m) => m.role === selectedRoleTab).map((member) => (
                  <button
                    key={member.email}
                    type="button"
                    onClick={() => handleStaffLogin(member.role, member.email)}
                    disabled={isLoggingIn}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 transition-all text-left cursor-pointer flex flex-col justify-between group disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${member.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">
                              {member.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{member.title}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {member.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                        {member.email}
                      </span>
                      <span className="font-bold text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Access</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Staff Email Fallback */}
            <div className="pt-4 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-400 block mb-2">
                Or Sign In with Operational Email:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder={`name@digitalkatta.com`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  disabled={isLoggingIn || !customEmail.includes('@')}
                  onClick={() => handleStaffLogin(selectedRoleTab, customEmail)}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  {isLoggingIn ? 'Verifying...' : 'Sign In as Staff'}
                </button>
              </div>
            </div>

            {/* Security disclaimer */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                All staff logins and customer data operations are audited under the Digital Personal Data Protection (DPDP) Act 2023. Unauthorized access is strictly logged.
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Digital Katta Credit Management &copy; 2026. Internal Staff Systems.</span>
          <button
            onClick={onReturnToCustomer}
            className="text-orange-400 hover:underline cursor-pointer"
          >
            ← Return to Customer Portal (Home)
          </button>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED STAFF CRM DASHBOARDS
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Staff Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand + Portal Label */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white text-sm shadow-2xs">
              DK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm text-white tracking-tight">
                  DIGITAL KATTA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 border border-slate-700">
                  STAFF CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Internal Operations Desk</p>
            </div>
          </div>

          {/* Active Role Selector / Switcher */}
          <div className="flex items-center gap-3">
            {/* If user is Admin or staff, allow switching role dashboard */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 pl-2 hidden sm:inline">
                Active Desk:
              </span>
              <button
                type="button"
                onClick={() => setActiveViewRole('LEAD_HANDLER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewRole === 'LEAD_HANDLER'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Lead Handler
              </button>
              <button
                type="button"
                onClick={() => setActiveViewRole('CREDIT_EXPERT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewRole === 'CREDIT_EXPERT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Credit Expert
              </button>
              <button
                type="button"
                onClick={() => setActiveViewRole('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeViewRole === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Administrator
              </button>
            </div>

            {/* User profile & actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email || 'staff@digitalkatta.com'}</p>
              </div>

              <button
                onClick={onReturnToCustomer}
                title="Return to Customer Portal"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Customer App</span>
              </button>

              <button
                onClick={() => {
                  logout();
                }}
                title="Sign out of Staff CRM"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace for the Selected Role */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeViewRole === 'LEAD_HANDLER' && (
          <LeadHandlerDashboard
            onForwardToExpert={(lead) => {
              setActiveViewRole('CREDIT_EXPERT');
            }}
          />
        )}

        {activeViewRole === 'CREDIT_EXPERT' && (
          <CreditExpertDashboard />
        )}

        {activeViewRole === 'ADMIN' && (
          <AdminExecutiveDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Digital Katta Staff CRM · Active Session: <strong>{user.name}</strong> ({activeViewRole})
          </span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Google Sheets Dual Sync Connected</span>
            </span>
            <button
              onClick={onReturnToCustomer}
              className="font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Exit to Customer Portal →
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
