import React, { useState, useEffect } from 'react';
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
  Clock,
  Award,
  Zap,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult, OutlookScenarioType } from '../../types';
import {
  generateScoreOutlookData,
  DEFAULT_SIMULATOR_OPTIONS,
  OutlookSimulatorOptions,
} from '../../utils/outlookCalculator';
import {
  getPlanTaskItems,
  calculateDynamicTrajectory,
  getStoredCompletedTasks,
  saveStoredCompletedTasks,
  PlanTaskItem,
  TrajectoryCalculationResult,
} from '../../utils/actionPlanTasks';
import { ScoreOutlookLineChart } from '../ScoreOutlookLineChart';
import { CreditScoreTrajectoryChart } from '../CreditScoreTrajectoryChart';
import { ActionPlanTrajectoryChecklist } from '../ActionPlanTrajectoryChecklist';
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
  const [chartViewMode, setChartViewMode] = useState<'30_60_90' | '12_months'>('30_60_90');
  const [simulatorOptions, setSimulatorOptions] = useState<OutlookSimulatorOptions>(
    DEFAULT_SIMULATOR_OPTIONS
  );

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() =>
    getStoredCompletedTasks()
  );

  // Synchronize with external milestone events from ActionPlanView
  useEffect(() => {
    const handleSync = () => {
      setCompletedTasks(getStoredCompletedTasks());
    };
    window.addEventListener('cibil_milestone_event', handleSync);
    return () => window.removeEventListener('cibil_milestone_event', handleSync);
  }, []);

  const currentScore = report?.score?.cibilScore ?? report?.score?.score ?? 642;
  const targetScore = 750;

  // Extract all tasks from AI Action Plan
  const taskItems: PlanTaskItem[] = getPlanTaskItems(analysis?.actionPlan);

  const negativeCount = report?.summary?.negativeAccounts ?? 2;
  const utilization = report?.summary?.creditCardUtilizationPct ?? 65;
  const severityMultiplier = negativeCount >= 2 || utilization > 50 ? 1.15 : 0.95;

  // Real-time dynamic trajectory calculated from active checklist items
  const trajectoryResult: TrajectoryCalculationResult = calculateDynamicTrajectory(
    currentScore,
    taskItems,
    completedTasks,
    severityMultiplier,
    targetScore
  );

  const handleToggleTask = (taskId: string) => {
    const updated = {
      ...completedTasks,
      [taskId]: !completedTasks[taskId],
    };
    setCompletedTasks(updated);
    saveStoredCompletedTasks(updated);
  };

  const handleResetTasks = () => {
    setCompletedTasks({});
    saveStoredCompletedTasks({});
  };

  const handleBatchTogglePhase = (phaseGroup: 'phase1' | 'phase2' | 'phase3', markComplete: boolean) => {
    const phaseTasks = taskItems.filter((t) => t.phaseGroup === phaseGroup);
    const updated = { ...completedTasks };
    phaseTasks.forEach((t) => {
      updated[t.id] = markComplete;
    });
    setCompletedTasks(updated);
    saveStoredCompletedTasks(updated);
  };

  // Calculate dynamic projected data for 12-month outlook
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

  const getProgressStatus = (pct: number) => {
    if (pct === 100) {
      return {
        badge: '100% Recovery Roadmap Achieved',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barGradient: 'from-emerald-500 to-teal-500',
        description: 'Outstanding! All 30/60/90-day recovery deliverables marked complete. Your projected path to 750+ Prime credit is fully activated.',
      };
    }
    if (pct >= 67) {
      return {
        badge: 'Phase 3: Prime Threshold Ahead',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barGradient: 'from-[#F56B2B] via-blue-500 to-emerald-500',
        description: 'Crucial bureau refresh & NOC verifications in progress. Prime tier borrowing rates within direct reach.',
      };
    }
    if (pct >= 34) {
      return {
        badge: 'Phase 2: Utilization Drop Active',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        barGradient: 'from-[#F56B2B] via-blue-500 to-blue-600',
        description: 'Card balances compressing below 25% and automated NACH payments active. Steady upward score momentum.',
      };
    }
    if (pct > 0) {
      return {
        badge: 'Phase 1: Initial Containment Active',
        color: 'text-[#F56B2B] bg-orange-50 border-orange-200',
        barGradient: 'from-[#F56B2B] to-amber-500',
        description: 'Section 21 dispute notices dispatched and overdue bleeding arrested. Initial score points already unlocking.',
      };
    }
    return {
      badge: 'Recovery Journey Ready to Launch',
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      barGradient: 'from-[#F56B2B] to-orange-400',
      description: 'Check off action items in the 30/60/90-day checklist below to see your progress bar advance and score climb in real time.',
    };
  };

  const progressStatus = getProgressStatus(trajectoryResult.completionPercentage);

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
        {chartViewMode === '30_60_90' ? (
          <>
            {/* Baseline Card with Real-time Realized Points */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Audited Baseline
                </span>
                {trajectoryResult.totalRealizedPoints > 0 && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    +{trajectoryResult.totalRealizedPoints} Active
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#12233F] font-heading tabular-nums">
                  {currentScore}
                </span>
                <span className="text-xs text-slate-500">Day 0</span>
              </div>
              <div className="mt-2.5">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${tierBadge}`}>
                  {currentTier}
                </span>
              </div>
            </div>

            {/* 30-Day Dynamic Milestone */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                30-Day Milestone (Phase 1)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#F56B2B] font-heading tabular-nums">
                  {trajectoryResult.trajectoryPoints.day30.score}
                </span>
                <span className="text-xs font-bold text-[#F56B2B]">
                  +{trajectoryResult.trajectoryPoints.day30.realizedGain} Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                {trajectoryResult.phases.phase1.completedTasks}/{trajectoryResult.phases.phase1.totalTasks} phase tasks completed
              </p>
            </div>

            {/* 60-Day Dynamic Milestone */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs print:rounded-xl print:p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                60-Day Milestone (Phase 2)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-blue-600 font-heading tabular-nums">
                  {trajectoryResult.trajectoryPoints.day60.score}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  +{trajectoryResult.trajectoryPoints.day60.realizedGain} Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                {trajectoryResult.phases.phase2.completedTasks}/{trajectoryResult.phases.phase2.totalTasks} phase tasks completed
              </p>
            </div>

            {/* 90-Day Dynamic Milestone */}
            <div className="bg-[#FFF2E8] rounded-3xl p-5 border border-orange-200/80 shadow-xs print:rounded-xl print:p-3">
              <span className="text-[11px] font-bold text-[#EA580C] uppercase tracking-wider block">
                90-Day Prime Target (Phase 3)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-700 font-heading tabular-nums">
                  {trajectoryResult.trajectoryPoints.day90.score}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  +{trajectoryResult.trajectoryPoints.day90.realizedGain} Pts
                </span>
              </div>
              <p className="text-[11px] text-slate-700 mt-2 font-medium">
                {trajectoryResult.phases.phase3.completedTasks}/{trajectoryResult.phases.phase3.totalTasks} phase tasks completed
              </p>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Visual Recovery Journey Progress Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs text-left space-y-4 print:rounded-xl print:p-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFF2E8] to-orange-100 text-[#F56B2B] flex items-center justify-center font-black shrink-0 shadow-2xs border border-orange-200/80">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#12233F] font-heading">
                  Recovery Journey Progress
                </h2>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${progressStatus.color}`}>
                  {progressStatus.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {progressStatus.description}
              </p>
            </div>
          </div>

          {/* Big percentage + Reset */}
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-[#12233F] font-heading tabular-nums">
                {trajectoryResult.completionPercentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Journey Completed
              </span>
            </div>

            {trajectoryResult.completedCount > 0 && (
              <button
                type="button"
                onClick={handleResetTasks}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                title="Reset completed tasks"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="space-y-2">
          <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressStatus.barGradient} transition-all duration-700 ease-out shadow-xs`}
              style={{ width: `${Math.max(2, trajectoryResult.completionPercentage)}%` }}
            />
          </div>

          {/* Phase Milestones along the track */}
          <div className="grid grid-cols-3 text-[11px] pt-1 border-t border-slate-100">
            <div className="text-left space-y-0.5">
              <span className="font-extrabold text-[#F56B2B] flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${trajectoryResult.phases.phase1.isComplete ? 'bg-emerald-500' : 'bg-[#F56B2B]'}`} />
                <span>Phase 1 (Days 1–30)</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {trajectoryResult.phases.phase1.completedTasks}/{trajectoryResult.phases.phase1.totalTasks} Tasks • +{trajectoryResult.phases.phase1.realizedPoints} Pts
              </p>
            </div>

            <div className="text-center space-y-0.5">
              <span className="font-extrabold text-blue-700 flex items-center justify-center gap-1">
                <span className={`w-2 h-2 rounded-full ${trajectoryResult.phases.phase2.isComplete ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                <span>Phase 2 (Days 31–60)</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {trajectoryResult.phases.phase2.completedTasks}/{trajectoryResult.phases.phase2.totalTasks} Tasks • +{trajectoryResult.phases.phase2.realizedPoints} Pts
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="font-extrabold text-emerald-700 flex items-center justify-end gap-1">
                <span className={`w-2 h-2 rounded-full ${trajectoryResult.phases.phase3.isComplete ? 'bg-emerald-500' : 'bg-emerald-600'}`} />
                <span>Phase 3 (Days 61–90)</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                {trajectoryResult.phases.phase3.completedTasks}/{trajectoryResult.phases.phase3.totalTasks} Tasks • +{trajectoryResult.phases.phase3.realizedPoints} Pts
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>{trajectoryResult.completedCount}</strong> of <strong>{trajectoryResult.totalTaskCount}</strong> Tasks Marked Complete</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>+{trajectoryResult.totalRealizedPoints} Points Unlocked in Real Time</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200 text-[#F56B2B] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Current Score with Gains: {trajectoryResult.realizedScore} Pts</span>
            </span>
          </div>

          <a
            href="#recovery-checklist"
            className="text-xs font-bold text-[#F56B2B] hover:text-[#E05A1D] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Jump to Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. Forecast Horizon Selector (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs print:hidden">
        <div className="flex items-center gap-2 px-2">
          <Clock className="w-4 h-4 text-[#F56B2B]" />
          <span className="text-xs font-extrabold text-[#12233F]">
            Forecast Horizon:
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setChartViewMode('30_60_90')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              chartViewMode === '30_60_90'
                ? 'bg-[#F56B2B] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>30 / 60 / 90 Day AI Recovery Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setChartViewMode('12_months')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              chartViewMode === '12_months'
                ? 'bg-[#12233F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>12-Month Outlook</span>
          </button>
        </div>
      </div>

      {/* 4. Active Recharts Visualization & Real-Time Action Plan Checklist */}
      <div className="print-break-inside-avoid space-y-6">
        {chartViewMode === '30_60_90' ? (
          <>
            {/* Recharts 30/60/90 Day Trajectory Chart */}
            <CreditScoreTrajectoryChart
              report={report}
              analysis={analysis}
              targetScore={targetScore}
              completedTasks={completedTasks}
              onToggleTask={handleToggleTask}
              onResetTasks={handleResetTasks}
              onNavigateToActionPlan={() => onNavigate?.('action-plan')}
            />

            {/* Interactive Action Plan Checklist */}
            <div id="recovery-checklist" className="scroll-mt-6">
              <ActionPlanTrajectoryChecklist
                tasks={taskItems}
                completedTasks={completedTasks}
                onToggleTask={handleToggleTask}
                onResetTasks={handleResetTasks}
                onBatchTogglePhase={handleBatchTogglePhase}
                trajectoryResult={trajectoryResult}
                onNavigateToActionPlan={() => onNavigate?.('action-plan')}
              />
            </div>
          </>
        ) : (
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
        )}
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
