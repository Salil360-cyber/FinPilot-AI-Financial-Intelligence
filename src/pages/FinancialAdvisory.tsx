import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  SlidersHorizontal,
  History,
  Download,
  Printer,
  Sparkles,
  PlayCircle,
  ShieldCheck,
  CheckSquare,
  Sliders,
  Layers,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Building,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import {
  AdvisoryInsight,
  AdvisoryHealthSignal,
  AdvisoryRecommendation,
  AdvisoryThresholds,
  DEFAULT_ADVISORY_THRESHOLDS,
  AdvisoryCategory,
  AdvisorySeverity,
  AdvisorySnapshot,
  ActionStatus,
  AdvisoryScenarioComparisonResult,
} from '../types/advisory';
import {
  runAdvisoryEngine,
  exportAdvisoryInsightsCsv,
  exportRecommendationsCsv,
  exportScenarioComparisonCsv,
} from '../services/financialAdvisoryEngine';
import {
  generateGroundedAdvisoryCommentary,
  AiCommentaryResult,
} from '../services/geminiAdvisoryService';
import { AdvisoryHeader } from '../components/advisory/AdvisoryHeader';
import { AdvisoryOverviewSection } from '../components/advisory/AdvisoryOverviewSection';
import { FinancialHealthSignalsSection } from '../components/advisory/FinancialHealthSignalsSection';
import { AdvisoryInsightsListSection } from '../components/advisory/AdvisoryInsightsListSection';
import { RecommendedActionsSection } from '../components/advisory/RecommendedActionsSection';
import { ScenarioWhatIfSection } from '../components/advisory/ScenarioWhatIfSection';
import { EvidenceDrilldownModal } from '../components/advisory/EvidenceDrilldownModal';
import { ThresholdConfigModal } from '../components/advisory/ThresholdConfigModal';
import { AdvisoryHistoryModal } from '../components/advisory/AdvisoryHistoryModal';
import { Phase9TestRunnerModal } from '../components/advisory/Phase9TestRunnerModal';

const THRESHOLDS_STORAGE_KEY = 'finpilot_advisory_thresholds_v9';
const ACTIONS_STORAGE_KEY = 'finpilot_advisory_actions_v9';
const SNAPSHOTS_STORAGE_KEY = 'finpilot_advisory_snapshots_v9';

