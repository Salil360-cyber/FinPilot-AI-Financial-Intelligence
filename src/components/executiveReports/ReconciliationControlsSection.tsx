import React from 'react';
import {
  ShieldCheck,
  Lock,
  AlertTriangle,
  Download,
  Building,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface ReconciliationControlsSectionProps {
  data: ConsolidatedReportData;
  onExportSectionCsv: () => void;
}

export const ReconciliationControlsSection: React.FC<ReconciliationControlsSectionProps> = ({
  data,
  onExportSectionCsv,
}) => {
  const { reconciliationControls, summaryKpis } = data;
  const curr = summaryKpis.currency;

  const hasDiscrepancy = reconciliationControls.unmatchedDiscrepancyCount > 0;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Treasury Reconciliation & Internal Control Audit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verification of bank ledger synchronization, clearing rates, locked sessions, and audit trail status.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Controls CSV
        </button>
      </div>

      {/* Control Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 ${
          hasDiscrepancy
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
        }`}
      >
        <div className="mt-0.5">
          {hasDiscrepancy ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <Lock className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider">
            {reconciliationControls.auditStatus}
          </div>
          <p className="text-xs opacity-90 mt-0.5">
            {hasDiscrepancy
              ? `There are ${reconciliationControls.unmatchedDiscrepancyCount} discrepancy item(s) totalling ${curr} ${reconciliationControls.unmatchedDiscrepancyAmount.toLocaleString()} requiring manual adjustment.`
              : 'All evaluated accounts are reconciled and confirmed. Zero unexplained ledger variance detected.'}
          </p>
        </div>
      </div>

      {/* Control Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Automated Match Rate</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {reconciliationControls.averageMatchRatePercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard: &gt; 90% auto-cleared
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Movements Processed</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {reconciliationControls.totalBankMovementsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {reconciliationControls.matchedMovementsCount} matched to general ledger
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Locked Reconciliation Sessions</div>
          <div className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-400" />
            {reconciliationControls.lockedSessionsCount} / {reconciliationControls.totalSessions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Period close immutable locks
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Unresolved Variances</div>
          <div
            className={`text-lg font-bold font-mono mt-1 ${
              hasDiscrepancy ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {curr} {reconciliationControls.unmatchedDiscrepancyAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {reconciliationControls.unmatchedDiscrepancyCount} transaction(s) pending review
          </div>
        </div>
      </div>
    </div>
  );
};
