import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ArrowRight, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { CashMovementSummary } from '../../types/analytics';

interface CashMovementSectionProps {
  cashMovement: CashMovementSummary;
  currency: string;
}

export const CashMovementSection: React.FC<CashMovementSectionProps> = ({
  cashMovement,
  currency,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Bank Cash Movement & Reconciliation Traceability</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable banking feed movements from active reconciliation session: <strong className="text-slate-200">{cashMovement.activeSessionName || 'Default Session'}</strong>
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Account: {cashMovement.activeAccountId || 'Chase Operating •••• 4092'}
        </span>
      </div>

      {/* Accounting Integrity Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">No Double-Counting Enforcement:</strong> Bank statement transactions are analyzed strictly as cash movements and are never added to General Ledger operating totals as duplicate revenue or expenses. Unreconciled statement lines are transparently identified below.
        </div>
      </div>

      {/* Cash Movement KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Opening Cash Balance</span>
            <span className="text-[10px] font-mono text-slate-400">Statement Start</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${cashMovement.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">Starting verified cash balance</p>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Statement Inflows</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            +${cashMovement.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            Reconciled: ${cashMovement.reconciledDeposits.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Statement Outflows</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            -${cashMovement.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            Reconciled: ${cashMovement.reconciledWithdrawals.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Closing Cash Balance</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                cashMovement.reconciliationRatePercent === 100
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {cashMovement.reconciliationRatePercent}% Cleared
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${cashMovement.calculatedClosingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            Net movement: {cashMovement.netMovement >= 0 ? '+' : ''}${cashMovement.netMovement.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Clearing Status Breakdown */}
      <div className="p-5 bg-[#121929] border border-slate-800 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-slate-200">Reconciliation Clearing Status</h3>
            <p className="text-[11px] text-slate-400">
              Proportion of bank cash movements verified against matching General Ledger vouchers
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {cashMovement.reconciliationRatePercent.toFixed(1)}% Reconciled
          </span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${Math.min(100, cashMovement.reconciliationRatePercent)}%` }}
          />
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${Math.max(0, 100 - cashMovement.reconciliationRatePercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reconciled Outflows & Inflows Matched</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{cashMovement.unreconciledItemsCount} Unreconciled Statement Lines Pending</span>
          </span>
        </div>
      </div>
    </div>
  );
};
