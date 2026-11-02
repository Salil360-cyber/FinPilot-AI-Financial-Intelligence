/**
 * FinPilot AI - Shared Currency Formatter & Revenue Calculation Utilities
 * Enforces uniform formatting, decimal discipline, and consistent revenue metrics
 * across Overview, Financial Analytics, Executive Reports, and AI Advisory.
 */

import { SalesInvoice } from '../types/salesInvoice';
import { roundCurrency } from './salesInvoiceCalculator';

/**
 * Formats a monetary amount into standard accounting representation.
 * Negative numbers format with the minus sign preceding the currency symbol:
 * e.g., -2021 becomes "−$2,021.00" (using mathematical minus sign U+2212),
 * NEVER "$-2,021.00".
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (isNaN(amount) || !isFinite(amount)) {
    amount = 0;
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formattedNumber = absVal.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let symbol = '$';
  if (currency === 'INR' || currency === '₹') symbol = '₹';
  else if (currency === 'EUR' || currency === '€') symbol = '€';
  else if (currency === 'GBP' || currency === '£') symbol = '£';
  else if (currency !== 'USD' && currency !== '$') symbol = `${currency} `;

  if (isNegative) {
    return `−${symbol}${formattedNumber}`;
  }
  return `${symbol}${formattedNumber}`;
}

export interface SharedRevenueResult {
  totalRevenue: number;
  invoicesCount: number;
  activeInvoices: SalesInvoice[];
  currency: string;
}

/**
 * Shared revenue definition across Financial Analytics, Executive Reports, and AI Advisory.
 * Strict Accounting Rule:
 * 1. Excludes draft invoices (unissued).
 * 2. Excludes cancelled/voided invoices.
 * 3. Restricts strictly to the specified single currency.
 * 4. Filters by invoice issueDate if date range is specified.
 * 5. Sums grandTotal deterministically using banking cent-level rounding.
 */
export function calculateSharedRevenue(
  salesInvoices: SalesInvoice[],
  startDate?: string,
  endDate?: string,
  currency: string = 'USD'
): SharedRevenueResult {
  const activeInvoices = salesInvoices.filter((inv) => {
    if (inv.status === 'draft' || inv.status === 'cancelled') return false;
    const invCurr = inv.currency || 'USD';
    if (invCurr !== currency) return false;
    if (startDate && inv.issueDate < startDate) return false;
    if (endDate && inv.issueDate > endDate) return false;
    return true;
  });

  const totalRevenue = activeInvoices.reduce(
    (sum, inv) => roundCurrency(sum + Number(inv.grandTotal || 0)),
    0
  );

  return {
    totalRevenue: roundCurrency(totalRevenue),
    invoicesCount: activeInvoices.length,
    activeInvoices,
    currency,
  };
}
