import React from 'react';
import {
  TrendingUp,
  GitBranch,
  Target,
  Download,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface ForecastScenariosSectionProps {
  data: ConsolidatedReportData;
  onExportSectionCsv: () => void;
}

export const ForecastScenariosSection: React.FC<ForecastScenariosSectionProps> = ({
  data,
  onExportSectionCsv,
}) => {
  const { forecastScenarios, summaryKpis } = data;
  const curr = summaryKpis.currency;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Revenue Projections & Scenario Sensitivity Planning
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Forward-looking revenue modeling, scenario divergence, and explicit management assumptions.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Projections CSV
        </button>
      </div>

      {/* Forecast Core Numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Baseline Monthly Run-Rate</div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {curr} {(forecastScenarios.baselineNextMonthRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-400 mt-1">
            +{forecastScenarios.growthRatePercent || 0}% projected trendline
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Projected Next Quarter Run-Rate</div>
          <div className="text-lg font-bold text-purple-400 font-mono mt-1">
            {curr} {(forecastScenarios.baselineQuarterlyRunRate || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Target 90-day operating volume
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Optimistic Upside Case (+15%)</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
            {curr} {(forecastScenarios.optimisticScenarioRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Higher expansion & pipeline closure
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Pessimistic Downside Shock (-12%)</div>
          <div className="text-lg font-bold text-amber-400 font-mono mt-1">
            {curr} {(forecastScenarios.pessimisticScenarioRevenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Conservative stress-test floor
          </div>
        </div>
      </div>

      {/* Uncertainty Spread & Planning Assumptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/70 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Scenario Spread Band</span>
            <span className="font-mono text-xs text-purple-400">
              Δ {curr} {(forecastScenarios.uncertaintySpread || 0).toLocaleString()}
            </span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            The modeled divergence between optimistic upside and conservative downside is{' '}
            <span className="text-white font-medium">
              {curr} {(forecastScenarios.uncertaintySpread || 0).toLocaleString()}
            </span>. This represents the working capital buffer management must preserve against market fluctuations.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Optimistic Outcome
              </span>
              <span className="font-mono font-medium">{curr} {(forecastScenarios.optimisticScenarioRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Base Plan (Target)
              </span>
              <span className="font-mono font-medium">{curr} {(forecastScenarios.baselineQuarterlyRunRate || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Downside Floor
              </span>
              <span className="font-mono font-medium">{curr} {(forecastScenarios.pessimisticScenarioRevenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/70 space-y-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Explicit Forecasting Assumptions
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {forecastScenarios.keyAssumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{assump}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
