import React from 'react';
import { MultiYearComparisonRow, ReportDocument } from '../../types/annualReport';
import { formatScaledCurrency, generateReportCsvData, downloadCsvFile } from '../../services/annualReportValidator';
import { ArrowUpRight, ArrowDownRight, Minus, Download, TrendingUp, Info } from 'lucide-react';

interface MultiYearComparisonSectionProps {
  currentReport: ReportDocument;
  priorReport: ReportDocument | null;
  comparisonRows: MultiYearComparisonRow[];
}

export const MultiYearComparisonSection: React.FC<MultiYearComparisonSectionProps> = ({
  currentReport,
  priorReport,
  comparisonRows,
}) => {
  const handleExportCsv = () => {
    const csvContent = generateReportCsvData(currentReport, priorReport, comparisonRows);
    const compName = currentReport.companyName || currentReport.entityName || 'Company';
    const filename = `${compName.replace(/\s+/g, '_')}_FY${currentReport.fiscalYear}_vs_FY${
      priorReport ? priorReport.fiscalYear : 'Prior'
    }_Financial_Comparison.csv`;
    downloadCsvFile(filename, csvContent);
  };

  if (!priorReport) {
    return (
      <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-4">
        <TrendingUp className="w-12 h-12 text-amber-500/40 mx-auto" />
        <h4 className="text-base font-semibold text-slate-200">No Prior Year Filing Loaded for Comparison</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Multi-year comparison requires at least two filings. Select another report from the filing library or upload a prior year Form 10-K to calculate period-over-period variance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>Multi-Year Financial Statement Variance Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing <span className="text-amber-400 font-semibold">FY{currentReport.fiscalYear}</span> against baseline <span className="text-slate-300 font-semibold">FY{priorReport.fiscalYear}</span>
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Export Multi-Year CSV (RFC 4180)</span>
        </button>
      </div>

      {/* Formula & Policy Note */}
      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Mathematical Specification:</span> Dollar Variance = <span className="font-mono text-slate-100">Current - Prior</span>. Percentage Delta = <span className="font-mono text-slate-100">((Current - Prior) / |Prior|) × 100</span>.
          When the prior year value is zero, the percentage change is mathematically undefined and denoted as <span className="font-mono text-amber-300">N/A (Base Zero)</span> rather than generating an illegal divide-by-zero error.
        </div>
      </div>

      {/* Variance Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Financial Metric</th>
                <th className="px-4 py-3">Statement Type</th>
                <th className="px-4 py-3 text-right">FY{priorReport.fiscalYear} (Prior)</th>
                <th className="px-4 py-3 text-right">FY{currentReport.fiscalYear} (Current)</th>
                <th className="px-4 py-3 text-right">Dollar Variance ($)</th>
                <th className="px-4 py-3 text-right">Percentage Change (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {comparisonRows.map((row) => {
                const isPositive = (row.dollarChange || 0) > 0;
                const isNegative = (row.dollarChange || 0) < 0;

                return (
                  <tr key={row.key} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3 font-medium text-slate-200">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {row.statementType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      ${formatScaledCurrency(row.priorValue, currentReport.reportingScale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-100">
                      ${formatScaledCurrency(row.currentValue, currentReport.reportingScale)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span
                        className={`inline-flex items-center space-x-1 font-semibold ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}${formatScaledCurrency(row.dollarChange, currentReport.reportingScale)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.isUndefinedPercentage ? (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-semibold" title={row.notes}>
                          N/A (Base Zero)
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center space-x-1 font-semibold ${
                            (row.percentageChange || 0) > 0
                              ? 'text-emerald-400'
                              : (row.percentageChange || 0) < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {(row.percentageChange || 0) > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (row.percentageChange || 0) < 0 ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {(row.percentageChange || 0) > 0 ? '+' : ''}
                            {row.percentageChange?.toFixed(2)}%
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
