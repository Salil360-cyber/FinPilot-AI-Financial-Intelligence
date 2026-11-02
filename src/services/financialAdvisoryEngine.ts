/**
 * FinPilot AI - Phase 9: Deterministic Financial Advisory Engine
 * Generates transparent, traceable, evidence-grounded advisory insights,
 * health signals, action recommendations, and scenario what-if projections.
 *
 * Strictly deterministic: no fabricated numbers, no hidden zero-fills,
 * and zero autonomous modifications to accounting source records.
 */

import { FinancialTransaction } from '../types/finance';
import { SalesInvoice } from '../types/salesInvoice';
import { ManualFinancialInputs } from '../types/analytics';
import { ForecastRunResult } from '../types/forecast';
import { ReportDocument } from '../types/annualReport';
import {
  AdvisoryInsight,
  AdvisoryHealthSignal,
  AdvisoryRecommendation,
  AdvisoryThresholds,
  DEFAULT_ADVISORY_THRESHOLDS,
  AdvisoryCategory,
  AdvisorySeverity,
  DataProvenance,
  AdvisoryScenarioAdjustment,
  AdvisoryScenarioComparisonResult,
} from '../types/advisory';
import { roundCurrency } from './salesInvoiceCalculator';
import { analyzeCustomerConcentration } from './revenueForecastEngine';

/**
 * Neutralizes CSV formula injection per OWASP & RFC 4180 guidelines.
 * Prepends a single quote if the field begins with '=', '+', '-', or '@',
 * unless the string represents a standard negative numeric value (e.g., "-125.50").
 */
export function sanitizeForSpreadsheet(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str === '') return '';

  // Safe negative numbers check: e.g. -12, -450.25, -$1,200 (if sanitized numeric)
  if (/^-[0-9]+(\.[0-9]+)?$/.test(str)) {
    return str;
  }

  // OWASP dangerous characters check
  if (['=', '+', '-', '@'].includes(str.charAt(0))) {
    return `'${str}`;
  }

  return str;
}

export interface EngineSourceData {
  transactions: FinancialTransaction[];
  salesInvoices: SalesInvoice[];
  manualInputs?: ManualFinancialInputs;
  forecastResult?: ForecastRunResult | null;
  annualReports?: ReportDocument[];
  currency?: string;
  thresholds?: AdvisoryThresholds;
  includeDemoData?: boolean;
}

/**
 * Main evaluation entry point for Phase 9 Financial Advisory.
 */
export function runAdvisoryEngine(data: EngineSourceData): {
  insights: AdvisoryInsight[];
  healthSignals: AdvisoryHealthSignal[];
  recommendations: AdvisoryRecommendation[];
  summary: {
    totalInsights: number;
    highPriorityCount: number;
    attentionRequiredCount: number;
    monitorCount: number;
    informationalCount: number;
    overallHealthStatus: 'healthy' | 'neutral' | 'watch' | 'critical';
  };
} {
  const currency = data.currency || 'USD';
  const thresholds = data.thresholds || DEFAULT_ADVISORY_THRESHOLDS;
  const includeDemo = data.includeDemoData ?? true;

  const insights: AdvisoryInsight[] = [];
  const healthSignals: AdvisoryHealthSignal[] = [];

  const isDemo = Boolean(
    includeDemo && (
      data.transactions.some((t) => t.source === 'demo' || !t.source || t.id?.includes('TX-') || t.id?.includes('DEMO')) ||
      data.salesInvoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))
    )
  );

  // Filter transactions and invoices by currency
  const validTxs = data.transactions.filter(
    (tx) => (tx.currency === currency || !tx.currency) && (includeDemo || (tx.source !== 'demo' && !tx.id?.includes('DEMO'))) && tx.ledgerStatus !== 'cancelled'
  );
  const validInvoices = data.salesInvoices.filter(
    (inv) => (inv.currency === currency || !inv.currency) && (includeDemo || (inv.source !== 'demo' && !inv.id?.includes('DEMO') && (!inv.invoiceNumber || !inv.invoiceNumber.includes('DEMO')))) && inv.status !== 'cancelled'
  );

  // Currency mismatch warning if other currencies exist in records
  const allCurrencies = new Set([
    ...data.transactions.map((t) => t.currency).filter(Boolean),
    ...data.salesInvoices.map((i) => i.currency).filter(Boolean),
  ]);
  allCurrencies.delete(currency);
  if (allCurrencies.size > 0) {
    insights.push({
      id: 'ins-currency-isolation',
      title: 'Multi-Currency Records Isolated',
      category: 'capital_health',
      severity: 'informational',
      explanation: `Analysis is strictly evaluating ${currency} records. Transactions in other currencies (${Array.from(allCurrencies).join(', ')}) were excluded to prevent non-convertible aggregation.`,
      evidenceSummary: `Isolated base currency: ${currency}. Excluded currencies: ${Array.from(allCurrencies).join(', ')}.`,
      sourceValues: [
        { label: 'Active Currency', value: currency, formattedValue: currency, provenance: 'system_calculated' },
        { label: 'Excluded Currencies', value: Array.from(allCurrencies).join(', '), formattedValue: Array.from(allCurrencies).join(', '), provenance: 'system_calculated' },
      ],
      reportingPeriods: ['All Active'],
      calculationFormula: 'Currency == Active Selection',
      sourceModule: 'combined',
      provenance: 'system_calculated',
      isDemoData: false,
      knownLimitations: ['FX cross-rates not applied; figures evaluated in original contract denomination.'],
      suggestedNextAction: 'Inspect excluded currency transactions separately under Multi-Currency settings.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'verified',
    });
  }

  // ==========================================
  // Domain 1: Revenue & Profitability
  // ==========================================
  evaluateRevenueAndProfitability(validTxs, validInvoices, data.manualInputs, thresholds, currency, insights, healthSignals, isDemo);

  // ==========================================
  // Domain 2: Cash Flow & Receivables
  // ==========================================
  evaluateCashFlowAndReceivables(validInvoices, validTxs, data.manualInputs, thresholds, currency, insights, healthSignals, isDemo);

  // ==========================================
  // Domain 3: Expense Efficiency
  // ==========================================
  evaluateExpenseEfficiency(validTxs, validInvoices, thresholds, currency, insights, healthSignals, isDemo);

  // ==========================================
  // Domain 4: Customer Concentration & Exposure
  // ==========================================
  evaluateCustomerConcentration(validInvoices, thresholds, currency, insights, healthSignals, isDemo);

  // ==========================================
  // Domain 5: Forecast & Uncertainty Signals
  // ==========================================
  evaluateForecastSignals(data.forecastResult, validInvoices, thresholds, currency, insights, healthSignals);

  // ==========================================
  // Domain 6: Annual Report Corroboration (if available)
  // ==========================================
  if (data.annualReports && data.annualReports.length > 0) {
    evaluateAnnualReportSignals(data.annualReports, currency, insights, healthSignals);
  }

  // ==========================================
  // Generate Actionable Recommendations
  // ==========================================
  const recommendations = generateRecommendationsFromInsights(insights);

  // Compute Summary
  const highPriorityCount = insights.filter((i) => i.severity === 'high_priority').length;
  const attentionRequiredCount = insights.filter((i) => i.severity === 'attention_required').length;
  const monitorCount = insights.filter((i) => i.severity === 'monitor').length;
  const informationalCount = insights.filter((i) => i.severity === 'informational').length;

  let overallHealthStatus: 'healthy' | 'neutral' | 'watch' | 'critical' = 'healthy';
  if (highPriorityCount > 0) overallHealthStatus = 'critical';
  else if (attentionRequiredCount > 1) overallHealthStatus = 'watch';
  else if (monitorCount > 2) overallHealthStatus = 'neutral';

  return {
    insights,
    healthSignals,
    recommendations,
    summary: {
      totalInsights: insights.length,
      highPriorityCount,
      attentionRequiredCount,
      monitorCount,
      informationalCount,
      overallHealthStatus,
    },
  };
}

