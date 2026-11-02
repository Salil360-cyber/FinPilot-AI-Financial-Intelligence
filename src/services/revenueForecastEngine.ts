/**
 * FinPilot AI - Phase 7 Revenue Forecasting & Scenario Planning Engine
 * Deterministic mathematical forecasting algorithms, historical data aggregator,
 * uncertainty modeling, scenario projector, backtesting evaluator, and CSV exporter.
 */

import { SalesInvoice } from '../types/salesInvoice';
import { FinancialTransaction } from '../types/finance';
import {
  ForecastMetricType,
  ForecastMetricDefinition,
  ForecastMethodType,
  ForecastMethodConfig,
  HistoricalDataPoint,
  HistoricalSummary,
  ForecastPeriodResult,
  ForecastRunResult,
  ScenarioDefinition,
  ScenarioProjectionSummary,
  ConcentrationAnalysis,
  CustomerConcentrationItem,
  BacktestEvaluation,
  BacktestComparisonSummary,
  ForecastRiskIndicator,
} from '../types/forecast';
import { roundCurrency } from './salesInvoiceCalculator';

export const SUPPORTED_METRICS: ForecastMetricDefinition[] = [
  {
    id: 'issued_sales',
    label: 'Monthly Issued Sales Invoice Value',
    shortLabel: 'Issued Invoiced Sales',
    description: 'Contractually issued customer invoices (gross billed amounts excluding draft/cancelled). Default standard revenue measure.',
    unit: 'Currency Amount',
    isRevenueLike: true,
    requiresDoubleEntry: false,
  },
  {
    id: 'recorded_revenue',
    label: 'Recorded General Ledger Revenue',
    shortLabel: 'Ledger Recorded Revenue',
    description: 'Double-entry credits categorized as earned revenue in the general ledger.',
    unit: 'Currency Amount',
    isRevenueLike: true,
    requiresDoubleEntry: true,
  },
  {
    id: 'cash_collections',
    label: 'Cash Collections Received',
    shortLabel: 'Cash Receipts on Invoices',
    description: 'Actual customer payments settled and deposited against active invoices.',
    unit: 'Currency Amount',
    isRevenueLike: true,
    requiresDoubleEntry: false,
  },
  {
    id: 'accounts_receivable',
    label: 'Outstanding Accounts Receivable Balance',
    shortLabel: 'Accounts Receivable (AR)',
    description: 'Open, unpaid customer invoice balances as of each month end.',
    unit: 'Currency Amount',
    isRevenueLike: true,
    requiresDoubleEntry: false,
  },
  {
    id: 'operating_expenses',
    label: 'Operating Expenses (OpEx)',
    shortLabel: 'Operating Outflows',
    description: 'Active operating debit transactions from the general ledger, excluding non-expense transfers.',
    unit: 'Currency Amount',
    isRevenueLike: false,
    requiresDoubleEntry: true,
  },
  {
    id: 'net_operating_movement',
    label: 'Net Operating Movement (Revenue − OpEx)',
    shortLabel: 'Net Cash/Operating Spread',
    description: 'Operational surplus or deficit. Can legitimately be negative, so zero-floor policy is not forced.',
    unit: 'Currency Amount',
    isRevenueLike: false,
    requiresDoubleEntry: true,
  },
];

export const DEFAULT_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'base',
    name: 'Base Case (Target Plan)',
    description: 'Standard operating projection following historical trendline without aggressive assumptions.',
    isSystemDefault: true,
    color: '#3b82f6', // blue
    growthRatePercent: 0,
    customerExpansionPercent: 0,
    churnRatePercent: 0,
    oneTimeAdjustment: 0,
    oneTimeMonthIndex: 1,
    recurringMonthlyAdjustment: 0,
  },
  {
    id: 'optimistic',
    name: 'Optimistic Case (Expansion)',
    description: 'Accelerated enterprise retention, new contract closures (+15%), and lower churn.',
    isSystemDefault: true,
    color: '#10b981', // emerald
    growthRatePercent: 12.0,
    customerExpansionPercent: 8.0,
    churnRatePercent: 2.0,
    oneTimeAdjustment: 5000,
    oneTimeMonthIndex: 2,
    recurringMonthlyAdjustment: 2500,
  },
  {
    id: 'conservative',
    name: 'Conservative Case (Downside Risk)',
    description: 'Models extended sales cycles, macroeconomic slowdown (-8% growth), and elevated customer churn.',
    isSystemDefault: true,
    color: '#f59e0b', // amber
    growthRatePercent: -8.0,
    customerExpansionPercent: 0,
    churnRatePercent: 6.0,
    oneTimeAdjustment: -2000,
    oneTimeMonthIndex: 1,
    recurringMonthlyAdjustment: -1500,
  },
];

/**
 * Normalizes year-month strings (e.g. "2026-10") and advances by N months.
 */
