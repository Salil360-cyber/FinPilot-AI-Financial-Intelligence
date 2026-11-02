import React from 'react';
import { ArrowUpRight, ArrowDownRight, GitCompare, Calendar, AlertCircle } from 'lucide-react';
import { PeriodComparisonSummary } from '../../types/analytics';

interface PeriodComparisonSectionProps {
  comparison: PeriodComparisonSummary;
  currency: string;
}

export const PeriodComparisonSection: React.FC<PeriodComparisonSectionProps> = ({
  comparison,
  currency,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-sky-400" />
            <span>Period-over-Period Financial Variance Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing <strong className="text-slate-200">{comparison.currentPeriodLabel}</strong> vs <strong className="text-slate-200">{comparison.previousPeriodLabel}</strong>
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Normalized {currency}
        </span>
      </div>

      {/* Primary Metrics Comparison Table */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Comparative Financial Performance</span>
          <span className="text-[10px] font-mono text-slate-400">Equal Duration Benchmark</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/40">
                <th className="py-2.5 px-4">Financial Metric</th>
                <th className="py-2.5 px-4 text-right">Current Period</th>
                <th className="py-2.5 px-4 text-right">Prior Period</th>
                <th className="py-2.5 px-4 text-right">Absolute Change</th>
                <th className="py-2.5 px-4 text-right">% Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparison.metrics.map((m) => {
                const isPositive = m.absoluteChange > 0;
                const isZero = m.absoluteChange === 0;

                return (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                      <div>{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{m.explanation}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {m.formattedCurrent}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {m.formattedPrevious}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isZero
                          ? 'text-slate-500'
                          : m.isFavorable
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}${m.absoluteChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.percentageChange !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.isFavorable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {m.percentageChange > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{Math.abs(m.percentageChange).toFixed(1)}%</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Baseline N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Category Changes */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Expense Category Shifts</span>
          <span className="text-[10px] font-mono text-slate-400">
            {comparison.expenseCategoryChanges.length} Categories Analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] uppercase text-slate-400 bg-slate-900/40">
                <th className="py-2.5 px-4 font-sans">Category</th>
                <th className="py-2.5 px-4 text-right">Current Spend</th>
                <th className="py-2.5 px-4 text-right">Prior Spend</th>
                <th className="py-2.5 px-4 text-right">Variance ($)</th>
                <th className="py-2.5 px-4 text-right">Shift (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparison.expenseCategoryChanges.map((cat, idx) => {
                const grew = cat.change > 0;
                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">
                      {cat.category}
                    </td>
                    <td className="py-2.5 px-4 text-right text-white font-bold">
                      ${cat.current.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      ${cat.previous.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        cat.change === 0 ? 'text-slate-500' : grew ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {cat.change > 0 ? '+' : ''}${cat.change.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {cat.pctChange !== null ? (
                        <span
                          className={`text-[10px] font-bold ${
                            cat.change === 0 ? 'text-slate-500' : grew ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {cat.pctChange > 0 ? '+' : ''}{cat.pctChange.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">New in period</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
