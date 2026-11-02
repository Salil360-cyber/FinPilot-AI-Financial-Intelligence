import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
  CheckCircle,
} from 'lucide-react';
import { ForecastRiskIndicator } from '../../types/forecast';

interface RiskIndicatorsSectionProps {
  risks: ForecastRiskIndicator[];
}

export const RiskIndicatorsSection: React.FC<RiskIndicatorsSectionProps> = ({ risks }) => {
  const getSeverityBadge = (severity: ForecastRiskIndicator['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'high':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'low':
      default:
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Empirical Forecast Risk Indicators
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic vulnerability assessments grounded in observable data patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Total Flags: </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-white font-bold">
            {risks.length}
          </span>
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-xs text-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No critical forecast risk indicators detected. Baseline observations satisfy continuity criteria.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {risks.map((risk) => (
            <div
              key={risk.id}
              className="p-4 bg-[#0b101b] border border-slate-800 rounded-lg space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  {risk.title}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${getSeverityBadge(
                    risk.severity
                  )}`}
                >
                  {risk.severity}
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">{risk.description}</p>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Condition:</span>
                  <span className="text-slate-200">{risk.observedCondition}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Supporting:</span>
                  <span className="text-slate-200 truncate max-w-[200px]" title={risk.supportingData}>
                    {risk.supportingData}
                  </span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-amber-300/80 italic font-sans">
                Notice: {risk.qualification}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
