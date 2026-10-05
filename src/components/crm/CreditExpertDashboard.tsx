import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  ChevronRight,
  BookOpen,
  Sparkles,
  FileText,
  AlertCircle,
  ExternalLink,
  Printer,
  X,
  RefreshCw,
  Building2,
  Gavel,
} from 'lucide-react';
import { CrmLeadItem, LeadStatus } from './crmTypes';
import { useAuth } from '../../context/AuthContext';

interface CreditExpertDashboardProps {
  onOpenLetterGenerator?: (caseInfo: any) => void;
}

interface DisputeCase {
  id: string;
  leadId: string;
  borrowerName: string;
  pan: string;
  phone: string;
  cibilScore: number;
  targetScore: number;
  primaryLender: string;
  accountNumber: string;
  issueType: 'DPD_OVERDUE' | 'SETTLED_TAG' | 'WRITTEN_OFF' | 'UNAUTHORIZED_ENQUIRY' | 'IDENTITY_THEFT';
  dpdMax: number;
  statutoryGround: string;
  status: 'PENDING_AUDIT' | 'NOTICE_DRAFTED' | 'DISPUTED_WITH_BUREAU' | 'RESOLVED_UPDATED';
  disputeDate?: string;
  assignedExpert: string;
}

const DEMO_EXPERT_CASES: DisputeCase[] = [
  {
    id: 'CASE-2026-8912',
    leadId: 'lead-01',
    borrowerName: 'Demo Borrower #8912',
    pan: 'ABCDE1234F',
    phone: '+91 98765 43210',
    cibilScore: 642,
    targetScore: 760,
    primaryLender: 'Bajaj Finance Ltd',
    accountNumber: 'XXXX-XXXX-3341',
    issueType: 'SETTLED_TAG',
    dpdMax: 60,
    statutoryGround: 'Section 21 CICRA 2005: Full amount satisfied via settlement agreement; NDC issued but lender failed to update clean status.',
    status: 'NOTICE_DRAFTED',
    disputeDate: '2026-09-20',
    assignedExpert: 'Senior Dispute Counsel',
  },
  {
    id: 'CASE-2026-8915',
    leadId: 'lead-02',
    borrowerName: 'Demo Borrower #8915',
    pan: 'BKRPD9821K',
    phone: '+91 98220 11223',
    cibilScore: 590,
    targetScore: 720,
    primaryLender: 'HDFC Bank Ltd',
    accountNumber: 'XXXX-XXXX-4819',
    issueType: 'DPD_OVERDUE',
    dpdMax: 90,
    statutoryGround: 'Erroneous 90+ DPD reported post COVID moratorium waiver sanctioned in writing.',
    status: 'PENDING_AUDIT',
    assignedExpert: 'Senior Dispute Counsel',
  },
  {
    id: 'CASE-2026-8919',
    leadId: 'lead-03',
    borrowerName: 'Demo Borrower #8919',
    pan: 'AAACK4411P',
    phone: '+91 97654 33211',
    cibilScore: 685,
    targetScore: 780,
    primaryLender: 'SBI Cards',
    accountNumber: 'XXXX-XXXX-9102',
    issueType: 'UNAUTHORIZED_ENQUIRY',
    dpdMax: 0,
    statutoryGround: '3 hard enquiries triggered without explicit written DPDP consent.',
    status: 'DISPUTED_WITH_BUREAU',
    disputeDate: '2026-09-15',
    assignedExpert: 'Senior Dispute Counsel',
  },
  {
    id: 'CASE-2026-8890',
    leadId: 'lead-04',
    borrowerName: 'Demo Borrower #8890',
    pan: 'BZZAS7733L',
    phone: '+91 99887 66554',
    cibilScore: 745,
    targetScore: 790,
    primaryLender: 'ICICI Bank',
    accountNumber: 'XXXX-XXXX-1122',
    issueType: 'SETTLED_TAG',
    dpdMax: 30,
    statutoryGround: 'Closure letter verified; bureau reflection completed.',
    status: 'RESOLVED_UPDATED',
    disputeDate: '2026-08-10',
    assignedExpert: 'Senior Dispute Counsel',
  },
];

