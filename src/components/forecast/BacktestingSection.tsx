import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  BarChart2,
  Info,
} from 'lucide-react';
import { BacktestComparisonSummary } from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface BacktestingSectionProps {
  backtestSummary: BacktestComparisonSummary;
  currencySymbol?: string;
}

export const BacktestingSection: React.FC<BacktestingSectionProps> = ({
  backtestSummary,
  currencySymbol = '$',
}) => {
  const evaluations = backtestSummary.evaluations;

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Forecast Accuracy & Empirical Backtesting
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates models against held-out historical observation actuals. Avoids future data leakage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <span className="text-slate-400">Cutoff Date: </span>
            <span className="text-amber-400 font-bold">{backtestSummary.cutoffPeriod}</span>
          </div>
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <span className="text-slate-400">Test Periods: </span>
            <span className="text-white font-bold">{backtestSummary.testPeriodsCount}</span>
          </div>
        </div>
      </div>

      {/* Rationale Notice */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{backtestSummary.rankingRationale}</p>
      </div>

      {/* Accuracy Matrix */}
      {evaluations.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b101b] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Forecasting Algorithm</th>
                <th className="px-4 py-3 text-right">Mean Absolute Error (MAE)</th>
                <th className="px-4 py-3 text-right">Root Mean Squared Error (RMSE)</th>
                <th className="px-4 py-3 text-right">WAPE (%)</th>
                <th className="px-4 py-3 text-center">Historical Ranking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {evaluations.map((ev, idx) => {
                const isBest = idx === 0;
                return (
                  <tr
                    key={ev.method}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isBest ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-white font-medium flex items-center gap-2">
                      {isBest && <Award className="w-3.5 h-3.5 text-amber-400" />}
                      <span>
                        {ev.method === 'moving_average'
                          ? 'Moving Average (SMA)'
                          : ev.method === 'weighted_moving_average'
                          ? 'Weighted Moving Avg (WMA)'
                          : ev.method === 'linear_trend'
                          ? 'Linear Trend (OLS)'
                          : 'Naive Baseline'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-100">
                      {currencySymbol}
                      {roundCurrency(ev.mae).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {currencySymbol}
                      {roundCurrency(ev.rmse).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-amber-300">
                      {ev.wapePercent !== null ? `${ev.wapePercent.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          isBest
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isBest ? 'BEST FIT (Rank #1)' : `Rank #${idx + 1}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 bg-[#0b101b] border border-slate-800 rounded-lg text-center text-slate-400 text-xs">
          Historical data window has fewer than 4 periods; backtesting requires at least 4 contiguous periods to prevent training data leakage.
        </div>
      )}
    </div>
  );
};
