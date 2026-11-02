import React from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { DEMO_INSIGHTS } from '../../data/demoData';

export const DemoInsights: React.FC = () => {
  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Financial Advisory Observations
          </h3>
        </div>
        <span className="text-[11px] font-mono text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
          DEMO INSIGHTS
        </span>
      </div>

      <div className="bg-slate-900/50 border border-slate-800/60 rounded-lg p-2.5 my-3 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          These sample insights are generated from static rules applied to the currently displayed demo figures. They illustrate how executive summaries and variance alerts will appear once deterministic analysis rules and language models are integrated.
        </p>
      </div>

      <div className="space-y-3 mt-4">
        {DEMO_INSIGHTS.map((insight) => (
          <div
            key={insight.id}
            className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-lg hover:border-slate-700/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                {insight.impact === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : insight.impact === 'positive' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                )}
                <h4 className="text-xs font-semibold text-slate-200">
                  {insight.title}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                {insight.metric}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              {insight.summary}
            </p>

            <div className="text-[11px] text-amber-300/80 bg-amber-500/5 border border-amber-500/10 rounded px-2.5 py-1 font-mono">
              <span className="font-semibold text-amber-400">Recommendation: </span>
              {insight.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