export function addMonthsToPeriod(period: string, monthsToAdd: number): string {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  const date = new Date(Date.UTC(year, month + monthsToAdd, 1));
  const newYear = date.getUTCFullYear();
  const newMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

export function formatPeriodLabel(period: string, isForecast: boolean = false): string {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const d = new Date(Date.UTC(year, month, 1));
  const monthName = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${monthName} ${year}${isForecast ? ' (F)' : ''}`;
}

/**
 * Prepares deterministic historical monthly aggregation for the selected metric.
 */
export function prepareHistoricalData(
  invoices: SalesInvoice[],
  transactions: FinancialTransaction[],
  metric: ForecastMetricType,
  currency: string = 'USD',
  sourceFilter: 'all' | 'user' | 'demo' = 'all'
): HistoricalSummary {
  // 1. Gather all events for this metric
  const monthlyValues = new Map<string, { value: number; count: number; demoCount: number }>();

  if (metric === 'issued_sales') {
    invoices
      .filter((inv) => {
        if (inv.currency !== currency) return false;
        if (inv.status === 'draft' || inv.status === 'cancelled') return false;
        if (sourceFilter === 'user' && inv.source === 'demo') return false;
        if (sourceFilter === 'demo' && inv.source !== 'demo') return false;
        return true;
      })
      .forEach((inv) => {
        const period = inv.issueDate.substring(0, 7); // YYYY-MM
        const existing = monthlyValues.get(period) || { value: 0, count: 0, demoCount: 0 };
        existing.value = roundCurrency(existing.value + inv.grandTotal);
        existing.count += 1;
        if (inv.source === 'demo') existing.demoCount += 1;
        monthlyValues.set(period, existing);
      });
  } else if (metric === 'recorded_revenue') {
    transactions
      .filter((tx) => {
        if (tx.currency && tx.currency !== currency) return false;
        if (tx.ledgerStatus === 'cancelled' || tx.cancelledAt) return false;
        if (tx.type !== 'credit') return false;
        if (tx.entryType === 'transfer') return false;
        if (sourceFilter === 'user' && tx.source === 'demo') return false;
        if (sourceFilter === 'demo' && tx.source !== 'demo') return false;
        return true;
      })
      .forEach((tx) => {
        const period = tx.date.substring(0, 7);
        const existing = monthlyValues.get(period) || { value: 0, count: 0, demoCount: 0 };
        existing.value = roundCurrency(existing.value + tx.amount);
        existing.count += 1;
        if (tx.source === 'demo') existing.demoCount += 1;
        monthlyValues.set(period, existing);
      });
  } else if (metric === 'cash_collections') {
    invoices
      .filter((inv) => {
        if (inv.currency !== currency) return false;
        if (sourceFilter === 'user' && inv.source === 'demo') return false;
        if (sourceFilter === 'demo' && inv.source !== 'demo') return false;
        return true;
      })
      .forEach((inv) => {
        inv.payments?.forEach((pay) => {
          const period = pay.paymentDate.substring(0, 7);
          const existing = monthlyValues.get(period) || { value: 0, count: 0, demoCount: 0 };
          existing.value = roundCurrency(existing.value + pay.amount);
          existing.count += 1;
          if (inv.source === 'demo') existing.demoCount += 1;
          monthlyValues.set(period, existing);
        });
      });
  } else if (metric === 'operating_expenses') {
    transactions
      .filter((tx) => {
        if (tx.currency && tx.currency !== currency) return false;
        if (tx.ledgerStatus === 'cancelled' || tx.cancelledAt) return false;
        if (tx.type !== 'debit') return false;
        if (tx.entryType === 'transfer') return false;
        if (sourceFilter === 'user' && tx.source === 'demo') return false;
        if (sourceFilter === 'demo' && tx.source !== 'demo') return false;
        return true;
      })
      .forEach((tx) => {
        const period = tx.date.substring(0, 7);
        const existing = monthlyValues.get(period) || { value: 0, count: 0, demoCount: 0 };
        existing.value = roundCurrency(existing.value + tx.amount);
        existing.count += 1;
        if (tx.source === 'demo') existing.demoCount += 1;
        monthlyValues.set(period, existing);
      });
  } else if (metric === 'net_operating_movement') {
    // Net operating = Credit revenue - Debit OpEx
    const allPeriods = new Set<string>();
    const creditMap = new Map<string, { val: number; count: number; demoCount: number }>();
    const debitMap = new Map<string, { val: number; count: number; demoCount: number }>();

    transactions
      .filter((tx) => {
        if (tx.currency && tx.currency !== currency) return false;
        if (tx.ledgerStatus === 'cancelled' || tx.cancelledAt) return false;
        if (tx.entryType === 'transfer') return false;
        if (sourceFilter === 'user' && tx.source === 'demo') return false;
        if (sourceFilter === 'demo' && tx.source !== 'demo') return false;
        return true;
      })
      .forEach((tx) => {
        const period = tx.date.substring(0, 7);
        allPeriods.add(period);
        if (tx.type === 'credit') {
          const ex = creditMap.get(period) || { val: 0, count: 0, demoCount: 0 };
          ex.val = roundCurrency(ex.val + tx.amount);
          ex.count += 1;
          if (tx.source === 'demo') ex.demoCount += 1;
          creditMap.set(period, ex);
        } else if (tx.type === 'debit') {
          const ex = debitMap.get(period) || { val: 0, count: 0, demoCount: 0 };
          ex.val = roundCurrency(ex.val + tx.amount);
          ex.count += 1;
          if (tx.source === 'demo') ex.demoCount += 1;
          debitMap.set(period, ex);
        }
      });

    allPeriods.forEach((period) => {
      const cr = creditMap.get(period) || { val: 0, count: 0, demoCount: 0 };
      const db = debitMap.get(period) || { val: 0, count: 0, demoCount: 0 };
      monthlyValues.set(period, {
        value: roundCurrency(cr.val - db.val),
        count: cr.count + db.count,
        demoCount: cr.demoCount + db.demoCount,
      });
    });
  } else if (metric === 'accounts_receivable') {
    // Monthly cumulative open receivables
    invoices
      .filter((inv) => {
        if (inv.currency !== currency) return false;
        if (inv.status === 'draft' || inv.status === 'cancelled') return false;
        if (sourceFilter === 'user' && inv.source === 'demo') return false;
        if (sourceFilter === 'demo' && inv.source !== 'demo') return false;
        return true;
      })
      .forEach((inv) => {
        const period = inv.issueDate.substring(0, 7);
        const existing = monthlyValues.get(period) || { value: 0, count: 0, demoCount: 0 };
        existing.value = roundCurrency(existing.value + inv.outstandingBalance);
        existing.count += 1;
        if (inv.source === 'demo') existing.demoCount += 1;
        monthlyValues.set(period, existing);
      });
  }

  // 2. Sort periods chronologically
  const sortedPeriods = Array.from(monthlyValues.keys()).sort();

  // If no data exists, return safe empty summary
  if (sortedPeriods.length === 0) {
    return {
      metric,
      currency,
      totalPeriods: 0,
      validPeriodsCount: 0,
      missingPeriodsCount: 0,
      totalValue: 0,
      averageMonthlyValue: 0,
      minMonthlyValue: 0,
      maxMonthlyValue: 0,
      stdDev: 0,
      volatilityPercent: 0,
      historyStartDate: '',
      historyEndDate: '',
      points: [],
      demoRecordRatio: 0,
      coverageWarning: 'No historical records found matching the active currency and filters.',
    };
  }

  const startPeriod = sortedPeriods[0];
  const endPeriod = sortedPeriods[sortedPeriods.length - 1];

  // 3. Fill missing month sequence between start and end
  const fullPeriodList: string[] = [];
  let curr = startPeriod;
  while (curr <= endPeriod) {
    fullPeriodList.push(curr);
    curr = addMonthsToPeriod(curr, 1);
  }

  let totalDemoCount = 0;
  let totalRecordCount = 0;
  const points: HistoricalDataPoint[] = [];

  fullPeriodList.forEach((period) => {
    const data = monthlyValues.get(period);
    if (!data) {
      // Missing period (no transaction records recorded in system)
      points.push({
        period,
        periodLabel: formatPeriodLabel(period, false),
        value: 0,
        count: 0,
        isMissing: true,
        isTrueZero: false,
        isDemo: false,
        currency,
      });
    } else {
      totalRecordCount += data.count;
      totalDemoCount += data.demoCount;
      points.push({
        period,
        periodLabel: formatPeriodLabel(period, false),
        value: data.value,
        count: data.count,
        isMissing: false,
        isTrueZero: data.value === 0 && data.count > 0,
        isDemo: data.count > 0 && data.demoCount === data.count,
        currency,
      });
    }
  });

  const validPoints = points.filter((p) => !p.isMissing);
  const validValues = validPoints.map((p) => p.value);
  const totalValue = roundCurrency(validValues.reduce((s, v) => s + v, 0));
  const avg = validValues.length > 0 ? roundCurrency(totalValue / validValues.length) : 0;
  const min = validValues.length > 0 ? Math.min(...validValues) : 0;
  const max = validValues.length > 0 ? Math.max(...validValues) : 0;

  // Standard deviation calculation
  let varianceSum = 0;
  validValues.forEach((v) => {
    varianceSum += Math.pow(v - avg, 2);
  });
  const stdDev = validValues.length > 1 ? roundCurrency(Math.sqrt(varianceSum / (validValues.length - 1))) : 0;
  const volatilityPercent = avg > 0 ? roundCurrency((stdDev / avg) * 100) : 0;
  const demoRatio = totalRecordCount > 0 ? roundCurrency(totalDemoCount / totalRecordCount) : 0;

  let coverageWarning: string | undefined;
  if (points.filter((p) => p.isMissing).length > 0) {
    coverageWarning = `Historical series has ${points.filter((p) => p.isMissing).length} missing period(s) without recorded transactions. Missing periods are treated as non-observations rather than assumed zero revenue.`;
  } else if (validPoints.length < 3) {
    coverageWarning = 'Historical window contains fewer than 3 monthly periods. Statistical confidence and trend stability are limited.';
  }

  return {
    metric,
    currency,
    totalPeriods: points.length,
    validPeriodsCount: validPoints.length,
    missingPeriodsCount: points.filter((p) => p.isMissing).length,
    totalValue,
    averageMonthlyValue: avg,
    minMonthlyValue: min,
    maxMonthlyValue: max,
    stdDev,
    volatilityPercent,
    historyStartDate: startPeriod,
    historyEndDate: endPeriod,
    points,
    demoRecordRatio: demoRatio,
    coverageWarning,
  };
}

/**
 * Deterministically forecasts future periods using chosen algorithm.
 */
export function runForecastEngine(
  history: HistoricalSummary,
  horizonMonths: number,
  methodConfig: ForecastMethodConfig,
  scenarios: ScenarioDefinition[] = DEFAULT_SCENARIOS
): ForecastRunResult {
  const metricDef = SUPPORTED_METRICS.find((m) => m.id === history.metric) || SUPPORTED_METRICS[0];
  const validPoints = history.points.filter((p) => !p.isMissing);
  const n = validPoints.length;

  const assumptions: string[] = [];
  const limitations: string[] = [];
  let methodLabel = '';

  // Forecast starting point
  const lastPeriod = history.points.length > 0 ? history.points[history.points.length - 1].period : '2026-10';
  const forecastPeriods: string[] = [];
  for (let i = 1; i <= horizonMonths; i++) {
    forecastPeriods.push(addMonthsToPeriod(lastPeriod, i));
  }

  const rawForecastValues: number[] = [];

  // 1. NAIVE BASELINE
  if (methodConfig.method === 'naive_baseline') {
    methodLabel = 'Naive Baseline (Latest Period Persistence)';
    const latestValue = n > 0 ? validPoints[n - 1].value : 0;
    assumptions.push(`Assumes future monthly results will persist at the exact level of the latest observed period (${formatPeriodLabel(validPoints[n - 1]?.period || lastPeriod)}: $${latestValue.toLocaleString()}).`);
    limitations.push('Does not account for growth trends, seasonality, or cyclical fluctuations.');

    for (let i = 0; i < horizonMonths; i++) {
      rawForecastValues.push(latestValue);
    }
  }

  // 2. SIMPLE MOVING AVERAGE
  else if (methodConfig.method === 'moving_average') {
    const window = Math.min(Math.max(1, methodConfig.movingAverageWindow || 3), Math.max(1, n));
    methodLabel = `Simple Moving Average (${window}-Month SMA)`;

    const slice = validPoints.slice(-window);
    const sum = slice.reduce((acc, p) => acc + p.value, 0);
    const smaValue = slice.length > 0 ? roundCurrency(sum / slice.length) : 0;

    assumptions.push(`Calculates the arithmetic mean of the most recent ${slice.length} valid historical periods ($${smaValue.toLocaleString()} / month).`);
    limitations.push('Smooths historical volatility equally and lags behind structural market accelerations or contractions.');

    for (let i = 0; i < horizonMonths; i++) {
      rawForecastValues.push(smaValue);
    }
  }

  // 3. WEIGHTED MOVING AVERAGE
  else if (methodConfig.method === 'weighted_moving_average') {
    const defaultWeights = [1, 2, 3];
    const weights = methodConfig.weightedWeights && methodConfig.weightedWeights.length > 0 ? methodConfig.weightedWeights : defaultWeights;
    const window = weights.length;
    methodLabel = `Weighted Moving Average (${window}-Month WMA)`;

    const slice = validPoints.slice(-window);
    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < slice.length; i++) {
      const w = weights[i] ?? 1;
      weightedSum += slice[i].value * w;
      weightTotal += w;
    }

    const wmaValue = weightTotal > 0 ? roundCurrency(weightedSum / weightTotal) : 0;
    assumptions.push(`Assigns greater mathematical weight to more recent periods using weights [${weights.slice(0, slice.length).join(', ')}]. Projected baseline: $${wmaValue.toLocaleString()} / month.`);
    limitations.push('Sensitive to recent month outliers and one-off extraordinary invoices.');

    for (let i = 0; i < horizonMonths; i++) {
      rawForecastValues.push(wmaValue);
    }
  }

  // 4. LINEAR TREND (OLS)
  else if (methodConfig.method === 'linear_trend') {
    methodLabel = 'Linear Trend (Ordinary Least Squares)';
    if (n < 2) {
      // Degrade to naive if fewer than 2 points
      const latestValue = n > 0 ? validPoints[0].value : 0;
      for (let i = 0; i < horizonMonths; i++) rawForecastValues.push(latestValue);
      assumptions.push('Insufficient historical observations (<2) for regression slope; defaulted to single-point baseline.');
    } else {
      // Compute OLS slope (m) and intercept (b)
      // x = 0, 1, 2, ..., n-1
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      for (let i = 0; i < n; i++) {
        const x = i;
        const y = validPoints[i].value;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      const denominator = n * sumXX - sumX * sumX;
      let slope = 0;
      let intercept = sumY / n;

      if (denominator !== 0) {
        slope = (n * sumXY - sumX * sumY) / denominator;
        intercept = (sumY - slope * sumX) / n;
      }

      assumptions.push(`Fitted least-squares line: y = (${roundCurrency(slope)} × month) + ${roundCurrency(intercept)}. Monthly slope increment: $${roundCurrency(slope).toLocaleString()}/month.`);
      if (Math.abs(slope) > history.averageMonthlyValue * 0.5) {
        limitations.push('Steep slope detected; long-horizon linear extrapolation may compound unrealistic extremes.');
      }

      for (let i = 1; i <= horizonMonths; i++) {
        const x = (n - 1) + i;
        const projected = roundCurrency(intercept + slope * x);
        rawForecastValues.push(projected);
      }
    }
  }

  // 5. SEASONALITY-AWARE (Check eligibility)
  else if (methodConfig.method === 'seasonality_aware') {
    if (n < 24) {
      // Seasonality requires at least 2 full cycles (24 months)
      methodLabel = 'Seasonality-Aware (Unavailable)';
      limitations.push(`Seasonality-aware forecasting requires at least 24 consecutive monthly observations to reliably measure repeating seasonal indices. Current valid history has ${n} month(s). Falling back to 3-month moving average.`);
      const slice = validPoints.slice(-3);
      const sma = slice.length > 0 ? roundCurrency(slice.reduce((s, p) => s + p.value, 0) / slice.length) : 0;
      for (let i = 0; i < horizonMonths; i++) rawForecastValues.push(sma);
    } else {
      methodLabel = 'Seasonality-Aware Decomposition';
      // 12-month multiplicative index
      assumptions.push('Applies 12-month recurring seasonal index multipliers derived from historical annual cycles.');
      const slice = validPoints.slice(-12);
      const avgLastYear = slice.reduce((s, p) => s + p.value, 0) / 12;
      for (let i = 0; i < horizonMonths; i++) {
        const correspondingMonthIdx = (i) % 12;
        const histPoint = slice[correspondingMonthIdx];
        const seasonalFactor = avgLastYear > 0 ? histPoint.value / avgLastYear : 1.0;
        rawForecastValues.push(roundCurrency(avgLastYear * seasonalFactor));
      }
    }
  }

  // Apply Negative Revenue Clamping Policy (if metric is revenue-like)
  const isRevenueLike = metricDef.isRevenueLike;
  let policyApplied = false;
  const processedPoints: ForecastPeriodResult[] = [];

  // Uncertainty spread: based on standard deviation or 10% baseline if stdDev is 0
  const uncertaintySpread = history.stdDev > 0 ? history.stdDev : (history.averageMonthlyValue * 0.12);

  forecastPeriods.forEach((period, idx) => {
    let baselineVal = rawForecastValues[idx] ?? 0;
    let clamped = false;

    if (isRevenueLike && baselineVal < 0) {
      baselineVal = 0;
      clamped = true;
      policyApplied = true;
    }

    // Range: +/- 1 stdDev
    let lower = roundCurrency(baselineVal - uncertaintySpread);
    let upper = roundCurrency(baselineVal + uncertaintySpread);
    if (isRevenueLike && lower < 0) lower = 0;

    // Evaluate scenarios for this period
    const monthIndex = idx + 1; // 1-based month into forecast
    const scenarioAdjustments = scenarios.map((sc) => {
      // Order of calculation:
      // Adj = Baseline * (1 + (growth% + expansion% - churn%) / 100) + recurring + (monthIndex == oneTimeMonth ? oneTime : 0)
      const netPct = (sc.growthRatePercent + sc.customerExpansionPercent - sc.churnRatePercent) / 100;
      let val = baselineVal * (1 + netPct);
      val += sc.recurringMonthlyAdjustment;
      if (sc.oneTimeMonthIndex === monthIndex) {
        val += sc.oneTimeAdjustment;
      }
      val = roundCurrency(val);
      if (isRevenueLike && val < 0) val = 0;
      return {
        scenarioId: sc.id,
        adjustedValue: val,
      };
    });

    processedPoints.push({
      period,
      periodLabel: formatPeriodLabel(period, true),
      pointEstimate: baselineVal,
      rangeLower: lower,
      rangeUpper: upper,
      baselineEstimate: baselineVal,
      scenarioAdjustments,
      isNegativeClamped: clamped,
    });
  });

  if (policyApplied) {
    assumptions.push('Documented Non-Negative Policy: Sub-zero projections were clamped to $0.00 since sales cannot be negative under GAAP.');
  }

  const projectedTotal = roundCurrency(processedPoints.reduce((s, p) => s + p.pointEstimate, 0));
  const projectedAverageMonthly = processedPoints.length > 0 ? roundCurrency(projectedTotal / processedPoints.length) : 0;

  // Growth vs same length prior historical window
  let growthPercent: number | null = null;
  const priorWindowSlice = validPoints.slice(-horizonMonths);
  if (priorWindowSlice.length > 0) {
    const priorTotal = priorWindowSlice.reduce((s, p) => s + p.value, 0);
    if (priorTotal > 0) {
      growthPercent = roundCurrency(((projectedTotal - priorTotal) / priorTotal) * 100);
    }
  }

  return {
    forecastId: `FCST-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    metric: history.metric,
    currency: history.currency,
    horizonMonths,
    forecastStartDate: forecastPeriods[0] || '',
    forecastEndDate: forecastPeriods[forecastPeriods.length - 1] || '',
    methodConfig: {
      ...methodConfig,
      zeroFloorPolicyApplied: policyApplied,
    },
    methodLabel,
    historicalWindowPeriods: history.validPeriodsCount,
    historicalSummary: history,
    periods: processedPoints,
    projectedTotal,
    projectedAverageMonthly,
    projectedPeriodGrowthPercent: growthPercent,
    assumptions,
    limitations,
    uncertaintyMethod: 'historical_volatility_spread',
  };
}

