import React from 'react';
import { ShieldCheck, AlertTriangle, Info, AlertOctagon, ArrowRight } from 'lucide-react';
import { DataQualityWarning } from '../../types/analytics';

interface DataQualitySectionProps {
  warnings: DataQualityWarning[];
  onOpenManualInputs: () => void;
}

export const DataQualitySection: React.FC<DataQualitySectionProps> = ({
  warnings,
  onOpenManualInputs,
}) => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Data Quality, Coverage & Audit Diagnostics</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Surfaces incomplete records, excluded items, and unverified data points affecting analytical precision
        </p>
      </div>

      {/* Warnings List */}
      <div className="space-y-3">
        {warnings.length > 0 ? (
          warnings.map((w) => {
            const isWarning = w.severity === 'warning';
            const isError = w.severity === 'error';

            return (
              <div
                key={w.id}
                className={`p-4 rounded-xl border transition-colors space-y-2 text-xs ${
                  isError
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-800/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isError ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200 text-xs">{w.title}</span>
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      isError
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : isWarning
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {w.category}
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {w.description}
                </p>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 italic">
                    Action: {w.actionableStep}
                  </span>

                  {w.id === 'dq-missing-balance-sheet' && (
                    <button
                      type="button"
                      onClick={onOpenManualInputs}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold text-xs"
                    >
                      <span>Supply Inputs</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#121929] border border-slate-800 rounded-xl">
            All active financial records meet comprehensive classification standards.
          </div>
        )}
      </div>
    </div>
  );
};
