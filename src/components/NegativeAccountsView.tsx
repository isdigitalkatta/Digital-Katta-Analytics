import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  FileCheck2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { AIAnalysisResult, CreditAccount, NegativeAccountAnalysis } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';

interface NegativeAccountsViewProps {
  negativeAccounts: NegativeAccountAnalysis[];
  allAccounts: CreditAccount[];
  onDraftLetter: (account: CreditAccount | NegativeAccountAnalysis) => void;
  onNavigateHistory: () => void;
}

export const NegativeAccountsView: React.FC<NegativeAccountsViewProps> = ({
  negativeAccounts,
  allAccounts,
  onDraftLetter,
  onNavigateHistory,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    negativeAccounts.length > 0 ? negativeAccounts[0].accountId : null
  );

  const filteredAccounts = negativeAccounts.filter(acc => {
    if (selectedSeverity === 'ALL') return true;
    return acc.severity === selectedSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Negative & High-Risk Accounts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accounts carrying active overdues, write-off tags, high DPD, or settlement remarks severely hurting your credit profile
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedSeverity === sev
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            No Negative Accounts Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Your credit report shows zero accounts flagged as written-off, settled, or with delinquent active balances under this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAccounts.map(account => {
            const isExpanded = expandedAccountId === account.accountId;
            return (
              <div
                key={account.accountId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
              >
                {/* Account Summary Bar */}
                <div
                  onClick={() => setExpandedAccountId(isExpanded ? null : account.accountId)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {account.lender}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({account.accountType})
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(account.severity)}`}>
                          {account.severity}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        <span className="font-mono">{account.accountNumberMasked}</span>
                        <span>•</span>
                        <span>Reported: {account.lastReportedDate}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-semibold">{account.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Current Balance</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatIndianCurrency(account.balance)}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Active Overdue</span>
                      <span className={`text-sm font-extrabold ${account.overdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatIndianCurrency(account.overdue)}
                      </span>
                    </div>

                    <div className="p-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded AI Deep-Dive */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Problem & Why it matters */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <div>
                          <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            Problem Identified:
                          </span>
                          <p className="text-slate-700 leading-relaxed">{account.problem}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                            Why It Matters:
                          </span>
                          <p className="text-slate-600 leading-relaxed">{account.whyItMatters}</p>
                        </div>
                      </div>

                      {/* What to verify & Action */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <div>
                          <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                            What To Verify:
                          </span>
                          <p className="text-slate-600 leading-relaxed">{account.whatToVerify}</p>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 block mb-1 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Recommended Resolution:
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed">{account.recommendedAction}</p>
                        </div>
                      </div>
                    </div>

                    {/* Required Documents Badge List */}
                    <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">
                          Key Documents to Collect / Retain:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {account.documentsRequired.map((doc, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onDraftLetter(account)}
                          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Draft Grievance Letter</span>
                        </button>
                        <button
                          onClick={onNavigateHistory}
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          View DPD History
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
