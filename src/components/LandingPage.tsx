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
} from 'lucide-react';

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
      title: 'AI Credit Analysis',
      desc: 'Sophisticated diagnosis of payment delays, DPD trends, and high revolving card utilization.',
      color: 'from-blue-500 to-indigo-600',
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
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: CalendarDays,
      title: 'Personalized Action Plan',
      desc: 'A prioritized 30 / 60 / 90-day roadmap targeting fast score stabilization and debt resolution.',
      color: 'from-purple-500 to-indigo-600',
    },
    {
      icon: FileText,
      title: 'AI Letter Generator',
      desc: 'Draft formal, RBI-compliant grievance letters to banks and NBFCs with accurate circular citations.',
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Built for Indian Borrowers & CIBIL Reports
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight mb-4">
            Understand Your CIBIL Report With AI
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Upload your credit report and instantly identify negative accounts, payment issues, utilization problems, potential discrepancies, and the actions you can take to improve your credit profile.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Analyze My Report</span>
            </button>

            <button
              onClick={() => onSelectDemo('stressed')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200/80 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>View Demo</span>
            </button>
          </div>

          {/* Supported formats */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
            <span>Supports:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-semibold">.PDF</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-semibold">.HTML</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono font-semibold">.JSON</span>
            <span>•</span>
            <button
              onClick={onOpenPrivacy}
              className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Privacy Protected</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
            Comprehensive Credit Diagnosis
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Transform confusing 40-page financial bureau PDFs into actionable, transparent intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className={`w-11 h-11 rounded-xl bg-linear-to-tr ${feat.color} flex items-center justify-center text-white mb-4 shadow-sm`}>
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
        <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Data Retention Policy</span>
            </div>
            <h4 className="text-lg font-bold text-white font-heading">
              Your sensitive financial records never stay on our servers.
            </h4>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              PAN numbers and account details are masked on the client side. Uploaded reports are processed in temporary memory and can be permanently wiped with a single click.
            </p>
          </div>

          <button
            onClick={() => onSelectDemo('good')}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            Try Demo with Good Score
          </button>
        </div>
      </section>
    </div>
  );
};
