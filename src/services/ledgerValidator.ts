import { FinancialTransaction } from '../types/finance';
import { parseCleanDate, parseCleanAmount } from './csvParser';

export interface LedgerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR', 'SGD', 'NZD'];

/**
 * Validates a single transaction for financial integrity before posting to the ledger.
 */
export function validateLedgerTransaction(
  tx: Partial<FinancialTransaction>,
  existingTransactions: FinancialTransaction[] = []
): LedgerValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Vendor / Counterparty
  if (!tx.vendor || !tx.vendor.trim()) {
    errors.push('Vendor or counterparty name is required.');
  }

  // 2. Date
  if (!tx.date || !tx.date.trim()) {
    errors.push('Transaction date is required.');
  } else {
    const cleanDate = parseCleanDate(tx.date);
    if (!cleanDate) {
      errors.push(`Invalid calendar date: "${tx.date}". Expected valid format YYYY-MM-DD.`);
    }
  }

  // 3. Amount & Monetary Value
  if (tx.amount === undefined || tx.amount === null || isNaN(tx.amount)) {
    errors.push('Valid monetary amount is required.');
  } else if (tx.amount <= 0) {
    errors.push(`Monetary amount must be greater than zero. Received: ${tx.amount}`);
  }

  // 4. Debit / Credit Type
  if (!tx.type || !['debit', 'credit'].includes(tx.type)) {
    errors.push('Transaction type must be explicitly specified as "debit" or "credit".');
  }

  // 5. Currency
  const ccy = (tx.currency || 'USD').toUpperCase();
  if (!VALID_CURRENCIES.includes(ccy)) {
    warnings.push(`Unrecognized or non-standard currency code: "${ccy}". Standard reporting uses USD.`);
  }

  // 6. Category
  if (!tx.category || !tx.category.trim()) {
    warnings.push('Expense category not assigned; defaulting to "Operating Expenses".');
  }

  // 7. Duplicate Check
  if (tx.vendor && tx.date && tx.amount && existingTransactions.length > 0) {
    const normVendor = tx.vendor.trim().toLowerCase();
    const normDate = tx.date.trim();
    const amt = tx.amount;
    const invRef = (tx.invoiceRef || '').trim().toLowerCase();

    const dup = existingTransactions.find((existing) => {
      // Exclude self if editing
      if (tx.id && existing.id === tx.id) return false;
      // Exclude cancelled transactions
      if (existing.ledgerStatus === 'cancelled') return false;

      const exVendor = (existing.vendor || '').trim().toLowerCase();
      const exDate = (existing.date || '').trim();
      const exInv = (existing.invoiceRef || '').trim().toLowerCase();
      const exAmt = existing.amount;

      // Exact invoice ref match from same vendor
      if (invRef && exInv && invRef === exInv && (exVendor.includes(normVendor) || normVendor.includes(exVendor))) {
        return true;
      }

      // Exact vendor + date + amount match
      if (exDate === normDate && Math.abs(exAmt - amt) < 0.01 && (exVendor === normVendor || (exVendor.includes(normVendor) && normVendor.length > 4))) {
        return true;
      }

      return false;
    });

    if (dup) {
      warnings.push(`Potential duplicate detected: Matches existing voucher ${dup.id} (${dup.vendor}, $${dup.amount.toFixed(2)} on ${dup.date}).`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
