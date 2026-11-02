import React, { useState } from 'react';
import { ShieldCheck, ArrowUpRight, Calculator, CheckCircle2, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { FinancialRatioResult, RatioCategory } from '../../types/analytics';
import { Modal } from '../common/Modal';

interface RatioCalculatorSectionProps {
  ratios: FinancialRatioResult[];
  onOpenManualInputs: () => void;
}

const CATEGORY_TABS: { id: RatioCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Ratios (11)' },
  { id: 'liquidity', label: 'Liquidity' },
  { id: 'profitability', label: 'Profitability' },
  { id: 'leverage', label: 'Leverage / Solvency' },
  { id: 'efficiency', label: 'Efficiency' },
];

export const RatioCalculatorSection: React.FC<RatioCalculatorSectionProps> = ({
  ratios,
  onOpenManualInputs,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RatioCategory | 'all'>('all');
  const [inspectedRatio, setInspectedRatio] = useState<FinancialRatioResult | null>(null);

  const filteredRatios = ratios.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Financial Ratio Calculator & Audit Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceable GAAP ratios with explicit formulas, missing input indicators, and component verification
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenManualInputs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <span>Configure Balance Sheet Inputs</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedCategory === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ratios Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRatios.map((ratio) => (
          <div
            key={ratio.id}
            onClick={() => setInspectedRatio(ratio)}
            className="p-5 bg-[#121929] border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {ratio.category}
                </span>

                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    ratio.status === 'calculated'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : ratio.status === 'estimated'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {ratio.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {ratio.name}
                </h3>
                <div
                  className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                    ratio.status === 'unavailable'
                      ? 'text-slate-500 text-lg'
                      : ratio.benchmarkStatus === 'favorable'
                      ? 'text-emerald-400'
                      : ratio.benchmarkStatus === 'warning'
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {ratio.formattedValue}
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {ratio.interpretation}
              </p>

              {ratio.status === 'unavailable' && ratio.missingInputs.length > 0 && (
                <div className="p-2 bg-rose-950/30 border border-rose-800/40 rounded-lg text-[10px] text-rose-300">
                  Missing: {ratio.missingInputs.join(', ')}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-[200px]">{ratio.formula}</span>
              <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-300 shrink-0">
                <span>Target {ratio.benchmark}</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Ratio Inspection Modal */}
      {inspectedRatio && (
        <Modal
          isOpen={!!inspectedRatio}
          onClose={() => setInspectedRatio(null)}
          title={`Financial Ratio Audit: ${inspectedRatio.name}`}
          subtitle={`Category: ${inspectedRatio.category.toUpperCase()} · Status: ${inspectedRatio.status.toUpperCase()}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400">Computed Ratio Value</span>
                <div
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    inspectedRatio.status === 'unavailable' ? 'text-slate-500 text-lg' : 'text-emerald-400'
                  }`}
                >
                  {inspectedRatio.formattedValue}
                </div>
              </div>

              <div className="text-right font-mono text-slate-400">
                <span>Benchmark Target: </span>
                <span className="text-white font-semibold">{inspectedRatio.benchmark}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-300">Governing Mathematical Formula:</span>
              <div className="p-2.5 bg-slate-950 font-mono text-amber-300 border border-slate-800 rounded">
                {inspectedRatio.formula}
              </div>
            </div>

            {/* Components Breakdown */}
            {inspectedRatio.components.length > 0 ? (
              <div className="space-y-2">
                <span className="font-semibold text-slate-300">Underlying Balance Sheet & Income Components:</span>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden font-mono">
                  {inspectedRatio.components.map((c, i) => (
                    <div key={i} className="p-2.5 bg-slate-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{c.label}</span>
                        {c.isManual && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                            Manual Input
                          </span>
                        )}
                      </div>
                      <span className="text-white font-semibold tabular-nums">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400">
                Required components ({inspectedRatio.missingInputs.join(', ')}) are currently missing from the ledger.
              </div>
            )}

            <p className="text-slate-400 leading-relaxed text-[11px]">
              {inspectedRatio.interpretation}
            </p>

            {inspectedRatio.limitations && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300/90 rounded-lg text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{inspectedRatio.limitations}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setInspectedRatio(null);
                  onOpenManualInputs();
                }}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
              >
                Edit Inputs
              </button>

              <button
                type="button"
                onClick={() => setInspectedRatio(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
