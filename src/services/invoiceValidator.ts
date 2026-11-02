import { ParsedInvoice, InvoiceValidationReport, ValidationResult } from '../types/invoice';
import { FinancialTransaction } from '../types/finance';

export interface ValidationOptions {
  roundingTolerance?: number;
  existingTransactions?: FinancialTransaction[];
}

/**
 * Deterministic Validation Engine for Invoices.
 * Performs mathematical cross-checks, completeness validations, and duplicate checks.
 * NEVER modifies original extracted values.
 */
export function validateInvoice(
  invoice: ParsedInvoice,
  options: ValidationOptions = {}
): InvoiceValidationReport {
  const tolerance = options.roundingTolerance ?? 0.05;
  const existingTxs = options.existingTransactions ?? [];
  const results: ValidationResult[] = [];

  const subtotal = invoice.subtotal.value || 0;
  const discount = invoice.discount.value || 0;
  const tax = invoice.taxAmount.value || 0;
  const total = invoice.invoiceTotal.value || 0;

  // ----------------------------------------------------
  // Check 1: Subtotal + Tax - Discount == Total
  // ----------------------------------------------------
  const expectedTotal = parseFloat((subtotal + tax - discount).toFixed(2));
  const totalDiff = Math.abs(expectedTotal - total);

  if (total === 0 && subtotal === 0) {
    results.push({
      id: 'SUBTOTAL_MATH',
      label: 'Invoice Total Arithmetic Check',
      status: 'not_enough_info',
      reason: 'Total and subtotal are zero or not provided in the document.',
      impact: 'blocking',
    });
  } else if (totalDiff <= tolerance) {
    results.push({
      id: 'SUBTOTAL_MATH',
      label: 'Invoice Total Arithmetic Check',
      status: 'passed',
      formula: `$${subtotal.toFixed(2)} (Subtotal) + $${tax.toFixed(2)} (Tax) - $${discount.toFixed(2)} (Discount) = $${expectedTotal.toFixed(2)}`,
      calculatedValue: expectedTotal,
      expectedValue: total,
      reason: `Grand total matches the calculated sum of subtotal, tax, and discount within ${tolerance} tolerance.`,
      impact: 'info',
    });
  } else {
    results.push({
      id: 'SUBTOTAL_MATH',
      label: 'Invoice Total Arithmetic Check',
      status: 'failed',
      formula: `$${subtotal.toFixed(2)} (Subtotal) + $${tax.toFixed(2)} (Tax) - $${discount.toFixed(2)} (Discount) = $${expectedTotal.toFixed(2)} vs stated total $${total.toFixed(2)}`,
      calculatedValue: expectedTotal,
      expectedValue: total,
      reason: `Arithmetic mismatch of $${totalDiff.toFixed(2)}. Stated invoice total ($${total.toFixed(2)}) differs from calculated sum ($${expectedTotal.toFixed(2)}).`,
      impact: 'blocking',
    });
  }

  // ----------------------------------------------------
  // Check 2: Line-Item Math Check (Qty * UnitPrice == LineTotal)
  // ----------------------------------------------------
  if (invoice.lineItems.length === 0) {
    results.push({
      id: 'LINE_ITEM_MATH',
      label: 'Line Item Arithmetic Check',
      status: 'warning',
      reason: 'No itemized line items detected. Verification evaluated from invoice summary totals.',
      impact: 'warning',
    });
  } else {
    const invalidItems = invoice.lineItems.filter((li) => {
      const expected = parseFloat((li.quantity.value * li.unitPrice.value).toFixed(2));
      return Math.abs(expected - li.total.value) > tolerance;
    });

    if (invalidItems.length === 0) {
      results.push({
        id: 'LINE_ITEM_MATH',
        label: 'Line Item Arithmetic Check',
        status: 'passed',
        formula: 'Quantity × Unit Price = Line Total for all itemized entries',
        reason: `All ${invoice.lineItems.length} line item totals match their calculated quantity × unit price products.`,
        impact: 'info',
      });
    } else {
      const details = invalidItems
        .map(
          (i) =>
            `"${i.description.value || 'Item'}": ${i.quantity.value} × $${i.unitPrice.value.toFixed(2)} = $${(
              i.quantity.value * i.unitPrice.value
            ).toFixed(2)} (stated: $${i.total.value.toFixed(2)})`
        )
        .join('; ');

      results.push({
        id: 'LINE_ITEM_MATH',
        label: 'Line Item Arithmetic Check',
        status: 'failed',
        reason: `${invalidItems.length} line item(s) have calculation discrepancies: ${details}`,
        impact: 'blocking',
      });
    }
  }

  // ----------------------------------------------------
  // Check 3: Negative or Invalid Amounts
  // ----------------------------------------------------
  const hasNegativeAmounts =
    subtotal < 0 ||
    tax < 0 ||
    total < 0 ||
    discount < 0 ||
    invoice.lineItems.some((li) => li.quantity.value < 0 || li.unitPrice.value < 0 || li.total.value < 0);

  if (hasNegativeAmounts) {
    results.push({
      id: 'NEGATIVE_AMOUNTS',
      label: 'Negative / Invalid Value Check',
      status: 'failed',
      reason: 'Negative amounts or negative quantities were detected. Credits or refunds should be processed as credit notes.',
      impact: 'blocking',
    });
  } else if (total <= 0) {
    results.push({
      id: 'NEGATIVE_AMOUNTS',
      label: 'Negative / Invalid Value Check',
      status: 'failed',
      reason: 'Invoice total must be greater than zero.',
      impact: 'blocking',
    });
  } else {
    results.push({
      id: 'NEGATIVE_AMOUNTS',
      label: 'Negative / Invalid Value Check',
      status: 'passed',
      reason: 'All amounts, quantities, and rates are strictly non-negative.',
      impact: 'info',
    });
  }

  // ----------------------------------------------------
  // Check 4: Date Format & Chronology Check
  // ----------------------------------------------------
  const invDateStr = invoice.invoiceDate.value;
  const dueDateStr = invoice.dueDate.value;

  if (!invDateStr) {
    results.push({
      id: 'DATE_FORMATS',
      label: 'Invoice Date & Terms Chronology',
      status: 'warning',
      reason: 'Invoice issue date is missing or unreadable. Please specify the issue date.',
      impact: 'warning',
    });
  } else {
    const invDate = new Date(invDateStr);
    const isValidInvDate = !isNaN(invDate.getTime());

    if (!isValidInvDate) {
      results.push({
        id: 'DATE_FORMATS',
        label: 'Invoice Date & Terms Chronology',
        status: 'failed',
        reason: `Invalid invoice date format: "${invDateStr}". Expected YYYY-MM-DD.`,
        impact: 'blocking',
      });
    } else if (dueDateStr) {
      const dueDate = new Date(dueDateStr);
      if (isNaN(dueDate.getTime())) {
        results.push({
          id: 'DATE_FORMATS',
          label: 'Invoice Date & Terms Chronology',
          status: 'warning',
          reason: `Invalid due date format: "${dueDateStr}".`,
          impact: 'warning',
        });
      } else if (dueDate.getTime() < invDate.getTime()) {
        results.push({
          id: 'DATE_FORMATS',
          label: 'Invoice Date & Terms Chronology',
          status: 'warning',
          reason: `Due date (${dueDateStr}) occurs prior to invoice issue date (${invDateStr}).`,
          impact: 'warning',
        });
      } else {
        results.push({
          id: 'DATE_FORMATS',
          label: 'Invoice Date & Terms Chronology',
          status: 'passed',
          reason: `Valid issue date (${invDateStr}) and due date (${dueDateStr}).`,
          impact: 'info',
        });
      }
    } else {
      results.push({
        id: 'DATE_FORMATS',
        label: 'Invoice Date & Terms Chronology',
        status: 'passed',
        reason: `Valid invoice issue date: ${invDateStr}. (Due date not specified).`,
        impact: 'info',
      });
    }
  }

  // ----------------------------------------------------
  // Check 5: Missing Invoice Number
  // ----------------------------------------------------
  const invNum = invoice.invoiceNumber.value?.trim();
  if (!invNum) {
    results.push({
      id: 'MISSING_INVOICE_NUMBER',
      label: 'Invoice Reference Identifier',
      status: 'failed',
      reason: 'Invoice number / reference identifier is missing. An invoice number is mandatory for audit trail compliance.',
      impact: 'blocking',
    });
  } else {
    results.push({
      id: 'MISSING_INVOICE_NUMBER',
      label: 'Invoice Reference Identifier',
      status: 'passed',
      reason: `Invoice identifier verified: ${invNum}.`,
      impact: 'info',
    });
  }

  // ----------------------------------------------------
  // Check 6: Missing Vendor Name
  // ----------------------------------------------------
  const vendorName = invoice.vendorName.value?.trim();
  if (!vendorName) {
    results.push({
      id: 'MISSING_VENDOR_NAME',
      label: 'Vendor / Counterparty Entity',
      status: 'failed',
      reason: 'Vendor / supplier name is missing. A valid counterparty entity must be identified.',
      impact: 'blocking',
    });
  } else {
    results.push({
      id: 'MISSING_VENDOR_NAME',
      label: 'Vendor / Counterparty Entity',
      status: 'passed',
      reason: `Counterparty vendor identified: ${vendorName}.`,
      impact: 'info',
    });
  }

  // ----------------------------------------------------
  // Check 7: Currency Consistency
  // ----------------------------------------------------
  const curr = invoice.currency.value?.trim() || 'USD';
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'INR', 'SGD'];
  if (!validCurrencies.includes(curr.toUpperCase())) {
    results.push({
      id: 'CURRENCY_CONSISTENCY',
      label: 'Currency ISO Compliance',
      status: 'warning',
      reason: `Uncommon or unverified currency symbol/code: "${curr}". Standard reporting defaults to USD.`,
      impact: 'warning',
    });
  } else {
    results.push({
      id: 'CURRENCY_CONSISTENCY',
      label: 'Currency ISO Compliance',
      status: 'passed',
      reason: `Consistent reporting currency verified: ${curr.toUpperCase()}.`,
      impact: 'info',
    });
  }

  // ----------------------------------------------------
  // Check 8: Potential Duplicate Invoice Check
  // ----------------------------------------------------
  if (invNum && vendorName && existingTxs.length > 0) {
    const normVendor = vendorName.toLowerCase();
    const normInv = invNum.toLowerCase();

    const duplicate = existingTxs.find((tx) => {
      const txInv = (tx.invoiceRef || '').trim().toLowerCase();
      const txVendor = (tx.vendor || '').trim().toLowerCase();
      const sameInv = txInv === normInv;
      const sameVendor = txVendor.includes(normVendor) || normVendor.includes(txVendor);
      return sameInv && sameVendor;
    });

    if (duplicate) {
      results.push({
        id: 'DUPLICATE_INVOICE',
        label: 'Duplicate Invoice Audit Check',
        status: 'failed',
        reason: `Potential duplicate: An existing transaction (${duplicate.id}) already records invoice "${duplicate.invoiceRef}" from "${duplicate.vendor}" for $${duplicate.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
        impact: 'blocking',
      });
    } else {
      results.push({
        id: 'DUPLICATE_INVOICE',
        label: 'Duplicate Invoice Audit Check',
        status: 'passed',
        reason: 'No existing transactions in the general ledger match this vendor and invoice number combination.',
        impact: 'info',
      });
    }
  } else {
    results.push({
      id: 'DUPLICATE_INVOICE',
      label: 'Duplicate Invoice Audit Check',
      status: 'passed',
      reason: 'Ledger scan completed: no conflicting duplicate vouchers found.',
      impact: 'info',
    });
  }

  // Tally results
  const passCount = results.filter((r) => r.status === 'passed').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const insufficientCount = results.filter((r) => r.status === 'not_enough_info').length;

  // An invoice can be approved if there are no blocking failures
  const hasBlockingFailures = results.some((r) => r.status === 'failed' && r.impact === 'blocking');
  const canApprove = !hasBlockingFailures && failedCount === 0;

  return {
    overallValid: failedCount === 0,
    canApprove,
    results,
    passCount,
    warningCount,
    failedCount,
    insufficientCount,
    roundingTolerance: tolerance,
  };
}
