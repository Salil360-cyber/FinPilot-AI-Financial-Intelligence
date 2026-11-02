import React from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  DollarSign,
  Filter,
  Download,
  BookmarkPlus,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ForecastMetricType,
  ForecastMethodType,
  ForecastMethodConfig,
} from '../../types/forecast';
import { SUPPORTED_METRICS } from '../../services/revenueForecastEngine';

interface ForecastControlsBarProps {
  selectedMetric: ForecastMetricType;
  onMetricChange: (metric: ForecastMetricType) => void;
  horizonMonths: number;
  onHorizonChange: (months: number) => void;
  methodConfig: ForecastMethodConfig;
  onMethodConfigChange: (config: ForecastMethodConfig) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  sourceFilter: 'all' | 'user' | 'demo';
  onSourceFilterChange: (filter: 'all' | 'user' | 'demo') => void;
  onOpenSnapshotModal: () => void;
  onOpenTestRunner: () => void;
  onExportCsv: () => void;
  onPrintReport: () => void;
}

export const ForecastControlsBar: React.FC<ForecastControlsBarProps> = ({
  selectedMetric,
  onMetricChange,
  horizonMonths,
  onHorizonChange,
  methodConfig,
  onMethodConfigChange,
  currency,
  onCurrencyChange,
  sourceFilter,
  onSourceFilterChange,
  onOpenSnapshotModal,
  onOpenTestRunner,
  onExportCsv,
  onPrintReport,
}) => {
  const activeMetricDef = SUPPORTED_METRICS.find((m) => m.id === selectedMetric) || SUPPORTED_METRICS[0];

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
      {/* Top Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Metric Selector */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Forecast Metric
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => onMetricChange(e.target.value as ForecastMetricType)}
            className="w-full bg-[#0b101b] border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
          >
            {SUPPORTED_METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.shortLabel} {m.id === 'issued_sales' ? '(Standard)' : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 truncate">
            {activeMetricDef.description}
          </p>
        </div>

        {/* 2. Forecast Horizon */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Horizon
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#0b101b] border border-slate-700 p-1 rounded-lg">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onHorizonChange(m)}
                className={`py-1 text-xs font-mono font-medium rounded transition-colors ${
                  horizonMonths === m
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">Next {horizonMonths} monthly periods</p>
        </div>

        {/* 3. Forecasting Method */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Method
          </label>
          <select
            value={methodConfig.method}
            onChange={(e) =>
              onMethodConfigChange({
                ...methodConfig,
                method: e.target.value as ForecastMethodType,
                movingAverageWindow: e.target.value === 'moving_average' ? 3 : methodConfig.movingAverageWindow,
              })
            }
            className="w-full bg-[#0b101b] border border-slate-700 hover:border-slate-600 focus:border-amber-500 rounded-lg px-2.5 py-2 text-xs text-white outline-none transition-colors"
          >
            <option value="moving_average">3-Month Moving Average (SMA)</option>
            <option value="weighted_moving_average">Weighted Moving Avg (WMA)</option>
            <option value="linear_trend">Linear Trend (OLS Least Squares)</option>
            <option value="naive_baseline">Naive Baseline (Latest Month)</option>
            <option value="seasonality_aware">Seasonality-Aware (Check Eligibility)</option>
          </select>
          <p className="text-[10px] text-slate-400">Deterministic model</p>
        </div>

        {/* 4. Currency & Source Filters */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            Filters
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-[#0b101b] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"
              title="Currency Isolation"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => onSourceFilterChange(e.target.value as any)}
              className="bg-[#0b101b] border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"
              title="Data Source Scope"
            >
              <option value="all">All Data</option>
              <option value="user">User Only</option>
              <option value="demo">Demo Only</option>
            </select>
          </div>
          <p className="text-[10px] text-slate-400">Isolated currency & scope</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Deterministic mathematical engine active. Zero AI hallucinations.</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Snapshot Manager */}
          <button
            type="button"
            onClick={onOpenSnapshotModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Snapshots & Scenarios</span>
          </button>

          {/* Test Suite Runner */}
          <button
            type="button"
            onClick={onOpenTestRunner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Phase 7 Tests</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition-colors"
            title="Download RFC 4180 CSV with OWASP injection protection"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Forecast CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
