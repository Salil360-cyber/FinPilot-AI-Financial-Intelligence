/**
 * FinPilot AI - Phase 8 Annual Report Validation & Financial Ratio Engine
 * Deterministic accounting reconciliation, multi-year comparisons,
 * GAAP financial ratios, data-quality metrics, and RFC 4180 CSV export.
 */

import {
  ReportDocument,
  FinancialLineItem,
  StatementValidationResult,
  MultiYearComparisonRow,
  AnnualReportRatio,
  DataQualitySummary,
  ReportingScale,
} from '../types/annualReport';
import { roundCurrency } from './salesInvoiceCalculator';
import { sanitizeForSpreadsheet } from './revenueForecastEngine';

/**
 * Validates accounting relationships across financial statements.
 */
export function validateFinancialStatements(report: ReportDocument): StatementValidationResult[] {
  const results: StatementValidationResult[] = [];
  const items = report.lineItems;

  const findVal = (key: string): number | null => {
    const item = items.find((i) => i.normalizedKey === key);
    return item ? item.extractedValue : null;
  };

  // 1. Balance Sheet Balancing Equation: Assets = Liabilities + Equity
  const totalAssets = findVal('total_assets');
  const totalLiabilities = findVal('total_liabilities');
  const totalEquity = findVal('total_equity');

  if (totalAssets !== null && totalLiabilities !== null && totalEquity !== null) {
    const sumLiabEquity = roundCurrency(totalLiabilities + totalEquity);
    const diff = Math.abs(roundCurrency(totalAssets - sumLiabEquity));
    const tolerance = 1.0; // $1M tolerance for presentation rounding
    const passed = diff <= tolerance;

    results.push({
      ruleId: 'bs-balance-identity',
      statementType: 'balance_sheet',
      ruleName: 'Balance Sheet Identity (Assets = Liabilities + Equity)',
      passed,
      formula: 'Total Assets == Total Liabilities + Total Stockholders Equity',
      discrepancy: diff,
      tolerance,
      message: passed
        ? `Balance sheet balances within standard rounding tolerance (Assets: $${totalAssets}M == Liab+Eq: $${sumLiabEquity}M).`
        : `Discrepancy of $${diff}M detected. Total Assets ($${totalAssets}M) does not equal Liabilities + Equity ($${sumLiabEquity}M).`,
      severity: passed ? 'info' : 'warning',
      inputs: [
        { label: 'Total Assets', value: totalAssets },
        { label: 'Total Liabilities', value: totalLiabilities },
        { label: 'Total Equity', value: totalEquity },
      ],
    });
  }

  // 2. Income Statement: Gross Profit = Revenue - COGS
  const revenue = findVal('revenue');
  const cogs = findVal('cogs');
  const grossProfit = findVal('gross_profit');

  if (revenue !== null && cogs !== null && grossProfit !== null) {
    const expectedGrossProfit = roundCurrency(revenue - cogs);
    const diff = Math.abs(roundCurrency(grossProfit - expectedGrossProfit));
    const tolerance = 1.0;
    const passed = diff <= tolerance;

    results.push({
      ruleId: 'is-gross-profit',
      statementType: 'income_statement',
      ruleName: 'Gross Profit Reconciliation (Revenue − COGS)',
      passed,
      formula: 'Gross Profit == Revenue − Cost of Goods Sold',
      discrepancy: diff,
      tolerance,
      message: passed
        ? `Gross profit reconciles ($${revenue}M − $${cogs}M == $${grossProfit}M).`
        : `Gross profit discrepancy of $${diff}M. Expected $${expectedGrossProfit}M, extracted $${grossProfit}M.`,
      severity: passed ? 'info' : 'warning',
      inputs: [
        { label: 'Revenue', value: revenue },
        { label: 'Cost of Goods Sold', value: cogs },
        { label: 'Reported Gross Profit', value: grossProfit },
      ],
    });
  }

  // 3. Income Statement: Operating Income = Gross Profit - Operating Expenses
  const opex = findVal('operating_expenses');
  const operatingIncome = findVal('operating_income');

  if (grossProfit !== null && opex !== null && operatingIncome !== null) {
    const expectedOpInc = roundCurrency(grossProfit - opex);
    const diff = Math.abs(roundCurrency(operatingIncome - expectedOpInc));
    const tolerance = 1.0;
    const passed = diff <= tolerance;

    results.push({
      ruleId: 'is-operating-income',
      statementType: 'income_statement',
      ruleName: 'Operating Income Reconciliation (Gross Profit − OpEx)',
      passed,
      formula: 'Operating Income == Gross Profit − Operating Expenses',
      discrepancy: diff,
      tolerance,
      message: passed
        ? `Operating income reconciles ($${grossProfit}M − $${opex}M == $${operatingIncome}M).`
        : `Operating income discrepancy of $${diff}M. Expected $${expectedOpInc}M, extracted $${operatingIncome}M.`,
      severity: passed ? 'info' : 'warning',
      inputs: [
        { label: 'Gross Profit', value: grossProfit },
        { label: 'Operating Expenses', value: opex },
        { label: 'Reported Operating Income', value: operatingIncome },
      ],
    });
  }

  // 4. Cash Flow Statement: Net Change in Cash = Operating + Investing + Financing
  const ocf = findVal('operating_cash_flow');
  const icf = findVal('investing_cash_flow');
  const fcf = findVal('financing_cash_flow');
  const netCashChange = findVal('net_change_in_cash');

  if (ocf !== null && icf !== null && fcf !== null && netCashChange !== null) {
    const expectedNetChange = roundCurrency(ocf + icf + fcf);
    const diff = Math.abs(roundCurrency(netCashChange - expectedNetChange));
    const tolerance = 1.0;
    const passed = diff <= tolerance;

    results.push({
      ruleId: 'cf-net-change',
      statementType: 'cash_flow',
      ruleName: 'Cash Flow Reconciliation (Operating + Investing + Financing)',
      passed,
      formula: 'Net Change == Operating CF + Investing CF + Financing CF',
      discrepancy: diff,
      tolerance,
      message: passed
        ? `Net change in cash matches sum of component activities ($${expectedNetChange}M).`
        : `Discrepancy of $${diff}M in cash flow statement. Sum of activities is $${expectedNetChange}M vs reported $${netCashChange}M.`,
      severity: passed ? 'info' : 'warning',
      inputs: [
        { label: 'Operating CF', value: ocf },
        { label: 'Investing CF', value: icf },
        { label: 'Financing CF', value: fcf },
        { label: 'Reported Net Change', value: netCashChange },
      ],
    });
  }

  // 5. Scale Consistency check across line items
  const distinctScales = Array.from(new Set(items.map((i) => i.reportingScale).filter(Boolean)));
  if (distinctScales.length > 1) {
    results.push({
      ruleId: 'scale_consistency',
      statementType: 'balance_sheet',
      ruleName: 'Reporting Scale Consistency',
      passed: false,
      formula: 'Consistent unit scale across line items',
      discrepancy: distinctScales.length,
      tolerance: 0,
      message: `Inconsistent reporting scales detected across items: ${distinctScales.join(' vs ')}`,
      severity: 'warning',
      inputs: distinctScales.map((s) => ({ label: 'Scale detected', value: s as any })),
    });
  }

  return results;
}

