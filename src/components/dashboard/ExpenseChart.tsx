import React, { useState } from 'react';
import { MonthlyFinancialPoint } from '../../types/finance';

interface ExpenseChartProps {
  data: MonthlyFinancialPoint[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  const [activeMetric, setActiveMetric] = useState<'expenses-vs-budget' | 'revenue-vs-expenses'>('expenses-vs-budget');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Chart dimensions
  const height = 240;
  const width = 640;
  const paddingX = 40;
  const paddingTop = 25;
  const paddingBottom = 30;

  const maxVal = activeMetric === 'revenue-vs-expenses' ? 420000 : 250000;
  const minVal = 160000;

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (value: number) => {
    const range = maxVal - minVal;
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    const normalized = (clamped - minVal) / range;
    return height - paddingBottom - normalized * (height - paddingTop - paddingBottom);
  };

  // Build path strings
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');
  const budgetPoints = data.map((d, i) => `${getX(i)},${getY(d.budget)}`).join(' ');
  const revenuePoints = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`).join(' ');

  const currentHoverItem = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Financial Operating Trend
            </h3>
            <span className="text-[11px] font-mono text-slate-400">· Monthly (USD)</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operating outflows vs authorized quarterly budgetary thresholds
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('expenses-vs-budget')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeMetric === 'expenses-vs-budget'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expenses vs Budget
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('revenue-vs-expenses')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeMetric === 'revenue-vs-expenses'
                ? 'bg-slate-800 text-amber-300 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Revenue vs Expenses
          </button>
        </div>
      </div>

      {/* Hover Info bar */}
      <div className="flex items-center justify-between py-2.5 text-xs border-b border-slate-800/40 font-mono">
        <span className="text-slate-400">
          Period: <span className="text-slate-200 font-semibold">{currentHoverItem.month} 2026</span>
        </span>
        <div className="flex items-center gap-4 tabular-nums">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-0.5 bg-amber-400 inline-block" />
            Expenses: ${(currentHoverItem.expenses / 1000).toFixed(1)}k
          </span>
          {activeMetric === 'expenses-vs-budget' ? (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-0.5 bg-slate-400 inline-block stroke-dasharray" />
              Budget: ${(currentHoverItem.budget / 1000).toFixed(1)}k
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
              Revenue: ${(currentHoverItem.revenue / 1000).toFixed(1)}k
            </span>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full mt-3 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 md:h-56 overflow-visible"
        >
          <defs>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const yPos = paddingTop + pct * (height - paddingTop - paddingBottom);
            const val = maxVal - pct * (maxVal - minVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={yPos}
                  x2={width - paddingX}
                  y2={yPos}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Secondary comparison line (Budget or Revenue) */}
          {activeMetric === 'expenses-vs-budget' ? (
            <polyline
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              points={budgetPoints}
            />
          ) : (
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              points={revenuePoints}
            />
          )}

          {/* Primary expense area and line */}
          <polygon
            points={`${paddingX},${height - paddingBottom} ${expensePoints} ${width - paddingX},${height - paddingBottom}`}
            fill="url(#expenseGradient)"
          />
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            points={expensePoints}
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.expenses);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingTop}
                    x2={cx}
                    y2={height - paddingBottom}
                    stroke="#f59e0b"
                    strokeOpacity="0.4"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                {/* Point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3.5}
                  fill="#0f172a"
                  stroke="#f59e0b"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />
                {/* X-axis label */}
                <text
                  x={cx}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? '#f59e0b' : '#94a3b8'}
                  fontWeight={isHovered ? '600' : '400'}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
        <span>Variance: 3.8% favorable against approved operating plan</span>
        <span className="font-mono text-slate-400">Source: General Ledger Aggregates</span>
      </div>
    </div>
  );
};