/**
 * Calculates scenario comparisons across all periods.
 */
export function calculateScenarioSummaries(
  runResult: ForecastRunResult,
  scenarios: ScenarioDefinition[] = DEFAULT_SCENARIOS
): ScenarioProjectionSummary[] {
  const baselineTotal = runResult.projectedTotal;

  return scenarios.map((sc) => {
    let total = 0;
    const monthlyProjections = runResult.periods.map((p) => {
      const match = p.scenarioAdjustments.find((a) => a.scenarioId === sc.id);
      const val = match ? match.adjustedValue : p.pointEstimate;
      total += val;
      return {
        period: p.period,
        periodLabel: p.periodLabel,
        value: val,
        differenceFromBase: roundCurrency(val - p.baselineEstimate),
      };
    });

    total = roundCurrency(total);
    const variance = roundCurrency(total - baselineTotal);
    const variancePercent = baselineTotal > 0 ? roundCurrency((variance / baselineTotal) * 100) : 0;

    return {
      scenarioId: sc.id,
      name: sc.name,
      color: sc.color,
      totalProjectedValue: total,
      varianceFromBaseline: variance,
      varianceFromBaselinePercent: variancePercent,
      monthlyProjections,
    };
  });
}

/**
 * Calculates Customer and Revenue Concentration.
 */