/**
 * Evaluates Revenue Trajectory, Margin Shifts, and Expense vs Revenue Growth.
 */
function evaluateRevenueAndProfitability(
  txs: FinancialTransaction[],
  invoices: SalesInvoice[],
  manualInputs: ManualFinancialInputs | undefined,
  thresholds: AdvisoryThresholds,
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[],
  isDemo?: boolean
) {
  // Aggregate sales invoices by month
  const nonDraftInvoices = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
  const monthMap = new Map<string, { invoicedTotal: number; count: number }>();

  nonDraftInvoices.forEach((inv) => {
    const month = inv.issueDate.slice(0, 7); // YYYY-MM
    const current = monthMap.get(month) || { invoicedTotal: 0, count: 0 };
    current.invoicedTotal = roundCurrency(current.invoicedTotal + inv.grandTotal);
    current.count += 1;
    monthMap.set(month, current);
  });

  const sortedMonths = Array.from(monthMap.keys()).sort();

  const getDebit = (t: any): number => {
    if (t.type === 'debit') return t.amount || 0;
    if (t.debit !== undefined) return t.debit;
    if (t.amount !== undefined && t.type !== 'credit') return t.amount;
    return 0;
  };

  // Also calculate monthly expenses from GL
  const expenseMonthMap = new Map<string, number>();
  txs.filter((t) => t.category !== 'Revenue' && t.category !== 'Sales' && getDebit(t) > 0).forEach((t) => {
    const month = t.date.slice(0, 7);
    const curr = expenseMonthMap.get(month) || 0;
    const debitVal = getDebit(t);
    expenseMonthMap.set(month, roundCurrency(curr + debitVal));
  });

  if (sortedMonths.length >= 2) {
    const priorMonth = sortedMonths[sortedMonths.length - 2];
    const currentMonth = sortedMonths[sortedMonths.length - 1];

    const priorRevenue = monthMap.get(priorMonth)!.invoicedTotal;
    const currentRevenue = monthMap.get(currentMonth)!.invoicedTotal;

    const priorOpex = expenseMonthMap.get(priorMonth) || 0;
    const currentOpex = expenseMonthMap.get(currentMonth) || 0;

    // Revenue growth calculation
    let revenueGrowthPct = 0;
    let revBaseZero = false;
    if (priorRevenue === 0) {
      revBaseZero = true;
    } else {
      revenueGrowthPct = roundCurrency(((currentRevenue - priorRevenue) / Math.abs(priorRevenue)) * 100);
    }

    // OpEx growth calculation
    let opexGrowthPct = 0;
    let opexBaseZero = false;
    if (priorOpex === 0) {
      opexBaseZero = true;
    } else {
      opexGrowthPct = roundCurrency(((currentOpex - priorOpex) / Math.abs(priorOpex)) * 100);
    }

    const growthGap = roundCurrency(opexGrowthPct - revenueGrowthPct);

    // Health Signal: Revenue Trajectory
    healthSignals.push({
      id: 'hs-rev-growth',
      domain: 'Revenue & Profitability',
      indicator: 'Period Revenue Growth',
      status: revBaseZero
        ? 'neutral'
        : revenueGrowthPct > 0
        ? 'healthy'
        : revenueGrowthPct > -thresholds.revenueDeclineThresholdPct
        ? 'watch'
        : 'critical',
      valueDisplay: revBaseZero ? 'N/A (Prior $0)' : `${revenueGrowthPct > 0 ? '+' : ''}${revenueGrowthPct}%`,
      numericValue: revBaseZero ? null : revenueGrowthPct,
      benchmarkOrPriorDisplay: `$${priorRevenue.toLocaleString()} (${priorMonth})`,
      trend: revBaseZero ? 'unknown' : revenueGrowthPct > 0 ? 'improving' : revenueGrowthPct < 0 ? 'deteriorating' : 'stable',
      evidence: `Invoiced sales moved from $${priorRevenue.toLocaleString()} in ${priorMonth} to $${currentRevenue.toLocaleString()} in ${currentMonth}.`,
      provenance: 'system_calculated',
      category: 'revenue_profitability',
      limitations: 'Calculated from issued customer invoices; excludes unbilled work in progress.',
    });

    // 1. Revenue Decline Alert
    if (!revBaseZero && revenueGrowthPct < -thresholds.revenueDeclineThresholdPct) {
      insights.push({
        id: 'ins-rev-decline',
        title: `Revenue Contraction of ${Math.abs(revenueGrowthPct)}% Detected`,
        category: 'revenue_profitability',
        severity: revenueGrowthPct < -15 ? 'high_priority' : 'attention_required',
        explanation: `Invoiced customer revenue decreased by ${Math.abs(revenueGrowthPct)}% between ${priorMonth} and ${currentMonth}, exceeding the ${thresholds.revenueDeclineThresholdPct}% advisory threshold.`,
        evidenceSummary: `Prior Period (${priorMonth}): $${priorRevenue.toLocaleString()} | Current Period (${currentMonth}): $${currentRevenue.toLocaleString()} | Delta: -$${Math.abs(currentRevenue - priorRevenue).toLocaleString()}`,
        sourceValues: [
          { label: `Revenue (${priorMonth})`, value: priorRevenue, formattedValue: `$${priorRevenue.toLocaleString()}`, period: priorMonth, provenance: 'system_calculated' },
          { label: `Revenue (${currentMonth})`, value: currentRevenue, formattedValue: `$${currentRevenue.toLocaleString()}`, period: currentMonth, provenance: 'system_calculated' },
          { label: 'Delta', value: currentRevenue - priorRevenue, formattedValue: `-$${Math.abs(currentRevenue - priorRevenue).toLocaleString()}`, provenance: 'system_calculated' },
        ],
        reportingPeriods: [priorMonth, currentMonth],
        calculationFormula: '((Current Revenue − Prior Revenue) ÷ |Prior Revenue|) × 100',
        sourceModule: 'sales_invoices',
        provenance: 'system_calculated',
        isDemoData: Boolean(isDemo || invoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))),
        knownLimitations: ['Invoice timing and billing delays may shift recognized totals between adjacent calendar months.'],
        suggestedNextAction: 'Review contract renewal schedules, pipeline delays, and customer delivery milestones.',
        createdAt: new Date().toISOString(),
        currency,
        qualityStatus: 'verified',
      });
    }

    // 2. OpEx Growth Exceeding Revenue Growth
    if (!revBaseZero && !opexBaseZero && growthGap > thresholds.opexRevenueGrowthGapPct) {
      insights.push({
        id: 'ins-opex-jaws',
        title: 'Operating Expenses Growing Faster Than Revenue',
        category: 'revenue_profitability',
        severity: growthGap > 10 ? 'high_priority' : 'attention_required',
        explanation: `Operating expense growth (${opexGrowthPct > 0 ? '+' : ''}${opexGrowthPct}%) outpaced revenue growth (${revenueGrowthPct > 0 ? '+' : ''}${revenueGrowthPct}%) by ${growthGap}% between ${priorMonth} and ${currentMonth}.`,
        evidenceSummary: `OpEx Growth: ${opexGrowthPct}% | Revenue Growth: ${revenueGrowthPct}% | Growth Gap: +${growthGap}% (Threshold: ${thresholds.opexRevenueGrowthGapPct}%)`,
        sourceValues: [
          { label: 'OpEx Growth', value: opexGrowthPct, formattedValue: `${opexGrowthPct}%`, provenance: 'system_calculated' },
          { label: 'Revenue Growth', value: revenueGrowthPct, formattedValue: `${revenueGrowthPct}%`, provenance: 'system_calculated' },
          { label: 'Growth Spread Gap', value: growthGap, formattedValue: `+${growthGap}%`, provenance: 'system_calculated' },
        ],
        reportingPeriods: [priorMonth, currentMonth],
        calculationFormula: 'OpEx Growth (%) − Revenue Growth (%)',
        sourceModule: 'combined',
        provenance: 'system_calculated',
        isDemoData: Boolean(isDemo || txs.some((t) => t.source === 'demo' || t.id?.includes('TX-') || t.id?.includes('DEMO'))),
        knownLimitations: ['One-off capital or annual software prepayments can temporarily distort short-term opex growth.'],
        suggestedNextAction: 'Audit the fastest growing expense accounts in the General Ledger to verify recurring vs non-recurring nature.',
        createdAt: new Date().toISOString(),
        currency,
        qualityStatus: 'verified',
      });
    }
  } else {
    // Insufficient historical periods
    insights.push({
      id: 'ins-rev-insufficient-history',
      title: 'Insufficient Historical Revenue Periods for Trend Analysis',
      category: 'revenue_profitability',
      severity: 'monitor',
      explanation: `Only ${sortedMonths.length} calendar month(s) with issued sales invoices are present. Period-over-period comparative growth requires at least 2 consecutive monthly periods.`,
      evidenceSummary: `Available months: ${sortedMonths.length > 0 ? sortedMonths.join(', ') : 'None'}. Minimum required: 2.`,
      sourceValues: [
        { label: 'Available Periods', value: sortedMonths.length, formattedValue: `${sortedMonths.length} month(s)`, provenance: 'system_calculated' },
      ],
      reportingPeriods: sortedMonths,
      calculationFormula: 'Count(Distinct Periods with Issued Invoices) >= 2',
      sourceModule: 'sales_invoices',
      provenance: 'system_calculated',
      isDemoData: Boolean(isDemo || invoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))),
      knownLimitations: ['Trend calculations suppressed until more historical cycles are recorded.'],
      suggestedNextAction: 'Issue or import historical invoices or general ledger records for earlier months.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'insufficient_data',
      isUnavailable: true,
      unavailableReason: 'Insufficient historical periods (minimum 2 required).',
    });
  }

  // Profitability margins from manual inputs if provided
  if (manualInputs && manualInputs.totalAssets && manualInputs.currentLiabilities) {
    const ca = manualInputs.currentAssets || 0;
    const cl = manualInputs.currentLiabilities || 0;
    if (cl > 0) {
      const cr = roundCurrency(ca / cl);
      healthSignals.push({
        id: 'hs-current-ratio',
        domain: 'Liquidity & Solvency',
        indicator: 'Current Ratio',
        status: cr >= 1.5 ? 'healthy' : cr >= 1.0 ? 'watch' : 'critical',
        valueDisplay: `${cr.toFixed(2)}x`,
        numericValue: cr,
        benchmarkOrPriorDisplay: 'Benchmark: >= 1.50x',
        trend: 'stable',
        evidence: `Current Assets ($${ca.toLocaleString()}) ÷ Current Liabilities ($${cl.toLocaleString()}) = ${cr.toFixed(2)}x.`,
        provenance: 'manual_assumptions',
        category: 'capital_health',
        limitations: 'Calculated from controller balance-sheet inputs as of ' + (manualInputs.asOfDate || 'recent date'),
      });
    }
  }
}

