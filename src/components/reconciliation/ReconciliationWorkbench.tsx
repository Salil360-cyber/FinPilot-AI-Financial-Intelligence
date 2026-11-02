import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  X,
  EyeOff,
  PlusCircle,
  Link,
  Unlink,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BankStatementTransaction,
  BankMatchStatus,
  ReconciliationSession,
  ReconciliationBalanceSummary,
} from '../../types/reconciliation';
import { FinancialTransaction } from '../../types/finance';
import { useFinancial } from '../../context/FinancialContext';
import { findMatchesForBankTransaction } from '../../services/reconciliationEngine';
import { ManualPostModal } from './ManualPostModal';
import { ExcludeModal } from './ExcludeModal';

interface ReconciliationWorkbenchProps {
  session: ReconciliationSession;
  summary: ReconciliationBalanceSummary;
  onOpenCompletionModal: () => void;
  onOpenReopenModal: () => void;
}

export const ReconciliationWorkbench: React.FC<ReconciliationWorkbenchProps> = ({
  session,
  summary,
  onOpenCompletionModal,
  onOpenReopenModal,
}) => {
  const {
    transactions: glTransactions,
    confirmBankMatch,
    unmatchBankTransaction,
    restoreExcludedBankTransaction,
    runSessionAutoMatch,
  } = useFinancial();

  const [activeTab, setActiveTab] = useState<'all' | 'unmatched' | 'review' | 'conflict' | 'matched' | 'excluded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBankTxId, setSelectedBankTxId] = useState<string | null>(
    session.transactions[0]?.id || null
  );

  // Manual post and exclusion modal states
  const [manualPostTarget, setManualPostTarget] = useState<BankStatementTransaction | null>(null);
  const [excludeTarget, setExcludeTarget] = useState<BankStatementTransaction | null>(null);
  const [glSearchQuery, setGlSearchQuery] = useState('');
  const [isAutoMatching, setIsAutoMatching] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isSessionClosed = session.status === 'completed';

  // Filter bank transactions
  const filteredBankTxs = useMemo(() => {
    return session.transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'unmatched' && tx.matchStatus !== 'unmatched') return false;
      if (activeTab === 'review' && tx.matchStatus !== 'review_required') return false;
      if (activeTab === 'conflict' && tx.matchStatus !== 'conflict') return false;
      if (activeTab === 'matched' && tx.matchStatus !== 'exact_matched' && tx.matchStatus !== 'manually_matched') return false;
      if (activeTab === 'excluded' && tx.matchStatus !== 'excluded') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesText =
          tx.description.toLowerCase().includes(q) ||
          tx.counterparty.toLowerCase().includes(q) ||
          (tx.reference && tx.reference.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q) ||
          tx.date.includes(q);
        if (!matchesText) return false;
      }

      return true;
    });
  }, [session.transactions, activeTab, searchQuery]);

  // Selected bank transaction
  const selectedBankTx = useMemo(() => {
    return session.transactions.find((t) => t.id === selectedBankTxId) || session.transactions[0] || null;
  }, [session.transactions, selectedBankTxId]);

  // Candidates for the selected bank transaction
  const candidates = useMemo(() => {
    if (!selectedBankTx) return [];
    // If bankTx already has computed candidates
    if (selectedBankTx.candidateMatches && selectedBankTx.candidateMatches.length > 0) {
      return selectedBankTx.candidateMatches;
    }
    // Otherwise compute on the fly
    return findMatchesForBankTransaction(selectedBankTx, glTransactions, 3);
  }, [selectedBankTx, glTransactions]);

  // GL search list for manual linking
  const searchableGlTransactions = useMemo(() => {
    if (!glSearchQuery.trim()) return [];
    const q = glSearchQuery.toLowerCase().trim();
    return glTransactions.filter((tx) => {
      if (tx.ledgerStatus === 'cancelled') return false;
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.vendor.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q) ||
        (tx.invoiceRef && tx.invoiceRef.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q))
      );
    }).slice(0, 5);
  }, [glTransactions, glSearchQuery]);

  const handleRunBatchMatch = () => {
    setIsAutoMatching(true);
    setTimeout(() => {
      const res = runSessionAutoMatch(session.id, 3);
      setIsAutoMatching(false);
      setActionNotice(
        `Batch match engine processed session: cleared ${res.exactCount + res.highConfidenceCount} items, detected ${res.conflicts} conflicts.`
      );
      setTimeout(() => setActionNotice(null), 4000);
    }, 400);
  };

  const handleConfirmMatch = (bankTxId: string, glTxId: string) => {
    const res = confirmBankMatch(session.id, bankTxId, glTxId);
    if (res.success) {
      setActionNotice(`Reconciled statement line with General Ledger entry ${glTxId}.`);
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      alert(res.error || 'Failed to confirm match');
    }
  };

  const handleUnmatch = (bankTxId: string) => {
    const res = unmatchBankTransaction(session.id, bankTxId);
    if (res.success) {
      setActionNotice('Match link removed; transaction returned to unmatched pool.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleRestoreExcluded = (bankTxId: string) => {
    const res = restoreExcludedBankTransaction(session.id, bankTxId);
    if (res.success) {
      setActionNotice('Excluded bank line restored to reconciliation pool.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Session Controls & Batch Match Toolbar */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">{session.sessionName}</h2>
              <span
                className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                  session.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : session.status === 'reopened'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}
              >
                {session.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Period: <span className="text-slate-300 font-mono">{session.statementPeriodStart} to {session.statementPeriodEnd}</span> · Source: <span className="text-slate-300">{session.sourceFileName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isSessionClosed ? (
            <>
              <button
                type="button"
                onClick={handleRunBatchMatch}
                disabled={isAutoMatching}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAutoMatching ? 'animate-spin' : ''}`} />
                <span>{isAutoMatching ? 'Matching...' : 'Auto-Match Engine'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenCompletionModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Session</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenReopenModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All ({session.transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unmatched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'unmatched'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Unmatched ({summary.unmatchedItems})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'review'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Review ({summary.reviewItems})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflict')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'conflict'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Conflicts ({summary.conflictItems})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matched')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'matched'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Matched ({summary.matchedItems})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excluded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'excluded'
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Excluded ({summary.excludedItems})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search statement lines..."
            className="w-full bg-[#121929] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
          />
        </div>
      </div>

      {/* Two-Panel Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT PANEL: Bank Statement Lines (7 cols) */}
        <div className="lg:col-span-7 bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[640px]">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-200 tracking-tight">
              Bank Statement Transactions ({filteredBankTxs.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Click any line to inspect matching GL vouchers
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
            {filteredBankTxs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No bank statement transactions match the active tab or filter.
              </div>
            ) : (
              filteredBankTxs.map((bTx) => {
                const isSelected = selectedBankTx?.id === bTx.id;
                const isDebit = bTx.type === 'debit';
                const isMatched = bTx.matchStatus === 'exact_matched' || bTx.matchStatus === 'manually_matched';

                return (
                  <div
                    key={bTx.id}
                    onClick={() => setSelectedBankTxId(bTx.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-2 border-amber-400'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-slate-400">{bTx.date}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-semibold text-slate-200 text-xs truncate max-w-[220px]">
                          {bTx.counterparty || bTx.description}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                            bTx.matchStatus === 'exact_matched'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : bTx.matchStatus === 'manually_matched'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : bTx.matchStatus === 'review_required'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : bTx.matchStatus === 'conflict'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : bTx.matchStatus === 'excluded'
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {bTx.matchStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {bTx.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                        {bTx.reference && <span>Ref: {bTx.reference}</span>}
                        {bTx.matchedLedgerTxId && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Link className="w-2.5 h-2.5" />
                            GL: {bTx.matchedLedgerTxId}
                          </span>
                        )}
                        {bTx.exclusionReason && (
                          <span className="text-slate-400 italic">Excluded: {bTx.exclusionReason}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-white tabular-nums">
                        ${bTx.amount.toFixed(2)}
                      </div>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold ${
                          isDebit ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {bTx.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Linked Match Inspector & Actions (5 cols) */}
        <div className="lg:col-span-5 bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[640px]">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="text-xs font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-amber-400" />
              <span>Match Inspector & Actions</span>
            </span>
            {selectedBankTx && (
              <span className="text-[10px] font-mono text-slate-400">
                Row #{selectedBankTx.rowNumber}
              </span>
            )}
          </div>

          <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
            {selectedBankTx ? (
              <>
                {/* Active Statement Line Summary Card */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Statement Item</span>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                        selectedBankTx.type === 'debit'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {selectedBankTx.type} (${selectedBankTx.amount.toFixed(2)})
                    </span>
                  </div>

                  <div className="font-bold text-white text-sm">
                    {selectedBankTx.counterparty || selectedBankTx.description}
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedBankTx.description}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80">
                    <span>Date: {selectedBankTx.date}</span>
                    <span>Ref: {selectedBankTx.reference || 'None'}</span>
                  </div>
                </div>

                {/* Status-Specific Action Sections */}

                {/* 1. If currently matched */}
                {(selectedBankTx.matchStatus === 'exact_matched' || selectedBankTx.matchStatus === 'manually_matched') && (
                  <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-emerald-400 font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Matched & Reconciled</span>
                      </span>
                      <span className="text-[10px] font-mono">
                        Score: {selectedBankTx.matchConfidence || 100}%
                      </span>
                    </div>

                    {selectedBankTx.matchedLedgerTxId && (
                      <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
                        <div>Voucher: <strong className="text-white">{selectedBankTx.matchedLedgerTxId}</strong></div>
                        {selectedBankTx.matchedLedgerTx && (
                          <>
                            <div>Vendor: {selectedBankTx.matchedLedgerTx.vendor}</div>
                            <div>GL Account: {selectedBankTx.matchedLedgerTx.account}</div>
                            <div>Category: {selectedBankTx.matchedLedgerTx.category}</div>
                          </>
                        )}
                      </div>
                    )}

                    {selectedBankTx.matchSignals && selectedBankTx.matchSignals.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Match Evidence:</span>
                        <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc pl-4">
                          {selectedBankTx.matchSignals.map((sig, i) => (
                            <li key={i}>{sig}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!isSessionClosed && (
                      <button
                        type="button"
                        onClick={() => handleUnmatch(selectedBankTx.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Unlink & Revert to Unmatched</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 2. If excluded */}
                {selectedBankTx.matchStatus === 'excluded' && (
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                      <EyeOff className="w-4 h-4 text-slate-400" />
                      <span>Excluded from Reconciliation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      "{selectedBankTx.exclusionReason || 'No reason specified'}"
                    </p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Excluded by: {selectedBankTx.excludedBy || 'Controller'} at {selectedBankTx.excludedAt ? new Date(selectedBankTx.excludedAt).toLocaleDateString() : 'N/A'}
                    </div>

                    {!isSessionClosed && (
                      <button
                        type="button"
                        onClick={() => handleRestoreExcluded(selectedBankTx.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore to Active Reconciliation Pool</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 3. Candidates for Review / Conflict / Unmatched */}
                {selectedBankTx.matchStatus !== 'exact_matched' &&
                  selectedBankTx.matchStatus !== 'manually_matched' &&
                  selectedBankTx.matchStatus !== 'excluded' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300 text-xs">
                          Ledger Match Candidates ({candidates.length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Sorted by deterministic score
                        </span>
                      </div>

                      {candidates.length === 0 ? (
                        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-2">
                          <p className="text-slate-400 text-xs">
                            No matching General Ledger entries found for ${selectedBankTx.amount.toFixed(2)}.
                          </p>
                          <p className="text-[11px] text-slate-500">
                            You can post this line as a new ledger entry or exclude it.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {candidates.map((cand, idx) => {
                            const gl = cand.ledgerTx;
                            return (
                              <div
                                key={gl.id}
                                className="p-3 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-white">{gl.id}</span>
                                    <span
                                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold uppercase ${
                                        cand.tier === 'exact'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : cand.tier === 'high_confidence'
                                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}
                                    >
                                      {cand.tier.replace('_', ' ')} ({cand.score}%)
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-white">
                                    ${gl.amount.toFixed(2)}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-300">
                                  <strong>{gl.vendor}</strong> · <span className="text-slate-400">{gl.category}</span>
                                </div>

                                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                                  <span>Date: {gl.date}</span>
                                  <span>Inv: {gl.invoiceRef || 'N/A'}</span>
                                </div>

                                {/* Signals */}
                                <ul className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800/80 pt-1.5 list-disc pl-3.5">
                                  {cand.signals.map((sig, sIdx) => (
                                    <li key={sIdx}>{sig}</li>
                                  ))}
                                </ul>

                                {!isSessionClosed && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmMatch(selectedBankTx.id, gl.id)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept & Reconcile Match</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Manual Actions for Unmatched Lines */}
                      {!isSessionClosed && (
                        <div className="pt-2 space-y-2 border-t border-slate-800">
                          <span className="text-[10px] uppercase font-mono text-slate-400 block">
                            Exception Actions
                          </span>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setManualPostTarget(selectedBankTx)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Post to Ledger</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setExcludeTarget(selectedBankTx)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Exclude Line</span>
                            </button>
                          </div>

                          {/* GL Search / Manual Link input */}
                          <div className="pt-2">
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Search Ledger to Link Manually:
                            </label>
                            <input
                              type="text"
                              value={glSearchQuery}
                              onChange={(e) => setGlSearchQuery(e.target.value)}
                              placeholder="Search by voucher ID (TX-...) or vendor..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
                            />

                            {searchableGlTransactions.length > 0 && (
                              <div className="mt-1.5 p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1.5 text-[11px]">
                                {searchableGlTransactions.map((tx) => (
                                  <div key={tx.id} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                                    <div>
                                      <span className="font-mono text-amber-400 font-bold">{tx.id}</span> · {tx.vendor} (${tx.amount.toFixed(2)})
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleConfirmMatch(selectedBankTx.id, tx.id);
                                        setGlSearchQuery('');
                                      }}
                                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                                    >
                                      Link
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select a bank statement transaction from the left panel to inspect matching ledger candidates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Post Modal */}
      {manualPostTarget && (
        <ManualPostModal
          isOpen={!!manualPostTarget}
          onClose={() => setManualPostTarget(null)}
          bankTx={manualPostTarget}
          sessionId={session.id}
        />
      )}

      {/* Exclude Modal */}
      {excludeTarget && (
        <ExcludeModal
          isOpen={!!excludeTarget}
          onClose={() => setExcludeTarget(null)}
          bankTx={excludeTarget}
          sessionId={session.id}
        />
      )}
    </div>
  );
};