export function analyzeCustomerConcentration(
  invoices: SalesInvoice[],
  currency: string = 'USD'
): ConcentrationAnalysis {
  const validInvoices = invoices.filter(
    (inv) => inv.currency === currency && inv.status !== 'draft' && inv.status !== 'cancelled'
  );

  const customerMap = new Map<string, { name: string; total: number; count: number; lastDate: string }>();
  let totalBilled = 0;

  validInvoices.forEach((inv) => {
    const custName = inv.customer?.customerName || 'Unspecified Customer';
    const custId = inv.customer?.customerName?.toLowerCase().replace(/\s+/g, '-') || 'client';
    const ex = customerMap.get(custId) || { name: custName, total: 0, count: 0, lastDate: inv.issueDate };
    ex.total = roundCurrency(ex.total + inv.grandTotal);
    ex.count += 1;
    if (inv.issueDate > ex.lastDate) ex.lastDate = inv.issueDate;
    customerMap.set(custId, ex);
    totalBilled = roundCurrency(totalBilled + inv.grandTotal);
  });

  const items: CustomerConcentrationItem[] = [];
  let cumulative = 0;

  const sortedCustomers = Array.from(customerMap.entries()).sort((a, b) => b[1].total - a[1].total);

  sortedCustomers.forEach(([id, data]) => {
    const pct = totalBilled > 0 ? roundCurrency((data.total / totalBilled) * 100) : 0;
    cumulative = roundCurrency(cumulative + pct);
    items.push({
      customerId: id,
      customerName: data.name,
      invoicedTotal: data.total,
      percentageOfTotal: pct,
      invoiceCount: data.count,
      status: data.count >= 2 ? 'active' : 'infrequent',
      cumulativeSharePercent: Math.min(100, cumulative),
    });
  });

  const top1 = items[0]?.percentageOfTotal || 0;
  const top3 = items.slice(0, 3).reduce((s, i) => s + i.percentageOfTotal, 0);

  // Herfindahl-Hirschman Index (HHI)
  // HHI = sum of squared market share percentages (0 to 10,000)
  let hhi = 0;
  items.forEach((item) => {
    hhi += Math.pow(item.percentageOfTotal, 2);
  });
  hhi = Math.round(hhi);

  let riskRating: 'low' | 'moderate' | 'high' | 'severe' = 'low';
  if (hhi > 2500 || top1 > 40) riskRating = 'severe';
  else if (hhi > 1800 || top1 > 25) riskRating = 'high';
  else if (hhi > 1200 || top1 > 15) riskRating = 'moderate';

  return {
    topCustomerSharePercent: top1,
    top3SharePercent: roundCurrency(top3),
    herfindahlIndex: hhi,
    riskRating,
    totalCustomersCount: items.length,
    items,
  };
}

