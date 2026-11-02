import React, { useState } from 'react';
import {
  Sliders,
  Save,
  ShieldCheck,
  DollarSign,
  Calendar,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  FinancialPreferences,
  CurrencyOption,
  AccountingStandard,
} from '../../types/settings';
import { saveStoredFinancialPreferences } from '../../services/dataManagementEngine';

interface FinancialPreferencesSectionProps {
  preferences: FinancialPreferences;
  onUpdatePreferences: (updated: FinancialPreferences) => void;
  onToast: (msg: string) => void;
}

const CURRENCY_LIST: CurrencyOption[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'INR',
  'SGD',
  'JPY',
  'CHF',
];

export const FinancialPreferencesSection: React.FC<FinancialPreferencesSectionProps> = ({
  preferences,
  onUpdatePreferences,
  onToast,
}) => {
  const [formData, setFormData] = useState<FinancialPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = { ...formData, updatedAt: new Date().toISOString() };
    saveStoredFinancialPreferences(updated);
    onUpdatePreferences(updated);
    setIsSaving(false);
    onToast('Financial Preferences updated successfully');
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Financial & Display Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure default workflow parameters, accounting conventions, and reconciliation tolerances.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Distinction between Display & Calculations Banner */}
      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div>
          <strong className="text-slate-200">Accounting Isolation Guarantee:</strong> Display preferences alter
          how figures are formatted visually on screen and establish defaults for newly drafted documents. Changing
          the default currency does not convert historical ledger entries or invent speculative exchange rates. All
          financial calculations retain full floating-point precision internally.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Default Workflow Currency
            </label>
            <select
              value={formData.defaultCurrencyForNewWorkflows}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultCurrencyForNewWorkflows: e.target.value as CurrencyOption,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            >
              {CURRENCY_LIST.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Applied as initial selection for new invoices & GL transactions.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Default Reporting Period Preset
            </label>
            <select
              value={formData.defaultReportingPeriodPreset}
              onChange={(e) =>
                setFormData({ ...formData, defaultReportingPeriodPreset: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="all_time">All Recorded Time (Default)</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="previous_quarter">Previous Quarter</option>
              <option value="current_year">Current Fiscal Year</option>
              <option value="previous_year">Previous Fiscal Year</option>
              <option value="current_month">Current Month</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Default filter when opening Analytics and Executive Reports.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Governing Accounting Standard
            </label>
            <select
              value={formData.accountingStandard}
              onChange={(e) =>
                setFormData({ ...formData, accountingStandard: e.target.value as AccountingStandard })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="GAAP">US GAAP (FASB Framework)</option>
              <option value="IFRS">IFRS (IASB International Standard)</option>
            </select>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Used in report compliance disclosures and balance sheet layout.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Display Decimal Precision
            </label>
            <select
              value={formData.decimalPrecision}
              onChange={(e) =>
                setFormData({ ...formData, decimalPrecision: Number(e.target.value) })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
            >
              <option value={0}>0 Decimals (Whole currency units)</option>
              <option value={2}>2 Decimals (Standard: $1,234.56)</option>
              <option value={4}>4 Decimals (High precision FX/Unit cost)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Bank Match Date Tolerance (Days)
            </label>
            <input
              type="number"
              min={0}
              max={15}
              value={formData.reconciliationDateToleranceDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  reconciliationDateToleranceDays: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Allowable variance window for automated statement clearing.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Auto-Match Confidence Threshold (%)
            </label>
            <input
              type="number"
              min={70}
              max={100}
              value={formData.autoMatchConfidenceThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  autoMatchConfidenceThreshold: Math.min(
                    100,
                    Math.max(70, parseInt(e.target.value) || 90)
                  ),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Confidence score required to auto-clear transactions without manual review.
            </span>
          </div>
        </div>

        {/* Operational Control Toggles */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={formData.enableAuditedStrictLock}
              onChange={(e) =>
                setFormData({ ...formData, enableAuditedStrictLock: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 block">
                Strict Internal Controls Lock on Completed Reconciliation Sessions
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Prevents retroactive editing or unmatching of transactions inside completed bank reconciliation
                sessions without formal supervisor reopening reason logs.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-950/40 border border-slate-800/70 hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={formData.notifyOnOverdueInvoices}
              onChange={(e) =>
                setFormData({ ...formData, notifyOnOverdueInvoices: e.target.checked })
              }
              className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200 block">
                Enable Proactive Aged Receivables Notifications
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Highlights customer sales invoices that have exceeded 30 and 60 days past their contractual
                due date in the executive summary banner.
              </p>
            </div>
          </label>
        </div>
      </form>
    </div>
  );
};
