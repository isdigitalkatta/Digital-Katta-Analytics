import React from 'react';
import {
  Target,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult } from '../../types';

interface ActionPlanPageProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  onNavigate: (tab: string) => void;
}

export const ActionPlanPage: React.FC<ActionPlanPageProps> = ({
  report,
  analysis,
  onNavigate,
}) => {
  const steps = [
    {
      number: 1,
      numberBg: 'bg-[#FF6A00] text-white',
      title: 'Clear Overdue Payments',
      desc: 'Settle pending dues on 2 loan accounts as soon as possible to stop further negative reporting.',
      priority: 'High Priority',
      priorityClass: 'bg-rose-100 text-rose-800 border-rose-200',
      actionLabel: 'View Negative Accounts',
      actionTab: 'negative',
    },
    {
      number: 2,
      numberBg: 'bg-[#EA580C] text-white',
      title: 'Reduce Credit Card Utilization',
      desc: 'Keep your credit card utilization below 30%. Try to pay more than the minimum amount due each cycle.',
      priority: 'High Priority',
      priorityClass: 'bg-rose-100 text-rose-800 border-rose-200',
      actionLabel: 'Check Utilization',
      actionTab: 'utilization',
    },
    {
      number: 3,
      numberBg: 'bg-[#D97706] text-white',
      title: 'Dispute Inaccurate Information',
      desc: 'Check for any inaccuracies in your report (like incorrect overdue amounts or closed loans reported open) and raise a dispute.',
      priority: 'Recommended',
      priorityClass: 'bg-amber-100 text-amber-800 border-amber-200',
      actionLabel: 'Raise Dispute Letter',
      actionTab: 'disputes',
    },
    {
      number: 4,
      numberBg: 'bg-[#0284C7] text-white',
      title: 'Avoid Multiple Enquiries',
      desc: 'Limit new loan and credit card applications for the next 3 to 6 months to prevent credit hunger flags.',
      priority: 'Recommended',
      priorityClass: 'bg-amber-100 text-amber-800 border-amber-200',
      actionLabel: 'Review Enquiries',
      actionTab: 'enquiries',
    },
    {
      number: 5,
      numberBg: 'bg-[#16A34A] text-white',
      title: 'Maintain Good Payment History',
      desc: 'Make all future EMI and card payments on or before the due date to build a consistent positive track record.',
      priority: 'Ongoing',
      priorityClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      actionLabel: 'Payment History',
      actionTab: 'history',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-6xl mx-auto pb-10">
      {/* 1. Header */}
      <div className="border-b border-[#E8ECF0] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
          Your Personalized Action Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
          Follow these steps to improve your CIBIL score and build a stronger credit profile.
        </p>
      </div>

      {/* 2. Main Grid: 5-Step Timeline (Left) + Target Score & Hand-drawn Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 5-Step Timeline (lg: 8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-[#E8ECF0] shadow-xs">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute top-6 bottom-6 left-5 w-0.5 bg-slate-200" />

            <div className="space-y-8">
              {steps.map((step, idx) => (
                <div key={step.number} className="relative flex items-start gap-4 sm:gap-6">
                  {/* Number Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base shrink-0 shadow-xs ring-4 ring-white relative z-10 ${step.numberBg}`}
                  >
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 bg-slate-50/70 hover:bg-orange-50/40 p-4 sm:p-5 rounded-xl border border-[#E8ECF0] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <h2 className="text-base sm:text-lg font-bold text-[#12233F]">
                        {step.title}
                      </h2>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${step.priorityClass}`}
                      >
                        {step.priority}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3 font-medium">
                      {step.desc}
                    </p>

                    <button
                      type="button"
                      onClick={() => onNavigate(step.actionTab)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6A00] hover:text-[#E65F00] hover:underline cursor-pointer"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Target Score Card & Annotation (lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Target Score Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8ECF0] shadow-xs text-left relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center mb-4 shadow-2xs border border-emerald-100">
              <Target className="w-6 h-6" />
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Goal Benchmark
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#16A34A] font-heading mt-1">
              Target Score 750+
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
              Achievable in <strong>6–12 months</strong> with consistent effort and disciplined repayments.
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
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
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
              <p className="text-[11px] text-slate-600 mt-2">
                Consistent habits compound into high creditworthiness.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Green Success Banner with Trophy Icon */}
      <div className="bg-[#EBF9F1] border border-[#B7EBD0] rounded-2xl p-5 sm:p-6 flex items-center gap-4 text-[#16A34A] shadow-xs">
        <div className="w-12 h-12 rounded-full bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="text-left">
          <h2 className="text-base sm:text-lg font-bold text-[#15803D]">
            Stay consistent!
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
            Small steps today can lead to a big financial future tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
};
