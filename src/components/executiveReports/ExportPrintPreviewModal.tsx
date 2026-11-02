import React from 'react';
import {
  X,
  Printer,
  Download,
  Building,
  Calendar,
  Shield,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';
import {
  generateReportSummaryCsv,
  generateSectionCsv,
} from '../../services/executiveReportEngine';

interface ExportPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ConsolidatedReportData;
}

export const ExportPrintPreviewModal: React.FC<ExportPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen) return null;

  const { config, summaryKpis, performance, operationsReceivables, reconciliationControls, forecastScenarios, advisoryHighlights } = data;
  const curr = summaryKpis.currency;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSummaryCsv = () => {
    const csv = generateReportSummaryCsv(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${config.entityName.replace(/\s+/g, '_')}_Executive_Report_${config.startDate}_${config.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Modal Top Action Bar - Hidden in Print */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Executive Report — Print & Export Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>

            <button
              onClick={handleDownloadSummaryCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV (OWASP Safe)
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-200 print:text-black print:overflow-visible print:p-6 print:bg-white">
          {/* Header Cover Banner */}
          <div className="border-b-2 border-slate-700 print:border-black pb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 print:text-black">
                  FINPILOT AI • EXECUTIVE REPORTING SYSTEM
                </span>
                <h1 className="text-2xl font-bold text-white print:text-black mt-1">
                  {config.title}
                </h1>
                <div className="text-xs text-slate-400 print:text-slate-700 mt-1 flex items-center gap-2">
                  <span className="font-semibold text-slate-300 print:text-black">{config.entityName}</span>
                  <span>•</span>
                  <span>Period: {config.startDate} to {config.endDate}</span>
                  <span>•</span>
                  <span>Currency: {config.currency}</span>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400 print:text-slate-700 space-y-0.5">
                <div className="font-semibold text-white print:text-black uppercase tracking-wider text-[11px]">
                  {config.confidentialityLevel}
                </div>
                <div>Prepared By: {config.preparedBy}</div>
                <div>Date: {new Date(data.generatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          {/* Core Scorecards Summary */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-800 mb-2">
              1. Executive Financial Key Indicators
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Total Revenue</div>
                <div className="text-xs font-bold font-mono mt-0.5">{curr} {summaryKpis.totalRevenue.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Operating Expenses</div>
                <div className="text-xs font-bold font-mono mt-0.5">{curr} {summaryKpis.totalExpenses.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Net Operating Income</div>
                <div className="text-xs font-bold font-mono mt-0.5">{curr} {summaryKpis.netOperatingIncome.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Operating Margin</div>
                <div className="text-xs font-bold font-mono mt-0.5">{summaryKpis.operatingMarginPercent}%</div>
              </div>
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Cash Reserves</div>
                <div className="text-xs font-bold font-mono mt-0.5">{curr} {summaryKpis.cashAndEquivalents.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-950/70 print:bg-slate-100 rounded-lg border border-slate-800 print:border-slate-300">
                <div className="text-[10px] text-slate-400 print:text-slate-600">Bank Match Rate</div>
                <div className="text-xs font-bold font-mono mt-0.5">{summaryKpis.reconciliationMatchRate}%</div>
              </div>
            </div>
          </div>

          {/* Narrative Briefing */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-800 mb-2">
              2. Management Narrative Briefing
            </h2>
            <div className="p-4 bg-slate-950/40 print:bg-slate-50 rounded-lg border border-slate-800 print:border-slate-300 text-xs leading-relaxed whitespace-pre-line">
              {config.executiveCommentary || data.commentaryResult?.text}
            </div>
          </div>

          {/* Performance & Category Breakdown */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-slate-800 mb-2">
              3. Financial Performance Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/40 print:bg-slate-50 rounded-lg border border-slate-800 print:border-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-300 print:text-black">Top Expense Outflows</div>
                {performance.topExpenseCategories.slice(0, 4).map((c) => (
                  <div key={c.category} className="flex justify-between text-[11px]">
                    <span className="text-slate-400 print:text-slate-700">{c.category}</span>
                    <span className="font-mono font-medium">{curr} {c.amount.toLocaleString()} ({c.percentage}%)</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-950/40 print:bg-slate-50 rounded-lg border border-slate-800 print:border-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-300 print:text-black">Receivables Ageing Schedule</div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-700">Current (Not Overdue)</span>
                  <span className="font-mono">{curr} {operationsReceivables.ageingBuckets.current.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-700">1 - 30 Days Past Due</span>
                  <span className="font-mono">{curr} {operationsReceivables.ageingBuckets.days1to30.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-700">31 - 60 Days Past Due</span>
                  <span className="font-mono">{curr} {operationsReceivables.ageingBuckets.days31to60.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 print:text-slate-700">60+ Days Past Due</span>
                  <span className="font-mono text-amber-400 print:text-amber-800 font-bold">
                    {curr} {(operationsReceivables.ageingBuckets.days61to90 + operationsReceivables.ageingBuckets.days90Plus).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Verification Footer */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-[10px] text-slate-500 print:text-slate-600 flex justify-between items-center">
            <div>
              Certified Internal Financial Management Document • FinPilot AI v10.0 • OWASP Formula Protected
            </div>
            <div className="font-mono">
              Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
