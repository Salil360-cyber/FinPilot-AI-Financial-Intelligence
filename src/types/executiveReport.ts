/**
 * FinPilot AI - Phase 10: Executive Reports & Business Reporting Types
 * Enterprise-grade consolidated reporting data model and configuration types.
 */

export type ReportTemplateType =
  | 'executive_summary'
  | 'financial_performance'
  | 'invoice_receivables'
  | 'reconciliation_controls'
  | 'forecast_scenarios'
  | 'annual_report_analysis'
  | 'advisory_action_plan'
  | 'custom';

export type ReportSectionId =
  | 'executive_summary'
  | 'financial_performance'
  | 'operations_receivables'
  | 'reconciliation_controls'
  | 'forecast_scenarios'
  | 'annual_report'
  | 'advisory_highlights'
  | 'data_quality';

export type PeriodPreset =
  | 'all_time'
  | 'current_month'
  | 'previous_month'
  | 'current_quarter'
  | 'previous_quarter'
  | 'current_year'
  | 'previous_year'
  | 'custom';

export type ConfidentialityLevel =
  | 'Internal Use Only'
  | 'Confidential'
  | 'Board & Executive'
  | 'Public Filing Extract';

export type DataCategory =
  | 'historical_actuals'
  | 'user_verified'
  | 'system_calculated'
  | 'forecast_estimates'
  | 'hypothetical_scenarios'
  | 'annual_report_extracted'
  | 'ai_generated_commentary'
  | 'demo_data';

export interface ReportProvenanceItem {
  category: DataCategory;
  categoryLabel: string;
  recordCount: number;
  description: string;
  sourceModule: string;
  isAuditedOrVerified: boolean;
}

export interface ReportQualityWarning {
  code: string;
  level: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  affectedSection: ReportSectionId;
}

export interface ExecutiveReportConfig {
  id: string;
  title: string;
  entityName: string;
  template: ReportTemplateType;
  periodPreset: PeriodPreset;
  startDate: string;
  endDate: string;
  currency: string;
  includedSections: ReportSectionId[];
  executiveCommentary: string;
  preparedBy: string;
  confidentialityLevel: ConfidentialityLevel;
  createdAt: string;
  updatedAt: string;
  isSnapshot?: boolean;
  snapshotData?: ConsolidatedReportData;
}

export interface ConsolidatedReportData {
  config: ExecutiveReportConfig;
  generatedAt: string;
  summaryKpis: {
    totalRevenue: number;
    totalExpenses: number;
    netOperatingIncome: number;
    operatingMarginPercent: number;
    cashAndEquivalents: number;
    outstandingReceivables: number;
    reconciliationMatchRate: number;
    forecastProjectedRevenueNextQuarter: number;
    currency: string;
  };
  performance: {
    revenueTotal: number;
    expenseTotal: number;
    netIncome: number;
    operatingMargin: number;
    revenueEntriesCount: number;
    expenseEntriesCount: number;
    topExpenseCategories: { category: string; amount: number; percentage: number }[];
    topRevenueCategories: { category: string; amount: number; percentage: number }[];
    periodComparison?: {
      priorRevenue: number;
      priorExpenses: number;
      revenueGrowthPercent: number | null;
      expenseGrowthPercent: number | null;
    };
  };
  operationsReceivables: {
    totalInvoicedAmount: number;
    totalPaidAmount: number;
    totalOutstandingAmount: number;
    collectionRatePercent: number;
    invoicesCount: number;
    paidInvoicesCount: number;
    unpaidInvoicesCount: number;
    overdueInvoicesCount: number;
    ageingBuckets: {
      current: number;
      days1to30: number;
      days31to60: number;
      days61to90: number;
      days90Plus: number;
    };
    averageDsoDays: number | null;
  };
  reconciliationControls: {
    totalBankAccounts: number;
    totalSessions: number;
    latestSessionDate: string | null;
    averageMatchRatePercent: number;
    totalBankMovementsCount: number;
    matchedMovementsCount: number;
    unmatchedDiscrepancyAmount: number;
    unmatchedDiscrepancyCount: number;
    lockedSessionsCount: number;
    auditStatus: string;
  };
  forecastScenarios: {
    hasForecast: boolean;
    baselineNextMonthRevenue: number | null;
    baselineQuarterlyRunRate: number | null;
    growthRatePercent: number | null;
    optimisticScenarioRevenue: number | null;
    pessimisticScenarioRevenue: number | null;
    uncertaintySpread: number | null;
    keyAssumptions: string[];
  };
  annualReportAnalysis: {
    hasAnnualReports: boolean;
    reportTitle?: string;
    companyName?: string;
    fiscalYear?: string;
    auditorOpinion?: string;
    auditorName?: string;
    operatingMargin?: number;
    currentRatio?: number;
    quickRatio?: number;
    debtToEquity?: number;
    verificationStatus?: string;
  };
  advisoryHighlights: {
    overallRiskScore: number;
    riskLevel: 'low' | 'moderate' | 'elevated' | 'critical';
    topRecommendations: {
      id: string;
      title: string;
      category: string;
      priority: string;
      estimatedImpact: string;
    }[];
    healthSignalsSummary: {
      strongCount: number;
      warningCount: number;
      criticalCount: number;
    };
  };
  provenance: ReportProvenanceItem[];
  qualityWarnings: ReportQualityWarning[];
  commentaryResult?: {
    text: string;
    provider: string;
    groundedFactsCount: number;
    generatedAt: string;
  };
}

