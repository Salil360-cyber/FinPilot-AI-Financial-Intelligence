/**
 * FinPilot AI - Phase 6: Deterministic Financial Analytics & Ratio Calculator Service
 *
 * Rules:
 * - Deterministic arithmetic using 2-decimal half-up rounding.
 * - Zero division protection: returns null / safe fallbacks without NaN or Infinity.
 * - Explicit segregation: Draft invoices and cancelled records are excluded from active totals.
 * - Bank settlement transactions are not double-counted with ledger expenses.
 * - Non-expense debits (e.g. transfers, repayments) are separated from operating expenses.
 * - Multi-currency isolation: incompatible currencies are not added together.
 * - Honest reporting of missing balance-sheet values and manual inputs.
 */

import { FinancialTransaction } from '../types/finance';
import { SalesInvoice } from '../types/salesInvoice';
import { ReconciliationSession } from '../types/reconciliation';
import {
  AnalyticsFilterState,
  AnalyticsPeriodPreset,
  ManualFinancialInputs,
  RevenueAnalyticsSummary,
  ExpenseAnalyticsSummary,
  ProfitabilitySummary,
  FinancialRatioResult,
  PeriodComparisonSummary,
  PeriodComparisonMetric,
  CashMovementSummary,
  DataQualityWarning,
  BusinessInsight,
  CompleteAnalyticsDataset,
} from '../types/analytics';
import { roundCurrency } from './salesInvoiceCalculator';
import { sanitizeForSpreadsheet, serializeToCsv } from './csvParser';

/**
 * Resolves date boundaries for any standard period preset.
 */
export function resolveDateRange(preset: AnalyticsPeriodPreset, referenceDateStr?: string): { startDate: string; endDate: string; label: string } {
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date('2026-10-27');
  const y = ref.getFullYear();
  const m = ref.getMonth(); // 0-indexed

  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case 'current_month': {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return {
        startDate: format(start),
        endDate: format(end),
        label: `${ref.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      };
    }
    case 'previous_month': {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return {
        startDate: format(start),
        endDate: format(end),
        label: `${start.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
      };
    }
    case 'current_quarter': {
      const q = Math.floor(m / 3);
      const start = new Date(y, q * 3, 1);
      const end = new Date(y, (q + 1) * 3, 0);
      return {
        startDate: format(start),
        endDate: format(end),
        label: `Q${q + 1} ${y}`,
      };
    }
    case 'previous_quarter': {
      const currentQ = Math.floor(m / 3);
      const prevQ = currentQ === 0 ? 3 : currentQ - 1;
      const prevY = currentQ === 0 ? y - 1 : y;
      const start = new Date(prevY, prevQ * 3, 1);
      const end = new Date(prevY, (prevQ + 1) * 3, 0);
      return {
        startDate: format(start),
        endDate: format(end),
        label: `Q${prevQ + 1} ${prevY}`,
      };
    }
    case 'current_year': {
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        label: `FY ${y}`,
      };
    }
    case 'previous_year': {
      return {
        startDate: `${y - 1}-01-01`,
        endDate: `${y - 1}-12-31`,
        label: `FY ${y - 1}`,
      };
    }
    case 'all_time':
    default: {
      return {
        startDate: '2020-01-01',
        endDate: '2030-12-31',
        label: 'All Available Periods',
      };
    }
  }
}

/**
 * Calculates prior comparison period with equal duration for trend analysis.
 */
export function getPreviousPeriodDateRange(startDate: string, endDate: string): { startDate: string; endDate: string; label: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round(durationMs / dayMs) + 1;

  const prevEnd = new Date(start.getTime() - dayMs);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * dayMs);

  const pad = (n: number) => String(n).padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return {
    startDate: format(prevStart),
    endDate: format(prevEnd),
    label: `Prior ${days} Days (${format(prevStart)} to ${format(prevEnd)})`,
  };
}

/**
 * Checks if a date falls inclusively between start and end date strings.
 */
export function isDateInRange(dateStr: string, startDate: string, endDate: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.slice(0, 10);
  return clean >= startDate && clean <= endDate;
}

/**
 * Safely computes percentage change between current and previous values.
 */
export function computeSafePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  return roundCurrency(pct);
}

/**
 * Analyzes revenue and accounts receivable from sales invoices.
 */
