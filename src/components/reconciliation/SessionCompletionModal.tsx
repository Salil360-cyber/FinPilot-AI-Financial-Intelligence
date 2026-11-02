import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { ReconciliationSession, ReconciliationBalanceSummary } from '../../types/reconciliation';
import { useFinancial } from '../../context/FinancialContext';

interface SessionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ReconciliationSession;
  summary: ReconciliationBalanceSummary;
  onCompleted?: () => void;
}

export const SessionCompletionModal: React.FC<SessionCompletionModalProps> = ({
  isOpen,
  onClose,
  session,
  summary,
  onCompleted,
}) => {
  const { completeReconciliationSession } = useFinancial();
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleComplete = () => {
    if (!attestationChecked) {
      setError('You must confirm the attestation checkbox before finalizing the reconciliation.');
      return;
    }

    const res = completeReconciliationSession(session.id);
    if (res.success) {
      if (onCompleted) onCompleted();
      onClose();
    } else {
      setError(res.error || 'Failed to complete session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Complete Bank Reconciliation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Final sign-off and balance verification for session: {session.sessionName}
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Audit Verification Checklist */}
          <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h3 className="font-semibold text-slate-200 text-xs mb-2">Automated Audit Checklist</h3>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Statement Net Movement Balanced</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ${summary.netStatementMovement.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Unexplained Difference</span>
              <span
                className={`font-mono font-bold flex items-center gap-1 ${
                  summary.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.isBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                ${summary.unexplainedDifference.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Items Pending Review / Conflicts</span>
              <span
                className={`font-mono font-bold flex items-center gap-1 ${
                  summary.reviewItems === 0 && summary.conflictItems === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.reviewItems + summary.conflictItems} items
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Unmatched Items Without Exclusion</span>
              <span
                className={`font-mono font-bold flex items-center gap-1 ${
                  summary.unmatchedItems === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.unmatchedItems} items
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Total Statement Lines Accounted</span>
              <span className="font-mono text-slate-200 font-bold">
                {summary.matchedItems + summary.excludedItems} of {summary.totalItems} ({summary.matchRatePercent}%)
              </span>
            </div>
          </div>

          {/* Blockers Alert if not ready */}
          {!summary.canComplete && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Reconciliation Cannot Be Finalized</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-rose-300/90">
                {summary.completionBlockers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Controller Sign-off Checkbox */}
          {summary.canComplete && (
            <label className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={attestationChecked}
                onChange={(e) => setAttestationChecked(e.target.checked)}
                className="mt-0.5 text-emerald-500 focus:ring-emerald-400 rounded"
              />
              <span className="text-slate-300 text-[11px] leading-relaxed">
                I attest that all bank statement items have been verified against General Ledger records or explicitly resolved with documented audit justifications.
              </span>
            </label>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!summary.canComplete || !attestationChecked}
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalize & Lock Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
