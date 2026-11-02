/**
 * FinPilot AI - Phase 5: Deterministic Bank Reconciliation Engine
 *
 * Rules:
 * - Deterministic financial math with 2-decimal currency rounding.
 * - Explicit matching criteria (Amount, Date window, Direction, Reference, Vendor).
 * - Rigorous conflict detection.
 * - Bank statement rows are never auto-posted to General Ledger.
 * - OWASP formula injection protection on CSV reports.
 */

import { FinancialTransaction } from '../types/finance';
import {
  BankStatementTransaction,
  MatchCandidate,
  MatchTier,
  ReconciliationBalanceSummary,
  ReconciliationSession,
  BankCsvColumnMapping,
  BankStatementParseResult,
} from '../types/reconciliation';
import { parseCsvText, sanitizeForSpreadsheet, serializeToCsv, parseCleanAmount, parseCleanDate } from './csvParser';
import { roundCurrency } from './salesInvoiceCalculator';

/**
 * Normalizes text for financial entity comparison.
 * Strips punctuation, lowercase, removes corporate designators.
 */
export function normalizeEntityName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(inc|corp|corporation|llc|ltd|co|limited|company|services|technologies|group|holdings|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes reference numbers (e.g. "INV-2026-0042" -> "20260042").
 */
export function normalizeReference(ref: string): string {
  if (!ref) return '';
  return ref.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates date difference in absolute calendar days.
 */
export function getDateDiffDays(dateStrA: string, dateStrB: string): number {
  if (!dateStrA || !dateStrB) return 999;
  const timeA = new Date(dateStrA).getTime();
  const timeB = new Date(dateStrB).getTime();
  if (isNaN(timeA) || isNaN(timeB)) return 999;
  const diffMs = Math.abs(timeA - timeB);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Checks if directional signs align:
 * In FinPilot:
 * - Bank 'debit' = money leaving bank (operating expenses, vendor bills) -> GL 'debit' entryType 'expense'
 * - Bank 'credit' = money entering bank (customer payments, client revenue, refunds) -> GL 'credit' entryType 'revenue'/'credit_refund'
 */
export function isDirectionCompatible(bankType: 'debit' | 'credit', glTx: FinancialTransaction): boolean {
  if (bankType === 'debit') {
    // Bank debit is an outflow. GL expenses/payments are debits.
    return glTx.type === 'debit';
  } else {
    // Bank credit is an inflow. GL revenue/refunds are credits.
    return glTx.type === 'credit';
  }
}

/**
 * Evaluates candidate GL transaction against a bank statement transaction.
 */
export function evaluateCandidateMatch(
  bankTx: BankStatementTransaction,
  glTx: FinancialTransaction,
  dateToleranceDays: number = 3
): MatchCandidate | null {
  // 1. Direction check: debit must match debit, credit must match credit
  if (!isDirectionCompatible(bankTx.type, glTx)) {
    return null;
  }

  // 2. Amount check: must match within $0.005
  const amountDiff = Math.abs(roundCurrency(bankTx.amount) - roundCurrency(glTx.amount));
  if (amountDiff > 0.005) {
    return null;
  }

  const signals: string[] = [];
  let score = 50; // Base score for exact amount & direction match
  signals.push(`Exact amount match: $${bankTx.amount.toFixed(2)} (${bankTx.type.toUpperCase()})`);

  // 3. Date check
  const daysApart = getDateDiffDays(bankTx.date, glTx.date);
  if (daysApart === 0) {
    score += 25;
    signals.push('Same-day posting date');
  } else if (daysApart <= dateToleranceDays) {
    score += Math.max(10, 25 - daysApart * 4);
    signals.push(`Date within clearing window (${daysApart} day${daysApart > 1 ? 's' : ''} apart)`);
  } else if (daysApart <= 14) {
    score -= 10;
    signals.push(`Date variance outside standard window (${daysApart} days apart)`);
  } else {
    // Over 14 days apart for same amount
    score -= 30;
    signals.push(`High date variance (${daysApart} days apart)`);
  }

  // 4. Reference / Invoice matching
  const normBankRef = normalizeReference(bankTx.reference || '');
  const normBankDesc = normalizeReference(bankTx.description || '');
  const normGlInv = normalizeReference(glTx.invoiceRef || '');
  const normGlId = normalizeReference(glTx.id || '');

  let referenceMatched = false;
  if (normBankRef && normGlInv && (normBankRef === normGlInv || normBankRef.includes(normGlInv) || normGlInv.includes(normBankRef))) {
    score += 30;
    referenceMatched = true;
    signals.push(`Reference matches invoice voucher: ${glTx.invoiceRef}`);
  } else if (normGlInv && normBankDesc && normBankDesc.includes(normGlInv)) {
    score += 25;
    referenceMatched = true;
    signals.push(`Description references invoice: ${glTx.invoiceRef}`);
  } else if (normBankRef && normGlId && normBankRef.includes(normGlId)) {
    score += 25;
    referenceMatched = true;
    signals.push(`Statement reference matches Ledger ID: ${glTx.id}`);
  }

  // 5. Vendor / Counterparty token matching
  const normBankVendor = normalizeEntityName(bankTx.counterparty || bankTx.description || '');
  const normGlVendor = normalizeEntityName(glTx.vendor || '');

  let vendorMatched = false;
  if (normBankVendor && normGlVendor) {
    if (normBankVendor === normGlVendor) {
      score += 25;
      vendorMatched = true;
      signals.push(`Exact counterparty match: "${glTx.vendor}"`);
    } else {
      const bankTokens = normBankVendor.split(' ').filter((t) => t.length > 2);
      const glTokens = normGlVendor.split(' ').filter((t) => t.length > 2);
      const sharedTokens = bankTokens.filter((t) => glTokens.includes(t));

      if (sharedTokens.length > 0) {
        score += 15;
        vendorMatched = true;
        signals.push(`Counterparty partial name match: "${glTx.vendor}"`);
      }
    }
  }

  // Classify match tier
  let tier: MatchTier = 'review_required';
  if ((referenceMatched && daysApart <= 7) || (vendorMatched && daysApart <= 1 && score >= 90)) {
    tier = 'exact';
  } else if (daysApart <= dateToleranceDays && (vendorMatched || referenceMatched || score >= 75)) {
    tier = 'high_confidence';
  } else if (score >= 40) {
    tier = 'review_required';
  } else {
    tier = 'no_match';
  }

  return {
    ledgerTx: glTx,
    score: Math.min(100, Math.max(0, score)),
    tier,
    signals,
  };
}

/**
 * Finds all potential matching GL candidates for a single bank transaction.
 */
export function findMatchesForBankTransaction(
  bankTx: BankStatementTransaction,
  eligibleLedgerTxs: FinancialTransaction[],
  dateToleranceDays: number = 3
): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];

  for (const glTx of eligibleLedgerTxs) {
    if (glTx.ledgerStatus === 'cancelled') continue;
    const match = evaluateCandidateMatch(bankTx, glTx, dateToleranceDays);
    if (match && match.tier !== 'no_match') {
      candidates.push(match);
    }
  }

  // Sort candidates by score descending, then by date proximity
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const diffA = getDateDiffDays(bankTx.date, a.ledgerTx.date);
    const diffB = getDateDiffDays(bankTx.date, b.ledgerTx.date);
    return diffA - diffB;
  });

  return candidates;
}

