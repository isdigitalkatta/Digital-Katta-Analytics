import React from 'react';
import {
  ShieldAlert,
  BrainCircuit,
  History,
  FileCheck2,
  CalendarDays,
  FileText,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface LandingPageProps {
  onOpenUpload: () => void;
  onSelectDemo: (demoId: 'stressed' | 'good') => void;
  onOpenPrivacy: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenUpload,
  onSelectDemo,
  onOpenPrivacy,
}) => {
  const features = [
    {
      icon: BrainCircuit,
      title: 'AI Credit Diagnosis',
      desc: 'Sophisticated diagnosis of payment delays, DPD trends, and high revolving card utilization.',
      color: 'from-teal-600 to-emerald-700',
    },
    {
      icon: ShieldAlert,
      title: 'Negative Account Detection',
      desc: 'Automatic identification of Written-off, Settled, Delinquent, and Suit-filed accounts with severity flags.',
      color: 'from-rose-500 to-red-600',
    },
    {
      icon: History,
      title: 'Payment History Analysis',
      desc: 'Interactive visual heatmap of 30+, 60+, and 90+ DPD delays mapped month-by-month across your accounts.',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: FileCheck2,
      title: 'Dispute Opportunity Detection',
      desc: 'Uncover potential inaccuracies such as active status on closed loans, wrong overdues, or duplicate accounts.',
      color: 'from-emerald-600 to-teal-700',
    },
    {
      icon: CalendarDays,
      title: 'Personalized Action Plan',
      desc: 'A prioritized 30 / 60 / 90-day roadmap targeting fast score stabilization and debt resolution.',
      color: 'from-purple-600 to-indigo-700',
    },
    {
      icon: FileText,
      title: 'AI Letter Generator',
      desc: 'Draft formal, RBI-compliant grievance letters to banks and NBFCs with accurate circular citations.',
      color: 'from-cyan-600 to-blue-700',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#329691] text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20">
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Prominent Company Logo Display */}
          <div className="inline-flex flex-col items-center justify-center mb-6">
            <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl border border-white/40 transform hover:scale-105 transition-all duration-300">
              <CompanyLogo size="hero" showTagline={true} />
            </div>
            <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/30 text-white text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Official CIBIL & Credit Report Intelligence Portal</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-heading leading-tight mb-4 drop-shadow-xs">
            Understand Your CIBIL Report With AI
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-teal-50 max-w-2xl mx-auto leading-relaxed mb-8">
            Upload your credit report and instantly identify negative accounts, payment issues, utilization problems, potential discrepancies, and step-by-step actions to build a 750+ score.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white hover:bg-teal-50 text-[#1f6360] font-extrabold text-sm shadow-xl shadow-teal-950/20 transition-all cursor-pointer transform active:scale-95"
            >
              <UploadCloud className="w-5 h-5 text-[#329691]" />
              <span>Analyze My Credit Report</span>
            </button>

            <button
              onClick={() => onSelectDemo('stressed')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-950/30 hover:bg-teal-950/50 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-amber-300" />
              <span>Try Stressed Demo</span>
            </button>

            <button
              onClick={() => onSelectDemo('good')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-950/30 hover:bg-teal-950/50 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Try Good Score Demo</span>
            </button>
          </div>

          {/* Supported formats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-teal-100">
            <span>Compatible with:</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-md text-white font-mono font-bold">.PDF</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-md text-white font-mono font-bold">.HTML</span>
            <span className="bg-white/20 px-2.5 py-0.5 rounded-md text-white font-mono font-bold">.JSON</span>
            <span>•</span>
            <button
              onClick={onOpenPrivacy}
              className="text-white underline hover:text-teal-200 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>100% Privacy Protected (Client-Side Parsing)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid on #329691 background */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
            Comprehensive Credit Diagnosis
          </h2>
          <p className="text-sm text-teal-100 mt-1 max-w-xl mx-auto">
            Transform confusing 40-page financial bureau documents into actionable, transparent intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-teal-800/20 p-6 shadow-md hover:shadow-xl transition-all text-slate-900 group"
              >
                <div className={`w-11 h-11 rounded-xl bg-linear-to-tr ${feat.color} flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-heading mb-1.5">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust & Privacy Statement Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl p-6 sm:p-8 border border-white/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Zero-Data Retention Policy</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 font-heading">
              Your sensitive financial records are completely confidential.
            </h4>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              PAN numbers and account identifiers are masked automatically. Uploaded reports are processed in temporary memory and can be permanently wiped with a single click.
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="shrink-0 px-6 py-3 rounded-xl bg-[#329691] hover:bg-[#25736f] text-white text-xs font-bold shadow-md shadow-teal-900/20 transition-all cursor-pointer"
          >
            Upload Report Now
          </button>
        </div>
      </section>
    </div>
  );
};
