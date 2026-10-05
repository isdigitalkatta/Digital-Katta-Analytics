import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  CheckCircle2,
  Lock,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  Eye,
  EyeOff,
  Edit3,
  AlertCircle,
  FileSpreadsheet,
  Bell,
  TrendingUp,
  FileCheck2,
  Send,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CustomerProfileModal } from '../CustomerProfileModal';
import { AlertSubscriptionModal } from '../alerts/AlertSubscriptionModal';
import { AlertSubscription, NormalizedCreditReport } from '../../types';

interface ProfilePageProps {
  report?: NormalizedCreditReport | null;
  borrowerName?: string;
  onEditProfile?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  report,
  borrowerName,
}) => {
  const { user, customerProfile, isProfileComplete, logout, authenticatedFetch } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalInitialTab, setAlertModalInitialTab] = useState<'preferences' | 'simulate' | 'history'>('preferences');
  const [showPanClear, setShowPanClear] = useState(false);

  // Alert subscription summary
  const [alertSub, setAlertSub] = useState<AlertSubscription | null>(null);
  const [testSentMsg, setTestSentMsg] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const fetchAlertSub = async () => {
    try {
      const res = await authenticatedFetch('/api/alerts/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setAlertSub(data.subscription);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchAlertSub();
  }, []);

  const handleQuickTestAlert = async () => {
    setIsSendingTest(true);
    setTestSentMsg(null);
    try {
      const res = await authenticatedFetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: alertSub?.email || userEmail }),
      });
      if (res.ok) {
        setTestSentMsg('Test alert dispatched to ' + (alertSub?.email || userEmail));
        setTimeout(() => setTestSentMsg(null), 4000);
      }
    } catch {
      setTestSentMsg('Error sending test alert.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const isReportUploaded = Boolean(report && report.rawSourceType !== 'DEMO' && report.personal?.name);
  const uploadedName = isReportUploaded ? report?.personal?.name : borrowerName;
  const userName = (isReportUploaded ? uploadedName : (customerProfile?.fullName || uploadedName || (!user?.isDemo ? user?.name : ''))) || 'Demo Borrower';
  const userEmail = customerProfile?.email || (isReportUploaded && report?.personal?.email ? report.personal.email : user?.email) || 'someone@example.com';
  const userPhone = customerProfile?.phone || (isReportUploaded && report?.personal?.phone ? report.personal.phone : user?.phone) || 'Not provided';
  const userPan = customerProfile?.pan || (isReportUploaded && (report?.personal?.panMasked || report?.personal?.pan)) || 'Not provided';
  const userDob = customerProfile?.dob || (isReportUploaded && report?.personal?.dateOfBirth) || 'Not provided';
  const userGender = customerProfile?.gender || (isReportUploaded && report?.personal?.gender) || 'Not specified';
  const userBureau = customerProfile?.creditBureau || (isReportUploaded ? 'CIBIL' : 'CIBIL');
  const addressLine = [
    customerProfile?.city || (isReportUploaded ? report?.personal?.city : undefined),
    customerProfile?.state || (isReportUploaded ? report?.personal?.state : undefined),
    customerProfile?.pincode ? `PIN: ${customerProfile.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const maskPan = (panStr: string) => {
    if (!panStr || panStr.length < 5) return panStr;
    return '••••••' + panStr.slice(-4);
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-4xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
            Customer Profile &amp; Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Section 21 CICRA compliance &amp; bureau identity records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-bold shadow-sm cursor-pointer transition-all self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{customerProfile ? 'Edit Customer Profile' : 'Complete Profile Form'}</span>
        </button>
      </div>

      {/* Completion Alert if Incomplete */}
      {!isProfileComplete && !user?.isDemo && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">Profile Incomplete</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Please complete your mandatory customer profile (PAN, DOB, Gender, Target Bureau) for authorized CIBIL dispute processing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Complete Now
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-900 flex items-center justify-center font-extrabold text-2xl border-2 border-indigo-200">
            {userName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#12233F]">{userName}</h2>
            <p className="text-xs text-slate-500 font-medium">{userEmail}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isProfileComplete
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                <span>{isProfileComplete ? 'Bureau Profile Verified' : 'Profile Pending'}</span>
              </span>

              {user?.isDemo && (
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                  Demo Mode
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bureau Profile Grid */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bureau Identity &amp; Statutory KYC
            </span>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Encrypted Store
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            {/* PAN Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">PAN Card</p>
                {userPan !== 'Not provided' && (
                  <button
                    type="button"
                    onClick={() => setShowPanClear(!showPanClear)}
                    className="text-indigo-700 hover:text-indigo-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {showPanClear ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPanClear ? 'Mask' : 'Show'}</span>
                  </button>
                )}
              </div>
              <p className="text-[#12233F] font-mono font-bold mt-1 tracking-wide">
                {userPan === 'Not provided' ? userPan : showPanClear ? userPan : maskPan(userPan)}
              </p>
            </div>

            {/* Mobile Number */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mobile Number</p>
              <p className="text-[#12233F] font-bold mt-1">{userPhone}</p>
            </div>

            {/* DOB */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date of Birth</p>
              <p className="text-[#12233F] font-bold mt-1">{userDob}</p>
            </div>

            {/* Gender */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Gender</p>
              <p className="text-[#12233F] font-bold mt-1">{userGender}</p>
            </div>

            {/* Credit Bureau */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Primary Credit Bureau</p>
              <p className="text-indigo-950 font-bold mt-1">{userBureau}</p>
            </div>

            {/* CRM Status */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/70">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] uppercase">
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>Google Sheets CRM</span>
              </div>
              <p className="text-emerald-900 font-bold mt-1 text-xs">
                {isProfileComplete ? 'Synchronized (Active Lead)' : 'Pending Sync'}
              </p>
            </div>
          </div>
        </div>

        {/* Address / Contact Info */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Address &amp; Communication Details
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email Address</p>
              <p className="text-[#12233F] font-bold mt-1">{userEmail}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">City, State &amp; PIN</p>
              <p className="text-[#12233F] font-bold mt-1">
                {addressLine || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Email Alerts & Bureau Monitoring Card */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Alerts &amp; Monitored CIBIL Report
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {alertSub?.status === 'ACTIVE' ? 'Active Subscription' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatic notifications for credit score shifts and detected dispute outcome resolutions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickTestAlert}
                disabled={isSendingTest}
                className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Send a test notification to your email"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isSendingTest ? 'Sending...' : 'Test Email Alert'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAlertModalInitialTab('preferences');
                  setIsAlertModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Manage Alert Settings</span>
              </button>
            </div>
          </div>

          {testSentMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testSentMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Monitored Score Alerts */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <div className="flex items-center justify-between text-blue-900 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                  <span>Score Change Alerts</span>
                </span>
                <span className="text-[10px] bg-blue-200/60 px-1.5 py-0.5 rounded text-blue-800">
                  {alertSub?.scoreAlertsEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-blue-800">
                Trigger: <strong>&gt;={alertSub?.scoreChangeThreshold || 5} Points shift</strong>
              </p>
              <p className="text-[10px] text-blue-600 mt-1">
                Direction: {alertSub?.scoreDirection === 'ANY' ? 'Increases & Drops' : alertSub?.scoreDirection}
              </p>
            </div>

            {/* Monitored Dispute Outcome Alerts */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center justify-between text-emerald-950 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Dispute Outcome Alerts</span>
                </span>
                <span className="text-[10px] bg-emerald-200/60 px-1.5 py-0.5 rounded text-emerald-800">
                  {alertSub?.disputeAlertsEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900">
                Bureaus: <strong>{alertSub?.monitoredBureaus?.join(', ') || 'CIBIL, Experian'}</strong>
              </p>
              <p className="text-[10px] text-emerald-700 mt-1">
                Overdue removals, NOCs &amp; Ombudsman updates
              </p>
            </div>

            {/* Recipient Email & Schedule */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-900 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Delivery Destination</span>
                </span>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                  {alertSub?.alertFrequency || 'INSTANT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-mono truncate">
                {alertSub?.email || userEmail}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Dispatched: {alertSub?.totalAlertsDispatched || 0} alerts delivered
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-2xl border-2 border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Session</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Update Profile</span>
          </button>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <CustomerProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        isMandatory={false}
      />

      {/* Alert Subscription Modal */}
      <AlertSubscriptionModal
        isOpen={isAlertModalOpen}
        onClose={() => {
          setIsAlertModalOpen(false);
          fetchAlertSub();
        }}
        initialTab={alertModalInitialTab}
        onAlertUpdated={(updated) => setAlertSub(updated)}
      />
    </div>
  );
};