/**
 * Runs the deterministic auto-match engine across an entire session's transactions.
 * Flags multi-candidate collisions as 'conflict'.
 */
export function executeBatchMatchEngine(
  sessionTransactions: BankStatementTransaction[],
  generalLedgerTxs: FinancialTransaction[],
  dateToleranceDays: number = 3
): {
  updatedTransactions: BankStatementTransaction[];
  newExactMatches: number;
  newHighConfidence: number;
  conflicts: number;
} {
  // Only search active, non-cancelled GL transactions
  const activeGl = generalLedgerTxs.filter((t) => t.ledgerStatus !== 'cancelled');

  // Track already linked GL transactions
  const usedLedgerIds = new Set<string>();
  sessionTransactions.forEach((tx) => {
    if (tx.matchStatus === 'exact_matched' || tx.matchStatus === 'manually_matched') {
      if (tx.matchedLedgerTxId) usedLedgerIds.add(tx.matchedLedgerTxId);
    }
  });

  let newExactMatches = 0;
  let newHighConfidence = 0;
  let conflicts = 0;

  const updatedTransactions: BankStatementTransaction[] = sessionTransactions.map((bankTx) => {
    // Preserve manual matches, explicit exclusions, or already completed postings
    if (
      bankTx.matchStatus === 'manually_matched' ||
      bankTx.matchStatus === 'excluded' ||
      bankTx.postedToLedgerTxId
    ) {
      return bankTx;
    }

    // Available GL pool: exclude those claimed by other transactions
    const availablePool = activeGl.filter(
      (gl) => !usedLedgerIds.has(gl.id) || gl.id === bankTx.matchedLedgerTxId
    );

    const candidates = findMatchesForBankTransaction(bankTx, availablePool, dateToleranceDays);

    if (candidates.length === 0) {
      return {
        ...bankTx,
        matchStatus: 'unmatched',
        matchedLedgerTxId: undefined,
        matchedLedgerTx: undefined,
        matchConfidence: 0,
        matchSignals: ['No general ledger entry found matching amount and direction.'],
        candidateMatches: [],
      };
    }

    // Check for conflict: multiple candidates with equal top scores
    if (
      candidates.length > 1 &&
      candidates[0].score === candidates[1].score &&
      candidates[0].score >= 70
    ) {
      conflicts++;
      return {
        ...bankTx,
        matchStatus: 'conflict',
        matchedLedgerTxId: undefined,
        matchedLedgerTx: undefined,
        matchConfidence: candidates[0].score,
        matchSignals: [
          `Conflict: Multiple ledger transactions (${candidates.length}) share identical amount ($${bankTx.amount.toFixed(2)}) and scoring criteria.`,
        ],
        candidateMatches: candidates,
      };
    }

    const bestCandidate = candidates[0];

    if (bestCandidate.tier === 'exact') {
      newExactMatches++;
      usedLedgerIds.add(bestCandidate.ledgerTx.id);
      return {
        ...bankTx,
        matchStatus: 'exact_matched',
        matchedLedgerTxId: bestCandidate.ledgerTx.id,
        matchedLedgerTx: bestCandidate.ledgerTx,
        matchConfidence: bestCandidate.score,
        matchSignals: bestCandidate.signals,
        candidateMatches: candidates,
      };
    } else if (bestCandidate.tier === 'high_confidence') {
      newHighConfidence++;
      usedLedgerIds.add(bestCandidate.ledgerTx.id);
      return {
        ...bankTx,
        matchStatus: 'exact_matched', // Auto-cleared in high confidence
        matchedLedgerTxId: bestCandidate.ledgerTx.id,
        matchedLedgerTx: bestCandidate.ledgerTx,
        matchConfidence: bestCandidate.score,
        matchSignals: bestCandidate.signals,
        candidateMatches: candidates,
      };
    } else {
      // Review required
      return {
        ...bankTx,
        matchStatus: 'review_required',
        matchedLedgerTxId: undefined,
        matchedLedgerTx: undefined,
        matchConfidence: bestCandidate.score,
        matchSignals: bestCandidate.signals,
        candidateMatches: candidates,
      };
    }
  });

  return {
    updatedTransactions,
    newExactMatches,
    newHighConfidence,
    conflicts,
  };
}

