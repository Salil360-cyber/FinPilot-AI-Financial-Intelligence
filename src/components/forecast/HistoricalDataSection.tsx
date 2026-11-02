import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { HistoricalSummary } from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface HistoricalDataSectionProps {
  summary: HistoricalSummary;
  currencySymbol?: string;
}

export const HistoricalDataSection: React.FC<HistoricalDataSectionProps> = ({
  summary,
  currencySymbol = '$',
}) => {
  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Historical Baseline & Observation Continuity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical historical series used to calibrate models. Missing periods are treated as non-observations rather than assumed zero revenue.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-400">Valid Months: </span>
            <span className="text-emerald-400 font-bold">{summary.validPeriodsCount}</span>
          </div>
          <div className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg">
            <span className="text-slate-400">Total Invoiced: </span>
            <span className="text-white font-bold">{currencySymbol}{summary.totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Warning Banner if series has missing periods or is short */}
      {summary.coverageWarning && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">Series Notice:</span>
            <p className="text-amber-300/90">{summary.coverageWarning}</p>
          </div>
        </div>
      )}

      {/* Historical Observations Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b101b] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Reporting Period</th>
              <th className="px-4 py-3">Period Label</th>
              <th className="px-4 py-3 text-right">Historical Value</th>
              <th className="px-4 py-3 text-right">Transactions</th>
              <th className="px-4 py-3 text-center">Data Provenance</th>
              <th className="px-4 py-3 text-right">Observation Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {summary.points.map((p) => {
              return (
                <tr
                  key={p.period}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    p.isMissing ? 'bg-rose-500/5 text-rose-300/80' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 text-white font-medium">{p.period}</td>
                  <td className="px-4 py-2.5 text-slate-300">{p.periodLabel}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-100">
                    {p.isMissing ? (
                      <span className="text-slate-400 font-normal italic">—</span>
                    ) : (
                      `${currencySymbol}${roundCurrency(p.value).toLocaleString()}`
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{p.count}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.isDemo ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Demo Record
                      </span>
                    ) : p.count > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        User Verified
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {p.isMissing ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-sans text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        Missing Period
                      </span>
                    ) : p.isTrueZero ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-sans text-[11px]">
                        Confirmed Zero
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-[11px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Observed Actual
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