export const TEMPLATE_DEFAULT_SECTIONS: Record<ReportTemplateType, ReportSectionId[]> = {
  executive_summary: [
    'executive_summary',
    'financial_performance',
    'operations_receivables',
    'reconciliation_controls',
    'advisory_highlights',
    'data_quality',
  ],
  financial_performance: [
    'executive_summary',
    'financial_performance',
    'data_quality',
  ],
  invoice_receivables: [
    'executive_summary',
    'operations_receivables',
    'data_quality',
  ],
  reconciliation_controls: [
    'executive_summary',
    'reconciliation_controls',
    'data_quality',
  ],
  forecast_scenarios: [
    'executive_summary',
    'forecast_scenarios',
    'data_quality',
  ],
  annual_report_analysis: [
    'executive_summary',
    'annual_report',
    'data_quality',
  ],
  advisory_action_plan: [
    'executive_summary',
    'advisory_highlights',
    'data_quality',
  ],
  custom: [
    'executive_summary',
    'financial_performance',
    'operations_receivables',
    'reconciliation_controls',
    'forecast_scenarios',
    'annual_report',
    'advisory_highlights',
    'data_quality',
  ],
};

export const TEMPLATE_METADATA: Record<
  ReportTemplateType,
  { name: string; description: string; badge: string; targetAudience: string }
> = {
  executive_summary: {
    name: 'Executive Financial Summary',
    description: 'Holistic overview of core financial KPIs, receivables health, reconciliation standing, and key advisory action items.',
    badge: 'Standard C-Suite',
    targetAudience: 'Chief Executive Officer, Board Members, Operating Committee',
  },
  financial_performance: {
    name: 'Financial Performance Report',
    description: 'Detailed revenue vs operating expense analysis, top expenditure categories, operating margins, and period comparisons.',
    badge: 'P&L Analysis',
    targetAudience: 'Chief Financial Officer, VP Finance, Financial Planning & Analysis (FP&A)',
  },
  invoice_receivables: {
    name: 'Invoice & Receivables Report',
    description: 'Sales billing totals, collection metrics, aged receivables schedule (Current to 90+ days), and DSO tracking.',
    badge: 'Working Capital',
    targetAudience: 'Treasurer, Credit Controller, Revenue Operations',
  },
  reconciliation_controls: {
    name: 'Bank Reconciliation & Controls Report',
    description: 'Treasury status, account clearing rates, unmatched variances, and internal control session lock verification.',
    badge: 'Audit & Compliance',
    targetAudience: 'Internal Audit, Controller, External Reviewers',
  },
  forecast_scenarios: {
    name: 'Forecast & Scenario Report',
    description: 'Quarterly run-rate projections, scenario divergence (baseline vs upside vs downside), and sensitivity spreads.',
    badge: 'Strategic Planning',
    targetAudience: 'VP Strategy, FP&A Director, Executive Leadership',
  },
  annual_report_analysis: {
    name: 'Annual Report Analysis',
    description: 'Analysis of extracted 10-K statutory filings, liquidity & leverage ratios, and independent auditor disclosures.',
    badge: 'Statutory Review',
    targetAudience: 'Audit Committee, Investor Relations, Board of Directors',
  },
  advisory_action_plan: {
    name: 'Financial Advisory Action Plan',
    description: 'Synthesized health signals matrix, prioritized operational recommendations, and expected financial impact.',
    badge: 'Action Roadmap',
    targetAudience: 'Chief Operating Officer, Finance Transformation Lead',
  },
  custom: {
    name: 'Custom Executive Report',
    description: 'Tailored multi-section report configured with specific functional modules and custom date parameters.',
    badge: 'Customizable',
    targetAudience: 'Management & Stakeholders',
  },
};
