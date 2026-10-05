import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Clock,
  PieChart,
  ShieldCheck,
  Download,
  Loader2,
  FileCheck,
  Printer,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Layers,
  MapPin,
  Scale,
  Sparkles,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult, CreditAccount, DisputeOpportunity } from '../../types';
import { downloadAiAnalysisReportPdf } from '../../utils/pdfExport';
import { scanReportForClericalErrors } from '../../utils/clericalErrorScanner';
import { useAppLanguage } from '../../hooks/useAppLanguage';
import { AccountsListView } from '../AccountsListView';

interface AnalysisPageProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  onNavigate: (tab: string) => void;
  onDraftLetter?: (account: CreditAccount) => void;
  onDraftDisputeLetter?: (dispute: DisputeOpportunity) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  report,
  analysis,
  onNavigate,
  onDraftLetter,
  onDraftDisputeLetter,
}) => {
  const { t } = useAppLanguage();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Auto-scan uploaded report for clerical errors to identify Instant Dispute candidates
  const instantDisputes =
    (analysis?.disputeOpportunities || []).filter((d) => d.isInstantDisputeCandidate || d.isClericalError).length > 0
      ? (analysis?.disputeOpportunities || []).filter((d) => d.isInstantDisputeCandidate || d.isClericalError)
      : report
      ? scanReportForClericalErrors(report)
      : [];

  const duplicateCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'DUPLICATE_ACCOUNT' || d.issue.toLowerCase().includes('duplicate')
  ).length;
  const addressCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'ADDRESS_INACCURACY' || d.issue.toLowerCase().includes('address') || d.issue.toLowerCase().includes('pin')
  ).length;
  const dobCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'DATE_OF_BIRTH_MISMATCH' || d.issue.toLowerCase().includes('birth') || d.issue.toLowerCase().includes('under age')
  ).length;
  const ledgerCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'MATHEMATICAL_LEDGER' || d.issue.toLowerCase().includes('balance') || d.issue.toLowerCase().includes('zero')
  ).length;

  // Score determination (Dynamic with fallback to mockup 642)
  const score = report?.score?.cibilScore ?? report?.score?.score ?? 642;
  const scoreDate = report?.score?.scoreDate || '12 Sep 2026';

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setDownloadSuccess(false);
    setDownloadProgress('Preparing analysis...');

    try {
      await downloadAiAnalysisReportPdf(report, analysis, {
        onProgress: (status) => setDownloadProgress(status),
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate PDF analysis report:', err);
      alert('Unable to generate PDF at this moment. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress('');
    }
  };

  const getScoreMeta = (s: number) => {
    if (s >= 750) {
      return {
        status: 'Excellent',
        pillBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        strokeColor: '#16A34A',
        insight: 'Your score is in the Excellent range! You qualify for premier interest rates and top-tier cards.',
      };
    }
    if (s >= 700) {
      return {
        status: 'Good',
        pillBg: 'bg-blue-100 text-blue-800 border-blue-300',
        strokeColor: '#2563EB',
        insight: 'Your score is healthy. Minor tweaks will push you into the 750+ elite tier.',
      };
    }
    if (s >= 650) {
      return {
        status: 'Fair',
        pillBg: 'bg-amber-100 text-amber-800 border-amber-300',
        strokeColor: '#D97706',
        insight: 'Your score is moderate. A few overdue balances are currently capping your credit limits.',
      };
    }
    return {
      status: 'Needs Improvement',
      pillBg: 'bg-rose-100 text-rose-800 border-rose-300',
      strokeColor: '#E11D48',
      insight: 'Your score is in the Needs Improvement range. Overdue payments and high utilization on your accounts are pulling it down.',
    };
  };

  const meta = getScoreMeta(score);

  // Dynamic stats with mock defaults
  const negativeCount = analysis?.negativeAccounts?.length ?? 4;
  const latePaymentsCount = analysis?.paymentHistoryAnalysis?.lateCount ?? 2;
  const utilizationPercent = analysis?.utilizationMix?.aggregateUtilization ?? 32;
  const historyYears = report?.accounts?.[0]?.openedDate
    ? Math.max(1, new Date().getFullYear() - new Date(report.accounts[0].openedDate).getFullYear())
    : 6;

  // Gauge angle calculation (300 to 900 maps to 0 to 180 degrees)
  const normalizedAngle = Math.min(180, Math.max(0, ((score - 300) / (900 - 300)) * 180));

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-6xl mx-auto pb-10">
      {/* 1. Page Header with Prominent PDF Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8ECF0] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
            {t('dashboard.scoreCardTitle', 'CIBIL Report Analysis')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {t('dashboard.criticalIssuesSubtitle', "Here's your credit health summary based on your uploaded report.")}
          </p>
        </div>

        {/* Action Controls: Report Date + Download AI Analysis PDF Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E8ECF0] text-xs font-semibold text-slate-600 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Report Date: {scoreDate}</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-md ${
              downloadSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-[#FF6A00] hover:bg-[#E65F00] text-white shadow-orange-500/20 active:scale-98'
            } disabled:opacity-60`}
            title="Download full AI Credit Health & Dispute Analysis in PDF"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{downloadProgress || 'Preparing PDF...'}</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t('common.downloadAiPdf', 'Download AI Analysis (PDF)')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Score Card & Adjacent Score Insight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Semicircular Gauge Score Card (lg: 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#E8ECF0] shadow-xs flex flex-col items-center justify-between text-center relative">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Bureau Metric</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${meta.pillBg}`}>
              {meta.status}
            </span>
          </div>

          {/* Semicircular SVG Gauge */}
          <div className="relative w-64 sm:w-72 h-36 sm:h-40 flex items-center justify-center mt-2">
            <svg className="w-full h-full" viewBox="0 0 200 115">
              <defs>
                <linearGradient id="scoreGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E11D48" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="70%" stopColor="#84CC16" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Background Arch */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Animated Gradient Track with Framer Motion */}
              <motion.path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#scoreGaugeGrad)"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.95"
                strokeDasharray={Math.PI * 80}
                initial={{ strokeDashoffset: Math.PI * 80 }}
                animate={{
                  strokeDashoffset:
                    Math.PI * 80 * (1 - Math.min(1, Math.max(0, (score - 300) / (900 - 300)))),
                }}
                transition={{
                  duration: 1.25,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />

              {/* Animated Indicator Needle with Framer Motion */}
              <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: normalizedAngle - 90 }}
                transition={{
                  type: 'spring',
                  stiffness: 55,
                  damping: 14,
                  delay: 0.15,
                }}
                style={{ transformOrigin: '100px 100px' }}
              >
                <line x1="100" y1="100" x2="100" y2="30" stroke="#12233F" strokeWidth="4" strokeLinecap="round" />
                <circle cx="100" cy="100" r="7" fill="#12233F" />
                <circle cx="100" cy="100" r="3" fill="#FFFFFF" />
              </motion.g>

              {/* Needle pivot baseline */}
              <circle cx="100" cy="100" r="10" fill="#12233F" opacity="0.1" />
            </svg>

            {/* Score in Center with Spring Entrance */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 18,
                delay: 0.25,
              }}
              className="absolute bottom-1 flex flex-col items-center"
            >
              <span className="text-4xl sm:text-5xl font-extrabold text-[#12233F] tracking-tight font-heading">
                {score}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Your CIBIL Score
              </span>
            </motion.div>
          </div>

          {/* Min / Max Labels */}
          <div className="w-full flex items-center justify-between px-8 text-xs font-bold text-slate-400 mt-2">
            <span>300 (Poor)</span>
            <span>900 (Excellent)</span>
          </div>
        </div>

        {/* Right: Score Insight Card (Peach Background #FFF4ED, lg: 5 cols) */}
        <div className="lg:col-span-5 bg-[#FFF4ED] rounded-2xl p-6 sm:p-8 border border-orange-200/80 shadow-xs flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-white text-[#FF6A00] flex items-center justify-center shadow-xs border border-orange-200/60">
              <Lightbulb className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#12233F] font-heading">
                {t('dashboard.criticalIssuesTitle', 'Score Insight')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed font-medium">
                {meta.insight}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => onNavigate('action-plan')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E65F00] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer transform active:scale-98"
            >
              <span>{t('home.viewAnalysisBtn', 'View Detailed Analysis')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Row of 4 Compact Stat Cards (Pastel Tints) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Stat 1: Negative Accounts (Red Pastel) */}
        <div className="bg-[#FFF0F0] border border-red-200/70 rounded-2xl p-5 shadow-xs text-left">
          <div className="w-10 h-10 rounded-full bg-white text-[#E53E3E] flex items-center justify-center shadow-2xs mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#E53E3E] font-heading">
            {negativeCount}
          </div>
          <div className="text-xs font-bold text-[#12233F] mt-0.5">
            {t('negative.title', 'Negative Accounts')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Require attention
          </div>
        </div>

        {/* Stat 2: Late Payments (Orange Pastel) */}
        <div className="bg-[#FFF2E8] border border-orange-200/70 rounded-2xl p-5 shadow-xs text-left">
          <div className="w-10 h-10 rounded-full bg-white text-[#EA580C] flex items-center justify-center shadow-2xs mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#EA580C] font-heading">
            {latePaymentsCount}
          </div>
          <div className="text-xs font-bold text-[#12233F] mt-0.5">
            Late Payments
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            In last 24 months
          </div>
        </div>

        {/* Stat 3: Credit Utilization (Blue Pastel) */}
        <div className="bg-[#EBF3FF] border border-blue-200/70 rounded-2xl p-5 shadow-xs text-left">
          <div className="w-10 h-10 rounded-full bg-white text-[#2563EB] flex items-center justify-center shadow-2xs mb-3">
            <PieChart className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] font-heading">
            {utilizationPercent}%
          </div>
          <div className="text-xs font-bold text-[#12233F] mt-0.5">
            {t('dashboard.utilization', 'Credit Utilization')}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Recommended &lt; 30%
          </div>
        </div>

        {/* Stat 4: Credit History (Green Pastel) */}
        <div className="bg-[#EBF9F1] border border-emerald-200/70 rounded-2xl p-5 shadow-xs text-left">
          <div className="w-10 h-10 rounded-full bg-white text-[#16A34A] flex items-center justify-center shadow-2xs mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] font-heading">
            {historyYears} yrs
          </div>
          <div className="text-xs font-bold text-[#12233F] mt-0.5">
            Credit History
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
            Good length
          </div>
        </div>
      </div>

      {/* CLERICAL ERROR AUTO-SCANNER SPOTLIGHT: INSTANT DISPUTE CANDIDATES */}
      {instantDisputes.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs tracking-wide">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  AUTOMATED SCANNER: CLERICAL ERRORS DETECTED
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ⚡ {instantDisputes.length} Instant Dispute Candidates
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Section 21 CICRA 2005 Fast-Track
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
                {instantDisputes.length} Objective Clerical Inconsistencies Found in Your Uploaded Report
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Our verification engine automatically scanned your trade lines, identity headers, and ledger balances and flagged{' '}
                <strong className="text-slate-900 font-bold">{instantDisputes.length} objective clerical errors</strong> (e.g.{' '}
                {duplicateCount > 0 && `${duplicateCount} duplicate trade line(s), `}
                {addressCount > 0 && `${addressCount} address/PIN code mismatch(es), `}
                {dobCount > 0 && `${dobCount} date of birth / underage record(s), `}
                {ledgerCount > 0 && `${ledgerCount} zero-balance overdue contradiction(s)`}
                ). These represent the <strong>fastest path to score recovery</strong> because Indian credit bureaus
                are legally bound under Section 21 of CICRA 2005 to expunge verifiable clerical mistakes within 30 days.
              </p>

              {/* Categorical breakdown pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold">
                {duplicateCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 border border-amber-200 text-amber-900 shadow-2xs">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    Duplicate Trade Lines: {duplicateCount}
                  </span>
                )}
                {addressCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 border border-blue-200 text-blue-900 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Address / PIN Inaccuracies: {addressCount}
                  </span>
                )}
                {dobCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 border border-rose-200 text-rose-900 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    DOB / Age Inconsistencies: {dobCount}
                  </span>
                )}
                {ledgerCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 border border-emerald-200 text-emerald-900 shadow-2xs">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    Ledger &amp; Overdue Glitches: {ledgerCount}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('disputes')}
                className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Review &amp; Launch Instant Disputes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-600 text-center">
                <span className="font-bold text-slate-800">Statutory 30-Day Resolution</span>
                <p className="text-[10px] text-slate-500">₹100/day compensation for delay</p>
              </div>
            </div>
          </div>

          {/* Preview grid of instant dispute candidates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {instantDisputes.slice(0, 3).map((disp) => {
              const details = disp.clericalDetails;
              return (
                <div
                  key={disp.id}
                  className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs space-y-2.5 flex flex-col justify-between hover:border-amber-300 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        <Zap className="w-3 h-3 text-amber-600 fill-amber-500" />
                        INSTANT DISPUTE
                      </span>
                      {details?.estimatedScoreImpactPoints && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{details.estimatedScoreImpactPoints} pts
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {disp.issue}
                    </h4>

                    {details?.foundValue && (
                      <div className="text-[10.5px] bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                        <div>
                          <span className="text-slate-500 block font-semibold">Found in Report:</span>
                          <span className="font-mono text-rose-700">{details.foundValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-semibold">Contradicts Standard:</span>
                          <span className="font-mono text-emerald-700">{details.expectedOrContradictingValue}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {disp.whyInconsistent}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Fast-Track: ~{details?.resolutionTimeframeDays || 15} Days
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('disputes')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer"
                    >
                      <span>Draft Notice</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Two-Column List Section: Key Issues vs Good Things */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Key Issues Affecting Your Score */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8ECF0] shadow-xs text-left">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#12233F] font-heading">
              Key Issues Affecting Your Score
            </h2>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Overdue payment recorded on Personal Loan account (₹42,500 pending).
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Credit card utilization peaked at 68%, exceeding recommended 30% ratio.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                3 Hard enquiries logged in the last 6 months triggering temporary score dips.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Account status flagged as 'Settled' rather than closed in regular order.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Good Things */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E8ECF0] shadow-xs text-left">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#12233F] font-heading">
              Good Things
            </h2>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                100% on-time payment track record on Axis Bank Home Loan account.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Long credit profile history exceeding 6 years demonstrating long-term stability.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Healthy mix between secured (housing) and unsecured credit facilities.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                No written-off accounts or legal suit filings recorded in past 12 months.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Account List View with Bank Name Search & Status Filter */}
      <div id="accounts-section" className="scroll-mt-6">
        <AccountsListView
          accounts={report?.accounts || []}
          onDraftLetter={onDraftLetter || ((acc) => onNavigate('letter'))}
          onNavigateHistory={() => onNavigate('history')}
          title="Credit Accounts & Facilities Inventory"
          description="Search specific credit facilities by bank name (e.g., HDFC, SBI, Axis, Bajaj) or filter by reported status (Active, Overdue, Settled, Written-off, Closed)."
        />
      </div>

      {/* 6. Top Key Points to Improve Credit Score (Highlight Section) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8ECF0] shadow-xs text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#12233F] font-heading flex items-center gap-2">
                <span>Top Key Points to Improve Credit Score</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  +120-175 Pts Potential
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Prioritized recovery levers ranked by bureau score impact, dispute feasibility, and statutory timelines:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#FF6A00] bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200/60 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to PDF</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {[
            {
              priority: 'PRIORITY 1',
              title: 'Rectify Overdue Delinquencies & Disputed DPD Accounts',
              gain: '+40 to +65 Pts',
              pillBg: 'bg-rose-50 text-rose-700 border-rose-200',
              gainBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Initiate OTS settlement letters or formal Section 21 dispute notices for 30/60/90+ DPD accounts to halt immediate negative scoring decay.',
              actionTab: 'negative',
              actionLabel: 'View Negative Accounts',
            },
            {
              priority: 'PRIORITY 2',
              title: 'Compress Revolving Credit Card Utilization to < 30%',
              gain: '+25 to +45 Pts',
              pillBg: 'bg-orange-50 text-orange-700 border-orange-200',
              gainBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Pay down high-utilization card balances prior to the monthly billing cycle generation date to restore bureau health scores.',
              actionTab: 'utilization',
              actionLabel: 'View Utilization Mix',
            },
            {
              priority: 'PRIORITY 3',
              title: 'Challenge Inaccurate / Non-Consensual Hard Enquiries',
              gain: '+15 to +25 Pts',
              pillBg: 'bg-blue-50 text-blue-700 border-blue-200',
              gainBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Dispute unauthorized lender credit pulls made within the last 90 days directly with TransUnion CIBIL under CICRA Act 2005.',
              actionTab: 'enquiries',
              actionLabel: 'Check Enquiries',
            },
            {
              priority: 'PRIORITY 4',
              title: 'Automate 100% Repayments via NACH / e-Mandates',
              gain: '+30 to +50 Pts',
              pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              gainBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Ensure zero missed EMI dates across active home, auto, or personal loans to establish continuous positive repayment velocity.',
              actionTab: 'history',
              actionLabel: 'Payment Heatmap',
            },
            {
              priority: 'PRIORITY 5',
              title: 'Preserve Seasoned Credit Accounts & Diversify Debt Mix',
              gain: '+10 to +20 Pts',
              pillBg: 'bg-slate-100 text-slate-700 border-slate-200',
              gainBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              desc: 'Keep oldest credit cards active with nominal recurring spends to lengthen average credit tenure and optimize secured vs unsecured balance.',
              actionTab: 'accounts',
              actionLabel: 'Review Accounts',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border ${item.pillBg}`}>
                    {item.priority}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {item.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${item.gainBg}`}>
                    {item.gain}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (item.actionTab === 'accounts') {
                    const el = document.getElementById('accounts-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      return;
                    }
                  }
                  onNavigate(item.actionTab);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#12233F] bg-slate-100 hover:bg-[#12233F] hover:text-white transition-all shrink-0 cursor-pointer self-start sm:self-center"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Comprehensive PDF Report Download Banner */}
      <div className="rounded-2xl bg-linear-to-br from-[#12233F] to-[#1E3A8A] text-white p-6 sm:p-8 border border-blue-900/60 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-200 text-xs font-bold border border-white/15">
            <Download className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>Official Client Documentation</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-white tracking-tight">
            Download Complete AI Credit Analysis (PDF)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Get an executive 2-page formatted credit health document including your CIBIL score tier, critical delinquency flags, statutory Section 21 dispute citations, and your personalized 30-60-90 day score recovery roadmap.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-md ${
              downloadSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-[#FF6A00] hover:bg-[#E65F00] text-white shadow-orange-500/30 active:scale-98'
            } disabled:opacity-60`}
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{downloadProgress || 'Preparing PDF...'}</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Report (PDF)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('export')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-200" />
            <span>Print View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
