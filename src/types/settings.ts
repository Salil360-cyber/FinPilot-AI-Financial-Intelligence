/**
 * FinPilot AI - Phase 11: Settings, Data Management & System Administration Types
 * Data contracts for company profile, financial preferences, backup/restore,
 * storage diagnostics, demo data management, and system integrity.
 */

export type DateFormatOption = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MMM-YYYY';

export type NumberFormatOption = 'standard_en' | 'european' | 'indian_lakhs';

export type CurrencyOption = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'SGD' | 'JPY' | 'CHF';

export type AccountingStandard = 'GAAP' | 'IFRS';

export interface CompanyProfile {
  companyName: string;
  legalEntityName: string;
  businessDescription?: string;
  country: string;
  taxIdentifier?: string; // EIN, VAT, GSTIN
  reportingCurrency: CurrencyOption;
  fiscalYearStartMonth: number; // 1 = January, 12 = December
  dateFormat: DateFormatOption;
  numberFormat: NumberFormatOption;
  reportFooterText?: string;
  updatedAt: string;
}

export interface FinancialPreferences {
  defaultCurrencyForNewWorkflows: CurrencyOption;
  defaultReportingPeriodPreset: string; // 'all_time' | 'current_quarter' | 'current_year' | etc.
  accountingStandard: AccountingStandard;
  decimalPrecision: number; // 0, 2, 4
  reconciliationDateToleranceDays: number;
  autoMatchConfidenceThreshold: number; // e.g. 90%
  enableAuditedStrictLock: boolean;
  notifyOnOverdueInvoices: boolean;
  updatedAt: string;
}

export interface StorageCategoryMeta {
  key: string;
  categoryName: string;
  moduleSource: string;
  recordCount: number;
  byteSize: number;
  hasDemoData: boolean;
  hasUserData: boolean;
  isExportable: boolean;
  status: 'valid' | 'empty' | 'corrupted' | 'unsupported';
  knownLimitations: string;
}

export interface FinPilotBackupArtifact {
  backupFormat: 'finpilot-ai-backup';
  schemaVersion: '1.0.0';
  applicationId: 'finpilot-ai';
  exportTimestamp: string;
  appVersion: string;
  entityName: string;
  supportedCategories: string[];
  payload: {
    companyProfile?: CompanyProfile;
    financialPreferences?: FinancialPreferences;
    userTransactions?: any[];
    salesInvoices?: any[];
    bankAccounts?: any[];
    reconciliationSessions?: any[];
    manualInputs?: any;
    forecastSnapshots?: any[];
    forecastScenarios?: any[];
    annualReports?: any[];
    advisoryThresholds?: any;
    advisoryActions?: any[];
    advisorySnapshots?: any[];
    executiveReports?: any[];
    auditLogs?: any[];
    invoiceDrafts?: any[];
  };
  metadata: {
    totalRecordCount: number;
    categoriesIncluded: number;
    checksum: string;
    containsDemoData: boolean;
  };
}

export type RestoreMode = 'replace' | 'merge';

export interface RestorePreview {
  isValid: boolean;
  schemaVersion: string;
  exportTimestamp: string;
  entityName: string;
  categories: {
    categoryName: string;
    recordCount: number;
    willOverwriteCount?: number;
    willAddCount?: number;
  }[];
  totalRecords: number;
  validationErrors: string[];
  validationWarnings: string[];
}

export interface RestoreResult {
  status: 'success' | 'partial' | 'rejected' | 'failed';
  restoredCategories: string[];
  failedCategories: string[];
  recordsRestored: number;
  message: string;
  safetyBackupCreated?: boolean;
}

export interface DiagnosticCheckItem {
  id: string;
  title: string;
  category: 'storage' | 'ledger' | 'receivables' | 'reconciliation' | 'security' | 'environment';
  status: 'optimal' | 'notice' | 'warning' | 'alert';
  detail: string;
  recommendation?: string;
  executedAt: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: 'Meridian Dynamics Corp',
  legalEntityName: 'Meridian Dynamics Corporation Ltd.',
  businessDescription: 'Enterprise financial software and operations management.',
  country: 'United States',
  taxIdentifier: 'US-EIN-94-2819041',
  reportingCurrency: 'USD',
  fiscalYearStartMonth: 1, // January
  dateFormat: 'YYYY-MM-DD',
  numberFormat: 'standard_en',
  reportFooterText: 'Strictly Confidential • Management Financial Report • Prepared with FinPilot AI',
  updatedAt: '2026-03-01T00:00:00Z',
};

export const DEFAULT_FINANCIAL_PREFERENCES: FinancialPreferences = {
  defaultCurrencyForNewWorkflows: 'USD',
  defaultReportingPeriodPreset: 'all_time',
  accountingStandard: 'GAAP',
  decimalPrecision: 2,
  reconciliationDateToleranceDays: 3,
  autoMatchConfidenceThreshold: 90,
  enableAuditedStrictLock: true,
  notifyOnOverdueInvoices: true,
  updatedAt: '2026-03-01T00:00:00Z',
};

export const FINPILOT_STORAGE_KEYS = {
  COMPANY_PROFILE: 'finpilot_company_profile_v11',
  FINANCIAL_PREFERENCES: 'finpilot_financial_preferences_v11',
  USER_TRANSACTIONS: 'finpilot_user_transactions_v3',
  DEMO_OVERRIDES: 'finpilot_demo_overrides_v3',
  INVOICE_DRAFTS: 'finpilot_invoice_drafts_v3',
  AUDIT_LOGS: 'finpilot_audit_logs_v3',
  SALES_INVOICES: 'finpilot_outgoing_invoices_v4',
  SALES_OVERRIDES: 'finpilot_sales_invoice_overrides_v4',
  BANK_ACCOUNTS: 'finpilot_bank_accounts_v5',
  RECON_SESSIONS: 'finpilot_reconciliation_sessions_v5',
  ACTIVE_RECON_SESSION: 'finpilot_active_recon_session_v5',
  MANUAL_INPUTS: 'finpilot_manual_inputs_v6',
  FORECAST_SNAPSHOTS: 'finpilot_forecast_snapshots_v7',
  FORECAST_SCENARIOS: 'finpilot_forecast_scenarios_v7',
  ANNUAL_REPORTS: 'finpilot_annual_reports_v8',
  ACTIVE_ANNUAL_REPORT_ID: 'finpilot_active_report_id_v8',
  ADVISORY_THRESHOLDS: 'finpilot_advisory_thresholds_v9',
  ADVISORY_ACTIONS: 'finpilot_advisory_actions_v9',
  ADVISORY_SNAPSHOTS: 'finpilot_advisory_snapshots_v9',
  EXECUTIVE_REPORTS: 'finpilot_saved_reports_v10',
} as const;
