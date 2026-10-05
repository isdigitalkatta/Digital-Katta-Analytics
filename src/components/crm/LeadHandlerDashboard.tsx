import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Send,
  Calendar,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Edit3,
  X,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Flame,
} from 'lucide-react';
import { CrmLeadItem, LeadStatus, LEAD_STATUS_CONFIG } from './crmTypes';
import { useAuth } from '../../context/AuthContext';

interface LeadHandlerDashboardProps {
  onForwardToExpert?: (lead: CrmLeadItem) => void;
}

export const LeadHandlerDashboard: React.FC<LeadHandlerDashboardProps> = ({ onForwardToExpert }) => {
  const { authenticatedFetch, user } = useAuth();

  const [leads, setLeads] = useState<CrmLeadItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStage, setFilterStage] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'DOCUMENTS_PENDING' | 'UNDER_REVIEW'>('ALL');
  const [selectedLead, setSelectedLead] = useState<CrmLeadItem | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Pune',
    score: '640',
    issue: 'Personal Loan Default / DPD Overdue',
    notes: 'Inbound telephone lead',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch('/api/v1/admin/leads?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.leads) {
          setLeads(data.leads);
        }
      }
    } catch (err) {
      console.warn('Could not load lead handler queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await authenticatedFetch(`/api/v1/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          assignedPartnerAssistant: user?.name || 'Lead Desk Officer',
        }),
      });
      if (res.ok) {
        showToast(`Lead status updated to ${newStatus}`);
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      }
    } catch (err) {
      showToast('Error updating status');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedLead || !noteText.trim()) return;
    setIsSavingNote(true);
    try {
      const updatedRemarks = selectedLead.remarks
        ? `${selectedLead.remarks} | [${new Date().toLocaleDateString('en-IN')}] ${noteText.trim()}`
        : `[${new Date().toLocaleDateString('en-IN')}] ${noteText.trim()}`;

      const res = await authenticatedFetch(`/api/v1/admin/leads/${selectedLead.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          remarks: updatedRemarks,
          assignedPartnerAssistant: user?.name || 'Lead Desk Officer',
        }),
      });

      if (res.ok) {
        showToast('Call notes logged & saved');
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, remarks: updatedRemarks } : l
          )
        );
        setSelectedLead((prev) =>
          prev ? { ...prev, remarks: updatedRemarks } : null
        );
        setNoteText('');
      }
    } catch (err) {
      showToast('Error saving note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCreateInboundLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) {
      showToast('Name and phone are required');
      return;
    }

    try {
      const res = await authenticatedFetch('/api/v1/admin/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: newLeadForm.name,
          phone: newLeadForm.phone,
          email: newLeadForm.email,
          city: newLeadForm.city,
          estimatedScore: Number(newLeadForm.score) || 620,
          remarks: `${newLeadForm.issue} - ${newLeadForm.notes}`,
          assignedPartnerAssistant: user?.name || 'Lead Desk Officer',
          status: 'NEW',
        }),
      });

      if (res.ok) {
        showToast('New inbound lead recorded successfully');
        setQuickAddOpen(false);
        setNewLeadForm({
          name: '',
          phone: '',
          email: '',
          city: 'Pune',
          score: '640',
          issue: 'Personal Loan Default / DPD Overdue',
          notes: 'Inbound telephone lead',
        });
        fetchLeads();
      }
    } catch (err) {
      showToast('Failed to create lead');
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone && lead.phone.includes(search)) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStage =
      filterStage === 'ALL' ||
      (filterStage === 'NEW' && (lead.status === 'NEW' || !lead.status)) ||
      (filterStage === 'CONTACTED' && lead.status === 'CONTACTED') ||
      (filterStage === 'DOCUMENTS_PENDING' && (lead.status === 'DOCUMENTS_PENDING' || lead.status === 'IN_PROGRESS')) ||
      (filterStage === 'UNDER_REVIEW' && (lead.status === 'UNDER_REVIEW' || lead.status === 'READY_FOR_EXPERT' || lead.status === 'ANALYSIS_COMPLETE'));

    return matchesSearch && matchesStage;
  });

  // Calculate metrics
  const newCount = leads.filter((l) => l.status === 'NEW' || !l.status).length;
  const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
  const docsPendingCount = leads.filter((l) => l.status === 'DOCUMENTS_PENDING' || l.status === 'IN_PROGRESS').length;
  const underReviewCount = leads.filter((l) => l.status === 'UNDER_REVIEW' || l.status === 'READY_FOR_EXPERT' || l.status === 'ANALYSIS_COMPLETE').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Role Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-[#12233F] rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-orange-200">
              <span className="font-semibold uppercase tracking-wider">Lead Operations Desk</span>
              <span aria-hidden="true">·</span>
              <span>Officer: {user?.name || 'Lead Desk Officer'}</span>
              <span aria-hidden="true">·</span>
              <span>DPDP Act Compliant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              Inbound Inquiries &amp; Calling Queue
            </h1>
            <p className="text-xs text-orange-100 max-w-2xl">
              Triage customer inquiries, conduct initial borrower intake, verify loan default background, and forward qualified disputes to the Senior Credit Expert.
            </p>
          </div>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Record New Lead</span>
          </button>
        </div>
      </div>

      {/* Performance & Queue Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Fresh Inquiries</span>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-900">{newCount}</p>
          <p className="text-[11px] text-orange-600 font-medium mt-1">Requires first call &lt; 15m</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Contacted</span>
            <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{contactedCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Follow-up call scheduled</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Docs Collecting</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{docsPendingCount}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting CIBIL PDF / PAN</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Ready for Expert</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{underReviewCount}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Ready for Legal Counsel</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Interactive Segmented Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'ALL', label: `All Inquiries (${leads.length})` },
              { id: 'NEW', label: `Fresh (${newCount})` },
              { id: 'CONTACTED', label: `Contacted (${contactedCount})` },
              { id: 'DOCUMENTS_PENDING', label: `Docs Pending (${docsPendingCount})` },
              { id: 'UNDER_REVIEW', label: `Ready for Expert (${underReviewCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStage(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                filterStage === tab.id
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search borrower or phone..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Leads Table & Active Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leads List */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-500" />
              <span>Loading lead queue...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              <span>No leads found matching current stage and filter.</span>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const statusCfg = LEAD_STATUS_CONFIG[lead.status || 'NEW'] || LEAD_STATUS_CONFIG.NEW;
              const isSelected = selectedLead?.id === lead.id;

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-orange-500 shadow-xs ring-1 ring-orange-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-900">{lead.name}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-500">{lead.city || 'Maharashtra'}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        {lead.phone && <span>📞 {lead.phone}</span>}
                        {lead.email && <span>✉️ {lead.email}</span>}
                        {lead.pan && <span>PAN: {lead.pan}</span>}
                        {lead.estimatedScore && (
                          <span className="font-semibold text-slate-700">CIBIL: ~{lead.estimatedScore}</span>
                        )}
                      </div>

                      {lead.remarks && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg line-clamp-2">
                          {lead.remarks}
                        </p>
                      )}
                    </div>

                    {/* Quick Call & WhatsApp Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          title="Call Borrower"
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(
                            `Namaskar ${lead.name}, I am from Digital Katta Credit Solutions regarding your CIBIL dispute inquiry.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Borrower"
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Active Lead Follow-Up Desk */}
        <div className="space-y-4">
          {selectedLead ? (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-500">{selectedLead.phone || 'No phone'} · ID: {selectedLead.id.slice(0, 8)}</p>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Update Lead Stage:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['NEW', 'CONTACTED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] as LeadStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(selectedLead.id, st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                        selectedLead.status === st
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {LEAD_STATUS_CONFIG[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hand Off to Credit Expert Action */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Forward to Credit Expert</h4>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Assign this borrower's technical report analysis to Senior Dispute Counsel.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedLead.id, 'UNDER_REVIEW');
                    if (onForwardToExpert) onForwardToExpert(selectedLead);
                  }}
                  className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Hand Off to Dispute Counsel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add Call Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Log Call / WhatsApp Disposition:
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Spoke to customer; wants to dispute Bajaj Finance late payment tag; CIBIL PDF requested by 4 PM."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  disabled={isSavingNote || !noteText.trim()}
                  onClick={handleSaveNote}
                  className="mt-2 w-full py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSavingNote ? 'Saving...' : 'Save Follow-Up Note'}</span>
                </button>
              </div>

              {/* History / Previous Remarks */}
              {selectedLead.remarks && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Activity History:
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {selectedLead.remarks}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No Lead Selected</p>
              <p className="text-[11px] mt-1">Select a borrower from the calling queue to log notes, update status, or forward to Credit Expert.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Inbound Lead Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record New Inbound Lead</h3>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInboundLead} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Borrower Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  placeholder="e.g. Santosh Gaikwad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    placeholder="Pune / Mumbai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated CIBIL Score</label>
                <input
                  type="number"
                  value={newLeadForm.score}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, score: e.target.value })}
                  placeholder="e.g. 620"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Primary Problem</label>
                <select
                  value={newLeadForm.issue}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, issue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                >
                  <option>Personal Loan Default / DPD Overdue</option>
                  <option>Credit Card Settled Tag Removal</option>
                  <option>Wrong Identity / Unauthorized Loan</option>
                  <option>Written-Off Account Settlement</option>
                  <option>Multiple Unauthorized Inquiries</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Notes</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs"
                >
                  Save Inbound Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
