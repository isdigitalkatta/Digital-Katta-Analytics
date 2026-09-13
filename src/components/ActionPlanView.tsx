import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ActionPlan } from '../types';

interface ActionPlanViewProps {
  actionPlan: ActionPlan;
}

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({ actionPlan }) => {
  // Checkbox tracking state
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const stages = [
    {
      id: 'first7Days',
      title: 'First 7 Days (Immediate Action & Audit)',
      subtitle: 'Gather evidence, verify exact outstanding balances, and check personal identity lines.',
      tasks: actionPlan.first7Days,
      badge: 'Immediate',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'days8To30',
      title: 'Days 8 to 30 (Resolution & Dispute Submission)',
      subtitle: 'Clear active overdue balances, bring card utilization under 30%, and submit formal disputes.',
      tasks: actionPlan.days8To30,
      badge: 'Month 1',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'days31To60',
      title: 'Days 31 to 60 (Lender Follow-up & Clean Habit)',
      subtitle: 'Follow up on 30-day dispute turnaround times, maintain 100% on-time auto-debits, and request limit increases.',
      tasks: actionPlan.days31To60,
      badge: 'Month 2',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
      id: 'days61To90',
      title: 'Days 61 to 90 (Bureau Refresh & Long-term Health)',
      subtitle: 'Pull updated CIBIL score, verify corrected closed/settled tags, and sustain low debt ratios.',
      tasks: actionPlan.days61To90,
      badge: 'Month 3',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  ];

  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Personalized 30 / 60 / 90-Day Action Plan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized recovery roadmap tailored specifically to your active overdue, utilization, and account remarks
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 block">
              {completedCount} of {totalTasks} Completed
            </span>
            <span className="text-[10px] text-slate-500">{progressPct}% of roadmap</span>
          </div>
          <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stages List */}
      <div className="space-y-5">
        {stages.map((stage, sIdx) => (
          <div
            key={stage.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {sIdx + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {stage.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 pl-8">
                  {stage.subtitle}
                </p>
              </div>
              <span className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.badgeColor}`}>
                {stage.badge}
              </span>
            </div>

            {/* Tasks checklist */}
            <div className="space-y-2 pl-2 sm:pl-8">
              {stage.tasks.map((task, tIdx) => {
                const taskId = `${stage.id}-${tIdx}`;
                const isDone = !!completedTasks[taskId];

                return (
                  <div
                    key={taskId}
                    onClick={() => toggleTask(taskId)}
                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer text-xs select-none ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200/80 hover:border-blue-300 text-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-blue-600 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                    <span className="leading-relaxed">{task}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cautionary Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Bureau Timing Notice:</strong> In India, banks and NBFCs transmit updated credit data to TransUnion CIBIL, Experian, CRIF, and Equifax on a monthly reporting cycle (usually within the first 10-15 days of the succeeding month). Payments or dispute corrections typically reflect on your refreshed bureau report within 30 to 45 days.
        </p>
      </div>
    </div>
  );
};