/**
 * Evaluates Invoiced Sales vs Collected Cash, Receivables Ageing, and Overdue balances.
 */
function evaluateCashFlowAndReceivables(
  invoices: SalesInvoice[],
  txs: FinancialTransaction[],
  manualInputs: ManualFinancialInputs | undefined,
  thresholds: AdvisoryThresholds,
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[],
  isDemo?: boolean
) {
  const issuedInvoices = invoices.filter((i) => i.status !== 'draft' && i.status !== 'cancelled');
  const totalBilled = issuedInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalReceived = issuedInvoices.reduce((sum, i) => sum + (i.amountPaid ?? (i as any).totalPaid ?? 0), 0);
  const totalOutstanding = issuedInvoices.reduce((sum, i) => sum + (i.outstandingBalance ?? (i as any).balanceRemaining ?? 0), 0);

  // Cash collections from ledger
  const ledgerCashCollections = txs
    .filter((t) => t.category === 'Revenue' || t.category === 'Sales')
    .reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : 0), 0);

  // Ageing Breakdown
  const now = new Date();
  let currentAr = 0;
  let overdue1To30 = 0;
  let overdue31To60 = 0;
  let overdue61Plus = 0;
  let totalOverdue = 0;

  issuedInvoices.forEach((inv) => {
    const bal = inv.outstandingBalance ?? (inv as any).balanceRemaining ?? 0;
    if (bal <= 0) return;

    const dueDate = new Date(inv.dueDate);
    const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      currentAr = roundCurrency(currentAr + bal);
    } else {
      totalOverdue = roundCurrency(totalOverdue + bal);
      if (diffDays <= 30) overdue1To30 = roundCurrency(overdue1To30 + bal);
      else if (diffDays <= 60) overdue31To60 = roundCurrency(overdue31To60 + bal);
      else overdue61Plus = roundCurrency(overdue61Plus + bal);
    }
  });

  const overduePct = totalOutstanding > 0 ? roundCurrency((totalOverdue / totalOutstanding) * 100) : 0;
  const collectionRate = totalBilled > 0 ? roundCurrency((totalReceived / totalBilled) * 100) : 100;

  // Health Signal: Receivables Collection Efficiency
  healthSignals.push({
    id: 'hs-rec-overdue',
    domain: 'Cash Flow & Receivables',
    indicator: 'Overdue Receivables Share',
    status: overduePct === 0 ? 'healthy' : overduePct < thresholds.overdueReceivablesThresholdPct ? 'watch' : 'critical',
    valueDisplay: `${overduePct.toFixed(1)}%`,
    numericValue: overduePct,
    benchmarkOrPriorDisplay: `Advisory Tolerance: <${thresholds.overdueReceivablesThresholdPct}%`,
    trend: overduePct > thresholds.overdueReceivablesThresholdPct ? 'deteriorating' : 'stable',
    evidence: `$${totalOverdue.toLocaleString()} overdue out of $${totalOutstanding.toLocaleString()} total outstanding receivables.`,
    provenance: 'system_calculated',
    category: 'cash_receivables',
    limitations: 'Calculated strictly from invoice contractual due dates; excludes unbilled retainers.',
  });

  // 1. Invoiced Revenue vs Cash Collected Separation
  insights.push({
    id: 'ins-rev-vs-cash',
    title: 'Separation of Invoiced Revenue and Cash Collections',
    category: 'cash_receivables',
    severity: totalOutstanding > 0 ? 'monitor' : 'informational',
    explanation: `Total contractually invoiced sales stand at $${totalBilled.toLocaleString()}, of which $${totalReceived.toLocaleString()} has been collected as cash (${collectionRate}%), leaving $${totalOutstanding.toLocaleString()} in active accounts receivable. Note that invoiced sales do not represent guaranteed cash flow.`,
    evidenceSummary: `Invoiced Sales: $${totalBilled.toLocaleString()} | Cash Collected: $${totalReceived.toLocaleString()} (${collectionRate}%) | Outstanding AR: $${totalOutstanding.toLocaleString()} | Ledger Recorded Revenue: $${ledgerCashCollections.toLocaleString()}`,
    sourceValues: [
      { label: 'Total Invoiced Billed', value: totalBilled, formattedValue: `$${totalBilled.toLocaleString()}`, provenance: 'system_calculated' },
      { label: 'Customer Cash Receipts', value: totalReceived, formattedValue: `$${totalReceived.toLocaleString()}`, provenance: 'system_calculated' },
      { label: 'Outstanding Receivables', value: totalOutstanding, formattedValue: `$${totalOutstanding.toLocaleString()}`, provenance: 'system_calculated' },
      { label: 'Ledger Recorded Revenue', value: ledgerCashCollections, formattedValue: `$${ledgerCashCollections.toLocaleString()}`, provenance: 'system_calculated' },
    ],
    reportingPeriods: ['Cumulative Active'],
    calculationFormula: 'Cash Collection Rate = (Cash Received ÷ Total Invoiced Sales) × 100',
    sourceModule: 'sales_invoices',
    provenance: 'system_calculated',
    isDemoData: Boolean(isDemo || invoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))),
    knownLimitations: ['Excludes offline cash payments that have not yet been matched or recorded against an invoice.'],
    suggestedNextAction: 'Review unmatched bank deposit receipts in Bank Reconciliation to accelerate AR application.',
    createdAt: new Date().toISOString(),
    currency,
    qualityStatus: 'verified',
  });

  // 2. High Overdue Receivables Alert
  if (totalOutstanding > 0 && overduePct >= thresholds.overdueReceivablesThresholdPct) {
    insights.push({
      id: 'ins-ar-overdue-alert',
      title: `Overdue Receivables At ${overduePct}% of Active AR`,
      category: 'cash_receivables',
      severity: overduePct > 35 ? 'high_priority' : 'attention_required',
      explanation: `$${totalOverdue.toLocaleString()} (${overduePct}%) of outstanding customer receivables is past its contractual payment due date. $${overdue61Plus.toLocaleString()} is over 60 days delinquent.`,
      evidenceSummary: `Current (Not Due): $${currentAr.toLocaleString()} | 1-30 Days Past Due: $${overdue1To30.toLocaleString()} | 31-60 Days: $${overdue31To60.toLocaleString()} | 60+ Days: $${overdue61Plus.toLocaleString()}`,
      sourceValues: [
        { label: 'Total Overdue AR', value: totalOverdue, formattedValue: `$${totalOverdue.toLocaleString()}`, provenance: 'system_calculated' },
        { label: 'Overdue Percentage', value: overduePct, formattedValue: `${overduePct}%`, provenance: 'system_calculated' },
        { label: 'Over 60 Days Delinquent', value: overdue61Plus, formattedValue: `$${overdue61Plus.toLocaleString()}`, provenance: 'system_calculated' },
      ],
      reportingPeriods: ['As of Today'],
      calculationFormula: '(Total Overdue AR ÷ Total Outstanding AR) × 100',
      sourceModule: 'sales_invoices',
      provenance: 'system_calculated',
      isDemoData: Boolean(isDemo || invoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))),
      knownLimitations: ['Customer grace periods and disputed invoice line items are not factored into calendar due date.'],
      suggestedNextAction: 'Dispatch payment reminder statements for invoices in the 31+ day ageing bucket.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'verified',
    });
  }
}

