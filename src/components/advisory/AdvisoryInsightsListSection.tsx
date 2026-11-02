import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  ChevronRight,
  Calculator,
  ExternalLink,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AdvisoryInsight, AdvisorySeverity } from '../../types/advisory';

interface AdvisoryInsightsListSectionProps {
  insights: AdvisoryInsight[];
  onOpenDrilldown: (insight: AdvisoryInsight) => void;
}

export const AdvisoryInsightsListSection: React.FC<AdvisoryInsightsListSectionProps> = ({
  insights,
  onOpenDrilldown,
}) => {
  if (insights.length === 0) {
    return (
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-8 text-center space-y-2">
        <p className="text-sm font-semibold text-slate-300">No Advisory Insights Found</p>
        <p className="text-xs text-slate-500">
          No active financial alerts match the selected domain or search filter. All tracked metrics are within normal bounds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          Advisory Findings & Diagnostic Evidence ({insights.length})
        </h2>
        <span className="text-[11px] text-slate-500">
          Click any card to inspect calculation formulas & source tokens
        </span>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight) => {
          let severityBadge = (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Informational
            </span>
          );
          let borderAccent = 'border-slate-800';

          if (insight.severity === 'high_priority') {
            severityBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-3 h-3" /> High Priority
              </span>
            );
            borderAccent = 'border-rose-500/30 hover:border-rose-500/50';
          } else if (insight.severity === 'attention_required') {
            severityBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" /> Attention Required
              </span>
            );
            borderAccent = 'border-amber-500/30 hover:border-amber-500/50';
          } else if (insight.severity === 'monitor') {
            severityBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Info className="w-3 h-3" /> Monitor
              </span>
            );
            borderAccent = 'border-blue-500/30 hover:border-blue-500/50';
          }

          return (
            <div
              key={insight.id}
              onClick={() => onOpenDrilldown(insight)}
              className={`bg-[#121929] border ${borderAccent} rounded-xl p-4 transition-all cursor-pointer hover:bg-slate-900/60 space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {severityBadge}
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/80">
                    {insight.category.replace('_', ' & ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Source: {insight.sourceModule.replace('_', ' ')}
                  </span>
                  {insight.isDemoData && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400/90 border border-amber-400/20">
                      DEMO DATA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <span>Inspect Evidence</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {insight.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {insight.explanation}
                </p>
              </div>

              {/* Evidence Bar */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono flex items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-2 shrink-0">
                  <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Evidence:</span>
                </div>
                <div className="text-slate-200 truncate">
                  {insight.evidenceSummary}
                </div>
              </div>

              {/* Action Preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-slate-500">Suggested Action:</span>
                  <span className="text-slate-300 font-medium truncate">{insight.suggestedNextAction}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-slate-500">
                  <span className="capitalize">{insight.provenance.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{insight.reportingPeriods.join(', ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