/**
 * Performs backtesting against historical observations.
 * Uses a historical cutoff to reserve recent periods as test actuals.
 */
export function runBacktestEvaluation(
  history: HistoricalSummary,
  cutoffIndexOffset: number = 2 // hold out last 2 periods
): BacktestComparisonSummary {
  const validPoints = history.points.filter((p) => !p.isMissing);
  const n = validPoints.length;

  // Need at least 4 periods to train on 2+ and test on 1+
  if (n < 4) {
    return {
      cutoffPeriod: history.historyEndDate,
      testPeriodsCount: 0,
      evaluations: [],
      bestMethod: 'naive_baseline',
      rankingRationale: 'Insufficient historical periods (<4) for backtesting.',
    };
  }

  const testCount = Math.min(Math.max(1, cutoffIndexOffset), Math.floor(n / 2));
  const trainingPoints = validPoints.slice(0, n - testCount);
  const testPoints = validPoints.slice(-testCount);
  const cutoffPeriod = trainingPoints[trainingPoints.length - 1].period;

  const methodsToTest: ForecastMethodType[] = ['naive_baseline', 'moving_average', 'weighted_moving_average', 'linear_trend'];
  const evaluations: BacktestEvaluation[] = [];

  methodsToTest.forEach((method) => {
    const trainingSummary: HistoricalSummary = {
      ...history,
      points: trainingPoints,
      totalPeriods: trainingPoints.length,
      validPeriodsCount: trainingPoints.length,
      missingPeriodsCount: 0,
      historyEndDate: cutoffPeriod,
    };

    const run = runForecastEngine(trainingSummary, testCount, {
      method,
      movingAverageWindow: Math.min(3, trainingPoints.length),
      weightedWeights: [1, 2, 3],
    });

    let absErrorSum = 0;
    let squaredErrorSum = 0;
    let actualSum = 0;

    const predictions = testPoints.map((tp, idx) => {
      const pred = run.periods[idx]?.pointEstimate ?? 0;
      const actual = tp.value;
      const absErr = roundCurrency(Math.abs(actual - pred));
      const sqErr = Math.pow(actual - pred, 2);

      absErrorSum += absErr;
      squaredErrorSum += sqErr;
      actualSum += Math.abs(actual);

      const errPct = actual > 0 ? roundCurrency((absErr / actual) * 100) : null;

      return {
        period: tp.period,
        actual,
        predicted: pred,
        absoluteError: absErr,
        errorPercent: errPct,
      };
    });

    const mae = roundCurrency(absErrorSum / testCount);
    const rmse = roundCurrency(Math.sqrt(squaredErrorSum / testCount));
    const wapePercent = actualSum > 0 ? roundCurrency((absErrorSum / actualSum) * 100) : null;

    evaluations.push({
      cutoffPeriod,
      trainingPeriodsCount: trainingPoints.length,
      testPeriodsCount: testCount,
      method,
      mae,
      rmse,
      wapePercent,
      predictions,
      isReliable: true,
    });
  });

  // Rank by lowest MAE
  evaluations.sort((a, b) => a.mae - b.mae);
  const best = evaluations[0]?.method || 'naive_baseline';

  return {
    cutoffPeriod,
    testPeriodsCount: testCount,
    evaluations,
    bestMethod: best,
    rankingRationale: `Evaluated ${evaluations.length} candidate forecasting algorithms across ${testCount} held-out historical observation periods. Lowest Mean Absolute Error (MAE: $${evaluations[0]?.mae.toLocaleString()}) achieved by ${best}.`,
  };
}

