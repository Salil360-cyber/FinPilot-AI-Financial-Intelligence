/**
 * FinPilot AI - Phase 9: AI Financial Advisory Types
 * Comprehensive data contracts for deterministic advisory signals,
 * health indicators, evidence drill-down, scenario what-if modeling,
 * recommended actions, and executive snapshots.
 */

export type AdvisoryCategory =
  | 'revenue_profitability'
  | 'cash_receivables'
  | 'expense_efficiency'
  | 'customer_concentration'
  | 'forecast_scenarios'
  | 'capital_health';

export type AdvisorySeverity =
  | 'informational'
  | 'monitor'
  | 'attention_required'
  | 'high_priority';

export type DataProvenance =
  | 'user_verified'
  | 'system_calculated'
  | 'demo_data'
  | 'forecast_estimates'
  | 'annual_report_extracted'
  | 'annual_report_verified'
  | 'manual_assumptions';

export type ActionStatus =
  | 'suggested'
  | 'in_review'
  | 'accepted'
  | 'dismissed'
  | 'completed';

export interface InsightSourceValue {
  label: string;
  value: number | string;
  formattedValue: string;
  period?: string;
  provenance: DataProvenance;
  notes?: string;
}

export interface AdvisoryInsight {
  id: string;
  title: string;
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  explanation: string;
  evidenceSummary: string;
  sourceValues: InsightSourceValue[];
  reportingPeriods: string[];
  calculationFormula?: string;
  sourceModule:
    | 'general_ledger'
    | 'sales_invoices'
    | 'bank_reconciliation'
    | 'analytics'
    | 'forecasting'
    | 'annual_reports'
    | 'combined';
  provenance: DataProvenance;
  isDemoData: boolean;
  knownLimitations: string[];
  suggestedNextAction: string;
  createdAt: string;
  currency: string;
  qualityStatus: 'verified' | 'unverified' | 'insufficient_data' | 'zero_denominator' | 'currency_mismatch';
  isUnavailable?: boolean;
  unavailableReason?: string;
  relatedMetric?: string;
}

export interface AdvisoryRecommendation {
  id: string;
  title: string;
  businessProblem: string;
  supportingEvidence: string;
  expectedObjective: string;
  suggestedNextStep: string;
  priority: AdvisorySeverity;
  dataLimitations: string;
  status: ActionStatus;
  userNotes?: string;
  category: AdvisoryCategory;
  createdAt: string;
  updatedAt: string;
  relatedInsightId?: string;
  isDemoData?: boolean;
}

export interface AdvisoryHealthSignal {
  id: string;
  domain: string;
  indicator: string;
  status: 'healthy' | 'neutral' | 'watch' | 'critical' | 'unavailable';
  valueDisplay: string;
  numericValue?: number | null;
  benchmarkOrPriorDisplay: string;
  trend: 'improving' | 'stable' | 'deteriorating' | 'unknown';
  evidence: string;
  provenance: DataProvenance;
  limitations?: string;
  category: AdvisoryCategory;
}

export interface AdvisoryThresholds {
  revenueDeclineThresholdPct: number; // e.g. 5.0%
  opexRevenueGrowthGapPct: number; // e.g. 3.0%
  overdueReceivablesThresholdPct: number; // e.g. 15.0%
  topCustomerConcentrationPct: number; // e.g. 30.0%
  top3CustomerConcentrationPct: number; // e.g. 60.0%
  minForecastHistoryMonths: number; // e.g. 6
  quickRatioWarningThreshold: number; // e.g. 1.0
  dsoWarningDays: number; // e.g. 45
}

export const DEFAULT_ADVISORY_THRESHOLDS: AdvisoryThresholds = {
  revenueDeclineThresholdPct: 5.0,
  opexRevenueGrowthGapPct: 3.0,
  overdueReceivablesThresholdPct: 15.0,
  topCustomerConcentrationPct: 30.0,
  top3CustomerConcentrationPct: 60.0,
  minForecastHistoryMonths: 6,
  quickRatioWarningThreshold: 1.0,
  dsoWarningDays: 45,
};

export interface AdvisoryScenarioAdjustment {
  revenueGrowthPct: number;
  opexGrowthPct: number;
  customerChurnPct: number;
  customerExpansionPct: number;
  recurringMonthlyAdj: number;
  oneTimeAdj: number;
  oneTimeMonthIndex: number;
}

export interface AdvisoryScenarioComparisonResult {
  baselineRevenue: number;
  projectedRevenue: number;
  baselineOpex: number;
  projectedOpex: number;
  baselineNetMargin: number;
  projectedNetMargin: number;
  revenueVariance: number;
  revenueVariancePct: number;
  opexVariance: number;
  opexVariancePct: number;
  formulaApplied: string;
  assumptionsList: string[];
  currency: string;
  isNegativeClamped?: boolean;
}

export interface AdvisorySnapshot {
  id: string;
  title: string;
  asOfDate: string;
  timestamp: string;
  currency: string;
  totalInsights: number;
  insightsCountBySeverity: Record<AdvisorySeverity, number>;
  healthSignals: AdvisoryHealthSignal[];
  insights: AdvisoryInsight[];
  recommendations: AdvisoryRecommendation[];
  thresholds: AdvisoryThresholds;
  userNotes?: string;
  isDemoData: boolean;
}

export interface AdvisoryFilterState {
  category: 'all' | AdvisoryCategory;
  severity: 'all' | AdvisorySeverity;
  provenance: 'all' | DataProvenance;
  status: 'all' | 'verified' | 'unverified' | 'insufficient_data';
  currency: string;
  searchQuery: string;
}

export interface AdvisoryEngineInputs {
  currency?: string;
  thresholds?: AdvisoryThresholds;
  includeDemoData?: boolean;
}
