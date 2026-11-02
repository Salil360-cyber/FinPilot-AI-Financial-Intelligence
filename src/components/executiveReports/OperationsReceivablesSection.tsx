import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface OperationsReceivablesSectionProps {
  data: ConsolidatedReportData;
  onExportSectionCsv: () => void;
}

export const OperationsReceivablesSection: React.FC<OperationsReceivablesSectionProps> = ({
  data,
  onExportSectionCsv,
}) => {
  const { operationsReceivables, summaryKpis } = data;
  const curr = summaryKpis.currency;
  const ageing = operationsReceivables.ageingBuckets;

  const totalAgeing =
    ageing.current + ageing.days1to30 + ageing.days31to60 + ageing.days61to90 + ageing.days90Plus || 1;

  const buckets = [
    { label: 'Current (Not Due)', amount: ageing.current, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: '1 - 30 Days Past Due', amount: ageing.days1to30, color: 'bg-blue-500', text: 'text-blue-400' },
    { label: '31 - 60 Days Past Due', amount: ageing.days31to60, color: 'bg-amber-500', text: 'text-amber-400' },
    { label: '61 - 90 Days Past Due', amount: ageing.days61to90, color: 'bg-orange-500', text: 'text-orange-400' },
    { label: '90+ Days Past Due', amount: ageing.days90Plus, color: 'bg-red-500', text: 'text-red-400' },
  ];

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Operations, Billing & Accounts Receivable Ageing
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Customer invoicing volumes, cash collection progress, and overdue receivables risk brackets.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export AR Aging CSV
        </button>
      </div>

      {/* Top Level Receivables Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Billed Invoices</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {curr} {operationsReceivables.totalInvoicedAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {operationsReceivables.invoicesCount} active billing contracts
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Cash Collections Settled</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {curr} {operationsReceivables.totalPaidAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-1">
            Collection Rate: <span className="font-semibold">{operationsReceivables.collectionRatePercent}%</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Outstanding Receivables (AR)</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-1">
            {curr} {operationsReceivables.totalOutstandingAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {operationsReceivables.overdueInvoicesCount} invoice(s) past contractual due date
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Days Sales Outstanding (DSO)</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {operationsReceivables.averageDsoDays !== null
              ? `${operationsReceivables.averageDsoDays} Days`
              : 'N/A (Zero Inflow)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Industry Benchmark: 35-45 Days
          </div>
        </div>
      </div>

      {/* Aged Receivables Schedule Brackets */}
      <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/70 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Aged Accounts Receivable Schedule
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            Total Outstanding: {curr} {operationsReceivables.totalOutstandingAmount.toLocaleString()}
          </span>
        </div>

        {/* Stacked bar visualization */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
          {buckets.map((b, idx) => {
            const share = operationsReceivables.totalOutstandingAmount > 0
              ? (b.amount / operationsReceivables.totalOutstandingAmount) * 100
              : 0;
            if (share <= 0) return null;
            return (
              <div
                key={idx}
                title={`${b.label}: ${curr} ${b.amount.toLocaleString()} (${share.toFixed(1)}%)`}
                style={{ width: `${share}%` }}
                className={`${b.color} transition-all duration-300`}
              />
            );
          })}
        </div>

        {/* Individual Buckets Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {buckets.map((b, idx) => {
            const share = operationsReceivables.totalOutstandingAmount > 0
              ? ((b.amount / operationsReceivables.totalOutstandingAmount) * 100).toFixed(1)
              : '0.0';
            return (
              <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/90">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${b.color}`} />
                  <span className="text-[11px] font-medium text-slate-300 truncate">{b.label}</span>
                </div>
                <div className={`text-sm font-bold font-mono ${b.text}`}>
                  {curr} {b.amount.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {share}% of open balance
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
