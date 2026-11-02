import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Calendar,
  Save,
  Camera,
  RotateCcw,
  CheckSquare,
  Square,
  Building2,
  FileCheck,
  Shield,
  Loader2,
} from 'lucide-react';
import {
  ExecutiveReportConfig,
  ReportTemplateType,
  ReportSectionId,
  PeriodPreset,
  ConfidentialityLevel,
  TEMPLATE_METADATA,
  TEMPLATE_DEFAULT_SECTIONS,
} from '../../types/executiveReport';

interface ReportBuilderSectionProps {
  config: ExecutiveReportConfig;
  onChangeConfig: (newConfig: ExecutiveReportConfig) => void;
  onSaveConfig: () => void;
  onSaveSnapshot: () => void;
  onGenerateCommentary: () => Promise<void>;
  isGeneratingCommentary: boolean;
  commentaryProvider?: string;
}

const ALL_SECTIONS: { id: ReportSectionId; label: string; desc: string }[] = [
  { id: 'executive_summary', label: 'Executive Summary', desc: 'KPI scorecards & narrative briefing' },
  { id: 'financial_performance', label: 'Financial Performance', desc: 'Revenue, OpEx, P&L category distribution' },
  { id: 'operations_receivables', label: 'Operations & Receivables', desc: 'Invoiced billing, collections & ageing buckets' },
  { id: 'reconciliation_controls', label: 'Reconciliation & Controls', desc: 'Bank match rate, clearing variances, lock audit' },
  { id: 'forecast_scenarios', label: 'Forecast & Scenarios', desc: 'Next quarter run-rate & scenario sensitivity' },
  { id: 'annual_report', label: 'Annual Report Analysis', desc: '10-K audited statutory ratios & auditor opinions' },
  { id: 'advisory_highlights', label: 'Advisory Action Plan', desc: 'Health signals matrix & prioritized initiatives' },
  { id: 'data_quality', label: 'Data Quality & Provenance', desc: '8-category audit provenance & warning flags' },
];

const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'all_time', label: 'All Recorded Time' },
  { id: 'current_quarter', label: 'Current Quarter' },
  { id: 'previous_quarter', label: 'Previous Quarter' },
  { id: 'current_year', label: 'Current Year' },
  { id: 'previous_year', label: 'Previous Year' },
  { id: 'current_month', label: 'Current Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'custom', label: 'Custom Date Range' },
];

const TEMPLATES: ReportTemplateType[] = [
  'executive_summary',
  'financial_performance',
  'invoice_receivables',
  'reconciliation_controls',
  'forecast_scenarios',
  'annual_report_analysis',
  'advisory_action_plan',
  'custom',
];

export const ReportBuilderSection: React.FC<ReportBuilderSectionProps> = ({
  config,
  onChangeConfig,
  onSaveConfig,
  onSaveSnapshot,
  onGenerateCommentary,
  isGeneratingCommentary,
  commentaryProvider,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTemplateSelect = (template: ReportTemplateType) => {
    const meta = TEMPLATE_METADATA[template];
    const defaultSections = TEMPLATE_DEFAULT_SECTIONS[template];

    onChangeConfig({
      ...config,
      template,
      title: template === 'custom' ? config.title : meta.name,
      includedSections: defaultSections,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleSection = (sectionId: ReportSectionId) => {
    const exists = config.includedSections.includes(sectionId);
    let updated: ReportSectionId[];
    if (exists) {
      updated = config.includedSections.filter((id) => id !== sectionId);
    } else {
      updated = [...config.includedSections, sectionId];
    }
    onChangeConfig({
      ...config,
      template: 'custom',
      includedSections: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-950/70 text-blue-400 border border-blue-800/60">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Interactive Report Builder</h2>
            <p className="text-xs text-slate-400">
              Customize entity parameters, reporting period, section inclusions, and executive commentary.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 bg-slate-800/80 rounded transition"
          >
            {isExpanded ? 'Collapse Builder' : 'Expand Builder'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-6 text-xs">
          {/* 1. Template Selector */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Select Standard Report Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((t) => {
                const meta = TEMPLATE_METADATA[t];
                const isSelected = config.template === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTemplateSelect(t)}
                    className={`p-2.5 text-left rounded-lg border transition ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs leading-tight line-clamp-1">
                        {meta.name}
                      </span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">
                      {meta.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Metadata: Entity Name, Title, Currency, Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/60">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Entity Name</label>
              <input
                type="text"
                value={config.entityName}
                onChange={(e) => onChangeConfig({ ...config, entityName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="Company legal entity..."
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Report Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="Report title..."
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Base Currency</label>
              <select
                value={config.currency}
                onChange={(e) => onChangeConfig({ ...config, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Confidentiality Tier</label>
              <select
                value={config.confidentialityLevel}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    confidentialityLevel: e.target.value as ConfidentialityLevel,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                <option value="Internal Use Only">Internal Use Only</option>
                <option value="Board & Executive">Board & Executive</option>
                <option value="Confidential">Confidential</option>
                <option value="Public Filing Extract">Public Filing Extract</option>
              </select>
            </div>
          </div>

          {/* 3. Period Presets & Date Bounds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Period Preset</label>
              <select
                value={config.periodPreset}
                onChange={(e) =>
                  onChangeConfig({ ...config, periodPreset: e.target.value as PeriodPreset })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
              >
                {PERIOD_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => onChangeConfig({ ...config, startDate: e.target.value, periodPreset: 'custom' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">End Date</label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => onChangeConfig({ ...config, endDate: e.target.value, periodPreset: 'custom' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* 4. Section Inclusions (Checkboxes) */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 font-medium">Included Report Sections:</label>
              <span className="text-[11px] text-slate-400 font-mono">
                {config.includedSections.length} of {ALL_SECTIONS.length} Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ALL_SECTIONS.map((sec) => {
                const isChecked = config.includedSections.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleToggleSection(sec.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                      isChecked
                        ? 'bg-slate-800/90 border-slate-700 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-xs block leading-tight">{sec.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{sec.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Executive Commentary & AI Assistance */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-slate-300 font-medium">Executive Narrative & Management Briefing</label>
                <p className="text-[11px] text-slate-400">
                  Grounded narrative commentary summarizing core financial figures and operational action points.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {commentaryProvider && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    Provider: {commentaryProvider}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onGenerateCommentary}
                  disabled={isGeneratingCommentary}
                  className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isGeneratingCommentary ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Grounding Narrative...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Auto-Generate Commentary
                    </>
                  )}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={config.executiveCommentary}
              onChange={(e) => onChangeConfig({ ...config, executiveCommentary: e.target.value })}
              placeholder="Enter executive briefing or generate commentary based on active figures..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
            />
          </div>

          {/* 6. Action Bar */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Prepared by: <span className="text-slate-200 font-medium">{config.preparedBy}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveConfig}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Configuration
              </button>

              <button
                type="button"
                onClick={onSaveSnapshot}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow transition"
              >
                <Camera className="w-3.5 h-3.5" />
                Capture Immutable Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
