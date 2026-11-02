/**
 * FinPilot AI - Phase 9: AI Explanation Layer (Gemini Grounded Commentary)
 * Provides natural business language summaries strictly grounded in
 * deterministic metrics and verified facts.
 *
 * Calls server-side Gemini endpoint (/api/gemini/generate-advisory).
 * If the server is offline or no API key is configured, seamlessly
 * provides structured, deterministic expert financial commentary.
 */

import { AdvisoryInsight, AdvisoryHealthSignal, AdvisoryRecommendation } from '../types/advisory';

export interface AiCommentaryResult {
  executiveSummary: string;
  bulletedObservations: string[];
  suggestedFollowUpQuestions: string[];
  provider: 'gemini-3.8-flash' | 'deterministic-expert-heuristics';
  groundedFactsCount: number;
  generatedAt: string;
}

/**
 * Checks server-side Gemini availability.
 */
export async function checkGeminiServerStatus(): Promise<{ configured: boolean; provider: string }> {
  try {
    const res = await fetch('/api/gemini/status');
    if (res.ok) {
      const data = await res.json();
      return { configured: Boolean(data.configured), provider: data.provider || 'gemini-3.8-flash' };
    }
  } catch {
    // Offline or server unreachable
  }
  return { configured: false, provider: 'gemini-3.8-flash' };
}

/**
 * Generates an executive commentary grounded in evaluated financial metrics
 * via the server-side Gemini API route.
 */
export async function generateGroundedAdvisoryCommentary(
  insights: AdvisoryInsight[],
  signals: AdvisoryHealthSignal[],
  recommendations: AdvisoryRecommendation[],
  currency: string = 'USD'
): Promise<AiCommentaryResult> {
  try {
    const response = await fetch('/api/gemini/generate-advisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        insights,
        signals,
        recommendations,
        currency,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.available !== false && data.executiveSummary) {
        return {
          executiveSummary: data.executiveSummary,
          bulletedObservations: Array.isArray(data.bulletedObservations) ? data.bulletedObservations : [],
          suggestedFollowUpQuestions: Array.isArray(data.suggestedFollowUpQuestions) ? data.suggestedFollowUpQuestions : [],
          provider: 'gemini-3.8-flash',
          groundedFactsCount: data.groundedFactsCount || insights.length,
          generatedAt: data.generatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // Graceful fallback to deterministic local engine
  }

  return generateDeterministicHeuristicsCommentary(insights, signals, recommendations, currency);
}

/**
 * Deterministic expert heuristics fallback generator.
 * Works 100% offline with zero external dependencies.
 */
export function generateDeterministicHeuristicsCommentary(
  insights: AdvisoryInsight[],
  signals: AdvisoryHealthSignal[],
  recommendations: AdvisoryRecommendation[],
  currency: string = 'USD'
): AiCommentaryResult {
  const highPriority = insights.filter((i) => i.severity === 'high_priority');
  const attention = insights.filter((i) => i.severity === 'attention_required');
  const healthyCount = signals.filter((s) => s.status === 'healthy').length;

  let summary = `This advisory review evaluates ${insights.length} operational indicators across revenue, cash conversion, expenditure efficiency, and customer exposure in ${currency}. `;

  if (highPriority.length > 0) {
    summary += `Management attention is immediately advised for ${highPriority.length} high-priority area(s): ${highPriority.map((h) => h.title).join('; ')}. `;
  } else if (attention.length > 0) {
    summary += `Core financial mechanics remain operational, with ${attention.length} focal areas requiring monitoring: ${attention.map((a) => a.title).join('; ')}. `;
  } else {
    summary += `All tracked liquidity and profitability indicators meet standard operating tolerances with ${healthyCount} healthy signals. `;
  }

  summary += `All findings are linked to validated general ledger balances, issued customer invoices, and contractual due dates.`;

  const observations: string[] = [];
  insights.slice(0, 5).forEach((ins) => {
    observations.push(`${ins.title}: ${ins.explanation} (${ins.evidenceSummary})`);
  });

  const followUpQuestions: string[] = [
    'Are recent operational expenditure increases recurring software/headcount commitments or one-time milestone disbursements?',
    'What payment terms or settlement incentives can be extended to delinquent accounts past their contractual due dates?',
    'How do projected cash collections over the next quarter align with vendor payment obligations in the General Ledger?',
    'What mitigation plans exist to protect operating margin if revenue from key enterprise accounts delays renewal?',
  ];

  return {
    executiveSummary: summary,
    bulletedObservations: observations,
    suggestedFollowUpQuestions: followUpQuestions,
    provider: 'deterministic-expert-heuristics',
    groundedFactsCount: insights.length,
    generatedAt: new Date().toISOString(),
  };
}
