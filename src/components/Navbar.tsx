import React from 'react';
import {
  UploadCloud,
  FileQuestion,
  Trash2,
  Lock,
  Sparkles,
  RefreshCw,
  User,
} from 'lucide-react';
import { NormalizedCreditReport } from '../types';

interface NavbarProps {
  report: NormalizedCreditReport | null;
  onOpenUpload: () => void;
  onSelectDemo: (demoId: 'stressed' | 'good') => void;
  onClearReport: () => void;
  onOpenPrivacy: () => void;
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
  onToggleChat,
  isChatOpen,
  isAnalyzing,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between z-10 shrink-0 sticky top-0">
      {/* Left info */}
      <div className="flex items-center gap-3">
        {report ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {report.personal.name}
                </span>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  PAN: {report.personal.panMasked}
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  {report.rawSourceType}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Report Ref: {report.personal.reportNumber || 'Active'} • Date: {report.personal.reportDate}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800 font-heading">
              Digital Katta
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-medium text-slate-500">
              Your Credit. Clearly Explained.
            </span>
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
            onClick={onClearReport}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Clear and Delete Report Data"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

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
