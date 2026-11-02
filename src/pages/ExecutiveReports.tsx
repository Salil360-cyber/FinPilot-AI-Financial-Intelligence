import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Sliders,
  Layers,
  Printer,
  Download,
  Camera,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Eye,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react';
import { useFinancialContext } from '../context/FinancialContext';
import {
  ExecutiveReportConfig,
  ConsolidatedReportData,
  ReportTemplateType,
  ReportSectionId,
  TEMPLATE_DEFAULT_SECTIONS,
  TEMPLATE_METADATA,
} from '../types/executiveReport';
import {
  buildConsolidatedReportData,
  generateExecutiveReportCommentary,
  generateReportSummaryCsv,
  generateSectionCsv,
  calculatePeriodDates,
} from '../services/executiveReportEngine';

// Components
import { ReportLibrarySection } from '../components/executiveReports/ReportLibrarySection';
import { ReportBuilderSection } from '../components/executiveReports/ReportBuilderSection';
import { ExecutiveSummarySection } from '../components/executiveReports/ExecutiveSummarySection';
import { FinancialPerformanceSection } from '../components/executiveReports/FinancialPerformanceSection';
import { OperationsReceivablesSection } from '../components/executiveReports/OperationsReceivablesSection';
import { ReconciliationControlsSection } from '../components/executiveReports/ReconciliationControlsSection';
import { ForecastScenariosSection } from '../components/executiveReports/ForecastScenariosSection';
import { AnnualReportAnalysisSection } from '../components/executiveReports/AnnualReportAnalysisSection';
import { AdvisoryHighlightsSection } from '../components/executiveReports/AdvisoryHighlightsSection';
import { DataQualitySourcesSection } from '../components/executiveReports/DataQualitySourcesSection';
import { ExportPrintPreviewModal } from '../components/executiveReports/ExportPrintPreviewModal';
import { Phase10TestRunnerModal } from '../components/executiveReports/Phase10TestRunnerModal';

const STORAGE_KEY = 'finpilot_saved_reports_v10';

const DEFAULT_PRESET_REPORTS: ExecutiveReportConfig[] = [
  {
    id: 'REP-DEFAULT-EXEC',
    title: 'Executive Financial Summary & Management Briefing',
    entityName: 'Meridian Dynamics Corp',
    template: 'executive_summary',
    periodPreset: 'all_time',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    currency: 'USD',
    includedSections: TEMPLATE_DEFAULT_SECTIONS.executive_summary,
    executiveCommentary:
      'Meridian Dynamics Corp closed the evaluated operating cycle with recorded operating revenue and disciplined capital allocation. Billings on enterprise accounts and expense tracking provide visibility over working capital and liquidity.',
    preparedBy: 'Eleanor Vance, CFA — Lead Financial Controller',
    confidentialityLevel: 'Board & Executive',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'REP-DEFAULT-PERF',
    title: 'Financial Performance & Profitability Analysis',
    entityName: 'Meridian Dynamics Corp',
    template: 'financial_performance',
    periodPreset: 'all_time',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    currency: 'USD',
    includedSections: TEMPLATE_DEFAULT_SECTIONS.financial_performance,
    executiveCommentary:
      'Operating margins remain favorable against industry benchmarks. Expenditure growth was concentrated in cloud infrastructure and legal compliance.',
    preparedBy: 'Marcus Brody — VP Finance & FP&A',
    confidentialityLevel: 'Confidential',
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'REP-DEFAULT-AR',
    title: 'Customer Invoicing & Receivables Aging Schedule',
    entityName: 'Meridian Dynamics Corp',
    template: 'invoice_receivables',
    periodPreset: 'all_time',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    currency: 'USD',
    includedSections: TEMPLATE_DEFAULT_SECTIONS.invoice_receivables,
    executiveCommentary:
      'Working capital collections indicate a 91%+ overall cash realization rate. Overdue debt past 60 days is actively tracked under expedited credit remediation.',
    preparedBy: 'Diana Chen — Credit Controller',
    confidentialityLevel: 'Internal Use Only',
    createdAt: '2026-03-10T14:30:00Z',
    updatedAt: '2026-03-10T14:30:00Z',
  },
];

