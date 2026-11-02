import React, { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  Plus,
  RotateCcw,
  Trash2,
  Check,
  Info,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  ScenarioDefinition,
  ScenarioProjectionSummary,
  ForecastRunResult,
} from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface ScenarioPlanningSectionProps {
  scenarios: ScenarioDefinition[];
  scenarioSummaries: ScenarioProjectionSummary[];
  runResult: ForecastRunResult;
  onUpdateScenario: (scenario: ScenarioDefinition) => void;
  onAddScenario: (scenario: ScenarioDefinition) => void;
  onDeleteScenario: (id: string) => void;
  onResetScenarios: () => void;
  currencySymbol?: string;
}

export const ScenarioPlanningSection: React.FC<ScenarioPlanningSectionProps> = ({
  scenarios,
  scenarioSummaries,
  runResult,
  onUpdateScenario,
  onAddScenario,
  onDeleteScenario,
  onResetScenarios,
  currencySymbol = '$',
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id || 'base');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const activeSummary = scenarioSummaries.find((s) => s.scenarioId === activeScenario?.id);

  const handleFieldChange = (field: keyof ScenarioDefinition, value: any) => {
    if (!activeScenario) return;
    onUpdateScenario({
      ...activeScenario,
      [field]: value,
    });
  };

  const handleCreateCustomScenario = () => {
    if (!newScenarioName.trim()) return;
    const newSc: ScenarioDefinition = {
      id: `sc-custom-${Date.now().toString(36)}`,
      name: newScenarioName.trim(),
      description: 'Custom sensitivity scenario created by user.',
      isSystemDefault: false,
      color: '#8b5cf6', // purple
      growthRatePercent: 5.0,
      customerExpansionPercent: 2.0,
      churnRatePercent: 1.0,
      oneTimeAdjustment: 0,
      oneTimeMonthIndex: 1,
      recurringMonthlyAdjustment: 0,
    };
    onAddScenario(newSc);
    setSelectedScenarioId(newSc.id);
    setNewScenarioName('');
    setIsCreatingNew(false);
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Scenario Planning & Sensitivity Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test business hypotheses by parameterizing revenue growth, client expansion, churn, and adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreatingNew(!isCreatingNew)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Scenario</span>
          </button>
          <button
            type="button"
            onClick={onResetScenarios}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            title="Reset to system defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* New Scenario Form Modal/Row */}
      {isCreatingNew && (
        <div className="p-3 bg-[#0b101b] border border-slate-700 rounded-lg flex items-center gap-2">
          <input
            type="text"
            placeholder="Scenario name (e.g. Enterprise Upsell Q4)..."
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
          />
          <button
            type="button"
            onClick={handleCreateCustomScenario}
            disabled={!newScenarioName.trim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingNew(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scenario Tabs */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((sc) => {
          const summary = scenarioSummaries.find((s) => s.scenarioId === sc.id);
          const isSelected = sc.id === selectedScenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-slate-800/90 text-white border-amber-500/50 shadow-md'
                  : 'bg-[#0b101b] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }}></span>
              <span>{sc.name}</span>
              {summary && (
                <span className="font-mono text-[11px] text-slate-300">
                  {currencySymbol}
                  {Math.round(summary.totalProjectedValue).toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Scenario Configuration Drawer */}
      {activeScenario && (
        <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Parameters: {activeScenario.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeScenario.description}</p>
            </div>

            {!activeScenario.isSystemDefault && (
              <button
                type="button"
                onClick={() => onDeleteScenario(activeScenario.id)}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* 1. Growth Rate */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Revenue Growth</span>
                <span className="text-white font-bold">{activeScenario.growthRatePercent}%</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={activeScenario.growthRatePercent}
                onChange={(e) => handleFieldChange('growthRatePercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            {/* 2. Customer Expansion */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Customer Expansion</span>
                <span className="text-emerald-400 font-bold">+{activeScenario.customerExpansionPercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={activeScenario.customerExpansionPercent}
                onChange={(e) => handleFieldChange('customerExpansionPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            {/* 3. Expected Churn */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Expected Churn</span>
                <span className="text-rose-400 font-bold">-{activeScenario.churnRatePercent}%</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={activeScenario.churnRatePercent}
                onChange={(e) => handleFieldChange('churnRatePercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            {/* 4. Recurring Monthly Adjustment */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Recurring Adj ($/mo)</span>
                <span className="text-white font-bold">${activeScenario.recurringMonthlyAdjustment}</span>
              </label>
              <input
                type="number"
                step="500"
                value={activeScenario.recurringMonthlyAdjustment}
                onChange={(e) => handleFieldChange('recurringMonthlyAdjustment', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>

            {/* 5. One-Time Adjustment */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>One-Time Adj ($)</span>
                <span className="text-white font-bold">${activeScenario.oneTimeAdjustment}</span>
              </label>
              <input
                type="number"
                step="1000"
                value={activeScenario.oneTimeAdjustment}
                onChange={(e) => handleFieldChange('oneTimeAdjustment', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scenario Impact Comparison Matrix */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b101b] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Scenario Name</th>
              <th className="px-4 py-3 text-right">Horizon Total</th>
              <th className="px-4 py-3 text-right">Variance vs Base ($)</th>
              <th className="px-4 py-3 text-right">Variance vs Base (%)</th>
              {runResult.periods.slice(0, 4).map((p) => (
                <th key={p.period} className="px-4 py-3 text-right">
                  {p.periodLabel.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {scenarioSummaries.map((sc) => {
              return (
                <tr key={sc.scenarioId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2.5 text-white font-medium flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sc.color }}></span>
                    <span>{sc.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-white">
                    {currencySymbol}
                    {Math.round(sc.totalProjectedValue).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {sc.varianceFromBaseline > 0 ? (
                      <span className="text-emerald-400">+{currencySymbol}{Math.round(sc.varianceFromBaseline).toLocaleString()}</span>
                    ) : sc.varianceFromBaseline < 0 ? (
                      <span className="text-rose-400">-{currencySymbol}{Math.round(Math.abs(sc.varianceFromBaseline)).toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Baseline</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {sc.varianceFromBaselinePercent > 0 ? (
                      <span className="text-emerald-400">+{sc.varianceFromBaselinePercent.toFixed(1)}%</span>
                    ) : sc.varianceFromBaselinePercent < 0 ? (
                      <span className="text-rose-400">{sc.varianceFromBaselinePercent.toFixed(1)}%</span>
                    ) : (
                      <span className="text-slate-400 font-normal">0.0%</span>
                    )}
                  </td>
                  {runResult.periods.slice(0, 4).map((p) => {
                    const monthlyVal = sc.monthlyProjections.find((m) => m.period === p.period)?.value ?? 0;
                    return (
                      <td key={p.period} className="px-4 py-2.5 text-right text-slate-300">
                        {currencySymbol}
                        {Math.round(monthlyVal).toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
