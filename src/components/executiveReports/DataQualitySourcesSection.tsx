import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Database,
  ExternalLink,
  Download,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface DataQualitySourcesSectionProps {
  data: ConsolidatedReportData;
  onNavigateSection?: (module: string) => void;
  onExportSectionCsv: () => void;
}

export const DataQualitySourcesSection: React.FC<DataQualitySourcesSectionProps> = ({
  data,
  onNavigateSection,
  onExportSectionCsv,
}) => {
  const { provenance, qualityWarnings } = data;

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'alert':
        return 'bg-red-950/50 border-red-800 text-red-200';
      case 'warning':
        return 'bg-amber-950/50 border-amber-800 text-amber-200';
      default:
        return 'bg-blue-950/50 border-blue-800 text-blue-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />;
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            Data Quality, Audit Provenance & Source Traceability
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown across 8 financial data tiers, verification assurances, and integrity warnings.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Provenance CSV
        </button>
      </div>

      {/* Quality Warnings Callouts */}
      {qualityWarnings.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Integrity & Calculation Warnings ({qualityWarnings.length})
          </h4>
          <div className="space-y-2">
            {qualityWarnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${getLevelStyle(w.level)}`}
              >
                {getLevelIcon(w.level)}
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold flex items-center gap-2">
                    <span>{w.title}</span>
                    <span className="font-mono text-[10px] opacity-75">[{w.code}]</span>
                  </div>
                  <div className="opacity-90 leading-relaxed">{w.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance Accounting Table */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Multi-Source Provenance Accounting (8 Financial Tiers)
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Data Classification Tier</th>
                <th className="py-2.5 px-3 text-center">Record Count</th>
                <th className="py-2.5 px-3">Source Module</th>
                <th className="py-2.5 px-3">Audit / Verification Status</th>
                <th className="py-2.5 px-3">Methodology & Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
              {provenance.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition">
                  <td className="py-2.5 px-3 font-medium text-white">
                    {p.categoryLabel}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {p.recordCount}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    {p.sourceModule}
                  </td>
                  <td className="py-2.5 px-3">
                    {p.isAuditedOrVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Ledger
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <Info className="w-3.5 h-3.5" />
                        Calculated / Estimated
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {p.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