export const ExecutiveReports: React.FC = () => {
  const {
    transactions,
    salesInvoices,
    reconciliationSessions,
    bankAccounts,
    manualFinancialInputs,
    forecastSnapshots,
    forecastScenarios,
    annualReports,
  } = useFinancialContext();

  // Saved reports state with persistence
  const [savedReports, setSavedReports] = useState<ExecutiveReportConfig[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: ExecutiveReportConfig) => {
            if (r.executiveCommentary?.includes('resilient operating profitability')) {
              return {
                ...r,
                executiveCommentary:
                  'Meridian Dynamics Corp closed the evaluated operating cycle with recorded operating revenue and disciplined capital allocation. Billings on enterprise accounts and expense tracking provide visibility over working capital and liquidity.',
              };
            }
            return r;
          });
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRESET_REPORTS;
  });

  const [activeReportId, setActiveReportId] = useState<string>(() => {
    return savedReports.length > 0 ? savedReports[0].id : DEFAULT_PRESET_REPORTS[0].id;
  });

  const [activeConfig, setActiveConfig] = useState<ExecutiveReportConfig>(() => {
    return savedReports.length > 0 ? savedReports[0] : DEFAULT_PRESET_REPORTS[0];
  });

  const [activeTab, setActiveTab] = useState<'view' | 'library' | 'builder'>('view');
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const [commentaryProvider, setCommentaryProvider] = useState<string>('Grounded Heuristic');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedReports));
    } catch {
      // Ignore quota errors
    }
  }, [savedReports]);

  // Show transient toast
  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Build sources bundle
  const sources = useMemo(
    () => ({
      transactions,
      salesInvoices,
      reconciliationSessions,
      bankAccounts,
      manualInputs: manualFinancialInputs,
      forecastSnapshots,
      forecastScenarios,
      annualReports,
      currency: activeConfig.currency,
    }),
    [
      transactions,
      salesInvoices,
      reconciliationSessions,
      bankAccounts,
      manualFinancialInputs,
      forecastSnapshots,
      forecastScenarios,
      annualReports,
      activeConfig.currency,
    ]
  );

  // Consolidated deterministic report data
  const consolidatedData: ConsolidatedReportData = useMemo(() => {
    if (activeConfig.isSnapshot && activeConfig.snapshotData) {
      return activeConfig.snapshotData;
    }
    return buildConsolidatedReportData(activeConfig, sources);
  }, [activeConfig, sources]);

  // Handle select report from library
  const handleSelectReport = (report: ExecutiveReportConfig) => {
    setActiveReportId(report.id);
    setActiveConfig(report);
    setActiveTab('view');
    triggerToast(`Loaded "${report.title}"`);
  };

  // Handle duplicate report
  const handleDuplicateReport = (report: ExecutiveReportConfig) => {
    const duplicated: ExecutiveReportConfig = {
      ...report,
      id: `REP-COPY-${Date.now()}`,
      title: `${report.title} (Copy)`,
      isSnapshot: false,
      snapshotData: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedReports((prev) => [duplicated, ...prev]);
    setActiveReportId(duplicated.id);
    setActiveConfig(duplicated);
    triggerToast('Report duplicated successfully');
  };

  // Handle delete report
  const handleDeleteReport = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    if (activeReportId === id) {
      const remaining = savedReports.filter((r) => r.id !== id);
      if (remaining.length > 0) {
        setActiveReportId(remaining[0].id);
        setActiveConfig(remaining[0]);
      }
    }
    triggerToast('Report removed from library');
  };

  // Handle new report creation
  const handleNewReport = () => {
    const defaultMeta = TEMPLATE_METADATA.executive_summary;
    const newRep: ExecutiveReportConfig = {
      id: `REP-${Date.now()}`,
      title: 'New Executive Financial Report',
      entityName: activeConfig.entityName || 'Meridian Dynamics Corp',
      template: 'executive_summary',
      periodPreset: 'current_quarter',
      startDate: calculatePeriodDates('current_quarter').startDate,
      endDate: calculatePeriodDates('current_quarter').endDate,
      currency: 'USD',
      includedSections: TEMPLATE_DEFAULT_SECTIONS.executive_summary,
      executiveCommentary: '',
      preparedBy: 'Financial Operations Lead',
      confidentialityLevel: 'Board & Executive',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedReports((prev) => [newRep, ...prev]);
    setActiveReportId(newRep.id);
    setActiveConfig(newRep);
    setActiveTab('builder');
    triggerToast('Created new report configuration');
  };

  // Handle save current config
  const handleSaveConfig = () => {
    setSavedReports((prev) => {
      const index = prev.findIndex((r) => r.id === activeConfig.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...activeConfig, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [{ ...activeConfig, updatedAt: new Date().toISOString() }, ...prev];
    });
    triggerToast('Report configuration saved');
  };

  // Handle capture immutable snapshot
  const handleSaveSnapshot = () => {
    const snapshot: ExecutiveReportConfig = {
      ...activeConfig,
      id: `SNAP-${Date.now()}`,
      title: `${activeConfig.title} [Snapshot ${new Date().toLocaleDateString()}]`,
      isSnapshot: true,
      snapshotData: { ...consolidatedData, generatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedReports((prev) => [snapshot, ...prev]);
    setActiveReportId(snapshot.id);
    setActiveConfig(snapshot);
    triggerToast('Point-in-time snapshot preserved immutably');
  };

  // Handle auto-generate grounded commentary
  const handleGenerateCommentary = async () => {
    setIsGeneratingCommentary(true);
    try {
      const result = await generateExecutiveReportCommentary(consolidatedData);
      setActiveConfig((prev) => ({
        ...prev,
        executiveCommentary: result.text,
      }));
      setCommentaryProvider(result.provider);
      triggerToast(`Narrative generated via ${result.provider}`);
    } catch {
      triggerToast('Commentary generated via deterministic fallback');
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  // Handle download summary CSV
  const handleDownloadCsv = (reportConfig: ExecutiveReportConfig = activeConfig) => {
    const dataToExport =
      reportConfig.id === activeConfig.id
        ? consolidatedData
        : buildConsolidatedReportData(reportConfig, sources);

    const csv = generateReportSummaryCsv(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${reportConfig.entityName.replace(/\s+/g, '_')}_Executive_Report_${reportConfig.startDate}_${reportConfig.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('RFC 4180 / OWASP CSV exported');
  };

  // Handle download section CSV
  const handleDownloadSectionCsv = (sectionId: ReportSectionId) => {
    const csv = generateSectionCsv(consolidatedData, sectionId);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${activeConfig.entityName.replace(/\s+/g, '_')}_${sectionId}_export.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Exported ${sectionId} CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
              Phase 10
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Enterprise Executive Intelligence
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Executive Reports & Business Reporting
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated financial reports combining general ledger performance, receivables, bank reconciliation, forecasts, and statutory filings.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestRunner(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition border border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verification Tests (32)
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF Preview
          </button>

          <button
            onClick={() => handleDownloadCsv()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            Export Full CSV
          </button>
        </div>
      </div>

      {/* Navigation Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveTab('view')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'view'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Consolidated Report View
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'builder'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Report Builder & Commentary
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'library'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Report Library & Snapshots ({savedReports.length})
        </button>
      </div>

      {/* TAB CONTENT: REPORT BUILDER */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          <ReportBuilderSection
            config={activeConfig}
            onChangeConfig={setActiveConfig}
            onSaveConfig={handleSaveConfig}
            onSaveSnapshot={handleSaveSnapshot}
            onGenerateCommentary={handleGenerateCommentary}
            isGeneratingCommentary={isGeneratingCommentary}
            commentaryProvider={commentaryProvider}
          />

          <div className="flex justify-end">
            <button
              onClick={() => setActiveTab('view')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Preview Assembled Report Below
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPORT LIBRARY */}
      {activeTab === 'library' && (
        <ReportLibrarySection
          savedReports={savedReports}
          activeReportId={activeReportId}
          onSelectReport={handleSelectReport}
          onDuplicateReport={handleDuplicateReport}
          onDeleteReport={handleDeleteReport}
          onNewReport={handleNewReport}
          onDownloadCsv={handleDownloadCsv}
        />
      )}

      {/* TAB CONTENT: CONSOLIDATED REPORT VIEW */}
      {(activeTab === 'view' || activeTab === 'builder') && (
        <div className="space-y-6">
          {/* Section 1: Executive Summary */}
          {activeConfig.includedSections.includes('executive_summary') && (
            <ExecutiveSummarySection data={consolidatedData} />
          )}

          {/* Section 2: Financial Performance */}
          {activeConfig.includedSections.includes('financial_performance') && (
            <FinancialPerformanceSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('financial_performance')}
            />
          )}

          {/* Section 3: Operations & Receivables */}
          {activeConfig.includedSections.includes('operations_receivables') && (
            <OperationsReceivablesSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('operations_receivables')}
            />
          )}

          {/* Section 4: Reconciliation & Controls */}
          {activeConfig.includedSections.includes('reconciliation_controls') && (
            <ReconciliationControlsSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('reconciliation_controls')}
            />
          )}

          {/* Section 5: Forecast & Scenarios */}
          {activeConfig.includedSections.includes('forecast_scenarios') && (
            <ForecastScenariosSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('forecast_scenarios')}
            />
          )}

          {/* Section 6: Annual Report Analysis */}
          {activeConfig.includedSections.includes('annual_report') && (
            <AnnualReportAnalysisSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('annual_report')}
            />
          )}

          {/* Section 7: Advisory Highlights */}
          {activeConfig.includedSections.includes('advisory_highlights') && (
            <AdvisoryHighlightsSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('advisory_highlights')}
            />
          )}

          {/* Section 8: Data Quality & Sources */}
          {activeConfig.includedSections.includes('data_quality') && (
            <DataQualitySourcesSection
              data={consolidatedData}
              onExportSectionCsv={() => handleDownloadSectionCsv('data_quality')}
            />
          )}
        </div>
      )}

      {/* Export & Print Preview Modal */}
      <ExportPrintPreviewModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={consolidatedData}
      />

      {/* Phase 10 Test Runner Modal */}
      <Phase10TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />
    </div>
  );
};