/**
 * Calculates comprehensive reconciliation balances and enforces completion criteria.
 */
export function calculateReconciliationBalances(
  session: ReconciliationSession,
  allLedgerTransactions: FinancialTransaction[]
): ReconciliationBalanceSummary {
  const opening = roundCurrency(session.openingBalance);
  const closing = roundCurrency(session.statementClosingBalance);

  let totalDeposits = 0; // Bank credits
  let totalWithdrawals = 0; // Bank debits

  let matchedItems = 0;
  let unmatchedItems = 0;
  let reviewItems = 0;
  let conflictItems = 0;
  let excludedItems = 0;
  let postedItems = 0;

  let clearedDeposits = 0;
  let clearedWithdrawals = 0;

  const ledgerMap = new Map<string, FinancialTransaction>();
  allLedgerTransactions.forEach((tx) => ledgerMap.set(tx.id, tx));

  for (const bTx of session.transactions) {
    const amt = roundCurrency(bTx.amount);

    if (bTx.type === 'credit') {
      totalDeposits = roundCurrency(totalDeposits + amt);
    } else {
      totalWithdrawals = roundCurrency(totalWithdrawals + amt);
    }

    if (bTx.postedToLedgerTxId) {
      postedItems++;
    }

    switch (bTx.matchStatus) {
      case 'exact_matched':
      case 'manually_matched': {
        matchedItems++;
        if (bTx.type === 'credit') {
          clearedDeposits = roundCurrency(clearedDeposits + amt);
        } else {
          clearedWithdrawals = roundCurrency(clearedWithdrawals + amt);
        }
        break;
      }
      case 'review_required':
        reviewItems++;
        break;
      case 'conflict':
        conflictItems++;
        break;
      case 'excluded':
        excludedItems++;
        break;
      case 'unmatched':
      default:
        unmatchedItems++;
        break;
    }
  }

  const netStatementMovement = roundCurrency(totalDeposits - totalWithdrawals);
  const calculatedClosingBalance = roundCurrency(opening + netStatementMovement);
  const statementDifference = roundCurrency(closing - calculatedClosingBalance);

  // Reconciled balance based on cleared transactions
  const matchedLedgerTotal = roundCurrency(clearedDeposits - clearedWithdrawals);
  const reconciledClosingBalance = roundCurrency(opening + matchedLedgerTotal);
  const unexplainedDifference = roundCurrency(closing - reconciledClosingBalance);

  const totalItems = session.transactions.length;
  const matchRatePercent = totalItems > 0 ? roundCurrency((matchedItems / totalItems) * 100) : 100;

  const isBalanced = Math.abs(unexplainedDifference) < 0.005;

  const completionBlockers: string[] = [];

  if (totalItems === 0) {
    completionBlockers.push('Session contains no bank statement transactions.');
  }
  if (!isBalanced) {
    completionBlockers.push(
      `Unexplained difference of $${Math.abs(unexplainedDifference).toFixed(2)} must be zero before completing.`
    );
  }
  if (reviewItems > 0) {
    completionBlockers.push(
      `${reviewItems} item${reviewItems > 1 ? 's' : ''} in "Review Required" must be accepted, rejected, or cleared.`
    );
  }
  if (conflictItems > 0) {
    completionBlockers.push(
      `${conflictItems} transaction conflict${conflictItems > 1 ? 's' : ''} must be manually resolved.`
    );
  }
  if (unmatchedItems > 0) {
    completionBlockers.push(
      `${unmatchedItems} unmatched transaction${unmatchedItems > 1 ? 's' : ''} remain. Post them to the ledger or mark as excluded with reason.`
    );
  }

  const canComplete = completionBlockers.length === 0;

  return {
    openingBalance: opening,
    totalDeposits,
    totalWithdrawals,
    netStatementMovement,
    calculatedClosingBalance,
    statementClosingBalance: closing,
    statementDifference,
    matchedLedgerTotal,
    clearedDeposits,
    clearedWithdrawals,
    reconciledClosingBalance,
    unexplainedDifference,
    totalItems,
    matchedItems,
    unmatchedItems,
    reviewItems,
    conflictItems,
    excludedItems,
    postedItems,
    matchRatePercent,
    isBalanced,
    canComplete,
    completionBlockers,
  };
}

