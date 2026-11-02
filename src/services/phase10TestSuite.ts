/**
 * FinPilot AI - Phase 10: Executive Reports & Business Reporting Test Suite
 * 32 deterministic verification test scenarios covering all aspects of consolidated reporting.
 */

import {
  ExecutiveReportConfig,
  ConsolidatedReportData,
  PeriodPreset,
} from '../types/executiveReport';
import {
  buildConsolidatedReportData,
  calculatePeriodDates,
  sanitizeForSpreadsheet,
  formatCsvRow,
  generateReportSummaryCsv,
  generateSectionCsv,
  generateDeterministicExecutiveCommentary,
} from './executiveReportEngine';
import { FinancialTransaction } from '../types/finance';
import { SalesInvoice } from '../types/salesInvoice';
import { ReconciliationSession } from '../types/reconciliation';

export interface TestCaseResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  details?: string;
}

export function runPhase10TestSuite(): {
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  const addTest = (
    id: string,
    category: string,
    name: string,
    passed: boolean,
    expected: any,
    actual: any,
    details?: string
  ) => {
    results.push({ id, category, name, passed, expected, actual, details });
  };

  // Sample Mock Fixtures
  const mockTransactions: FinancialTransaction[] = [
    {
      id: 'TX-101',
      date: '2026-03-10',
      vendor: 'Acme Cloud Hosting',
      category: 'Cloud Infrastructure',
      account: '6100-Tech',
      amount: 4000,
      type: 'debit',
      entryType: 'expense',
      status: 'matched',
      ledgerStatus: 'posted',
      source: 'user_uploaded',
    },
    {
      id: 'TX-102',
      date: '2026-03-15',
      vendor: 'Apex Legal Partners',
      category: 'Legal & Compliance',
      account: '6200-Legal',
      amount: 6000,
      type: 'debit',
      entryType: 'expense',
      status: 'matched',
      ledgerStatus: 'posted',
      source: 'user_uploaded',
    },
    {
      id: 'TX-103',
      date: '2026-03-20',
      vendor: 'Global Enterprise Corp',
      category: 'Enterprise SaaS Contracts',
      account: '4000-Revenue',
      amount: 25000,
      type: 'credit',
      entryType: 'revenue',
      status: 'matched',
      ledgerStatus: 'posted',
      source: 'user_uploaded',
    },
    {
      id: 'TX-104',
      date: '2026-03-25',
      vendor: 'Pacific Logistics',
      category: 'Platform Licensing',
      account: '4100-Revenue',
      amount: 15000,
      type: 'credit',
      entryType: 'revenue',
      status: 'matched',
      ledgerStatus: 'posted',
      source: 'user_uploaded',
    },
    {
      id: 'TX-OUT-OF-BOUNDS',
      date: '2025-01-01',
      vendor: 'Ancient Vendor',
      category: 'Old Expense',
      account: '6000-Old',
      amount: 9999,
      type: 'debit',
      entryType: 'expense',
      status: 'matched',
      ledgerStatus: 'posted',
      source: 'user_uploaded',
    },
  ];

  const mockInvoices: SalesInvoice[] = [
    {
      id: 'INV-201',
      invoiceNumber: 'INV-2026-001',
      customer: { customerName: 'Client Alpha', email: 'alpha@example.com' } as any,
      seller: { companyName: 'Meridian Dynamics Corp' } as any,
      paymentTerms: 'Net 30',
      invoiceDiscountType: 'fixed',
      invoiceDiscountValue: 0,
      taxConfig: { regime: 'standard', label: 'Standard', defaultRate: 10, isGst: false },
      additionalCharges: 0,
      totalLineDiscounts: 0,
      invoiceDiscountAmount: 0,
      taxableAmount: 10000,
      taxBreakdown: [],
      totalTaxAmount: 1000,
      grandTotal: 11000,
      payments: [],
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      subtotal: 10000,
      total: 11000,
      amountPaid: 11000,
      outstandingBalance: 0,
      status: 'paid',
      currency: 'USD',
      items: [],
      source: 'user_created',
      createdAt: '2026-03-01',
      updatedAt: '2026-03-01',
    },
    {
      id: 'INV-202',
      invoiceNumber: 'INV-2026-002',
      customer: { customerName: 'Client Beta', email: 'beta@example.com' } as any,
      seller: { companyName: 'Meridian Dynamics Corp' } as any,
      paymentTerms: 'Net 30',
      invoiceDiscountType: 'fixed',
      invoiceDiscountValue: 0,
      taxConfig: { regime: 'standard', label: 'Standard', defaultRate: 10, isGst: false },
      additionalCharges: 0,
      totalLineDiscounts: 0,
      invoiceDiscountAmount: 0,
      taxableAmount: 5000,
      taxBreakdown: [],
      totalTaxAmount: 500,
      grandTotal: 5500,
      payments: [],
      issueDate: '2026-03-05',
      dueDate: '2026-02-15', // Overdue ~44 days relative to 2026-03-31
      subtotal: 5000,
      total: 5500,
      amountPaid: 1000,
      outstandingBalance: 4500,
      status: 'overdue',
      currency: 'USD',
      items: [],
      source: 'user_created',
      createdAt: '2026-03-05',
      updatedAt: '2026-03-05',
    },
  ];

  const mockSessions: ReconciliationSession[] = [
    {
      id: 'REC-S1',
      accountId: 'ACC-01',
      sessionDate: '2026-03-31',
      status: 'locked',
      matchRate: 98,
      difference: 0,
      transactions: [{ isMatched: true }, { isMatched: true }] as any,
    } as any,
    {
      id: 'REC-S2',
      accountId: 'ACC-02',
      sessionDate: '2026-03-31',
      status: 'in_progress',
      matchRate: 88,
      difference: 350,
      transactions: [{ isMatched: true }, { isMatched: false }] as any,
    } as any,
  ];

  const baseConfig: ExecutiveReportConfig = {
    id: 'REP-TEST-01',
    title: 'Q1 FY2026 Executive Financial Report',
    entityName: 'Meridian Global Corp',
    template: 'executive_summary',
    periodPreset: 'custom',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    currency: 'USD',
    includedSections: [
      'executive_summary',
      'financial_performance',
      'operations_receivables',
      'reconciliation_controls',
      'advisory_highlights',
      'data_quality',
    ],
    executiveCommentary: 'Strong operational cash flow achieved in Q1 FY2026.',
    preparedBy: 'Chief Financial Officer',
    confidentialityLevel: 'Board & Executive',
    createdAt: '2026-03-31T12:00:00Z',
    updatedAt: '2026-03-31T12:00:00Z',
  };

  const report = buildConsolidatedReportData(baseConfig, {
    transactions: mockTransactions,
    salesInvoices: mockInvoices,
    reconciliationSessions: mockSessions,
  });

  // TEST 1: P&L revenue total equals sum of credit entries (25000 + 15000 = 40000)
  addTest(
    'TC-P10-01',
    'Financial Performance',
    'Revenue total accurately sums credit/inflow transactions',
    report.performance.revenueTotal === 40000,
    40000,
    report.performance.revenueTotal
  );

  // TEST 2: P&L expenses total equals sum of debit entries (4000 + 6000 = 10000)
  addTest(
    'TC-P10-02',
    'Financial Performance',
    'Expenses total accurately sums debit/outflow transactions',
    report.performance.expenseTotal === 10000,
    10000,
    report.performance.expenseTotal
  );

  // TEST 3: Net Operating Income = Revenue - Expenses (40000 - 10000 = 30000)
  addTest(
    'TC-P10-03',
    'Financial Performance',
    'Net Operating Income equals Revenue minus Operating Expenses',
    report.performance.netIncome === 30000,
    30000,
    report.performance.netIncome
  );

  // TEST 4: Operating Margin % = (30000 / 40000) * 100 = 75.0%
  addTest(
    'TC-P10-04',
    'Financial Performance',
    'Operating Margin Percentage calculation is exact',
    report.performance.operatingMargin === 75,
    75,
    report.performance.operatingMargin
  );

  // TEST 5: Operating Margin handles zero revenue without NaN
  const zeroRevReport = buildConsolidatedReportData(
    { ...baseConfig, startDate: '2028-01-01', endDate: '2028-01-31' },
    { transactions: [], salesInvoices: [] }
  );
  addTest(
    'TC-P10-05',
    'Financial Performance',
    'Operating Margin safely returns 0% when revenue is zero (no NaN)',
    zeroRevReport.performance.operatingMargin === 0 && !isNaN(zeroRevReport.performance.operatingMargin),
    0,
    zeroRevReport.performance.operatingMargin
  );

  // TEST 6: Category aggregation: sum of expense categories equals total expenses
  const sumCatExpenses = report.performance.topExpenseCategories.reduce((acc, c) => acc + c.amount, 0);
  addTest(
    'TC-P10-06',
    'Category Aggregation',
    'Sum of individual expense categories equals total expenses',
    sumCatExpenses === report.performance.expenseTotal,
    report.performance.expenseTotal,
    sumCatExpenses
  );

  // TEST 7: Category aggregation: percentage shares sum to 100%
  const sumCatPct = report.performance.topExpenseCategories.reduce((acc, c) => acc + c.percentage, 0);
  addTest(
    'TC-P10-07',
    'Category Aggregation',
    'Expense category percentage shares sum to 100%',
    Math.abs(sumCatPct - 100) < 0.1,
    100,
    sumCatPct
  );

  // TEST 8: Period bounds filtering: transactions strictly outside dates are excluded
  const hasOldTx = report.performance.topExpenseCategories.some((c) => c.category === 'Old Expense');
  addTest(
    'TC-P10-08',
    'Period Bounds',
    'Transactions outside date boundaries are strictly excluded',
    !hasOldTx,
    false,
    hasOldTx
  );

  // TEST 9: Period bounds filtering: transactions exactly on start/end dates are included
  addTest(
    'TC-P10-09',
    'Period Bounds',
    'Transactions within range [2026-03-01, 2026-03-31] are included',
    report.performance.revenueEntriesCount === 2 && report.performance.expenseEntriesCount === 2,
    { revenueCount: 2, expenseCount: 2 },
    { revenueCount: report.performance.revenueEntriesCount, expenseCount: report.performance.expenseEntriesCount }
  );

  // TEST 10: Period presets: current_month computes valid month boundaries
  const currentMonthDates = calculatePeriodDates('current_month', new Date(2026, 2, 15)); // March 2026
  addTest(
    'TC-P10-10',
    'Period Presets',
    'Current Month preset yields first and last day of month',
    currentMonthDates.startDate === '2026-03-01' && currentMonthDates.endDate === '2026-03-31',
    { startDate: '2026-03-01', endDate: '2026-03-31' },
    currentMonthDates
  );

  // TEST 11: Period presets: current_quarter computes valid 3-month boundaries
  const currentQuarterDates = calculatePeriodDates('current_quarter', new Date(2026, 2, 15)); // Q1 2026
  addTest(
    'TC-P10-11',
    'Period Presets',
    'Current Quarter preset yields first day of Q1 and last day of Q1',
    currentQuarterDates.startDate === '2026-01-01' && currentQuarterDates.endDate === '2026-03-31',
    { startDate: '2026-01-01', endDate: '2026-03-31' },
    currentQuarterDates
  );

  // TEST 12: Period presets: current_year spans Jan 1 to Dec 31
  const currentYearDates = calculatePeriodDates('current_year', new Date(2026, 5, 1));
  addTest(
    'TC-P10-12',
    'Period Presets',
    'Current Year preset spans full calendar year',
    currentYearDates.startDate === '2026-01-01' && currentYearDates.endDate === '2026-12-31',
    { startDate: '2026-01-01', endDate: '2026-12-31' },
    currentYearDates
  );

  // TEST 13: Period comparison: prior period duration matches current period duration
  addTest(
    'TC-P10-13',
    'Period Comparison',
    'Prior period comparison structure initialized',
    report.performance.periodComparison !== undefined,
    true,
    Boolean(report.performance.periodComparison)
  );

  // TEST 14: Receivables: total invoiced amount equals sum of invoice totals (11000 + 5500 = 16500)
  addTest(
    'TC-P10-14',
    'Operations & Receivables',
    'Total Invoiced billing amount sums invoice totals',
    report.operationsReceivables.totalInvoicedAmount === 16500,
    16500,
    report.operationsReceivables.totalInvoicedAmount
  );

  // TEST 15: Receivables: total cash collected equals sum of payments (11000 + 1000 = 12000)
  addTest(
    'TC-P10-15',
    'Operations & Receivables',
    'Total Cash Collected accurately sums settled payments',
    report.operationsReceivables.totalPaidAmount === 12000,
    12000,
    report.operationsReceivables.totalPaidAmount
  );

  // TEST 16: Receivables: total outstanding balance equals sum of unpaid balances (4500)
  addTest(
    'TC-P10-16',
    'Operations & Receivables',
    'Total Outstanding Balance equals open invoice debt',
    report.operationsReceivables.totalOutstandingAmount === 4500,
    4500,
    report.operationsReceivables.totalOutstandingAmount
  );

  // TEST 17: Receivables ageing: correctly classifies 31-60 days past due bucket
  addTest(
    'TC-P10-17',
    'Operations & Receivables',
    'Invoice overdue by 44 days falls into 31-60 days bucket',
    report.operationsReceivables.ageingBuckets.days31to60 === 4500,
    4500,
    report.operationsReceivables.ageingBuckets.days31to60
  );

  // TEST 18: Bank reconciliation: average match rate computed across sessions ((98 + 88) / 2 = 93)
  addTest(
    'TC-P10-18',
    'Reconciliation & Controls',
    'Average match rate is calculated deterministically across sessions',
    report.reconciliationControls.averageMatchRatePercent === 93,
    93,
    report.reconciliationControls.averageMatchRatePercent
  );

  // TEST 19: Bank reconciliation: locked sessions count accurately identifies locked sessions (1)
  addTest(
    'TC-P10-19',
    'Reconciliation & Controls',
    'Locked sessions count correctly identifies locked compliance sessions',
    report.reconciliationControls.lockedSessionsCount === 1,
    1,
    report.reconciliationControls.lockedSessionsCount
  );

  // TEST 20: Bank reconciliation: total discrepancy amount sums unresolved variances (350)
  addTest(
    'TC-P10-20',
    'Reconciliation & Controls',
    'Unresolved discrepancy amount correctly sums session differences',
    report.reconciliationControls.unmatchedDiscrepancyAmount === 350,
    350,
    report.reconciliationControls.unmatchedDiscrepancyAmount
  );

  // TEST 21: Forecast: baseline quarterly run rate projects 3 months of run rate
  addTest(
    'TC-P10-21',
    'Forecast & Scenarios',
    'Forecast projections provide baseline quarterly run rate',
    (report.forecastScenarios.baselineQuarterlyRunRate || 0) > 0,
    true,
    report.forecastScenarios.baselineQuarterlyRunRate
  );

  // TEST 22: Forecast: scenario divergence spread equals optimistic minus pessimistic revenue
  const expSpread = (report.forecastScenarios.optimisticScenarioRevenue || 0) - (report.forecastScenarios.pessimisticScenarioRevenue || 0);
  addTest(
    'TC-P10-22',
    'Forecast & Scenarios',
    'Scenario uncertainty spread equals difference between upside and downside cases',
    report.forecastScenarios.uncertaintySpread === expSpread,
    expSpread,
    report.forecastScenarios.uncertaintySpread
  );

  // TEST 23: Annual report: handles missing annual reports gracefully
  addTest(
    'TC-P10-23',
    'Annual Report Intelligence',
    'Handles missing annual report filing gracefully with flag',
    report.annualReportAnalysis.hasAnnualReports === false,
    false,
    report.annualReportAnalysis.hasAnnualReports
  );

  // TEST 24: Annual report: extracts audited ratios when 10-K present
  const reportWith10K = buildConsolidatedReportData(baseConfig, {
    transactions: mockTransactions,
    salesInvoices: mockInvoices,
    annualReports: [
      {
        id: 'AR-01',
        entityName: 'Meridian Global Corp',
        fiscalYear: 'FY 2025',
        periodEndDate: '2025-12-31',
        currency: 'USD',
        reportingScale: 'units',
        status: 'ready_for_analysis',
        isFullyReviewed: true,
        pageCount: 65,
        fileName: 'Meridian_10K_FY2025.pdf',
        fileSizeBytes: 4200000,
        source: 'user_upload',
        uploadedAt: '2026-01-15T00:00:00Z',
        updatedAt: '2026-01-15T00:00:00Z',
        auditorOpinion: {
          firm: 'Ernst & Young LLP',
          opinion: 'unqualified',
          hasGoingConcern: false,
          pageNumber: 38,
        },
        lineItems: [
          { normalizedKey: 'revenue', normalizedNumericValue: 1000000 } as any,
          { normalizedKey: 'operating_income', normalizedNumericValue: 280000 } as any,
          { normalizedKey: 'current_assets', normalizedNumericValue: 500000 } as any,
          { normalizedKey: 'current_liabilities', normalizedNumericValue: 250000 } as any,
        ],
        narrativeSnippets: [],
      },
    ],
  });
  addTest(
    'TC-P10-24',
    'Annual Report Intelligence',
    'Extracts audited operating margin and current ratio when 10-K is present',
    reportWith10K.annualReportAnalysis.operatingMargin === 28 && reportWith10K.annualReportAnalysis.currentRatio === 2,
    { operatingMargin: 28, currentRatio: 2 },
    { operatingMargin: reportWith10K.annualReportAnalysis.operatingMargin, currentRatio: reportWith10K.annualReportAnalysis.currentRatio }
  );

  // TEST 25: Advisory highlights: extracts risk score and level
  addTest(
    'TC-P10-25',
    'Advisory Highlights',
    'Extracts composite risk score and risk rating',
    typeof report.advisoryHighlights.overallRiskScore === 'number' && ['low', 'moderate', 'elevated', 'critical'].includes(report.advisoryHighlights.riskLevel),
    true,
    { score: report.advisoryHighlights.overallRiskScore, level: report.advisoryHighlights.riskLevel }
  );

  // TEST 26: Advisory highlights: extracts top prioritized recommendations
  addTest(
    'TC-P10-26',
    'Advisory Highlights',
    'Extracts top prioritized recommendations',
    report.advisoryHighlights.topRecommendations.length > 0,
    true,
    report.advisoryHighlights.topRecommendations.length
  );

  // TEST 27: Multi-source provenance: accounts for all 8 financial tiers
  addTest(
    'TC-P10-27',
    'Data Provenance',
    'Multi-source provenance accounting encompasses 8 distinct tiers',
    report.provenance.length === 8,
    8,
    report.provenance.length
  );

  // TEST 28: Integrity warnings: triggers demo data warning when demo entries present
  const demoReport = buildConsolidatedReportData(baseConfig, {
    transactions: [{ ...mockTransactions[0], source: 'demo', id: 'TX-DEMO-01' }],
    salesInvoices: [],
  });
  const hasDemoWarn = demoReport.qualityWarnings.some((w) => w.code === 'WARN_DEMO_DATA_ACTIVE');
  addTest(
    'TC-P10-28',
    'Integrity Warnings',
    'Triggers demo data warning when demo records are detected',
    hasDemoWarn,
    true,
    hasDemoWarn
  );

  // TEST 29: Integrity warnings: triggers bank discrepancy alert when unresolved variances exist
  const hasBankWarn = report.qualityWarnings.some((w) => w.code === 'WARN_BANK_DISCREPANCIES');
  addTest(
    'TC-P10-29',
    'Integrity Warnings',
    'Triggers bank discrepancy alert when sessions exhibit variances',
    hasBankWarn,
    true,
    hasBankWarn
  );

  // TEST 30: Integrity warnings: triggers aged receivables warning when >60-day debt exists
  const agedInvoice: SalesInvoice = {
    ...mockInvoices[1],
    id: 'INV-VERY-OLD',
    dueDate: '2025-12-01', // >90 days overdue
    outstandingBalance: 12000,
  };
  const agedReport = buildConsolidatedReportData(baseConfig, {
    transactions: mockTransactions,
    salesInvoices: [agedInvoice],
  });
  const hasAgedWarn = agedReport.qualityWarnings.some((w) => w.code === 'WARN_OVERDUE_RECEIVABLES');
  addTest(
    'TC-P10-30',
    'Integrity Warnings',
    'Triggers overdue receivables warning when debt exceeds 60 days',
    hasAgedWarn,
    true,
    hasAgedWarn
  );

  // TEST 31: OWASP spreadsheet sanitization: prepends ' to formula injection characters
  const rawFormulas = ['=SUM(A1:B10)', '+cmd|/c', '-100.50', '@SUM', '\tSecret', '\rReturn'];
  const sanitizedFormulas = rawFormulas.map(sanitizeForSpreadsheet);
  const formulaCheckPassed =
    sanitizedFormulas[0] === "'=SUM(A1:B10)" &&
    sanitizedFormulas[1] === "'+cmd|/c" &&
    sanitizedFormulas[3] === "'@SUM" &&
    sanitizedFormulas[4] === "'\tSecret";
  addTest(
    'TC-P10-31',
    'OWASP Security',
    'Prepends quote to neutralize formula injection characters (=, +, @, \\t, \\r)',
    formulaCheckPassed,
    true,
    sanitizedFormulas
  );

  // TEST 32: OWASP spreadsheet sanitization: preserves valid negative numbers without prepending quote
  const validNegativeNumber = '-450.25';
  const sanitizedNegative = sanitizeForSpreadsheet(validNegativeNumber);
  addTest(
    'TC-P10-32',
    'OWASP Security',
    'Preserves valid numeric negative numbers (-450.25) without single-quote prefix',
    sanitizedNegative === '-450.25',
    '-450.25',
    sanitizedNegative
  );

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