/**
 * Calculates Multi-Year Comparison rows between current report and a prior period report.
 */
export function calculateMultiYearComparison(
  currentReport: ReportDocument,
  priorReport: ReportDocument
): MultiYearComparisonRow[] {
  const rows: MultiYearComparisonRow[] = [];

  // Currency compatibility check
  if (currentReport.currency !== priorReport.currency) {
    return [];
  }

  // Key line items to compare across periods
  const keysToCompare: { key: string; label: string; statement: any }[] = [
    { key: 'revenue', label: 'Net Revenue / Sales', statement: 'income_statement' },
    { key: 'cogs', label: 'Cost of Goods Sold (COGS)', statement: 'income_statement' },
    { key: 'gross_profit', label: 'Gross Profit', statement: 'income_statement' },
    { key: 'operating_expenses', label: 'Operating Expenses (OpEx)', statement: 'income_statement' },
    { key: 'operating_income', label: 'Operating Income (EBIT)', statement: 'income_statement' },
    { key: 'net_income', label: 'Net Income Attributable to Shareholders', statement: 'income_statement' },
    { key: 'cash_and_equivalents', label: 'Cash and Cash Equivalents', statement: 'balance_sheet' },
    { key: 'current_assets', label: 'Total Current Assets', statement: 'balance_sheet' },
    { key: 'total_assets', label: 'Total Assets', statement: 'balance_sheet' },
    { key: 'current_liabilities', label: 'Total Current Liabilities', statement: 'balance_sheet' },
    { key: 'total_liabilities', label: 'Total Liabilities', statement: 'balance_sheet' },
    { key: 'total_equity', label: 'Total Stockholders Equity', statement: 'balance_sheet' },
    { key: 'operating_cash_flow', label: 'Operating Cash Flow', statement: 'cash_flow' },
  ];

  keysToCompare.forEach((item) => {
    const curItem = currentReport.lineItems.find((l) => l.normalizedKey === item.key);
    const priItem = priorReport.lineItems.find((l) => l.normalizedKey === item.key);

    if (curItem && priItem) {
      const curVal = curItem.extractedValue;
      const priVal = priItem.extractedValue;
      const absChange = roundCurrency(curVal - priVal);

      let pctChange: number | null = null;
      let isUndefined = false;
      let explanation = '';

      if (priVal === 0) {
        pctChange = null;
        isUndefined = true;
        explanation = 'Percentage change undefined (Prior value is $0.00).';
      } else {
        // GAAP Percentage Change Formula: ((Current - Prior) / |Prior|) * 100
        pctChange = roundCurrency(((curVal - priVal) / Math.abs(priVal)) * 100);
      }

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (absChange > 0.05) trend = 'up';
      else if (absChange < -0.05) trend = 'down';

      rows.push({
        key: item.key,
        label: item.label,
        statementType: item.statement,
        currentPeriod: currentReport.fiscalYear,
        priorPeriod: priorReport.fiscalYear,
        currentValue: curVal,
        priorValue: priVal,
        absoluteChange: absChange,
        percentageChange: pctChange,
        isUndefinedPercentage: isUndefined,
        trend,
        explanation,
      });
    }
  });

  return rows;
}

