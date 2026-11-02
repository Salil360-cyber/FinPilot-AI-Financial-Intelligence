import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { KpiMetric } from '../../types/finance';

interface KpiCardProps {
  metric: KpiMetric;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({ metric, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 hover:border-slate-700 transition-all duration-150 cursor-pointer group shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          {metric.label}
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {metric.timeframe}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <span className="text-2xl md:text-3xl font-semibold text-white tracking-tight tabular-nums font-mono">
          {metric.value}
        </span>
        {Boolean(metric.change) && (
          <div
            className={`flex items-center gap-1 text-xs font-medium tabular-nums ${
              metric.changeType === 'positive'
                ? 'text-emerald-400'
                : metric.changeType === 'negative'
                ? 'text-rose-400'
                : 'text-amber-400'
            }`}
          >
            {metric.changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5" />}
            {metric.changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5" />}
            {metric.changeType === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{metric.change}</span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 truncate pt-2 border-t border-slate-800/60">
        {metric.subtext}
      </div>
    </div>
  );
};
