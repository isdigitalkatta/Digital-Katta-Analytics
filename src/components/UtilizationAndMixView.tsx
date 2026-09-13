import React from 'react';
import {
  PieChart,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  CreditCard,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { CreditAccount, NormalizedCreditReport, UtilizationAnalysis } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';

interface UtilizationAndMixViewProps {
  report: NormalizedCreditReport;
  utilizationAnalysis: UtilizationAnalysis;
}

export const UtilizationAndMixView: React.FC<UtilizationAndMixViewProps> = ({
  report,
  utilizationAnalysis,
}) => {
  const { summary, accounts } = report;
  const creditCards = accounts.filter(a => a.isCreditCard);

  const getUtilizationColor = (pct: number) => {
    if (pct > 80) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (pct > 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (pct > 30) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getProgressBarColor = (pct: number) => {
    if (pct > 80) return 'bg-rose-500';
    if (pct > 50) return 'bg-amber-500';
    if (pct > 30) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Credit Utilization, Mix & Age
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Core components shaping 45% of your TransUnion CIBIL score calculation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-500">Target Ceiling:</span>
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            &le; 30% Utilization
          </span>
        </div>
      </div>

      {/* Credit Card Utilization Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Revolving Credit Card Utilization
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated across all sanctioned credit card facilities in your report
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${getUtilizationColor(utilizationAnalysis.utilizationPct)}`}>
            Status: {utilizationAnalysis.status} ({utilizationAnalysis.utilizationPct}%)
          </div>
        </div>

        {/* Big visual progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Outstanding: {formatIndianCurrency(utilizationAnalysis.totalBalance)}</span>
            <span>Total Limit: {formatIndianCurrency(utilizationAnalysis.totalLimit)}</span>
          </div>

          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(utilizationAnalysis.utilizationPct)}`}
              style={{ width: `${Math.min(100, Math.max(2, utilizationAnalysis.utilizationPct))}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0%</span>
            <span className="text-emerald-600 font-bold">30% Optimal Cap</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          {utilizationAnalysis.explanation}
        </p>

        {/* Card-by-Card Individual Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Individual Credit Card Accounts ({creditCards.length})
          </h4>

          {creditCards.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No credit card accounts reported on your profile.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {creditCards.map(card => {
                const cardPct = card.sanctionedAmount > 0
                  ? Math.round((card.currentBalance / card.sanctionedAmount) * 100)
                  : 0;

                return (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-xs text-slate-900">{card.lender}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getUtilizationColor(cardPct)}`}>
                        {cardPct}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Balance: <strong>{formatIndianCurrency(card.currentBalance)}</strong></span>
                      <span>Limit: <strong>{formatIndianCurrency(card.sanctionedAmount)}</strong></span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getProgressBarColor(cardPct)}`}
                        style={{ width: `${Math.min(100, cardPct)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="font-mono">{card.accountNumberMasked}</span>
                      <span>Status: {card.rawStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Utilization Recommendations */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-900 block">Expert Utilization Strategies:</span>
          <ul className="space-y-1 text-slate-600 list-disc list-inside">
            {utilizationAnalysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Credit Mix & Age Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Mix */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Credit Portfolio Mix
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Secured collateral loans vs unsecured revolving facilities
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Secured Loans</span>
                <span className="text-2xl font-extrabold text-slate-900 font-heading">
                  {summary.securedLoansCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Home, Auto, Gold Loan</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                <span className="text-[11px] font-semibold text-slate-500 block">Unsecured Loans</span>
                <span className="text-2xl font-extrabold text-slate-900 font-heading">
                  {summary.unsecuredLoansCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Personal Loans, Cards</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-blue-50/60 p-3 rounded-xl border border-blue-100">
              {summary.securedLoansCount > 0
                ? 'Your profile holds a balanced blend of secured and unsecured credit lines, indicating diverse repayment experience.'
                : 'Your profile is currently 100% unsecured. While this is common early in a credit journey, lenders prefer diversified portfolios. Never take a loan simply to diversify.'}
            </p>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Credit mix accounts for approximately 10% of your total credit assessment.
          </div>
        </div>

        {/* Credit Age */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Credit Age & History Vintage
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Length of time financial institutions have tracked your behavior
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block">Oldest Account Opened</span>
                <span className="text-sm font-extrabold text-slate-900 font-heading block mt-1">
                  {summary.oldestAccountDate}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">First recorded facility</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block">Average Account Age</span>
                <span className="text-sm font-extrabold text-slate-900 font-heading block mt-1">
                  {summary.averageAccountAgeYears} Years
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Portfolio vintage</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              A longer credit history provides statistical confidence to automated bank underwriting algorithms. Keep your oldest no-annual-fee credit cards active to preserve your vintage.
            </p>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Credit history length accounts for approx 15% of your CIBIL score.
          </div>
        </div>
      </div>
    </div>
  );
};