/**
 * Calculates standard corporate financial ratios from reviewed annual report figures.
 */
export function calculateAnnualReportRatios(report: ReportDocument): AnnualReportRatio[] {
  const ratios: AnnualReportRatio[] = [];
  const items = report.lineItems;

  const getItem = (key: string): FinancialLineItem | undefined => {
    return items.find((i) => i.normalizedKey === key);
  };

  const revenue = getItem('revenue');
  const grossProfit = getItem('gross_profit');
  const operatingIncome = getItem('operating_income');
  const netIncome = getItem('net_income');
  const currentAssets = getItem('current_assets');
  const currentLiabilities = getItem('current_liabilities');
  const inventory = getItem('inventory');
  const totalAssets = getItem('total_assets');
  const totalLiabilities = getItem('total_liabilities');
  const totalDebt = getItem('total_debt');
  const totalEquity = getItem('total_equity');
  const ocf = getItem('operating_cash_flow');

  // 1. Gross Profit Margin
  if (grossProfit && revenue && revenue.extractedValue > 0) {
    const val = roundCurrency((grossProfit.extractedValue / revenue.extractedValue) * 100);
    ratios.push({
      id: 'gross-margin',
      name: 'Gross Profit Margin',
      category: 'profitability',
      formula: 'Gross Profit ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Gross Profit', value: `$${grossProfit.extractedValue}M`, isVerified: grossProfit.status === 'verified' },
        { label: 'Revenue', value: `$${revenue.extractedValue}M`, isVerified: revenue.status === 'verified' },
      ],
      limitations: 'Measures product markup before overhead expenses.',
    });
  }

  // 2. Operating Profit Margin
  if (operatingIncome && revenue && revenue.extractedValue > 0) {
    const val = roundCurrency((operatingIncome.extractedValue / revenue.extractedValue) * 100);
    ratios.push({
      id: 'operating-margin',
      name: 'Operating Profit Margin (EBIT Margin)',
      category: 'profitability',
      formula: 'Operating Income ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Operating Income', value: `$${operatingIncome.extractedValue}M`, isVerified: operatingIncome.status === 'verified' },
        { label: 'Revenue', value: `$${revenue.extractedValue}M`, isVerified: revenue.status === 'verified' },
      ],
      limitations: 'Reflects operating efficiency before interest and tax provisions.',
    });
  }

  // 3. Net Profit Margin
  if (netIncome && revenue && revenue.extractedValue > 0) {
    const val = roundCurrency((netIncome.extractedValue / revenue.extractedValue) * 100);
    ratios.push({
      id: 'net-margin',
      name: 'Net Profit Margin',
      category: 'profitability',
      formula: 'Net Income ÷ Revenue × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Net Income', value: `$${netIncome.extractedValue}M`, isVerified: netIncome.status === 'verified' },
        { label: 'Revenue', value: `$${revenue.extractedValue}M`, isVerified: revenue.status === 'verified' },
      ],
      limitations: 'Bottom-line percentage of revenue available to equity shareholders.',
    });
  }

  // 4. Current Ratio
  if (currentAssets && currentLiabilities && currentLiabilities.extractedValue > 0) {
    const val = roundCurrency(currentAssets.extractedValue / currentLiabilities.extractedValue);
    ratios.push({
      id: 'current-ratio',
      name: 'Current Ratio',
      category: 'liquidity',
      formula: 'Current Assets ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Current Assets', value: `$${currentAssets.extractedValue}M`, isVerified: currentAssets.status === 'verified' },
        { label: 'Current Liabilities', value: `$${currentLiabilities.extractedValue}M`, isVerified: currentLiabilities.status === 'verified' },
      ],
      limitations: 'Short-term debt settlement capacity over a 12-month horizon.',
    });
  }

  // 5. Quick Ratio (Acid Test)
  if (currentAssets && currentLiabilities && currentLiabilities.extractedValue > 0) {
    const invVal = inventory ? inventory.extractedValue : 0;
    const liquidAssets = Math.max(0, currentAssets.extractedValue - invVal);
    const val = roundCurrency(liquidAssets / currentLiabilities.extractedValue);
    ratios.push({
      id: 'quick-ratio',
      name: 'Quick Ratio (Acid Test)',
      category: 'liquidity',
      formula: '(Current Assets − Inventory) ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Liquid Assets (Net of Inv)', value: `$${liquidAssets}M`, isVerified: currentAssets.status === 'verified' },
        { label: 'Current Liabilities', value: `$${currentLiabilities.extractedValue}M`, isVerified: currentLiabilities.status === 'verified' },
      ],
      limitations: 'Tests instant liquidity without needing to liquidate inventory.',
    });
  }

  // 6. Debt-to-Equity Ratio
  if (totalDebt && totalEquity && totalEquity.extractedValue > 0) {
    const val = roundCurrency(totalDebt.extractedValue / totalEquity.extractedValue);
    ratios.push({
      id: 'debt-to-equity',
      name: 'Debt-to-Equity Ratio',
      category: 'solvency',
      formula: 'Total Debt ÷ Stockholders Equity',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Total Debt', value: `$${totalDebt.extractedValue}M`, isVerified: totalDebt.status === 'verified' },
        { label: 'Stockholders Equity', value: `$${totalEquity.extractedValue}M`, isVerified: totalEquity.status === 'verified' },
      ],
      limitations: 'Indicates creditor leverage financing relative to equity capital.',
    });
  }

  // 7. Total Liabilities to Assets
  if (totalLiabilities && totalAssets && totalAssets.extractedValue > 0) {
    const val = roundCurrency((totalLiabilities.extractedValue / totalAssets.extractedValue) * 100);
    ratios.push({
      id: 'debt-ratio',
      name: 'Total Liabilities to Total Assets',
      category: 'solvency',
      formula: 'Total Liabilities ÷ Total Assets × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Total Liabilities', value: `$${totalLiabilities.extractedValue}M`, isVerified: totalLiabilities.status === 'verified' },
        { label: 'Total Assets', value: `$${totalAssets.extractedValue}M`, isVerified: totalAssets.status === 'verified' },
      ],
      limitations: 'Measures total asset base funded through obligations.',
    });
  }

  // 8. Return on Assets (ROA)
  if (netIncome && totalAssets && totalAssets.extractedValue > 0) {
    const val = roundCurrency((netIncome.extractedValue / totalAssets.extractedValue) * 100);
    ratios.push({
      id: 'return-on-assets',
      name: 'Return on Assets (ROA)',
      category: 'profitability',
      formula: 'Net Income ÷ Period-End Total Assets × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Net Income', value: `$${netIncome.extractedValue}M`, isVerified: netIncome.status === 'verified' },
        { label: 'Total Assets', value: `$${totalAssets.extractedValue}M`, isVerified: totalAssets.status === 'verified' },
      ],
      limitations: 'Calculated using period-end total assets rather than multi-year average assets.',
    });
  }

  // 9. Return on Equity (ROE)
  if (netIncome && totalEquity && totalEquity.extractedValue > 0) {
    const val = roundCurrency((netIncome.extractedValue / totalEquity.extractedValue) * 100);
    ratios.push({
      id: 'return-on-equity',
      name: 'Return on Equity (ROE)',
      category: 'profitability',
      formula: 'Net Income ÷ Period-End Equity × 100',
      value: val,
      formattedValue: `${val.toFixed(1)}%`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Net Income', value: `$${netIncome.extractedValue}M`, isVerified: netIncome.status === 'verified' },
        { label: 'Stockholders Equity', value: `$${totalEquity.extractedValue}M`, isVerified: totalEquity.status === 'verified' },
      ],
      limitations: 'Calculated using period-end total equity.',
    });
  }

  // 10. Operating Cash Flow to Current Liabilities
  if (ocf && currentLiabilities && currentLiabilities.extractedValue > 0) {
    const val = roundCurrency(ocf.extractedValue / currentLiabilities.extractedValue);
    ratios.push({
      id: 'ocf-coverage',
      name: 'Operating Cash Flow to Current Liabilities',
      category: 'cash_flow',
      formula: 'Operating Cash Flow ÷ Current Liabilities',
      value: val,
      formattedValue: `${val.toFixed(2)}x`,
      status: 'calculated',
      period: report.fiscalYear,
      inputsUsed: [
        { label: 'Operating Cash Flow', value: `$${ocf.extractedValue}M`, isVerified: ocf.status === 'verified' },
        { label: 'Current Liabilities', value: `$${currentLiabilities.extractedValue}M`, isVerified: currentLiabilities.status === 'verified' },
      ],
      limitations: 'Cash-flow based coverage of short-term liabilities.',
    });
  }

  return ratios;
}

