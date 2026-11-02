import React from 'react';
import {
  LayoutDashboard,
  FileSearch,
  BookOpen,
  Receipt,
  Scale,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  BrainCircuit,
  Briefcase,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import { useFinancial } from '../../context/FinancialContext';

interface SidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  isOpen: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  id: NavigationPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category?: string;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'invoice-intelligence', label: 'Invoice Intelligence', icon: FileSearch, badge: 'OCR' },
  { id: 'expense-ledger', label: 'Expense Ledger', icon: BookOpen },
  { id: 'invoice-generator', label: 'Invoice Generator', icon: Receipt },
  { id: 'bank-reconciliation', label: 'Bank Reconciliation', icon: Scale, badge: '25%' },
  { id: 'financial-analytics', label: 'Financial Analytics', icon: BarChart3 },
  { id: 'revenue-forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'annual-report', label: 'Annual Report Intelligence', icon: FileSpreadsheet },
  { id: 'ai-advisory', label: 'AI Financial Advisory', icon: BrainCircuit, badge: 'Heuristic' },
  { id: 'executive-reports', label: 'Executive Reports', icon: Briefcase },
  { id: 'help-center', label: 'Help & Workflows', icon: HelpCircle, badge: 'Phase 12' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  isOpen,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { activeSessionSummary } = useFinancial();
  const matchRateBadge = activeSessionSummary
    ? `${Math.round(activeSessionSummary.matchRatePercent)}%`
    : '25%';

  const handleItemClick = (page: NavigationPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0d1424] border-r border-slate-800/90 flex flex-col transition-all duration-200 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div
            onClick={() => handleItemClick('overview')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            {isOpen && (
              <div className="min-w-0">
                <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                  FinPilot <span className="text-amber-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                  FINANCIAL OPERATIONS
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const badge = item.id === 'bank-reconciliation' ? matchRateBadge : item.badge;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {isOpen && (
                  <span className="truncate flex-1 text-left whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {isOpen && badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border text-right shrink-0 ${
                      isActive
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Status Box */}
        {isOpen ? (
          <div className="p-3 m-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-slate-200 text-[11px]">System Status</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Deterministic verification active. Zero unverified accounting assumptions.
            </p>
            <div className="text-[10px] font-mono text-slate-400">
              Workspace: Meridian Corp
            </div>
          </div>
        ) : (
          <div className="p-3 text-center border-t border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" title="System Normal" />
          </div>
        )}
      </aside>
    </>
  );
};
