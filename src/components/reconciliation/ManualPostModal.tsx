import React, { useState } from 'react';
import { PlusCircle, X, Check, ShieldCheck } from 'lucide-react';
import { BankStatementTransaction } from '../../types/reconciliation';
import { useFinancial } from '../../context/FinancialContext';

interface ManualPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankTx: BankStatementTransaction | null;
  sessionId: string;
}

const COMMON_EXPENSE_CATEGORIES = [
  'Bank & Financial Fees',
  'Software & Subscriptions',
  'Cloud & Infrastructure',
  'Operating Expenses',
  'Facilities & Ops',
  'Professional Services',
  'Marketing & Acquisition',
  'Travel & Entertainment',
  'Taxes & Regulatory',
];

const COMMON_REVENUE_CATEGORIES = [
  'Client Consulting Revenue',
  'Subscription Revenue',
  'Interest Income',
  'Vendor Refund',
  'Intercompany Transfer',
];

export const ManualPostModal: React.FC<ManualPostModalProps> = ({
  isOpen,
  onClose,
  bankTx,
  sessionId,
}) => {
  const { postUnmatchedBankTxToLedger, bankAccounts } = useFinancial();

  if (!isOpen || !bankTx) return null;

  const currentAcc = bankAccounts.find((a) => a.id === bankTx.accountId);
  const isDebit = bankTx.type === 'debit';

  const [vendor, setVendor] = useState(bankTx.counterparty || 'Bank Counterparty');
  const [category, setCategory] = useState(
    isDebit
      ? bankTx.description.toLowerCase().includes('fee')
        ? 'Bank & Financial Fees'
        : 'Operating Expenses'
      : bankTx.description.toLowerCase().includes('interest')
      ? 'Interest Income'
      : 'Client Consulting Revenue'
  );
  const [account, setAccount] = useState(currentAcc?.glAccountMapping || 'Chase Operating •••• 4092');
  const [description, setDescription] = useState(bankTx.description);
  const [entryType, setEntryType] = useState<'expense' | 'revenue' | 'credit_refund' | 'bank_movement'>(
    isDebit ? 'expense' : 'revenue'
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor.trim()) {
      setError('Vendor / Counterparty is required.');
      return;
    }

    const res = postUnmatchedBankTxToLedger(sessionId, bankTx.id, {
      vendor,
      category,
      account,
      description,
      entryType,
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to post transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Post to General Ledger</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Create an auditable GL voucher directly from this unmatched bank transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bank Context Ribbon */}
        <div className="p-4 bg-slate-900/70 border-b border-slate-800 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-400 text-[11px]">{bankTx.date}</span>
            <span
              className={`px-2 py-0.5 text-[10px] font-mono rounded font-bold ${
                isDebit ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {isDebit ? 'BANK DEBIT (OUTFLOW)' : 'BANK CREDIT (INFLOW)'}
            </span>
          </div>
          <div className="font-bold text-white text-sm">
            ${bankTx.amount.toFixed(2)} USD
          </div>
          <div className="text-slate-400 text-[11px] truncate">
            {bankTx.description}
          </div>
          {bankTx.reference && (
            <div className="text-[10px] font-mono text-slate-500">
              Bank Ref: {bankTx.reference}
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Counterparty / Vendor *</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Account Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              >
                {(isDebit ? COMMON_EXPENSE_CATEGORIES : COMMON_REVENUE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Entry Classification</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              >
                <option value={isDebit ? 'expense' : 'revenue'}>
                  {isDebit ? 'Expense' : 'Revenue'}
                </option>
                <option value="bank_movement">Bank Movement / Transfer</option>
                <option value="credit_refund">Credit / Refund</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Ledger Target Account</label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Ledger Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs resize-none"
            />
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              This will create a new posted General Ledger voucher and immediately reconcile it with this bank line, preserving complete bidirectional lineage.
            </span>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Post & Clear Line</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
