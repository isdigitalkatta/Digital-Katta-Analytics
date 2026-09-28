import React, { useState, useEffect, useId } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Clock,
  Layers,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult } from '../types';
import {
  getPlanTaskItems,
  calculateDynamicTrajectory,
  getStoredCompletedTasks,
  saveStoredCompletedTasks,
  PlanTaskItem,
  TrajectoryCalculationResult,
} from '../utils/actionPlanTasks';

export interface CreditScoreTrajectoryChartProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  targetScore?: number;
  className?: string;
  onNavigateToActionPlan?: () => void;
  completedTasks?: Record<string, boolean>;
  onToggleTask?: (taskId: string, title: string) => void;
  onResetTasks?: () => void;
}

export type TrajectoryScenario = 'plan' | 'aggressive' | 'conservative';

export const CreditScoreTrajectoryChart: React.FC<CreditScoreTrajectoryChartProps> = ({
  report,
  analysis,
  targetScore = 750,
  className = '',
  onNavigateToActionPlan,
  completedTasks: externalCompletedTasks,
  onToggleTask: externalOnToggleTask,
  onResetTasks: externalOnResetTasks,
}) => {
  const [internalCompletedTasks, setInternalCompletedTasks] = useState<Record<string, boolean>>(() =>
    getStoredCompletedTasks()
  );
  const [scenario, setScenario] = useState<TrajectoryScenario>('plan');
  const [selectedMilestone, setSelectedMilestone] = useState<'30' | '60' | '90'>('90');
  const gradientId = useId();

  // Listen to external milestone sync event
  useEffect(() => {
    const handleSync = () => {
      setInternalCompletedTasks(getStoredCompletedTasks());
    };
    window.addEventListener('cibil_milestone_event', handleSync);
    return () => window.removeEventListener('cibil_milestone_event', handleSync);
  }, []);

  const completedTasks = externalCompletedTasks ?? internalCompletedTasks;

  const handleToggleTask = (taskId: string, title: string) => {
    if (externalOnToggleTask) {
      externalOnToggleTask(taskId, title);
    } else {
      const updated = {
        ...internalCompletedTasks,
        [taskId]: !internalCompletedTasks[taskId],
      };
      setInternalCompletedTasks(updated);
      saveStoredCompletedTasks(updated);
    }
  };

  const handleResetTasks = () => {
    if (externalOnResetTasks) {
      externalOnResetTasks();
    } else {
      setInternalCompletedTasks({});
      saveStoredCompletedTasks({});
    }
  };

  const currentScore = report?.score?.cibilScore ?? report?.score?.score ?? 642;

  // Extract all plan task items
  const taskItems: PlanTaskItem[] = getPlanTaskItems(analysis?.actionPlan);

  // Severity multiplier
  const negativeCount = report?.summary?.negativeAccounts ?? 2;
  const utilization = report?.summary?.creditCardUtilizationPct ?? 65;
  const severityMultiplier = negativeCount >= 2 || utilization > 50 ? 1.15 : 0.95;

  // Calculate dynamic real-time trajectory
  const trajectoryResult: TrajectoryCalculationResult = calculateDynamicTrajectory(
    currentScore,
    taskItems,
    completedTasks,
    severityMultiplier,
    targetScore
  );

  const {
    baselineScore,
    realizedScore,
    totalRealizedPoints,
    phases,
    trajectoryPoints,
    completedCount,
    totalTaskCount,
  } = trajectoryResult;

  const getTierInfo = (score: number) => {
    if (score >= 750)
      return {
        name: 'Excellent / Prime',
        color: '#16A34A',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    if (score >= 700)
      return {
        name: 'Good',
        color: '#2563EB',
        badge: 'bg-blue-50 text-blue-800 border-blue-200',
      };
    if (score >= 650)
      return {
        name: 'Fair',
        color: '#D97706',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    return {
      name: 'Needs Improvement',
      color: '#DC2626',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  };

  const currentTier = getTierInfo(currentScore);
  const tier30 = getTierInfo(trajectoryPoints.day30.score);
  const tier60 = getTierInfo(trajectoryPoints.day60.score);
  const tier90 = getTierInfo(trajectoryPoints.day90.score);

  // Map trajectory data points for Recharts
  const p1Tasks = taskItems.filter((t) => t.phaseGroup === 'phase1');
  const p2Tasks = taskItems.filter((t) => t.phaseGroup === 'phase2');
  const p3Tasks = taskItems.filter((t) => t.phaseGroup === 'phase3');

  const rawTrajectoryData = [
    {
      periodKey: 'Day 0',
      dayLabel: 'Current Baseline',
      timeframe: 'Day 0 Baseline',
      phaseTitle: 'Initial CIR Audit Baseline',
      score: currentScore,
      baselineProjected: trajectoryPoints.day0.baselineProjected,
      gain: 0,
      tier: currentTier.name,
      tierColor: currentTier.color,
      tasksInPhase: [],
      completedInPhase: 0,
      totalInPhase: 0,
    },
    {
      periodKey: 'Day 30',
      dayLabel: '30 Days',
      timeframe: 'Phase 1 (Days 1–30)',
      phaseTitle: 'Immediate Dispute & Delinquency Containment',
      score: trajectoryPoints.day30.score,
      baselineProjected: trajectoryPoints.day30.baselineProjected,
      gain: trajectoryPoints.day30.realizedGain,
      tier: tier30.name,
      tierColor: tier30.color,
      tasksInPhase: p1Tasks,
      completedInPhase: phases.phase1.completedTasks,
      totalInPhase: phases.phase1.totalTasks,
    },
    {
      periodKey: 'Day 60',
      dayLabel: '60 Days',
      timeframe: 'Phase 2 (Days 31–60)',
      phaseTitle: 'Utilization Compression & Bank NOC Reconciliation',
      score: trajectoryPoints.day60.score,
      baselineProjected: trajectoryPoints.day60.baselineProjected,
      gain: trajectoryPoints.day60.realizedGain,
      tier: tier60.name,
      tierColor: tier60.color,
      tasksInPhase: p2Tasks,
      completedInPhase: phases.phase2.completedTasks,
      totalInPhase: phases.phase2.totalTasks,
    },
    {
      periodKey: 'Day 90',
      dayLabel: '90 Days',
      timeframe: 'Phase 3 (Days 61–90)',
      phaseTitle: 'Updated CIR Reflection & Prime Tier Access',
      score: trajectoryPoints.day90.score,
      baselineProjected: trajectoryPoints.day90.baselineProjected,
      gain: trajectoryPoints.day90.realizedGain,
      tier: tier90.name,
      tierColor: tier90.color,
      tasksInPhase: p3Tasks,
      completedInPhase: phases.phase3.completedTasks,
      totalInPhase: phases.phase3.totalTasks,
    },
  ];

  // Adjust scores according to scenario toggle
  const chartPoints = rawTrajectoryData.map((pt) => {
    let activeScore = pt.score;
    if (scenario === 'aggressive') {
      activeScore = Math.min(890, pt.score + Math.round((pt.score - currentScore) * 0.22) + 4);
    } else if (scenario === 'conservative') {
      activeScore = Math.max(currentScore, pt.score - Math.round((pt.score - currentScore) * 0.25));
    }

    return {
      ...pt,
      displayScore: activeScore,
      displayGain: activeScore - currentScore,
      targetScore,
    };
  });

  const minChartScore = Math.max(300, currentScore - 20);
  const maxChartScore = Math.min(
    900,
    Math.max(...chartPoints.map((p) => p.displayScore), targetScore) + 25
  );

  // Custom Dots
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isCurrent = payload.periodKey === 'Day 0';
    const isTargetMilestone = payload.periodKey === 'Day 90';
    const isPhaseDone =
      (payload.periodKey === 'Day 30' && phases.phase1.isComplete) ||
      (payload.periodKey === 'Day 60' && phases.phase2.isComplete) ||
      (payload.periodKey === 'Day 90' && phases.phase3.isComplete);

    if (isCurrent) {
      return (
        <g key={`dot-${payload.periodKey}`}>
          <circle cx={cx} cy={cy} r={7} fill="#FFFFFF" stroke="#12233F" strokeWidth={3} />
          <circle cx={cx} cy={cy} r={3.5} fill="#12233F" />
        </g>
      );
    }

    if (isTargetMilestone || isPhaseDone) {
      return (
        <g key={`dot-${payload.periodKey}`}>
          <circle cx={cx} cy={cy} r={8} fill="#ECFDF5" stroke="#16A34A" strokeWidth={3} />
          <circle cx={cx} cy={cy} r={4} fill="#16A34A" />
        </g>
      );
    }

    return (
      <g key={`dot-${payload.periodKey}`}>
        <circle cx={cx} cy={cy} r={6} fill="#FFFFFF" stroke="#F56B2B" strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={2.5} fill="#F56B2B" />
      </g>
    );
  };

  // Custom Interactive Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const pt = payload[0]?.payload as (typeof chartPoints)[0];
    if (!pt) return null;

    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl text-left max-w-sm z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#F56B2B]" />
            <span className="font-extrabold text-xs text-[#12233F]">{pt.dayLabel}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#F56B2B] border border-orange-200">
            {pt.timeframe}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-2xl font-black text-[#12233F] font-heading tabular-nums">
              {pt.displayScore}
            </span>
            <span className="text-xs text-slate-500 ml-1">/ 900</span>
          </div>
          {pt.displayGain > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{pt.displayGain} Points Gain
            </span>
          )}
        </div>

        <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pt.tierColor }} />
          <span>Bureau Status: {pt.tier}</span>
        </div>

        {pt.totalInPhase > 0 && (
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl mb-2 border border-slate-100">
            <span className="font-bold text-slate-600">Action Plan Tasks:</span>
            <span className="font-extrabold text-[#F56B2B]">
              {pt.completedInPhase} of {pt.totalInPhase} Completed
            </span>
          </div>
        )}

        <p className="text-[11px] text-slate-600 font-medium leading-snug mb-2.5">
          {pt.phaseTitle}
        </p>

        {pt.tasksInPhase.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Phase Deliverables:
            </p>
            <ul className="text-[11px] text-slate-700 space-y-1">
              {pt.tasksInPhase.slice(0, 3).map((task) => {
                const isDone = Boolean(completedTasks[task.id]);
                return (
                  <li key={task.id} className="flex items-start gap-1.5">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 mt-0.5 inline-block" />
                    )}
                    <span className={isDone ? 'line-through text-slate-500' : ''}>
                      {task.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs text-left space-y-6 ${className}`}
    >
      {/* 1. Header with Title & Scenario Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF2E8] text-[#F56B2B] border border-orange-200">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>30 / 60 / 90 Day Recovery Projection</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              <span>
                {completedCount > 0
                  ? `${completedCount}/${totalTaskCount} Tasks Completed (+${totalRealizedPoints} Pts Realized)`
                  : 'AI Action Plan Grounded'}
              </span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#12233F] font-heading mt-2">
            Credit Score Trajectory (30 / 60 / 90 Days)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Visualizing potential score increases as you execute each phase of your personalized recovery roadmap.
          </p>
        </div>

        {/* Trajectory Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setScenario('plan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scenario === 'plan'
                ? 'bg-[#F56B2B] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            AI Plan (Realistic)
          </button>
          <button
            type="button"
            onClick={() => setScenario('aggressive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scenario === 'aggressive'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            Fast-Track (+20%)
          </button>
          <button
            type="button"
            onClick={() => setScenario('conservative')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scenario === 'conservative'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            Conservative
          </button>
        </div>
      </div>

      {/* 2. Trajectory Quick Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Baseline Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Baseline
            </span>
            {totalRealizedPoints > 0 && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                +{totalRealizedPoints} Active
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#12233F] font-heading tabular-nums">
              {currentScore}
            </span>
            <span className="text-[10px] text-slate-500">Day 0</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 mt-1 block">
            {currentTier.name}
          </span>
        </div>

        {/* 30 Days Card */}
        <div
          onClick={() => setSelectedMilestone('30')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMilestone === '30'
              ? 'bg-orange-50/70 border-[#F56B2B] shadow-xs ring-1 ring-[#F56B2B]/40'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              30 Days (Phase 1)
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-orange-100 text-[#F56B2B]">
              +{trajectoryPoints.day30.realizedGain} Pts
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#F56B2B] font-heading tabular-nums">
              {trajectoryPoints.day30.score}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="font-bold text-slate-600">{tier30.name}</span>
            <span className="text-[#F56B2B] font-extrabold">
              {phases.phase1.completedTasks}/{phases.phase1.totalTasks} Done
            </span>
          </div>
        </div>

        {/* 60 Days Card */}
        <div
          onClick={() => setSelectedMilestone('60')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMilestone === '60'
              ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              60 Days (Phase 2)
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
              +{trajectoryPoints.day60.realizedGain} Pts
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-blue-600 font-heading tabular-nums">
              {trajectoryPoints.day60.score}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="font-bold text-slate-600">{tier60.name}</span>
            <span className="text-blue-700 font-extrabold">
              {phases.phase2.completedTasks}/{phases.phase2.totalTasks} Done
            </span>
          </div>
        </div>

        {/* 90 Days Card */}
        <div
          onClick={() => setSelectedMilestone('90')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMilestone === '90'
              ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500/40'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              90 Days (Phase 3)
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              +{trajectoryPoints.day90.realizedGain} Pts
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-heading tabular-nums">
              {trajectoryPoints.day90.score}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="font-bold text-emerald-700">{tier90.name}</span>
            <span className="text-emerald-700 font-extrabold">
              {phases.phase3.completedTasks}/{phases.phase3.totalTasks} Done
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Trajectory Visualization Canvas */}
      <div className="pt-2">
        <div className="flex flex-wrap items-center justify-between text-xs pb-3 gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-[#F56B2B]" />
              <span className="font-bold text-slate-700">Real-Time Score Trajectory</span>
            </div>

            {totalRealizedPoints > 0 && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                <span>Base Inactive Path</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-600 inline-block" />
              <span>Target Benchmark: {targetScore}+</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            Check off tasks below to see the curve lift in real time
          </span>
        </div>

        <div className="w-full h-80 relative select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartPoints}
              margin={{ top: 20, right: 30, left: -10, bottom: 10 }}
            >
              <defs>
                <linearGradient id={`trajectoryGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F56B2B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F56B2B" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />

              <XAxis
                dataKey="dayLabel"
                stroke="#64748B"
                fontSize={12}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                dy={8}
              />

              <YAxis
                domain={[minChartScore, maxChartScore]}
                stroke="#64748B"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                dx={-4}
                tickFormatter={(val) => `${val}`}
              />

              {/* 750 Target Goal Line */}
              <ReferenceLine
                y={targetScore}
                stroke="#16A34A"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: '750+ Prime Milestone',
                  position: 'insideTopRight',
                  fill: '#16A34A',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />

              {/* 700 Good Tier Line */}
              <ReferenceLine
                y={700}
                stroke="#2563EB"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: '700+ Good Benchmark',
                  position: 'insideBottomRight',
                  fill: '#2563EB',
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Base Inactive Line comparison if tasks are completed */}
              {totalRealizedPoints > 0 && (
                <Line
                  type="monotone"
                  dataKey="baselineProjected"
                  stroke="#94A3B8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Base Inactive Path"
                />
              )}

              {/* Area Shading under the Curve */}
              <Area
                type="monotone"
                dataKey="displayScore"
                fill={`url(#trajectoryGradient-${gradientId})`}
                stroke="none"
              />

              {/* Trajectory Main Curve */}
              <Line
                type="monotone"
                dataKey="displayScore"
                stroke="#F56B2B"
                strokeWidth={3.5}
                dot={renderDot}
                activeDot={{ r: 8, stroke: '#F56B2B', strokeWidth: 3, fill: '#FFFFFF' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Action Plan Detailed Phase Cards with Inline Interactive Task Checkmarks */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Interactive Phase Execution &amp; Checkmarks
            </span>
            <p className="text-[11px] text-slate-400 font-medium">
              Click checkboxes directly to mark deliverables done and see the chart recalibrate.
            </p>
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleResetTasks}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tasks ({completedCount})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 1: 30 Days */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left space-y-3 ${
              phases.phase1.isComplete
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-200'
                : selectedMilestone === '30'
                ? 'bg-orange-50/60 border-orange-300 shadow-sm ring-2 ring-orange-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-[#F56B2B] bg-orange-100/80 px-2 py-0.5 rounded-full">
                Phase 1: 30 Days
              </span>
              <span className="text-xs font-black text-[#12233F]">
                Target: {trajectoryPoints.day30.score} Pts
              </span>
            </div>

            <h4 className="text-sm font-bold text-[#12233F]">
              Dispute Filing &amp; Delinquency Stop
            </h4>

            {/* Phase 1 Mini Progress Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="bg-[#F56B2B] h-full transition-all duration-300"
                  style={{
                    width: `${(phases.phase1.completedTasks / Math.max(1, phases.phase1.totalTasks)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  {phases.phase1.completedTasks}/{phases.phase1.totalTasks} Completed
                </span>
                <span className="text-emerald-700">+{phases.phase1.realizedPoints} Pts Secured</span>
              </div>
            </div>

            {/* Tasks with Checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-700">
              {p1Tasks.map((task) => {
                const isDone = Boolean(completedTasks[task.id]);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.title)}
                    className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label="Toggle task"
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[11px] leading-tight block ${
                          isDone ? 'line-through text-slate-500 font-medium' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 shrink-0">
                      +{task.pointImpact}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase 2: 60 Days */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left space-y-3 ${
              phases.phase2.isComplete
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-200'
                : selectedMilestone === '60'
                ? 'bg-blue-50/60 border-blue-300 shadow-sm ring-2 ring-blue-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                Phase 2: 60 Days
              </span>
              <span className="text-xs font-black text-[#12233F]">
                Target: {trajectoryPoints.day60.score} Pts
              </span>
            </div>

            <h4 className="text-sm font-bold text-[#12233F]">
              Utilization Compression &amp; NOC Audit
            </h4>

            {/* Phase 2 Mini Progress Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{
                    width: `${(phases.phase2.completedTasks / Math.max(1, phases.phase2.totalTasks)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  {phases.phase2.completedTasks}/{phases.phase2.totalTasks} Completed
                </span>
                <span className="text-emerald-700">+{phases.phase2.realizedPoints} Pts Secured</span>
              </div>
            </div>

            {/* Tasks with Checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-700">
              {p2Tasks.map((task) => {
                const isDone = Boolean(completedTasks[task.id]);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.title)}
                    className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label="Toggle task"
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[11px] leading-tight block ${
                          isDone ? 'line-through text-slate-500 font-medium' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 shrink-0">
                      +{task.pointImpact}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase 3: 90 Days */}
          <div
            className={`p-5 rounded-2xl border transition-all text-left space-y-3 ${
              phases.phase3.isComplete
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-200'
                : selectedMilestone === '90'
                ? 'bg-emerald-50/60 border-emerald-300 shadow-sm ring-2 ring-emerald-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Phase 3: 90 Days
              </span>
              <span className="text-xs font-black text-[#12233F]">
                Target: {trajectoryPoints.day90.score} Pts
              </span>
            </div>

            <h4 className="text-sm font-bold text-[#12233F]">
              CIR Refresh &amp; Prime Tier Access
            </h4>

            {/* Phase 3 Mini Progress Bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{
                    width: `${(phases.phase3.completedTasks / Math.max(1, phases.phase3.totalTasks)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                <span>
                  {phases.phase3.completedTasks}/{phases.phase3.totalTasks} Completed
                </span>
                <span className="text-emerald-700">+{phases.phase3.realizedPoints} Pts Secured</span>
              </div>
            </div>

            {/* Tasks with Checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-700">
              {p3Tasks.map((task) => {
                const isDone = Boolean(completedTasks[task.id]);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.title)}
                    className={`flex items-start gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      aria-label="Toggle task"
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-[11px] leading-tight block ${
                          isDone ? 'line-through text-slate-500 font-medium' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                      +{task.pointImpact}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {onNavigateToActionPlan && (
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={onNavigateToActionPlan}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#12233F] hover:bg-[#1a325a] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>View Full Interactive Action Plan View</span>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
