import React from 'react';
import { Filter, Calendar, RotateCcw, DollarSign, Database, CheckCircle2 } from 'lucide-react';
import { AnalyticsFilterState, AnalyticsPeriodPreset } from '../../types/analytics';

interface AnalyticsFilterBarProps {
  filter: AnalyticsFilterState;
  onFilterChange: (updates: Partial<AnalyticsFilterState>) => void;
  onResetFilters: () => void;
  periodLabel: string;
}

const PERIOD_OPTIONS: { id: AnalyticsPeriodPreset; label: string }[] = [
  { id: 'current_month', label: 'Current Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'current_quarter', label: 'Current Quarter' },
  { id: 'previous_quarter', label: 'Previous Quarter' },
  { id: 'current_year', label: 'Current Year (FY26)' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' },
];

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filter,
  onFilterChange,
  onResetFilters,
  periodLabel,
}) => {
  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
      {/* Top Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Scope:</span>
          </div>

          {/* Period Preset Dropdown */}
          <select
            value={filter.period}
            onChange={(e) => onFilterChange({ period: e.target.value as AnalyticsPeriodPreset })}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-medium focus:outline-hidden focus:border-amber-400"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom Date Inputs if custom selected */}
          {filter.period === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
              />
            </div>
          )}

          {/* Currency Isolation Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <select
              value={filter.currency}
              onChange={(e) => onFilterChange({ currency: e.target.value })}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-hidden"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          {/* Data Provenance Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <Database className="w-3 h-3 text-sky-400" />
            <select
              value={filter.source}
              onChange={(e) => onFilterChange({ source: e.target.value as any })}
              className="bg-transparent text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="all">All Sources</option>
              <option value="user">User Entered Only</option>
              <option value="demo">Demo Data Only</option>
              <option value="imported">Bank Statement Imported</option>
            </select>
          </div>

          {/* Include Demo Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={filter.includeDemoData}
              onChange={(e) => onFilterChange({ includeDemoData: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-400 text-xs"
            />
            <span>Include Demo Baseline</span>
          </label>
        </div>

        {/* Reset Action */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Scope Status Ribbon */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-slate-300">
            <Calendar className="w-3 h-3 text-amber-400" />
            <strong>Period:</strong> {periodLabel} ({filter.startDate} to {filter.endDate})
          </span>
          <span className="text-slate-600">·</span>
          <span>
            <strong>Currency:</strong> <span className="font-mono text-emerald-400 font-semibold">{filter.currency}</span> (Strictly Isolated)
          </span>
          <span className="text-slate-600">·</span>
          <span>
            <strong>Data Scope:</strong> {filter.includeDemoData ? 'Demo Baseline + User Records' : 'Pure User Records'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
          <CheckCircle2 className="w-3 h-3" />
          <span>Deterministic ASC-606 & GAAP Rules Active</span>
        </div>
      </div>
    </div>
  );
};
