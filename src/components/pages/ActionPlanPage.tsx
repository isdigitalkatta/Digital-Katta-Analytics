import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target,
  Trophy,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Sparkles,
  RotateCcw,
  Check,
  CalendarDays,
  ListTodo,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult, ActionPlan } from '../../types';
import { ActionPlanView } from '../ActionPlanView';

interface ActionPlanPageProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  onNavigate: (tab: string) => void;
}

const STRATEGIC_STORAGE_KEY = 'cibil_action_plan_strategic_steps';

const DEFAULT_ACTION_PLAN: ActionPlan = {
  first7Days: [
    'Download and review every line item in this diagnostic breakdown.',
    'Check all active overdue amounts with respective lenders to get exact settlement figures including taxes.',
    'Gather original NOCs, loan closure receipts, and payment statements for any disputable items.',
    'Verify that all personal details (PAN, Address, Mobile) belong strictly to you.',
  ],
  days8To30: [
    'Clear active overdue balances across affected loan and credit card accounts.',
    'Submit formal online dispute requests on the CIBIL Dispute Resolution portal for identified discrepancies.',
    'Reduce credit card balances towards a safe target under 30% of approved credit limits.',
    'Avoid applying for new credit cards, BNPL schemes, or unsecured personal loans.',
  ],
  days31To60: [
    'Follow up with lender Nodal Grievance Officers on dispute ticket status (30-day statutory SLA under RBI guidelines).',
    'Obtain written confirmation or NOC for any accounts settled or cleared during Month 1.',
    'Maintain an unbroken streak of 100% on-time payments across all active credit lines.',
    'Request existing credit card issuers for a complimentary credit limit enhancement without hard inquiries.',
  ],
  days61To90: [
    'Pull a fresh CIBIL score refresh to verify if dispute resolutions and balance reductions have reflected.',
    'Ensure that closed accounts are correctly updated with zero balance and closed status.',
    'Re-calculate your credit utilization percentage and confirm it remains consistently below 30%.',
    'Continue healthy financial discipline: keep older credit card lines active to lengthen average credit history.',
  ],
};