export const CreditExpertDashboard: React.FC<CreditExpertDashboardProps> = ({ onOpenLetterGenerator }) => {
  const { user, authenticatedFetch } = useAuth();

  const [cases, setCases] = useState<DisputeCase[]>(DEMO_EXPERT_CASES);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(DEMO_EXPERT_CASES[0]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [noticeModalOpen, setNoticeModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateCaseStatus = (caseId: string, newStatus: DisputeCase['status']) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
    );
    if (selectedCase?.id === caseId) {
      setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    showToast(`Case status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      !search ||
      c.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      c.pan.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryLender.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Role Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-[#12233F] rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span className="font-semibold uppercase tracking-wider">Credit Dispute &amp; Advisory Desk</span>
              <span aria-hidden="true">·</span>
              <span>Counsel: {user?.name || 'Senior Dispute Counsel'}</span>
              <span aria-hidden="true">·</span>
              <span>CICRA 2005 Section 21 Authorized</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              Technical CIBIL Audits &amp; Statutory Legal Disputes
            </h1>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Conduct forensic trade-line audits, identify erroneous DPD reporting, draft statutory dispute claims under Section 21 of the Credit Information Companies Act, and monitor bureau rectifications.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setNoticeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>Draft Section 21 Notice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Case Metrics Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Audit Cases</span>
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{cases.length}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Assigned dispute portfolio</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Notices</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {cases.filter((c) => c.status === 'PENDING_AUDIT' || c.status === 'NOTICE_DRAFTED').length}
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Notice draft / dispatch due</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active at Bureaus</span>
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {cases.filter((c) => c.status === 'DISPUTED_WITH_BUREAU').length}
          </p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">30-day statutory window</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Resolved &amp; Boosted</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {cases.filter((c) => c.status === 'RESOLVED_UPDATED').length}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Clean bureau update</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'PENDING_AUDIT', label: 'Audit Needed' },
            { id: 'NOTICE_DRAFTED', label: 'Notice Ready' },
            { id: 'DISPUTED_WITH_BUREAU', label: 'Disputed' },
            { id: 'RESOLVED_UPDATED', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search borrower, PAN, lender..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Cases Queue + Technical Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Case Cards */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCases.map((c) => {
            const isSelected = selectedCase?.id === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{c.borrowerName}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-slate-500">PAN: {c.pan}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      <span>🏦 Lender: <strong className="text-slate-800">{c.primaryLender}</strong></span>
                      <span>Account: {c.accountNumber}</span>
                      <span>
                        Current Score: <strong className="text-rose-600">{c.cibilScore}</strong> → Target:{' '}
                        <strong className="text-emerald-600">{c.targetScore}</strong>
                      </span>
                    </div>

                    <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
                      <strong className="text-slate-800">Ground:</strong> {c.statutoryGround}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{c.id}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCase(c);
                        setNoticeModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>Notice</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Forensic Case Inspector */}
        <div className="space-y-4">
          {selectedCase ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedCase.borrowerName}</h3>
                  <p className="text-xs text-slate-500">Case ID: {selectedCase.id} · PAN: {selectedCase.pan}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {selectedCase.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Technical Audit Summary */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Lender &amp; Product:</span>
                  <span className="font-bold text-slate-800">{selectedCase.primaryLender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Disputed Trade Line:</span>
                  <span className="font-mono font-semibold text-slate-700">{selectedCase.accountNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Adverse Tag:</span>
                  <span className="font-bold text-rose-600">{selectedCase.issueType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Max DPD Reported:</span>
                  <span className="font-bold text-amber-700">{selectedCase.dpdMax} Days</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Assigned Counsel:</span>
                  <span className="font-semibold text-slate-800">{selectedCase.assignedExpert}</span>
                </div>
              </div>

              {/* Statutory Action Actions */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Statutory Case Actions:
                </label>
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Section 21 Dispute Notice</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateCaseStatus(selectedCase.id, 'DISPUTED_WITH_BUREAU')}
                    className="py-1.5 px-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-[11px] font-bold transition-colors"
                  >
                    Mark Bureau Dispatched
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateCaseStatus(selectedCase.id, 'RESOLVED_UPDATED')}
                    className="py-1.5 px-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold transition-colors"
                  >
                    Mark Case Resolved
                  </button>
                </div>
              </div>

              {/* Legal Reference Note */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Statutory Compliance Notice:</span>
                </p>
                <p className="text-slate-500 leading-relaxed">
                  Under Section 21 of the Credit Information Companies (Regulation) Act 2005, credit institutions and bureaus must respond and rectify inaccurate records within 30 days of receiving formal notice.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Case Selected</p>
              <p className="text-[11px] mt-1">Select a borrower case to inspect trade-lines, review grounds, or draft Section 21 dispute notices.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 21 Legal Notice Modal */}
      {noticeModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 text-left space-y-4 my-8 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Statutory Dispute Notice under Section 21 CICRA Act 2005
                </h3>
                <p className="text-xs text-slate-500">Case Reference: {selectedCase.id} · {selectedCase.borrowerName}</p>
              </div>
              <button
                onClick={() => setNoticeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notice Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800 space-y-3 max-h-96 overflow-y-auto select-all">
              <p><strong>FORMAL STATUTORY NOTICE OF DISPUTE</strong></p>
              <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p>
                To:<br />
                The Nodal Officer / Grievance Redressal Cell<br />
                {selectedCase.primaryLender}<br />
                Copy to: TransUnion CIBIL Ltd / Experian Credit Information India
              </p>
              <p>
                <strong>Subject:</strong> Formal Notice for Rectification of Inaccurate Credit Information under Section 21 of the Credit Information Companies (Regulation) Act, 2005.
              </p>
              <p>
                <strong>Borrower Particulars:</strong><br />
                Name: {selectedCase.borrowerName}<br />
                Permanent Account Number (PAN): {selectedCase.pan}<br />
                Disputed Account / Loan Number: {selectedCase.accountNumber}
              </p>
              <p>
                <strong>Statutory Grounds of Dispute:</strong><br />
                1. The borrower's credit report reflects erroneous reporting ({selectedCase.issueType}) with maximum reported delinquency of {selectedCase.dpdMax} DPD.<br />
                2. Specifically: {selectedCase.statutoryGround}<br />
                3. Under Section 21(3) of CICRA 2005 and RBI Master Direction on Credit Information Companies, your institution is obligated to investigate, rectify, and communicate corrected data to all credit bureaus within 30 days.
              </p>
              <p>
                Please provide written acknowledgment and confirmation of updated submission to TransUnion CIBIL within 15 working days of receipt.
              </p>
              <p>
                Yours faithfully,<br />
                <strong>{selectedCase.assignedExpert}</strong><br />
                Credit Advisory &amp; Legal Desk<br />
                Digital Katta Consumer Empowerment Services
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">Ready for dispatch via Registered Post / Email</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateCaseStatus(selectedCase.id, 'NOTICE_DRAFTED');
                    setNoticeModalOpen(false);
                    showToast('Section 21 notice recorded & marked ready');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Notice Ready</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
