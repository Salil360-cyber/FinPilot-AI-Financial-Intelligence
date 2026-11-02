import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  ShieldCheck,
  RotateCcw,
  Play,
  Layers,
  ChevronDown,
  Building2,
  Plus,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { ReconciliationWorkbench } from '../components/reconciliation/ReconciliationWorkbench';
import { StatementImportWizard } from '../components/reconciliation/StatementImportWizard';
import { SessionCompletionModal } from '../components/reconciliation/SessionCompletionModal';
import { ReopenSessionModal } from '../components/reconciliation/ReopenSessionModal';
import { Phase5TestRunnerModal } from '../components/reconciliation/Phase5TestRunnerModal';
import { exportReconciliationReportCsv } from '../services/reconciliationEngine';

export const BankReconciliation: React.FC = () => {
  const {
    bankAccounts,
    activeAccountId,
    setActiveAccountId,
    reconciliationSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    activeSessionSummary,
    resetToDemoData,
  } = useFinancial();

  // Modal open states
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentAccount = bankAccounts.find((a) => a.id === activeAccountId) || bankAccounts[0];
  const accountSessions = reconciliationSessions.filter((s) => s.accountId === currentAccount?.id);

  const handleExportCsv = () => {
    if (!activeSession || !activeSessionSummary) return;

    try {
      const csvData = exportReconciliationReportCsv(activeSession, activeSessionSummary);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reconciliation_${activeSession.id}_${activeSession.statementPeriodEnd}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage('Reconciliation report exported successfully as RFC 4180 CSV.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Bank Reconciliation & Transaction Matching</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
              Phase 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare bank statement feeds with General Ledger records, resolve discrepancies, and complete auditable sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTestRunner(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Verify Tests (28/28)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!activeSession}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportWizard(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Statement File</span>
          </button>
        </div>
      </div>

      {/* Account Profile & Session Selector Ribbon */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Operating Account</span>
            <div className="relative">
              <select
                value={activeAccountId}
                onChange={(e) => {
                  setActiveAccountId(e.target.value);
                  const sess = reconciliationSessions.find((s) => s.accountId === e.target.value);
                  if (sess) setActiveSessionId(sess.id);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-slate-200 text-xs font-semibold focus:outline-hidden focus:border-amber-400 appearance-none cursor-pointer"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumberMasked}) — {acc.currency}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Reconciliation Session</span>
            <div className="relative">
              <select
                value={activeSessionId}
                onChange={(e) => setActiveSessionId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-slate-200 text-xs font-semibold focus:outline-hidden focus:border-amber-400 appearance-none cursor-pointer"
              >
                {accountSessions.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.sessionName} ({sess.status.replace('_', ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="pt-4 sm:pt-0">
            <button
              type="button"
              onClick={() => setShowImportWizard(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reconciliation KPI Metrics Ribbon */}
      {activeSessionSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Statement Closing</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              ${activeSessionSummary.statementClosingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">From bank statement</span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Reconciled GL Cleared</span>
            <div className="text-xl font-bold text-slate-200 font-mono mt-1">
              ${activeSessionSummary.reconciledClosingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Opening + Cleared Net</span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Unexplained Difference</span>
            <div
              className={`text-xl font-bold font-mono mt-1 ${
                activeSessionSummary.isBalanced ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${Math.abs(activeSessionSummary.unexplainedDifference).toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400">
              {activeSessionSummary.isBalanced ? 'Fully balanced (0.00)' : 'Requires adjustment'}
            </span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Match Rate</span>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {activeSessionSummary.matchRatePercent}%
            </div>
            <span className="text-[11px] text-slate-400">
              {activeSessionSummary.matchedItems} of {activeSessionSummary.totalItems} cleared
            </span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Pending Exceptions</span>
            <div className="text-xl font-bold text-purple-400 font-mono mt-1">
              {activeSessionSummary.unmatchedItems + activeSessionSummary.reviewItems + activeSessionSummary.conflictItems}
            </div>
            <span className="text-[11px] text-slate-400">
              {activeSessionSummary.reviewItems} review, {activeSessionSummary.conflictItems} conflict
            </span>
          </div>
        </div>
      )}

      {/* Main Reconciliation Workbench */}
      {activeSession && activeSessionSummary ? (
        <ReconciliationWorkbench
          session={activeSession}
          summary={activeSessionSummary}
          onOpenCompletionModal={() => setShowCompletionModal(true)}
          onOpenReopenModal={() => setShowReopenModal(true)}
        />
      ) : (
        <div className="p-12 text-center bg-[#121929] border border-slate-800 rounded-2xl space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">No Active Reconciliation Session</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Start by uploading a bank statement CSV or initialize a demo reconciliation session.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowImportWizard(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Launch Ingestion Wizard</span>
          </button>
        </div>
      )}

      {/* Architecture Compliance Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Phase 5 Deterministic Financial Rules:</strong> Bank statement rows remain strictly segregated in the active reconciliation session and are never automatically added into the General Ledger. Outgoing customer invoices and vendor payables respect directional integrity. CSV exports are guarded with OWASP formula injection protection.
        </div>
      </div>

      {/* Modals */}
      {showImportWizard && (
        <StatementImportWizard
          isOpen={showImportWizard}
          onClose={() => setShowImportWizard(false)}
          onImportComplete={(sessId) => {
            setActiveSessionId(sessId);
            setToastMessage('Bank statement imported and initial auto-match executed.');
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {showCompletionModal && activeSession && activeSessionSummary && (
        <SessionCompletionModal
          isOpen={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          session={activeSession}
          summary={activeSessionSummary}
          onCompleted={() => {
            setToastMessage(`Reconciliation session "${activeSession.sessionName}" successfully closed and locked.`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {showReopenModal && activeSession && (
        <ReopenSessionModal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          session={activeSession}
          onReopened={() => {
            setToastMessage(`Reconciliation session reopened for adjustment.`);
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {showTestRunner && (
        <Phase5TestRunnerModal
          isOpen={showTestRunner}
          onClose={() => setShowTestRunner(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
