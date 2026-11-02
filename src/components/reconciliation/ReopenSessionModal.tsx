import React, { useState } from 'react';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';
import { ReconciliationSession } from '../../types/reconciliation';
import { useFinancial } from '../../context/FinancialContext';

interface ReopenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ReconciliationSession;
  onReopened?: () => void;
}

export const ReopenSessionModal: React.FC<ReopenSessionModalProps> = ({
  isOpen,
  onClose,
  session,
  onReopened,
}) => {
  const { reopenReconciliationSession } = useFinancial();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('An audit justification reason is required to reopen a closed reconciliation session.');
      return;
    }

    const res = reopenReconciliationSession(session.id, reason.trim());
    if (res.success) {
      if (onReopened) onReopened();
      onClose();
    } else {
      setError(res.error || 'Failed to reopen session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Reopen Completed Session</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Unlock session for post-close adjustments or correcting statement items.
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

        {/* Form Body */}
        <form onSubmit={handleReopen} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Audit Justification *</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide business justification (e.g., Prior period adjustment requested by external auditors; correcting misclassified bank fee)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs resize-none focus:outline-hidden focus:border-amber-400"
              required
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Reopening this session logs a high-priority entry in the permanent compliance audit trail.
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
              Confirm Reopen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
