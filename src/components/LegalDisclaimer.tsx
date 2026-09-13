import React from 'react';
import { ShieldAlert, AlertCircle } from 'lucide-react';

interface LegalDisclaimerProps {
  variant?: 'banner' | 'card' | 'compact';
  className?: string;
}

export const MANDATORY_LEGAL_DISCLAIMER =
  'Digital Katta is an independent informational tool. It is not affiliated with, endorsed by, or connected to TransUnion CIBIL, Experian, CRIF High Mark, Equifax, RBI, or any bank/NBFC. This is not financial, legal, or credit-score advice. No score improvement is guaranteed.';

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  variant = 'card',
  className = '',
}) => {
  if (variant === 'banner') {
    return (
      <div
        className={`w-full bg-slate-900 text-slate-300 px-4 py-2.5 text-[11px] leading-relaxed border-t border-slate-800 flex items-center justify-center gap-2 text-center select-none ${className}`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Statutory Compliance Notice:</strong> {MANDATORY_LEGAL_DISCLAIMER}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-tight flex items-start gap-2 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Informational Notice:</strong> {MANDATORY_LEGAL_DISCLAIMER}
        </p>
      </div>
    );
  }

  // Default card format
  return (
    <div
      className={`rounded-xl bg-slate-50 border border-slate-200/90 p-4 text-xs text-slate-600 leading-relaxed space-y-1.5 ${className}`}
    >
      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px] uppercase tracking-wider">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        <span>Independent Regulatory & Legal Disclaimer</span>
      </div>
      <p className="text-slate-600 text-[11px]">
        {MANDATORY_LEGAL_DISCLAIMER}
      </p>
      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex flex-wrap gap-x-4">
        <span>Compliant with India DPDP Act 2023</span>
        <span>Transient In-Memory Processing • Zero Retention</span>
        <span>Governed by RBI CIC (Regulation) Act 2005 rules</span>
      </div>
    </div>
  );
};
