import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Sliders,
  Users,
  BarChart2,
  ShieldAlert,
  Calendar,
  BrainCircuit,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import {
  ForecastMetricType,
  ForecastMethodConfig,
  ForecastSnapshot,
  ScenarioDefinition,
} from '../types/forecast';
import {
  prepareHistoricalData,
  runForecastEngine,
  calculateScenarioSummaries,
  analyzeCustomerConcentration,
  runBacktestEvaluation,
  evaluateForecastRisks,
  exportForecastToCsv,
  DEFAULT_SCENARIOS,
} from '../services/revenueForecastEngine';
import { ForecastControlsBar } from '../components/forecast/ForecastControlsBar';
import { ForecastOverviewCards } from '../components/forecast/ForecastOverviewCards';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { HistoricalDataSection } from '../components/forecast/HistoricalDataSection';
import { MethodAssumptionsSection } from '../components/forecast/MethodAssumptionsSection';
import { ScenarioPlanningSection } from '../components/forecast/ScenarioPlanningSection';
import { CustomerConcentrationSection } from '../components/forecast/CustomerConcentrationSection';
import { BacktestingSection } from '../components/forecast/BacktestingSection';
import { RiskIndicatorsSection } from '../components/forecast/RiskIndicatorsSection';
import { SnapshotManagerModal } from '../components/forecast/SnapshotManagerModal';
import { Phase7TestRunnerModal } from '../components/forecast/Phase7TestRunnerModal';

type WorkspaceTab =
  | 'scenarios'
  | 'historical'
  | 'method'
  | 'concentration'
  | 'backtesting'
  | 'risks';

export const RevenueForecast: React.FC = () => {
  const {
    salesInvoices,
    transactions,
    forecastSnapshots,
    saveForecastSnapshot,
    deleteForecastSnapshot,
    forecastScenarios,
    updateForecastScenario,
    resetForecastScenarios,
    addForecastScenario,
    deleteForecastScenario,
  } = useFinancial();

  // Workspace configuration state
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetricType>('issued_sales');
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [methodConfig, setMethodConfig] = useState<ForecastMethodConfig>({
    method: 'moving_average',
    movingAverageWindow: 3,
    weightedWeights: [1, 2, 3],
  });
  const [currency, setCurrency] = useState<string>('USD');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'demo'>('all');
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('scenarios');

  // Modals
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);

  // 1. Prepare Historical Monthly Series
  const historicalSummary = useMemo(() => {
    return prepareHistoricalData(salesInvoices, transactions, selectedMetric, currency, sourceFilter);
  }, [salesInvoices, transactions, selectedMetric, currency, sourceFilter]);

  // 2. Execute Deterministic Forecast Engine
  const runResult = useMemo(() => {
    return runForecastEngine(historicalSummary, horizonMonths, methodConfig, forecastScenarios);
  }, [historicalSummary, horizonMonths, methodConfig, forecastScenarios]);

  // 3. Compute Scenario Planning Summaries
  const scenarioSummaries = useMemo(() => {
    return calculateScenarioSummaries(runResult, forecastScenarios);
  }, [runResult, forecastScenarios]);

  // 4. Analyze Customer Concentration
  const concentrationAnalysis = useMemo(() => {
    return analyzeCustomerConcentration(salesInvoices, currency);
  }, [salesInvoices, currency]);

  // 5. Run Backtesting Evaluations
  const backtestSummary = useMemo(() => {
    return runBacktestEvaluation(historicalSummary, 2);
  }, [historicalSummary]);

  // 6. Evaluate Risk Indicators
  const riskIndicators = useMemo(() => {
    return evaluateForecastRisks(historicalSummary, runResult, concentrationAnalysis);
  }, [historicalSummary, runResult, concentrationAnalysis]);

  // Handle Export CSV
  const handleExportCsv = () => {
    const csvContent = exportForecastToCsv(runResult, scenarioSummaries);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinPilot-Forecast-${runResult.forecastId}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Print Report
  const handlePrint = () => {
    window.print();
  };

  // Load Saved Snapshot
  const handleLoadSnapshot = (snapshot: ForecastSnapshot) => {
    setSelectedMetric(snapshot.metric);
    setHorizonMonths(snapshot.horizonMonths);
    setCurrency(snapshot.currency);
    setMethodConfig({
      method: snapshot.method,
      movingAverageWindow: 3,
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Revenue Forecast & Scenario Planning
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase">
              Phase 7 Complete
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical financial projections, mathematical least-squares regression, uncertainty ranges, and sensitivity models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Global Controls Bar */}
      <ForecastControlsBar
        selectedMetric={selectedMetric}
        onMetricChange={setSelectedMetric}
        horizonMonths={horizonMonths}
        onHorizonChange={setHorizonMonths}
        methodConfig={methodConfig}
        onMethodConfigChange={setMethodConfig}
        currency={currency}
        onCurrencyChange={setCurrency}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onOpenSnapshotModal={() => setIsSnapshotModalOpen(true)}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        onExportCsv={handleExportCsv}
        onPrintReport={handlePrint}
      />

      {/* Executive Overview Cards */}
      <ForecastOverviewCards runResult={runResult} />

      {/* Responsive Interactive SVG Forecast Chart */}
      <ForecastChart
        runResult={runResult}
        scenarios={scenarioSummaries}
        currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
      />

      {/* Navigation Tabs for Deep-Dive Sections */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#121929] border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'scenarios'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Scenario Planning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historical')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'historical'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Historical Baseline ({historicalSummary.validPeriodsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('method')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'method'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Method & Assumptions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concentration')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'concentration'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Concentration</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backtesting')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'backtesting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Accuracy & Backtesting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'risks'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Risk Flags ({riskIndicators.length})</span>
          </button>
        </div>

        {/* Tab 1: Scenario Planning */}
        {activeTab === 'scenarios' && (
          <ScenarioPlanningSection
            scenarios={forecastScenarios}
            scenarioSummaries={scenarioSummaries}
            runResult={runResult}
            onUpdateScenario={updateForecastScenario}
            onAddScenario={addForecastScenario}
            onDeleteScenario={deleteForecastScenario}
            onResetScenarios={resetForecastScenarios}
            currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
          />
        )}

        {/* Tab 2: Historical Baseline */}
        {activeTab === 'historical' && (
          <HistoricalDataSection
            summary={historicalSummary}
            currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
          />
        )}

        {/* Tab 3: Method & Assumptions */}
        {activeTab === 'method' && <MethodAssumptionsSection runResult={runResult} />}

        {/* Tab 4: Customer Concentration */}
        {activeTab === 'concentration' && (
          <CustomerConcentrationSection
            concentration={concentrationAnalysis}
            currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
          />
        )}

        {/* Tab 5: Backtesting */}
        {activeTab === 'backtesting' && (
          <BacktestingSection
            backtestSummary={backtestSummary}
            currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
          />
        )}

        {/* Tab 6: Risk Indicators */}
        {activeTab === 'risks' && <RiskIndicatorsSection risks={riskIndicators} />}
      </div>

      {/* Snapshot Manager Modal */}
      <SnapshotManagerModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        snapshots={forecastSnapshots}
        onSaveSnapshot={saveForecastSnapshot}
        onDeleteSnapshot={deleteForecastSnapshot}
        onLoadSnapshot={handleLoadSnapshot}
        currentRunResult={runResult}
        currentScenarios={forecastScenarios}
        currencySymbol={currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
      />

      {/* Phase 7 Test Runner Modal */}
      <Phase7TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
};
