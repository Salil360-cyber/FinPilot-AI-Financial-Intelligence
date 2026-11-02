import React, { useState } from 'react';
import { ExpenseCategoryPoint } from '../../types/finance';

interface CategoryChartProps {
  categories: ExpenseCategoryPoint[];
  totalAmount: number;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ categories, totalAmount }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const currentCategory = selectedIdx !== null ? categories[selectedIdx] : null;

  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Operating Expense Composition
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown across major cost centers
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">YTD 2026</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-4">
        {/* Donut graphic */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg width={size} height={size} className="transform -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {categories.map((cat, idx) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += cat.percentage;
              const isSelected = selectedIdx === idx;

              return (
                <circle
                  key={cat.category}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onMouseLeave={() => setSelectedIdx(null)}
                />
              );
            })}
          </svg>

          {/* Centered label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {currentCategory ? (
              <>
                <span className="text-xs font-mono text-slate-400">
                  {currentCategory.percentage}%
                </span>
                <span className="text-sm font-bold text-white tabular-nums font-mono">
                  ${(currentCategory.amount / 1000).toFixed(0)}k
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total OPEX</span>
                <span className="text-sm font-bold text-white tabular-nums font-mono">
                  ${(totalAmount / 1000).toFixed(0)}k
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend list */}
        <div className="md:col-span-7 space-y-2">
          {categories.map((cat, idx) => {
            const isHovered = selectedIdx === idx;
            return (
              <div
                key={cat.category}
                onMouseEnter={() => setSelectedIdx(idx)}
                onMouseLeave={() => setSelectedIdx(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isHovered ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className={`truncate ${isHovered ? 'text-white font-medium' : 'text-slate-300'}`}>
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 tabular-nums font-mono">
                  <span className="text-slate-400 text-[11px]">{cat.percentage}%</span>
                  <span className="text-slate-200 font-medium">
                    ${(cat.amount / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span>6 categories active</span>
        <span className="font-mono">Total Transactions: 510</span>
      </div>
    </div>
  );
};
