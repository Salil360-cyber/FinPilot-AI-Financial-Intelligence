import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Sparkles,
  PieChart,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { CompleteAnalyticsDataset } from '../../types/analytics';
import { formatCurrency } from '../../services/currencyFormatter';

interface OverviewSectionProps {
  dataset: CompleteAnalyticsDataset;
  onSelectTab: (tab: any) => void;
  onOpenManualInputs: () => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  dataset,
  onSelectTab,
  onOpenManualInputs,
}) => {
  const { revenue, expenses, profitability, ratios, periodComparison, insights, periodLabel } = dataset;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Combine monthly trends for the chart
  const months = Array.from(
    new Set([
      ...revenue.revenueByMonth.map((m) => m.month),
      ...expenses.expensesByMonth.map((m) => m.month),
    ])
  ).sort();

  const chartData = months.map((m) => {
    const rev = revenue.revenueByMonth.find((r) => r.month === m)?.amount || 0;
    const exp = expenses.expensesByMonth.find((e) => e.month === m)?.amount || 0;
    return {
      month: m,
      revenue: rev,
      expenses: exp,
      net: rev - exp,
    };
  });

  // Chart coordinate math
  const height = 220;
  const width = 640;
  const paddingX = 40;
  const paddingTop = 20;
  const paddingBottom = 30;

  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.revenue, d.expenses)),
    100000
  ) * 1.15;
  const minVal = 0;

  const getX = (i: number) => {
    if (chartData.length <= 1) return width / 2;
    return paddingX + (i / (chartData.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    const range = maxVal - minVal;
    const norm = (val - minVal) / range;
    return height - paddingBottom - norm * (height - paddingTop - paddingBottom);
  };

  const revenuePoints = chartData.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ');
  const expensePoints = chartData.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');

  const currentHoverItem = hoveredIdx !== null && chartData[hoveredIdx] ? chartData[hoveredIdx] : chartData[chartData.length - 1];

  const keyRatios = ratios.filter((r) => ['current-ratio', 'operating-profit-margin', 'debt-to-equity', 'ar-turnover'].includes(r.id));

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Recorded Sales / Revenue */}
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Recorded Revenue</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {revenue.issuedInvoicesCount} Active Sales
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            ${revenue.recordedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            Excludes unissued drafts and voided sales invoices.
          </p>
        </div>

        {/* Card 2: Total Operating Expenses */}
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Operating Expenses</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {expenses.activeExpensesCount} Vouchers
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200 tracking-tight">
            ${expenses.totalOperatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            Active posted debits (non-expense transfers separated).
          </p>
        </div>

        {/* Card 3: Operating Profit / Net Profit */}
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Operating Net Profit</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                profitability.netProfit >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {profitability.netProfitMarginPercent.toFixed(1)}% Margin
            </span>
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              profitability.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(profitability.netProfit)}
          </div>
          <p className="text-[11px] text-slate-400">
            {profitability.isCogsAvailable
              ? `Revenue − COGS − Operating Expenses in ${periodLabel}.`
              : `Revenue − Operating Expenses in ${periodLabel}.`}
          </p>
        </div>

        {/* Card 4: Cash Collected vs Outstanding AR */}
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Cash Collected / AR</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {revenue.cashPaymentsCount} Payments
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            ${revenue.cashPaymentsReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Outstanding AR:</span>
            <strong className="text-amber-400 font-mono">${revenue.outstandingReceivables.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart: Monthly Revenue vs Outflows */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Monthly Operating Inflow vs Outflow Trend
              </h3>
              <span className="text-[11px] font-mono text-slate-400">· {dataset.filter.currency}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recognized customer revenue compared with active General Ledger operating disbursements
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-slate-300">Expenses</span>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div>
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 select-none overflow-visible">
                {/* Horizontal gridlines */}
                {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = height - paddingBottom - pct * (height - paddingTop - paddingBottom);
                  const val = minVal + pct * (maxVal - minVal);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text x={paddingX - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                        ${Math.round(val / 1000)}k
                      </text>
                    </g>
                  );
                })}

                {/* Revenue Polyline */}
                {revenuePoints && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={revenuePoints}
                  />
                )}

                {/* Expense Polyline */}
                {expensePoints && (
                  <polyline
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={expensePoints}
                  />
                )}

                {/* Data Points and Interaction columns */}
                {chartData.map((d, i) => {
                  const x = getX(i);
                  const yRev = getY(d.revenue);
                  const yExp = getY(d.expenses);
                  const isHovered = hoveredIdx === i;

                  return (
                    <g key={i}>
                      <circle cx={x} cy={yRev} r={isHovered ? 5 : 3.5} fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                      <circle cx={x} cy={yExp} r={isHovered ? 5 : 3.5} fill="#f43f5e" stroke="#0f172a" strokeWidth="1.5" />

                      {/* X-Axis month label */}
                      <text x={x} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        {d.month}
                      </text>

                      {/* Hover hit area */}
                      <rect
                        x={x - 20}
                        y={0}
                        width={40}
                        height={height}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIdx(i)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hovered Month Inspection Ribbon */}
            {currentHoverItem && (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300 font-semibold">
                  Period: {currentHoverItem.month}
                </span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-emerald-400">Revenue: ${currentHoverItem.revenue.toLocaleString()}</span>
                  <span className="text-rose-400">Expenses: ${currentHoverItem.expenses.toLocaleString()}</span>
                  <span className="text-white font-bold">
                    Net: {currentHoverItem.net >= 0 ? '+' : ''}${currentHoverItem.net.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No monthly transaction records found for the selected scope.
          </div>
        )}
      </div>

      {/* Financial Ratios Snapshot Ribbon */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Key Financial Health Ratios</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Traceable balance-sheet liquidity, profitability, and leverage benchmarks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenManualInputs}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              Manual Financial Inputs
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('ratios')}
              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
            >
              All 11 Ratios →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {keyRatios.map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectTab('ratios')}
              className="p-3.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400">{r.name}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                    r.benchmarkStatus === 'favorable'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : r.benchmarkStatus === 'acceptable'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : r.benchmarkStatus === 'warning'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {r.formattedValue}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Target: {r.benchmark} · {r.formula}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence-Based Business Insights */}
      {insights.length > 0 && (
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Evidence-Based Analytical Insights
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {insights.length} Verified Observations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {insights.map((bi) => (
              <div
                key={bi.id}
                className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{bi.title}</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {bi.supportingMetric}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {bi.observation}
                </p>
                {bi.recommendation && (
                  <p className="text-emerald-400/90 text-[10px] pt-0.5 italic">
                    Action: {bi.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
