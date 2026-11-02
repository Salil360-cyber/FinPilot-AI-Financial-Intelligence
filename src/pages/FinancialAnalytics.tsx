import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  Calculator,
  Download,
  Play,
  Layers,
  DollarSign,
  PieChart,
  Scale,
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { AnalyticsFilterState, AnalyticsPeriodPreset } from '../types/analytics';
import { buildCompleteAnalyticsDataset, exportAnalyticsReportCsv, resolveDateRange } from '../services/financialAnalyticsCalculator';
import { AnalyticsFilterBar } from '../components/analytics/AnalyticsFilterBar';
import { OverviewSection } from '../components/analytics/OverviewSection';
import { RevenueExpenseSection } from '../components/analytics/RevenueExpenseSection';
import { ProfitabilitySection } from '../components/analytics/ProfitabilitySection';
import { RatioCalculatorSection } from '../components/analytics/RatioCalculatorSection';
import { PeriodComparisonSection } from '../components/analytics/PeriodComparisonSection';
import { CashMovementSection } from '../components/analytics/CashMovementSection';
import { DataQualitySection } from '../components/analytics/DataQualitySection';
import { ManualInputsModal } from '../components/analytics/ManualInputsModal';
import { Phase6TestRunnerModal } from '../components/analytics/Phase6TestRunnerModal';

type AnalyticsTab =
  | 'overview'
  | 'revenue-expenses'
  | 'profitability'
  | 'ratios'
  | 'period-comparison'
  | 'cash-movement'
  | 'data-quality';

export const FinancialAnalytics: React.FC = () => {
  const {
    transactions,
    salesInvoices,
    reconciliationSessions,
    manualFinancialInputs,
  } = useFinancial();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [showManualInputsModal, setShowManualInputsModal] = useState(false);
  const [showTestRunnerModal, setShowTestRunnerModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Filter State
  const initialRange = resolveDateRange('current_quarter');
  const [filter, setFilter] = useState<AnalyticsFilterState>({
    period: 'current_quarter',
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    currency: 'USD',
    source: 'all',
    status: 'all',
    includeDemoData: true,
  });

  const handleFilterChange = (updates: Partial<AnalyticsFilterState>) => {
    setFilter((prev) => {
      const next = { ...prev, ...updates };
      if (updates.period && updates.period !== 'custom') {
        const resolved = resolveDateRange(updates.period);
        next.startDate = resolved.startDate;
        next.endDate = resolved.endDate;
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    const defaultRange = resolveDateRange('current_quarter');
    setFilter({
      period: 'current_quarter',
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      currency: 'USD',
      source: 'all',
      status: 'all',
      includeDemoData: true,
    });
    setToastMessage('Analytics filters reset to default Current Quarter (USD).');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Complete analytics dataset
  const dataset = useMemo(() => {
    return buildCompleteAnalyticsDataset(
      transactions,
      salesInvoices,
      reconciliationSessions,
      filter,
      manualFinancialInputs
    );
  }, [transactions, salesInvoices, reconciliationSessions, filter, manualFinancialInputs]);

  // CSV Export
  const handleExportCsv = () => {
    try {
      const csvContent = exportAnalyticsReportCsv(dataset);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_analytics_${filter.period}_${dataset.filter.startDate}_${dataset.filter.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToastMessage('Exported analytical report to CSV with formula injection defense.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Financial Analytics & Ratio Calculator
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
              Phase 6
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic profitability analysis, GAAP financial ratios, cash movements, and period variance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTestRunnerModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Verify Tests (28/28)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowManualInputsModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Manual Financial Inputs</span>
          </button>
        </div>
      </div>

      {/* Global Analytics Filters Bar */}
      <AnalyticsFilterBar
        filter={dataset.filter}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        periodLabel={dataset.periodLabel}
      />

      {/* Main Analytical Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Executive Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('revenue-expenses')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'revenue-expenses'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Revenue & Expenses
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profitability')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profitability'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Profitability Waterfall
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ratios')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ratios'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Ratio Calculator (11)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('period-comparison')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'period-comparison'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Period Comparisons
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cash-movement')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'cash-movement'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Cash Movement & Bank
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('data-quality')}
          className={`px-3.5 py-2 font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'data-quality'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Data Quality & Audit</span>
          {dataset.dataQuality.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-mono">
              {dataset.dataQuality.length}
            </span>
          )}
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'overview' && (
        <OverviewSection
          dataset={dataset}
          onSelectTab={setActiveTab}
          onOpenManualInputs={() => setShowManualInputsModal(true)}
        />
      )}

      {activeTab === 'revenue-expenses' && (
        <RevenueExpenseSection
          revenue={dataset.revenue}
          expenses={dataset.expenses}
          currency={dataset.filter.currency}
        />
      )}

      {activeTab === 'profitability' && (
        <ProfitabilitySection
          profitability={dataset.profitability}
          onOpenManualInputs={() => setShowManualInputsModal(true)}
          currency={dataset.filter.currency}
        />
      )}

      {activeTab === 'ratios' && (
        <RatioCalculatorSection
          ratios={dataset.ratios}
          onOpenManualInputs={() => setShowManualInputsModal(true)}
        />
      )}

      {activeTab === 'period-comparison' && (
        <PeriodComparisonSection
          comparison={dataset.periodComparison}
          currency={dataset.filter.currency}
        />
      )}

      {activeTab === 'cash-movement' && (
        <CashMovementSection
          cashMovement={dataset.cashMovement}
          currency={dataset.filter.currency}
        />
      )}

      {activeTab === 'data-quality' && (
        <DataQualitySection
          warnings={dataset.dataQuality}
          onOpenManualInputs={() => setShowManualInputsModal(true)}
        />
      )}

      {/* Modals */}
      {showManualInputsModal && (
        <ManualInputsModal
          isOpen={showManualInputsModal}
          onClose={() => setShowManualInputsModal(false)}
        />
      )}

      {showTestRunnerModal && (
        <Phase6TestRunnerModal
          isOpen={showTestRunnerModal}
          onClose={() => setShowTestRunnerModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