/**
 * Deterministically generates forecast risk indicators based on empirical findings.
 */
export function evaluateForecastRisks(
  history: HistoricalSummary,
  runResult: ForecastRunResult,
  concentration: ConcentrationAnalysis
): ForecastRiskIndicator[] {
  const risks: ForecastRiskIndicator[] = [];

  // 1. Limited History
  if (history.validPeriodsCount < 4) {
    risks.push({
      id: 'risk-limited-history',
      severity: 'high',
      title: 'Limited Historical Coverage',
      description: 'Historical observations cover fewer than 4 monthly reporting cycles, reducing statistical certainty.',
      observedCondition: `${history.validPeriodsCount} valid historical month(s) available`,
      supportingData: `Start: ${history.historyStartDate || 'N/A'}, End: ${history.historyEndDate || 'N/A'}`,
      timeframe: 'Historical Baseline',
      qualification: 'Forecast should be considered an indicative baseline rather than a mature trend prediction.',
    });
  }

  // 2. High Volatility
  if (history.volatilityPercent > 35) {
    risks.push({
      id: 'risk-volatility',
      severity: 'medium',
      title: 'Elevated Historical Volatility',
      description: 'Month-to-month variance exceeds 35% of mean monthly volume, indicating cyclical or lumpy billing patterns.',
      observedCondition: `Historical Volatility Index: ${history.volatilityPercent.toFixed(1)}% (StdDev: $${history.stdDev.toLocaleString()})`,
      supportingData: `Mean Monthly: $${history.averageMonthlyValue.toLocaleString()} vs StdDev: $${history.stdDev.toLocaleString()}`,
      timeframe: 'Trailing Historical Window',
      qualification: 'Range bands are naturally wider to accommodate historical revenue dispersion.',
    });
  }

  // 3. Customer Concentration Risk
  if (concentration.topCustomerSharePercent > 35 || concentration.riskRating === 'severe') {
    risks.push({
      id: 'risk-customer-concentration',
      severity: concentration.topCustomerSharePercent > 50 ? 'critical' : 'high',
      title: 'High Customer Concentration Exposure',
      description: 'A single customer accounts for more than 35% of total historical invoiced revenue.',
      observedCondition: `Top Client (${concentration.items[0]?.customerName || 'Primary Client'}) represents ${concentration.topCustomerSharePercent.toFixed(1)}% of volume`,
      supportingData: `Top 3 Customers represent ${concentration.top3SharePercent.toFixed(1)}% of total revenue. HHI Index: ${concentration.herfindahlIndex}`,
      timeframe: 'All-Time Invoiced History',
      qualification: 'Loss or payment delays from the primary customer would materially dislocate projected revenue.',
    });
  }

  // 4. Heavy Demo Data Composition
  if (history.demoRecordRatio > 0.5) {
    risks.push({
      id: 'risk-demo-data',
      severity: 'medium',
      title: 'Demo Record Composition',
      description: 'More than 50% of historical series is derived from default demonstration fixtures.',
      observedCondition: `${Math.round(history.demoRecordRatio * 100)}% of underlying records are labeled Demo`,
      supportingData: 'Simulated enterprise fixtures present in system context',
      timeframe: 'Current Working State',
      qualification: 'Projections reflect synthetic demo assumptions until real enterprise invoices replace demo data.',
    });
  }

  // 5. Method Non-negative clamping
  if (runResult.methodConfig.zeroFloorPolicyApplied) {
    risks.push({
      id: 'risk-zero-clamping',
      severity: 'low',
      title: 'Zero-Floor Policy Activated',
      description: 'Linear trend extrapolation projected negative sales in one or more periods, which were clamped to $0.00.',
      observedCondition: 'Sub-zero trend extrapolated',
      supportingData: 'Metric: ' + runResult.metric,
      timeframe: 'Forecast Horizon',
      qualification: 'Downward trendline indicates structural contraction requiring active business intervention.',
    });
  }

  return risks;
}

