import React, { useState, useEffect } from 'react';
import {
  NormalizedCreditReport,
  AIAnalysisResult,
  CreditAccount,
  NegativeAccountAnalysis,
  DisputeOpportunity,
  CreditEnquiry,
} from './types';
import { runDeterministicAnalysis } from './utils/hybridAnalysisEngine';
import { demoStressedReport, demoGoodReport } from './data/demoReports';
import { DashboardShell, DashboardTab } from './components/DashboardShell';
import { HomePage } from './components/pages/HomePage';
import { AnalysisPage } from './components/pages/AnalysisPage';
import { ActionPlanPage } from './components/pages/ActionPlanPage';
import { FutureOutlookPage } from './components/pages/FutureOutlookPage';
import { UploadReportPage } from './components/pages/UploadReportPage';
import { ResourcesPage } from './components/pages/ResourcesPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { LoginScreen } from './components/LoginScreen';
import { downloadAiAnalysisReportPdf } from './utils/pdfExport';
import { useIdleTimer } from './hooks/useIdleTimer';
import { useAppLanguage } from './hooks/useAppLanguage';

// Granular sub-views
import { UploadModal } from './components/UploadModal';
import { NegativeAccountsView } from './components/NegativeAccountsView';
import { PaymentHistoryHeatmap } from './components/PaymentHistoryHeatmap';
import { UtilizationAndMixView } from './components/UtilizationAndMixView';
import { DisputeOpportunitiesView } from './components/DisputeOpportunitiesView';
import { LetterGeneratorView } from './components/LetterGeneratorView';
import { AccountsListView } from './components/AccountsListView';
import { EnquiriesView } from './components/EnquiriesView';
import { AskAIAssistant } from './components/AskAIAssistant';
import { ExportReportView } from './components/ExportReportView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { StaffCrmPortal } from './components/crm/StaffCrmPortal';
import { PrivacyModal } from './components/PrivacyModal';
import { ScoreGauge } from './components/ScoreGauge';
import { AuthModal } from './components/AuthModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { LegalDisclaimer } from './components/LegalDisclaimer';
import { useAuth } from './context/AuthContext';

