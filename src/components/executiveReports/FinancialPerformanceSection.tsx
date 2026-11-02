import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Download,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface FinancialPerformanceSectionProps {
  data: ConsolidatedReportData;
  onExportSectionCsv: () => void;
}

export const FinancialPerformanceSection: React.FC<FinancialPerformanceSectionProps> = ({
  data,
  onExportSectionCsv,
}) => {
  const { performance, summaryKpis } = data;
  const curr = summaryKpis.currency;
  const comparison = performance.periodComparison;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Financial Performance & Operating Margins
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            General Ledger verified income statements, expenditure categories, and period-over-period delta.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export P&L CSV
        </button>
      </div>

      {/* Metric Breakdown Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Operating Inflows</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {curr} {performance.revenueTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {performance.revenueEntriesCount} credit transactions recorded
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Operating Expenses (OpEx)</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {curr} {performance.expenseTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {performance.expenseEntriesCount} debit transactions posted
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Operating Surplus (Net Margin)</div>
          <div
            className={`text-lg font-bold font-mono mt-1 ${
              performance.netIncome >= 0 ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {curr} {performance.netIncome.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Operating Margin: <span className="font-semibold text-white">{performance.operatingMargin}%</span>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Period-over-Period Revenue Delta</div>
          {comparison && comparison.revenueGrowthPercent !== null ? (
            <div className="mt-1">
              <div
                className={`text-lg font-bold font-mono flex items-center gap-1 ${
                  comparison.revenueGrowthPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {comparison.revenueGrowthPercent >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {comparison.revenueGrowthPercent > 0 ? `+${comparison.revenueGrowthPercent}%` : `${comparison.revenueGrowthPercent}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Prior: {curr} {comparison.priorRevenue.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">
              All-Time Baseline / Continuous
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdowns: Top Expenses & Top Revenues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Top Expense Categories */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/70">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Primary Expense Classifications</span>
            <span className="text-[10px] text-slate-400 font-normal">Ranked by Outflow Volume</span>
          </h4>

          {performance.topExpenseCategories.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No expense categories recorded.</div>
          ) : (
            <div className="space-y-3">
              {performance.topExpenseCategories.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{cat.category}</span>
                    <span className="font-mono text-slate-200">
                      {curr} {cat.amount.toLocaleString()}{' '}
                      <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Revenue Categories */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/70">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Revenue Inflow Sources</span>
            <span className="text-[10px] text-slate-400 font-normal">Ranked by Inflow Volume</span>
          </h4>

          {performance.topRevenueCategories.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">No revenue categories recorded.</div>
          ) : (
            <div className="space-y-3">
              {performance.topRevenueCategories.slice(0, 5).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{cat.category}</span>
                    <span className="font-mono text-slate-200">
                      {curr} {cat.amount.toLocaleString()}{' '}
                      <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
