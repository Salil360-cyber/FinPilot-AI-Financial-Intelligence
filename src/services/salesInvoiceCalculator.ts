/**
 * FinPilot AI - Phase 4 Deterministic Sales Invoice Calculation & Validation Engine
 * Eliminates floating point inaccuracies using 2-decimal rounding.
 */

import {
  SalesInvoice,
  SalesLineItem,
  TaxConfiguration,
  TaxBreakdownItem,
  SalesInvoiceStatus,
  InvoicePayment,
} from '../types/salesInvoice';

/**
 * Deterministically rounds a financial amount to 2 decimal places using standard banking round-half-up.
 */
export function roundCurrency(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Validates a numeric value ensuring it is finite and within allowed financial bounds.
 */
export function validateNumericInput(
  val: any,
  fieldName: string,
  min: number = 0,
  allowZero: boolean = true
): { isValid: boolean; error?: string; cleanValue: number } {
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${fieldName} must be a valid finite number.`, cleanValue: 0 };
  }
  if (allowZero ? num < min : num <= min) {
    return {
      isValid: false,
      error: `${fieldName} must be ${allowZero ? 'greater than or equal to' : 'strictly greater than'} ${min}.`,
      cleanValue: 0,
    };
  }
  return { isValid: true, cleanValue: num };
}

/**
 * Calculates line-item totals deterministically.
 */
export function calculateLineItem(
  item: Omit<SalesLineItem, 'lineSubtotal' | 'lineDiscountAmount' | 'taxableAmount' | 'lineTaxAmount' | 'lineTotal'>
): SalesLineItem {
  const qty = isNaN(item.quantity) || !isFinite(item.quantity) || item.quantity <= 0 ? 0 : item.quantity;
  const unitPrice = isNaN(item.unitPrice) || !isFinite(item.unitPrice) || item.unitPrice < 0 ? 0 : item.unitPrice;
  const discountVal = isNaN(item.discount) || !isFinite(item.discount) || item.discount < 0 ? 0 : item.discount;
  const taxRate = isNaN(item.taxRate) || !isFinite(item.taxRate) || item.taxRate < 0 ? 0 : item.taxRate;

  const lineSubtotal = roundCurrency(qty * unitPrice);

  let lineDiscountAmount = 0;
  if (item.discountType === 'percent') {
    const cappedPercent = Math.min(100, Math.max(0, discountVal));
    lineDiscountAmount = roundCurrency(lineSubtotal * (cappedPercent / 100));
  } else {
    lineDiscountAmount = roundCurrency(Math.min(lineSubtotal, discountVal));
  }

  const taxableAmount = roundCurrency(Math.max(0, lineSubtotal - lineDiscountAmount));
  const lineTaxAmount = roundCurrency((taxableAmount * taxRate) / 100);
  const lineTotal = roundCurrency(taxableAmount + lineTaxAmount);

  return {
    ...item,
    quantity: qty,
    unitPrice,
    discount: discountVal,
    taxRate,
    lineSubtotal,
    lineDiscountAmount,
    taxableAmount,
    lineTaxAmount,
    lineTotal,
  };
}

/**
 * Recalculates all line items, tax breakdowns, invoice-level discounts, and balances for an invoice.
 */
export function calculateSalesInvoiceTotals(
  invoice: Partial<SalesInvoice> & { items: SalesLineItem[]; taxConfig: TaxConfiguration }
): {
  items: SalesLineItem[];
  subtotal: number;
  totalLineDiscounts: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  taxBreakdown: TaxBreakdownItem[];
  totalTaxAmount: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
} {
  const items = (invoice.items || []).map((item) => calculateLineItem(item));

  // 1. Line subtotals and discounts
  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const totalLineDiscounts = roundCurrency(items.reduce((sum, item) => sum + item.lineDiscountAmount, 0));
  const netLineTotal = roundCurrency(Math.max(0, subtotal - totalLineDiscounts));

  // 2. Invoice-level discount (applied to net line total)
  let invoiceDiscountAmount = 0;
  const invDiscVal = invoice.invoiceDiscountValue || 0;
  if (invDiscVal > 0) {
    if (invoice.invoiceDiscountType === 'percent') {
      const cappedPercent = Math.min(100, Math.max(0, invDiscVal));
      invoiceDiscountAmount = roundCurrency(netLineTotal * (cappedPercent / 100));
    } else {
      invoiceDiscountAmount = roundCurrency(Math.min(netLineTotal, invDiscVal));
    }
  }

  // 3. Taxable amount base after all discounts
  const taxableAmount = roundCurrency(Math.max(0, netLineTotal - invoiceDiscountAmount));

  // 4. Tax Calculation Breakdown
  const taxBreakdown: TaxBreakdownItem[] = [];
  const taxConfig = invoice.taxConfig || { regime: 'none', label: 'No Tax', defaultRate: 0, isGst: false };

  if (taxConfig.regime === 'gst' && taxConfig.isGst) {
    // Configurable Indian GST Support
    if (taxConfig.gstType === 'intra_state') {
      const cgstRate = taxConfig.cgstRate ?? roundCurrency((taxConfig.defaultRate || 18) / 2);
      const sgstRate = taxConfig.sgstRate ?? roundCurrency((taxConfig.defaultRate || 18) / 2);

      const cgstAmount = roundCurrency((taxableAmount * cgstRate) / 100);
      const sgstAmount = roundCurrency((taxableAmount * sgstRate) / 100);

      taxBreakdown.push({
        label: `CGST (${cgstRate}%)`,
        rate: cgstRate,
        taxableAmount,
        taxAmount: cgstAmount,
      });
      taxBreakdown.push({
        label: `SGST (${sgstRate}%)`,
        rate: sgstRate,
        taxableAmount,
        taxAmount: sgstAmount,
      });
    } else {
      // Inter-state: IGST
      const igstRate = taxConfig.igstRate ?? (taxConfig.defaultRate || 18);
      const igstAmount = roundCurrency((taxableAmount * igstRate) / 100);

      taxBreakdown.push({
        label: `IGST (${igstRate}%)`,
        rate: igstRate,
        taxableAmount,
        taxAmount: igstAmount,
      });
    }
  } else if (taxConfig.regime !== 'none' && taxConfig.defaultRate > 0) {
    // Standard VAT / Sales Tax
    const standardTaxAmount = roundCurrency((taxableAmount * taxConfig.defaultRate) / 100);
    taxBreakdown.push({
      label: `${taxConfig.label || 'Tax'} (${taxConfig.defaultRate}%)`,
      rate: taxConfig.defaultRate,
      taxableAmount,
      taxAmount: standardTaxAmount,
    });
  } else {
    // Check if line items have individual tax rates
    const lineTaxSum = items.reduce((sum, item) => sum + item.lineTaxAmount, 0);
    if (lineTaxSum > 0) {
      taxBreakdown.push({
        label: 'Line Item Taxes',
        rate: 0,
        taxableAmount,
        taxAmount: roundCurrency(lineTaxSum),
      });
    }
  }

  const totalTaxAmount = roundCurrency(taxBreakdown.reduce((sum, t) => sum + t.taxAmount, 0));

  // 5. Additional charges
  const additionalCharges = roundCurrency(
    invoice.additionalCharges && invoice.additionalCharges > 0 ? invoice.additionalCharges : 0
  );

  // 6. Grand total
  const grandTotal = roundCurrency(taxableAmount + totalTaxAmount + additionalCharges);

  // 7. Amount paid & Outstanding balance
  const payments: InvoicePayment[] = invoice.payments || [];
  const amountPaid = roundCurrency(payments.reduce((sum, p) => sum + p.amount, 0));
  const outstandingBalance = roundCurrency(Math.max(0, grandTotal - amountPaid));

  return {
    items,
    subtotal,
    totalLineDiscounts,
    invoiceDiscountAmount,
    taxableAmount,
    taxBreakdown,
    totalTaxAmount,
    grandTotal,
    amountPaid,
    outstandingBalance,
  };
}

/**
 * Computes the lifecycle status of an invoice based on issuance, payments, and due dates.
 * CRITICAL RULE: Draft invoices MUST NEVER become overdue!
 */
export function computeSalesInvoiceStatus(
  invoice: Pick<SalesInvoice, 'status' | 'grandTotal' | 'amountPaid' | 'outstandingBalance' | 'dueDate' | 'issuedAt'>,
  asOfDateStr?: string
): SalesInvoiceStatus {
  if (invoice.status === 'cancelled') {
    return 'cancelled';
  }

  if (invoice.status === 'draft' || !invoice.issuedAt) {
    return 'draft';
  }

  const balance = roundCurrency(invoice.outstandingBalance);
  const paid = roundCurrency(invoice.amountPaid);
  const grandTotal = roundCurrency(invoice.grandTotal);

  if (balance <= 0.005 && grandTotal > 0 && paid >= grandTotal - 0.005) {
    return 'paid';
  }

  const today = asOfDateStr || new Date().toISOString().slice(0, 10);
  const isPastDue = invoice.dueDate && today > invoice.dueDate && balance > 0.005;

  if (paid > 0.005) {
    return isPastDue ? 'overdue' : 'partially_paid';
  }

  if (isPastDue) {
    return 'overdue';
  }

  return 'issued';
}

/**
 * Validates whether an invoice meets all strict financial criteria to be issued.
 */
export function validateSalesInvoiceForIssuing(
  invoice: Partial<SalesInvoice>,
  existingInvoices: SalesInvoice[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!invoice.seller?.companyName?.trim()) {
    errors.push('Seller legal company name is required.');
  }

  if (!invoice.customer?.customerName?.trim()) {
    errors.push('Customer / Client name is required.');
  }

  const invNumber = invoice.invoiceNumber?.trim();
  if (!invNumber) {
    errors.push('Invoice number is required.');
  } else {
    const conflict = existingInvoices.find(
      (existing) => existing.id !== invoice.id && existing.invoiceNumber.toLowerCase() === invNumber.toLowerCase()
    );
    if (conflict) {
      errors.push(`Invoice number "${invNumber}" already exists in the system (Conflict with ID ${conflict.id}).`);
    }
  }

  if (!invoice.issueDate?.trim()) {
    errors.push('Issue date is required.');
  }
  if (!invoice.dueDate?.trim()) {
    errors.push('Due date is required.');
  }
  if (invoice.issueDate && invoice.dueDate && invoice.dueDate < invoice.issueDate) {
    errors.push(`Due date (${invoice.dueDate}) cannot precede issue date (${invoice.issueDate}).`);
  }

  if (!invoice.items || invoice.items.length === 0) {
    errors.push('Invoice must contain at least one line item.');
  } else {
    invoice.items.forEach((item, index) => {
      const itemNum = index + 1;
      if (!item.description?.trim()) {
        errors.push(`Line item #${itemNum} requires a description.`);
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        errors.push(`Line item #${itemNum} quantity must be a positive number greater than zero.`);
      }
      if (isNaN(item.unitPrice) || item.unitPrice < 0) {
        errors.push(`Line item #${itemNum} unit price must be greater than or equal to zero.`);
      }
      if (item.discount > 0) {
        if (item.discountType === 'percent' && item.discount > 100) {
          errors.push(`Line item #${itemNum} discount percentage cannot exceed 100%.`);
        }
        if (item.discountType === 'fixed' && item.discount > item.quantity * item.unitPrice) {
          errors.push(`Line item #${itemNum} fixed discount cannot exceed line subtotal.`);
        }
      }
    });
  }

  if (!invoice.currency?.trim()) {
    errors.push('Currency specification is required.');
  }

  if (invoice.grandTotal !== undefined && invoice.grandTotal <= 0) {
    errors.push('Invoice grand total must be greater than zero.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a collision-resistant sequential invoice number (e.g. INV-2026-1005).
 */
export function generateUniqueInvoiceNumber(
  existingInvoices: { invoiceNumber: string }[],
  prefix: string = 'INV-2026-'
): string {
  const currentYear = new Date().getFullYear();
  const effectivePrefix = prefix || `INV-${currentYear}-`;

  let maxSeq = 1000;
  for (const inv of existingInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(effectivePrefix)) {
      const suffix = inv.invoiceNumber.slice(effectivePrefix.length);
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  let candidate = `${effectivePrefix}${nextSeq}`;

  let attempts = 0;
  while (existingInvoices.some((inv) => inv.invoiceNumber.toLowerCase() === candidate.toLowerCase())) {
    attempts++;
    candidate = `${effectivePrefix}${nextSeq + attempts}`;
  }

  return candidate;
}
