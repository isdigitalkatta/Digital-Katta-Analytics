import React from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building2,
  FileSignature,
  Info,
} from 'lucide-react';
import { CreditEnquiry, EnquiryAnalysis, NormalizedCreditReport } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';

interface EnquiriesViewProps {
  enquiries: CreditEnquiry[];
  enquiryAnalysis: EnquiryAnalysis;
  onDraftDisputeLetter: (enquiry: CreditEnquiry) => void;
}

export const EnquiriesView: React.FC<EnquiriesViewProps> = ({
  enquiries,
  enquiryAnalysis,
  onDraftDisputeLetter,
}) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Credit Enquiries (Hard Inquiries)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Records generated whenever an Indian bank or NBFC pulled your CIBIL profile for loan or card underwriting
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
          <span>Total Recorded Enquiries:</span>
          <span className="bg-white px-2 py-0.5 rounded-md shadow-2xs font-bold text-blue-600">
            {enquiryAnalysis.total}
          </span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Last 30 Days</span>
          <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            {enquiryAnalysis.last30Days}
          </div>
          <span className="text-[11px] text-slate-400">Immediate velocity window</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Last 90 Days</span>
          <div className={`text-2xl font-extrabold font-heading mt-1 ${enquiryAnalysis.isVelocityHigh ? 'text-amber-600' : 'text-slate-900'}`}>
            {enquiryAnalysis.last90Days}
          </div>
          <span className="text-[11px] text-slate-400">Bureau risk window</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Inquiry Velocity Status</span>
          <div className={`text-base font-bold mt-2 ${enquiryAnalysis.isVelocityHigh ? 'text-amber-600' : 'text-emerald-600'}`}>
            {enquiryAnalysis.isVelocityHigh ? 'High Velocity (Credit Hungry)' : 'Normal / Controlled'}
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Automated lender risk tag</span>
        </div>
      </div>

      {/* High Velocity Warning Banner */}
      {enquiryAnalysis.isVelocityHigh && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">High Frequency Warning:</span>
            <p className="mt-0.5 leading-relaxed text-amber-800">
              {enquiryAnalysis.assessment} Applying for multiple credit cards or personal loans within a 90-day period triggers automated &apos;credit hunger&apos; flags across Indian banking algorithms, leading to higher interest rates or immediate rejections.
            </p>
          </div>
        </div>
      )}

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Detailed Enquiry History
          </h3>
          <span className="text-xs text-slate-400">Hard pull audit log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Enquiry Date</th>
                <th className="px-4 py-3.5">Institution / Bank</th>
                <th className="px-4 py-3.5">Purpose / Loan Type</th>
                <th className="px-4 py-3.5">Enquiry Amount</th>
                <th className="px-4 py-3.5 text-right">Dispute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No credit enquiries recorded in this report.
                  </td>
                </tr>
              ) : (
                enquiries.map(enq => (
                  <tr key={enq.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-slate-700">
                      {enq.date}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {enq.institution}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {enq.purpose}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {enq.amount && enq.amount > 0 ? formatIndianCurrency(enq.amount) : 'Not Disclosed'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => onDraftDisputeLetter(enq)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="Dispute if you did not apply to this lender"
                      >
                        Dispute Pull
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
