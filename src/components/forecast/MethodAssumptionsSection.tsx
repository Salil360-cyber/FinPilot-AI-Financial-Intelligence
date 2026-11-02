import React from 'react';
import {
  BrainCircuit,
  Info,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { ForecastRunResult } from '../../types/forecast';

interface MethodAssumptionsSectionProps {
  runResult: ForecastRunResult;
}

export const MethodAssumptionsSection: React.FC<MethodAssumptionsSectionProps> = ({ runResult }) => {
  const method = runResult.methodConfig.method;

  const getMethodFormula = () => {
    switch (method) {
      case 'naive_baseline':
        return 'Forecast(t + i) = Actual(t_latest)';
      case 'moving_average':
        return 'Forecast(t + i) = (1 / k) × Σ Actual(t - j), for j = 0 to k-1';
      case 'weighted_moving_average':
        return 'Forecast(t + i) = Σ (w_j × Actual(t - j)) ÷ Σ w_j';
      case 'linear_trend':
        return 'Forecast(t + i) = m × (t + i) + b, where m = Cov(X,Y)/Var(X)';
      case 'seasonality_aware':
        return 'Forecast(t + i) = Trend(t + i) × SeasonalFactor(month)';
      default:
        return 'Deterministic Mathematical Model';
    }
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-amber-400" />
            Model Specifications & Assumptions Disclosure
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full mathematical transparency regarding formulas, historical coverage, and limitations.
          </p>
        </div>

        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs font-mono font-medium">
          {runResult.methodLabel}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Mathematical Formula & Parameters */}
        <div className="space-y-3 bg-[#0b101b] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Mathematical Formulation</span>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400">
            {getMethodFormula()}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Historical Window Used:</span>
              <span className="font-mono font-medium text-white">
                {runResult.historicalWindowPeriods} monthly observations
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Forecast Horizon:</span>
              <span className="font-mono font-medium text-white">{runResult.horizonMonths} months</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Non-Negative Revenue Policy:</span>
              <span
                className={`font-mono font-medium ${
                  runResult.methodConfig.zeroFloorPolicyApplied ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {runResult.methodConfig.zeroFloorPolicyApplied ? 'Active (Clamped at $0.00)' : 'Active (No Sub-Zero Clamping Needed)'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Uncertainty Band Technique:</span>
              <span className="font-mono text-slate-200">±1.0 Historical Standard Deviation</span>
            </div>
          </div>
        </div>

        {/* Right Column: Model Assumptions & Disclosures */}
        <div className="space-y-3 bg-[#0b101b] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Documented Assumptions & Constraints</span>
          </div>

          <div className="space-y-2">
            {runResult.assumptions.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {runResult.limitations.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Limitations & Cautions
              </span>
              {runResult.limitations.map((lim, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  <span>{lim}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
