import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult, OutlookScenarioType } from '../../types';
import {
  generateScoreOutlookData,
  DEFAULT_SIMULATOR_OPTIONS,
  OutlookSimulatorOptions,
} from '../../utils/outlookCalculator';
import { ScoreOutlookLineChart } from '../ScoreOutlookLineChart';
import { CompanyLogo } from '../CompanyLogo';

interface FutureOutlookPageProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  onNavigate?: (tab: string) => void;
}

export const FutureOutlookPage: React.FC<FutureOutlookPageProps> = ({
  report,
  analysis,
  onNavigate,
}) => {
  const [scenario, setScenario] = useState<OutlookScenarioType>('all');
  const [simulatorOptions, setSimulatorOptions] = useState<OutlookSimulatorOptions>(
    DEFAULT_SIMULATOR_OPTIONS
  );

  const currentScore = report?.score?.cibilScore ?? report?.score?.score ?? 642;
  const targetScore = 750;

  // Calculate dynamic projected data
  const { data, maxProjectedScore, totalPotentialGain, monthsToTarget } =
    generateScoreOutlookData(report, simulatorOptions, targetScore);

  const handleToggleOption = (key: keyof OutlookSimulatorOptions) => {
    setSimulatorOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResetSimulator = () => {
    setSimulatorOptions(DEFAULT_SIMULATOR_OPTIONS);
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine current tier
  let currentTier = 'Needs Improvement';
  let tierBadge = 'bg-rose-100 text-rose-800 border-rose-200';
  if (currentScore >= 750) {
    currentTier = 'Excellent';
    tierBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (currentScore >= 700) {
    currentTier = 'Good';
    tierBadge = 'bg-blue-100 text-blue-800 border-blue-200';
  } else if (currentScore >= 650) {
    currentTier = 'Fair';
    tierBadge = 'bg-amber-100 text-amber-800 border-amber-200';
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:space-y-4">
      {/* Print-Only Header */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b border-slate-300">
        <div>
          <h2 className="text-xl font-bold text-[#12233F]">Digital Katta  |  Future Score Outlook &amp; Trajectory</h2>
          <p className="text-xs text-slate-600">
            Borrower: {report?.personal?.name || 'Sagar Dhumal'}  |  PAN: {report?.personal?.panMasked || 'XXXXX****X'}  |  Date: {new Date().toLocaleDateString('en-IN')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-700">Baseline CIBIL: {currentScore}</span>
          <span className="text-xs text-emerald-700 block font-extrabold">Target Goal: 750+</span>
        </div>
      </div>

      {/* 1. Header & Quick Controls (Screen only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF2E8] text-[#F56B2B] border border-orange-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Predictive Score Modeling</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight mt-2">
            Future Outlook &amp; Score Trajectory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            AI-modeled projections based on disciplined debt resolution, utilization compression, and dispute cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title="Print or export clear outlook report to PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Outlook Report</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('action-plan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F56B2B] hover:bg-[#E05A1D] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>View Action Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Trajectory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        {/* Baseline Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Current Audited Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#12233F] font-heading tabular-nums">
              {currentScore}
            </span>
            <span className="text-xs text-slate-500">/ 900</span>
          </div>
          <div className="mt-2.5">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${tierBadge}`}>
              {currentTier}
            </span>
          </div>
        </div>

        {/* 6-Month Projected Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            6-Month Milestone
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-heading tabular-nums">
              {data.find((d) => d.period.includes('+6 Mos'))?.projectedScore ?? 735}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              +{Math.max(0, (data.find((d) => d.period.includes('+6 Mos'))?.projectedScore ?? 735) - currentScore)} Pts
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">
            Overdues cleared &amp; 30-day dispute turnaround
          </p>
        </div>

        {/* 12-Month Projected Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            12-Month Future Outlook
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-heading tabular-nums">
              {maxProjectedScore}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              +{totalPotentialGain} Pts
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium">
            Prime eligibility &amp; discounted loan rates
          </p>
        </div>

        {/* Target Benchmark Card */}
        <div className="bg-[#FFF2E8] rounded-3xl p-5 border border-orange-200/80 shadow-xs print:rounded-xl print:p-3">
          <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block">
            Target Goal Benchmark
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#F56B2B] font-heading tabular-nums">
              {targetScore}+
            </span>
          </div>
          <p className="text-[11px] text-slate-700 mt-2 font-medium">
            {monthsToTarget !== null
              ? `Estimated in ~${monthsToTarget} months on active plan`
              : 'Achievable with consistent discipline'}
          </p>
        </div>
      </div>

      {/* 3. Reusable Recharts Line Chart Component */}
      <div className="print-break-inside-avoid">
        <ScoreOutlookLineChart
          data={data}
          title="CIBIL Score Trajectory & Projected Recovery Curve"
          subtitle="Interactive forecast showing actual history, realistic pathway, fast-track trajectory, and target benchmark"
          height={380}
          currentScore={currentScore}
          targetScore={targetScore}
          scenario={scenario}
          onScenarioChange={(s) => setScenario(s)}
          showCibilBands={true}
          showConfidenceBand={true}
          showMilestones={true}
        />
      </div>

      {/* 4. Interactive Levers Simulator (Screen Only) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs print:hidden text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#F56B2B]" />
              <h2 className="text-lg sm:text-xl font-bold text-[#12233F] font-heading">
                Actionable Levers Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Toggle recovery actions on or off to simulate how each step directly shifts your projected CIBIL trajectory.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetSimulator}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#F56B2B] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Levers</span>
          </button>
        </div>

        {/* Levers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
          {/* Lever 1 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.clearOverdues
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.clearOverdues}
              onChange={() => handleToggleOption('clearOverdues')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Clear 2 Overdue Delinquencies</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +42 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Settle 30+ DPD loan accounts to eliminate immediate negative reporting drag.
              </p>
            </div>
          </label>

          {/* Lever 2 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.reduceUtilization
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.reduceUtilization}
              onChange={() => handleToggleOption('reduceUtilization')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Compress Card Utilization &lt; 25%</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +34 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Pay down revolving card balances before monthly statement cycle closure.
              </p>
            </div>
          </label>

          {/* Lever 3 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.disputeInquiries
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.disputeInquiries}
              onChange={() => handleToggleOption('disputeInquiries')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Section 21 Inaccuracy Disputes</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +18 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Dispute unauthorized hard inquiries or inaccurate status markers under CICRA Act 2005.
              </p>
            </div>
          </label>

          {/* Lever 4 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.automateRepayments
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.automateRepayments}
              onChange={() => handleToggleOption('automateRepayments')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">100% On-Time NACH Auto-Debits</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +26 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Establish auto-debit mandates at least 3 business days before EMI due date.
              </p>
            </div>
          </label>

          {/* Lever 5 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.limitInquiries
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.limitInquiries}
              onChange={() => handleToggleOption('limitInquiries')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Freeze New Hard Loan Inquiries</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +12 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Cease submitting fresh loan applications to purge credit-hunger penalties.
              </p>
            </div>
          </label>

          {/* Lever 6 */}
          <label
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
              simulatorOptions.seasonedAccountsOpen
                ? 'bg-orange-50/50 border-orange-200 text-[#12233F]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <input
              type="checkbox"
              checked={simulatorOptions.seasonedAccountsOpen}
              onChange={() => handleToggleOption('seasonedAccountsOpen')}
              className="mt-1 w-4 h-4 rounded text-[#F56B2B] focus:ring-[#F56B2B] cursor-pointer"
            />
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">Preserve Seasoned Credit Lines</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  +10 Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Retain oldest credit cards with nominal spends to sustain credit maturity age.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 5. Statutory Recovery Phases Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3 print:gap-2">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F56B2B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#F56B2B]">
              Phase 1: Days 1 to 30
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#12233F]">Immediate Inaccuracy Containment</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Dispatch Section 21 dispute notices to lender grievance desks and settle smallest overdue balances to stop negative compounding.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Phase 2: Days 31 to 90
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#12233F]">Revolving Utilization Compression</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Bring aggregate credit card balances strictly under 25% and follow up on 30-day statutory dispute resolution with bank nodal officers.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Phase 3: Days 91 to 365
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#12233F]">Compounding &amp; 750+ Benchmark</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Verify updated bureau CIR with zero overdue records and maintain 100% on-time automated repayments to reach premier credit status.
          </p>
        </div>
      </div>
    </div>
  );
};
