import React, { useState } from 'react';
import { X, Save, RotateCcw, ShieldCheck, DollarSign, Calendar } from 'lucide-react';
import { ManualFinancialInputs } from '../../types/analytics';
import { useFinancial } from '../../context/FinancialContext';

interface ManualInputsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualInputsModal: React.FC<ManualInputsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { manualFinancialInputs, updateManualFinancialInputs, resetManualFinancialInputs } = useFinancial();

  const [formData, setFormData] = useState<ManualFinancialInputs>(manualFinancialInputs);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof ManualFinancialInputs, value: string) => {
    if (field === 'asOfDate' || field === 'notes') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      const num = value === '' ? undefined : parseFloat(value);
      setFormData((prev) => ({ ...prev, [field]: num }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateManualFinancialInputs(formData);
    setSuccessMessage('Balance sheet inputs updated successfully.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (window.confirm('Reset all manual financial inputs to default initial baseline?')) {
      resetManualFinancialInputs();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                Balance Sheet Framework
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                Manual Financial Inputs Drawer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Provide optional balance-sheet balances to calculate liquidity, solvency, and efficiency ratios.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs">
              {successMessage}
            </div>
          )}

          {/* Compliance Notice */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              All values entered here are transparently flagged as <strong>Manual Input</strong> on financial ratio cards and audit logs. They are never mixed silently with General Ledger vouchers.
            </span>
          </div>

          {/* As-Of Date */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Statement As-of Date</label>
            <input
              type="date"
              value={formData.asOfDate}
              onChange={(e) => handleChange('asOfDate', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
            />
          </div>

          {/* Section A: Liquidity Balances */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider">
              1. Liquidity & Short-Term Working Capital
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Current Assets ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.currentAssets ?? ''}
                  onChange={(e) => handleChange('currentAssets', e.target.value)}
                  placeholder="e.g. 4120000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Inventory ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.inventory ?? ''}
                  onChange={(e) => handleChange('inventory', e.target.value)}
                  placeholder="e.g. 640000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Prepaid Expenses ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.prepaidExpenses ?? ''}
                  onChange={(e) => handleChange('prepaidExpenses', e.target.value)}
                  placeholder="e.g. 120000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Current Liabilities ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.currentLiabilities ?? ''}
                  onChange={(e) => handleChange('currentLiabilities', e.target.value)}
                  placeholder="e.g. 1702480"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Cash & Cash Equivalents ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.cashAndEquivalents ?? ''}
                  onChange={(e) => handleChange('cashAndEquivalents', e.target.value)}
                  placeholder="e.g. 2340000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Cost of Goods Sold (COGS) ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.cogs ?? ''}
                  onChange={(e) => handleChange('cogs', e.target.value)}
                  placeholder="e.g. 1850000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section B: Solvency & Capital Structure */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider">
              2. Total Assets, Liabilities & Capital
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Total Assets ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalAssets ?? ''}
                  onChange={(e) => handleChange('totalAssets', e.target.value)}
                  placeholder="e.g. 6850000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Total Liabilities ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalLiabilities ?? ''}
                  onChange={(e) => handleChange('totalLiabilities', e.target.value)}
                  placeholder="e.g. 3330000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Total Debt Obligations ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalDebt ?? ''}
                  onChange={(e) => handleChange('totalDebt', e.target.value)}
                  placeholder="e.g. 1200000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Shareholders Equity ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.totalEquity ?? ''}
                  onChange={(e) => handleChange('totalEquity', e.target.value)}
                  placeholder="e.g. 3520000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section C: Optional Period Averages */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-sky-400 font-mono uppercase tracking-wider">
              3. Period Averages for ROA, ROE & Efficiency (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Beginning Assets ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.beginningAssets ?? ''}
                  onChange={(e) => handleChange('beginningAssets', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Ending Assets ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.endingAssets ?? ''}
                  onChange={(e) => handleChange('endingAssets', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Beginning Equity ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.beginningEquity ?? ''}
                  onChange={(e) => handleChange('beginningEquity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Ending Equity ($)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.endingEquity ?? ''}
                  onChange={(e) => handleChange('endingEquity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-slate-300 mb-1">Controller Audit Notes</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g. Figures reviewed against Q3 external auditor working papers..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs resize-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Balance Sheet Inputs</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