/**
 * Validates whether a reconciliation session can be officially closed and completed.
 */
export function validateSessionCompletion(
  session: ReconciliationSession,
  allLedgerTransactions: FinancialTransaction[]
): { isValid: boolean; errors: string[]; summary: ReconciliationBalanceSummary } {
  const summary = calculateReconciliationBalances(session, allLedgerTransactions);
  return {
    isValid: summary.canComplete,
    errors: summary.completionBlockers,
    summary,
  };
}

/**
 * Parses and validates CSV statement content with flexible column mapping.
 */
export function parseBankStatementCsv(
  csvText: string,
  mapping: BankCsvColumnMapping,
  existingTransactions: BankStatementTransaction[] = []
): BankStatementParseResult {
  const parsed = parseCsvText(csvText);
  const headers = parsed.headers;
  const rows = parsed.rows;

  const errors: { row: number; field: string; message: string; rawRow: Record<string, string> }[] = [];
  const warnings: { row: number; message: string }[] = [];
  const validTransactions: Omit<BankStatementTransaction, 'id' | 'sessionId'>[] = [];
  let duplicateCount = 0;

  // Build existing signature set for duplicate detection
  const existingSignatures = new Set<string>();
  existingTransactions.forEach((t) => {
    existingSignatures.add(`${t.date}|${t.amount.toFixed(2)}|${t.type}|${(t.reference || '').trim().toLowerCase()}`);
  });

  const getColIndex = (colName?: string) => {
    if (!colName) return -1;
    return headers.findIndex((h) => h.toLowerCase().trim() === colName.toLowerCase().trim());
  };

  const dateIdx = getColIndex(mapping.date);
  const valDateIdx = getColIndex(mapping.valueDate);
  const descIdx = getColIndex(mapping.description);
  const counterpartyIdx = getColIndex(mapping.counterparty);
  const refIdx = getColIndex(mapping.reference);
  const balanceIdx = getColIndex(mapping.balance);

  const amountIdx = getColIndex(mapping.amount);
  const debitIdx = getColIndex(mapping.debit);
  const creditIdx = getColIndex(mapping.credit);

  let minDate = '';
  let maxDate = '';

  rows.forEach((rowCells, rIdx) => {
    const rowNum = rIdx + 2; // 1-indexed, accounting for header
    const rawRowRecord: Record<string, string> = {};
    headers.forEach((h, i) => {
      rawRowRecord[h] = rowCells[i] || '';
    });

    // Extract Date
    const rawDate = dateIdx >= 0 ? rowCells[dateIdx] : '';
    const cleanDate = parseCleanDate(rawDate);
    if (!cleanDate) {
      errors.push({
        row: rowNum,
        field: 'date',
        message: `Invalid or missing date "${rawDate}". Expected standard format (YYYY-MM-DD or MM/DD/YYYY).`,
        rawRow: rawRowRecord,
      });
      return;
    }

    if (!minDate || cleanDate < minDate) minDate = cleanDate;
    if (!maxDate || cleanDate > maxDate) maxDate = cleanDate;

    // Extract Description / Counterparty
    const rawDesc = descIdx >= 0 ? rowCells[descIdx] || '' : '';
    const rawCounterparty = counterpartyIdx >= 0 ? rowCells[counterpartyIdx] || '' : '';
    const description = rawDesc.trim() || rawCounterparty.trim() || 'Bank Statement Line';
    const counterparty = rawCounterparty.trim() || rawDesc.trim();

    // Extract Reference
    const reference = refIdx >= 0 ? (rowCells[refIdx] || '').trim() : undefined;

    // Extract Amount and Direction
    let amount = 0;
    let type: 'debit' | 'credit' = 'debit';

    if (mapping.amountMode === 'split_debit_credit') {
      const rawDebit = debitIdx >= 0 ? rowCells[debitIdx] : '';
      const rawCredit = creditIdx >= 0 ? rowCells[creditIdx] : '';
      const debitAmt = parseCleanAmount(rawDebit);
      const creditAmt = parseCleanAmount(rawCredit);

      if (debitAmt !== null && debitAmt > 0) {
        amount = roundCurrency(debitAmt);
        type = 'debit';
      } else if (creditAmt !== null && creditAmt > 0) {
        amount = roundCurrency(creditAmt);
        type = 'credit';
      } else {
        errors.push({
          row: rowNum,
          field: 'amount',
          message: 'Both debit and credit amounts are zero or empty.',
          rawRow: rawRowRecord,
        });
        return;
      }
    } else {
      // Single amount column
      const rawAmtStr = amountIdx >= 0 ? rowCells[amountIdx] : '';
      const cleanNumeric = parseFloat(rawAmtStr.replace(/[^\d.-]/g, ''));

      if (isNaN(cleanNumeric) || cleanNumeric === 0) {
        errors.push({
          row: rowNum,
          field: 'amount',
          message: `Invalid or zero amount "${rawAmtStr}".`,
          rawRow: rawRowRecord,
        });
        return;
      }

      amount = roundCurrency(Math.abs(cleanNumeric));
      // In single column banking conventions: negative = debit (outflow), positive = credit (inflow)
      type = cleanNumeric < 0 ? 'debit' : 'credit';
    }

    // Optional running balance
    const rawBalance = balanceIdx >= 0 ? rowCells[balanceIdx] : '';
    const runningBalance = rawBalance ? parseCleanAmount(rawBalance) ?? undefined : undefined;

    // Duplicate transaction check
    const signature = `${cleanDate}|${amount.toFixed(2)}|${type}|${(reference || '').trim().toLowerCase()}`;
    if (existingSignatures.has(signature)) {
      duplicateCount++;
      warnings.push({
        row: rowNum,
        message: `Possible duplicate transaction detected: ${cleanDate} $${amount.toFixed(2)} (${type}) [${reference || 'no ref'}].`,
      });
    } else {
      existingSignatures.add(signature);
    }

    validTransactions.push({
      accountId: '', // Set by caller
      rowNumber: rowNum,
      date: cleanDate,
      valueDate: valDateIdx >= 0 && rowCells[valDateIdx] ? parseCleanDate(rowCells[valDateIdx]) ?? undefined : undefined,
      description,
      counterparty,
      reference: reference || undefined,
      amount,
      type,
      runningBalance,
      rawRow: rawRowRecord,
      matchStatus: 'unmatched',
    });
  });

  return {
    validTransactions,
    errors,
    warnings,
    duplicateCount,
    detectedHeaders: headers,
    suggestedMapping: mapping,
    detectedDateRange: { start: minDate, end: maxDate },
  };
}

