import React from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  CheckCircle2,
  Lock,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const userName = user?.name || 'Sagar Dhumal';
  const userEmail = user?.email || 'sagar.dhumal@example.com';

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-4xl mx-auto pb-10">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
          Manage your Digital Katta credentials, privacy safeguards, and session status.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-[#F56B2B] flex items-center justify-center font-extrabold text-2xl border-2 border-orange-200">
            {userName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#12233F]">{userName}</h2>
            <p className="text-xs text-slate-500 font-medium">{userEmail}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1.5 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Account</span>
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email Address</p>
            <p className="text-[#12233F] font-bold mt-1">{userEmail}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</p>
            <p className="text-[#12233F] font-bold mt-1">+91 98765 43210</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Security Method</p>
            <p className="text-[#12233F] font-bold mt-1">Multi-Factor OTP &amp; Password</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Compliance Tier</p>
            <p className="text-emerald-700 font-bold mt-1">DPDP 2023 Ephemeral Privacy</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl border-2 border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