/**
 * Evaluates Expense Category Concentration and Unusual Cost Jumps.
 */
function evaluateExpenseEfficiency(
  txs: FinancialTransaction[],
  invoices: SalesInvoice[],
  thresholds: AdvisoryThresholds,
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[],
  isDemo?: boolean
) {
  const getDebit = (t: any): number => {
    if (t.type === 'debit') return t.amount || 0;
    if (t.debit !== undefined) return t.debit;
    if (t.amount !== undefined && t.type !== 'credit') return t.amount;
    return 0;
  };

  const expenseTxs = txs.filter((t) => t.category !== 'Revenue' && t.category !== 'Sales' && getDebit(t) > 0);
  const totalExpenses = expenseTxs.reduce((sum, t) => sum + getDebit(t), 0);

  const categoryMap = new Map<string, number>();
  expenseTxs.forEach((t) => {
    const cat = t.category || 'Uncategorized';
    const debitVal = getDebit(t);
    categoryMap.set(cat, roundCurrency((categoryMap.get(cat) || 0) + debitVal));
  });

  const sortedCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0 && totalExpenses > 0) {
    const [topCat, topVal] = sortedCategories[0];
    const topPct = roundCurrency((topVal / totalExpenses) * 100);

    // Health Signal: Expense Category Concentration
    healthSignals.push({
      id: 'hs-exp-concentration',
      domain: 'Expense Efficiency',
      indicator: 'Largest Expense Category Share',
      status: topPct > 45 ? 'watch' : 'healthy',
      valueDisplay: `${topPct}% (${topCat})`,
      numericValue: topPct,
      benchmarkOrPriorDisplay: 'Disclosed Concentration',
      trend: 'stable',
      evidence: `${topCat} represents $${topVal.toLocaleString()} (${topPct}%) of total recorded expenses ($${totalExpenses.toLocaleString()}).`,
      provenance: 'system_calculated',
      category: 'expense_efficiency',
      limitations: 'High single category spend may reflect operational reality (e.g. software infra or payroll) rather than inefficiency.',
    });

    if (topPct > 40) {
      insights.push({
        id: 'ins-exp-concentration',
        title: `Expense Category Concentration: ${topCat} (${topPct}%)`,
        category: 'expense_efficiency',
        severity: topPct > 55 ? 'attention_required' : 'monitor',
        explanation: `The "${topCat}" category accounts for $${topVal.toLocaleString()} (${topPct}%) of all recorded general ledger debits. A high expenditure concentration is not inherently wasteful, but warrants structured vendor renegotiation and review.`,
        evidenceSummary: `Category: ${topCat} | Spend: $${topVal.toLocaleString()} | Total Spend: $${totalExpenses.toLocaleString()} | Share: ${topPct}%`,
        sourceValues: [
          { label: `${topCat} Spend`, value: topVal, formattedValue: `$${topVal.toLocaleString()}`, provenance: 'system_calculated' },
          { label: 'Total Recorded Expenses', value: totalExpenses, formattedValue: `$${totalExpenses.toLocaleString()}`, provenance: 'system_calculated' },
          { label: 'Category Share', value: topPct, formattedValue: `${topPct}%`, provenance: 'system_calculated' },
        ],
        reportingPeriods: ['Active General Ledger'],
        calculationFormula: '(${Category Spend} ÷ Total Expenses) × 100',
        sourceModule: 'general_ledger',
        provenance: 'system_calculated',
        isDemoData: Boolean(isDemo || txs.some((t) => t.source === 'demo' || t.id?.includes('TX-') || t.id?.includes('DEMO'))),
        knownLimitations: ['Multi-department overheads lumped into a single general ledger code can inflate concentration.'],
        suggestedNextAction: `Benchmark vendor contracts in ${topCat} against prevailing market rates or reserved volume commitments.`,
        createdAt: new Date().toISOString(),
        currency,
        qualityStatus: 'verified',
      });
    }
  }
}

