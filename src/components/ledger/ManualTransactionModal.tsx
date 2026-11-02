import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FinancialTransaction, TransactionSource, EntryType, TransactionStatus } from '../../types/finance';
import { validateLedgerTransaction } from '../../services/ledgerValidator';
import { Check, AlertCircle, Plus, Edit3 } from 'lucide-react';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<FinancialTransaction, 'id'>) => { success: boolean; error?: string };
  initialData?: FinancialTransaction | null;
  existingTransactions: FinancialTransaction[];
}

export const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingTransactions,
}) => {
  const isEditing = !!initialData;

  const [vendor, setVendor] = useState(initialData?.vendor || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toString() : '');
  const [type, setType] = useState<'debit' | 'credit'>(initialData?.type || 'debit');
  const [category, setCategory] = useState(initialData?.category || 'Operating Expenses');
  const [account, setAccount] = useState(initialData?.account || 'Chase Operating •••• 4092');
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [invoiceRef, setInvoiceRef] = useState(initialData?.invoiceRef || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [entryType, setEntryType] = useState<EntryType>(initialData?.entryType || (type === 'debit' ? 'expense' : 'revenue'));
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'matched');
  const [source, setSource] = useState<TransactionSource>(initialData?.source || 'manual_entry');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setWarnings([]);

    const numAmount = parseFloat(amount);

    const candidateData: Omit<FinancialTransaction, 'id'> = {
      vendor: vendor.trim(),
      date: date.trim(),
      amount: numAmount,
      type,
      category: category.trim(),
      account: account.trim(),
      currency: currency.trim(),
      invoiceRef: invoiceRef.trim() || undefined,
      description: description.trim() || undefined,
      entryType,
      status,
      source: isEditing ? (initialData?.source || 'manual_entry') : source,
      ledgerStatus: 'posted',
      confidenceScore: 1.0,
      reconciliationNotes: description.trim() || (isEditing ? initialData?.reconciliationNotes : 'Manual entry recorded in General Ledger workbench.'),
    };

    const val = validateLedgerTransaction(candidateData, existingTransactions);
    if (!val.isValid) {
      setErrorMessage(val.errors.join(' '));
      return;
    }

    if (val.warnings.length > 0) {
      setWarnings(val.warnings);
    }

    const res = onSave(candidateData);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to record transaction.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Ledger Voucher: ${initialData.id}` : 'Create General Ledger Transaction'}
      subtitle="Manual posting to corporate general ledger with deterministic validation"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg flex items-start gap-2.5 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg space-y-1 text-amber-300">
            {warnings.map((w, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="font-bold">Warning:</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Row 1: Vendor & Posting Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Vendor / Counterparty *
            </label>
            <input
              type="text"
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Snowflake Data Cloud"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Posting Date (YYYY-MM-DD) *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Row 2: Type, Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Transaction Direction *
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as 'debit' | 'credit';
                setType(newType);
                setEntryType(newType === 'debit' ? 'expense' : 'revenue');
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="debit">Debit (Expense / Outflow)</option>
              <option value="credit">Credit (Revenue / Inflow)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Monetary Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 font-mono text-white focus:outline-none focus:border-amber-400/60 text-right font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Reporting Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
            </select>
          </div>
        </div>

        {/* Row 3: Category & Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              General Ledger Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Software & Subscriptions">Software & Subscriptions</option>
              <option value="Facilities & Ops">Facilities & Ops</option>
              <option value="Marketing & Acquisition">Marketing & Acquisition</option>
              <option value="Payroll & Personnel">Payroll & Personnel</option>
              <option value="Revenue Clearing">Revenue Clearing</option>
              <option value="Operating Expenses">Operating Expenses</option>
              <option value="Unallocated Receipts">Unallocated Receipts</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Disbursement / Settlement Account *
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="Chase Operating •••• 4092">Chase Operating •••• 4092</option>
              <option value="Silicon Valley Commercial •••• 8810">Silicon Valley Commercial •••• 8810</option>
              <option value="Amex Corporate •••• 3004">Amex Corporate •••• 3004</option>
            </select>
          </div>
        </div>

        {/* Row 4: Invoice Ref & Classification */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Invoice Reference (Optional)
            </label>
            <input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="e.g. INV-2026-904"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-amber-400/60"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Economic Classification
            </label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as EntryType)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="expense">Operating Expense</option>
              <option value="revenue">Invoiced Revenue</option>
              <option value="credit_refund">Credit / Vendor Refund</option>
              <option value="transfer">Inter-Account Transfer</option>
              <option value="bank_movement">Bank Clearing Movement</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
              Reconciliation Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="matched">Matched (Cleared)</option>
              <option value="review_required">Review Required</option>
              <option value="unmatched">Unmatched</option>
              <option value="pending">Pending Clearing</option>
            </select>
          </div>
        </div>

        {/* Description / Memo */}
        <div>
          <label className="block text-slate-400 font-mono text-[11px] uppercase mb-1">
            Transaction Narrative / Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Q3 Server Compute Reservation Discount"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400/60"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Changes' : 'Post to General Ledger'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