/**
 * Auto-suggests column mappings from headers.
 */
export function autoSuggestBankMapping(headers: string[]): BankCsvColumnMapping {
  const mapping: BankCsvColumnMapping = {
    date: '',
    description: '',
    amountMode: 'single_signed',
  };

  const hasDebit = headers.some((h) => /debit|dr|withdrawal|outflow|spent/i.test(h));
  const hasCredit = headers.some((h) => /credit|cr|deposit|inflow|received/i.test(h));

  if (hasDebit && hasCredit) {
    mapping.amountMode = 'split_debit_credit';
  }

  headers.forEach((h) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!mapping.date && (clean.includes('date') || clean === 'dt' || clean.includes('postdate'))) {
      mapping.date = h;
    } else if (!mapping.valueDate && clean.includes('valdate')) {
      mapping.valueDate = h;
    } else if (!mapping.description && (clean.includes('desc') || clean.includes('memo') || clean.includes('narrative') || clean.includes('detail'))) {
      mapping.description = h;
    } else if (!mapping.counterparty && (clean.includes('payee') || clean.includes('vendor') || clean.includes('merchant') || clean.includes('counterparty'))) {
      mapping.counterparty = h;
    } else if (!mapping.reference && (clean.includes('ref') || clean.includes('check') || clean.includes('cheque') || clean.includes('txid'))) {
      mapping.reference = h;
    } else if (!mapping.debit && (clean.includes('debit') || clean === 'dr' || clean.includes('withdrawal'))) {
      mapping.debit = h;
    } else if (!mapping.credit && (clean.includes('credit') || clean === 'cr' || clean.includes('deposit'))) {
      mapping.credit = h;
    } else if (!mapping.amount && (clean === 'amount' || clean === 'netamount' || clean === 'transamount')) {
      mapping.amount = h;
    } else if (!mapping.balance && (clean.includes('balance') || clean.includes('runningbal'))) {
      mapping.balance = h;
    }
  });

  return mapping;
}

