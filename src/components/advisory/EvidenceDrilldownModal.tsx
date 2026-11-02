import React from 'react';
import {
  X,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Calendar,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { AdvisoryInsight } from '../../types/advisory';

interface EvidenceDrilldownModalProps {
  insight: AdvisoryInsight | null;
  onClose: () => void;
}

export const EvidenceDrilldownModal: React.FC<EvidenceDrilldownModalProps> = ({
  insight,
  onClose,
}) => {
  if (!insight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Evidence & Calculation Drill-Down
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Finding ID: {insight.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Finding Title & Badges */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {insight.category.replace('_', ' & ')}
              </span>
              <span
                className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                  insight.severity === 'high_priority'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : insight.severity === 'attention_required'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}
              >
                {insight.severity.replace('_', ' ')}
              </span>
              <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Provenance: {insight.provenance.replace('_', ' ')}
              </span>
              {insight.isDemoData && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  DEMO DATA WARNING
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">
              {insight.title}
            </h4>
            <p className="text-slate-300 mt-1.5 leading-relaxed">
              {insight.explanation}
            </p>
          </div>

          {/* Mathematical Formula Box */}
          {insight.calculationFormula && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide font-mono">
                Applied Calculation Formula:
              </span>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-amber-300 text-xs">
                {insight.calculationFormula}
              </div>
            </div>
          )}

          {/* Source Data Tokens Table */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide font-mono">
              Traceable Input Values & Provenance:
            </span>
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950/60 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2">Metric Label</th>
                    <th className="px-3 py-2">Reported / Extracted Value</th>
                    <th className="px-3 py-2">Period</th>
                    <th className="px-3 py-2">Data Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {insight.sourceValues.length > 0 ? (
                    insight.sourceValues.map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-medium text-slate-200">{v.label}</td>
                        <td className="px-3 py-2 font-mono text-amber-400 font-semibold">{v.formattedValue}</td>
                        <td className="px-3 py-2 font-mono text-slate-400">{v.period || 'Current'}</td>
                        <td className="px-3 py-2 font-mono text-[10px] capitalize text-slate-400">
                          {v.provenance.replace('_', ' ')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                        No distinct source tokens reported.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Known Limitations */}
          {insight.knownLimitations.length > 0 && (
            <div className="space-y-1 bg-slate-900/40 border border-slate-800/80 rounded-lg p-3 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Analytical Limitations & Assumptions:
              </span>
              <ul className="space-y-1 text-slate-400 mt-1">
                {insight.knownLimitations.map((lim, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Next Action */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wide font-mono">
              Recommended Next Action:
            </span>
            <p className="text-slate-200 leading-relaxed">
              {insight.suggestedNextAction}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Reporting Periods: {insight.reportingPeriods.join(', ')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
