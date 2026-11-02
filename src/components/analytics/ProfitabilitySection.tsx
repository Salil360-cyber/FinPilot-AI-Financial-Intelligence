import React from 'react';
import { DollarSign, ShieldAlert, ArrowDown, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';
import { ProfitabilitySummary } from '../../types/analytics';

interface ProfitabilitySectionProps {
  profitability: ProfitabilitySummary;
  onOpenManualInputs: () => void;
  currency: string;
}

export const ProfitabilitySection: React.FC<ProfitabilitySectionProps> = ({
  profitability,
  onOpenManualInputs,
  currency,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Profitability & Operating Margin Waterfall</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict formulas: Gross Profit = Rev − COGS; Operating Profit = Gross Profit − OpEx; Net Profit = Revenue − Total Expenses
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenManualInputs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <span>Configure COGS & Taxes</span>
        </button>
      </div>

      {/* Accounting Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Accounting Methodology: </strong>
          {profitability.profitabilityClassificationNotice}
        </div>
      </div>

      {/* Waterfall Steps Container */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
          Multi-Step Income Statement Waterfall
        </h3>

        {/* Step 1: Revenue */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider">
              1. Top-Line Invoiced Sales
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Gross Recorded Revenue</div>
            <p className="text-[11px] text-slate-400">Sum of all approved customer sales invoices</p>
          </div>
          <div className="text-right font-mono">
            <div className="text-xl font-bold text-emerald-400">
              ${profitability.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">100.0% of Sales</span>
          </div>
        </div>

        {/* Step 2: Cost of Goods Sold */}
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 font-mono font-bold uppercase tracking-wider">
              2. Cost of Goods Sold (COGS)
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Direct Production & Delivery Costs</div>
            <p className="text-[11px] text-slate-400">
              {profitability.isCogsAvailable ? 'Direct production costs entered via balance sheet inputs' : 'Not tracked in active ledger'}
            </p>
          </div>
          <div className="text-right font-mono">
            <div className="text-lg font-bold text-rose-400">
              {profitability.costOfGoodsSold !== null ? `-$${profitability.costOfGoodsSold.toLocaleString()}` : 'Unavailable'}
            </div>
            <span className="text-[10px] text-slate-400">
              {profitability.costOfGoodsSold !== null && profitability.revenue > 0
                ? `${((profitability.costOfGoodsSold / profitability.revenue) * 100).toFixed(1)}% of Sales`
                : 'Input required'}
            </span>
          </div>
        </div>

        {/* Step 3: Gross Profit */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-400 font-mono font-bold uppercase tracking-wider">
              3. Gross Profit
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">Gross Margin Before Operating Overhead</div>
            <p className="text-[11px] text-slate-400">Revenue minus Cost of Goods Sold</p>
          </div>
          <div className="text-right font-mono">
            <div className="text-xl font-bold text-sky-400">
              {profitability.grossProfit !== null ? `$${profitability.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Unavailable'}
            </div>
            <span className="text-[10px] text-slate-400">
              {profitability.grossProfitMarginPercent !== null ? `${profitability.grossProfitMarginPercent.toFixed(1)}% Gross Margin` : 'COGS required'}
            </span>
          </div>
        </div>

        {/* Step 4: Operating Expenses */}
        <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 font-mono font-bold uppercase tracking-wider">
              4. Operating Expenses (OpEx)
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-0.5">SG&A, Cloud, Personnel & Facilities</div>
            <p className="text-[11px] text-slate-400">Active posted debits from General Ledger</p>
          </div>
          <div className="text-right font-mono">
            <div className="text-lg font-bold text-rose-400">
              -${profitability.operatingExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">
              {profitability.revenue > 0
                ? `${((profitability.operatingExpenses / profitability.revenue) * 100).toFixed(1)}% of Sales`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Step 5: Operating Profit (EBIT) & Net Profit */}
        <div className="p-5 bg-emerald-950/20 border border-emerald-800/50 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-wider">
              5. Net Operating Profit
            </div>
            <div className="text-base font-bold text-white mt-0.5">Operational Net Income</div>
            <p className="text-[11px] text-slate-400">Retained earnings after all operating outflows</p>
          </div>
          <div className="text-right font-mono">
            <div className="text-2xl font-bold text-emerald-400">
              ${profitability.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-300 font-semibold">
              {profitability.netProfitMarginPercent.toFixed(1)}% Net Margin
            </span>
          </div>
        </div>
      </div>

      {/* Efficiency Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-mono text-slate-400">Revenue-to-Expense Efficiency</span>
          <div className="text-2xl font-bold font-mono text-white">
            {profitability.revenueToExpenseRatio !== null ? `${profitability.revenueToExpenseRatio.toFixed(2)}x` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400">
            For every $1.00 spent on operations, the business generates ${profitability.revenueToExpenseRatio?.toFixed(2) || '0.00'} in revenue.
          </p>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] uppercase font-mono text-slate-400">Operating Margin Benchmark</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {profitability.operatingProfitMarginPercent !== null ? `${profitability.operatingProfitMarginPercent.toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400">
            Target benchmark: &gt;20.0%. Measures pricing strength and administrative leverage.
          </p>
        </div>
      </div>
    </div>
  );
};