/**
 * Sanitizes spreadsheet cells to prevent formula injection attacks (OWASP compliance).
 */
export function sanitizeForSpreadsheet(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // If string starts with =, +, -, @, tab, carriage return, prepend a single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    // If it's a legitimate standalone negative number like "-1500" or "-25.5", allow it without prefix
    if (/^-\d+(\.\d+)?$/.test(str)) {
      return str;
    }
    return `'${str}`;
  }
  return str;
}

/**
 * Exports historical and forecast results to an RFC 4180 compliant CSV string.
 */
export function exportForecastToCsv(
  runResult: ForecastRunResult,
  scenarios: ScenarioProjectionSummary[]
): string {
  const lines: string[] = [];

  // Header metadata block
  lines.push(`"FinPilot AI - Revenue Forecast & Scenario Planning Report"`);
  lines.push(`"Forecast ID","${sanitizeForSpreadsheet(runResult.forecastId)}"`);
  lines.push(`"Generated At","${sanitizeForSpreadsheet(runResult.generatedAt)}"`);
  lines.push(`"Forecast Metric","${sanitizeForSpreadsheet(runResult.metric)}"`);
  lines.push(`"Currency","${sanitizeForSpreadsheet(runResult.currency)}"`);
  lines.push(`"Forecasting Method","${sanitizeForSpreadsheet(runResult.methodLabel)}"`);
  lines.push(`"Forecast Horizon","${runResult.horizonMonths} Months (${runResult.forecastStartDate} to ${runResult.forecastEndDate})"`);
  lines.push(`"Projected Period Total","${runResult.projectedTotal}"`);
  lines.push(`"Average Monthly Projection","${runResult.projectedAverageMonthly}"`);
  lines.push('');

  // Historical Section
  lines.push(`"--- HISTORICAL ACTUALS (${runResult.historicalSummary.validPeriodsCount} Valid Periods) ---"`);
  lines.push(`"Period","Period Label","Observed Actual Value","Transaction Count","Status"`);
  runResult.historicalSummary.points.forEach((p) => {
    const status = p.isMissing ? 'Missing Data' : p.isTrueZero ? 'Confirmed Zero' : p.isDemo ? 'Demo Record' : 'Actual Record';
    lines.push(`"${p.period}","${p.periodLabel}","${p.value}","${p.count}","${status}"`);
  });
  lines.push('');

  // Forecast Section
  lines.push(`"--- PROJECTED PERIOD VALUES & SCENARIOS ---"`);
  const scenarioHeaders = scenarios.map((s) => `"${sanitizeForSpreadsheet(s.name)}"`).join(',');
  lines.push(`"Period","Period Label","Point Estimate","Range Lower (StdDev)","Range Upper (StdDev)",${scenarioHeaders}`);

  runResult.periods.forEach((p) => {
    const scenarioValues = scenarios.map((s) => {
      const match = s.monthlyProjections.find((m) => m.period === p.period);
      return match ? match.value : p.pointEstimate;
    }).join(',');

    lines.push(`"${p.period}","${p.periodLabel}","${p.pointEstimate}","${p.rangeLower}","${p.rangeUpper}",${scenarioValues}`);
  });
  lines.push('');

  // Assumptions & Disclosures
  lines.push(`"--- MODEL ASSUMPTIONS & DISCLOSURES ---"`);
  runResult.assumptions.forEach((a) => {
    lines.push(`"Assumption","${sanitizeForSpreadsheet(a)}"`);
  });
  runResult.limitations.forEach((l) => {
    lines.push(`"Limitation","${sanitizeForSpreadsheet(l)}"`);
  });

  return lines.join('\r\n');
}
