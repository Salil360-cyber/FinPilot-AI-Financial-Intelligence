/**
 * FinPilot AI - Phase 12 Welcome & First-Time Onboarding Modal
 * Welcomes new users, explains Demo vs Real Data modes, presents module overview,
 * and provides clear non-destructive entry points.
 */

import React, { useState } from 'react';
import {
  Compass,
  Database,
  ShieldAlert,
  ArrowRight,
  X,
  FileText,
  BookOpen,
  PieChart,
  Scale,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import { markWelcomeCompleted, dismissOnboarding } from '../../services/onboardingService';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: NavigationPage) => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'welcome' | 'modules' | 'datamodes'>('welcome');

  if (!isOpen) return null;

  const handleStartWithDemo = () => {
    markWelcomeCompleted(true);
    onClose();
    onNavigate('overview');
  };

  const handleExploreApp = () => {
    markWelcomeCompleted(false);
    onClose();
    onNavigate('overview');
  };

  const handleSkip = () => {
    dismissOnboarding();
    onClose();
  };

  const modulePillars = [
    {
      title: 'Invoice Intelligence',
      desc: 'Local browser-based OCR extractions and duplicate vendor bill detection.',
      icon: FileText,
      page: 'invoice-intelligence' as NavigationPage,
      color: 'text-blue-400',
    },
    {
      title: 'Expense & General Ledger',
      desc: 'Double-entry balanced accounting with sequential Voucher IDs and audit trails.',
      icon: BookOpen,
      page: 'expense-ledger' as NavigationPage,
      color: 'text-amber-400',
    },
    {
      title: 'Bank Reconciliation',
      desc: '3-tier deterministic auto-matching of bank clearing files against book entries.',
      icon: Scale,
      page: 'bank-reconciliation' as NavigationPage,
      color: 'text-emerald-400',
    },
    {
      title: 'Financial Analytics & Ratios',
      desc: 'Deterministic Current Ratio, Quick Ratio, Working Capital, and margin scorecards.',
      icon: PieChart,
      page: 'financial-analytics' as NavigationPage,
      color: 'text-purple-400',
    },
    {
      title: 'AI Advisory & Reports',
      desc: 'Evidence-grounded operational insights and board-ready executive briefings.',
      icon: Sparkles,
      page: 'ai-advisory' as NavigationPage,
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0f172a] shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Welcome to FinPilot AI
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
                  Phase 12
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Enterprise Financial Operations & Intelligent Accounting Suite
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Close / Skip for now"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-800/80 bg-[#0b101b] px-6 text-sm">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`py-3 px-4 font-medium transition border-b-2 flex items-center gap-2 ${
              activeTab === 'welcome'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Welcome Overview
          </button>
          <button
            onClick={() => setActiveTab('datamodes')}
            className={`py-3 px-4 font-medium transition border-b-2 flex items-center gap-2 ${
              activeTab === 'datamodes'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Demo vs Real Data
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-3 px-4 font-medium transition border-b-2 flex items-center gap-2 ${
              activeTab === 'modules'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Core Capabilities
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {activeTab === 'welcome' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90">
                <p className="text-base text-slate-200 leading-relaxed font-normal">
                  FinPilot AI brings complete, auditable financial operations into your browser.
                  Whether you are processing supplier invoices, closing monthly bank reconciliations,
                  calculating solvency ratios, or projecting rolling runway, all calculations are
                  strictly deterministic, private, and auditable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#121929] border border-slate-800">
                  <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 100% Client-Side
                  </div>
                  <p className="text-xs text-slate-400">
                    Documents are scanned locally with zero data sent to external servers or paid third-party APIs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#121929] border border-slate-800">
                  <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Audit-Grade GL
                  </div>
                  <p className="text-xs text-slate-400">
                    Double-entry bookkeeping enforcing strict Debits = Credits balance with sequential Voucher IDs.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#121929] border border-slate-800">
                  <div className="text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Safe Data Backups
                  </div>
                  <p className="text-xs text-slate-400">
                    Export and restore portable encrypted JSON backup files anytime with cryptographic checksums.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> You can reopen this onboarding guide anytime from the{' '}
                  <span className="text-amber-300 font-medium">Help & Workflows</span> page in the sidebar
                  or from the <span className="text-amber-300 font-medium">Settings</span> page.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'datamodes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Database className="w-4 h-4" /> Demo Data Mode
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Preloaded with realistic enterprise transactions, posted vouchers, and historical
                    revenue figures. Ideal for testing invoice OCR, running auto-match reconciliations,
                    and testing forecasting scenarios without risking live accounting records.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pt-1 list-disc list-inside">
                    <li>Ready-to-test sample vendor invoices</li>
                    <li>Pre-configured general ledger chart of accounts</li>
                    <li>Sample bank statement for auto-matching</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <ShieldAlert className="w-4 h-4" /> Real Accounting Records
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    When you are ready to use FinPilot for your business, you can manage your live
                    financial operations cleanly. In Settings &gt; Data Management, you can reset
                    sample records and upload your actual bank CSVs and supplier invoices.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 pt-1 list-disc list-inside">
                    <li>Zero cloud leakage: all live data remains in your browser</li>
                    <li>Export encrypted JSON backup archives anytime</li>
                    <li>Strict double-entry validation on all manual entries</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Explore the 11 integrated modules designed for end-to-end financial operations:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modulePillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="p-3 rounded-xl bg-[#121929] border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5 font-medium text-slate-200 text-xs mb-1">
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        {item.title}
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-[#121929]">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
          >
            Skip for Now
          </button>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExploreApp}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium transition"
            >
              Explore Application
            </button>
            <button
              onClick={handleStartWithDemo}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              Start with Demo Data
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