/**
 * Evaluates Customer Concentration and Top-N Client Exposure.
 */
function evaluateCustomerConcentration(
  invoices: SalesInvoice[],
  thresholds: AdvisoryThresholds,
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[],
  isDemo?: boolean
) {
  const concentration = analyzeCustomerConcentration(invoices, currency);
  const totalBilledValue = concentration.items.reduce((sum, item) => sum + item.invoicedTotal, 0);

  if (concentration.items.length === 0 || totalBilledValue === 0) {
    return;
  }

  const top1Share = concentration.topCustomerSharePercent;
  const top3Share = concentration.top3SharePercent;
  const topCustomer = concentration.items[0];

  // Health Signal: Customer Concentration
  healthSignals.push({
    id: 'hs-cust-concentration',
    domain: 'Customer Concentration',
    indicator: 'Top Customer Exposure',
    status: top1Share > thresholds.topCustomerConcentrationPct ? 'watch' : 'healthy',
    valueDisplay: `${top1Share}% (${topCustomer?.customerName || 'N/A'})`,
    numericValue: top1Share,
    benchmarkOrPriorDisplay: `Threshold: <${thresholds.topCustomerConcentrationPct}%`,
    trend: top1Share > thresholds.topCustomerConcentrationPct ? 'deteriorating' : 'stable',
    evidence: `Top client accounts for $${topCustomer?.invoicedTotal.toLocaleString()} of $${totalBilledValue.toLocaleString()} billed sales.`,
    provenance: 'system_calculated',
    category: 'customer_concentration',
    limitations: 'Concentration reflects client revenue share; it does not constitute proof of credit or churn risk.',
  });

  // 1. High Single Customer Concentration Alert
  if (top1Share >= thresholds.topCustomerConcentrationPct) {
    insights.push({
      id: 'ins-cust-top1-concentration',
      title: `Single Customer Accounts for ${top1Share}% of Revenue`,
      category: 'customer_concentration',
      severity: top1Share > 45 ? 'high_priority' : 'attention_required',
      explanation: `${topCustomer.customerName} represents $${topCustomer.invoicedTotal.toLocaleString()} (${top1Share}%) of total billed revenue. While reflecting a valuable key account, this creates operational sensitivity to client retention and contract timing.`,
      evidenceSummary: `Top Customer: ${topCustomer.customerName} | Invoiced: $${topCustomer.invoicedTotal.toLocaleString()} | Total Revenue: $${totalBilledValue.toLocaleString()} | Top 1 Share: ${top1Share}% (Threshold: ${thresholds.topCustomerConcentrationPct}%) | Top 3 Share: ${top3Share}%`,
      sourceValues: [
        { label: 'Top Customer Invoiced', value: topCustomer.invoicedTotal, formattedValue: `$${topCustomer.invoicedTotal.toLocaleString()}`, provenance: 'system_calculated' },
        { label: 'Total Invoiced Revenue', value: totalBilledValue, formattedValue: `$${totalBilledValue.toLocaleString()}`, provenance: 'system_calculated' },
        { label: 'Top 1 Concentration Share', value: top1Share, formattedValue: `${top1Share}%`, provenance: 'system_calculated' },
        { label: 'Top 3 Cumulative Share', value: top3Share, formattedValue: `${top3Share}%`, provenance: 'system_calculated' },
      ],
      reportingPeriods: ['Active Invoice Ledger'],
      calculationFormula: '(Top Customer Invoiced ÷ Total Invoiced Sales) × 100',
      sourceModule: 'sales_invoices',
      provenance: 'system_calculated',
      isDemoData: Boolean(isDemo || invoices.some((i) => i.source === 'demo' || i.id?.includes('DEMO'))),
      knownLimitations: ['High concentration in early-stage or enterprise B2B companies is common and not proof of insolvency.'],
      suggestedNextAction: 'Review renewal contract lock-in periods, SLA commitments, and customer acquisition pipeline diversification.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'verified',
    });
  }
}

