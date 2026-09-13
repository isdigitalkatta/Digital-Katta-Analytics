import React from 'react';
import {
  ShieldAlert,
  CreditCard,
  History,
  Search,
  PieChart,
  BrainCircuit,
  FileCheck2,
  CalendarDays,
  FileText,
  Download,
  BarChart3,
  Settings,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'score'
  | 'accounts'
  | 'negative'
  | 'history'
  | 'enquiries'
  | 'utilization'
  | 'ai-analysis'
  | 'disputes'
  | 'action-plan'
  | 'letter'
  | 'export'
  | 'admin'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  negativeAccountsCount: number;
  disputeCount: number;
  isDemo?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  negativeAccountsCount,
  disputeCount,
  isDemo,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'score', label: 'Credit Score', icon: ShieldCheck },
    { id: 'accounts', label: 'All Accounts', icon: CreditCard },
    {
      id: 'negative',
      label: 'Negative Accounts',
      icon: ShieldAlert,
      badge: negativeAccountsCount > 0 ? negativeAccountsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'history', label: 'Payment History', icon: History },
    { id: 'enquiries', label: 'Enquiries', icon: Search },
    { id: 'utilization', label: 'Credit Utilization', icon: PieChart },
    { id: 'ai-analysis', label: 'AI Diagnosis', icon: BrainCircuit },
    {
      id: 'disputes',
      label: 'Dispute Opportunities',
      icon: FileCheck2,
      badge: disputeCount > 0 ? disputeCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'action-plan', label: 'Action Plan (30-60-90)', icon: CalendarDays },
    { id: 'letter', label: 'Generate Letter', icon: FileText },
    { id: 'export', label: 'Export Report', icon: Download },
    { id: 'admin', label: 'Admin Insights', icon: BarChart3 },
    { id: 'settings', label: 'Privacy & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 shrink-0 flex flex-col border-r border-slate-800 select-none min-h-screen">
      {/* Brand area */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            DK
          </div>
          <div>
            <span className="font-heading text-lg font-bold text-white tracking-tight">
              Digital Katta
            </span>
            <p className="text-[11px] font-medium text-slate-400 -mt-0.5">
              AI CIBIL Analyzer
            </p>
          </div>
        </div>
        {isDemo && (
          <div className="mt-3 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold text-center">
            DEMO DATA – NOT A REAL REPORT
          </div>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Analysis
        </div>
        {navItems.slice(0, 7).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          AI & Resolution
        </div>
        {navItems.slice(7).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Security & Disclaimer Footer */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 leading-tight space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Retention Privacy</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Not affiliated with CIBIL, TransUnion, or RBI.
        </p>
      </div>
    </aside>
  );
};
