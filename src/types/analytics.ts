/**
 * FinPilot AI - Phase 6: Financial Analytics & Ratio Calculator Types
 * Strictly defined for deterministic financial analysis and traceable ratios.
 */

export type AnalyticsPeriodPreset =
  | 'current_month'
  | 'previous_month'
  | 'current_quarter'
  | 'previous_quarter'
  | 'current_year'
  | 'previous_year'
  | 'all_time'
  | 'custom';

export type AnalyticsSourceFilter = 'all' | 'demo' | 'user' | 'imported';

export type AnalyticsStatusFilter = 'all' | 'matched' | 'unmatched';

export interface AnalyticsFilterState {
  period: AnalyticsPeriodPreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  currency: string; // e.g. 'USD'
  source: AnalyticsSourceFilter;
  status: AnalyticsStatusFilter;
  includeDemoData: boolean;
}

export interface ManualFinancialInputs {
  asOfDate: string; // YYYY-MM-DD
  currentAssets?: number;
  inventory?: number;
  prepaidExpenses?: number;
  currentLiabilities?: number;
  cashAndEquivalents?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalDebt?: number;
  totalEquity?: number;
  cogs?: number;
  beginningEquity?: number;
  endingEquity?: number;
  beginningAssets?: number;
  endingAssets?: number;
  beginningAr?: number;
  endingAr?: number;
  notes?: string;
  updatedAt?: string;
}

export type RatioCategory = 'liquidity' | 'profitability' | 'leverage' | 'efficiency';

export type RatioStatus = 'calculated' | 'estimated' | 'unavailable';

export interface RatioComponent {
  label: string;
  value: string;
  numericValue?: number;
  isManual?: boolean;
  sourceDescription?: string;
}

export interface FinancialRatioResult {
  id: string;
  name: string;
  category: RatioCategory;
  formula: string;
  value: number | null;
  formattedValue: string;
  status: RatioStatus;
  benchmark: string;
  benchmarkStatus: 'favorable' | 'acceptable' | 'warning' | 'neutral';
  interpretation: string;
  requiredInputs: string[];
  missingInputs: string[];
  components: RatioComponent[];
  limitations?: string;
}

export interface RevenueAnalyticsSummary {
  recordedRevenue: number;
  issuedInvoicesTotal: number;
  issuedInvoicesCount: number;
  cashPaymentsReceived: number;
  cashPaymentsCount: number;
  outstandingReceivables: number;
  unpaidInvoicesCount: number;
  overdueInvoicesTotal: number;
  overdueInvoicesCount: number;
  revenueByCustomer: { customer: string; amount: number; percentage: number; invoiceCount: number }[];
  revenueByMonth: { month: string; amount: number; invoiceCount: number }[];
  ageingBuckets: {
    current: number; // 0-30 days
    days31to60: number;
    days61to90: number;
    over90: number;
  };
}

export interface ExpenseAnalyticsSummary {
  totalOperatingExpenses: number;
  activeExpensesCount: number;
  cancelledVouchersTotal: number;
  cancelledVouchersCount: number;
  nonExpenseDebitsTotal: number;
  expensesByCategory: { category: string; amount: number; percentage: number; transactionCount: number }[];
  expensesByVendor: { vendor: string; amount: number; percentage: number; transactionCount: number }[];
  expensesByMonth: { month: string; amount: number; transactionCount: number }[];
  largestExpenses: { id: string; date: string; vendor: string; amount: number; category: string }[];
  recurringPatterns: { vendor: string; typicalAmount: number; frequencyEstimate: string; totalSpent: number }[];
  expensesBySource: { source: string; amount: number; count: number }[];
}

export interface ProfitabilitySummary {
  revenue: number;
  costOfGoodsSold: number | null;
  grossProfit: number | null;
  grossProfitMarginPercent: number | null;
  operatingExpenses: number;
  operatingProfit: number | null;
  operatingProfitMarginPercent: number | null;
  netProfit: number;
  netProfitMarginPercent: number;
  revenueToExpenseRatio: number | null;
  isCogsAvailable: boolean;
  profitabilityClassificationNotice: string;
}

export interface PeriodComparisonMetric {
  id: string;
  name: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previous was 0
  formattedCurrent: string;
  formattedPrevious: string;
  direction: 'positive' | 'negative' | 'neutral';
  isFavorable: boolean;
  explanation: string;
}

export interface PeriodComparisonSummary {
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  metrics: PeriodComparisonMetric[];
  expenseCategoryChanges: { category: string; current: number; previous: number; change: number; pctChange: number | null }[];
}

export interface CashMovementSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  netMovement: number;
  openingBalance: number;
  calculatedClosingBalance: number;
  reconciledDeposits: number;
  reconciledWithdrawals: number;
  reconciliationRatePercent: number;
  unreconciledItemsCount: number;
  activeSessionName?: string;
  activeAccountId?: string;
}

export interface DataQualityWarning {
  id: string;
  severity: 'warning' | 'info' | 'error';
  category: string;
  title: string;
  description: string;
  affectedCount: number;
  affectedAmount?: number;
  actionableStep: string;
}

export interface BusinessInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral' | 'trend';
  title: string;
  observation: string;
  supportingMetric: string;
  periodLabel: string;
  recommendation?: string;
}

export interface CompleteAnalyticsDataset {
  filter: AnalyticsFilterState;
  periodLabel: string;
  revenue: RevenueAnalyticsSummary;
  expenses: ExpenseAnalyticsSummary;
  profitability: ProfitabilitySummary;
  ratios: FinancialRatioResult[];
  periodComparison: PeriodComparisonSummary;
  cashMovement: CashMovementSummary;
  dataQuality: DataQualityWarning[];
  insights: BusinessInsight[];
  manualInputs: ManualFinancialInputs;
}