/**
 * Exports complete Reconciliation Report to RFC 4180 CSV with formula injection defense.
 */
export function exportReconciliationReportCsv(
  session: ReconciliationSession,
  summary: ReconciliationBalanceSummary
): string {
  const metaHeaders = ['Reconciliation Audit Report', 'FinPilot AI Enterprise'];
  const metaRows: (string | number)[][] = [
    ['Session ID', sanitizeForSpreadsheet(session.id)],
    ['Session Name', sanitizeForSpreadsheet(session.sessionName)],
    ['Account ID', sanitizeForSpreadsheet(session.accountId)],
    ['Period', `${session.statementPeriodStart} to ${session.statementPeriodEnd}`],
    ['Statement Source', sanitizeForSpreadsheet(session.sourceFileName)],
    ['Reconciliation Status', session.status.toUpperCase()],
    ['Generated At', new Date().toISOString()],
    ['Opening Balance', session.openingBalance.toFixed(2)],
    ['Total Statement Deposits', summary.totalDeposits.toFixed(2)],
    ['Total Statement Withdrawals', summary.totalWithdrawals.toFixed(2)],
    ['Net Statement Movement', summary.netStatementMovement.toFixed(2)],
    ['Statement Closing Balance', summary.statementClosingBalance.toFixed(2)],
    ['Calculated Closing Balance', summary.calculatedClosingBalance.toFixed(2)],
    ['Cleared Deposits', summary.clearedDeposits.toFixed(2)],
    ['Cleared Withdrawals', summary.clearedWithdrawals.toFixed(2)],
    ['Reconciled GL Closing Balance', summary.reconciledClosingBalance.toFixed(2)],
    ['Unexplained Difference', summary.unexplainedDifference.toFixed(2)],
    ['Is Fully Reconciled', summary.isBalanced ? 'YES' : 'NO'],
    ['Match Rate (%)', `${summary.matchRatePercent}%`],
    [],
    ['--- Statement Line Details ---'],
  ];

  const txHeaders = [
    'Line #',
    'Date',
    'Description',
    'Counterparty',
    'Reference',
    'Type',
    'Amount',
    'Match Status',
    'Matched Ledger Voucher',
    'Match Score',
    'Match Evidence',
    'Exclusion Reason',
  ];

  const txRows = session.transactions.map((t) => [
    t.rowNumber,
    t.date,
    sanitizeForSpreadsheet(t.description),
    sanitizeForSpreadsheet(t.counterparty),
    sanitizeForSpreadsheet(t.reference || ''),
    t.type.toUpperCase(),
    t.amount.toFixed(2),
    t.matchStatus.toUpperCase(),
    sanitizeForSpreadsheet(t.matchedLedgerTxId || t.postedToLedgerTxId || 'N/A'),
    t.matchConfidence ? `${t.matchConfidence}%` : 'N/A',
    sanitizeForSpreadsheet((t.matchSignals || []).join('; ')),
    sanitizeForSpreadsheet(t.exclusionReason || ''),
  ]);

  const metaCsv = serializeToCsv(metaHeaders, metaRows);
  const txCsv = serializeToCsv(txHeaders, txRows);

  return `${metaCsv}\n\n${txCsv}`;
}
