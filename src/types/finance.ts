/**
 * FinPilot AI - Financial & Accounting Automation Types
 * Strictly defined for enterprise financial operations.
 */

export type NavigationPage =
  | 'overview'
  | 'invoice-intelligence'
  | 'expense-ledger'
  | 'invoice-generator'
  | 'bank-reconciliation'
  | 'financial-analytics'
  | 'revenue-forecast'
  | 'annual-report'
  | 'ai-advisory'
  | 'executive-reports'
  | 'settings'
  | 'help-center';

export type TransactionStatus = 'matched' | 'unmatched' | 'review_required' | 'pending';

export type TransactionSource = 'demo' | 'user_uploaded' | 'imported_bank_statement' | 'manual_entry';

export type LedgerStatus = 'posted' | 'cancelled' | 'pending_clearing';

export type EntryType = 'expense' | 'revenue' | 'credit_refund' | 'transfer' | 'bank_movement';

export interface FinancialTransaction {
  id: string;
  date: string;
  vendor: string;
  category: string;
  account: string;
  amount: number;
  type: 'debit' | 'credit';
  status: TransactionStatus;
  description?: string;
  invoiceRef?: string;
  reconciliationNotes?: string;
  confidenceScore?: number;
  source?: TransactionSource;
  ledgerStatus?: LedgerStatus;
  entryType?: EntryType;
  subtotal?: number;
  taxAmount?: number;
  currency?: string;
  sourceFileName?: string;
  approvedAt?: string;
  validationSummary?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  cancelledBy?: string;
  editedAt?: string;
  editedFields?: string[];
  importBatchId?: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  timeframe: string;
  subtext: string;
}

export interface MonthlyFinancialPoint {
  month: string;
  expenses: number;
  revenue: number;
  forecast: number;
  budget: number;
}

export interface ExpenseCategoryPoint {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactionCount: number;
}

export interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'invoice' | 'reconciliation' | 'ledger' | 'system' | 'report';
  user: string;
  status: 'completed' | 'flagged' | 'in_progress';
}

export interface DemoInsight {
  id: string;
  title: string;
  summary: string;
  impact: 'neutral' | 'positive' | 'warning';
  metric: string;
  recommendation: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'success' | 'info';
  linkPage?: NavigationPage;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  avatarUrl?: string;
  reportingCurrency: string;
  fiscalYearEnd: string;
}
