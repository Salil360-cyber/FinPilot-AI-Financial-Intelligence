import React, { useState } from 'react';
import {
  Building2,
  Save,
  ShieldAlert,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  CompanyProfile,
  DateFormatOption,
  NumberFormatOption,
  CurrencyOption,
} from '../../types/settings';
import { saveStoredCompanyProfile } from '../../services/dataManagementEngine';

interface CompanyProfileSectionProps {
  profile: CompanyProfile;
  onUpdateProfile: (updated: CompanyProfile) => void;
  onToast: (msg: string) => void;
}

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const CompanyProfileSection: React.FC<CompanyProfileSectionProps> = ({
  profile,
  onUpdateProfile,
  onToast,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated = { ...formData, updatedAt: new Date().toISOString() };
    saveStoredCompanyProfile(updated);
    onUpdateProfile(updated);
    setIsSaving(false);
    onToast('Company Profile updated successfully');
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Company Profile & Entity Metadata
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure reporting entity details, tax identifiers, and executive report presentation parameters.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Profile</span>
        </button>
      </div>

      {/* Mandatory Regulatory & Provenance Notice */}
      <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div>
          <strong className="text-slate-200">Configuration Notice:</strong> Company profile information represents
          internal reporting configuration metadata and does not independently verify the legal registration or
          audit certification of a corporate entity. Modifying profile settings will not retroactively alter historical
          general ledger records or currency values.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Company Trading Name</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              placeholder="e.g. Meridian Dynamics"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Legal Registered Entity Name</label>
            <input
              type="text"
              value={formData.legalEntityName}
              onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              placeholder="e.g. Meridian Dynamics Corporation Inc."
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Business Description & Industry</label>
          <textarea
            rows={2}
            value={formData.businessDescription || ''}
            onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
            placeholder="Operational scope, key commercial activities, or division..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Country / Jurisdiction</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
              placeholder="e.g. United States, United Kingdom"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Corporate Tax Identifier (EIN/VAT/GSTIN)</label>
            <input
              type="text"
              value={formData.taxIdentifier || ''}
              onChange={(e) => setFormData({ ...formData, taxIdentifier: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs font-mono"
              placeholder="e.g. US-EIN-94-2819041"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Reporting Currency (Default)</label>
            <select
              value={formData.reportingCurrency}
              onChange={(e) => setFormData({ ...formData, reportingCurrency: e.target.value as CurrencyOption })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Fiscal Year Start Month</label>
            <select
              value={formData.fiscalYearStartMonth}
              onChange={(e) => setFormData({ ...formData, fiscalYearStartMonth: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name} (Month {idx + 1})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Display Date Format</label>
            <select
              value={formData.dateFormat}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as DateFormatOption })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs font-mono"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
              <option value="DD-MMM-YYYY">DD-MMM-YYYY (e.g. 28-Oct-2026)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Display Number Format</label>
            <select
              value={formData.numberFormat}
              onChange={(e) => setFormData({ ...formData, numberFormat: e.target.value as NumberFormatOption })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            >
              <option value="standard_en">1,234,567.89 (Standard US/UK)</option>
              <option value="european">1.234.567,89 (European Style)</option>
              <option value="indian_lakhs">12,34,567.89 (Indian Lakhs/Crores)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80">
          <label className="block text-slate-300 font-medium mb-1">Standard Report Footer Text</label>
          <input
            type="text"
            value={formData.reportFooterText || ''}
            onChange={(e) => setFormData({ ...formData, reportFooterText: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
            placeholder="Confidential • Internal Management Document..."
          />
        </div>
      </form>
    </div>
  );
};
