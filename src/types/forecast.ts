/**
 * FinPilot AI - Phase 7 Revenue Forecasting & Scenario Planning Types
 * Fully-typed data structures for deterministic financial projections,
 * uncertainty analysis, scenario planning, and backtesting.
 */

export type ForecastMetricType =
  | 'issued_sales'
  | 'recorded_revenue'
  | 'cash_collections'
  | 'accounts_receivable'
  | 'operating_expenses'
  | 'net_operating_movement';

export interface ForecastMetricDefinition {
  id: ForecastMetricType;
  label: string;
  shortLabel: string;
  description: string;
  unit: string;
  isRevenueLike: boolean; // if true, zero-floor policy is applicable to avoid negative sales
  requiresDoubleEntry: boolean;
}

export type ForecastMethodType =
  | 'naive_baseline'
  | 'moving_average'
  | 'weighted_moving_average'
  | 'linear_trend'
  | 'seasonality_aware';

export interface ForecastMethodConfig {
  method: ForecastMethodType;
  movingAverageWindow?: number; // e.g. 3, 6, 12 months
  weightedWeights?: number[]; // e.g. [1, 2, 3]
  seasonalPeriod?: number; // 12 for monthly
  zeroFloorPolicyApplied?: boolean;
}

export interface HistoricalDataPoint {
  period: string; // YYYY-MM
  periodLabel: string; // e.g. "Oct 2026"
  value: number;
  count: number;
  isMissing: boolean; // true if no transactions or records exist for this period
  isTrueZero: boolean; // true if records exist and sum to 0
  isDemo: boolean;
  currency: string;
}

export interface HistoricalSummary {
  metric: ForecastMetricType;
  currency: string;
  totalPeriods: number;
  validPeriodsCount: number;
  missingPeriodsCount: number;
  totalValue: number;
  averageMonthlyValue: number;
  minMonthlyValue: number;
  maxMonthlyValue: number;
  stdDev: number;
  volatilityPercent: number; // stdDev / avg * 100
  historyStartDate: string;
  historyEndDate: string;
  points: HistoricalDataPoint[];
  demoRecordRatio: number; // 0 to 1
  coverageWarning?: string;
}

export interface ForecastPeriodResult {
  period: string; // YYYY-MM
  periodLabel: string; // e.g. "Nov 2026 (F)"
  pointEstimate: number;
  rangeLower: number;
  rangeUpper: number;
  baselineEstimate: number;
  scenarioAdjustments: {
    scenarioId: string;
    adjustedValue: number;
  }[];
  isNegativeClamped: boolean;
}

export interface ForecastRunResult {
  forecastId: string;
  generatedAt: string;
  metric: ForecastMetricType;
  currency: string;
  horizonMonths: number;
  forecastStartDate: string;
  forecastEndDate: string;
  methodConfig: ForecastMethodConfig;
  methodLabel: string;
  historicalWindowPeriods: number;
  historicalSummary: HistoricalSummary;
  periods: ForecastPeriodResult[];
  projectedTotal: number;
  projectedAverageMonthly: number;
  projectedPeriodGrowthPercent: number | null; // vs prior historical period of same length
  assumptions: string[];
  limitations: string[];
  uncertaintyMethod: 'historical_volatility_spread' | 'scenario_bounds';
}

export interface ScenarioDefinition {
  id: string; // 'base' | 'optimistic' | 'conservative' | custom UUID
  name: string;
  description: string;
  isSystemDefault: boolean;
  color: string;
  growthRatePercent: number; // Annualized or period growth applied to forecast
  customerExpansionPercent: number; // Extra customer expansion assumption
  churnRatePercent: number; // Expected customer churn or revenue loss
  oneTimeAdjustment: number; // One-off addition/subtraction
  oneTimeMonthIndex: number; // 1-based index (e.g. month 1 or month 3)
  recurringMonthlyAdjustment: number; // Recurring fixed monthly cash flow addition/deduction
}

export interface ScenarioProjectionSummary {
  scenarioId: string;
  name: string;
  color: string;
  totalProjectedValue: number;
  varianceFromBaseline: number;
  varianceFromBaselinePercent: number;
  monthlyProjections: {
    period: string;
    periodLabel: string;
    value: number;
    differenceFromBase: number;
  }[];
}

export interface CustomerConcentrationItem {
  customerId: string;
  customerName: string;
  invoicedTotal: number;
  percentageOfTotal: number;
  invoiceCount: number;
  status: 'active' | 'infrequent' | 'dormant';
  cumulativeSharePercent: number;
}

export interface ConcentrationAnalysis {
  topCustomerSharePercent: number;
  top3SharePercent: number;
  herfindahlIndex: number; // 0 to 10000 HHI
  riskRating: 'low' | 'moderate' | 'high' | 'severe';
  totalCustomersCount: number;
  items: CustomerConcentrationItem[];
}

export interface BacktestEvaluation {
  cutoffPeriod: string; // YYYY-MM
  trainingPeriodsCount: number;
  testPeriodsCount: number;
  method: ForecastMethodType;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  wapePercent: number | null; // Weighted Absolute Percentage Error
  predictions: {
    period: string;
    actual: number;
    predicted: number;
    absoluteError: number;
    errorPercent: number | null;
  }[];
  isReliable: boolean;
  unreliableReason?: string;
}

export interface BacktestComparisonSummary {
  cutoffPeriod: string;
  testPeriodsCount: number;
  evaluations: BacktestEvaluation[];
  bestMethod: ForecastMethodType;
  rankingRationale: string;
}

export interface ForecastRiskIndicator {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  observedCondition: string;
  supportingData: string;
  timeframe: string;
  qualification: string;
}

export interface ForecastSnapshot {
  id: string;
  snapshotName: string;
  createdAt: string;
  createdBy: string;
  metric: ForecastMetricType;
  currency: string;
  horizonMonths: number;
  method: ForecastMethodType;
  projectedTotal: number;
  historicalTotal: number;
  runResult: ForecastRunResult;
  scenarios: ScenarioDefinition[];
  notes?: string;
}
