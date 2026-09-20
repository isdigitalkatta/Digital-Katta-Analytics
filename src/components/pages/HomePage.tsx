import React from 'react';
import {
  Upload,
  BarChart3,
  ListTodo,
  Headphones,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  FileText,
  Quote,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult } from '../../types';
import { MilestoneRewards } from '../MilestoneRewards';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  userName?: string;
  onDownloadPdf?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  report,
  analysis,
  userName = 'Sagar',
  onDownloadPdf,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-6xl mx-auto pb-10">
      {/* 1. Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight flex items-center gap-2">
          Good Morning, {userName} <span className="inline-block animate-wave">👋</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
          Take control of your credit. A better financial future starts here.
        </p>
      </div>

      {/* 2. Hero Card (Peach Background #FFF2E8) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#FFF2E8] border border-orange-200/80 p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Soft radial glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F56B2B]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Text & CTA (7 cols) */}
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#F56B2B] shadow-2xs border border-orange-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Credit Guidance</span>
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#12233F] font-heading leading-tight tracking-tight">
              Know Your CIBIL Score.<br />
              <span className="text-[#F56B2B]">Plan a Brighter Tomorrow!</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-lg">
              Understand factors affecting your credit score, fix errors, and build a personalized plan to improve your financial opportunities.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('my-reports')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF6A00] hover:bg-[#E65F00] text-white font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer transform active:scale-98"
              >
                <span>Upload CIBIL Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('analysis')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-orange-50 text-[#12233F] border-2 border-[#E8ECF0] hover:border-orange-200 font-bold text-sm transition-all cursor-pointer"
              >
                <span>View Current Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('future-outlook')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6A00] border-2 border-orange-200 font-bold text-sm transition-all cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-[#FF6A00]" />
                <span>Future Outlook</span>
              </button>

              {onDownloadPdf && (
                <button
                  type="button"
                  onClick={onDownloadPdf}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-200 font-bold text-sm transition-all cursor-pointer"
                  title="Download AI CIBIL Analysis in PDF"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Graphic: Person holding smartphone with rising upward trend arrow (5 cols) */}
          <div className="md:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-[280px]">
              <svg viewBox="0 0 280 240" fill="none" className="w-full h-auto drop-shadow-sm">
                {/* Soft background circle */}
                <circle cx="140" cy="120" r="100" fill="#FED7AA" opacity="0.4" />

                {/* Smartphone device */}
                <rect x="85" y="30" width="110" height="180" rx="18" fill="#12233F" stroke="#E2E8F0" strokeWidth="3" />
                <rect x="92" y="42" width="96" height="156" rx="12" fill="#FFFFFF" />
                {/* Speaker pill */}
                <rect x="125" y="35" width="30" height="4" rx="2" fill="#94A3B8" />

                {/* Phone screen UI */}
                <rect x="100" y="55" width="80" height="14" rx="4" fill="#FFF2E8" />
                <rect x="100" y="75" width="80" height="40" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
                <text x="140" y="98" textAnchor="middle" fill="#F56B2B" fontSize="16" fontWeight="bold" fontFamily="sans-serif">
                  {report ? report.score.cibilScore : '750+'}
                </text>
                <text x="140" y="110" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="sans-serif">
                  CIBIL SCORE
                </text>

                {/* Mini bar chart on screen */}
                <rect x="105" y="125" width="12" height="25" rx="3" fill="#E2E8F0" />
                <rect x="122" y="120" width="12" height="30" rx="3" fill="#FED7AA" />
                <rect x="139" y="112" width="12" height="38" rx="3" fill="#FDBA74" />
                <rect x="156" y="100" width="12" height="50" rx="3" fill="#F56B2B" />

                {/* Person hand holding phone */}
                <path d="M75 160 C75 145 85 140 95 145 L95 185 C85 190 75 185 75 170 Z" fill="#FBBF24" />
                <path d="M185 145 C195 140 205 145 205 160 C205 175 195 185 185 180 Z" fill="#FBBF24" />

                {/* Rising dynamic Green / Orange Trend Arrow leaping out */}
                <path
                  d="M50 180 Q 110 130 170 70 T 230 40"
                  stroke="#16A34A"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <polygon points="230,40 215,40 226,55" fill="#16A34A" />

                {/* Floating sparkles */}
                <circle cx="230" cy="80" r="4" fill="#F56B2B" />
                <circle cx="65" cy="85" r="3" fill="#16A34A" />
                <circle cx="210" cy="140" r="3" fill="#0284C7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Row of 4 Equal Pastel-Tinted Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Upload Report (Pastel Blue) */}
        <div
          onClick={() => onNavigate('my-reports')}
          className="bg-white rounded-2xl p-5 border border-[#E8ECF0] shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#12233F] group-hover:text-[#0284C7] transition-colors">
            Upload Report
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            PDF, HTML or JSON
          </p>
        </div>

        {/* Card 2: Get Analysis (Pastel Green) */}
        <div
          onClick={() => onNavigate('analysis')}
          className="bg-white rounded-2xl p-5 border border-[#E8ECF0] shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#12233F] group-hover:text-[#16A34A] transition-colors">
            Get Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AI insights & key issues
          </p>
        </div>

        {/* Card 3: Resolution Plan (Pastel Orange) */}
        <div
          onClick={() => onNavigate('action-plan')}
          className="bg-white rounded-2xl p-5 border border-[#E8ECF0] shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#EA580C] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
            <ListTodo className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#12233F] group-hover:text-[#EA580C] transition-colors">
            Resolution Plan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Step-by-step guidance
          </p>
        </div>

        {/* Card 4: Expert Support (Pastel Purple) */}
        <div
          onClick={() => onNavigate('disputes')}
          className="bg-white rounded-2xl p-5 border border-[#E8ECF0] shadow-xs hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-2xs">
            <Headphones className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#12233F] group-hover:text-[#9333EA] transition-colors">
            Expert Support
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            We are with you
          </p>
        </div>
      </div>

      {/* 4. Milestone Rewards Component */}
      <MilestoneRewards
        report={report}
        analysis={analysis}
        onNavigate={onNavigate}
      />

      {/* 5. Green Quote Banner */}
      <div className="bg-[#EBF9F1] border border-[#B7EBD0] rounded-2xl p-5 sm:p-6 flex items-center gap-4 text-[#16A34A] shadow-xs">
        <div className="w-10 h-10 rounded-full bg-white text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
          <Quote className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-sm sm:text-base font-semibold text-[#15803D]">
            “A healthy credit profile opens doors to bigger opportunities.”
          </p>
          <p className="text-xs font-bold text-[#16A34A] mt-0.5">
            — Digital Katta
          </p>
        </div>
      </div>
    </div>
  );
};
