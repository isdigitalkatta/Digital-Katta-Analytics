import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileCheck2,
  AlertTriangle,
  FileSignature,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Building2,
  ArrowRight,
  Bell,
  Mail,
  Zap,
  Clock,
  Sparkles,
  Scale,
  Copy,
  Layers,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { DisputeOpportunity } from '../types';
import { AlertSubscriptionModal } from './alerts/AlertSubscriptionModal';

interface DisputeOpportunitiesViewProps {
  disputes: DisputeOpportunity[];
  onDraftLetterForDispute: (dispute: DisputeOpportunity) => void;
}

export const DisputeOpportunitiesView: React.FC<DisputeOpportunitiesViewProps> = ({
  disputes,
  onDraftLetterForDispute,
}) => {
  const { t } = useTranslation();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'instant' | 'substantive'>('all');

  const instantDisputes = disputes.filter((d) => d.isInstantDisputeCandidate || d.isClericalError);
  const substantiveDisputes = disputes.filter((d) => !d.isInstantDisputeCandidate && !d.isClericalError);

  const displayedDisputes =
    activeFilter === 'instant'
      ? instantDisputes
      : activeFilter === 'substantive'
      ? substantiveDisputes
      : disputes;

  // Breakdown counts of clerical error categories
  const duplicateCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'DUPLICATE_ACCOUNT' || d.issue.toLowerCase().includes('duplicate')
  ).length;
  const addressCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'ADDRESS_INACCURACY' || d.issue.toLowerCase().includes('address') || d.issue.toLowerCase().includes('pincode')
  ).length;
  const dobCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'DATE_OF_BIRTH_MISMATCH' || d.issue.toLowerCase().includes('birth') || d.issue.toLowerCase().includes('under age')
  ).length;
  const ledgerCount = instantDisputes.filter(
    (d) => d.clericalDetails?.category === 'MATHEMATICAL_LEDGER' || d.issue.toLowerCase().includes('balance') || d.issue.toLowerCase().includes('zero')
  ).length;

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'DUPLICATE_ACCOUNT':
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
      case 'ADDRESS_INACCURACY':
        return <MapPin className="w-3.5 h-3.5 text-blue-600" />;
      case 'DATE_OF_BIRTH_MISMATCH':
        return <Calendar className="w-3.5 h-3.5 text-rose-600" />;
      case 'MATHEMATICAL_LEDGER':
        return <Scale className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              {t('disputes.title', 'Dispute Opportunities & Bureau Resolution')}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t(
              'disputes.subtitle',
              'Automated audit of factual data discrepancies, clerical errors, and Section 21 CICRA fast-track claims'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {instantDisputes.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Instant Disputes:</span>
              <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                {instantDisputes.length}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            <span>Total Disputes:</span>
            <span className="bg-white px-2 py-0.5 rounded-md shadow-2xs font-bold text-blue-600">
              {disputes.length}
            </span>
          </div>
        </div>
      </div>

      {/* CLERICAL ERROR AUTO-SCANNER HIGHLIGHT BANNER */}
      {instantDisputes.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-blue-500/5 border-2 border-amber-300 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs tracking-wide">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  AUTOMATED SCANNER: CLERICAL ERRORS DETECTED
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ⚡ Instant Dispute Eligible
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {instantDisputes.length} Inherent Clerical Discrepancies Found in Your Uploaded Report
              </h3>

              <p className="text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
                Our algorithm scanned your trade lines, identity header, and ledger fields and flagged{' '}
                <strong className="text-slate-900">{instantDisputes.length} objective clerical errors</strong> (e.g.{' '}
                {duplicateCount > 0 && `${duplicateCount} duplicate trade line(s), `}
                {addressCount > 0 && `${addressCount} address / pincode mismatch(es), `}
                {dobCount > 0 && `${dobCount} date of birth / underage record(s), `}
                {ledgerCount > 0 && `${ledgerCount} zero-balance overdue contradiction(s)`}
                ). These represent the <strong>fastest path to score recovery</strong> because Indian credit bureaus
                are legally bound under Section 21 of CICRA 2005 to expunge verifiable clerical mistakes within 30 days
                without substantive negotiation.
              </p>

              {/* Categorical breakdown pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold">
                {duplicateCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-amber-200 text-amber-900 shadow-2xs">
                    <Layers className="w-3 h-3 text-amber-600" />
                    Duplicate Trade Lines: {duplicateCount}
                  </span>
                )}
                {addressCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-blue-200 text-blue-900 shadow-2xs">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    Address Inaccuracies: {addressCount}
                  </span>
                )}
                {dobCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-rose-200 text-rose-900 shadow-2xs">
                    <Calendar className="w-3 h-3 text-rose-600" />
                    DOB / Age Inconsistencies: {dobCount}
                  </span>
                )}
                {ledgerCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-200 text-emerald-900 shadow-2xs">
                    <Scale className="w-3 h-3 text-emerald-600" />
                    Nil-Balance Overdue Glitches: {ledgerCount}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch gap-2.5">
              <button
                type="button"
                onClick={() => setActiveFilter('instant')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Show Instant Disputes Only</span>
              </button>
              <div className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-600 text-center">
                <span className="font-bold text-slate-800">Statutory 30-Day Rule</span>
                <p className="text-[10px] text-slate-500">₹100/day compensation for delay</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER SEGMENT TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#12233F] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Identified Disputes ({disputes.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('instant')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'instant'
              ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-500" />
          <span>⚡ Instant Dispute Candidates ({instantDisputes.length})</span>
          {instantDisputes.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-800 font-extrabold">
              Fast-Track
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('substantive')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'substantive'
              ? 'bg-[#12233F] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Substantive Account Inconsistencies ({substantiveDisputes.length})
        </button>
      </div>

      {/* Official Dispute Guidelines Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Your Legal Rights Under RBI CIC Regulations (2006) &amp; CICRA Section 21:</span>
        </div>
        <p className="text-blue-800 leading-relaxed">
          Every Indian citizen has the statutory right to have inaccurate credit data rectified within{' '}
          <strong>30 days</strong> of submitting a dispute. Under the Reserve Bank of India circular (CEPC.BC.No.02/2023-24),
          credit institutions and bureaus failing to resolve legitimate credit discrepancies within 30 calendar days
          are liable to pay a mandatory compensation of <strong>₹100 per calendar day</strong> to the borrower.
        </p>
      </div>

      {/* Dispute Outcome Email Alert Subscription Banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-400/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Subscribe to Dispute Outcome Email Alerts</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                Automated Bureau Monitor
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Receive immediate email notifications as soon as lenders expunge duplicate accounts, fix address
              records, or update your CIBIL trade lines.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAlertModalOpen(true)}
          className="shrink-0 px-4 py-2 rounded-xl bg-[#12233F] hover:bg-[#1c3859] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Mail className="w-3.5 h-3.5 text-orange-400" />
          <span>Subscribe to Outcome Alerts</span>
        </button>
      </div>

      {/* DISPUTES LIST */}
      {displayedDisputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            {activeFilter === 'instant'
              ? 'No Instant Dispute Clerical Errors Detected'
              : t('disputes.noDisputes', 'No Obvious Data Discrepancies Detected')}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeFilter === 'instant'
              ? 'Your uploaded report has no duplicate trade lines, postal code anomalies, or underage account glitches. View all identified disputes to examine other opportunities.'
              : t(
                  'disputes.noDisputes',
                  'The trade lines, overdues, and reporting dates across your facilities appear mathematically consistent with no evident duplicate entries or zero-balance overdue conflicts.'
                )}
          </p>
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-4 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              View All Identified Disputes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedDisputes.map((disp) => {
            const isInstant = disp.isInstantDisputeCandidate || disp.isClericalError;
            const details = disp.clericalDetails;

            return (
              <div
                key={disp.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 transition-all hover:border-slate-300 relative ${
                  isInstant
                    ? 'border-l-4 border-l-amber-500 border-amber-200 bg-gradient-to-r from-amber-50/20 via-white to-white'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Title and Route Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isInstant ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs tracking-wide">
                        <Zap className="w-3 h-3 fill-white" />
                        INSTANT DISPUTE CANDIDATE
                      </span>
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}

                    <h3 className="text-sm font-bold text-slate-900">{disp.issue}</h3>

                    {details?.categoryLabel && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {getCategoryIcon(details.category)}
                        {details.categoryLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isInstant && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Fast-Track: ~{details?.resolutionTimeframeDays || 15} Days
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getConfidenceBadge(
                        disp.confidence
                      )}`}
                    >
                      {disp.confidence} {t('disputes.confidence', 'Confidence')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {t('disputes.recommendedRoute', 'Route')}: {disp.recommendedRoute}
                    </span>
                  </div>
                </div>

                {/* Clerical Error Details Card if available */}
                {isInstant && details && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-bold text-amber-900">Clerical Error Specifics (Auto-Detected):</span>
                      </div>
                      {details.estimatedScoreImpactPoints > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                          Est. Score Recovery: +{details.estimatedScoreImpactPoints} pts
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60">
                      <div>
                        <span className="font-semibold text-amber-950 block">Inaccurate Record Found:</span>
                        <p className="text-amber-900 mt-0.5 font-mono text-[10.5px] bg-white/70 p-1.5 rounded border border-amber-200">
                          {details.foundValue}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-950 block">Contradicts / Legal Standard:</span>
                        <p className="text-emerald-900 mt-0.5 font-mono text-[10.5px] bg-white/70 p-1.5 rounded border border-emerald-200">
                          {details.expectedOrContradictingValue}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-900/90 leading-relaxed pt-1">
                      <strong className="text-amber-950">Statutory Ground:</strong> {details.legalGround}
                    </p>
                  </div>
                )}

                {/* Grid breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="font-semibold text-slate-500 block text-[11px]">
                        {t('disputes.evidenceFromReport', 'Evidence from Report')}:
                      </span>
                      <p className="text-slate-800 mt-0.5 font-medium">{disp.evidenceFromReport}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 block text-[11px]">
                        {t('disputes.whyInconsistent', 'Why it Appears Inconsistent')}:
                      </span>
                      <p className="text-slate-600 mt-0.5">{disp.whyInconsistent}</p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <span className="font-semibold text-slate-500 block text-[11px]">
                        {t('disputes.evidenceToProvide', 'Evidence You Should Provide')}:
                      </span>
                      <p className="text-slate-800 mt-0.5 font-medium">{disp.evidenceToProvide}</p>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">
                        {isInstant ? 'Statutory Fast-Track: 30 days max' : 'Resolution window: ~30 days'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDraftLetterForDispute(disp)}
                        className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isInstant
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isInstant ? (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Launch Instant Dispute Notice</span>
                          </>
                        ) : (
                          <>
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>{t('disputes.draftDisputeLetter', 'Draft Dispute Letter')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External Portals Quick Links */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">Direct Dispute Resolution Portals (India)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://www.cibil.com/dispute-center"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between text-slate-800 cursor-pointer"
          >
            <div>
              <span className="font-bold block">TransUnion CIBIL Dispute Center</span>
              <span className="text-[11px] text-slate-400">Direct online bureau ticketing</span>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </a>

          <a
            href="https://cms.rbi.org.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-center justify-between text-slate-800 cursor-pointer"
          >
            <div>
              <span className="font-bold block">RBI Integrated Ombudsman (CMS)</span>
              <span className="text-[11px] text-slate-400">For complaints unresolved past 30 days</span>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </a>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
            <span className="font-bold block">Lender Nodal Officers</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Contact the Principal Nodal Officer of your bank / NBFC for immediate audit
            </span>
          </div>
        </div>
      </div>

      <AlertSubscriptionModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        initialTab="preferences"
      />
    </div>
  );
};

