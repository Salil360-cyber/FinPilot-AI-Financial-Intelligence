/**
 * FinPilot AI - Phase 5: Bank Reconciliation & Transaction Matching Types
 * Strictly defined for deterministic enterprise financial operations.
 */

import { FinancialTransaction } from './finance';

export type BankAccountType = 'checking' | 'operating' | 'savings' | 'money_market' | 'credit_card';

export interface BankAccountProfile {
  id: string;
  name: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "•••• 4092"
  currency: string;
  accountType: BankAccountType;
  openingBalance: number;
  currentLedgerBalance: number;
  glAccountMapping: string; // Ledger account label, e.g. "Chase Operating •••• 4092"
  isActive: boolean;
}

export type BankTransactionType = 'debit' | 'credit';

export type BankMatchStatus =
  | 'unmatched'
  | 'exact_matched'
  | 'manually_matched'
  | 'review_required'
  | 'conflict'
  | 'excluded';

export type MatchTier = 'exact' | 'high_confidence' | 'review_required' | 'conflict' | 'no_match';

export interface MatchCandidate {
  ledgerTx: FinancialTransaction;
  score: number; // 0 to 100
  tier: MatchTier;
  signals: string[];
}

export interface BankStatementTransaction {
  id: string;
  sessionId: string;
  accountId: string;
  rowNumber: number;
  date: string; // YYYY-MM-DD
  valueDate?: string;
  description: string;
  counterparty: string;
  reference?: string;
  amount: number; // Positive number
  type: BankTransactionType; // 'debit' (withdrawal/payment) | 'credit' (deposit/revenue)
  runningBalance?: number;
  rawRow?: Record<string, string>;

  // Reconciliation state
  matchStatus: BankMatchStatus;
  matchedLedgerTxId?: string;
  matchedLedgerTx?: FinancialTransaction;
  matchConfidence?: number; // 0 - 100
  matchSignals?: string[];
  candidateMatches?: MatchCandidate[];

  // Exclusion audit
  exclusionReason?: string;
  excludedAt?: string;
  excludedBy?: string;

  // Manual GL post lineage
  postedToLedgerTxId?: string;
  postedAt?: string;
}

export type ReconciliationSessionStatus = 'in_progress' | 'completed' | 'reopened';

export interface ReconciliationSession {
  id: string;
  accountId: string;
  sessionName: string;
  statementPeriodStart: string;
  statementPeriodEnd: string;
  openingBalance: number;
  statementClosingBalance: number;
  status: ReconciliationSessionStatus;
  sourceFileName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  reopenedAt?: string;
  reopenedReason?: string;
  reopenedBy?: string;
  transactions: BankStatementTransaction[];
}

export interface ReconciliationBalanceSummary {
  openingBalance: number;
  totalDeposits: number; // Bank credits
  totalWithdrawals: number; // Bank debits
  netStatementMovement: number; // totalDeposits - totalWithdrawals
  calculatedClosingBalance: number; // openingBalance + netStatementMovement
  statementClosingBalance: number;
  statementDifference: number; // statementClosingBalance - calculatedClosingBalance

  // General ledger metrics
  matchedLedgerTotal: number;
  clearedDeposits: number;
  clearedWithdrawals: number;
  reconciledClosingBalance: number; // openingBalance + clearedDeposits - clearedWithdrawals
  unexplainedDifference: number; // statementClosingBalance - reconciledClosingBalance

  // Counts
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  reviewItems: number;
  conflictItems: number;
  excludedItems: number;
  postedItems: number;
  matchRatePercent: number;

  isBalanced: boolean;
  canComplete: boolean;
  completionBlockers: string[];
}

export interface BankCsvColumnMapping {
  date: string;
  valueDate?: string;
  description: string;
  counterparty?: string;
  reference?: string;
  amountMode: 'single_signed' | 'split_debit_credit';
  amount?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  dateFormat?: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'auto';
}

export interface BankStatementParseResult {
  validTransactions: Omit<BankStatementTransaction, 'id' | 'sessionId'>[];
  errors: { row: number; field: string; message: string; rawRow: Record<string, string> }[];
  warnings: { row: number; message: string }[];
  duplicateCount: number;
  detectedHeaders: string[];
  suggestedMapping: BankCsvColumnMapping;
  detectedDateRange: { start: string; end: string };
  detectedOpeningBalance?: number;
  detectedClosingBalance?: number;
}
