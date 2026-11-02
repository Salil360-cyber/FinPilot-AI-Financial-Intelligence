import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  Sparkles,
  UserCheck,
  Building2,
  Coins,
  ShieldCheck,
  X,
  HelpCircle,
} from 'lucide-react';
import { NavigationPage, NotificationItem } from '../../types/finance';
import { DEMO_NOTIFICATIONS, DEMO_USER_PROFILE } from '../../data/demoData';

interface TopbarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTriggerDemoAction?: (actionName: string) => void;
}

const PAGE_TITLES: Record<NavigationPage, { title: string; subtitle: string }> = {
  overview: {
    title: 'Financial Operations Overview',
    subtitle: 'Consolidated summary of invoice intelligence, expense ledgers, and bank reconciliation',
  },
  'invoice-intelligence': {
    title: 'Invoice Intelligence',
    subtitle: 'Automated OCR extraction, itemization, and tax audit rules',
  },
  'expense-ledger': {
    title: 'Expense Ledger',
    subtitle: 'Unified general ledger postings and transaction categorization',
  },
  'invoice-generator': {
    title: 'Invoice Generator',
    subtitle: 'Create and dispatch compliant B2B tax invoices',
  },
  'bank-reconciliation': {
    title: 'Bank Reconciliation',
    subtitle: 'Automated match engine pairing clearing accounts with book balances',
  },
  'financial-analytics': {
    title: 'Financial Analytics',
    subtitle: 'Profitability ratios, liquidity measures, and operating margins',
  },
  'revenue-forecast': {
    title: 'Revenue Forecast',
    subtitle: 'Multi-scenario projections and cash flow runway estimation',
  },
  'annual-report': {
    title: 'Annual Report Intelligence',
    subtitle: 'Deep document parser for 10-K, 10-Q, and audited financial statements',
  },
  'ai-advisory': {
    title: 'AI Financial Advisory',
    subtitle: 'Deterministic variance analysis and executive narrative generation',
  },
  'executive-reports': {
    title: 'Executive Reports',
    subtitle: 'Consolidated board packs and audit-committee ready presentations',
  },
  'help-center': {
    title: 'Help Center & Workflows',
    subtitle: 'Standard financial operating procedures, knowledge base, and financial glossary',
  },
  settings: {
    title: 'System & Entity Settings',
    subtitle: 'Fiscal calendar, accounting standards, and team permissions',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  activePage,
  onNavigate,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onTriggerDemoAction,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const currentPage = PAGE_TITLES[activePage] || {
    title: 'Financial Operations',
    subtitle: 'FinPilot AI Platform',
  };

  return (
    <header className="h-16 bg-[#0d1424] border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">FinPilot AI</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-slate-200 font-semibold truncate text-sm">
              {currentPage.title}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search demo ledger, vendors, invoices (e.g. AWS, Deloitte, TX-9841)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Demo Mode Tag, Notifications, Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Visible DEMO MODE Indicator */}
        <div
          title="FinPilot AI is operating in Foundation Demo Mode with verified mock records."
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 rounded-md text-amber-300 text-xs font-mono font-medium tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>DEMO MODE</span>
        </div>

        {/* Help Center & Guidance Button */}
        <button
          type="button"
          onClick={() => onNavigate('help-center')}
          className={`p-2 rounded-lg transition-colors ${
            activePage === 'help-center'
              ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
          title="Open Help Center, Workflows & Glossary"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121929] border border-slate-700/90 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Notifications</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    DEMO ALERTS
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.linkPage) {
                        onNavigate(item.linkPage);
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-3.5 hover:bg-slate-900/60 transition-colors cursor-pointer flex items-start gap-3 ${
                      !item.read ? 'bg-slate-900/40' : ''
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {item.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {item.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-medium text-slate-200 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 border-t border-slate-800 text-center bg-slate-900/40">
                <span className="text-[11px] text-slate-400">
                  Notification feed for demonstration purposes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-800"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center text-amber-300 font-semibold text-xs shadow-inner">
              EV
            </div>
            <div className="hidden sm:block text-left text-xs leading-none">
              <span className="font-medium text-slate-200 block">
                {DEMO_USER_PROFILE.name.split(',')[0]}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Controller
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#121929] border border-slate-700/90 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="font-semibold text-white">{DEMO_USER_PROFILE.name}</div>
                <div className="text-slate-400 text-[11px] font-mono">{DEMO_USER_PROFILE.email}</div>
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{DEMO_USER_PROFILE.organization}</span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <div className="px-3 py-1.5 text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Role:</span>
                  <span className="font-medium">{DEMO_USER_PROFILE.role}</span>
                </div>
                <div className="px-3 py-1.5 text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Currency:</span>
                  <span className="font-mono">{DEMO_USER_PROFILE.reportingCurrency}</span>
                </div>
                <div className="px-3 py-1.5 text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Fiscal Year End:</span>
                  <span className="font-mono">{DEMO_USER_PROFILE.fiscalYearEnd}</span>
                </div>
              </div>

              <div className="px-2 pt-2 border-t border-slate-800 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-between"
                >
                  <span>Entity Settings</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="px-3 py-1.5 text-[11px] text-amber-400/90 bg-amber-400/5 rounded font-mono">
                  Active in Demo Mode
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
