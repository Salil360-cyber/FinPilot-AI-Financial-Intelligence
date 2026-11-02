import React, { useState } from 'react';
import { X, SlidersHorizontal, RefreshCw, Save, Info } from 'lucide-react';
import { AdvisoryThresholds, DEFAULT_ADVISORY_THRESHOLDS } from '../../types/advisory';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: AdvisoryThresholds;
  onSaveThresholds: (thresholds: AdvisoryThresholds) => void;
}

export const ThresholdConfigModal: React.FC<ThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  currentThresholds,
  onSaveThresholds,
}) => {
  const [form, setForm] = useState<AdvisoryThresholds>({ ...currentThresholds });

  if (!isOpen) return null;

  const handleReset = () => {
    setForm({ ...DEFAULT_ADVISORY_THRESHOLDS });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThresholds(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Configure Advisory Signal Thresholds
              </h3>
              <p className="text-[11px] text-slate-400">
                Transparent rules governing alert severity triggers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-start gap-2 text-slate-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              Adjusting these thresholds alters when deterministic advisory alerts trigger as Monitor vs Attention Required vs High Priority. Saved locally in browser persistence.
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-200 font-medium">Revenue Contraction Trigger (%)</label>
                <span className="font-mono text-amber-400 font-bold">{form.revenueDeclineThresholdPct}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Triggers an advisory alert when period-over-period revenue decreases beyond this threshold.
              </p>
              <input
                type="number"
                step="0.5"
                min="1"
                max="50"
                value={form.revenueDeclineThresholdPct}
                onChange={(e) => setForm({ ...form, revenueDeclineThresholdPct: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-200 font-medium">OpEx vs Revenue Growth Gap (%)</label>
                <span className="font-mono text-amber-400 font-bold">{form.opexRevenueGrowthGapPct}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Alerts when operating expenditure percentage growth outpaces revenue percentage growth by this spread.
              </p>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="30"
                value={form.opexRevenueGrowthGapPct}
                onChange={(e) => setForm({ ...form, opexRevenueGrowthGapPct: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-200 font-medium">Overdue Receivables Tolerance (%)</label>
                <span className="font-mono text-amber-400 font-bold">{form.overdueReceivablesThresholdPct}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Threshold of total outstanding customer receivables past their contractual payment due date.
              </p>
              <input
                type="number"
                step="1"
                min="1"
                max="80"
                value={form.overdueReceivablesThresholdPct}
                onChange={(e) => setForm({ ...form, overdueReceivablesThresholdPct: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-200 font-medium">Top Single Customer Exposure (%)</label>
                <span className="font-mono text-amber-400 font-bold">{form.topCustomerConcentrationPct}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Flags customer concentration risk when a single client accounts for more than this share of billed revenue.
              </p>
              <input
                type="number"
                step="1"
                min="10"
                max="90"
                value={form.topCustomerConcentrationPct}
                onChange={(e) => setForm({ ...form, topCustomerConcentrationPct: parseFloat(e.target.value) || 10 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-200 font-medium">Min Forecast Historical Months</label>
                <span className="font-mono text-amber-400 font-bold">{form.minForecastHistoryMonths} Mo</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-1.5">
                Warns of weak statistical coverage when revenue projection relies on fewer historical months.
              </p>
              <input
                type="number"
                step="1"
                min="3"
                max="24"
                value={form.minForecastHistoryMonths}
                onChange={(e) => setForm({ ...form, minForecastHistoryMonths: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Recommended
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Apply Thresholds
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
