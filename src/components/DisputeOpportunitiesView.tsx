import React from 'react';
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
} from 'lucide-react';
import { DisputeOpportunity } from '../types';

interface DisputeOpportunitiesViewProps {
  disputes: DisputeOpportunity[];
  onDraftLetterForDispute: (dispute: DisputeOpportunity) => void;
}

export const DisputeOpportunitiesView: React.FC<DisputeOpportunitiesViewProps> = ({
  disputes,
  onDraftLetterForDispute,
}) => {
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Dispute Opportunity Detection
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data discrepancies and inconsistencies flagged for correction with lenders and TransUnion CIBIL
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
          <span>Total Disputable Items:</span>
          <span className="bg-white px-2 py-0.5 rounded-md shadow-2xs font-bold text-blue-600">
            {disputes.length}
          </span>
        </div>
      </div>

      {/* Official Dispute Guidelines Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Your Legal Rights Under RBI CIC Regulations (2006):</span>
        </div>
        <p className="text-blue-800 leading-relaxed">
          Every Indian citizen has the statutory right to have inaccurate credit data rectified within <strong>30 days</strong> of submitting a dispute. Financial institutions that fail to resolve legitimate credit discrepancies within this timeline are liable under the RBI Integrated Ombudsman Scheme.
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading">
            No Obvious Data Discrepancies Detected
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            The trade lines, overdues, and reporting dates across your facilities appear mathematically consistent with no evident duplicate entries or zero-balance overdue conflicts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(disp => (
            <div
              key={disp.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 transition-all hover:border-slate-300"
            >
              {/* Title and Route Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {disp.issue}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getConfidenceBadge(disp.confidence)}`}>
                    {disp.confidence} Confidence
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Route: {disp.recommendedRoute}
                  </span>
                </div>
              </div>

              {/* Grid breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">Evidence from Report:</span>
                    <p className="text-slate-800 mt-0.5 font-medium">{disp.evidenceFromReport}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">Why it Appears Inconsistent:</span>
                    <p className="text-slate-600 mt-0.5">{disp.whyInconsistent}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-slate-500 block text-[11px]">Evidence You Should Provide:</span>
                    <p className="text-slate-800 mt-0.5 font-medium">{disp.evidenceToProvide}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Resolution window: approx 30 days</span>
                    <button
                      onClick={() => onDraftLetterForDispute(disp)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Draft Dispute Letter</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External Portals Quick Links */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm">
          Direct Dispute Resolution Portals (India)
        </h3>
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
            <span className="text-[11px] text-slate-500 block mt-0.5">Contact the Principal Nodal Officer of your bank / NBFC for immediate audit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
