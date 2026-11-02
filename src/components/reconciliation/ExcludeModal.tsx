import React, { useState } from 'react';
import { EyeOff, X, AlertTriangle } from 'lucide-react';
import { BankStatementTransaction } from '../../types/reconciliation';
import { useFinancial } from '../../context/FinancialContext';

interface ExcludeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankTx: BankStatementTransaction | null;
  sessionId: string;
}

const PRESET_REASONS = [
  'Duplicate transaction on bank feed or previous statement',
  'Internal transfer recorded on other operating account',
  'Direct bank error / chargeback reversed by financial institution',
  'Non-operating ledger item handled outside FinPilot',
  'Pending merchant reversal / provisional credit',
  'Other (Custom justification required)',
];

export const ExcludeModal: React.FC<ExcludeModalProps> = ({
  isOpen,
  onClose,
  bankTx,
  sessionId,
}) => {
  const { excludeBankTransaction } = useFinancial();

  if (!isOpen || !bankTx) return null;

  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedPreset === 'Other (Custom justification required)'
      ? customReason.trim()
      : selectedPreset;

    if (!finalReason) {
      setError('A justification reason is required for financial audit compliance.');
      return;
    }

    const res = excludeBankTransaction(sessionId, bankTx.id, finalReason);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to exclude transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Exclude Bank Transaction</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Remove this statement line from active matching without altering the ledger.
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

        {/* Transaction Brief */}
        <div className="p-4 bg-slate-900/70 border-b border-slate-800 text-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
            <span>{bankTx.date}</span>
            <span>${bankTx.amount.toFixed(2)} {bankTx.type.toUpperCase()}</span>
          </div>
          <div className="font-semibold text-slate-200 truncate">
            {bankTx.counterparty || bankTx.description}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Standard Exclusion Reason</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
            >
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedPreset === 'Other (Custom justification required)' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Custom Justification *</label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this statement transaction should be excluded from reconciliation..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs resize-none focus:outline-hidden focus:border-amber-400"
                required
              />
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Excluded transactions are permanently documented in the reconciliation audit report with your reason and timestamp.
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              Confirm Exclusion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
