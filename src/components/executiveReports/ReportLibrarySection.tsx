import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Trash2,
  Download,
  Calendar,
  Shield,
  Layers,
  Sparkles,
  Camera,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import {
  ExecutiveReportConfig,
  TEMPLATE_METADATA,
} from '../../types/executiveReport';

interface ReportLibrarySectionProps {
  savedReports: ExecutiveReportConfig[];
  activeReportId: string | null;
  onSelectReport: (report: ExecutiveReportConfig) => void;
  onDuplicateReport: (report: ExecutiveReportConfig) => void;
  onDeleteReport: (id: string) => void;
  onNewReport: () => void;
  onDownloadCsv: (report: ExecutiveReportConfig) => void;
}

export const ReportLibrarySection: React.FC<ReportLibrarySectionProps> = ({
  savedReports,
  activeReportId,
  onSelectReport,
  onDuplicateReport,
  onDeleteReport,
  onNewReport,
  onDownloadCsv,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getConfidentialityBadge = (level: string) => {
    switch (level) {
      case 'Board & Executive':
        return 'bg-purple-900/40 text-purple-300 border-purple-800';
      case 'Confidential':
        return 'bg-amber-900/40 text-amber-300 border-amber-800';
      case 'Public Filing Extract':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Report Library & Saved Snapshots
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage reusable executive reporting templates and immutable point-in-time snapshots.
          </p>
        </div>
        <button
          onClick={onNewReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Create New Report
        </button>
      </div>

      {savedReports.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/40">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">No Saved Reports Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Build your first executive financial report using the builder below or select a standard template.
          </p>
          <button
            onClick={onNewReport}
            className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Configure First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedReports.map((report) => {
            const isSelected = report.id === activeReportId;
            const meta = TEMPLATE_METADATA[report.template] || TEMPLATE_METADATA.custom;

            return (
              <div
                key={report.id}
                className={`relative p-4 rounded-xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                        report.isSnapshot
                          ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                          : 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                      }`}
                    >
                      {report.isSnapshot ? (
                        <span className="flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" /> SNAPSHOT
                        </span>
                      ) : (
                        meta.badge
                      )}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getConfidentialityBadge(
                        report.confidentialityLevel
                      )}`}
                    >
                      <Shield className="w-2.5 h-2.5 mr-1" />
                      {report.confidentialityLevel}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white mt-2.5 line-clamp-1">
                    {report.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {report.entityName}
                  </p>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Period: <span className="text-slate-300 font-mono">{report.startDate} to {report.endDate}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{report.includedSections.length} sections included • {report.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1">
                  <button
                    onClick={() => onSelectReport(report)}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition text-center"
                  >
                    {isSelected ? 'Active in View' : 'Load Report'}
                  </button>

                  <button
                    title="Export CSV"
                    onClick={() => onDownloadCsv(report)}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    title="Duplicate Configuration"
                    onClick={() => onDuplicateReport(report)}
                    className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === report.id ? (
                    <div className="flex items-center gap-1 bg-red-950/80 p-0.5 rounded border border-red-800">
                      <button
                        onClick={() => {
                          onDeleteReport(report.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded font-bold hover:bg-red-500"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      title="Delete Report"
                      onClick={() => setDeleteConfirmId(report.id)}
                      className="p-1.5 bg-slate-800/80 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
