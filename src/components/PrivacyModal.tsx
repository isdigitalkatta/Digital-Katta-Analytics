import React from 'react';
import {
  ShieldCheck,
  Lock,
  Trash2,
  X,
  FileText,
  AlertTriangle,
  EyeOff,
  Database,
} from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeData: () => void;
  hasActiveReport: boolean;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  onPurgeData,
  hasActiveReport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Privacy, Security & Data Protection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Main Statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Zero-Retention Architecture
            </span>
            <p className="text-slate-600 leading-relaxed">
              Digital Katta is engineered with an ephemeral processing philosophy. Uploaded CIBIL credit reports (PDF, HTML, JSON) are parsed in memory during your browser session. We do not store, sell, or archive your credit history or personal records in any persistent database.
            </p>
          </div>

          {/* Key Privacy Controls */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Client-Side Masking:</strong>
                <p className="text-slate-600">
                  Account numbers are truncated to <code>XXXXXX1234</code>, PANs to <code>ABCDE****F</code>, and phone numbers before being rendered or transmitted to analysis models.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">No Credit Score Tracking:</strong>
                <p className="text-slate-600">
                  Closing your browser tab or clicking &quot;Delete Report Data&quot; immediately purges all parsed trade line structures from memory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Independent Software:</strong>
                <p className="text-slate-600">
                  Digital Katta is an independent diagnostic software application and is not affiliated with TransUnion CIBIL, Experian, Equifax, CRIF High Mark, the RBI, or any banking corporation.
                </p>
              </div>
            </div>
          </div>

          {/* Purge Active Session Data Button */}
          {hasActiveReport && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-800 block">Clear Active Session</span>
                <span className="text-[11px] text-slate-500">Instantly delete uploaded report from memory</span>
              </div>
              <button
                onClick={() => {
                  onPurgeData();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
