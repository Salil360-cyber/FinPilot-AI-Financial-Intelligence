import React from 'react';
import { Building2, Calendar, CheckCircle2, AlertTriangle, Trash2, RotateCcw, Plus, Layers } from 'lucide-react';
import { ReportDocument } from '../../types/annualReport';

interface ReportLibrarySectionProps {
  reports: ReportDocument[];
  activeReportId: string | null;
  onSelectReport: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onResetDemo: () => void;
  onOpenUpload: () => void;
}

export const ReportLibrarySection: React.FC<ReportLibrarySectionProps> = ({
  reports,
  activeReportId,
  onSelectReport,
  onDeleteReport,
  onResetDemo,
  onOpenUpload,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Filing Documents Library</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Annual reports, Form 10-Ks, and verified multi-year audited financial disclosures
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onResetDemo}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
            title="Reload audited FY2025 and FY2024 Meridian Dynamics filings"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Import Filing PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const isActive = report.id === activeReportId;
          const isBalanced = report.validationResult?.balanceSheetBalances ?? true;
          const verifiedCount = report.lineItems.filter((i) => i.isVerified).length;
          const totalItems = report.lineItems.length;

          return (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`relative p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{report.companyName}</h4>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {report.filingType} • FY{report.fiscalYear}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Active
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">CIK Code</span>
                    <span className="text-slate-300 font-mono text-[11px]">{report.cik || 'N/A (Local)'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Currency / Scale</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {report.currency} • {report.reportingScale}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Extracted Items</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {verifiedCount}/{totalItems} verified
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Balance Sheet Eq</span>
                    <span
                      className={`text-[11px] font-semibold flex items-center space-x-1 ${
                        isBalanced ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isBalanced ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Balanced</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Diff: ${Math.abs((report.validationResult?.balanceSheetDiscrepancy ?? 0)).toLocaleString()}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Period: {report.periodEnded}</span>
                </span>
                <div className="flex items-center space-x-2">
                  {reports.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete report for ${report.companyName} (FY${report.fiscalYear})?`)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                      title="Delete Filing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
