import React from 'react';
import {
  Compass,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Download,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';

interface AdvisoryHighlightsSectionProps {
  data: ConsolidatedReportData;
  onExportSectionCsv: () => void;
}

export const AdvisoryHighlightsSection: React.FC<AdvisoryHighlightsSectionProps> = ({
  data,
  onExportSectionCsv,
}) => {
  const { advisoryHighlights } = data;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-950 text-red-400 border-red-800';
      case 'elevated':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'moderate':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-900/60 text-red-300 border-red-800';
      case 'high':
        return 'bg-amber-900/60 text-amber-300 border-amber-800';
      case 'medium':
        return 'bg-blue-900/60 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            Advisory Action Plan & Financial Risk Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evidence-grounded health indicators, risk score rating, and executive remediation priorities.
          </p>
        </div>

        <button
          onClick={onExportSectionCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Action Plan CSV
        </button>
      </div>

      {/* Risk Score & Health Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Score */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Composite Risk Score</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {advisoryHighlights.overallRiskScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <span
              className={`inline-block px-2 py-0.5 mt-2 rounded text-[10px] font-semibold uppercase tracking-wider border ${getRiskBadge(
                advisoryHighlights.riskLevel
              )}`}
            >
              {advisoryHighlights.riskLevel} Risk Profile
            </span>
          </div>

          <div className="p-3 rounded-full bg-slate-900 border border-slate-800">
            {advisoryHighlights.riskLevel === 'low' ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            )}
          </div>
        </div>

        {/* Health Signals Matrix */}
        <div className="md:col-span-2 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400 mb-2">Automated Financial Health Signals</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-center">
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {advisoryHighlights.healthSignalsSummary.strongCount}
              </div>
              <div className="text-[10px] text-emerald-300 font-medium mt-0.5">Optimal / Strong</div>
            </div>
            <div className="p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-lg text-center">
              <div className="text-lg font-bold text-amber-400 font-mono">
                {advisoryHighlights.healthSignalsSummary.warningCount}
              </div>
              <div className="text-[10px] text-amber-300 font-medium mt-0.5">Watch / Notice</div>
            </div>
            <div className="p-2.5 bg-red-950/20 border border-red-900/40 rounded-lg text-center">
              <div className="text-lg font-bold text-red-400 font-mono">
                {advisoryHighlights.healthSignalsSummary.criticalCount}
              </div>
              <div className="text-[10px] text-red-300 font-medium mt-0.5">Critical Attention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Prioritized Recommendations */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Top Prioritized Executive Action Items
        </h4>

        <div className="space-y-2.5">
          {advisoryHighlights.topRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">{rec.id}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getPriorityBadge(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">• {rec.category}</span>
                </div>
                <div className="text-xs font-medium text-white">{rec.title}</div>
                <div className="text-[11px] text-slate-400">{rec.estimatedImpact}</div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-cyan-400 font-medium">Ready for Execution</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