export const FinancialAdvisory: React.FC = () => {
  const {
    transactions,
    salesInvoices,
    manualFinancialInputs,
    forecastSnapshots,
    annualReports,
  } = useFinancial();

  // Active currency
  const currency = 'USD';

  // Local state: Thresholds
  const [thresholds, setThresholds] = useState<AdvisoryThresholds>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_ADVISORY_THRESHOLDS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_ADVISORY_THRESHOLDS;
  });

  // Local state: Action Board Overrides (status & notes)
  const [actionOverrides, setActionOverrides] = useState<Record<string, { status: ActionStatus; notes?: string }>>(() => {
    try {
      const saved = localStorage.getItem(ACTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Local state: Snapshots
  const [snapshots, setSnapshots] = useState<AdvisorySnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Active Navigation Tab
  type AdvisoryTab = 'overview' | 'actions' | 'scenarios';
  const [activeTab, setActiveTab] = useState<AdvisoryTab>('overview');

  // Filters & Search
  const [activeCategory, setActiveCategory] = useState<'all' | AdvisoryCategory>('all');
  const [activeSeverity, setActiveSeverity] = useState<'all' | AdvisorySeverity>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isThresholdsOpen, setIsThresholdsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState<boolean>(false);
  const [drilldownInsight, setDrilldownInsight] = useState<AdvisoryInsight | null>(null);

  // AI Commentary state
  const [aiCommentary, setAiCommentary] = useState<AiCommentaryResult | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Forecast active result if any
  const latestForecast = useMemo(() => {
    if (forecastSnapshots && forecastSnapshots.length > 0) {
      return forecastSnapshots[forecastSnapshots.length - 1].runResult;
    }
    return null;
  }, [forecastSnapshots]);

  // Run Deterministic Advisory Engine
  const engineResult = useMemo(() => {
    return runAdvisoryEngine({
      transactions,
      salesInvoices,
      manualInputs: manualFinancialInputs,
      forecastResult: latestForecast,
      annualReports,
      currency,
      thresholds,
      includeDemoData: true,
    });
  }, [transactions, salesInvoices, manualFinancialInputs, latestForecast, annualReports, currency, thresholds]);

  // Merge Recommendations with Local Action Overrides
  const mergedRecommendations = useMemo(() => {
    return engineResult.recommendations.map((rec) => {
      const override = actionOverrides[rec.id];
      if (override) {
        return {
          ...rec,
          status: override.status || rec.status,
          userNotes: override.notes !== undefined ? override.notes : rec.userNotes,
        };
      }
      return rec;
    });
  }, [engineResult.recommendations, actionOverrides]);

  // Initial and on-demand AI Commentary generation
  useEffect(() => {
    let isMounted = true;
    setIsAiGenerating(true);

    generateGroundedAdvisoryCommentary(
      engineResult.insights,
      engineResult.healthSignals,
      mergedRecommendations,
      currency
    ).then((result) => {
      if (isMounted) {
        setAiCommentary(result);
        setIsAiGenerating(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [engineResult.insights.length, thresholds]);

  const handleRegenerateAi = async () => {
    setIsAiGenerating(true);
    const result = await generateGroundedAdvisoryCommentary(
      engineResult.insights,
      engineResult.healthSignals,
      mergedRecommendations,
      currency
    );
    setAiCommentary(result);
    setIsAiGenerating(false);
  };

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    return engineResult.insights.filter((ins) => {
      if (activeCategory !== 'all' && ins.category !== activeCategory) return false;
      if (activeSeverity !== 'all' && ins.severity !== activeSeverity) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ins.title.toLowerCase().includes(q);
        const matchesExp = ins.explanation.toLowerCase().includes(q);
        const matchesEv = ins.evidenceSummary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesExp && !matchesEv) return false;
      }
      return true;
    });
  }, [engineResult.insights, activeCategory, activeSeverity, searchQuery]);

  // Handlers for Action Board
  const handleUpdateActionStatus = (recId: string, newStatus: ActionStatus) => {
    setActionOverrides((prev) => {
      const current = prev[recId] || {};
      const updated = { ...prev, [recId]: { ...current, status: newStatus } };
      try {
        localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  };

  const handleUpdateActionNotes = (recId: string, notes: string) => {
    setActionOverrides((prev) => {
      const current = prev[recId] || { status: 'suggested' };
      const updated = { ...prev, [recId]: { ...current, notes } };
      try {
        localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  };

  // Save Thresholds
  const handleSaveThresholds = (newThresholds: AdvisoryThresholds) => {
    setThresholds(newThresholds);
    try {
      localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(newThresholds));
    } catch {
      // storage quota fallback
    }
  };

  // Save Snapshot
  const handleSaveSnapshot = () => {
    const newSnapshot: AdvisorySnapshot = {
      id: `snap-${Date.now()}`,
      title: `Advisory Snapshot (${new Date().toLocaleDateString()})`,
      asOfDate: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toISOString(),
      currency,
      totalInsights: engineResult.insights.length,
      insightsCountBySeverity: {
        high_priority: engineResult.summary.highPriorityCount,
        attention_required: engineResult.summary.attentionRequiredCount,
        monitor: engineResult.summary.monitorCount,
        informational: engineResult.summary.informationalCount,
      },
      healthSignals: engineResult.healthSignals,
      insights: engineResult.insights,
      recommendations: mergedRecommendations,
      thresholds,
      isDemoData: transactions.some((t) => t.source === 'demo'),
    };

    setSnapshots((prev) => {
      const updated = [newSnapshot, ...prev];
      try {
        localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });

    alert('Advisory snapshot saved successfully to browser storage.');
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // storage quota fallback
      }
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setSnapshots([]);
    try {
      localStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
    } catch {
      // storage quota fallback
    }
  };

  // CSV Exporters
  const downloadCsvFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInsightsCsv = () => {
    const csv = exportAdvisoryInsightsCsv(engineResult.insights, currency);
    downloadCsvFile(`finpilot_advisory_insights_${Date.now()}.csv`, csv);
  };

  const handleExportActionsCsv = () => {
    const csv = exportRecommendationsCsv(mergedRecommendations, currency);
    downloadCsvFile(`finpilot_action_plan_${Date.now()}.csv`, csv);
  };

  const handleExportScenarioCsv = (comp: AdvisoryScenarioComparisonResult) => {
    const csv = exportScenarioComparisonCsv(comp, currency);
    downloadCsvFile(`finpilot_scenario_comparison_${Date.now()}.csv`, csv);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Baseline figures for scenario what-if
  const baselineRev = useMemo(() => {
    const issued = salesInvoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
    if (issued.length > 0) {
      return issued.reduce((s, i) => s + i.grandTotal, 0);
    }
    return 120000;
  }, [salesInvoices]);

  const baselineOpex = useMemo(() => {
    const exp = transactions.filter(
      (t) => t.category !== 'Revenue' && t.category !== 'Sales' && (t.type === 'debit' ? t.amount : 0) > 0
    );
    if (exp.length > 0) {
      return exp.reduce((s, t) => s + (t.type === 'debit' ? t.amount : 0), 0);
    }
    return 78000;
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <AdvisoryHeader
        onOpenThresholds={() => setIsThresholdsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTestRunner={() => setIsTestRunnerOpen(true)}
        onSaveSnapshot={handleSaveSnapshot}
        onExportInsightsCsv={handleExportInsightsCsv}
        onExportActionsCsv={handleExportActionsCsv}
        onTriggerPrint={handleTriggerPrint}
        thresholds={thresholds}
        isAiGenerating={isAiGenerating}
        onRegenerateAiCommentary={handleRegenerateAi}
      />

      {/* Main Workspace Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
            activeTab === 'overview'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Diagnostic Findings & Signals</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
            {engineResult.insights.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
            activeTab === 'actions'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Recommended Action Board</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
            {mergedRecommendations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-colors ${
            activeTab === 'scenarios'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Scenario Modeling</span>
        </button>
      </div>

      {/* Tab 1: Diagnostic Findings & Signals */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AdvisoryOverviewSection
            summary={engineResult.summary}
            aiCommentary={aiCommentary}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            activeSeverity={activeSeverity}
            onSelectSeverity={setActiveSeverity}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <FinancialHealthSignalsSection
            signals={engineResult.healthSignals}
            onSelectSignalDomain={(domain) => {
              if (domain.toLowerCase().includes('revenue')) setActiveCategory('revenue_profitability');
              else if (domain.toLowerCase().includes('receivable')) setActiveCategory('cash_receivables');
              else if (domain.toLowerCase().includes('expense')) setActiveCategory('expense_efficiency');
              else if (domain.toLowerCase().includes('customer')) setActiveCategory('customer_concentration');
              else if (domain.toLowerCase().includes('forecast')) setActiveCategory('forecast_scenarios');
            }}
          />

          <AdvisoryInsightsListSection
            insights={filteredInsights}
            onOpenDrilldown={(ins) => setDrilldownInsight(ins)}
          />
        </div>
      )}

      {/* Tab 2: Prioritized Action Board */}
      {activeTab === 'actions' && (
        <RecommendedActionsSection
          recommendations={mergedRecommendations}
          onUpdateStatus={handleUpdateActionStatus}
          onUpdateNotes={handleUpdateActionNotes}
          onExportCsv={handleExportActionsCsv}
        />
      )}

      {/* Tab 3: What-If Scenario Modeling */}
      {activeTab === 'scenarios' && (
        <ScenarioWhatIfSection
          defaultBaselineRevenue={baselineRev}
          defaultBaselineOpex={baselineOpex}
          currency={currency}
          onExportCsv={handleExportScenarioCsv}
        />
      )}

      {/* Modals */}
      <EvidenceDrilldownModal
        insight={drilldownInsight}
        onClose={() => setDrilldownInsight(null)}
      />

      <ThresholdConfigModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        currentThresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
      />

      <AdvisoryHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        snapshots={snapshots}
        onRestoreSnapshot={(snap) => {
          setThresholds(snap.thresholds);
          alert(`Restored parameters from snapshot "${snap.title}" (${new Date(snap.timestamp).toLocaleString()}).`);
        }}
        onDeleteSnapshot={handleDeleteSnapshot}
        onClearAllHistory={handleClearAllHistory}
      />

      <Phase9TestRunnerModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />
    </div>
  );
};
export default FinancialAdvisory;