export function calculateRevenueAnalytics(
  salesInvoices: SalesInvoice[],
  filter: AnalyticsFilterState,
  referenceDateStr: string = '2026-10-27'
): RevenueAnalyticsSummary {
  const targetCurrency = filter.currency || 'USD';

  // Strict accounting rule: Draft invoices and cancelled invoices are excluded from active revenue
  const activeInvoices = salesInvoices.filter((inv) => {
    if (inv.status === 'draft' || inv.status === 'cancelled') return false;
    if (inv.currency !== targetCurrency) return false;
    if (!filter.includeDemoData && inv.source === 'demo') return false;
    if (filter.source === 'user' && inv.source !== 'user_created') return false;
    if (filter.source === 'demo' && inv.source !== 'demo') return false;
    return isDateInRange(inv.issueDate, filter.startDate, filter.endDate);
  });

  let recordedRevenue = 0;
  let outstandingReceivables = 0;
  let unpaidInvoicesCount = 0;
  let overdueInvoicesTotal = 0;
  let overdueInvoicesCount = 0;

  const customerMap = new Map<string, { amount: number; count: number }>();
  const monthMap = new Map<string, { amount: number; count: number }>();

  const ageingBuckets = {
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
  };

  const refTime = new Date(referenceDateStr).getTime();

  activeInvoices.forEach((inv) => {
    const total = roundCurrency(inv.grandTotal);
    const balance = roundCurrency(inv.outstandingBalance);

    recordedRevenue = roundCurrency(recordedRevenue + total);

    if (balance > 0.005) {
      outstandingReceivables = roundCurrency(outstandingReceivables + balance);
      unpaidInvoicesCount++;

      // Ageing calculation
      const dueTime = new Date(inv.dueDate).getTime();
      const daysOverdue = Math.max(0, Math.floor((refTime - dueTime) / (1000 * 60 * 60 * 24)));

      if (daysOverdue > 0) {
        overdueInvoicesTotal = roundCurrency(overdueInvoicesTotal + balance);
        overdueInvoicesCount++;
      }

      if (daysOverdue <= 30) {
        ageingBuckets.current = roundCurrency(ageingBuckets.current + balance);
      } else if (daysOverdue <= 60) {
        ageingBuckets.days31to60 = roundCurrency(ageingBuckets.days31to60 + balance);
      } else if (daysOverdue <= 90) {
        ageingBuckets.days61to90 = roundCurrency(ageingBuckets.days61to90 + balance);
      } else {
        ageingBuckets.over90 = roundCurrency(ageingBuckets.over90 + balance);
      }
    }

    // Customer aggregation
    const customer = inv.customer?.customerName?.trim() || 'Unspecified Client';
    const cData = customerMap.get(customer) || { amount: 0, count: 0 };
    customerMap.set(customer, {
      amount: roundCurrency(cData.amount + total),
      count: cData.count + 1,
    });

    // Month aggregation
    const monthKey = inv.issueDate.slice(0, 7); // YYYY-MM
    const mData = monthMap.get(monthKey) || { amount: 0, count: 0 };
    monthMap.set(monthKey, {
      amount: roundCurrency(mData.amount + total),
      count: mData.count + 1,
    });
  });

  // Calculate actual cash payments received within the period
  let cashPaymentsReceived = 0;
  let cashPaymentsCount = 0;

  salesInvoices.forEach((inv) => {
    if (inv.status === 'cancelled') return;
    if (inv.currency !== targetCurrency) return;
    if (!filter.includeDemoData && inv.source === 'demo') return false;

    (inv.payments || []).forEach((p) => {
      const pDate = p.paymentDate || p.recordedAt.slice(0, 10);
      if (isDateInRange(pDate, filter.startDate, filter.endDate)) {
        cashPaymentsReceived = roundCurrency(cashPaymentsReceived + p.amount);
        cashPaymentsCount++;
      }
    });
  });

  const revenueByCustomer = Array.from(customerMap.entries())
    .map(([customer, data]) => ({
      customer,
      amount: data.amount,
      percentage: recordedRevenue > 0 ? roundCurrency((data.amount / recordedRevenue) * 100) : 0,
      invoiceCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const revenueByMonth = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      amount: data.amount,
      invoiceCount: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    recordedRevenue,
    issuedInvoicesTotal: recordedRevenue,
    issuedInvoicesCount: activeInvoices.length,
    cashPaymentsReceived,
    cashPaymentsCount,
    outstandingReceivables,
    unpaidInvoicesCount,
    overdueInvoicesTotal,
    overdueInvoicesCount,
    revenueByCustomer,
    revenueByMonth,
    ageingBuckets,
  };
}

/**
 * Analyzes expenses from the General Ledger.
 */
export function calculateExpenseAnalytics(
  transactions: FinancialTransaction[],
  filter: AnalyticsFilterState
): ExpenseAnalyticsSummary {
  const targetCurrency = filter.currency || 'USD';

  let totalOperatingExpenses = 0;
  let activeExpensesCount = 0;
  let cancelledVouchersTotal = 0;
  let cancelledVouchersCount = 0;
  let nonExpenseDebitsTotal = 0;

  const categoryMap = new Map<string, { amount: number; count: number }>();
  const vendorMap = new Map<string, { amount: number; count: number; transactions: FinancialTransaction[] }>();
  const monthMap = new Map<string, { amount: number; count: number }>();
  const sourceMap = new Map<string, { amount: number; count: number }>();

  const activeExpenseList: FinancialTransaction[] = [];

  transactions.forEach((tx) => {
    const txCurr = tx.currency || 'USD';
    if (txCurr !== targetCurrency) return;
    if (!filter.includeDemoData && tx.source === 'demo') return;
    if (filter.source === 'user' && tx.source !== 'user_uploaded' && tx.source !== 'manual_entry') return;
    if (filter.source === 'demo' && tx.source !== 'demo') return;
    if (filter.source === 'imported' && tx.source !== 'imported_bank_statement') return;
    if (filter.status === 'matched' && tx.status !== 'matched') return;
    if (filter.status === 'unmatched' && tx.status === 'matched') return;

    if (!isDateInRange(tx.date, filter.startDate, filter.endDate)) return;

    // Track cancelled records separately
    if (tx.ledgerStatus === 'cancelled') {
      cancelledVouchersTotal = roundCurrency(cancelledVouchersTotal + tx.amount);
      cancelledVouchersCount++;
      return;
    }

    // Only process debit transactions
    if (tx.type !== 'debit') return;

    // Distinguish non-expense debits (e.g. transfers, loan repayments, asset sweeps)
    const isNonExpense =
      tx.entryType === 'transfer' ||
      tx.entryType === 'bank_movement' ||
      tx.category.toLowerCase().includes('transfer') ||
      tx.category.toLowerCase().includes('loan principal');

    if (isNonExpense) {
      nonExpenseDebitsTotal = roundCurrency(nonExpenseDebitsTotal + tx.amount);
      return;
    }

    // Active operating expense
    const amt = roundCurrency(tx.amount);
    totalOperatingExpenses = roundCurrency(totalOperatingExpenses + amt);
    activeExpensesCount++;
    activeExpenseList.push(tx);

    // Category breakdown
    const cat = tx.category?.trim() || 'Unclassified Operating Expense';
    const cData = categoryMap.get(cat) || { amount: 0, count: 0 };
    categoryMap.set(cat, { amount: roundCurrency(cData.amount + amt), count: cData.count + 1 });

    // Vendor breakdown
    const vendor = tx.vendor?.trim() || 'Unspecified Counterparty';
    const vData = vendorMap.get(vendor) || { amount: 0, count: 0, transactions: [] };
    vData.amount = roundCurrency(vData.amount + amt);
    vData.count += 1;
    vData.transactions.push(tx);
    vendorMap.set(vendor, vData);

    // Month breakdown
    const month = tx.date.slice(0, 7);
    const mData = monthMap.get(month) || { amount: 0, count: 0 };
    monthMap.set(month, { amount: roundCurrency(mData.amount + amt), count: mData.count + 1 });

    // Source breakdown
    const src = tx.source || 'demo';
    const sData = sourceMap.get(src) || { amount: 0, count: 0 };
    sourceMap.set(src, { amount: roundCurrency(sData.amount + amt), count: sData.count + 1 });
  });

  const expensesByCategory = Array.from(categoryMap.entries())
    .map(([category, d]) => ({
      category,
      amount: d.amount,
      percentage: totalOperatingExpenses > 0 ? roundCurrency((d.amount / totalOperatingExpenses) * 100) : 0,
      transactionCount: d.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesByVendor = Array.from(vendorMap.entries())
    .map(([vendor, d]) => ({
      vendor,
      amount: d.amount,
      percentage: totalOperatingExpenses > 0 ? roundCurrency((d.amount / totalOperatingExpenses) * 100) : 0,
      transactionCount: d.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const expensesByMonth = Array.from(monthMap.entries())
    .map(([month, d]) => ({
      month,
      amount: d.amount,
      transactionCount: d.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const expensesBySource = Array.from(sourceMap.entries()).map(([source, d]) => ({
    source,
    amount: d.amount,
    count: d.count,
  }));

  const largestExpenses = [...activeExpenseList]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.vendor,
      amount: t.amount,
      category: t.category,
    }));

  // Detect recurring-looking expense patterns
  const recurringPatterns: { vendor: string; typicalAmount: number; frequencyEstimate: string; totalSpent: number }[] = [];
  vendorMap.forEach((vData, vendor) => {
    if (vData.count >= 2) {
      const amounts = vData.transactions.map((t) => t.amount);
      const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const isConsistent = amounts.every((a) => Math.abs(a - avg) / avg < 0.15); // within 15% variation

      if (isConsistent && avg >= 100) {
        recurringPatterns.push({
          vendor,
          typicalAmount: roundCurrency(avg),
          frequencyEstimate: vData.count >= 3 ? 'Monthly Recurring Pattern' : 'Multi-Period Pattern',
          totalSpent: vData.amount,
        });
      }
    }
  });

  return {
    totalOperatingExpenses,
    activeExpensesCount,
    cancelledVouchersTotal,
    cancelledVouchersCount,
    nonExpenseDebitsTotal,
    expensesByCategory,
    expensesByVendor,
    expensesByMonth,
    largestExpenses,
    recurringPatterns: recurringPatterns.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    expensesBySource,
  };
}

/**
 * Calculates profitability metrics and checks data availability.
 */
export function calculateProfitability(
  revenueSummary: RevenueAnalyticsSummary,
  expenseSummary: ExpenseAnalyticsSummary,
  manualInputs: ManualFinancialInputs
): ProfitabilitySummary {
  const revenue = revenueSummary.recordedRevenue;
  const operatingExpenses = expenseSummary.totalOperatingExpenses;

  const cogs = manualInputs.cogs !== undefined && !isNaN(manualInputs.cogs) ? manualInputs.cogs : null;
  const isCogsAvailable = cogs !== null;

  let grossProfit: number | null = null;
  let grossProfitMarginPercent: number | null = null;

  if (isCogsAvailable && cogs !== null) {
    grossProfit = roundCurrency(revenue - cogs);
    if (revenue > 0) {
      grossProfitMarginPercent = roundCurrency((grossProfit / revenue) * 100);
    }
  }

  // Operating Profit
  let operatingProfit: number | null = null;
  let operatingProfitMarginPercent: number | null = null;

  if (isCogsAvailable && grossProfit !== null) {
    operatingProfit = roundCurrency(grossProfit - operatingExpenses);
    if (revenue > 0) {
      operatingProfitMarginPercent = roundCurrency((operatingProfit / revenue) * 100);
    }
  } else {
    // Operational estimate: Revenue - Operating Expenses
    operatingProfit = roundCurrency(revenue - operatingExpenses);
    if (revenue > 0) {
      operatingProfitMarginPercent = roundCurrency((operatingProfit / revenue) * 100);
    }
  }

  const netProfit = roundCurrency(revenue - operatingExpenses - (cogs || 0));
  const netProfitMarginPercent = revenue > 0 ? roundCurrency((netProfit / revenue) * 100) : 0;

  const revenueToExpenseRatio = operatingExpenses > 0 ? roundCurrency(revenue / operatingExpenses) : null;

  const profitabilityClassificationNotice = isCogsAvailable
    ? 'Profitability derived from recorded sales, operating ledger debits, and entered Cost of Goods Sold.'
    : 'Notice: Cost of Goods Sold (COGS) is not tracked in the current General Ledger. Gross Profit is shown as unavailable; Net Profit reflects operating revenue minus active operating expenses.';

  return {
    revenue,
    costOfGoodsSold: cogs,
    grossProfit,
    grossProfitMarginPercent,
    operatingExpenses,
    operatingProfit,
    operatingProfitMarginPercent,
    netProfit,
    netProfitMarginPercent,
    revenueToExpenseRatio,
    isCogsAvailable,
    profitabilityClassificationNotice,
  };
}

/**
 * Calculates standard enterprise financial ratios.
 */
export function calculateFinancialRatios(
  profitability: ProfitabilitySummary,
  revenue: RevenueAnalyticsSummary,
  expenses: ExpenseAnalyticsSummary,
  manualInputs: ManualFinancialInputs,
  reconciliationSessions: ReconciliationSession[]
): FinancialRatioResult[] {
  const ratios: FinancialRatioResult[] = [];

  // Derived liquidity values from reconciliation session if available
  const latestSession = reconciliationSessions[0];
  const cashBalance = manualInputs.cashAndEquivalents !== undefined
    ? manualInputs.cashAndEquivalents
    : latestSession ? latestSession.statementClosingBalance : undefined;

  const currentAssets = manualInputs.currentAssets !== undefined
    ? manualInputs.currentAssets
    : (cashBalance !== undefined && revenue.outstandingReceivables > 0)
    ? roundCurrency(cashBalance + revenue.outstandingReceivables + (manualInputs.inventory || 0))
    : undefined;

  const currentLiabilities = manualInputs.currentLiabilities;

  // 1. Current Ratio
  if (currentAssets !== undefined && currentLiabilities !== undefined && currentLiabilities > 0) {
    const val = roundCurrency(currentAssets / currentLiabilities);
    ratios.push({
      id: 'current-ratio',
      name: 'Current Ratio',
      category: 'liquidity',
      formula: 'Current Assets ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: manualInputs.currentAssets ? 'estimated' : 'calculated',
      benchmark: '> 1.50x',
      benchmarkStatus: val >= 1.5 ? 'favorable' : val >= 1.0 ? 'acceptable' : 'warning',
      interpretation: 'Measures capacity to cover short-term liabilities with assets convertible to cash within 12 months.',
      requiredInputs: ['Current Assets', 'Current Liabilities'],
      missingInputs: [],
      components: [
        { label: 'Current Assets', value: `$${currentAssets.toLocaleString()}`, isManual: !!manualInputs.currentAssets },
        { label: 'Current Liabilities', value: `$${currentLiabilities.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'current-ratio',
      name: 'Current Ratio',
      category: 'liquidity',
      formula: 'Current Assets ÷ Current Liabilities',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 1.50x',
      benchmarkStatus: 'neutral',
      interpretation: 'Measures short-term debt coverage capability.',
      requiredInputs: ['Current Assets', 'Current Liabilities'],
      missingInputs: [
        ...(currentAssets === undefined ? ['Current Assets'] : []),
        ...(currentLiabilities === undefined || currentLiabilities <= 0 ? ['Current Liabilities (>0)'] : []),
      ],
      components: [],
      limitations: 'Provide Current Liabilities in the Manual Financial Inputs drawer to calculate this ratio.',
    });
  }

  // 2. Quick Ratio (Acid Test)
  const inventory = manualInputs.inventory || 0;
  const prepaid = manualInputs.prepaidExpenses || 0;
  if (currentAssets !== undefined && currentLiabilities !== undefined && currentLiabilities > 0) {
    const liquidAssets = Math.max(0, currentAssets - inventory - prepaid);
    const val = roundCurrency(liquidAssets / currentLiabilities);
    ratios.push({
      id: 'quick-ratio',
      name: 'Quick Ratio (Acid Test)',
      category: 'liquidity',
      formula: '(Current Assets − Inventory − Prepaid Expenses) ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: manualInputs.currentAssets ? 'estimated' : 'calculated',
      benchmark: '> 1.00x',
      benchmarkStatus: val >= 1.0 ? 'favorable' : val >= 0.8 ? 'acceptable' : 'warning',
      interpretation: 'Tests instant liquidity by excluding illiquid inventory and prepaid expenses.',
      requiredInputs: ['Current Assets', 'Current Liabilities'],
      missingInputs: [],
      components: [
        { label: 'Liquid Assets (Net of Inventory & Prepaid)', value: `$${liquidAssets.toLocaleString()}` },
        { label: 'Current Liabilities', value: `$${currentLiabilities.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'quick-ratio',
      name: 'Quick Ratio (Acid Test)',
      category: 'liquidity',
      formula: '(Current Assets − Inventory − Prepaid Expenses) ÷ Current Liabilities',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 1.00x',
      benchmarkStatus: 'neutral',
      interpretation: 'Tests instant debt settlement capabilities without relying on inventory sales.',
      requiredInputs: ['Current Assets', 'Current Liabilities'],
      missingInputs: [
        ...(currentAssets === undefined ? ['Current Assets'] : []),
        ...(currentLiabilities === undefined || currentLiabilities <= 0 ? ['Current Liabilities (>0)'] : []),
      ],
      components: [],
      limitations: 'Requires balance-sheet current liabilities and liquid asset inputs.',
    });
  }

  // 3. Cash Ratio
  if (cashBalance !== undefined && currentLiabilities !== undefined && currentLiabilities > 0) {
    const val = roundCurrency(cashBalance / currentLiabilities);
    ratios.push({
      id: 'cash-ratio',
      name: 'Cash Ratio',
      category: 'liquidity',
      formula: 'Cash and Cash Equivalents ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: manualInputs.cashAndEquivalents !== undefined ? 'estimated' : 'calculated',
      benchmark: '> 0.20x',
      benchmarkStatus: val >= 0.5 ? 'favorable' : val >= 0.2 ? 'acceptable' : 'warning',
      interpretation: 'Most conservative liquidity ratio; tests immediate ability to extinguish short-term debts with pure cash.',
      requiredInputs: ['Cash and Equivalents', 'Current Liabilities'],
      missingInputs: [],
      components: [
        { label: 'Cash & Cash Equivalents', value: `$${cashBalance.toLocaleString()}`, isManual: manualInputs.cashAndEquivalents !== undefined },
        { label: 'Current Liabilities', value: `$${currentLiabilities.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'cash-ratio',
      name: 'Cash Ratio',
      category: 'liquidity',
      formula: 'Cash and Cash Equivalents ÷ Current Liabilities',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 0.20x',
      benchmarkStatus: 'neutral',
      interpretation: 'Evaluates immediate solvency using cash alone.',
      requiredInputs: ['Cash & Cash Equivalents', 'Current Liabilities'],
      missingInputs: [
        ...(cashBalance === undefined ? ['Cash and Equivalents (or Bank Statement Session)'] : []),
        ...(currentLiabilities === undefined || currentLiabilities <= 0 ? ['Current Liabilities (>0)'] : []),
      ],
      components: [],
      limitations: 'Requires cash balance from reconciled bank sessions or manual input, plus current liabilities.',
    });
  }

  // 4. Gross Profit Margin
  const grossMargin = profitability.grossProfitMarginPercent ?? (profitability.grossProfit !== null && profitability.grossProfit !== undefined && profitability.revenue > 0 ? roundCurrency((profitability.grossProfit / profitability.revenue) * 100) : null);
  if (grossMargin !== null && grossMargin !== undefined) {
    const val = grossMargin;
    ratios.push({
      id: 'gross-profit-margin',
      name: 'Gross Profit Margin',
      category: 'profitability',
      formula: 'Gross Profit ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'estimated',
      benchmark: '> 40.0%',
      benchmarkStatus: val >= 40 ? 'favorable' : val >= 25 ? 'acceptable' : 'warning',
      interpretation: 'Portion of direct sales remaining after covering cost of goods sold.',
      requiredInputs: ['Revenue', 'Cost of Goods Sold (COGS)'],
      missingInputs: [],
      components: [
        { label: 'Gross Profit', value: `$${profitability.grossProfit?.toLocaleString()}` },
        { label: 'Revenue', value: `$${profitability.revenue.toLocaleString()}` },
      ],
    });
  } else {
    ratios.push({
      id: 'gross-profit-margin',
      name: 'Gross Profit Margin',
      category: 'profitability',
      formula: 'Gross Profit ÷ Revenue × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 40.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Direct product/service margin before operating overhead.',
      requiredInputs: ['Revenue', 'Cost of Goods Sold (COGS)'],
      missingInputs: ['Cost of Goods Sold (COGS)'],
      components: [],
      limitations: 'Enter COGS in Manual Financial Inputs to compute gross profit margin.',
    });
  }

  // 5. Operating Profit Margin
  const opMargin = profitability.operatingProfitMarginPercent ?? (profitability.operatingProfit !== null && profitability.operatingProfit !== undefined && profitability.revenue > 0 ? roundCurrency((profitability.operatingProfit / profitability.revenue) * 100) : null);
  if (opMargin !== null && opMargin !== undefined && profitability.revenue > 0) {
    const val = opMargin;
    ratios.push({
      id: 'operating-profit-margin',
      name: 'Operating Profit Margin',
      category: 'profitability',
      formula: 'Operating Profit ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      benchmark: '> 20.0%',
      benchmarkStatus: val >= 20 ? 'favorable' : val >= 10 ? 'acceptable' : 'warning',
      interpretation: 'Percentage of revenue remaining after paying operational and administrative overhead.',
      requiredInputs: ['Revenue', 'Operating Expenses'],
      missingInputs: [],
      components: [
        { label: 'Operating Profit', value: `$${profitability.operatingProfit?.toLocaleString()}` },
        { label: 'Revenue', value: `$${profitability.revenue.toLocaleString()}` },
      ],
    });
  } else {
    ratios.push({
      id: 'operating-profit-margin',
      name: 'Operating Profit Margin',
      category: 'profitability',
      formula: 'Operating Profit ÷ Revenue × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 20.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Measures operational efficiency and pricing leverage.',
      requiredInputs: ['Revenue (>0)', 'Operating Expenses'],
      missingInputs: ['Positive Invoiced Revenue'],
      components: [],
    });
  }

  // 6. Net Profit Margin
  const netMargin = profitability.netProfitMarginPercent ?? (profitability.revenue > 0 ? roundCurrency((profitability.netProfit / profitability.revenue) * 100) : null);
  if (netMargin !== null && netMargin !== undefined && profitability.revenue > 0) {
    const val = netMargin;
    ratios.push({
      id: 'net-profit-margin',
      name: 'Net Profit Margin',
      category: 'profitability',
      formula: 'Net Profit ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      benchmark: '> 15.0%',
      benchmarkStatus: val >= 15 ? 'favorable' : val >= 5 ? 'acceptable' : 'warning',
      interpretation: 'Bottom-line percentage of every sales dollar retained as net corporate earnings.',
      requiredInputs: ['Revenue', 'Operating Expenses'],
      missingInputs: [],
      components: [
        { label: 'Net Profit', value: `$${profitability.netProfit.toLocaleString()}` },
        { label: 'Revenue', value: `$${profitability.revenue.toLocaleString()}` },
      ],
    });
  } else {
    ratios.push({
      id: 'net-profit-margin',
      name: 'Net Profit Margin',
      category: 'profitability',
      formula: 'Net Profit ÷ Revenue × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 15.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Bottom-line earnings profitability margin.',
      requiredInputs: ['Revenue (>0)'],
      missingInputs: ['Positive Invoiced Revenue'],
      components: [],
    });
  }

  // 7. Return on Assets (ROA)
  const avgAssets = manualInputs.beginningAssets !== undefined && manualInputs.endingAssets !== undefined
    ? (manualInputs.beginningAssets + manualInputs.endingAssets) / 2
    : manualInputs.totalAssets;

  if (avgAssets !== undefined && avgAssets > 0) {
    const netIncome = profitability.netProfit;
    const val = roundCurrency((netIncome / avgAssets) * 100);
    ratios.push({
      id: 'return-on-assets',
      name: 'Return on Assets (ROA)',
      category: 'profitability',
      formula: 'Net Income ÷ Average Total Assets × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'estimated',
      benchmark: '> 10.0%',
      benchmarkStatus: val >= 10 ? 'favorable' : val >= 5 ? 'acceptable' : 'warning',
      interpretation: 'Productivity of total asset base in generating bottom-line net income.',
      requiredInputs: ['Net Income', 'Average Total Assets'],
      missingInputs: [],
      components: [
        { label: 'Net Income', value: `$${netIncome.toLocaleString()}` },
        { label: 'Average Total Assets', value: `$${avgAssets.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'return-on-assets',
      name: 'Return on Assets (ROA)',
      category: 'profitability',
      formula: 'Net Income ÷ Average Total Assets × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 10.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Asset productivity in driving bottom-line returns.',
      requiredInputs: ['Net Income', 'Total Assets'],
      missingInputs: ['Total Assets (or Beginning & Ending Assets)'],
      components: [],
      limitations: 'Enter Total Assets in the Manual Financial Inputs drawer.',
    });
  }

  // 8. Return on Equity (ROE)
  const avgEquity = manualInputs.beginningEquity !== undefined && manualInputs.endingEquity !== undefined
    ? (manualInputs.beginningEquity + manualInputs.endingEquity) / 2
    : manualInputs.totalEquity;

  if (avgEquity !== undefined && avgEquity > 0) {
    const netIncome = profitability.netProfit;
    const val = roundCurrency((netIncome / avgEquity) * 100);
    ratios.push({
      id: 'return-on-equity',
      name: 'Return on Equity (ROE)',
      category: 'profitability',
      formula: 'Net Income ÷ Average Total Equity × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'estimated',
      benchmark: '> 15.0%',
      benchmarkStatus: val >= 15 ? 'favorable' : val >= 8 ? 'acceptable' : 'warning',
      interpretation: 'Rate of return generated for equity shareholders.',
      requiredInputs: ['Net Income', 'Average Equity'],
      missingInputs: [],
      components: [
        { label: 'Net Income', value: `$${netIncome.toLocaleString()}` },
        { label: 'Average Total Equity', value: `$${avgEquity.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'return-on-equity',
      name: 'Return on Equity (ROE)',
      category: 'profitability',
      formula: 'Net Income ÷ Average Total Equity × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 15.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Capital productivity for shareholder equity.',
      requiredInputs: ['Net Income', 'Shareholders Equity'],
      missingInputs: ['Total Shareholders Equity'],
      components: [],
      limitations: 'Enter Shareholders Equity in the Manual Financial Inputs drawer.',
    });
  }

  // 9. Debt-to-Equity Ratio
  if (manualInputs.totalDebt !== undefined && manualInputs.totalEquity !== undefined && manualInputs.totalEquity > 0) {
    const val = roundCurrency(manualInputs.totalDebt / manualInputs.totalEquity);
    ratios.push({
      id: 'debt-to-equity',
      name: 'Debt-to-Equity Ratio',
      category: 'leverage',
      formula: 'Total Debt ÷ Total Equity',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: 'estimated',
      benchmark: '< 1.00x',
      benchmarkStatus: val <= 0.8 ? 'favorable' : val <= 1.5 ? 'acceptable' : 'warning',
      interpretation: 'Financial leverage footprint; compares creditor financing against equity owner capital.',
      requiredInputs: ['Total Debt', 'Total Equity'],
      missingInputs: [],
      components: [
        { label: 'Total Debt Obligations', value: `$${manualInputs.totalDebt.toLocaleString()}`, isManual: true },
        { label: 'Total Shareholder Equity', value: `$${manualInputs.totalEquity.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'debt-to-equity',
      name: 'Debt-to-Equity Ratio',
      category: 'leverage',
      formula: 'Total Debt ÷ Total Equity',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '< 1.00x',
      benchmarkStatus: 'neutral',
      interpretation: 'Measures corporate financial leverage and debt capacity.',
      requiredInputs: ['Total Debt', 'Total Equity (>0)'],
      missingInputs: [
        ...(manualInputs.totalDebt === undefined ? ['Total Debt'] : []),
        ...(manualInputs.totalEquity === undefined || manualInputs.totalEquity <= 0 ? ['Total Equity (>0)'] : []),
      ],
      components: [],
      limitations: 'Enter Total Debt and Shareholder Equity in the Manual Financial Inputs drawer.',
    });
  }

  // 10. Debt Ratio
  if (manualInputs.totalLiabilities !== undefined && manualInputs.totalAssets !== undefined && manualInputs.totalAssets > 0) {
    const val = roundCurrency((manualInputs.totalLiabilities / manualInputs.totalAssets) * 100);
    ratios.push({
      id: 'debt-ratio',
      name: 'Debt Ratio',
      category: 'leverage',
      formula: 'Total Liabilities ÷ Total Assets × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'estimated',
      benchmark: '< 50.0%',
      benchmarkStatus: val <= 50 ? 'favorable' : val <= 70 ? 'acceptable' : 'warning',
      interpretation: 'Percentage of total assets financed through liabilities and creditor debt.',
      requiredInputs: ['Total Liabilities', 'Total Assets'],
      missingInputs: [],
      components: [
        { label: 'Total Liabilities', value: `$${manualInputs.totalLiabilities.toLocaleString()}`, isManual: true },
        { label: 'Total Assets', value: `$${manualInputs.totalAssets.toLocaleString()}`, isManual: true },
      ],
    });
  } else {
    ratios.push({
      id: 'debt-ratio',
      name: 'Debt Ratio',
      category: 'leverage',
      formula: 'Total Liabilities ÷ Total Assets × 100',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '< 50.0%',
      benchmarkStatus: 'neutral',
      interpretation: 'Proportion of asset base financed via liabilities.',
      requiredInputs: ['Total Liabilities', 'Total Assets (>0)'],
      missingInputs: [
        ...(manualInputs.totalLiabilities === undefined ? ['Total Liabilities'] : []),
        ...(manualInputs.totalAssets === undefined || manualInputs.totalAssets <= 0 ? ['Total Assets (>0)'] : []),
      ],
      components: [],
      limitations: 'Enter Total Liabilities and Total Assets in the Manual Financial Inputs drawer.',
    });
  }

  // 11. Accounts Receivable Turnover
  const avgAr = manualInputs.beginningAr !== undefined && manualInputs.endingAr !== undefined
    ? (manualInputs.beginningAr + manualInputs.endingAr) / 2
    : revenue.outstandingReceivables;

  if (revenue.recordedRevenue > 0 && avgAr > 0) {
    const val = roundCurrency(revenue.recordedRevenue / avgAr);
    ratios.push({
      id: 'ar-turnover',
      name: 'Accounts Receivable Turnover',
      category: 'efficiency',
      formula: 'Net Credit Sales ÷ Average Accounts Receivable',
      value: val,
      formattedValue: `${val.toFixed(1)}x`,
      status: 'calculated',
      benchmark: '> 6.0x',
      benchmarkStatus: val >= 6.0 ? 'favorable' : val >= 4.0 ? 'acceptable' : 'warning',
      interpretation: 'Rate at which outstanding customer invoices are converted into received cash.',
      requiredInputs: ['Net Credit Sales (Revenue)', 'Average Accounts Receivable'],
      missingInputs: [],
      components: [
        { label: 'Recorded Revenue', value: `$${revenue.recordedRevenue.toLocaleString()}` },
        { label: 'Average Accounts Receivable', value: `$${avgAr.toLocaleString()}` },
      ],
    });
  } else {
    ratios.push({
      id: 'ar-turnover',
      name: 'Accounts Receivable Turnover',
      category: 'efficiency',
      formula: 'Net Credit Sales ÷ Average Accounts Receivable',
      value: null,
      formattedValue: 'Unavailable',
      status: 'unavailable',
      benchmark: '> 6.0x',
      benchmarkStatus: 'neutral',
      interpretation: 'Collection efficiency of customer receivables.',
      requiredInputs: ['Recorded Revenue (>0)', 'Accounts Receivable (>0)'],
      missingInputs: ['Active Accounts Receivable Balance'],
      components: [],
    });
  }

  return ratios;
}

/**
 * Calculates period-over-period comparisons.
 */
export function calculatePeriodComparison(
  currentRevenue: RevenueAnalyticsSummary,
  currentExpenses: ExpenseAnalyticsSummary,
  previousRevenue: RevenueAnalyticsSummary,
  previousExpenses: ExpenseAnalyticsSummary,
  currentPeriodLabel: string,
  previousPeriodLabel: string
): PeriodComparisonSummary {
  const metrics: PeriodComparisonMetric[] = [];

  const addMetric = (
    id: string,
    name: string,
    current: number,
    previous: number,
    isExpenseOrDebt: boolean
  ) => {
    const abs = roundCurrency(current - previous);
    const pct = computeSafePercentageChange(current, previous);

    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (abs > 0.005) direction = 'positive';
    else if (abs < -0.005) direction = 'negative';

    const isFavorable = isExpenseOrDebt ? abs <= 0 : abs >= 0;

    let explanation = '';
    if (previous === 0) {
      explanation = `New metric: was $0 in prior period (${previousPeriodLabel}) and is now $${current.toLocaleString()}.`;
    } else if (pct !== null) {
      explanation = `${Math.abs(pct).toFixed(1)}% ${direction === 'positive' ? 'increase' : 'decrease'} vs prior period.`;
    }

    metrics.push({
      id,
      name,
      currentValue: current,
      previousValue: previous,
      absoluteChange: abs,
      percentageChange: pct,
      formattedCurrent: `$${current.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      formattedPrevious: `$${previous.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      direction,
      isFavorable,
      explanation,
    });
  };

  addMetric('revenue', 'Recorded Revenue', currentRevenue.recordedRevenue, previousRevenue.recordedRevenue, false);
  addMetric('operating_expenses', 'Operating Expenses', currentExpenses.totalOperatingExpenses, previousExpenses.totalOperatingExpenses, true);
  addMetric('net_profit', 'Operating Profit / Net Profit', currentRevenue.recordedRevenue - currentExpenses.totalOperatingExpenses, previousRevenue.recordedRevenue - previousExpenses.totalOperatingExpenses, false);
  addMetric('cash_receipts', 'Cash Payments Received', currentRevenue.cashPaymentsReceived, previousRevenue.cashPaymentsReceived, false);
  addMetric('receivables', 'Outstanding Receivables', currentRevenue.outstandingReceivables, previousRevenue.outstandingReceivables, true);

  // Expense category changes
  const prevCatMap = new Map<string, number>();
  previousExpenses.expensesByCategory.forEach((c) => prevCatMap.set(c.category, c.amount));

  const allCategories = new Set<string>();
  currentExpenses.expensesByCategory.forEach((c) => allCategories.add(c.category));
  previousExpenses.expensesByCategory.forEach((c) => allCategories.add(c.category));

  const expenseCategoryChanges = Array.from(allCategories).map((category) => {
    const curr = currentExpenses.expensesByCategory.find((c) => c.category === category)?.amount || 0;
    const prev = prevCatMap.get(category) || 0;
    const change = roundCurrency(curr - prev);
    const pctChange = computeSafePercentageChange(curr, prev);
    return { category, current: curr, previous: prev, change, pctChange };
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    currentPeriodLabel,
    previousPeriodLabel,
    metrics,
    expenseCategoryChanges,
  };
}

/**
 * Summarizes cash movements using Phase 5 bank reconciliation session data.
 */
export function calculateCashMovement(
  sessions: ReconciliationSession[],
  activeAccountId: string
): CashMovementSummary {
  const accountSessions = sessions.filter((s) => s.accountId === activeAccountId);
  const activeSession = accountSessions[0] || sessions[0];

  if (!activeSession) {
    return {
      totalDeposits: 0,
      totalWithdrawals: 0,
      netMovement: 0,
      openingBalance: 0,
      calculatedClosingBalance: 0,
      reconciledDeposits: 0,
      reconciledWithdrawals: 0,
      reconciliationRatePercent: 100,
      unreconciledItemsCount: 0,
    };
  }

  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let reconciledDeposits = 0;
  let reconciledWithdrawals = 0;
  let reconciledItems = 0;
  let unreconciledItems = 0;

  activeSession.transactions.forEach((tx) => {
    const amt = roundCurrency(tx.amount);
    const isCredit = tx.type === 'credit';
    const isMatched = tx.matchStatus === 'exact_matched' || tx.matchStatus === 'manually_matched';

    if (isCredit) {
      totalDeposits = roundCurrency(totalDeposits + amt);
      if (isMatched) reconciledDeposits = roundCurrency(reconciledDeposits + amt);
    } else {
      totalWithdrawals = roundCurrency(totalWithdrawals + amt);
      if (isMatched) reconciledWithdrawals = roundCurrency(reconciledWithdrawals + amt);
    }

    if (isMatched) {
      reconciledItems++;
    } else if (tx.matchStatus !== 'excluded') {
      unreconciledItems++;
    }
  });

  const totalLines = activeSession.transactions.length;
  const rate = totalLines > 0 ? roundCurrency((reconciledItems / totalLines) * 100) : 100;
  const net = roundCurrency(totalDeposits - totalWithdrawals);
  const calculatedClosing = roundCurrency(activeSession.openingBalance + net);

  return {
    totalDeposits,
    totalWithdrawals,
    netMovement: net,
    openingBalance: activeSession.openingBalance,
    calculatedClosingBalance: calculatedClosing,
    reconciledDeposits,
    reconciledWithdrawals,
    reconciliationRatePercent: rate,
    unreconciledItemsCount: unreconciledItems,
    activeSessionName: activeSession.sessionName,
    activeAccountId: activeSession.accountId,
  };
}

/**
 * Scans financial data to surface quality warnings and calculation limits.
 */
export function evaluateDataQuality(
  transactions: FinancialTransaction[],
  salesInvoices: SalesInvoice[],
  sessions: ReconciliationSession[],
  manualInputs: ManualFinancialInputs,
  filter: AnalyticsFilterState
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = [];

  // 1. Unclassified expenses
  const unclassified = transactions.filter(
    (t) => (!t.category || t.category === 'Unclassified Operating Expense') && t.ledgerStatus !== 'cancelled'
  );
  if (unclassified.length > 0) {
    const sum = unclassified.reduce((s, t) => s + t.amount, 0);
    warnings.push({
      id: 'dq-unclassified-expenses',
      severity: 'warning',
      category: 'General Ledger',
      title: 'Unclassified Expense Vouchers',
      description: `${unclassified.length} active debit transaction${unclassified.length > 1 ? 's' : ''} lack an accounting category.`,
      affectedCount: unclassified.length,
      affectedAmount: roundCurrency(sum),
      actionableStep: 'Open Expense Ledger to assign standard categories for accurate category breakdown.',
    });
  }

  // 2. Cancelled vouchers in ledger
  const cancelledVouchers = transactions.filter((t) => t.ledgerStatus === 'cancelled');
  if (cancelledVouchers.length > 0) {
    const sum = cancelledVouchers.reduce((s, t) => s + t.amount, 0);
    warnings.push({
      id: 'dq-cancelled-vouchers',
      severity: 'info',
      category: 'Audit Compliance',
      title: 'Cancelled Vouchers Excluded',
      description: `${cancelledVouchers.length} cancelled General Ledger transaction${cancelledVouchers.length > 1 ? 's' : ''} ($${sum.toFixed(2)}) are excluded from active expenses.`,
      affectedCount: cancelledVouchers.length,
      affectedAmount: roundCurrency(sum),
      actionableStep: 'Audit trail records the cancellation rationale for each voided transaction.',
    });
  }

  // 3. Unreconciled bank statement lines
  const activeSession = sessions[0];
  if (activeSession) {
    const unreconciled = activeSession.transactions.filter(
      (t) => t.matchStatus === 'unmatched' || t.matchStatus === 'review_required' || t.matchStatus === 'conflict'
    );
    if (unreconciled.length > 0) {
      warnings.push({
        id: 'dq-unreconciled-bank',
        severity: 'warning',
        category: 'Bank Reconciliation',
        title: 'Unreconciled Bank Statement Lines',
        description: `${unreconciled.length} statement line${unreconciled.length > 1 ? 's' : ''} remain unverified in the active bank reconciliation session.`,
        affectedCount: unreconciled.length,
        actionableStep: 'Complete Bank Reconciliation to align bank balances with General Ledger cash.',
      });
    }
  }

  // 4. Missing Balance Sheet Inputs for Financial Ratios
  const missingInputs: string[] = [];
  if (manualInputs.currentLiabilities === undefined) missingInputs.push('Current Liabilities');
  if (manualInputs.totalDebt === undefined) missingInputs.push('Total Debt');
  if (manualInputs.totalEquity === undefined) missingInputs.push('Total Equity');
  if (manualInputs.cogs === undefined) missingInputs.push('Cost of Goods Sold (COGS)');

  if (missingInputs.length > 0) {
    warnings.push({
      id: 'dq-missing-balance-sheet',
      severity: 'info',
      category: 'Financial Ratios',
      title: 'Optional Balance Sheet Inputs Incomplete',
      description: `Ratios such as Current Ratio, Quick Ratio, Debt-to-Equity, and Gross Margin require: ${missingInputs.join(', ')}.`,
      affectedCount: missingInputs.length,
      actionableStep: 'Click "Manual Financial Inputs" to supply balance-sheet balances.',
    });
  }

  // 5. Demo data inclusion notice
  if (filter.includeDemoData) {
    warnings.push({
      id: 'dq-demo-data',
      severity: 'info',
      category: 'Data Provenance',
      title: 'Demo Financial Data Included in Scope',
      description: 'Analytics scope includes pre-configured demonstration transactions alongside user-entered records.',
      affectedCount: 1,
      actionableStep: 'Toggle "Data Source" filter to "User Data Only" for purely production records.',
    });
  }

  return warnings;
}

/**
 * Generates evidence-based observations citing specific metrics.
 */
export function generateBusinessInsights(
  revenue: RevenueAnalyticsSummary,
  expenses: ExpenseAnalyticsSummary,
  profitability: ProfitabilitySummary,
  comparison: PeriodComparisonSummary,
  periodLabel: string
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // 1. Revenue observation
  if (revenue.recordedRevenue > 0) {
    const revMetric = comparison.metrics.find((m) => m.id === 'revenue');
    if (revMetric && revMetric.percentageChange !== null) {
      insights.push({
        id: 'bi-revenue-trend',
        type: revMetric.absoluteChange >= 0 ? 'positive' : 'warning',
        title: revMetric.absoluteChange >= 0 ? 'Positive Top-Line Growth' : 'Revenue Contraction Observed',
        observation: `Recorded sales in ${periodLabel} reached $${revenue.recordedRevenue.toLocaleString()}, representing a ${Math.abs(revMetric.percentageChange).toFixed(1)}% ${revMetric.absoluteChange >= 0 ? 'increase' : 'decline'} compared to the previous period.`,
        supportingMetric: `$${revenue.recordedRevenue.toLocaleString()} (${revMetric.percentageChange > 0 ? '+' : ''}${revMetric.percentageChange}%)`,
        periodLabel,
      });
    } else {
      insights.push({
        id: 'bi-revenue-current',
        type: 'neutral',
        title: 'Active Revenue Production',
        observation: `Invoiced customer revenue in ${periodLabel} stands at $${revenue.recordedRevenue.toLocaleString()} across ${revenue.issuedInvoicesCount} issued sales invoices.`,
        supportingMetric: `$${revenue.recordedRevenue.toLocaleString()}`,
        periodLabel,
      });
    }
  }

  // 2. Concentration risk
  if (revenue.revenueByCustomer.length > 0) {
    const topClient = revenue.revenueByCustomer[0];
    if (topClient.percentage >= 35) {
      insights.push({
        id: 'bi-client-concentration',
        type: 'warning',
        title: 'Customer Revenue Concentration',
        observation: `Client "${topClient.customer}" contributes $${topClient.amount.toLocaleString()} (${topClient.percentage}% of total sales). Consider diversifying revenue pipelines to mitigate customer dependency risks.`,
        supportingMetric: `${topClient.percentage}% share`,
        periodLabel,
        recommendation: 'Target accounts in complementary verticals to balance client concentration.',
      });
    }
  }

  // 3. Operating expense concentration
  if (expenses.expensesByCategory.length > 0) {
    const topCategory = expenses.expensesByCategory[0];
    insights.push({
      id: 'bi-top-expense',
      type: 'neutral',
      title: `Primary Cost Driver: ${topCategory.category}`,
      observation: `The largest operational expenditure in ${periodLabel} is "${topCategory.category}" at $${topCategory.amount.toLocaleString()} (${topCategory.percentage}% of all expenses).`,
      supportingMetric: `$${topCategory.amount.toLocaleString()} (${topCategory.percentage}%)`,
      periodLabel,
    });
  }

  // 4. Accounts Receivable Ageing
  if (revenue.overdueInvoicesTotal > 0) {
    insights.push({
      id: 'bi-overdue-ar',
      type: 'warning',
      title: 'Past-Due Receivables Requiring Collection',
      observation: `$${revenue.overdueInvoicesTotal.toLocaleString()} in issued invoices has exceeded contractual due dates across ${revenue.overdueInvoicesCount} client account${revenue.overdueInvoicesCount > 1 ? 's' : ''}.`,
      supportingMetric: `$${revenue.overdueInvoicesTotal.toLocaleString()} past due`,
      periodLabel,
      recommendation: 'Initiate automated payment reminders and dunning cycles on accounts over 30 days.',
    });
  }

  // 5. Operating Margin
  if (profitability.operatingProfitMarginPercent !== null && profitability.revenue > 0) {
    const opMargin = profitability.operatingProfitMarginPercent;
    insights.push({
      id: 'bi-operating-efficiency',
      type: opMargin >= 20 ? 'positive' : 'warning',
      title: opMargin >= 20 ? 'Healthy Operating Margin' : 'Compressed Operating Margin',
      observation: `Operational profit margin is currently ${opMargin.toFixed(1)}% (Operating Profit: $${profitability.operatingProfit?.toLocaleString()}).`,
      supportingMetric: `${opMargin.toFixed(1)}% operating margin`,
      periodLabel,
    });
  }

  return insights;
}

/**
 * Complete Analytics aggregation pipeline.
 */
export function buildCompleteAnalyticsDataset(
  transactions: FinancialTransaction[],
  salesInvoices: SalesInvoice[],
  reconciliationSessions: ReconciliationSession[],
  filter: AnalyticsFilterState,
  manualInputs: ManualFinancialInputs
): CompleteAnalyticsDataset {
  const dateRange = filter.period === 'custom'
    ? { startDate: filter.startDate, endDate: filter.endDate, label: `${filter.startDate} to ${filter.endDate}` }
    : resolveDateRange(filter.period);

  const activeFilter: AnalyticsFilterState = {
    ...filter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  };

  const revenue = calculateRevenueAnalytics(salesInvoices, activeFilter);
  const expenses = calculateExpenseAnalytics(transactions, activeFilter);
  const profitability = calculateProfitability(revenue, expenses, manualInputs);
  const ratios = calculateFinancialRatios(profitability, revenue, expenses, manualInputs, reconciliationSessions);
  const cashMovement = calculateCashMovement(reconciliationSessions, 'acct-chase-4092');

  // Previous period comparison
  const prevDateRange = getPreviousPeriodDateRange(activeFilter.startDate, activeFilter.endDate);
  const prevFilter: AnalyticsFilterState = {
    ...activeFilter,
    startDate: prevDateRange.startDate,
    endDate: prevDateRange.endDate,
  };
  const prevRevenue = calculateRevenueAnalytics(salesInvoices, prevFilter);
  const prevExpenses = calculateExpenseAnalytics(transactions, prevFilter);

  const periodComparison = calculatePeriodComparison(
    revenue,
    expenses,
    prevRevenue,
    prevExpenses,
    dateRange.label,
    prevDateRange.label
  );

  const dataQuality = evaluateDataQuality(transactions, salesInvoices, reconciliationSessions, manualInputs, activeFilter);
  const insights = generateBusinessInsights(revenue, expenses, profitability, periodComparison, dateRange.label);

  return {
    filter: activeFilter,
    periodLabel: dateRange.label,
    revenue,
    expenses,
    profitability,
    ratios,
    periodComparison,
    cashMovement,
    dataQuality,
    insights,
    manualInputs,
  };
}

/**
 * Exports complete analytics report to CSV with OWASP formula-injection protection.
 */
export function exportAnalyticsReportCsv(dataset: CompleteAnalyticsDataset): string {
  const metaHeaders = ['FinPilot AI Financial Analytics Report', 'Traceable Enterprise Audit'];
  const metaRows: (string | number)[][] = [
    ['Reporting Period', sanitizeForSpreadsheet(dataset.periodLabel)],
    ['Date Range', `${dataset.filter.startDate} to ${dataset.filter.endDate}`],
    ['Currency', dataset.filter.currency],
    ['Data Provenance', dataset.filter.includeDemoData ? 'Demo & User Data' : 'User Data Only'],
    ['Generated At', new Date().toISOString()],
    [],
    ['--- Profitability & Operational Summary ---'],
    ['Recorded Revenue', dataset.profitability.revenue.toFixed(2)],
    ['Cost of Goods Sold (COGS)', dataset.profitability.costOfGoodsSold !== null ? dataset.profitability.costOfGoodsSold.toFixed(2) : 'Unavailable'],
    ['Gross Profit', dataset.profitability.grossProfit !== null ? dataset.profitability.grossProfit.toFixed(2) : 'Unavailable'],
    ['Gross Profit Margin (%)', dataset.profitability.grossProfitMarginPercent !== null ? `${dataset.profitability.grossProfitMarginPercent.toFixed(1)}%` : 'Unavailable'],
    ['Total Operating Expenses', dataset.profitability.operatingExpenses.toFixed(2)],
    ['Operating Profit', dataset.profitability.operatingProfit !== null ? dataset.profitability.operatingProfit.toFixed(2) : 'Unavailable'],
    ['Operating Margin (%)', dataset.profitability.operatingProfitMarginPercent !== null ? `${dataset.profitability.operatingProfitMarginPercent.toFixed(1)}%` : 'Unavailable'],
    ['Net Profit', dataset.profitability.netProfit.toFixed(2)],
    ['Net Profit Margin (%)', `${dataset.profitability.netProfitMarginPercent.toFixed(1)}%`],
    ['Cash Payments Received', dataset.revenue.cashPaymentsReceived.toFixed(2)],
    ['Outstanding Receivables', dataset.revenue.outstandingReceivables.toFixed(2)],
    [],
    ['--- Financial Ratio Analysis ---'],
  ];

  const ratioHeaders = [
    'Ratio Category',
    'Ratio Name',
    'Calculated Value',
    'Formula',
    'Benchmark Target',
    'Status',
    'Missing Inputs',
    'Interpretation',
  ];

  const ratioRows = dataset.ratios.map((r) => [
    r.category.toUpperCase(),
    sanitizeForSpreadsheet(r.name),
    sanitizeForSpreadsheet(r.formattedValue),
    sanitizeForSpreadsheet(r.formula),
    sanitizeForSpreadsheet(r.benchmark),
    r.status.toUpperCase(),
    sanitizeForSpreadsheet(r.missingInputs.join('; ') || 'None'),
    sanitizeForSpreadsheet(r.interpretation),
  ]);

  const expenseHeaders = ['Category', 'Amount', 'Share (%)', 'Transactions'];
  const expenseRows = dataset.expenses.expensesByCategory.map((c) => [
    sanitizeForSpreadsheet(c.category),
    c.amount.toFixed(2),
    `${c.percentage.toFixed(1)}%`,
    c.transactionCount,
  ]);

  const metaCsv = serializeToCsv(metaHeaders, metaRows);
  const ratioCsv = serializeToCsv(ratioHeaders, ratioRows);
  const expenseCsv = serializeToCsv(expenseHeaders, expenseRows);

  return `${metaCsv}\n\n${ratioCsv}\n\n--- Expense Categories ---\n${expenseCsv}`;
}
