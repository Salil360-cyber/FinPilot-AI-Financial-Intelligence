import React, { useState, useMemo } from 'react';
import { FinancialTransaction, TransactionStatus } from '../../types/finance';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { Search, Filter, ExternalLink, ArrowUpDown, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: FinancialTransaction[];
  globalSearchQuery?: string;
  onNavigateToReconciliation?: () => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  globalSearchQuery = '',
  onNavigateToReconciliation,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<FinancialTransaction | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Combined search term
  const effectiveSearch = (globalSearchQuery || localSearch).toLowerCase().trim();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        const matchesSearch =
          !effectiveSearch ||
          tx.vendor.toLowerCase().includes(effectiveSearch) ||
          tx.category.toLowerCase().includes(effectiveSearch) ||
          tx.id.toLowerCase().includes(effectiveSearch) ||
          (tx.invoiceRef && tx.invoiceRef.toLowerCase().includes(effectiveSearch)) ||
          tx.amount.toString().includes(effectiveSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortAsc ? dateA - dateB : dateB - dateA;
      });
  }, [transactions, statusFilter, effectiveSearch, sortAsc]);

  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Ledger & Bank Transactions
              </h3>
              <span className="text-[11px] font-mono text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sample feed of general ledger postings and clearing activity
            </p>
          </div>

          {onNavigateToReconciliation && (
            <button
              type="button"
              onClick={onNavigateToReconciliation}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1.5 self-start sm:self-auto py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
            >
              <span>Reconcile All Pending</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters and search toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Status tabs (Segmented control) */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('matched')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'matched'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Matched ({transactions.filter((t) => t.status === 'matched').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('review_required')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'review_required'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Review Req. ({transactions.filter((t) => t.status === 'review_required').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('unmatched')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'unmatched'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unmatched ({transactions.filter((t) => t.status === 'unmatched').length})
            </button>
          </div>

          {/* Local quick filter input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by vendor, ref, or amount..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500/60"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 font-medium">
                <button
                  type="button"
                  onClick={() => setSortAsc(!sortAsc)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-4 font-medium">Vendor / Entity</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Account</th>
              <th className="py-3 px-4 font-medium text-right">Amount (USD)</th>
              <th className="py-3 px-4 font-medium">Reconciliation</th>
              <th className="py-3 px-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-300">No matching transactions</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your search terms or status filter.
                  </p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTx(tx)}
                >
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-400">
                    {tx.date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-medium text-slate-200 group-hover:text-amber-300 transition-colors">
                      {tx.vendor}
                    </div>
                    {tx.invoiceRef && (
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{tx.invoiceRef}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                    {tx.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {tx.account}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-medium tabular-nums">
                    <span
                      className={
                        tx.type === 'credit'
                          ? 'text-emerald-400'
                          : 'text-slate-100'
                      }
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700/80 transition-colors"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title={`Transaction Audit: ${selectedTx.id}`}
          subtitle={`General Ledger reference · Logged on ${selectedTx.date}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Disbursement Amount</span>
                <div className="text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
                  ${selectedTx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedTx.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Vendor</span>
                <span className="font-semibold text-slate-200 mt-1 block">{selectedTx.vendor}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Category</span>
                <span className="font-semibold text-slate-200 mt-1 block">{selectedTx.category}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Bank Account</span>
                <span className="font-semibold font-mono text-slate-200 mt-1 block">{selectedTx.account}</span>
              </div>
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
                <span className="text-slate-400 block font-mono text-[10px] uppercase">Invoice Ref</span>
                <span className="font-semibold font-mono text-slate-200 mt-1 block">
                  {selectedTx.invoiceRef || 'No associated invoice PDF'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Reconciliation Analysis</span>
                {selectedTx.confidenceScore && (
                  <span className="font-mono text-amber-400">
                    Match Confidence: {(selectedTx.confidenceScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-slate-400 leading-relaxed">
                {selectedTx.reconciliationNotes || 'Standard transaction line item.'}
              </p>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-xs text-amber-300/90">
              <p>
                <strong>Demo Mode Active:</strong> This audit trail is populated with representative enterprise records for architectural evaluation.
              </p>
            </div>

            <div className="flex justify-end pt-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
