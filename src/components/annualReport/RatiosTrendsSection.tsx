import React from 'react';
import { AnnualReportRatio, ReportDocument } from '../../types/annualReport';
import { ShieldCheck, AlertCircle, BarChart3 } from 'lucide-react';

interface RatiosTrendsSectionProps {
  report: ReportDocument;
  ratios: AnnualReportRatio[];
}

export const RatiosTrendsSection: React.FC<RatiosTrendsSectionProps> = ({
  report,
  ratios,
}) => {
  const categoryGroups = [
    { id: 'profitability', name: 'Profitability & Margin Ratios', description: 'Measures earnings efficiency against revenues and capital.' },
    { id: 'liquidity', name: 'Liquidity Ratios', description: 'Evaluates short-term debt obligation servicing capacity.' },
    { id: 'solvency', name: 'Solvency & Leverage Ratios', description: 'Assesses long-term capital structure and financial leverage risk.' },
    { id: 'efficiency', name: 'Operational Efficiency Ratios', description: 'Quantifies balance sheet asset turnover and productivity.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <span>Financial Ratio Calculator & Audit Benchmarks</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Calculated deterministically from verified FY{report.fiscalYear} line items for {report.companyName}
        </p>
      </div>

      <div className="space-y-6">
        {categoryGroups.map((group) => {
          const groupRatios = ratios.filter((r) => r.category === group.id);
          if (groupRatios.length === 0) return null;

          return (
            <div key={group.id} className="space-y-3">
              <div className="border-b border-slate-800 pb-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">{group.name}</h4>
                <p className="text-[11px] text-slate-400">{group.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupRatios.map((ratio) => {
                  const isNull = ratio.value === null;
                  const isHealthy = ratio.isHealthy;

                  return (
                    <div
                      key={ratio.name}
                      className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">{ratio.name}</span>
                          <span
                            className={'px-2 py-0.5 rounded text-[10px] font-semibold flex items-center space-x-1 ' + (
                              isNull
                                ? 'bg-slate-800 text-slate-400'
                                : isHealthy
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            )}
                          >
                            {isNull ? (
                              <span>Undefined</span>
                            ) : isHealthy ? (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                <span>Optimal</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>Caution</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline space-x-2">
                          <span className="text-2xl font-bold font-mono text-slate-100">
                            {isNull || ratio.value === null || ratio.value === undefined
                              ? 'N/A'
                              : ratio.unit === '%'
                              ? `${ratio.value.toFixed(2)}%`
                              : `${ratio.value.toFixed(2)}x`}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Target: {ratio.benchmark}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="text-slate-400 font-mono text-[10px]">
                          Formula: <span className="text-slate-300">{ratio.formula}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">
                          {ratio.interpretation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
