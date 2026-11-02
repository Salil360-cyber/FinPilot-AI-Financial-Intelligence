import React, { useState, useMemo } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Download,
  Info,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import {
  AdvisoryScenarioAdjustment,
  AdvisoryScenarioComparisonResult,
} from '../../types/advisory';
import { calculateScenarioWhatIf, exportScenarioComparisonCsv } from '../../services/financialAdvisoryEngine';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface ScenarioWhatIfSectionProps {
  defaultBaselineRevenue: number;
  defaultBaselineOpex: number;
  currency: string;
  onExportCsv: (comparison: AdvisoryScenarioComparisonResult) => void;
}

export const ScenarioWhatIfSection: React.FC<ScenarioWhatIfSectionProps> = ({
  defaultBaselineRevenue,
  defaultBaselineOpex,
  currency,
  onExportCsv,
}) => {
  // Baseline overrides if desired
  const [baselineRev, setBaselineRev] = useState<number>(defaultBaselineRevenue || 120000);
  const [baselineExp, setBaselineExp] = useState<number>(defaultBaselineOpex || 78000);

  // Scenario parameters
  const [adjustment, setAdjustment] = useState<AdvisoryScenarioAdjustment>({
    revenueGrowthPct: 10,
    opexGrowthPct: 5,
    customerChurnPct: 2,
    customerExpansionPct: 4,
    recurringMonthlyAdj: 0,
    oneTimeAdj: 0,
    oneTimeMonthIndex: 1,
  });

  const comparison = useMemo(() => {
    return calculateScenarioWhatIf(baselineRev, baselineExp, adjustment, currency);
  }, [baselineRev, baselineExp, adjustment, currency]);

  const handleReset = () => {
    setAdjustment({
      revenueGrowthPct: 0,
      opexGrowthPct: 0,
      customerChurnPct: 0,
      customerExpansionPct: 0,
      recurringMonthlyAdj: 0,
      oneTimeAdj: 0,
      oneTimeMonthIndex: 1,
    });
    setBaselineRev(defaultBaselineRevenue || 120000);
    setBaselineExp(defaultBaselineOpex || 78000);
  };

  return (
    <div className="space-y-4">
      {/* Header and Disclaimers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Scenario Planning & What-If Stress Testing
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Model hypothetical revenue growth, cost adjustments, and customer churn without modifying book ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => onExportCsv(comparison)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            Export Comparison
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Simulation Boundary:</strong> What-If scenarios are purely mathematical projections for strategic evaluation. They do not alter journal entries, sales invoices, or statutory reports.
        </div>
      </div>

      {/* Main Grid: Controls on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
            <span>Model Assumptions</span>
            <span className="text-[10px] text-amber-400 font-normal">Independent Parameters</span>
          </h3>

          {/* Baseline inputs */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Baseline Revenue ($)</label>
              <input
                type="number"
                value={baselineRev}
                onChange={(e) => setBaselineRev(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Baseline OpEx ($)</label>
              <input
                type="number"
                value={baselineExp}
                onChange={(e) => setBaselineExp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Organic Revenue Growth</span>
                <span className="text-purple-400 font-mono font-semibold">
                  {adjustment.revenueGrowthPct > 0 ? '+' : ''}{adjustment.revenueGrowthPct}%
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="50"
                step="1"
                value={adjustment.revenueGrowthPct}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, revenueGrowthPct: parseInt(e.target.value) })
                }
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Operating Expense Adjustment</span>
                <span className="text-amber-400 font-mono font-semibold">
                  {adjustment.opexGrowthPct > 0 ? '+' : ''}{adjustment.opexGrowthPct}%
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                step="1"
                value={adjustment.opexGrowthPct}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, opexGrowthPct: parseInt(e.target.value) })
                }
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Customer Churn Rate</span>
                <span className="text-rose-400 font-mono font-semibold">
                  -{adjustment.customerChurnPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={adjustment.customerChurnPct}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, customerChurnPct: parseInt(e.target.value) })
                }
                className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Key Account Expansion</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  +{adjustment.customerExpansionPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={adjustment.customerExpansionPct}
                onChange={(e) =>
                  setAdjustment({ ...adjustment, customerExpansionPct: parseInt(e.target.value) })
                }
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Dollar Adjustments */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Recurring Monthly Adj ($)</label>
                <input
                  type="number"
                  value={adjustment.recurringMonthlyAdj}
                  onChange={(e) =>
                    setAdjustment({ ...adjustment, recurringMonthlyAdj: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">One-Time Adjustment ($)</label>
                <input
                  type="number"
                  value={adjustment.oneTimeAdj}
                  onChange={(e) =>
                    setAdjustment({ ...adjustment, oneTimeAdj: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Comparison Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Projected Revenue */}
            <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-400 block">Projected Revenue</span>
              <div className="text-lg font-bold text-white font-mono">
                ${comparison.projectedRevenue.toLocaleString()}
              </div>
              <div
                className={`text-[11px] font-mono flex items-center gap-1 ${
                  comparison.revenueVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {comparison.revenueVariance >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {comparison.revenueVariance >= 0 ? '+' : ''}${comparison.revenueVariance.toLocaleString()} (
                  {comparison.revenueVariancePct >= 0 ? '+' : ''}{comparison.revenueVariancePct}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">Base: ${comparison.baselineRevenue.toLocaleString()}</span>
            </div>

            {/* Projected OpEx */}
            <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-400 block">Projected OpEx</span>
              <div className="text-lg font-bold text-white font-mono">
                ${comparison.projectedOpex.toLocaleString()}
              </div>
              <div
                className={`text-[11px] font-mono flex items-center gap-1 ${
                  comparison.opexVariance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span>
                  {comparison.opexVariance >= 0 ? '+' : ''}${comparison.opexVariance.toLocaleString()} (
                  {comparison.opexVariancePct >= 0 ? '+' : ''}{comparison.opexVariancePct}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">Base: ${comparison.baselineOpex.toLocaleString()}</span>
            </div>

            {/* Operating Margin */}
            <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[11px] text-slate-400 block">Projected Net Margin</span>
              <div className="text-lg font-bold text-amber-400 font-mono">
                {comparison.projectedNetMargin}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                <span>Base Margin: {comparison.baselineNetMargin}%</span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Spread: {roundCurrency(comparison.projectedNetMargin - comparison.baselineNetMargin) >= 0 ? '+' : ''}
                {roundCurrency(comparison.projectedNetMargin - comparison.baselineNetMargin)}%
              </span>
            </div>
          </div>

          {/* Applied Formula and Assumptions Breakdown */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Traceable Scenario Mechanics
              </h4>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-purple-300">
              {comparison.formulaApplied}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Simulated Assumptions Applied:
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {comparison.assumptionsList.map((a, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
