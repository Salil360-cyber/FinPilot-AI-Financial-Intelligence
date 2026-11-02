import React from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ConsolidatedReportData } from '../../types/executiveReport';
import { formatCurrency } from '../../services/currencyFormatter';

interface ExecutiveSummarySectionProps {
  data: ConsolidatedReportData;
}

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({ data }) => {
  const { config, summaryKpis, commentaryResult } = data;
  const curr = summaryKpis.currency;

  const isProfitable = summaryKpis.netOperatingIncome >= 0;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6 shadow-sm">
      {/* Report Header Metadata */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-blue-950 text-blue-300 border border-blue-800">
              Executive Briefing
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {config.confidentialityLevel}
            </span>
            {config.isSnapshot && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                Point-in-Time Snapshot
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{config.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1 text-slate-300">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              {config.entityName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Period: <span className="font-mono text-slate-300">{config.startDate} to {config.endDate}</span>
            </span>
            <span>•</span>
            <span>Prepared by: <span className="text-slate-300">{config.preparedBy}</span></span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>Report Timestamp:</div>
          <div className="font-mono text-slate-300">{new Date(data.generatedAt).toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-slate-500">Standard: US GAAP / Management Accounting</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          I. Consolidated Executive Financial Indicators
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Revenue */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">
              {curr} {summaryKpis.totalRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Historical Actuals (GL)
            </div>
          </div>

          {/* OpEx */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Operating Expenses</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">
              {curr} {summaryKpis.totalExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Posted General Ledger
            </div>
          </div>

          {/* Net Operating Income & Margin */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Net Income (EBIT)</span>
              <TrendingUp className={`w-3.5 h-3.5 ${isProfitable ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
            <div className={`text-base font-bold font-mono ${isProfitable ? 'text-blue-400' : 'text-red-400'}`}>
              {formatCurrency(summaryKpis.netOperatingIncome, curr)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Margin: <span className="text-white font-medium">{summaryKpis.operatingMarginPercent}%</span>
            </div>
          </div>

          {/* Cash & Equivalents */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Cash & Liquidity</span>
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatCurrency(summaryKpis.cashAndEquivalents, curr)}
            </div>
            <div className="text-[10px] text-cyan-400 mt-1">Manual Balance Sheet Input</div>
          </div>

          {/* Outstanding Receivables */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Receivables (AR)</span>
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">
              {curr} {summaryKpis.outstandingReceivables.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Billed Open Invoices
            </div>
          </div>

          {/* Bank Match Rate */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium">Bank Match Rate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white font-mono">
              {summaryKpis.reconciliationMatchRate}%
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">Internal Controls</div>
          </div>
        </div>
      </div>

      {/* Executive Commentary Narrative */}
      <div className="p-5 bg-slate-950/50 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Management Narrative Briefing
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            {commentaryResult?.provider ? `Layer: ${commentaryResult.provider}` : 'Grounded Financial Review'}
          </span>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-3 whitespace-pre-line">
          {config.executiveCommentary || (commentaryResult?.text) || (
            'No executive commentary provided. Click "Auto-Generate Commentary" in the Report Builder to synthesize an evidence-grounded management briefing.'
          )}
        </div>
      </div>
    </div>
  );
};
