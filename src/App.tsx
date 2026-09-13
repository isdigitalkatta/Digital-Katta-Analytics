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
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { UploadModal } from './components/UploadModal';
import { DashboardOverview } from './components/DashboardOverview';
import { NegativeAccountsView } from './components/NegativeAccountsView';
import { PaymentHistoryHeatmap } from './components/PaymentHistoryHeatmap';
import { UtilizationAndMixView } from './components/UtilizationAndMixView';
import { DisputeOpportunitiesView } from './components/DisputeOpportunitiesView';
import { ActionPlanView } from './components/ActionPlanView';
import { LetterGeneratorView } from './components/LetterGeneratorView';
import { AccountsListView } from './components/AccountsListView';
import { EnquiriesView } from './components/EnquiriesView';
import { AskAIAssistant } from './components/AskAIAssistant';
import { ExportReportView } from './components/ExportReportView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { PrivacyModal } from './components/PrivacyModal';
import { ScoreGauge } from './components/ScoreGauge';
import { Menu, X } from 'lucide-react';

export function App() {
  const [report, setReport] = useState<NormalizedCreditReport | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Prefill state for letter generator
  const [letterPrefillAccount, setLetterPrefillAccount] = useState<string | undefined>();
  const [letterPrefillIssue, setLetterPrefillIssue] = useState<string | undefined>();

  // Process newly loaded report
  const handleReportLoaded = async (loadedReport: NormalizedCreditReport) => {
    setReport(loadedReport);
    setCurrentTab('dashboard');

    // Step 1: Immediate factual baseline from deterministic engine
    const baseline = runDeterministicAnalysis(loadedReport);
    setAnalysis(baseline);

    // Step 2: Enrich with server-side AI analysis asynchronously
    setIsAnalyzing(true);
    try {
      // Track analytics anonymously
      fetch('/api/stats/track', { method: 'POST' }).catch(() => {});

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    setCurrentTab('dashboard');
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Navigation */}
      <Navbar
        report={report}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectDemo={handleSelectDemo}
        onClearReport={handleClearReport}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onToggleChat={() => setIsChatOpen(prev => !prev)}
        isChatOpen={isChatOpen}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* If no report is loaded, show Landing Page */}
        {!report || !analysis ? (
          <LandingPage
            onOpenUpload={() => setIsUploadOpen(true)}
            onSelectDemo={handleSelectDemo}
            onOpenPrivacy={() => setIsPrivacyOpen(true)}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Left Sidebar */}
            <div className="hidden md:block">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={tab => setCurrentTab(tab)}
                negativeAccountsCount={analysis.negativeAccounts.length}
                disputeCount={analysis.disputeOpportunities.length}
                isDemo={report.personal.name.includes('Demo') || report.personal.name.includes('Arun') || report.personal.name.includes('Priya')}
              />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileSidebarOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                  onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
                <div className="relative z-10 w-64 bg-slate-900 h-full overflow-y-auto">
                  <div className="p-4 flex items-center justify-between border-b border-slate-800">
                    <span className="text-sm font-bold text-white">Menu</span>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <Sidebar
                    currentTab={currentTab}
                    onSelectTab={tab => {
                      setCurrentTab(tab);
                      setIsMobileSidebarOpen(false);
                    }}
                    negativeAccountsCount={analysis.negativeAccounts.length}
                    disputeCount={analysis.disputeOpportunities.length}
                  />
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {/* Mobile Menu Toggle button */}
              <div className="md:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <Menu className="w-4 h-4 text-blue-600" />
                  <span>Navigate Tabs</span>
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  {currentTab}
                </span>
              </div>

              {/* Views Based on Current Tab */}
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  report={report}
                  analysis={analysis}
                  onNavigateTab={tab => setCurrentTab(tab)}
                  onSelectAccountForLetter={id => {
                    setLetterPrefillAccount(id);
                    setCurrentTab('letter');
                  }}
                />
              )}

              {currentTab === 'score' && (
                <div className="space-y-6 max-w-2xl mx-auto pb-12">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs text-center space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 font-heading">
                      CIBIL TransUnion Credit Score
                    </h2>
                    <ScoreGauge
                      score={report.score.score}
                      category={report.score.category}
                      riskLevel={report.score.riskLevel}
                    />
                    <div className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto pt-2">
                      In India, TransUnion CIBIL scores range from 300 to 900. Lenders consider scores above 750 as prime benchmark for low-interest home loans and premium credit cards.
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'accounts' && (
                <AccountsListView
                  accounts={report.accounts}
                  onDraftLetter={handleDraftLetterForAccount}
                  onNavigateHistory={() => setCurrentTab('history')}
                />
              )}

              {currentTab === 'negative' && (
                <NegativeAccountsView
                  negativeAccounts={analysis.negativeAccounts}
                  allAccounts={report.accounts}
                  onDraftLetter={handleDraftLetterForAccount}
                  onNavigateHistory={() => setCurrentTab('history')}
                />
              )}

              {currentTab === 'history' && (
                <PaymentHistoryHeatmap
                  accounts={report.accounts}
                  paymentBehaviour={analysis.paymentBehaviour}
                />
              )}

              {currentTab === 'enquiries' && (
                <EnquiriesView
                  enquiries={report.enquiries}
                  enquiryAnalysis={analysis.enquiryAnalysis}
                  onDraftDisputeLetter={handleDraftLetterForEnquiry}
                />
              )}

              {currentTab === 'utilization' && (
                <UtilizationAndMixView
                  report={report}
                  utilizationAnalysis={analysis.utilizationAnalysis}
                />
              )}

              {currentTab === 'ai-analysis' && (
                <div className="space-y-6 pb-12">
                  <AskAIAssistant report={report} isOpen={true} isDrawer={false} />
                </div>
              )}

              {currentTab === 'disputes' && (
                <DisputeOpportunitiesView
                  disputes={analysis.disputeOpportunities}
                  onDraftLetterForDispute={handleDraftLetterForDispute}
                />
              )}

              {currentTab === 'action-plan' && (
                <ActionPlanView actionPlan={analysis.actionPlan30_60_90} />
              )}

              {currentTab === 'letter' && (
                <LetterGeneratorView
                  report={report}
                  prefillAccountId={letterPrefillAccount}
                  prefillIssueType={letterPrefillIssue}
                />
              )}

              {currentTab === 'export' && (
                <ExportReportView report={report} analysis={analysis} />
              )}

              {currentTab === 'admin' && <AdminDashboardView />}

              {currentTab === 'settings' && (
                <div className="max-w-2xl mx-auto space-y-6 pb-12">
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 font-heading">
                      Privacy & Data Retention Settings
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Digital Katta runs with a strict zero-retention privacy guarantee. No financial records, PAN numbers, or account details are saved in persistent databases.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleClearReport}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Delete Current Report Data Immediately
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* Slide-out AI Assistant Drawer */}
            {isChatOpen && (
              <AskAIAssistant
                report={report}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                isDrawer={true}
              />
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}

export default App;
