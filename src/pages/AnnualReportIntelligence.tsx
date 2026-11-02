import React, { useState, useMemo } from 'react';
import { useFinancialContext } from '../context/FinancialContext';
import {
  FileSpreadsheet,
  Upload,
  BookOpen,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Eye,
  Layers,
  Printer,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import { FinancialLineItem, FinancialStatementType, ReportDocument } from '../types/annualReport';
import {
  calculateMultiYearComparison,
  calculateCorporateRatios,
  calculateDataQualityScore,
  generateReportCsvData,
  downloadCsvFile,
} from '../services/annualReportValidator';

import { ReportLibrarySection } from '../components/annualReport/ReportLibrarySection';
import { FinancialStatementsSection } from '../components/annualReport/FinancialStatementsSection';
import { MultiYearComparisonSection } from '../components/annualReport/MultiYearComparisonSection';
import { RatiosTrendsSection } from '../components/annualReport/RatiosTrendsSection';
import { NarrativeIntelligenceSection } from '../components/annualReport/NarrativeIntelligenceSection';
import { DataQualitySection } from '../components/annualReport/DataQualitySection';
import { DocumentReviewSection } from '../components/annualReport/DocumentReviewSection';
import { LineItemEditModal } from '../components/annualReport/LineItemEditModal';
import { UploadReportModal } from '../components/annualReport/UploadReportModal';
import { Phase8TestRunnerModal } from '../components/annualReport/Phase8TestRunnerModal';

type ActiveTab =
  | 'statements'
  | 'multi_year'
  | 'ratios'
  | 'narratives'
  | 'quality'
  | 'document'
  | 'library';

export const AnnualReportIntelligence: React.FC = () => {
  const {
    annualReports,
    activeReportId,
    setActiveReportId,
    saveAnnualReport,
    updateAnnualReport,
    deleteAnnualReport,
    resetAnnualReports,
  } = useFinancialContext();

  const [activeTab, setActiveTab] = useState<ActiveTab>('statements');
  const [editingItem, setEditingItem] = useState<FinancialLineItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);
  const [addingStatementType, setAddingStatementType] = useState<FinancialStatementType>('income_statement');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showTestRunnerModal, setShowTestRunnerModal] = useState<boolean>(false);

  // Active Report
  const currentReport: ReportDocument | undefined = useMemo(() => {
    return annualReports.find((r) => r.id === activeReportId) || annualReports[0];
  }, [annualReports, activeReportId]);

  // Baseline/Prior Year Report for Multi-Year comparison
  const priorReport: ReportDocument | null = useMemo(() => {
    if (!currentReport) return null;
    const curYearNum = typeof currentReport.fiscalYear === 'number' ? currentReport.fiscalYear : parseInt(String(currentReport.fiscalYear).replace(/\D/g, '')) || 2025;
    return annualReports.find((r) => {
      const yNum = typeof r.fiscalYear === 'number' ? r.fiscalYear : parseInt(String(r.fiscalYear).replace(/\D/g, '')) || 2024;
      return yNum === curYearNum - 1;
    }) || null;
  }, [annualReports, currentReport]);

  // Multi-Year Comparison Rows
  const comparisonRows = useMemo(() => {
    if (!currentReport || !priorReport) return [];
    return calculateMultiYearComparison(currentReport, priorReport);
  }, [currentReport, priorReport]);

  // Corporate Ratios
  const ratios = useMemo(() => {
    if (!currentReport) return [];
    return calculateCorporateRatios(currentReport);
  }, [currentReport]);

  // Data Quality Summary
  const qualitySummary = useMemo(() => {
    if (!currentReport) return null;
    return calculateDataQualityScore(currentReport);
  }, [currentReport]);

  // Handlers
  const handleSaveLineItem = (updatedItem: FinancialLineItem) => {
    if (!currentReport) return;
    const exists = currentReport.lineItems.some((i) => i.id === updatedItem.id);
    let updatedLineItems: FinancialLineItem[];

    if (exists) {
      updatedLineItems = currentReport.lineItems.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    } else {
      updatedLineItems = [...currentReport.lineItems, updatedItem];
    }

    updateAnnualReport({
      ...currentReport,
      lineItems: updatedLineItems,
    });
  };

  const handleAddNewItem = (type: FinancialStatementType) => {
    setAddingStatementType(type);
    setIsAddingItem(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!currentReport) return;
    const csvContent = generateReportCsvData(currentReport, priorReport, comparisonRows);
    const compName = currentReport.companyName || currentReport.entityName || 'Company';
    const filename = `${compName.replace(/\s+/g, '_')}_FY${currentReport.fiscalYear}_Financial_Analysis.csv`;
    downloadCsvFile(filename, csvContent);
  };

  if (!currentReport) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
        <FileSpreadsheet className="w-12 h-12 text-amber-500/40 mx-auto" />
        <h3 className="text-lg font-semibold text-slate-100">No Annual Reports Loaded</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload an SEC 10-K filing or reload the audited demonstration filings for Meridian Dynamics Corp.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={resetAnnualReports}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Load Audited Demo Filings</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Annual Report Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
              PHASE 8
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic SEC Form 10-K parsing, balance sheet equation audits, multi-year delta analysis, and corporate ratios
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Filing Selector */}
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currentReport.id}
              onChange={(e) => setActiveReportId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {annualReports.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                  {r.companyName} (FY{r.fiscalYear})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowTestRunnerModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 text-xs font-medium rounded-lg border border-slate-800 transition cursor-pointer"
            title="Execute 28 verification tests and regression safety suite"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Run 28 Tests</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition cursor-pointer"
            title="Download complete financial analysis as sanitized CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition cursor-pointer"
            title="Print or save as PDF report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload 10-K / Filing</span>
          </button>
        </div>
      </div>

      {/* Active Filing Identity & Audit Status Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-100">{currentReport.companyName}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                {currentReport.filingType} • FY{currentReport.fiscalYear}
              </span>
              {currentReport.cik && (
                <span className="text-[10px] text-slate-400 font-mono">
                  SEC CIK: {currentReport.cik}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Period Ended: <span className="text-slate-200">{currentReport.periodEnded}</span> • Auditor:{' '}
              <span className="text-slate-200">{currentReport.auditorName || 'Deloitte & Touche LLP'}</span> (
              <span className="text-emerald-400 font-semibold">{currentReport.auditOpinion || 'Unqualified Clean Opinion'}</span>)
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Reporting Scale</div>
            <div className="text-xs font-mono font-semibold text-amber-300 uppercase">
              {currentReport.currency} in {currentReport.reportingScale}
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-800" />

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Balance Sheet Check</div>
            <div
              className={`text-xs font-mono font-semibold flex items-center space-x-1 justify-end ${
                (currentReport.validationResult?.balanceSheetBalances ?? true) ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {(currentReport.validationResult?.balanceSheetBalances ?? true) ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Balanced ($0 Variance)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Variance Detected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('statements')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'statements'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Financial Statements</span>
        </button>

        <button
          onClick={() => setActiveTab('multi_year')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'multi_year'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Multi-Year Comparison</span>
        </button>

        <button
          onClick={() => setActiveTab('ratios')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'ratios'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Financial Ratios</span>
        </button>

        <button
          onClick={() => setActiveTab('narratives')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'narratives'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Narrative Disclosures</span>
        </button>

        <button
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'quality'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Data Quality & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('document')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'document'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Document Review</span>
        </button>

        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-2 ${
            activeTab === 'library'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Filing Library ({annualReports.length})</span>
        </button>
      </div>

      {/* Main Tab Viewports */}
      <div className="pt-2">
        {activeTab === 'statements' && (
          <FinancialStatementsSection
            report={currentReport}
            onEditItem={(item) => setEditingItem(item)}
            onAddItem={handleAddNewItem}
          />
        )}

        {activeTab === 'multi_year' && (
          <MultiYearComparisonSection
            currentReport={currentReport}
            priorReport={priorReport}
            comparisonRows={comparisonRows}
          />
        )}

        {activeTab === 'ratios' && (
          <RatiosTrendsSection report={currentReport} ratios={ratios} />
        )}

        {activeTab === 'narratives' && (
          <NarrativeIntelligenceSection report={currentReport} />
        )}

        {activeTab === 'quality' && qualitySummary && (
          <DataQualitySection report={currentReport} qualitySummary={qualitySummary} />
        )}

        {activeTab === 'document' && (
          <DocumentReviewSection report={currentReport} />
        )}

        {activeTab === 'library' && (
          <ReportLibrarySection
            reports={annualReports}
            activeReportId={activeReportId}
            onSelectReport={(id) => setActiveReportId(id)}
            onDeleteReport={(id) => deleteAnnualReport(id)}
            onResetDemo={resetAnnualReports}
            onOpenUpload={() => setShowUploadModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      {/* 1. Line Item Edit Modal */}
      {(editingItem || isAddingItem) && (
        <LineItemEditModal
          isOpen={true}
          item={editingItem}
          onClose={() => {
            setEditingItem(null);
            setIsAddingItem(false);
          }}
          onSave={handleSaveLineItem}
        />
      )}

      {/* 2. PDF Upload Modal */}
      {showUploadModal && (
        <UploadReportModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onReportImported={(newReport) => {
            saveAnnualReport(newReport);
            setActiveTab('statements');
          }}
        />
      )}

      {/* 3. Phase 8 Test Runner Modal */}
      {showTestRunnerModal && (
        <Phase8TestRunnerModal
          isOpen={showTestRunnerModal}
          onClose={() => setShowTestRunnerModal(false)}
        />
      )}
    </div>
  );
};
