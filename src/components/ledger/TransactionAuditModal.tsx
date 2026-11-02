import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { FinancialTransaction, TransactionStatus } from '../../types/finance';
import { StatusBadge } from '../common/StatusBadge';
import { useFinancial } from '../../context/FinancialContext';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  XCircle,
  Clock,
  User,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface TransactionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FinancialTransaction | null;
}

export const TransactionAuditModal: React.FC<TransactionAuditModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { editTransaction, cancelTransaction } = useFinancial();

  const [isEditing, setIsEditing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Editable fields
  const [editVendor, setEditVendor] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editInvoiceRef, setEditInvoiceRef] = useState('');
  const [editStatus, setEditStatus] = useState<TransactionStatus>('matched');
  const [editError, setEditError] = useState<string | null>(null);

  // Sync state whenever transaction changes or editing is toggled
  React.useEffect(() => {
    if (transaction) {
      setEditVendor(transaction.vendor);
      setEditCategory(transaction.category);
      setEditAccount(transaction.account);
      setEditDescription(transaction.description || transaction.reconciliationNotes || '');
      setEditInvoiceRef(transaction.invoiceRef || '');
      setEditStatus(transaction.status);
      setIsEditing(false);
      setIsCancelling(false);
      setCancelReason('');
      setCancelError(null);
      setEditError(null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isCancelled = transaction.ledgerStatus === 'cancelled';

  const handleStartCancel = () => {
    setIsCancelling(true);
    setCancelReason('');
    setCancelError(null);
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError('Audit compliance requires a documented reason for transaction cancellation.');
      return;
    }

    const res = cancelTransaction(transaction.id, cancelReason);
    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel transaction.');
      return;
    }

    setIsCancelling(false);
    onClose();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor.trim()) {
      setEditError('Vendor or counterparty name cannot be blank.');
      return;
    }

    const updates: Partial<FinancialTransaction> = {
      vendor: editVendor.trim(),
      category: editCategory.trim(),
      account: editAccount.trim(),
      description: editDescription.trim(),
      reconciliationNotes: editDescription.trim(),
      invoiceRef: editInvoiceRef.trim() || undefined,
      status: editStatus,
    };

    const res = editTransaction(transaction.id, updates);
    if (!res.success) {
      setEditError(res.error || 'Failed to update transaction.');
      return;
    }

    setIsEditing(false);
  };

  const getSourceBadge = () => {
    switch (transaction.source) {
      case 'user_uploaded':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>User Uploaded Invoice</span>
          </span>
        );
      case 'imported_bank_statement':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" />
            <span>Imported Bank CSV</span>
          </span>
        );
      case 'manual_entry':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
            <Edit3 className="w-2.5 h-2.5" />
            <span>Manual Entry</span>
          </span>
        );
      case 'demo':
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            Initial Demo Record
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`General Ledger Voucher: ${transaction.id}`}
      subtitle={`Posting Date: ${transaction.date} · Currency: ${transaction.currency || 'USD'}`}
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5 text-rose-300">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>TRANSACTION CANCELLED / VOIDED</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-300/90">
              <strong>Reason:</strong> {transaction.cancelledReason || 'Voided by financial controller'}
            </p>
            <div className="flex items-center gap-4 text-[10px] font-mono text-rose-400/80 pt-1 border-t border-rose-900/60">
              <span>Timestamp: {transaction.cancelledAt ? new Date(transaction.cancelledAt).toLocaleString() : 'N/A'}</span>
              <span>Cancelled By: {transaction.cancelledBy || 'Controller'}</span>
            </div>
          </div>
        )}

        {/* Voucher Header KPI Card */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {transaction.type === 'debit' ? 'Debited Expense' : 'Credited Amount'}
              </span>
              {getSourceBadge()}
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-1 ${
                isCancelled
                  ? 'line-through text-slate-500'
                  : transaction.type === 'debit'
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {transaction.currency === 'EUR' ? '€' : transaction.currency === 'GBP' ? '£' : '$'}
              {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Reconciliation Status</span>
            <StatusBadge status={transaction.status} />
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              Ledger State: <span className={isCancelled ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>{transaction.ledgerStatus || 'posted'}</span>
            </div>
          </div>
        </div>

        {/* Editing Mode */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="p-4 bg-slate-900 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                Edit Permitted Fields
              </span>
              <span className="text-[11px] text-slate-400">Amounts & IDs are immutable for audit consistency</span>
            </div>

            {editError && (
              <div className="p-2 bg-rose-950/50 border border-rose-800 text-rose-300 rounded text-xs">
                {editError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Counterparty / Vendor</label>
                <input
                  type="text"
                  value={editVendor}
                  onChange={(e) => setEditVendor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Invoice Reference</label>
                <input
                  type="text"
                  value={editInvoiceRef}
                  onChange={(e) => setEditInvoiceRef(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Category / Cost Center</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Disbursement Account</label>
                <input
                  type="text"
                  value={editAccount}
                  onChange={(e) => setEditAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Description & Audit Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Reconciliation Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TransactionStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="matched">Matched (Bank Cleared)</option>
                  <option value="pending">Pending Review</option>
                  <option value="flagged">Flagged for Audit</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Read-only Details Grid */
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Vendor Entity</span>
              <span className="font-semibold text-white mt-1 block">{transaction.vendor}</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Invoice Reference</span>
              <span className="font-mono text-white mt-1 block">{transaction.invoiceRef || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Cost Center / Category</span>
              <span className="font-semibold text-slate-200 mt-1 block">{transaction.category}</span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
              <span className="text-slate-400 text-[10px] font-mono uppercase block">Disbursement Account</span>
              <span className="font-mono text-slate-200 mt-1 block">{transaction.account}</span>
            </div>
          </div>
        )}

        {/* Source Document Metadata & Notes */}
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-xs">Audit Memo & Extraction Lineage:</span>
            {transaction.sourceFileName && (
              <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {transaction.sourceFileName}
              </span>
            )}
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {transaction.reconciliationNotes || transaction.description || 'No detailed memo provided for this entry.'}
          </p>

          {/* Audit trail metadata */}
          {(transaction.editedAt || transaction.confidenceScore !== undefined) && (
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
              {transaction.confidenceScore !== undefined && (
                <span>OCR Confidence: {(transaction.confidenceScore * 100).toFixed(0)}%</span>
              )}
              {transaction.editedAt && (
                <span className="text-amber-400/80">
                  Last Modified: {new Date(transaction.editedAt).toLocaleString()} ({transaction.editedFields?.join(', ') || 'fields'})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cancellation Workflow Prompt */}
        {isCancelling ? (
          <div className="p-4 bg-rose-950/30 border border-rose-800/80 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-200">Cancel / Void Transaction</h4>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  General Ledger transactions are never deleted. Cancelling permanently marks this voucher as cancelled, reverses its financial impact from reports, and writes a permanent entry to the audit log.
                </p>
              </div>
            </div>

            {cancelError && (
              <div className="p-2 bg-rose-900/60 border border-rose-700 text-rose-200 rounded text-xs">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Documented Cancellation Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Duplicate bank posting, voided invoice from vendor, billing discrepancy..."
                rows={2}
                className="w-full bg-slate-950 border border-rose-800/60 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCancelling(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        ) : (
          /* Action Toolbar */
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {!isCancelled && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span>Edit Fields</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStartCancel}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-3 h-3 text-rose-400" />
                    <span>Cancel Voucher</span>
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
