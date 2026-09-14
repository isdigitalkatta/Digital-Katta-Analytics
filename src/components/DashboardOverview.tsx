import React from 'react';
import {
  ShieldAlert,
  CreditCard,
  History,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import { AIAnalysisResult, NormalizedCreditReport } from '../types';
import { ScoreGauge } from './ScoreGauge';
import { formatIndianCurrency } from '../utils/normalizer';
import { NavTab } from './Sidebar';
import { LegalDisclaimer } from './LegalDisclaimer';

interface DashboardOverviewProps {
  report: NormalizedCreditReport;
  analysis: AIAnalysisResult;
  onNavigateTab: (tab: NavTab) => void;
  onSelectAccountForLetter?: (accountId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  report,
  analysis,
  onNavigateTab,
}) => {
  const { summary, score } = report;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Analysis Completed
            </span>
            {analysis.generatedByAI && (
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Zap className="w-3 h-3" /> AI Powered
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-heading mt-1">
            Credit Profile Diagnosis for {report.personal.name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Report Reference: {report.personal.reportNumber || 'N/A'} • Evaluated on {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onNavigateTab('disputes')}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{analysis.disputeOpportunities.length} Potential Disputes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('action-plan')}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>30/60/90 Day Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Credit Health Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Visual Gauge */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              CIBIL TransUnion Score
            </h3>
            <span className="text-[11px] font-medium text-slate-400">Scale: 300–900</span>
          </div>

          <ScoreGauge
            score={score.score}
            category={score.category}
            riskLevel={score.riskLevel}
          />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall Credit Health:</span>
            <span className="font-bold text-slate-800">{analysis.creditHealth.healthScore100} / 100 Index</span>
          </div>
        </div>

        {/* 6 Key Financial Metrics */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* Active & Closed Accounts */}
          <div
            onClick={() => onNavigateTab('accounts')}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-blue-300 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Accounts</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 font-heading">
                {summary.totalAccounts}
              </div>
              <p className="text-[11px] text-slate-500">
                {summary.activeAccounts} Active • {summary.closedAccounts} Closed
              </p>
            </div>
            <div className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
              View all trade lines <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Negative Accounts */}
          <div
            onClick={() => onNavigateTab('negative')}
            className={`bg-white rounded-2xl border p-4 shadow-xs transition-colors cursor-pointer flex flex-col justify-between ${
              summary.negativeAccounts > 0
                ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Negative Accounts</span>
              <ShieldAlert className={`w-4 h-4 ${summary.negativeAccounts > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className="my-2">
              <div className={`text-2xl font-extrabold font-heading ${summary.negativeAccounts > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {summary.negativeAccounts}
              </div>
              <p className="text-[11px] text-slate-500">
                {summary.negativeAccounts > 0 ? 'Action Required' : 'Clean portfolio'}
              </p>
            </div>
            <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
              Inspect critical issues <ArrowRight className="w-3 h-3" />
            </div>
          </div>

          {/* Active Overdue */}
          <div
            onClick={() => onNavigateTab('negative')}
            className={`bg-white rounded-2xl border p-4 shadow-xs transition-colors cursor-pointer flex flex-col justify-between ${
              summary.totalOverdue > 0
                ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Overdue</span>
              <AlertCircle className={`w-4 h-4 ${summary.totalOverdue > 0 ? 'text-rose-600' : 'text-emerald-500'}`} />
            </div>
            <div className="my-2">
              <div className={`text-2xl font-extrabold font-heading ${summary.totalOverdue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatIndianCurrency(summary.totalOverdue)}
              </div>
              <p className="text-[11px] text-slate-500">
                {summary.totalOverdue > 0 ? 'Compounds monthly penalty' : 'Zero overdue recorded'}
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Immediate clearance recommended
            </div>
          </div>

          {/* Total Outstanding */}
          <div
            onClick={() => onNavigateTab('accounts')}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Total Outstanding</span>
              <Layers className="w-4 h-4 text-slate-600" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 font-heading">
                {formatIndianCurrency(summary.totalOutstanding)}
              </div>
              <p className="text-[11px] text-slate-500">
                Sanctioned: {formatIndianCurrency(summary.totalSanctioned)}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Across loans & credit cards
            </div>
          </div>

          {/* Card Utilization */}
          <div
            onClick={() => onNavigateTab('utilization')}
            className={`bg-white rounded-2xl border p-4 shadow-xs transition-colors cursor-pointer flex flex-col justify-between ${
              summary.creditCardUtilizationPct > 70
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Card Utilization</span>
              <TrendingDown className={`w-4 h-4 ${summary.creditCardUtilizationPct > 50 ? 'text-amber-600' : 'text-emerald-500'}`} />
            </div>
            <div className="my-2">
              <div className={`text-2xl font-extrabold font-heading ${summary.creditCardUtilizationPct > 60 ? 'text-amber-600' : 'text-slate-900'}`}>
                {summary.creditCardUtilizationPct}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full ${
                    summary.creditCardUtilizationPct > 80
                      ? 'bg-rose-500'
                      : summary.creditCardUtilizationPct > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, summary.creditCardUtilizationPct)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Target: Under 30% ({formatIndianCurrency(summary.totalCreditCardLimit * 0.3)})
            </div>
          </div>

          {/* Recent Inquiries */}
          <div
            onClick={() => onNavigateTab('enquiries')}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold text-slate-600">Recent Enquiries</span>
              <History className="w-4 h-4 text-blue-500" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-extrabold text-slate-900 font-heading">
                {summary.enquiriesLast90Days}
              </div>
              <p className="text-[11px] text-slate-500">
                In last 90 days • Total: {summary.enquiriesCount}
              </p>
            </div>
            <div className="text-[11px] text-blue-600 font-medium">
              View inquiry institutions
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues Notice Banner */}
      {analysis.criticalIssues.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Critical Flags Requiring Attention ({analysis.criticalIssues.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.criticalIssues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-white/90 rounded-xl p-3.5 border border-rose-100 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{issue.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    {issue.severity}
                  </span>
                </div>
                <p className="text-slate-600">{issue.description}</p>
                <div className="pt-1 text-[11px] text-rose-700 font-medium">
                  <strong>Action:</strong> {issue.actionImmediate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "What Is Hurting Your Score?" & Improvement Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Negative Factors (8 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                What Is Hurting Your Score?
              </h3>
              <p className="text-xs text-slate-500">
                Ranked impact factors derived from your CIBIL trade lines
              </p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {analysis.rankedNegativeFactors.length} Factors
            </span>
          </div>

          <div className="space-y-3">
            {analysis.rankedNegativeFactors.map(factor => (
              <div
                key={factor.rank}
                className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {factor.rank}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {factor.title}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      factor.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : factor.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {factor.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-7">
                  {factor.explanation}
                </p>

                <div className="pl-7 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-slate-100 text-slate-500">
                  <span><strong>Evidence:</strong> {factor.evidence}</span>
                  <span className="font-semibold text-blue-700">{factor.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Improvement Priority Checklist (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Improvement Priority Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Step-by-step recovery sequence recommended for Indian credit profiles
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Priority 1 – Resolve Active Overdues</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">Fastest</span>
                </div>
                <p className="text-slate-600">
                  Pay off ₹{summary.totalOverdue.toLocaleString('en-IN')} to prevent compounding delinquency marks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Priority 2 – Correct Inaccurate Info</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Legal Right</span>
                </div>
                <p className="text-slate-600">
                  Dispute accounts marked active despite closure NOC or incorrect DPD figures.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Priority 3 – Address Written-off Status</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">High Impact</span>
                </div>
                <p className="text-slate-600">
                  Negotiate full payoff with lender nodal offices to convert &apos;Written Off&apos; to &apos;Closed&apos;.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Priority 4 – Reduce Card Utilization</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">&lt; 30% Target</span>
                </div>
                <p className="text-slate-600">
                  Bring revolving card balance under 30% before the monthly billing generation date.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Priority 5 – Avoid Unnecessary Enquiries</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">Cool-off</span>
                </div>
                <p className="text-slate-600">
                  Pause fresh loan / credit card applications for 90 to 120 days.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('action-plan')}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <span>Open Interactive 30-60-90 Day Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Statutory Legal & DPDP Act Compliance Card */}
      <LegalDisclaimer variant="card" />
    </div>
  );
};