/**
 * Computes data quality metrics for an annual report.
 */
export function calculateDataQualitySummary(
  report: ReportDocument,
  validations: StatementValidationResult[]
): DataQualitySummary {
  const items = report.lineItems;
  const total = items.length;
  const verified = items.filter((i) => i.status === 'verified').length;
  const calculated = items.filter((i) => i.provenance === 'calculated').length;
  const conflicting = items.filter((i) => i.status === 'conflicting').length;
  const missing = items.filter((i) => i.status === 'missing').length;

  const unresolvedUnits = items.filter((i) => i.reportingScale === 'ambiguous').length;
  const validationWarnings = validations.filter((v) => !v.passed).length;

  const score = total > 0 ? Math.round(((verified + calculated) / total) * 100) : 0;

  return {
    totalFields: total,
    verifiedFields: verified,
    calculatedFields: calculated,
    missingFields: missing,
    conflictingFields: conflicting,
    unresolvedUnitCount: unresolvedUnits,
    validationWarningsCount: validationWarnings,
    overallScorePercent: score,
  };
}

/**
 * Exports reviewed annual report data to an RFC 4180 compliant CSV string with OWASP protection.
 */
export function exportAnnualReportToCsv(
  report: ReportDocument,
  ratios: AnnualReportRatio[],
  validations: StatementValidationResult[],
  comparisons: MultiYearComparisonRow[]
): string {
  const lines: string[] = [];

  // Header Metadata
  lines.push(`"FinPilot AI - Annual Report Intelligence Analysis"`);
  lines.push(`"Entity Name","${sanitizeForSpreadsheet(report.entityName)}"`);
  lines.push(`"Reporting Period","${sanitizeForSpreadsheet(report.fiscalYear)} (${report.periodEndDate})"`);
  lines.push(`"Reporting Currency","${sanitizeForSpreadsheet(report.currency)}"`);
  lines.push(`"Reporting Unit Scale","${sanitizeForSpreadsheet(report.reportingScale)}"`);
  lines.push(`"Audit Opinion","${sanitizeForSpreadsheet(report.auditorOpinion?.opinion || 'Unspecified')} by ${sanitizeForSpreadsheet(report.auditorOpinion?.firm || 'N/A')}"`);
  lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
  lines.push('');

  // 1. Financial Statements
  lines.push(`"--- REVIEWED FINANCIAL STATEMENTS (${report.fiscalYear}) ---"`);
  lines.push(`"Statement Type","Normalized Field","Reported Label","Extracted Value (${report.reportingScale})","Page","Provenance","Review Status"`);
  report.lineItems.forEach((li) => {
    lines.push(
      `"${li.statementType}","${sanitizeForSpreadsheet(li.normalizedKey)}","${sanitizeForSpreadsheet(li.originalLabel)}","${li.extractedValue}","${li.pageNumber}","${li.provenance}","${li.status}"`
    );
  });
  lines.push('');

  // 2. Financial Ratios
  lines.push(`"--- FINANCIAL RATIOS & MARGINS ---"`);
  lines.push(`"Ratio Name","Category","Formula","Calculated Value","Status","Formula Limitations"`);
  ratios.forEach((r) => {
    lines.push(
      `"${sanitizeForSpreadsheet(r.name)}","${r.category}","${sanitizeForSpreadsheet(r.formula)}","${r.formattedValue}","${r.status}","${sanitizeForSpreadsheet(r.limitations)}"`
    );
  });
  lines.push('');

  // 3. Multi-Year Comparisons
  if (comparisons.length > 0) {
    lines.push(`"--- MULTI-YEAR COMPARATIVE ANALYSIS ---"`);
    lines.push(`"Financial Metric","Current Period (${report.fiscalYear})","Prior Period","Absolute Change","Percentage Change (%)","Trend"`);
    comparisons.forEach((c) => {
      lines.push(
        `"${sanitizeForSpreadsheet(c.label)}","${c.currentValue}","${c.priorValue}","${c.absoluteChange}","${c.isUndefinedPercentage ? 'N/A' : c.percentageChange + '%'}","${c.trend.toUpperCase()}"`
      );
    });
    lines.push('');
  }

  // 4. Accounting Validations
  lines.push(`"--- ACCOUNTING INTEGRITY CHECKS ---"`);
  lines.push(`"Validation Rule","Statement","Status","Discrepancy","Formula Used","Details"`);
  validations.forEach((v) => {
    lines.push(
      `"${sanitizeForSpreadsheet(v.ruleName)}","${v.statementType}","${v.passed ? 'PASSED' : 'DISCREPANCY'}","${v.discrepancy}","${sanitizeForSpreadsheet(v.formula)}","${sanitizeForSpreadsheet(v.message)}"`
    );
  });
  lines.push('');

  // 5. Narrative Intelligence
  if (report.narrativeSnippets.length > 0) {
    lines.push(`"--- NARRATIVE DISCLOSURES & CITATIONS ---"`);
    lines.push(`"Section","Title","Page","Key Takeaway","Extracted Source Text"`);
    report.narrativeSnippets.forEach((n) => {
      lines.push(
        `"${sanitizeForSpreadsheet(n.sectionLabel)}","${sanitizeForSpreadsheet(n.title)}","Page ${n.pageNumber}","${sanitizeForSpreadsheet(n.keyTakeaway)}","${sanitizeForSpreadsheet(n.snippetText)}"`
      );
    });
  }

  return lines.join('\r\n');
}

