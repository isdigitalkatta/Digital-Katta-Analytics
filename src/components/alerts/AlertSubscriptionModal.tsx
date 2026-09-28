import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  FileCheck2,
  Send,
  Zap,
  Clock,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  Check,
  Building2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  AlertSubscription,
  AlertNotificationEvent,
  MonitoredBureau,
  ScoreDirection,
  AlertFrequency,
} from '../../types';

interface AlertSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'preferences' | 'simulate' | 'history';
  onAlertUpdated?: (sub: AlertSubscription) => void;
}

export const AlertSubscriptionModal: React.FC<AlertSubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'preferences',
  onAlertUpdated,
}) => {
  const { user, customerProfile, authenticatedFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'preferences' | 'simulate' | 'history'>(initialTab);

  const [subscription, setSubscription] = useState<AlertSubscription | null>(null);
  const [events, setEvents] = useState<AlertNotificationEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulation test action state
  const [testingType, setTestingType] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [scoreAlertsEnabled, setScoreAlertsEnabled] = useState<boolean>(true);
  const [scoreThreshold, setScoreThreshold] = useState<number>(5);
  const [scoreDirection, setScoreDirection] = useState<ScoreDirection>('ANY');
  const [scoreDropWarning, setScoreDropWarning] = useState<boolean>(true);
  const [targetScoreGoal, setTargetScoreGoal] = useState<number>(750);
  const [notifyWhenGoalReached, setNotifyWhenGoalReached] = useState<boolean>(true);

  const [disputeAlertsEnabled, setDisputeAlertsEnabled] = useState<boolean>(true);
  const [monitoredBureaus, setMonitoredBureaus] = useState<MonitoredBureau[]>(['CIBIL', 'Experian', 'Equifax', 'CRIF']);
  const [notifyOnResolution, setNotifyOnResolution] = useState<boolean>(true);
  const [notifyOnLenderResponse, setNotifyOnLenderResponse] = useState<boolean>(true);
  const [notifyOnEscalation, setNotifyOnEscalation] = useState<boolean>(true);

  const [alertFrequency, setAlertFrequency] = useState<AlertFrequency>('INSTANT');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');

  // Load current settings from backend
  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authenticatedFetch('/api/alerts/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          const sub: AlertSubscription = data.subscription;
          setSubscription(sub);
          setEmail(sub.email || customerProfile?.email || user?.email || '');
          setScoreAlertsEnabled(sub.scoreAlertsEnabled ?? true);
          setScoreThreshold(sub.scoreChangeThreshold ?? 5);
          setScoreDirection(sub.scoreDirection ?? 'ANY');
          setScoreDropWarning(sub.scoreDropWarning ?? true);
          setTargetScoreGoal(sub.targetScoreGoal ?? 750);
          setNotifyWhenGoalReached(sub.notifyWhenGoalReached ?? true);

          setDisputeAlertsEnabled(sub.disputeAlertsEnabled ?? true);
          setMonitoredBureaus(sub.monitoredBureaus ?? ['CIBIL', 'Experian', 'Equifax', 'CRIF']);
          setNotifyOnResolution(sub.notifyOnResolution ?? true);
          setNotifyOnLenderResponse(sub.notifyOnLenderResponse ?? true);
          setNotifyOnEscalation(sub.notifyOnEscalation ?? true);

          setAlertFrequency(sub.alertFrequency ?? 'INSTANT');
          setSubscriptionStatus(sub.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE');
        }
        if (data.recentEvents) {
          setEvents(data.recentEvents);
        }
      }
    } catch (err: any) {
      console.warn('Alert subscription fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionData();
      setActiveTab(initialTab);
      setTestFeedback(null);
      setSaveSuccess(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const toggleBureau = (bureau: MonitoredBureau) => {
    if (monitoredBureaus.includes(bureau)) {
      if (monitoredBureaus.length > 1) {
        setMonitoredBureaus(monitoredBureaus.filter((b) => b !== bureau));
      }
    } else {
      setMonitoredBureaus([...monitoredBureaus, bureau]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid recipient email address.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload: Partial<AlertSubscription> = {
        email: email.trim(),
        scoreAlertsEnabled,
        scoreChangeThreshold: scoreThreshold,
        scoreDirection,
        scoreDropWarning,
        targetScoreGoal,
        notifyWhenGoalReached,
        disputeAlertsEnabled,
        monitoredBureaus,
        notifyOnResolution,
        notifyOnLenderResponse,
        notifyOnEscalation,
        alertFrequency,
        status: subscriptionStatus,
      };

      const res = await authenticatedFetch('/api/alerts/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubscription(data.subscription);
        setSaveSuccess(true);
        if (onAlertUpdated) onAlertUpdated(data.subscription);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save alert preferences.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error updating subscription.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    setTestingType('test');
    setTestFeedback(null);
    try {
      const res = await authenticatedFetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback({
          type: 'success',
          message: data.message || `Test email alert dispatched to ${email}!`,
        });
        if (data.event) {
          setEvents((prev) => [data.event, ...prev]);
        }
      } else {
        setTestFeedback({
          type: 'error',
          message: data.error || 'Failed to dispatch test alert.',
        });
      }
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        message: err?.message || 'Network error sending test alert.',
      });
    } finally {
      setTestingType(null);
    }
  };

  const handleSimulateEvent = async (simType: 'score_increase' | 'score_decrease' | 'dispute_resolved' | 'dispute_response') => {
    setTestingType(simType);
    setTestFeedback(null);
    try {
      const res = await authenticatedFetch('/api/alerts/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: simType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback({
          type: 'success',
          message: `Simulated event logged: "${data.event?.title}". Notification added to your alert log!`,
        });
        if (data.event) {
          setEvents((prev) => [data.event, ...prev]);
        }
      } else {
        setTestFeedback({
          type: 'error',
          message: data.error || 'Failed to simulate event.',
        });
      }
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        message: err?.message || 'Network error simulating event.',
      });
    } finally {
      setTestingType(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1c3859] to-[#12233F] p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading">
                  CIBIL &amp; Bureau Email Alerts
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  subscriptionStatus === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}>
                  {subscriptionStatus === 'ACTIVE' ? 'Active Monitoring' : 'Monitoring Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Subscribe to real-time email notifications for credit score changes and detected dispute outcomes.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-white/10 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preferences'
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Alert Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('simulate')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'simulate'
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Live Test &amp; Simulate</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Alert History ({events.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          {/* TAB 1: Alert Preferences */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Recipient Email Address */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-700" />
                    <span>Notification Recipient Email</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    RBI Section 21 Confidential Delivery
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email to receive score & dispute updates"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-indigo-600 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Credit score revisions and dispute outcome summaries will be sent immediately to this mailbox.
                </p>
              </div>

              {/* 1. Credit Score Change Alerts */}
              <div className="p-5 rounded-2xl border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Credit Score Change Alerts
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Get notified when your credit score shifts on bureau refresh
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scoreAlertsEnabled}
                      onChange={(e) => setScoreAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {scoreAlertsEnabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    {/* Minimum Threshold */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Minimum Score Change to Trigger Alert:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 1, label: '1+ Pt (Any Shift)' },
                          { val: 5, label: '5+ Points' },
                          { val: 10, label: '10+ Points' },
                          { val: 20, label: '20+ Points' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setScoreThreshold(item.val)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              scoreThreshold === item.val
                                ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Alert Direction & Dropping Warning */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Direction Preference:
                        </label>
                        <select
                          value={scoreDirection}
                          onChange={(e) => setScoreDirection(e.target.value as ScoreDirection)}
                          className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="ANY">Both Increases &amp; Decreases</option>
                          <option value="DECREASE_ONLY">Score Drops Only (Risk Defense)</option>
                          <option value="INCREASE_ONLY">Score Gains Only (Progress)</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Rapid Drop Warning</p>
                          <p className="text-[10px] text-slate-500">Alert immediately if score drops &gt;15 pts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={scoreDropWarning}
                          onChange={(e) => setScoreDropWarning(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Milestone Goal Alert */}
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">Target Goal Reached Alert</p>
                          <p className="text-[10px] text-emerald-800">Notify when score crosses {targetScoreGoal}+ (Prime/Excellent)</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyWhenGoalReached}
                        onChange={(e) => setNotifyWhenGoalReached(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Dispute Outcome & Resolution Alerts */}
              <div className="p-5 rounded-2xl border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Dispute Outcome &amp; Resolution Alerts
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Detect bank responses, NOCs, and trade line rectifications
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disputeAlertsEnabled}
                      onChange={(e) => setDisputeAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {disputeAlertsEnabled && (
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    {/* Monitored Bureaus */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Monitored Credit Bureaus:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['CIBIL', 'Experian', 'Equifax', 'CRIF'] as MonitoredBureau[]).map((b) => {
                          const active = monitoredBureaus.includes(b);
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => toggleBureau(b)}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                                active
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                                  : 'border-slate-200 text-slate-500 bg-white'
                              }`}
                            >
                              <span>{b}</span>
                              {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Specific dispute outcome triggers */}
                    <div className="space-y-2 pt-1 text-xs">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnResolution}
                          onChange={(e) => setNotifyOnResolution(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800">Overdue Rectification &amp; Standard Status</p>
                          <p className="text-[10px] text-slate-500">Alert when lender confirms overdue removed or DPD set to 000</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnLenderResponse}
                          onChange={(e) => setNotifyOnLenderResponse(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800">Lender Responses &amp; NOC Issuance</p>
                          <p className="text-[10px] text-slate-500">Alert when No Dues Certificate or formal bank response is received</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifyOnEscalation}
                          onChange={(e) => setNotifyOnEscalation(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <div>
                          <p className="font-bold text-slate-800">RBI Ombudsman Escalation Updates</p>
                          <p className="text-[10px] text-slate-500">Alert when unresolved disputes pass statutory 30-day timeline</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Delivery Frequency & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Alert Frequency:
                  </label>
                  <select
                    value={alertFrequency}
                    onChange={(e) => setAlertFrequency(e.target.value as AlertFrequency)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="INSTANT">Instant Real-Time (Recommended)</option>
                    <option value="DAILY_DIGEST">Daily Summary Digest</option>
                    <option value="WEEKLY_SUMMARY">Weekly Bureau Recap</option>
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Subscription Status:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSubscriptionStatus('ACTIVE')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        subscriptionStatus === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubscriptionStatus('PAUSED')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        subscriptionStatus === 'PAUSED'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300'
                      }`}
                    >
                      Paused
                    </button>
                  </div>
                </div>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Your email alert monitoring preferences have been saved successfully!</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={testingType === 'test' || isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{testingType === 'test' ? 'Sending Test...' : 'Send Test Alert to Email'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving Preferences...' : 'Save Alert Subscription'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Live Test & Simulate */}
          {activeTab === 'simulate' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Bureau Event Simulation Engine</p>
                  <p className="mt-0.5 leading-relaxed text-blue-800">
                    Use these buttons to trigger simulated credit bureau change events. You can verify how score shifts and dispute resolution notices are formatted, logged, and prepared for email dispatch to <strong>{email || 'your registered address'}</strong>.
                  </p>
                </div>
              </div>

              {testFeedback && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
                    testFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {testFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Score Increase */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase">Score Increase Event</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulates a <strong>+24 point increase</strong> (672 → 696) following timely repayments.
                  </p>
                  <button
                    type="button"
                    disabled={testingType !== null}
                    onClick={() => handleSimulateEvent('score_increase')}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingType === 'score_increase' ? 'Simulating...' : 'Trigger Score Increase Alert'}
                  </button>
                </div>

                {/* 2. Score Drop */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-all space-y-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <TrendingDown className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase">Score Drop Warning</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulates a <strong>-18 point drop</strong> (720 → 702) due to a new hard inquiry or balance spike.
                  </p>
                  <button
                    type="button"
                    disabled={testingType !== null}
                    onClick={() => handleSimulateEvent('score_decrease')}
                    className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingType === 'score_decrease' ? 'Simulating...' : 'Trigger Score Drop Alert'}
                  </button>
                </div>

                {/* 3. Dispute Resolved */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <FileCheck2 className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase">Overdue Rectification</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulates <strong>HDFC Bank</strong> confirming removal of erroneous 90+ DPD overdue on card #4129.
                  </p>
                  <button
                    type="button"
                    disabled={testingType !== null}
                    onClick={() => handleSimulateEvent('dispute_resolved')}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingType === 'dispute_resolved' ? 'Simulating...' : 'Trigger Resolution Alert'}
                  </button>
                </div>

                {/* 4. NOC Issued */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Building2 className="w-5 h-5" />
                    <span className="font-bold text-xs uppercase">Lender NOC Response</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Simulates <strong>SBI</strong> issuing No Dues Certificate and queueing CIBIL record update.
                  </p>
                  <button
                    type="button"
                    disabled={testingType !== null}
                    onClick={() => handleSimulateEvent('dispute_response')}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {testingType === 'dispute_response' ? 'Simulating...' : 'Trigger NOC Alert'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Alert History Log */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Detected Bureau &amp; Dispute Outcome Logs
                </span>
                <span className="text-slate-400 font-medium">
                  {events.length} Recorded Alerts
                </span>
              </div>

              {events.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Alert Events Recorded Yet</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    When bureau score updates occur or dispute responses are received from lenders, they will be logged here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('simulate')}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold cursor-pointer hover:bg-orange-700"
                  >
                    Try a Simulation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {ev.type === 'SCORE_CHANGE' ? (
                            (ev.details?.scoreDiff ?? 0) >= 0 ? (
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            )
                          ) : ev.type === 'DISPUTE_OUTCOME' ? (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                              <FileCheck2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4" />
                            </div>
                          )}

                          <div>
                            <h5 className="text-xs font-bold text-slate-900 leading-snug">
                              {ev.title}
                            </h5>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              {ev.message}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                            {ev.type.replace('_', ' ')}
                          </span>
                          <span>Recipient: {ev.recipientEmail}</span>
                        </div>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statutory Security Disclaimer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DPDP Act 2023 &amp; CICRA Section 21 Encrypted Alerts</span>
            </span>
            <span>Digital Katta Credit Desk</span>
          </div>
        </div>
      </div>
    </div>
  );
};