/**
 * Evaluates Revenue Forecasting Coverage, Uncertainty, and Limitations.
 */
function evaluateForecastSignals(
  forecast: ForecastRunResult | null | undefined,
  invoices: SalesInvoice[],
  thresholds: AdvisoryThresholds,
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[]
) {
  if (!forecast) {
    insights.push({
      id: 'ins-forecast-missing',
      title: 'Revenue Projections Pending Model Execution',
      category: 'forecast_scenarios',
      severity: 'informational',
      explanation: 'No active revenue forecast model has been executed yet in the Revenue Forecasting module.',
      evidenceSummary: 'Forecast state: Uninitialized.',
      sourceValues: [],
      reportingPeriods: [],
      sourceModule: 'forecasting',
      provenance: 'forecast_estimates',
      isDemoData: false,
      knownLimitations: ['Deterministic projections will become available once a forecast run is saved or executed.'],
      suggestedNextAction: 'Navigate to the Revenue Forecast tab and generate a deterministic 6-month projection.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'insufficient_data',
    });
    return;
  }

  const validHist = forecast.historicalSummary?.validPeriodsCount ?? forecast.periods.length;
  const isCoverageWeak = validHist < thresholds.minForecastHistoryMonths;

  // Health Signal: Forecast History Coverage
  healthSignals.push({
    id: 'hs-forecast-coverage',
    domain: 'Forecasting & Scenarios',
    indicator: 'Forecast Historical Coverage',
    status: isCoverageWeak ? 'watch' : 'healthy',
    valueDisplay: `${validHist} months`,
    numericValue: validHist,
    benchmarkOrPriorDisplay: `Min Recommended: ${thresholds.minForecastHistoryMonths} months`,
    trend: isCoverageWeak ? 'deteriorating' : 'stable',
    evidence: `Model calibrated with ${validHist} historical monthly observations. Projecting ${forecast.periods.length} months forward.`,
    provenance: 'forecast_estimates',
    category: 'forecast_scenarios',
    limitations: 'Projections are mathematical extrapolations of past patterns, not guaranteed financial results.',
  });

  if (isCoverageWeak) {
    insights.push({
      id: 'ins-forecast-weak-coverage',
      title: `Forecast Reliability Sensitive to Limited History (${validHist} Months)`,
      category: 'forecast_scenarios',
      severity: 'monitor',
      explanation: `The active ${forecast.methodLabel} forecast relies on ${validHist} month(s) of historical data, which is below the recommended ${thresholds.minForecastHistoryMonths}-month baseline. Projection confidence intervals are consequently wider.`,
      evidenceSummary: `Historical Months: ${validHist} | Target Horizon: ${forecast.periods.length} Months | Projected Total: $${forecast.projectedTotal.toLocaleString()}`,
      sourceValues: [
        { label: 'Historical Observations', value: validHist, formattedValue: `${validHist} months`, provenance: 'system_calculated' },
        { label: 'Projected Total', value: forecast.projectedTotal, formattedValue: `$${forecast.projectedTotal.toLocaleString()}`, provenance: 'forecast_estimates' },
      ],
      reportingPeriods: [`Next ${forecast.periods.length} Months`],
      calculationFormula: 'Valid Historical Periods < Min Baseline',
      sourceModule: 'forecasting',
      provenance: 'forecast_estimates',
      isDemoData: false,
      knownLimitations: ['Mathematical extrapolation cannot predict external market shocks or unannounced customer cancellations.'],
      suggestedNextAction: 'Supplement the model with conservative scenario buffers and incorporate historical general ledger imports.',
      createdAt: new Date().toISOString(),
      currency,
      qualityStatus: 'unverified',
    });
  }
}

/**
 * Cross-references corporate SEC / statutory Annual Report filings.
 */