export { sanitizeForSpreadsheet };

export function formatScaledCurrency(value: number | undefined | null, scale: ReportingScale = "millions"): string {
  if (value === undefined || value === null || isNaN(value)) return "0.00";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateReportCsvData(
  currentReport: ReportDocument,
  priorReport?: ReportDocument | null,
  comparisonRows?: MultiYearComparisonRow[]
): string {
  const ratios = calculateAnnualReportRatios(currentReport);
  const validations = validateFinancialStatements(currentReport);
  const comparisons = comparisonRows || (priorReport ? calculateMultiYearComparison(currentReport, priorReport) : []);
  return exportAnnualReportToCsv(currentReport, ratios, validations, comparisons);
}

export const calculateCorporateRatios = calculateAnnualReportRatios;

export function calculateDataQualityScore(report: ReportDocument): any {
  const validations = validateFinancialStatements(report);
  const summary = calculateDataQualitySummary(report, validations);
  const verifiedCount = report.lineItems.filter((i) => i.status === "verified" || i.isVerified).length;
  const lowConfidenceCount = report.lineItems.filter((i) => (i.confidence !== undefined && i.confidence < 0.75)).length;
  const balanceSheetBalanced = validations.find((v) => v.ruleId === "bs-identity" || v.ruleId === "bs_identity")?.passed ?? true;
  const warnings: string[] = validations.filter((v) => !v.passed).map((v) => v.ruleName + ": " + v.message);

  return {
    ...summary,
    qualityScore: Math.min(100, Math.max(0, summary.overallScorePercent)),
    verifiedCount,
    totalItems: report.lineItems.length,
    lowConfidenceCount,
    balanceSheetBalanced,
    warnings,
  };
}

export function validateAccountingStatements(items: FinancialLineItem[]): any {
  const dummyDoc: ReportDocument = {
    id: "temp-val",
    entityName: "Validation Check",
    fiscalYear: "FY 2025",
    periodEndDate: "2025-12-31",
    currency: "USD",
    reportingScale: items[0]?.reportingScale || "millions",
    status: "ready_for_analysis",
    isFullyReviewed: true,
    pageCount: 1,
    fileName: "check.pdf",
    fileSizeBytes: 1000,
    source: "demo",
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lineItems: items,
    narrativeSnippets: [],
  };

  const results = validateFinancialStatements(dummyDoc);
  const bsRes = results.find((r) => r.ruleId === "bs-identity" || r.ruleId === "bs_identity");
  const gpRes = results.find((r) => r.ruleId === "is-gross-profit" || r.ruleId === "gp_reconciliation");
  const opRes = results.find((r) => r.ruleId === "is-operating-income" || r.ruleId === "oi_reconciliation");
  const cfRes = results.find((r) => r.ruleId === "cf-net-change" || r.ruleId === "cf_reconciliation");
  const scaleRes = results.find((r) => r.ruleId === "scale_consistency");

  const distinctScales = Array.from(new Set(items.map((i) => i.reportingScale).filter(Boolean)));
  const scaleWarning = (distinctScales.length > 1 || (scaleRes && !scaleRes.passed))
    ? (scaleRes?.message || `Inconsistent reporting scales detected: ${distinctScales.join(', ')}`)
    : null;

  const totalAssets = items.find((i) => i.normalizedKey === "total_assets" || i.originalLabel?.includes("Total Assets") || (i as any).standardLabel === "Total Assets")?.extractedValue ?? 0;
  const totalLiabilities = items.find((i) => i.normalizedKey === "total_liabilities" || i.originalLabel?.includes("Total Liabilities") || (i as any).standardLabel === "Total Liabilities")?.extractedValue ?? 0;
  const totalEquity = items.find((i) => i.normalizedKey === "total_equity" || i.originalLabel?.includes("Equity") || (i as any).standardLabel?.includes("Equity"))?.extractedValue ?? 0;

  const missingLineItems: string[] = [];
  if (!items.some((i) => i.normalizedKey === "revenue" || i.originalLabel?.includes("Revenue") || (i as any).standardLabel?.includes("Revenue"))) missingLineItems.push("Revenues / Net Sales");
  if (!items.some((i) => i.normalizedKey === "total_assets" || i.originalLabel?.includes("Total Assets") || (i as any).standardLabel?.includes("Total Assets"))) missingLineItems.push("Total Assets");

  const computedDiscrepancy = Math.abs(roundCurrency(totalAssets - (totalLiabilities + totalEquity)));

  return {
    balanceSheetBalances: bsRes ? bsRes.passed : (computedDiscrepancy <= 1.0),
    balanceSheetDiscrepancy: bsRes ? bsRes.discrepancy : computedDiscrepancy,
    grossProfitReconciles: gpRes ? gpRes.passed : true,
    operatingIncomeReconciles: opRes ? opRes.passed : true,
    cashFlowReconciles: cfRes ? cfRes.passed : true,
    missingLineItems,
    scaleConsistencyWarning: scaleWarning,
    totalAssets,
    totalLiabilities,
    totalEquity,
  };
}