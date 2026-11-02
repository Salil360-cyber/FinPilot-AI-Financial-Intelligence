import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { DEMO_RECONCILIATION_SUMMARY } from '../../data/demoData';

interface ReconciliationSummaryProps {
  onNavigateToReconciliation: () => void;
}

export const ReconciliationSummary: React.FC<ReconciliationSummaryProps> = ({
  onNavigateToReconciliation,
}) => {
  const summary = DEMO_RECONCILIATION_SUMMARY;

  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Bank Reconciliation Progress
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Statement ledger matching status for October closing period
          </p>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          94.2% Auto-Matched
        </span>
      </div>

      {/* Progress Bar */}
      <div className="my-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
          <span>Match Progress ({summary.matchedCount} / {summary.totalProcessedCount} lines)</span>
          <span className="text-white font-semibold">{summary.reconciliationPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${(summary.matchedCount / summary.totalProcessedCount) * 100}%` }}
            title="Matched"
          />
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${(summary.reviewRequiredCount / summary.totalProcessedCount) * 100}%` }}
            title="Review Required"
          />
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${(summary.unmatchedCount / summary.totalProcessedCount) * 100}%` }}
            title="Unmatched"
          />
        </div>
      </div>

      {/* Breakdown stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Matched</span>
          </div>
          <div className="text-lg font-bold font-mono text-white tabular-nums">
            {summary.matchedCount}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {summary.matchedAmount}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Review Req.</span>
          </div>
          <div className="text-lg font-bold font-mono text-white tabular-nums">
            {summary.reviewRequiredCount}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {summary.reviewRequiredAmount}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unmatched</span>
          </div>
          <div className="text-lg font-bold font-mono text-white tabular-nums">
            {summary.unmatchedCount}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {summary.unmatchedAmount}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Last clearing pass: 2 hours ago
        </span>
        <button
          type="button"
          onClick={onNavigateToReconciliation}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <span>Open Reconciliation Workbench</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