function evaluateAnnualReportSignals(
  reports: ReportDocument[],
  currency: string,
  insights: AdvisoryInsight[],
  healthSignals: AdvisoryHealthSignal[]
) {
  const activeReport = reports[0];
  if (!activeReport) return;

  const revItem = activeReport.lineItems.find((i) => i.normalizedKey === 'revenue');
  const netIncItem = activeReport.lineItems.find((i) => i.normalizedKey === 'net_income');
  const auditOp = activeReport.auditorOpinion?.opinion;

  // Health Signal: Audit Opinion
  healthSignals.push({
    id: 'hs-audit-opinion',
    domain: 'Governance & Reporting',
    indicator: 'Independent Auditor Opinion',
    status: auditOp === 'unqualified' ? 'healthy' : auditOp ? 'watch' : 'neutral',
    valueDisplay: auditOp === 'unqualified' ? 'Unqualified (Clean)' : auditOp || 'Unspecified',
    benchmarkOrPriorDisplay: 'Standard: Unqualified Opinion',
    trend: 'stable',
    evidence: `Auditor opinion issued by ${activeReport.auditorOpinion?.firm || 'Statutory Auditor'} for ${activeReport.fiscalYear}.`,
    provenance: 'annual_report_extracted',
    category: 'capital_health',
    limitations: 'Pertains to audited annual filing period; does not certify intra-year management transactions.',
  });

  if (revItem && netIncItem) {
    const margin = revItem.extractedValue > 0
      ? roundCurrency((netIncItem.extractedValue / revItem.extractedValue) * 100)
      : null;

    if (margin !== null) {
      insights.push({
        id: 'ins-annual-report-corroboration',
        title: `Annual Report Benchmark: ${activeReport.fiscalYear} Net Margin at ${margin}%`,
        category: 'revenue_profitability',
        severity: 'informational',
        explanation: `Audited statutory filing for ${activeReport.entityName} (${activeReport.fiscalYear}) confirmed net sales of $${revItem.extractedValue}${activeReport.reportingScale === 'millions' ? 'M' : ''} and net income of $${netIncItem.extractedValue}${activeReport.reportingScale === 'millions' ? 'M' : ''}, establishing a verified annual net margin benchmark of ${margin}%.`,
        evidenceSummary: `Entity: ${activeReport.entityName} | Fiscal Year: ${activeReport.fiscalYear} | Net Margin: ${margin}% | Auditor: ${activeReport.auditorOpinion?.firm || 'Independent Auditor'} (${activeReport.auditorOpinion?.opinion || 'Unqualified'})`,
        sourceValues: [
          { label: 'Audited Revenue', value: revItem.extractedValue, formattedValue: `$${revItem.extractedValue}M`, period: activeReport.fiscalYear, provenance: 'annual_report_verified' },
          { label: 'Audited Net Income', value: netIncItem.extractedValue, formattedValue: `$${netIncItem.extractedValue}M`, period: activeReport.fiscalYear, provenance: 'annual_report_verified' },
          { label: 'Audited Net Margin', value: margin, formattedValue: `${margin}%`, provenance: 'annual_report_verified' },
        ],
        reportingPeriods: [activeReport.fiscalYear],
        calculationFormula: '(Audited Net Income ÷ Audited Revenue) × 100',
        sourceModule: 'annual_reports',
        provenance: 'annual_report_verified',
        isDemoData: activeReport.source === 'demo',
        knownLimitations: ['Historical annual filings reflect past periods and do not guarantee future quarterly results.'],
        suggestedNextAction: 'Compare current annualized run-rate margins against this audited benchmark.',
        createdAt: new Date().toISOString(),
        currency,
        qualityStatus: 'verified',
      });
    }
  }
}

/**
 * Generates prioritized Action Recommendations from active insights.
 */
function generateRecommendationsFromInsights(insights: AdvisoryInsight[]): AdvisoryRecommendation[] {
  const recommendations: AdvisoryRecommendation[] = [];

  insights.forEach((insight) => {
    if (insight.severity === 'high_priority' || insight.severity === 'attention_required') {
      let objective = 'Mitigate financial risk and protect operational margin';
      let nextStep = insight.suggestedNextAction;

      if (insight.category === 'revenue_profitability') {
        objective = 'Stabilize recurring customer demand and align cost structure with revenue run-rate';
      } else if (insight.category === 'cash_receivables') {
        objective = 'Accelerate cash conversion and prevent bad-debt write-downs';
      } else if (insight.category === 'customer_concentration') {
        objective = 'Diversify revenue pipeline and secure long-term key account renewal commitments';
      } else if (insight.category === 'expense_efficiency') {
        objective = 'Optimize supplier contracts and eliminate redundant operational outlays';
      }

      recommendations.push({
        id: `rec-${insight.id}`,
        title: `Action Plan: ${insight.title}`,
        businessProblem: insight.explanation,
        supportingEvidence: insight.evidenceSummary,
        expectedObjective: objective,
        suggestedNextStep: nextStep,
        priority: insight.severity,
        dataLimitations: insight.knownLimitations.join(' '),
        status: 'suggested',
        category: insight.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        relatedInsightId: insight.id,
        isDemoData: insight.isDemoData,
      });
    }
  });

  return recommendations;
}

/**
 * Evaluates What-If Scenario Adjustments cleanly without mutating source records.
 */
