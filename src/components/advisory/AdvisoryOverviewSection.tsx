import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Search,
  Filter,
  Info,
  Layers,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { AdvisoryCategory, AdvisorySeverity, DataProvenance, AdvisoryInsight, AdvisoryHealthSignal } from '../../types/advisory';
import { AiCommentaryResult } from '../../services/geminiAdvisoryService';

interface AdvisoryOverviewSectionProps {
  summary: {
    totalInsights: number;
    highPriorityCount: number;
    attentionRequiredCount: number;
    monitorCount: number;
    informationalCount: number;
    overallHealthStatus: 'healthy' | 'neutral' | 'watch' | 'critical';
  };
  aiCommentary: AiCommentaryResult | null;
  activeCategory: 'all' | AdvisoryCategory;
  onSelectCategory: (cat: 'all' | AdvisoryCategory) => void;
  activeSeverity: 'all' | AdvisorySeverity;
  onSelectSeverity: (sev: 'all' | AdvisorySeverity) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const AdvisoryOverviewSection: React.FC<AdvisoryOverviewSectionProps> = ({
  summary,
  aiCommentary,
  activeCategory,
  onSelectCategory,
  activeSeverity,
  onSelectSeverity,
  searchQuery,
  onSearchChange,
}) => {
  const categories: { id: 'all' | AdvisoryCategory; label: string }[] = [
    { id: 'all', label: 'All Domains' },
    { id: 'revenue_profitability', label: 'Revenue & Profit' },
    { id: 'cash_receivables', label: 'Cash & Receivables' },
    { id: 'expense_efficiency', label: 'Expense Efficiency' },
    { id: 'customer_concentration', label: 'Customer Exposure' },
    { id: 'forecast_scenarios', label: 'Forecast Signals' },
    { id: 'capital_health', label: 'Capital Health' },
  ];

  return (
    <div className="space-y-4">
      {/* Safety & Compliance Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Decision-Support Notice:</strong> FinPilot AI provides deterministic financial analysis and operational decision support. It does not provide regulated audit assurance, legal, tax, or investment advice, nor does it guarantee future outcomes. Recommendations require human management evaluation.
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Health Status */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Financial Posture</span>
            {summary.overallHealthStatus === 'healthy' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : summary.overallHealthStatus === 'critical' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-lg font-bold text-white capitalize flex items-center gap-2">
            <span>{summary.overallHealthStatus}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                summary.overallHealthStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : summary.overallHealthStatus === 'critical'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {summary.overallHealthStatus === 'healthy' ? 'Stable' : 'Review Required'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Based on evaluated health indicators</p>
        </div>

        {/* High Priority Alerts */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>High Priority Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white">{summary.highPriorityCount}</div>
          <p className="text-[11px] text-slate-500">Exceeding critical threshold limits</p>
        </div>

        {/* Attention Required */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Attention Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">{summary.attentionRequiredCount}</div>
          <p className="text-[11px] text-slate-500">Areas requiring proactive monitoring</p>
        </div>

        {/* Total Traceable Insights */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Traceable Findings</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{summary.totalInsights}</div>
          <p className="text-[11px] text-slate-500">Linked to General Ledger & Invoices</p>
        </div>
      </div>

      {/* AI Grounded Commentary Card */}
      {aiCommentary && (
        <div className="bg-gradient-to-r from-slate-900/90 to-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-500/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Executive Management Commentary
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {aiCommentary.provider === 'gemini-3.8-flash'
                  ? 'AI Synthesized (Gemini 3.8 Flash Grounded)'
                  : 'Deterministic Expert Heuristics'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {aiCommentary.groundedFactsCount} Facts Grounded
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {aiCommentary.executiveSummary}
          </p>

          {aiCommentary.bulletedObservations.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Key Operational Observations:
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                {aiCommentary.bulletedObservations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    <span className="text-amber-400 shrink-0 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiCommentary.suggestedFollowUpQuestions.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-indigo-500/10">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Suggested Management Inquiry Questions:
              </h4>
              <div className="flex flex-wrap gap-2">
                {aiCommentary.suggestedFollowUpQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                activeCategory === cat.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input & Severity quick filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search findings & evidence..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#121929] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>

          <select
            value={activeSeverity}
            onChange={(e) => onSelectSeverity(e.target.value as any)}
            className="bg-[#121929] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden focus:border-amber-500/50"
          >
            <option value="all">All Severities</option>
            <option value="high_priority">High Priority</option>
            <option value="attention_required">Attention Required</option>
            <option value="monitor">Monitor</option>
            <option value="informational">Informational</option>
          </select>
        </div>
      </div>
    </div>
  );
};
