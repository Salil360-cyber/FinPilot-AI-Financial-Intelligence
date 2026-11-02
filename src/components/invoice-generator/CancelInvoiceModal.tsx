import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SalesInvoice } from '../../types/salesInvoice';
import { AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoice | null;
  onConfirmCancel: (invoiceId: string, reason: string) => { success: boolean; error?: string };
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!invoice) return null;

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('A documented reason is required to void/cancel an invoice for audit compliance.');
      return;
    }

    const res = onConfirmCancel(invoice.id, reason.trim());
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to cancel invoice.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Void / Cancel Sales Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customer.customerName} · Current Status: ${invoice.status.toUpperCase()}`}
      maxWidth="md"
    >
      <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5 text-rose-300">
          <div className="flex items-center gap-2 font-semibold text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Auditable Document Cancellation</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-300/90">
            In accordance with GAAP and corporate audit controls, issued financial documents are never permanently deleted. Cancelling this invoice marks it as voided, eliminates its outstanding receivable balance, and writes a permanent log entry to the corporate audit trail.
          </p>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-lg text-xs">
            {errorMessage}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">
            Cancellation Reason <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Scope revised by client, billed under separate PO, billing error corrected..."
            rows={3}
            required
            className="w-full bg-slate-900 border border-rose-800/60 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Go Back
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Confirm Cancellation</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
