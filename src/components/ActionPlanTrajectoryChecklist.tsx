import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  PlanTaskItem,
  TrajectoryCalculationResult,
} from '../utils/actionPlanTasks';

export interface ActionPlanTrajectoryChecklistProps {
  tasks: PlanTaskItem[];
  completedTasks: Record<string, boolean>;
  onToggleTask: (taskId: string, title: string) => void;
  onResetTasks: () => void;
  onBatchTogglePhase?: (phaseGroup: 'phase1' | 'phase2' | 'phase3', markComplete: boolean) => void;
  trajectoryResult: TrajectoryCalculationResult;
  className?: string;
  onNavigateToActionPlan?: () => void;
}

export const ActionPlanTrajectoryChecklist: React.FC<ActionPlanTrajectoryChecklistProps> = ({
  tasks,
  completedTasks,
  onToggleTask,
  onResetTasks,
  onBatchTogglePhase,
  trajectoryResult,
  className = '',
  onNavigateToActionPlan,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'phase1' | 'phase2' | 'phase3'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.phaseGroup === activeFilter;
  });

  const {
    baselineScore,
    realizedScore,
    totalRealizedPoints,
    completedCount,
    totalTaskCount,
    completionPercentage,
    phases,
    trajectoryPoints,
  } = trajectoryResult;

  const handleTogglePhase = (phaseGroup: 'phase1' | 'phase2' | 'phase3') => {
    if (!onBatchTogglePhase) return;
    const phaseTasks = tasks.filter((t) => t.phaseGroup === phaseGroup);
    const allDone = phaseTasks.every((t) => completedTasks[t.id]);
    onBatchTogglePhase(phaseGroup, !allDone);
  };

  return (
    <div
      className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs text-left space-y-6 ${className}`}
    >
      {/* 1. Header with Live Real-Time Impact Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Trajectory Driver</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {completedCount} of {totalTaskCount} Completed
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#12233F] font-heading mt-2">
            Action Plan Completion Checklist
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Mark off completed recovery tasks to see their direct, real-time boost on your 30/60/90-day CIBIL trajectory.
          </p>
        </div>

        {/* Global Reset Button */}
        {completedCount > 0 && (
          <button
            type="button"
            onClick={onResetTasks}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer self-start sm:self-auto shrink-0 bg-slate-50 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Checked Tasks</span>
          </button>
        )}
      </div>

      {/* 2. Interactive Real-Time Impact Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FFF8F0] via-orange-50/40 to-emerald-50/40 border border-orange-200/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F56B2B] flex items-center justify-center font-black shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Score Impact Unlocked
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#12233F] font-heading tabular-nums">
                  {realizedScore}
                </span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  +{totalRealizedPoints} Pts Realized
                </span>
                <span className="text-[11px] text-slate-500">
                  (Baseline: {baselineScore})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                90-Day Projected
              </span>
              <span className="text-base font-extrabold text-emerald-700 tabular-nums">
                {trajectoryPoints.day90.score} Pts
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Progress
              </span>
              <span className="text-base font-extrabold text-[#F56B2B] tabular-nums">
                {completionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
            <div
              className="bg-[#F56B2B] h-full transition-all duration-300"
              style={{
                width: `${(phases.phase1.completedTasks / Math.max(1, totalTaskCount)) * 100}%`,
              }}
              title="Phase 1 Tasks"
            />
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${(phases.phase2.completedTasks / Math.max(1, totalTaskCount)) * 100}%`,
              }}
              title="Phase 2 Tasks"
            />
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{
                width: `${(phases.phase3.completedTasks / Math.max(1, totalTaskCount)) * 100}%`,
              }}
              title="Phase 3 Tasks"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1 text-[#F56B2B]">
              <span className="w-2 h-2 rounded-full bg-[#F56B2B]" />
              Phase 1 (Days 1–30): {phases.phase1.completedTasks}/{phases.phase1.totalTasks}
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Phase 2 (Days 31–60): {phases.phase2.completedTasks}/{phases.phase2.totalTasks}
            </span>
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Phase 3 (Days 61–90): {phases.phase3.completedTasks}/{phases.phase3.totalTasks}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Phase Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-[#12233F] shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            All Action Tasks ({tasks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('phase1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'phase1'
                ? 'bg-[#F56B2B] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            <span>Phase 1 (30 Days)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === 'phase1' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {phases.phase1.completedTasks}/{phases.phase1.totalTasks}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('phase2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'phase2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            <span>Phase 2 (60 Days)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === 'phase2' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {phases.phase2.completedTasks}/{phases.phase2.totalTasks}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('phase3')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'phase3'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-[#12233F]'
            }`}
          >
            <span>Phase 3 (90 Days)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === 'phase3' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {phases.phase3.completedTasks}/{phases.phase3.totalTasks}
            </span>
          </button>
        </div>

        {/* Phase Batch Toggle Shortcut */}
        {activeFilter !== 'all' && onBatchTogglePhase && (
          <button
            type="button"
            onClick={() => handleTogglePhase(activeFilter)}
            className="text-xs font-bold text-slate-600 hover:text-[#12233F] transition-colors cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            {phases[activeFilter].isComplete
              ? `Uncheck All ${phases[activeFilter].timeframe}`
              : `Mark All ${phases[activeFilter].timeframe} Complete`}
          </button>
        )}
      </div>

      {/* 4. Interactive Checklist Cards */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isDone = Boolean(completedTasks[task.id]);

          return (
            <motion.div
              key={task.id}
              layout="position"
              onClick={() => onToggleTask(task.id, task.title)}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.995 }}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3.5 select-none ${
                isDone
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Custom Animated Checkbox Button with Framer Motion */}
                <motion.div
                  className="relative mt-0.5 shrink-0 flex items-center justify-center"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                >
                  {/* Subtle pulse ripple ring on check */}
                  {isDone && (
                    <motion.span
                      initial={{ scale: 0.7, opacity: 0.8 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-lg bg-emerald-400/40 pointer-events-none"
                    />
                  )}

                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'border-2 border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isDone && (
                        <motion.svg
                          key="checked-tick"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4 text-white"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                        >
                          <motion.path
                            d="M 5 12 L 10 17 L 19 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                          />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Task Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        task.phaseGroup === 'phase1'
                          ? 'bg-orange-100 text-[#F56B2B]'
                          : task.phaseGroup === 'phase2'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {task.timeframeLabel}
                    </span>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {task.category}
                    </span>

                    <AnimatePresence>
                      {isDone && (
                        <motion.span
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                          className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed • Active in Trajectory</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <p
                    className={`text-xs font-bold leading-snug transition-colors ${
                      isDone ? 'text-slate-800 line-through opacity-85' : 'text-[#12233F]'
                    }`}
                  >
                    {task.title}
                  </p>
                </div>
              </div>

              {/* Point Boost Pill with motion */}
              <div className="shrink-0 text-right">
                <motion.span
                  layout
                  className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-[#12233F] border border-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>+{task.pointImpact} Pts</span>
                </motion.span>
                <span className="block text-[9px] font-semibold text-slate-400 mt-0.5">
                  {isDone ? 'Secured' : 'Projected'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5. Footer Quick Links */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Checklist tasks stay synchronized with your main <strong>30/60/90 Action Plan</strong>.
          </span>
        </div>

        {onNavigateToActionPlan && (
          <button
            type="button"
            onClick={onNavigateToActionPlan}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#F56B2B] hover:text-[#E05A1D] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Open Comprehensive Action Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
