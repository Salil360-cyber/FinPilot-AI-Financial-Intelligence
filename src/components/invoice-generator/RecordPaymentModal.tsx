import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SalesInvoice, InvoicePayment } from '../../types/salesInvoice';
import { roundCurrency } from '../../services/salesInvoiceCalculator';
import { DollarSign, CheckCircle2, AlertCircle, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SalesInvoice | null;
  onSavePayment: (
    invoiceId: string,
    payment: Omit<InvoicePayment, 'id' | 'recordedAt' | 'recordedBy'>
  ) => { success: boolean; error?: string };
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSavePayment,
}) => {
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<InvoicePayment['paymentMethod']>('ACH Transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize amount with outstanding balance when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.outstandingBalance > 0 ? invoice.outstandingBalance.toFixed(2) : '0.00');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setReference('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Payment amount must be a positive number greater than zero.');
      return;
    }

    const maxAllowed = roundCurrency(invoice.outstandingBalance);
    if (roundCurrency(numAmount) > maxAllowed + 0.005) {
      setErrorMessage(
        `Overpayments are not supported. Entered amount ($${numAmount.toFixed(2)}) exceeds outstanding balance ($${maxAllowed.toFixed(2)}).`
      );
      return;
    }

    const res = onSavePayment(invoice.id, {
      paymentDate,
      amount: roundCurrency(numAmount),
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to record payment.');
      return;
    }

    onClose();
  };

  const remainingAfterPayment = Math.max(0, invoice.outstandingBalance - (parseFloat(amount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customer.customerName} · Total: ${invoice.currency} ${invoice.grandTotal.toFixed(2)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Outstanding Balance Banner */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Outstanding Balance</span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {invoice.currency} {invoice.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Amount Previously Paid</span>
            <div className="text-xs font-mono text-emerald-400 mt-0.5 font-semibold">
              {invoice.currency} {invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg flex items-start gap-2.5 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Payment Amount ({invoice.currency}) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={invoice.outstandingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Payment Date <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Payment Method <span className="text-amber-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="ACH Transfer">ACH Transfer</option>
                <option value="Bank Wire">Bank Wire / Fedwire</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Check">Corporate Check</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other Method</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Trace / Reference Number
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TRACE-94819 or Check #104"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Internal Notes / Remittance Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received via customer AP portal confirmation..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* New Balance Projection */}
          <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">Balance After This Payment:</span>
            <span className={remainingAfterPayment === 0 ? 'text-emerald-400 font-bold' : 'text-slate-200 font-bold'}>
              {invoice.currency} {remainingAfterPayment.toFixed(2)}
              {remainingAfterPayment === 0 && ' (Settled in Full)'}
            </span>
          </div>

          {/* Audit & Accounting Classification Notice */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-300">Manual Accounting Record:</strong> This manual payment records customer cash receipt against this outgoing sales invoice and writes an immutable audit log entry. It does not create an unverified bank transaction.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm & Record Payment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
