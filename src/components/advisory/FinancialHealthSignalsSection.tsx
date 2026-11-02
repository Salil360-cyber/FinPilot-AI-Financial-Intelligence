import React from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { AdvisoryHealthSignal } from '../../types/advisory';

interface FinancialHealthSignalsSectionProps {
  signals: AdvisoryHealthSignal[];
  onSelectSignalDomain?: (domain: string) => void;
}

export const FinancialHealthSignalsSection: React.FC<FinancialHealthSignalsSectionProps> = ({
  signals,
  onSelectSignalDomain,
}) => {
  if (signals.length === 0) {
    return (
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        No active health signals currently evaluated. Record invoices or general ledger transactions to populate signals.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Financial Health & Stability Signals ({signals.length})
          </h2>
        </div>
        <span className="text-[11px] text-slate-500">
          Deterministic mathematical health checks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {signals.map((sig) => {
          let statusBadge = (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Healthy
            </span>
          );
          if (sig.status === 'critical') {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldAlert className="w-3 h-3" /> Critical
              </span>
            );
          } else if (sig.status === 'watch') {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3" /> Watch
              </span>
            );
          } else if (sig.status === 'neutral') {
            statusBadge = (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                <Info className="w-3 h-3" /> Neutral
              </span>
            );
          }

          let trendIcon = <Minus className="w-3 h-3 text-slate-500" />;
          if (sig.trend === 'improving') {
            trendIcon = <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />;
          } else if (sig.trend === 'deteriorating') {
            trendIcon = <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />;
          }

          return (
            <div
              key={sig.id}
              className="bg-[#121929] border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wide">
                    {sig.domain}
                  </span>
                  {statusBadge}
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {sig.indicator}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-amber-400 font-mono">
                      {sig.valueDisplay}
                    </span>
                    {trendIcon}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {sig.evidence}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[10px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Benchmark/Prior:</span>
                  <span className="text-slate-300 font-mono">{sig.benchmarkOrPriorDisplay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Provenance:</span>
                  <span className="text-amber-400/80 capitalize font-mono">
                    {sig.provenance.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
