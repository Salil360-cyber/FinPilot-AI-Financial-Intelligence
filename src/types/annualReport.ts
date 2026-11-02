/**
 * FinPilot AI - Phase 8 Annual Report Intelligence Types
 * Data structures for annual reports, SEC 10-K/statutory filings,
 * multi-year financial statements, validation rules, narrative intelligence, and ratios.
 */

export type ReportProcessingStatus =
  | 'uploaded'
  | 'extracting'
  | 'needs_review'
  | 'ready_for_analysis'
  | 'extraction_failed';

export type StatementType = 'income_statement' | 'balance_sheet' | 'cash_flow';
export type FinancialStatementType = StatementType;

export type FieldProvenance = 'extracted' | 'user_verified' | 'calculated' | 'missing' | 'inferred';
export type FieldReviewStatus = 'unverified' | 'verified' | 'conflicting' | 'missing';
export type ReportingScale = 'units' | 'thousands' | 'millions' | 'billions' | 'ambiguous';

export interface FinancialLineItem {
  id: string;
  statementType: StatementType;
  normalizedKey: string; // e.g. 'revenue', 'cogs', 'gross_profit', 'total_assets'
  originalLabel: string; // e.g. "Net revenues and sales", "Cost of products sold"
  extractedValue: number; // Value as extracted/scaled
  originalDisplayValue: string; // Exact string from PDF, e.g. "4,450,210" or "4,450.2"
  currency: string; // e.g. 'USD'
  reportingScale: ReportingScale; // e.g. 'millions'
  normalizedNumericValue: number; // In absolute base currency units (e.g. 4450200000)
  period: string; // e.g. "FY 2025" or "2025-12-31"
  pageNumber: number; // 1-based page index where identified
  provenance: FieldProvenance;
  status: FieldReviewStatus;
  conflictValues?: number[];
  userNotes?: string;
  lastEditedAt?: string;
  lastEditedBy?: string;

  // Ergonomic helper aliases
  rawLabel?: string;
  standardLabel?: string;
  value?: number;
  normalizedValue?: number;
  category?: string;
  confidence?: number;
  isVerified?: boolean;
}

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export interface StatementValidationResult {
  ruleId: string;
  statementType: StatementType;
  ruleName: string;
  passed: boolean;
  formula: string;
  discrepancy: number; // absolute difference
  tolerance: number;
  message: string;
  severity: 'info' | 'warning' | 'error';
  inputs: { label: string; value: number }[];
}

export interface MultiYearComparisonRow {
  key: string;
  label: string;
  statementType: StatementType;
  currentPeriod: string;
  priorPeriod: string;
  currentValue: number;
  priorValue: number;
  absoluteChange: number;
  dollarChange?: number; // Alias for absoluteChange
  percentageChange: number | null; // null if priorValue === 0
  isUndefinedPercentage: boolean;
  trend: 'up' | 'down' | 'flat';
  explanation?: string;
  isRestated?: boolean;
  notes?: string;
}

export interface AnnualReportRatio {
  id: string;
  name: string;
  category: 'profitability' | 'liquidity' | 'solvency' | 'cash_flow' | 'efficiency';
  formula: string;
  value: number | null;
  formattedValue: string;
  status: 'calculated' | 'unavailable' | 'requires_review';
  period: string;
  inputsUsed: { label: string; value: string; isVerified: boolean }[];
  limitations: string;

  // Ergonomic display helpers
  benchmark?: string;
  interpretation?: string;
  unit?: string;
  isHealthy?: boolean;
}

export type NarrativeSectionType =
  | 'mda'
  | 'business'
  | 'risks'
  | 'risk_factors'
  | 'liquidity'
  | 'segment'
  | 'accounting_policies'
  | 'auditor'
  | 'auditor_report'
  | 'going_concern'
  | 'subsequent_events';

export interface NarrativeSnippet {
  id: string;
  section: NarrativeSectionType;
  sectionLabel: string;
  title: string;
  snippetText: string;
  pageNumber: number;
  confidence: 'high' | 'medium' | 'low';
  keyTakeaway: string;
  isOcrDerived: boolean;

  // Ergonomic helper aliases
  sectionType?: string;
  content?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface DataQualitySummary {
  totalFields: number;
  verifiedFields: number;
  calculatedFields: number;
  missingFields: number;
  conflictingFields: number;
  unresolvedUnitCount: number;
  validationWarningsCount: number;
  overallScorePercent: number;

  // Diagnostic helper aliases
  qualityScore?: number;
  verifiedCount?: number;
  totalItems?: number;
  lowConfidenceCount?: number;
  balanceSheetBalanced?: boolean;
  warnings?: string[];
}

export interface StatementOverallValidation {
  balanceSheetBalances: boolean;
  balanceSheetDiscrepancy: number;
  grossProfitReconciles: boolean;
  operatingIncomeReconciles: boolean;
  cashFlowReconciles: boolean;
  missingLineItems: string[];
  scaleConsistencyWarning: string | null;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface ReportDocument {
  id: string;
  entityName: string;
  cikOrId?: string;
  fiscalYear: string; // e.g. "FY 2025" or "2025"
  periodStartDate?: string; // YYYY-MM-DD
  periodEndDate: string; // YYYY-MM-DD
  currency: string;
  reportingScale: ReportingScale;
  status: ReportProcessingStatus;
  isFullyReviewed: boolean;
  pageCount: number;
  fileName: string;
  fileSizeBytes: number;
  source: 'demo' | 'user_upload';
  uploadedAt: string;
  updatedAt: string;
  auditorOpinion?: {
    firm: string;
    opinion: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer';
    hasGoingConcern: boolean;
    pageNumber: number;
  };
  lineItems: FinancialLineItem[];
  narrativeSnippets: NarrativeSnippet[];
  pages?: ExtractedPageText[];
  extractedPages?: ExtractedPageText[];
  comparativePriorPeriod?: string; // e.g. "FY 2024"
  notes?: string;

  // Ergonomic helper aliases
  companyName?: string;
  filingType?: string;
  cik?: string;
  periodEnded?: string;
  auditorName?: string;
  auditOpinion?: string;
  validationResult?: StatementOverallValidation;
}
