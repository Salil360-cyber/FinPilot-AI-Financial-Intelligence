import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Activity,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ForecastRunResult } from '../../types/forecast';
import { SUPPORTED_METRICS } from '../../services/revenueForecastEngine';

interface ForecastOverviewCardsProps {
  runResult: ForecastRunResult;
}

export const ForecastOverviewCards: React.FC<ForecastOverviewCardsProps> = ({ runResult }) => {
  const metricDef = SUPPORTED_METRICS.find((m) => m.id === runResult.metric) || SUPPORTED_METRICS[0];
  const hist = runResult.historicalSummary;
  const growth = runResult.projectedPeriodGrowthPercent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Projected Total Card */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">
            {runResult.horizonMonths}M Projected Total
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
          ${Math.round(runResult.projectedTotal).toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {growth !== null ? (
            growth >= 0 ? (
              <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{growth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-rose-400 font-mono flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> {growth.toFixed(1)}%
              </span>
            )
          ) : (
            <span className="text-slate-400 font-mono">Baseline horizon</span>
          )}
          <span className="text-slate-400">vs prior {runResult.horizonMonths}M window</span>
        </div>
      </div>

      {/* 2. Projected Monthly Average */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">
            Projected Monthly Avg
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
          ${Math.round(runResult.projectedAverageMonthly).toLocaleString()}
        </div>
        <div className="text-xs text-slate-400">
          <span>Historical Mean: </span>
          <span className="text-slate-200 font-mono font-medium">
            ${Math.round(hist.averageMonthlyValue).toLocaleString()}/mo
          </span>
        </div>
      </div>

      {/* 3. Historical Volatility & Dispersion */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">
            Historical Volatility
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-white tabular-nums tracking-tight">
          {hist.volatilityPercent.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>StdDev: ±${Math.round(hist.stdDev).toLocaleString()}</span>
          <span
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              hist.volatilityPercent > 35
                ? 'bg-rose-500/20 text-rose-300'
                : hist.volatilityPercent > 20
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {hist.volatilityPercent > 35 ? 'Lumpy/Volatile' : hist.volatilityPercent > 20 ? 'Moderate' : 'Stable'}
          </span>
        </div>
      </div>

      {/* 4. Active Algorithm & Observations */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-mono uppercase tracking-wider">
            Model & Provenance
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Info className="w-4 h-4" />
          </div>
        </div>
        <div className="text-sm font-semibold text-amber-300 font-mono truncate" title={runResult.methodLabel}>
          {runResult.methodConfig.method === 'moving_average'
            ? '3M Moving Average'
            : runResult.methodConfig.method === 'linear_trend'
            ? 'Linear Trend (OLS)'
            : runResult.methodConfig.method === 'weighted_moving_average'
            ? 'Weighted Moving Avg'
            : runResult.methodConfig.method === 'naive_baseline'
            ? 'Naive Baseline'
            : 'Seasonality-Aware'}
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
          <span>{hist.validPeriodsCount} historical periods</span>
          <span className="text-slate-300 font-mono">
            {hist.demoRecordRatio > 0 ? `${Math.round(hist.demoRecordRatio * 100)}% Demo` : '100% User'}
          </span>
        </div>
      </div>
    </div>
  );
};