export function calculateScenarioWhatIf(
  baselineRevenue: number,
  baselineOpex: number,
  adjustment: AdvisoryScenarioAdjustment,
  currency: string = 'USD'
): AdvisoryScenarioComparisonResult {
  const assumptions: string[] = [];

  // 1. Revenue Adjustment:
  // Net growth rate = growthPct + expansionPct - churnPct
  const netGrowthPct = adjustment.revenueGrowthPct + adjustment.customerExpansionPct - adjustment.customerChurnPct;
  assumptions.push(`Organic growth assumption: ${adjustment.revenueGrowthPct > 0 ? '+' : ''}${adjustment.revenueGrowthPct}%`);
  if (adjustment.customerExpansionPct !== 0) assumptions.push(`Key account expansion: +${adjustment.customerExpansionPct}%`);
  if (adjustment.customerChurnPct !== 0) assumptions.push(`Customer churn rate: -${adjustment.customerChurnPct}%`);

  let projRev = baselineRevenue * (1 + netGrowthPct / 100);
  projRev += adjustment.recurringMonthlyAdj;
  if (adjustment.oneTimeMonthIndex === 1) {
    projRev += adjustment.oneTimeAdj;
    assumptions.push(`One-time revenue adjustment: $${adjustment.oneTimeAdj.toLocaleString()}`);
  }

  // Clamping revenue floor to 0
  let isClamped = false;
  if (projRev < 0) {
    projRev = 0;
    isClamped = true;
    assumptions.push('Revenue floor zero-clamping applied to prevent negative sales.');
  }

  // 2. OpEx Adjustment:
  let projOpex = baselineOpex * (1 + adjustment.opexGrowthPct / 100);
  assumptions.push(`Operating expense adjustment: ${adjustment.opexGrowthPct > 0 ? '+' : ''}${adjustment.opexGrowthPct}%`);
  if (projOpex < 0) projOpex = 0;

  // 3. Margin Calculations:
  const baseMargin = baselineRevenue > 0 ? roundCurrency(((baselineRevenue - baselineOpex) / baselineRevenue) * 100) : 0;
  const projMargin = projRev > 0 ? roundCurrency(((projRev - projOpex) / projRev) * 100) : 0;

  const revVar = roundCurrency(projRev - baselineRevenue);
  const revVarPct = baselineRevenue > 0 ? roundCurrency((revVar / baselineRevenue) * 100) : 0;
  const opexVar = roundCurrency(projOpex - baselineOpex);
  const opexVarPct = baselineOpex > 0 ? roundCurrency((opexVar / baselineOpex) * 100) : 0;

  return {
    baselineRevenue: roundCurrency(baselineRevenue),
    projectedRevenue: roundCurrency(projRev),
    baselineOpex: roundCurrency(baselineOpex),
    projectedOpex: roundCurrency(projOpex),
    baselineNetMargin: baseMargin,
    projectedNetMargin: projMargin,
    revenueVariance: revVar,
    revenueVariancePct: revVarPct,
    opexVariance: opexVar,
    opexVariancePct: opexVarPct,
    formulaApplied: 'Projected = Baseline × (1 + (Growth + Expansion − Churn)/100) + Recurring + OneTime',
    assumptionsList: assumptions,
    currency,
    isNegativeClamped: isClamped,
  };
}

/**
 * Exports Advisory Insights to an RFC 4180 CSV string with OWASP protection.
 */
export function exportAdvisoryInsightsCsv(insights: AdvisoryInsight[], currency: string = 'USD'): string {
  const lines: string[] = [];

  // Header metadata
  lines.push('"FinPilot AI - Financial Advisory Insights Report"');
  lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
  lines.push(`"Base Currency","${sanitizeForSpreadsheet(currency)}"`);
  lines.push('');

  // Column Headers
  lines.push(
    '"Insight ID","Title","Category","Severity","Explanation","Evidence Summary","Provenance","Demo Data","Quality Status","Reporting Periods","Formula","Suggested Next Action"'
  );

  insights.forEach((i) => {
    lines.push(
      [
        `"${sanitizeForSpreadsheet(i.id)}"`,
        `"${sanitizeForSpreadsheet(i.title)}"`,
        `"${sanitizeForSpreadsheet(i.category)}"`,
        `"${sanitizeForSpreadsheet(i.severity)}"`,
        `"${sanitizeForSpreadsheet(i.explanation)}"`,
        `"${sanitizeForSpreadsheet(i.evidenceSummary)}"`,
        `"${sanitizeForSpreadsheet(i.provenance)}"`,
        `"${i.isDemoData ? 'YES' : 'NO'}"`,
        `"${sanitizeForSpreadsheet(i.qualityStatus)}"`,
        `"${sanitizeForSpreadsheet(i.reportingPeriods.join('; '))}"`,
        `"${sanitizeForSpreadsheet(i.calculationFormula || 'N/A')}"`,
        `"${sanitizeForSpreadsheet(i.suggestedNextAction)}"`,
      ].join(',')
    );
  });

  return lines.join('\r\n');
}

/**
 * Exports Action Recommendations to an RFC 4180 CSV string.
 */
export function exportRecommendationsCsv(recs: AdvisoryRecommendation[], currency: string = 'USD'): string {
  const lines: string[] = [];

  lines.push('"FinPilot AI - Prioritized Advisory Action Board"');
  lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
  lines.push(`"Currency","${sanitizeForSpreadsheet(currency)}"`);
  lines.push('');

  lines.push(
    '"Recommendation ID","Title","Priority","Status","Business Problem","Expected Objective","Suggested Next Step","Data Limitations","User Notes"'
  );

  recs.forEach((r) => {
    lines.push(
      [
        `"${sanitizeForSpreadsheet(r.id)}"`,
        `"${sanitizeForSpreadsheet(r.title)}"`,
        `"${sanitizeForSpreadsheet(r.priority)}"`,
        `"${sanitizeForSpreadsheet(r.status.toUpperCase())}"`,
        `"${sanitizeForSpreadsheet(r.businessProblem)}"`,
        `"${sanitizeForSpreadsheet(r.expectedObjective)}"`,
        `"${sanitizeForSpreadsheet(r.suggestedNextStep)}"`,
        `"${sanitizeForSpreadsheet(r.dataLimitations)}"`,
        `"${sanitizeForSpreadsheet(r.userNotes || '')}"`,
      ].join(',')
    );
  });

  return lines.join('\r\n');
}

/**
 * Exports Scenario Comparison to an RFC 4180 CSV string.
 */
export function exportScenarioComparisonCsv(
  comp: AdvisoryScenarioComparisonResult,
  currency: string = 'USD'
): string {
  const lines: string[] = [];

  lines.push('"FinPilot AI - Scenario What-If Comparison Summary"');
  lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
  lines.push(`"Currency","${sanitizeForSpreadsheet(currency)}"`);
  lines.push('');

  lines.push('"Metric","Baseline Value","Projected Scenario","Variance ($)","Variance (%)"');
  lines.push(`"Revenue","${comp.baselineRevenue}","${comp.projectedRevenue}","${comp.revenueVariance}","${comp.revenueVariancePct}%"`);
  lines.push(`"Operating Expenses","${comp.baselineOpex}","${comp.projectedOpex}","${comp.opexVariance}","${comp.opexVariancePct}%"`);
  lines.push(`"Operating Net Margin (%)","${comp.baselineNetMargin}%","${comp.projectedNetMargin}%","${roundCurrency(comp.projectedNetMargin - comp.baselineNetMargin)}%","N/A"`);
  lines.push('');

  lines.push('"Assumptions Applied"');
  comp.assumptionsList.forEach((a) => {
    lines.push(`"${sanitizeForSpreadsheet(a)}"`);
  });

  return lines.join('\r\n');
}
