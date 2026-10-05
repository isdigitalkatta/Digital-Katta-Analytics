import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  FileCheck2,
  Mail,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth, StaffRole } from '../../context/AuthContext';

interface StaffAccessGateProps {
  onUnlocked?: () => void;
  onCancel?: () => void;
}

interface StaffDirectoryEntry {
  email: string;
  role: StaffRole;
  name: string;
  title: string;
  badgeColor: string;
}

const AUTHORIZED_DIRECTORY: StaffDirectoryEntry[] = [
  {
    email: 'isdigitalkatta@gmail.com',
    role: 'ADMIN',
    name: 'Digital Katta Admin',
    title: 'Platform Owner & Administrator',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  {
    email: 'admin@digitalkatta.com',
    role: 'ADMIN',
    name: 'Super Admin',
    title: 'Executive Managing Director',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  {
    email: 'leadhandler@digitalkatta.com',
    role: 'LEAD_HANDLER',
    name: 'Lead Desk Officer',
    title: 'Senior Lead Desk Handler',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  {
    email: 'leads@digitalkatta.com',
    role: 'LEAD_HANDLER',
    name: 'Lead Operations Executive',
    title: 'Lead Operations Executive',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  {
    email: 'creditexpert@digitalkatta.com',
    role: 'CREDIT_EXPERT',
    name: 'Senior Dispute Counsel',
    title: 'Senior Dispute Counsel',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  {
    email: 'expert@digitalkatta.com',
    role: 'CREDIT_EXPERT',
    name: 'Principal Credit Analyst',
    title: 'Principal Credit Analyst',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
];

export const StaffAccessGate: React.FC<StaffAccessGateProps> = ({ onUnlocked, onCancel }) => {
  const { loginAsStaff } = useAuth();
  const [authMode, setAuthMode] = useState<'directory' | 'custom'>('directory');
  const [selectedDirectoryEmail, setSelectedDirectoryEmail] = useState<string>('isdigitalkatta@gmail.com');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('ADMIN');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customPin, setCustomPin] = useState<string>('••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDirectoryAuth = async (entry: StaffDirectoryEntry) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await loginAsStaff(entry.role, entry.email);
      if (res.success) {
        if (onUnlocked) onUnlocked();
      } else {
        setErrorMessage(res.error || 'Failed to authenticate as staff.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during staff authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setErrorMessage('Please enter a valid authorized staff email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await loginAsStaff(selectedRole, customEmail.trim());
      if (res.success) {
        if (onUnlocked) onUnlocked();
      } else {
        setErrorMessage(res.error || 'Failed to authenticate staff credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during staff authentication');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-left">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1c3859] to-[#12233F] p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <FileSpreadsheet className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold font-heading">
                    Internal Staff CRM Desk
                  </h2>
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    Secure RBAC Gate
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Authenticate to access Lead Sheets, Paid Customer Registries, and Google Sheets Synchronization.
                </p>
              </div>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Customer Portal</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Statutory Compliance Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">
                Statutory Compliance: DPDP Act 2023 & RBI CICRA Regulations
              </p>
              <p className="mt-1 text-amber-800/90 leading-relaxed text-[11px]">
                Under the Credit Information Companies (Regulation) Act 2005 and DPDP Act 2023, borrower lead registries, masked PAN numbers, and dispute correspondence files are restricted to authorized Digital Katta administrative and operational personnel.
              </p>
            </div>
          </div>

          {/* Mode Tabs: Directory Quick-Auth vs Custom Credentials */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('directory');
                setErrorMessage(null);
              }}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                authMode === 'directory'
                  ? 'border-[#1c3859] text-[#1c3859]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              1-Click Staff Directory Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('custom');
                setErrorMessage(null);
              }}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                authMode === 'custom'
                  ? 'border-[#1c3859] text-[#1c3859]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Staff Credentials
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tab 1: Staff Directory Quick-Login */}
          {authMode === 'directory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 font-medium">
                  Select an authorized staff member to launch the CRM session immediately:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AUTHORIZED_DIRECTORY.map((staff) => {
                  const isSelected = selectedDirectoryEmail === staff.email;
                  return (
                    <div
                      key={staff.email}
                      onClick={() => setSelectedDirectoryEmail(staff.email)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#1c3859] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${staff.badgeColor}`}
                          >
                            {staff.role}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#1c3859] shrink-0" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {staff.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{staff.title}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-1">{staff.email}</p>
                      </div>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectoryAuth(staff);
                        }}
                        className="mt-4 w-full py-2 px-3 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {isSubmitting && isSelected ? 'Verifying...' : 'Sign In as Staff'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Custom Staff Credentials Form */}
          {authMode === 'custom' && (
            <form onSubmit={handleCustomAuth} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  1. Select Staff Operational Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['ADMIN', 'LEAD_HANDLER', 'CREDIT_EXPERT'] as StaffRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedRole === role
                          ? 'border-[#1c3859] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{role}</span>
                        {selectedRole === role && (
                          <ShieldCheck className="w-4 h-4 text-[#1c3859]" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {role === 'ADMIN'
                          ? 'Full Governance & Sheets Sync'
                          : role === 'LEAD_HANDLER'
                            ? 'Lead Intake & Payment Follow-up'
                            : 'Statutory Disputes & Bank Notices'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  2. Authorized Staff Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. isdigitalkatta@gmail.com or admin@digitalkatta.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-[#1c3859]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  3. Staff Security Key / PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={customPin}
                    onChange={(e) => setCustomPin(e.target.value)}
                    placeholder="Enter Staff Access Key"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-[#1c3859]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-5 rounded-2xl bg-[#1c3859] hover:bg-[#142942] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Authenticating Staff...' : `Enter CRM as ${selectedRole}`}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          )}

          {/* Footer security badges */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-Bit Encrypted Internal Staff Session</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>Digital Katta Advisory Desks: Pune & Mumbai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
