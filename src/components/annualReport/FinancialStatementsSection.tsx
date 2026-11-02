import React, { useState } from 'react';
import { FinancialStatementType, ReportDocument, FinancialLineItem } from '../../types/annualReport';
import { formatScaledCurrency } from '../../services/annualReportValidator';
import { CheckCircle2, AlertCircle, Edit3, Plus, Scale, ShieldCheck } from 'lucide-react';

interface FinancialStatementsSectionProps {
  report: ReportDocument;
  onEditItem: (item: FinancialLineItem) => void;
  onAddItem: (type: FinancialStatementType) => void;
}

export const FinancialStatementsSection: React.FC<FinancialStatementsSectionProps> = ({
  report,
  onEditItem,
  onAddItem,
}) => {
  const [selectedStatement, setSelectedStatement] = useState<FinancialStatementType>('income_statement');

  const statementTabs: { id: FinancialStatementType; label: string; count: number }[] = [
    {
      id: 'income_statement',
      label: 'Income Statement',
      count: report.lineItems.filter((i) => i.statementType === 'income_statement').length,
    },
    {
      id: 'balance_sheet',
      label: 'Balance Sheet',
      count: report.lineItems.filter((i) => i.statementType === 'balance_sheet').length,
    },
    {
      id: 'cash_flow',
      label: 'Cash Flow Statement',
      count: report.lineItems.filter((i) => i.statementType === 'cash_flow').length,
    },
  ];

  const currentItems = report.lineItems.filter((item) => item.statementType === selectedStatement);
  const categories = Array.from(new Set(currentItems.map((i) => i.category || 'General')));

  const valRes = report.validationResult || {
    balanceSheetBalances: true,
    balanceSheetDiscrepancy: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    grossProfitReconciles: true,
    operatingIncomeReconciles: true,
    cashFlowReconciles: true,
    missingLineItems: [],
    scaleConsistencyWarning: null,
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {statementTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatement(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
                selectedStatement === tab.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Filing Scale:</span>
            <span className="font-semibold text-slate-200 uppercase">{report.reportingScale}</span>
          </div>

          <button
            onClick={() => onAddItem(selectedStatement)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Balance Sheet Verification Banner */}
      {selectedStatement === 'balance_sheet' && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            valRes.balanceSheetBalances
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            {valRes.balanceSheetBalances ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {valRes.balanceSheetBalances
                  ? 'Accounting Identity Confirmed: Assets = Liabilities + Stockholders’ Equity'
                  : 'Reconciliation Discrepancy Detected'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Assets: ${formatScaledCurrency(valRes.totalAssets, report.reportingScale)} •
                Liabilities: ${formatScaledCurrency(valRes.totalLiabilities, report.reportingScale)} •
                Equity: ${formatScaledCurrency(valRes.totalEquity, report.reportingScale)}
              </div>
            </div>
          </div>
          <div className="font-mono text-xs font-semibold">
            {valRes.balanceSheetBalances
              ? 'Variance: $0.00'
              : `Variance: ${report.currency} ${formatScaledCurrency(
                  valRes.balanceSheetDiscrepancy,
                  report.reportingScale
                )}`}
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Financial Line Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Raw Value ({report.reportingScale})</th>
                <th className="px-4 py-3 text-right">Standardized USD</th>
                <th className="px-4 py-3 text-center">Filing Page</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-center">Audit Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No line items extracted for this financial statement. Click "Add Item" to record line items manually.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const itemsInCat = currentItems.filter((i) => (i.category || 'General') === cat);
                  return (
                    <React.Fragment key={cat}>
                      <tr className="bg-slate-950/40">
                        <td colSpan={8} className="px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {cat}
                        </td>
                      </tr>
                      {itemsInCat.map((item) => {
                        const rawVal = item.value ?? item.extractedValue ?? 0;
                        const normVal = item.normalizedValue ?? item.normalizedNumericValue ?? (rawVal * 1000000);
                        const conf = item.confidence ?? (item.status === 'verified' || item.isVerified ? 1.0 : 0.85);
                        const isVer = item.isVerified ?? (item.status === 'verified');

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition group">
                            <td className="px-5 py-3 font-medium text-slate-200">
                              <div className="flex items-center space-x-2">
                                <span>{item.standardLabel || item.originalLabel}</span>
                                {item.rawLabel && item.rawLabel !== (item.standardLabel || item.originalLabel) && (
                                  <span className="text-[10px] text-slate-500 font-mono italic" title="Raw filing line label">
                                    ({item.rawLabel})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{item.category || 'General'}</td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-slate-200">
                              {rawVal < 0 ? (
                                <span className="text-rose-400">({Math.abs(rawVal).toLocaleString()})</span>
                              ) : (
                                <span>{rawVal.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-300">
                              ${formatScaledCurrency(normVal, 'units')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                                p. {item.pageNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                  conf >= 0.9
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : conf >= 0.7
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}
                              >
                                {(conf * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isVer ? (
                                <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-medium">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-slate-500 text-[11px]">
                                  <span>Candidate</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => onEditItem(item)}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 ml-auto"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