export function App() {
  const {
    isAuthenticated,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    authenticatedFetch,
    user,
    isMandatoryProfileModalOpen,
    closeMandatoryProfileModal,
    mandatoryProfileFeatureEnabled,
    isProfileComplete,
    isStaff,
    syncUploadedBorrowerName,
  } = useAuth();
  
  const { currentLang, isRtl } = useAppLanguage();
  
  // Initialize with the standard stressed demo dataset (matches the 642 score in mockup)
  const [report, setReport] = useState<NormalizedCreditReport | null>(demoStressedReport);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(() => runDeterministicAnalysis(demoStressedReport));
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<DashboardTab>('home');
  // MANDATORY: Login screen is strictly enforced at the start of every session
  const [showLoginView, setShowLoginView] = useState<boolean>(true);
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(false);
  const [sessionTimedOut, setSessionTimedOut] = useState<boolean>(false);

  // Dedicated Link for Staff CRM (#staff, #crm, ?portal=staff, /staff)
  const isStaffUrl = () => {
    try {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      return (
        hash === '#staff' ||
        hash === '#crm' ||
        hash.includes('staff') ||
        hash.includes('crm') ||
        search.includes('portal=staff') ||
        search.includes('view=staff') ||
        search.includes('staff=true') ||
        search.includes('crm=true') ||
        path.startsWith('/staff') ||
        path.startsWith('/crm')
      );
    } catch {
      return false;
    }
  };

  const [isStaffPortalActive, setIsStaffPortalActive] = useState<boolean>(isStaffUrl);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsStaffPortalActive(isStaffUrl());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const openStaffPortal = () => {
    window.location.hash = 'staff';
    setIsStaffPortalActive(true);
  };

  const closeStaffPortal = () => {
    try {
      if (window.location.hash.includes('staff') || window.location.hash.includes('crm')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('portal') || searchParams.has('view') || searchParams.has('staff') || searchParams.has('crm')) {
        searchParams.delete('portal');
        searchParams.delete('view');
        searchParams.delete('staff');
        searchParams.delete('crm');
        const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + cleanSearch);
      }
    } catch {}
    setIsStaffPortalActive(false);
    setCurrentTab('home');
  };

  const handleSessionUnlock = (targetTab?: DashboardTab) => {
    try {
      sessionStorage.setItem('digitalkatta_session_unlocked', 'true');
    } catch {}
    setIsStaffPortalActive(false);
    try {
      if (window.location.hash.includes('staff') || window.location.hash.includes('crm')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('portal') || searchParams.has('view') || searchParams.has('staff') || searchParams.has('crm')) {
        searchParams.delete('portal');
        searchParams.delete('view');
        searchParams.delete('staff');
        searchParams.delete('crm');
        const cleanSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState(null, '', window.location.pathname + cleanSearch);
      }
    } catch {}
    setIsSessionUnlocked(true);
    setShowLoginView(false);
    setSessionTimedOut(false);
    setCurrentTab(targetTab || 'home');
  };

  // 5-Minute Inactivity Idle Timer:
  // Monitors keyboard, mouse, touch, scroll and window visibility.
  // When 5 minutes of inactivity elapse, automatically resets sessionStorage and locks the app.
  useIdleTimer({
    timeoutMs: 5 * 60 * 1000, // 5 minutes
    enabled: isSessionUnlocked && !showLoginView,
    onIdle: () => {
      // Automatically reset session storage
      try {
        sessionStorage.removeItem('digitalkatta_session_unlocked');
        sessionStorage.clear();
      } catch (err) {
        console.warn('Error clearing sessionStorage on idle:', err);
      }
      setIsSessionUnlocked(false);
      setShowLoginView(true);
      setSessionTimedOut(true);
    },
  });

  // AI Report Analysis PDF Downloader
  const handleDownloadPdf = async () => {
    try {
      await downloadAiAnalysisReportPdf(report, analysis);
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  // Derive active borrower name:
  // When report is uploaded, use the uploaded report's borrower name.
  // In demo mode or when unauthenticated, do not use real people names (use 'Demo Borrower' / 'Borrower').
  const hasUploadedReport = Boolean(report && report.rawSourceType !== 'DEMO' && report.personal?.name);
  const activeBorrowerName = hasUploadedReport
    ? (report?.personal?.name || 'Borrower')
    : (!user?.isDemo && user?.name ? user.name : 'Demo Borrower');

  const activeBorrowerFirstName = hasUploadedReport
    ? (report?.personal?.name ? report.personal.name.split(' ')[0] : 'Borrower')
    : (!user?.isDemo && user?.name ? String(user.name).split(' ')[0] : 'Borrower');

  // Listen for user logout to re-lock the session and present LoginScreen
  useEffect(() => {
    const handleLogoutEvent = () => {
      setIsSessionUnlocked(false);
      setShowLoginView(true);
      setSessionTimedOut(false);
    };

    window.addEventListener('digitalkatta_logout', handleLogoutEvent);
    return () => window.removeEventListener('digitalkatta_logout', handleLogoutEvent);
  }, []);

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Prefill state for letter generator
  const [letterPrefillAccount, setLetterPrefillAccount] = useState<string | undefined>();
  const [letterPrefillIssue, setLetterPrefillIssue] = useState<string | undefined>();

  // Process newly loaded report
  const handleReportLoaded = async (loadedReport: NormalizedCreditReport) => {
    // Clear any previous report action items from localStorage
    try {
      localStorage.removeItem('digitalkatta_action_plan_tasks');
      localStorage.removeItem('digitalkatta_strategic_action_plan');
    } catch {}

    setReport(loadedReport);
    setCurrentTab('analysis');

    // Sync borrower name from uploaded report to profile, user session, and CRM
    if (loadedReport.personal?.name && loadedReport.rawSourceType !== 'DEMO') {
      try {
        await syncUploadedBorrowerName(
          loadedReport.personal.name,
          loadedReport.personal.email,
          loadedReport.personal.phone,
          loadedReport.personal.pan
        );
      } catch {}
    }

    // Step 1: Immediate factual baseline from deterministic engine
    const baseline = runDeterministicAnalysis(loadedReport);
    setAnalysis(baseline);

    // Step 2: Enrich with server-side AI analysis asynchronously
    setIsAnalyzing(true);
    try {
      fetch('/api/stats/track', { method: 'POST' }).catch(() => {});

      const res = await authenticatedFetch('/api/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          report: loadedReport,
          deterministicBaseline: baseline,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          setAnalysis(data.result);
        }
      }
    } catch (err) {
      console.warn('AI enrichment fetch failed, keeping deterministic baseline:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Select demo dataset
  const handleSelectDemo = (demoId: 'stressed' | 'good') => {
    const selected = demoId === 'stressed' ? demoStressedReport : demoGoodReport;
    handleReportLoaded(selected);
  };

  // Clear / delete report data (privacy compliance)
  const handleClearReport = () => {
    setReport(null);
    setAnalysis(null);
    setCurrentTab('home');
  };

  // Navigation helpers
  const handleDraftLetterForAccount = (account: CreditAccount | NegativeAccountAnalysis) => {
    const accId = 'accountId' in account ? account.accountId : account.id;
    setLetterPrefillAccount(accId);
    setCurrentTab('letter');
  };

  const handleDraftLetterForDispute = (dispute: DisputeOpportunity) => {
    if (dispute.accountId) {
      setLetterPrefillAccount(dispute.accountId);
    }
    setLetterPrefillIssue(dispute.issue);
    setCurrentTab('letter');
  };

  const handleDraftLetterForEnquiry = (enquiry: CreditEnquiry) => {
    setLetterPrefillIssue(`Unauthorized Hard Enquiry by ${enquiry.institution}`);
    setCurrentTab('letter');
  };

  // SEPARATE STAFF CRM PORTAL LINK: If user navigates to staff CRM, render Staff Portal
  if (isStaffPortalActive) {
    return (
      <StaffCrmPortal onReturnToCustomer={closeStaffPortal} />
    );
  }

  // MANDATORY: Customer Login screen is shown at the start of every session or when idle
  // Notice: Customer login strictly contains NO staff login or staff CRM tabs
  if (!isSessionUnlocked || showLoginView) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]" key={currentLang} dir={isRtl ? 'rtl' : 'ltr'}>
        <LoginScreen
          onSuccess={handleSessionUnlock}
          onCancel={handleSessionUnlock}
          onNavigateToStaffPortal={openStaffPortal}
          sessionTimedOut={sessionTimedOut}
        />
        <CustomerProfileModal
          isOpen={
            isMandatoryProfileModalOpen ||
            Boolean(isAuthenticated && !user?.isDemo && mandatoryProfileFeatureEnabled && !isProfileComplete)
          }
          onClose={() => {
            closeMandatoryProfileModal();
            handleSessionUnlock();
          }}
          isMandatory={!user?.isDemo && mandatoryProfileFeatureEnabled && !isProfileComplete}
          report={report}
        />
      </div>
    );
  }

  return (
    <div key={currentLang} dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen">
      <DashboardShell
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'home') {
            closeStaffPortal();
          }
          setCurrentTab(tab);
        }}
        negativeAccountsCount={analysis?.negativeAccounts.length || 0}
        disputeCount={analysis?.disputeOpportunities.length || 0}
        instantDisputeCount={
          analysis?.instantDisputeCount ||
          (analysis?.disputeOpportunities || []).filter((d) => d.isInstantDisputeCandidate || d.isClericalError).length
        }
        onToggleChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        onDownloadPdf={handleDownloadPdf}
        borrowerName={activeBorrowerName}
      >
      {/* ========================================================= */}
      {/* PAGE A: HOME                                              */}
      {/* ========================================================= */}
      {currentTab === 'home' && (
        <HomePage
          report={report}
          analysis={analysis}
          userName={activeBorrowerFirstName}
          onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* ========================================================= */}
      {/* PAGE B: ANALYSIS (CIBIL Report Analysis)                  */}
      {/* ========================================================= */}
      {currentTab === 'analysis' && (
        <AnalysisPage
          report={report}
          analysis={analysis}
          onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
          onDraftLetter={handleDraftLetterForAccount}
          onDraftDisputeLetter={handleDraftLetterForDispute}
        />
      )}

      {/* ========================================================= */}
      {/* PAGE C: ACTION PLAN                                       */}
      {/* ========================================================= */}
      {currentTab === 'action-plan' && (
        <ActionPlanPage
          report={report}
          analysis={analysis}
          onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
        />
      )}

      {/* ========================================================= */}
      {/* FUTURE OUTLOOK & SCORE TRAJECTORY                         */}
      {/* ========================================================= */}
      {currentTab === 'future-outlook' && (
        <FutureOutlookPage
          report={report}
          analysis={analysis}
          onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
        />
      )}

      {/* ========================================================= */}
      {/* PAGE D: UPLOAD REPORT (Under My Reports)                   */}
      {/* ========================================================= */}
      {currentTab === 'my-reports' && (
        <UploadReportPage
          onReportLoaded={handleReportLoaded}
          onSelectDemo={handleSelectDemo}
          currentReport={report}
          onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
        />
      )}

      {/* ========================================================= */}
      {/* DISPUTE SUPPORT (Dispute Opportunities + Letters)         */}
      {/* ========================================================= */}
      {currentTab === 'disputes' && (
        <div className="space-y-6 max-w-6xl mx-auto pb-10 text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-extrabold text-[#12233F] font-heading">
                Dispute Opportunities &amp; Bureau Resolution
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Statutory dispute claims under Section 21 of the CICRA Act 2005.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('letter')}
              className="px-4 py-2 rounded-xl bg-[#F56B2B] text-white font-bold text-xs shadow-xs hover:bg-[#E05A1D] cursor-pointer"
            >
              Draft Formal Notice
            </button>
          </div>

          {analysis ? (
            <DisputeOpportunitiesView
              disputes={analysis.disputeOpportunities}
              onDraftLetterForDispute={handleDraftLetterForDispute}
            />
          ) : (
            <p className="text-sm text-slate-500">Please upload a report to inspect disputes.</p>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* RESOURCES PAGE                                            */}
      {/* ========================================================= */}
      {currentTab === 'resources' && <ResourcesPage />}

      {/* ========================================================= */}
      {/* PROFILE PAGE                                              */}
      {/* ========================================================= */}
      {currentTab === 'profile' && (
        <ProfilePage report={report} borrowerName={activeBorrowerName} />
      )}

      {/* ========================================================= */}
      {/* PRESERVED GRANULAR SUB-TABS FOR 100% RETENTION            */}
      {/* ========================================================= */}
      {currentTab === 'negative' && analysis && report && (
        <div className="max-w-6xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('analysis')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to CIBIL Analysis
          </button>
          <NegativeAccountsView
            negativeAccounts={analysis.negativeAccounts}
            allAccounts={report.accounts}
            onDraftLetter={handleDraftLetterForAccount}
            onNavigateHistory={() => setCurrentTab('history')}
          />
        </div>
      )}

      {currentTab === 'history' && report && analysis && (
        <div className="max-w-6xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('analysis')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to CIBIL Analysis
          </button>
          <PaymentHistoryHeatmap
            accounts={report.accounts}
            paymentBehaviour={analysis.paymentBehaviour}
          />
        </div>
      )}

      {currentTab === 'utilization' && report && analysis && (
        <div className="max-w-6xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('analysis')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to CIBIL Analysis
          </button>
          <UtilizationAndMixView
            report={report}
            utilizationAnalysis={analysis.utilizationAnalysis}
          />
        </div>
      )}

      {currentTab === 'enquiries' && report && analysis && (
        <div className="max-w-6xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('analysis')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to CIBIL Analysis
          </button>
          <EnquiriesView
            enquiries={report.enquiries}
            enquiryAnalysis={analysis.enquiryAnalysis}
            onDraftDisputeLetter={handleDraftLetterForEnquiry}
          />
        </div>
      )}

      {currentTab === 'accounts' && report && (
        <div className="max-w-6xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('analysis')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to CIBIL Analysis
          </button>
          <AccountsListView
            accounts={report.accounts}
            onDraftLetter={handleDraftLetterForAccount}
            onNavigateHistory={() => setCurrentTab('history')}
          />
        </div>
      )}

      {currentTab === 'letter' && report && (
        <div className="max-w-5xl mx-auto pb-10 text-left">
          <button
            onClick={() => setCurrentTab('disputes')}
            className="text-xs font-bold text-[#F56B2B] hover:underline mb-4 inline-block cursor-pointer"
          >
            ← Back to Dispute Support
          </button>
          <LetterGeneratorView
            report={report}
            prefillAccountId={letterPrefillAccount}
            prefillIssueType={letterPrefillIssue}
          />
        </div>
      )}

      {currentTab === 'export' && report && analysis && (
        <div className="max-w-5xl mx-auto pb-10 text-left">
          <ExportReportView report={report} analysis={analysis} />
        </div>
      )}

      {currentTab === 'admin' && (
        <div className="max-w-7xl mx-auto pb-10 text-left">
          {isStaff ? (
            <StaffCrmPortal onReturnToCustomer={() => setCurrentTab('home')} />
          ) : (
            <HomePage
              report={report}
              analysis={analysis}
              userName={activeBorrowerFirstName}
              onNavigate={(tab) => setCurrentTab(tab as DashboardTab)}
              onDownloadPdf={handleDownloadPdf}
            />
          )}
        </div>
      )}

      {/* Slide-out AI Assistant Drawer */}
      {isChatOpen && (
        <AskAIAssistant
          report={report}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          isDrawer={true}
        />
      )}

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onReportLoaded={handleReportLoaded}
        onSelectDemo={handleSelectDemo}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onPurgeData={handleClearReport}
        hasActiveReport={!!report}
      />

      <AuthModal
        isOpen={isAuthOpen || isAuthModalOpen}
        onClose={() => {
          setIsAuthOpen(false);
          closeAuthModal();
        }}
        onNavigateToCrm={() => {
          setIsAuthOpen(false);
          closeAuthModal();
          openStaffPortal();
        }}
      />

      <CustomerProfileModal
        isOpen={
          isMandatoryProfileModalOpen ||
          Boolean(isAuthenticated && !user?.isDemo && mandatoryProfileFeatureEnabled && !isProfileComplete)
        }
        onClose={closeMandatoryProfileModal}
        isMandatory={!user?.isDemo && mandatoryProfileFeatureEnabled && !isProfileComplete}
        report={report}
      />
    </DashboardShell>
    </div>
  );
}

export default App;