export const ActionPlanPage: React.FC<ActionPlanPageProps> = ({
  report,
  analysis,
  onNavigate,
}) => {
  const [activeView, setActiveView] = useState<'priorities' | 'roadmap'>('priorities');
  
  // Completed strategic steps tracking with local storage persistence
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STRATEGIC_STORAGE_KEY);
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
    type: 'step' | 'all';
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STRATEGIC_STORAGE_KEY, JSON.stringify(completedSteps));
    } catch (err) {
      console.warn('Strategic step storage offline notice:', err);
    }
  }, [completedSteps]);

  const steps = [
    {
      number: 1,
      numberBg: 'bg-[#FF6A00] text-white',
      title: 'Clear Overdue Payments',
      desc: 'Settle pending dues on reported loan accounts as soon as possible to stop further negative 90+ DPD bureau reporting.',
      priority: 'High Priority',
      priorityClass: 'bg-rose-100 text-rose-800 border-rose-200',
      actionLabel: 'View Negative Accounts',
      actionTab: 'negative',
    },
    {
      number: 2,
      numberBg: 'bg-[#EA580C] text-white',
      title: 'Reduce Credit Card Utilization',
      desc: 'Bring revolving card utilization below 30%. Pay more than minimum due each statement cycle to rebuild score velocity.',
      priority: 'High Priority',
      priorityClass: 'bg-rose-100 text-rose-800 border-rose-200',
      actionLabel: 'Check Utilization',
      actionTab: 'utilization',
    },
    {
      number: 3,
      numberBg: 'bg-[#D97706] text-white',
      title: 'Dispute Inaccurate Information',
      desc: 'Raise statutory grievance disputes on incorrect overdue amounts, wrong ownership, or closed loans still marked open.',
      priority: 'Recommended',
      priorityClass: 'bg-amber-100 text-amber-800 border-amber-200',
      actionLabel: 'Raise Dispute Letter',
      actionTab: 'disputes',
    },
    {
      number: 4,
      numberBg: 'bg-[#0284C7] text-white',
      title: 'Avoid Multiple Enquiries',
      desc: 'Limit hard loan and credit card applications for 3 to 6 months to eliminate credit-hungry flags from bureau algorithms.',
      priority: 'Recommended',
      priorityClass: 'bg-amber-100 text-amber-800 border-amber-200',
      actionLabel: 'Review Enquiries',
      actionTab: 'enquiries',
    },
    {
      number: 5,
      numberBg: 'bg-[#16A34A] text-white',
      title: 'Maintain Good Payment History',
      desc: 'Ensure 100% on-time future EMI and card payments on or before the due date to establish an unbroken positive track record.',
      priority: 'Ongoing',
      priorityClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionLabel: 'Payment History',
      actionTab: 'history',
    },
  ];

  const totalSteps = steps.length;
  const completedCount = steps.filter(s => completedSteps[s.number]).length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  const toggleStep = (stepNumber: number, stepTitle: string) => {
    const isNowDone = !completedSteps[stepNumber];

    setCompletedSteps(prev => {
      const updated = {
        ...prev,
        [stepNumber]: isNowDone,
      };

      if (isNowDone) {
        const newCount = steps.filter(s => updated[s.number]).length;
        const newPct = Math.round((newCount / totalSteps) * 100);

        if (newCount === totalSteps) {
          setGratificationToast({
            id: Date.now(),
            title: '🎉 All 5 Strategic Milestones Completed!',
            subtitle: 'Outstanding work! Your credit profile is primed for a 750+ score recovery.',
            type: 'all',
          });
        } else {
          setGratificationToast({
            id: Date.now(),
            title: `✓ "${stepTitle}" Marked Complete!`,
            subtitle: `Strategic Progress: ${newCount} of ${totalSteps} milestones reached (${newPct}%)`,
            type: 'step',
          });
        }

        setTimeout(() => {
          setGratificationToast(current => (current?.id ? null : current));
        }, 2800);
      }

      return updated;
    });
  };

  const handleResetSteps = () => {
    setCompletedSteps({});
    try {
      localStorage.removeItem(STRATEGIC_STORAGE_KEY);
    } catch {}
  };

  const effectiveActionPlan: ActionPlan = analysis?.actionPlan30_60_90 || DEFAULT_ACTION_PLAN;

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-6xl mx-auto pb-10 relative">
      {/* Floating Gratification Toast */}
      <AnimatePresence>
        {gratificationToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-none"
          >
            <div
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 text-left ${
                gratificationToast.type === 'all'
                  ? 'bg-[#12233F] text-white border-emerald-500 shadow-emerald-950/25'
                  : 'bg-[#12233F] text-white border-slate-700 shadow-slate-900/30'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                {gratificationToast.type === 'all' ? (
                  <Trophy className="w-4 h-4 text-amber-300 animate-bounce" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-300" />
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

      {/* 1. Header with View Toggle & Overall Dynamic Progress Tracker */}
      <div className="border-b border-[#E8ECF0] pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
              Your Personalized Action Plan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Complete these targeted actions to improve your CIBIL score and unlock prime loan eligibility.
            </p>
          </div>

          {/* View Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('priorities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'priorities'
                  ? 'bg-white text-[#12233F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-[#FF6A00]" />
              <span>Core 5 Milestones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'roadmap'
                  ? 'bg-white text-[#12233F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>30-60-90 Day Roadmap</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar for Strategic Priorities */}
        {activeView === 'priorities' && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6A00]" />
                <span className="text-xs font-bold text-[#12233F]">
                  Strategic Milestone Completion
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ({completedCount} of {totalSteps} completed)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetSteps}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold text-[#12233F]">
                    {progressPct}%
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Velocity
                  </span>
                </div>
              </div>
            </div>

            {/* Animated Progress Bar with Spring Physics & Gentle Shimmer */}
            <div className="relative">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-[#FF6A00] via-[#EA580C] to-[#16A34A]"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 15, mass: 0.5 }}
                >
                  {/* Gentle shimmer sheen */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  />
                </motion.div>
              </div>

              {/* Milestone Checkpoint Markers */}
              <div className="grid grid-cols-5 gap-1 pt-2">
                {steps.map(step => {
                  const isDone = !!completedSteps[step.number];
                  return (
                    <div
                      key={step.number}
                      className="flex flex-col items-center text-center cursor-pointer group"
                      onClick={() => toggleStep(step.number, step.title)}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                        }`}
                      >
                        {isDone ? <Check className="w-2.5 h-2.5" /> : step.number}
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-1 hidden sm:block">
                        Step {step.number}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Content View: Priorities or Roadmap */}
      {activeView === 'roadmap' ? (
        <ActionPlanView actionPlan={effectiveActionPlan} onNavigate={onNavigate} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 5-Step Timeline with Interactive Completion (lg: 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-[#E8ECF0] shadow-xs">
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute top-6 bottom-6 left-5 w-0.5 bg-slate-200" />

              <div className="space-y-6 sm:space-y-8">
                {steps.map(step => {
                  const isDone = !!completedSteps[step.number];

                  return (
                    <div key={step.number} className="relative flex items-start gap-4 sm:gap-6">
                      {/* Interactive Step Badge */}
                      <button
                        type="button"
                        onClick={() => toggleStep(step.number, step.title)}
                        title={isDone ? 'Mark step as incomplete' : 'Mark step as complete'}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs ring-4 ring-white relative z-10 transition-transform active:scale-95 cursor-pointer ${
                          isDone ? 'bg-emerald-600 text-white ring-emerald-100' : step.numberBg
                        }`}
                      >
                        {isDone ? (
                          <motion.div
                            initial={{ scale: 0.7 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          >
                            <Check className="w-5 h-5 text-white stroke-[2.5]" />
                          </motion.div>
                        ) : (
                          step.number
                        )}
                      </button>

                      {/* Step Content Card with Interactive Checkbox */}
                      <div
                        className={`flex-1 p-4 sm:p-5 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs'
                            : 'bg-slate-50/70 hover:bg-orange-50/40 border-[#E8ECF0]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <h2
                              className={`text-base sm:text-lg font-bold ${
                                isDone ? 'text-emerald-950 line-through opacity-85' : 'text-[#12233F]'
                              }`}
                            >
                              {step.title}
                            </h2>
                            {isDone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Done</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${step.priorityClass}`}
                            >
                              {step.priority}
                            </span>
                          </div>
                        </div>

                        <p
                          className={`text-xs sm:text-sm leading-relaxed mb-3.5 font-medium ${
                            isDone ? 'text-slate-500' : 'text-slate-600'
                          }`}
                        >
                          {step.desc}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
                          <button
                            type="button"
                            onClick={() => onNavigate(step.actionTab)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6A00] hover:text-[#E65F00] hover:underline cursor-pointer"
                          >
                            <span>{step.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => toggleStep(step.number, step.title)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                                : 'bg-white text-slate-700 hover:text-[#FF6A00] border border-slate-200 hover:border-orange-300'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Circle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Mark as Done</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Target Score Card & Dynamic Readiness (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Target Score Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8ECF0] shadow-xs text-left relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shadow-2xs border border-emerald-100">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {completedCount === totalSteps ? '100% Prepared' : `${progressPct}% Action Readiness`}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Goal Benchmark
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#16A34A] font-heading mt-0.5">
                  Target Score 750+
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                  Achievable in <strong>6–12 months</strong> with consistent effort and disciplined repayments.
                </p>
              </div>

              {/* Dynamic Readiness Bar Connected to Tasks */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Discipline Velocity</span>
                  <span className="text-emerald-700 font-bold">{progressPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-600 rounded-full"
                    initial={false}
                    animate={{ width: `${Math.max(progressPct, 10)}%` }}
                    transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {completedCount === 0
                    ? 'Check off milestones as you clear dues and settle disputes.'
                    : completedCount === totalSteps
                    ? 'All strategic items cleared! High eligibility trajectory.'
                    : `${completedCount} of ${totalSteps} milestones done. Keep moving forward!`}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlocks loan interest discounts up to 1.5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Higher pre-approved credit limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant loan sanctions without collateral</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('future-outlook')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Explore Future Outlook Trajectory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Handwritten Style Callout Box */}
            <div className="bg-[#FFF4ED] border border-orange-200 rounded-2xl p-6 shadow-xs relative">
              <div className="text-center">
                <span className="text-[#EA580C] text-sm">✦ ✦ ✦</span>
                <p className="font-handwriting text-2xl font-bold text-[#12233F] mt-1">
                  “Better Credit,<br />
                  <span className="text-[#FF6A00]">Brighter Future!”</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-2 font-medium">
                  Consistent repayment discipline compounds into high creditworthiness.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Green Success Banner with Trophy Icon */}
      <div className="bg-[#EBF9F1] border border-[#B7EBD0] rounded-2xl p-5 sm:p-6 flex items-center gap-4 text-[#16A34A] shadow-xs">
        <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="text-left">
          <h2 className="text-base sm:text-lg font-bold text-[#15803D]">
            {completedCount === totalSteps ? 'All Milestones Cleared!' : 'Stay consistent!'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
            {completedCount === totalSteps
              ? 'You have addressed all major negative factors. Maintain on-time payments for permanent prime standing.'
              : 'Small steps today lead to a high credit score and a big financial future tomorrow.'}
          </p>
        </div>
      </div>
    </div>
  );
};
