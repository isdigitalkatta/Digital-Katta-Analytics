import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Check,
} from 'lucide-react';
import { ActionPlan } from '../types';

interface ActionPlanViewProps {
  actionPlan: ActionPlan;
  onNavigate?: (tab: string) => void;
}

const STORAGE_KEY = 'cibil_action_plan_306090_tasks';

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({ actionPlan, onNavigate }) => {
  const { t } = useTranslation();
  
  // Checkbox tracking state with localStorage persistence
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Gratification toast state
  const [gratificationToast, setGratificationToast] = useState<{
    id: number;
    title: string;
    subtitle: string;
    type: 'task' | 'milestone' | 'all';
  } | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
      window.dispatchEvent(new Event('cibil_milestone_event'));
    } catch (err) {
      console.warn('Action plan persistence offline:', err);
    }
  }, [completedTasks]);

  const stages = [
    {
      id: 'first7Days',
      title: t('actionPlan.phase1Title', 'First 7 Days (Immediate Action & Audit)'),
      subtitle: 'Gather evidence, verify exact outstanding balances, and check personal identity lines.',
      tasks: actionPlan.first7Days,
      badge: 'Immediate',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'days8To30',
      title: t('actionPlan.phase2Title', 'Days 8 to 30 (Resolution & Dispute Submission)'),
      subtitle: 'Clear active overdue balances, bring card utilization under 30%, and submit formal disputes.',
      tasks: actionPlan.days8To30,
      badge: 'Month 1',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'days31To60',
      title: t('actionPlan.phase3Title', 'Days 31 to 60 (Lender Follow-up & Clean Habit)'),
      subtitle: 'Follow up on 30-day dispute turnaround times, maintain 100% on-time auto-debits, and request limit increases.',
      tasks: actionPlan.days31To60,
      badge: 'Month 2',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'days61To90',
      title: t('actionPlan.phase4Title', 'Days 61 to 90 (Bureau Refresh & Long-term Health)'),
      subtitle: 'Pull updated CIBIL score, verify corrected closed/settled tags, and sustain low debt ratios.',
      tasks: actionPlan.days61To90,
      badge: 'Month 3',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const toggleTask = (taskId: string, taskTitle: string) => {
    const isNowDone = !completedTasks[taskId];

    setCompletedTasks(prev => {
      const updated = {
        ...prev,
        [taskId]: isNowDone,
      };

      if (isNowDone) {
        const newCount = Object.values(updated).filter(Boolean).length;
        const newPct = totalTasks > 0 ? Math.round((newCount / totalTasks) * 100) : 0;

        if (newCount === totalTasks && totalTasks > 0) {
          setGratificationToast({
            id: Date.now(),
            title: '100% Roadmap Completed!',
            subtitle: 'Outstanding work! All 30-60-90 day bureau action items are complete.',
            type: 'all',
          });
        } else if (newPct >= 75 && (!prev[taskId] && progressPct < 75)) {
          setGratificationToast({
            id: Date.now(),
            title: '75% Roadmap Achieved!',
            subtitle: 'You are on the final stretch toward prime score eligibility.',
            type: 'milestone',
          });
        } else if (newPct >= 50 && (!prev[taskId] && progressPct < 50)) {
          setGratificationToast({
            id: Date.now(),
            title: 'Halfway Milestone Reached!',
            subtitle: 'Major negative recovery steps completed with lenders.',
            type: 'milestone',
          });
        } else {
          setGratificationToast({
            id: Date.now(),
            title: 'Task Completed',
            subtitle: `${newCount}/${totalTasks} actions finished (${newPct}% overall progress)`,
            type: 'task',
          });
        }

        // Auto dismiss toast
        setTimeout(() => {
          setGratificationToast(current => (current?.id ? null : current));
        }, 2800);
      }

      return updated;
    });
  };

  const handleReset = () => {
    setCompletedTasks({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Floating Gratification Toast */}
      <AnimatePresence>
        {gratificationToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none"
          >
            <div
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 text-left ${
                gratificationToast.type === 'all'
                  ? 'bg-[#12233F] text-white border-emerald-500/50 shadow-emerald-950/20'
                  : gratificationToast.type === 'milestone'
                  ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20'
                  : 'bg-[#12233F] text-white border-slate-700 shadow-slate-900/30'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                {gratificationToast.type === 'all' ? (
                  <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
                ) : gratificationToast.type === 'milestone' ? (
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-wide">
                  {gratificationToast.title}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {gratificationToast.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Comprehensive Animated Progress Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#FF6A00]" />
              <h2 className="text-xl font-bold text-[#12233F] font-heading">
                {t('actionPlan.title', 'Personalized 30 / 60 / 90-Day Action Plan')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              {t('actionPlan.subtitle', 'Prioritized recovery roadmap tailored specifically to your active overdue, utilization, and account remarks')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reset all completed tasks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-right shrink-0">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-base font-extrabold text-[#12233F]">
                  {progressPct}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Done
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">
                {completedCount} of {totalTasks} {t('actionPlan.stepCompleted', 'Tasks Completed')}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Animated Progress Bar with Spring Physics & Shimmer */}
        <div className="space-y-2 pt-1">
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
            <motion.div
              className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-[#FF6A00] via-[#EA580C] to-[#16A34A]"
              initial={false}
              animate={{ width: `${Math.max(progressPct, 0)}%` }}
              transition={{ type: 'spring', stiffness: 75, damping: 15, mass: 0.5 }}
            >
              {/* Subtle continuous shimmer sheen */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Roadmap Milestones Indicator */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 px-1 pt-0.5">
            <span className={progressPct >= 25 ? 'text-emerald-600 font-semibold' : ''}>
              Audit (Day 1-7)
            </span>
            <span className={progressPct >= 50 ? 'text-emerald-600 font-semibold' : ''}>
              Disputes (Day 8-30)
            </span>
            <span className={progressPct >= 75 ? 'text-emerald-600 font-semibold' : ''}>
              Follow-up (Day 31-60)
            </span>
            <span className={progressPct === 100 ? 'text-emerald-600 font-semibold' : ''}>
              750+ Ready (Day 61-90)
            </span>
          </div>
        </div>
      </div>

      {/* Stages List with Phase-Level Progress Bars */}
      <div className="space-y-5">
        {stages.map((stage, sIdx) => {
          const stageTotal = stage.tasks.length;
          const stageCompleted = stage.tasks.filter((_, tIdx) => completedTasks[`${stage.id}-${tIdx}`]).length;
          const stagePct = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;
          const isStageFinished = stageTotal > 0 && stageCompleted === stageTotal;

          return (
            <div
              key={stage.id}
              className={`bg-white rounded-2xl border transition-colors p-5 sm:p-6 shadow-xs space-y-3.5 ${
                isStageFinished ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                        isStageFinished
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#12233F] text-white'
                      }`}
                    >
                      {isStageFinished ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                    </span>
                    <h3 className="text-base font-bold text-[#12233F] font-heading">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 pl-8 font-medium">
                    {stage.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto pl-8 sm:pl-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {stageCompleted}/{stageTotal}
                  </span>
                </div>
              </div>

              {/* Stage Progress Mini Bar */}
              <div className="pl-0 sm:pl-8 space-y-1">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-600 rounded-full"
                    initial={false}
                    animate={{ width: `${stagePct}%` }}
                    transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                  />
                </div>
              </div>

              {/* Tasks checklist with interactive gratification */}
              <div className="space-y-2.5 pl-0 sm:pl-8 pt-1">
                {stage.tasks.map((task, tIdx) => {
                  const taskId = `${stage.id}-${tIdx}`;
                  const isDone = !!completedTasks[taskId];

                  return (
                    <div
                      key={taskId}
                      onClick={() => toggleTask(taskId, task)}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer text-xs select-none ${
                        isDone
                          ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-500'
                          : 'bg-white border-slate-200/80 hover:border-orange-300 text-slate-800 hover:shadow-2xs'
                      }`}
                    >
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.82 }}
                        className="mt-0.5 shrink-0 cursor-pointer focus:outline-hidden"
                      >
                        {isDone ? (
                          <motion.div
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </motion.div>
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 hover:text-orange-500 transition-colors" />
                        )}
                      </motion.button>
                      <span className={`leading-relaxed font-medium flex-1 ${isDone ? 'line-through opacity-85' : ''}`}>
                        {task}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Done
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cautionary Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong>Bureau Timing Notice:</strong> In India, banks and NBFCs transmit updated credit data to TransUnion CIBIL, Experian, CRIF, and Equifax on a monthly reporting cycle (usually within the first 10-15 days of the succeeding month). Payments or dispute corrections typically reflect on your refreshed bureau report within 30 to 45 days.
        </p>
      </div>
    </div>
  );
};
