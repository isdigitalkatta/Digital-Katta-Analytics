import React from 'react';
import {
  UploadCloud,
  FileQuestion,
  Trash2,
  Lock,
  Sparkles,
  RefreshCw,
  User,
  ShieldCheck,
} from 'lucide-react';
import { NormalizedCreditReport } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  report: NormalizedCreditReport | null;
  onOpenUpload: () => void;
  onSelectDemo: (demoId: 'stressed' | 'good') => void;
  onClearReport: () => void;
  onOpenPrivacy: () => void;
  onOpenAuth: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  isAnalyzing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  report,
  onOpenUpload,
  onSelectDemo,
  onClearReport,
  onOpenPrivacy,
  onOpenAuth,
  onToggleChat,
  isChatOpen,
  isAnalyzing,
}) => {
  const { user, isAuthenticated } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-[#287975]/30 px-4 md:px-6 flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-xs">
      {/* Left info with Company Logo */}
      <div className="flex items-center gap-3">
        {report ? (
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" className="hidden sm:inline-flex" />
            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {report.personal.name}
                </span>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  PAN: {report.personal.panMasked}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                  {report.rawSourceType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Ref: {report.personal.reportNumber || 'Active'} • Date: {report.personal.reportDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CompanyLogo size="md" showTagline={true} />
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
              <span className="font-semibold text-teal-800">AI CIBIL Analyzer</span>
              <span>•</span>
              <span>Your Credit. Clearly Explained.</span>
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {isAnalyzing && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing report...</span>
          </div>
        )}

        {report && (
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isChatOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
            }`}
            title="Ask Questions About Your Report"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        )}

        {/* Demo Selector */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Load Sample</span>
            <span className="sm:hidden">Sample</span>
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Sample Indian Credit Profiles
            </div>
            <button
              onClick={() => onSelectDemo('stressed')}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs cursor-pointer"
            >
              <div className="font-semibold text-rose-700">Arun Kumar (Score: 618)</div>
              <div className="text-[11px] text-slate-500">
                Stressed profile • Write-off, 90+ DPD & Overdues
              </div>
            </button>
            <button
              onClick={() => onSelectDemo('good')}
              className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs cursor-pointer mt-1"
            >
              <div className="font-semibold text-emerald-700">Priya Sharma (Score: 742)</div>
              <div className="text-[11px] text-slate-500">
                Good profile • Active Home Loan & 39% Card Utilization
              </div>
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Report</span>
        </button>

        {/* Clear Data */}
        {report && (
          <button
            onClick={() => {
              if (window.confirm('Permanently delete active credit report data? All parsed trade lines, risk scores, and generated letters will be immediately wiped from this browser session.')) {
                onClearReport();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Clear and Delete Report Data"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Account / Auth status */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            isAuthenticated
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title={isAuthenticated ? `Authenticated as ${user?.email}` : 'Anonymous Demo Mode – Click to Sign In'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden md:inline">
            {isAuthenticated ? user?.email?.split('@')[0] : 'Demo Session'}
          </span>
          <span className="md:hidden">
            {isAuthenticated ? 'User' : 'Demo'}
          </span>
        </button>

        {/* Privacy modal */}
        <button
          onClick={onOpenPrivacy}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Privacy & Data Protection Notice"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
