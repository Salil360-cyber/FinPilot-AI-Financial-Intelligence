/**
 * FinPilot AI - Phase 12 Onboarding, Help Center & Workflow Guidance Service
 * Deterministic, offline service for managing onboarding milestones,
 * state persistence, and client-side knowledge search.
 */

import {
  OnboardingState,
  OnboardingMilestone,
  HelpCategory,
  HelpArticle,
  FaqItem,
  GlossaryTerm,
  GuidedWorkflow,
  ONBOARDING_STORAGE_KEY,
  DEFAULT_ONBOARDING_STATE,
  INITIAL_MILESTONES,
} from '../types/helpCenter';
import { HELP_ARTICLES, FAQ_ITEMS } from '../data/helpArticles';
import { FINANCIAL_GLOSSARY } from '../data/financialGlossary';
import { GUIDED_WORKFLOWS } from '../data/guidedWorkflows';

// In-memory fallback if localStorage is undefined (e.g., in Node / test environments)
const memoryStore: Record<string, string> = {};

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  } catch {
    return memoryStore[key] || null;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  } catch {
    memoryStore[key] = value;
  }
}

/**
 * Retrieves the current onboarding state from local storage.
 */
export function getOnboardingState(): OnboardingState {
  try {
    const raw = safeGetStorage(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_ONBOARDING_STATE };
    }
    const parsed = JSON.parse(raw);
    return {
      hasCompletedWelcome: Boolean(parsed.hasCompletedWelcome),
      hasDismissedOnboarding: Boolean(parsed.hasDismissedOnboarding),
      completedMilestoneIds: Array.isArray(parsed.completedMilestoneIds)
        ? parsed.completedMilestoneIds
        : [],
      startedWithDemoData: Boolean(parsed.startedWithDemoData),
      lastOpenedTimestamp: parsed.lastOpenedTimestamp || new Date().toISOString(),
      version: parsed.version || '12.0.0',
    };
  } catch {
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

/**
 * Persists updated onboarding state.
 */
export function saveOnboardingState(updates: Partial<OnboardingState>): OnboardingState {
  const current = getOnboardingState();
  const next: OnboardingState = {
    ...current,
    ...updates,
    lastOpenedTimestamp: new Date().toISOString(),
  };
  safeSetStorage(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
  return next;
}

/**
 * Marks the first-time welcome tour completed.
 */
export function markWelcomeCompleted(startedWithDemo: boolean = false): OnboardingState {
  return saveOnboardingState({
    hasCompletedWelcome: true,
    hasDismissedOnboarding: false,
    startedWithDemoData: startedWithDemo,
  });
}

/**
 * Dismisses onboarding banner/modal for now.
 */
export function dismissOnboarding(): OnboardingState {
  return saveOnboardingState({
    hasDismissedOnboarding: true,
  });
}

/**
 * Resets onboarding state back to initial default.
 */
export function resetOnboarding(): OnboardingState {
  safeSetStorage(ONBOARDING_STORAGE_KEY, JSON.stringify(DEFAULT_ONBOARDING_STATE));
  return { ...DEFAULT_ONBOARDING_STATE };
}

/**
 * Toggles completion status of a specific milestone.
 */
export function toggleMilestone(milestoneId: string, isCompleted: boolean): OnboardingState {
  const current = getOnboardingState();
  const set = new Set(current.completedMilestoneIds);
  if (isCompleted) {
    set.add(milestoneId);
  } else {
    set.delete(milestoneId);
  }
  return saveOnboardingState({
    completedMilestoneIds: Array.from(set),
  });
}

/**
 * Checks if a specific milestone is completed.
 */
export function isMilestoneCompleted(milestoneId: string): boolean {
  const state = getOnboardingState();
  return state.completedMilestoneIds.includes(milestoneId);
}

/**
 * Returns all milestones annotated with current completion status.
 */
export function getMilestones(): OnboardingMilestone[] {
  const state = getOnboardingState();
  return INITIAL_MILESTONES.map((m) => ({
    ...m,
    isCompleted: state.completedMilestoneIds.includes(m.id),
  }));
}

/**
 * Computes progress summary across milestones.
 */
export function getMilestoneProgress(): {
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const milestones = getMilestones();
  const totalCount = milestones.length;
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return { completedCount, totalCount, percentage };
}

/**
 * Searches help articles across titles, summaries, keywords, and content.
 */
export function searchHelpArticles(
  query: string = '',
  category: HelpCategory | 'all' = 'all'
): HelpArticle[] {
  const clean = query.trim().toLowerCase();
  return HELP_ARTICLES.filter((article) => {
    const matchesCategory = category === 'all' || article.category === category;
    if (!matchesCategory) return false;
    if (!clean) return true;

    return (
      article.title.toLowerCase().includes(clean) ||
      article.summary.toLowerCase().includes(clean) ||
      article.keywords.some((k) => k.toLowerCase().includes(clean)) ||
      article.content.some((c) => c.toLowerCase().includes(clean)) ||
      article.keyTakeaways.some((t) => t.toLowerCase().includes(clean))
    );
  });
}

/**
 * Searches FAQs across questions and answers.
 */
export function searchFaqs(
  query: string = '',
  category: HelpCategory | 'all' = 'all'
): FaqItem[] {
  const clean = query.trim().toLowerCase();
  return FAQ_ITEMS.filter((faq) => {
    const matchesCategory = category === 'all' || faq.category === category;
    if (!matchesCategory) return false;
    if (!clean) return true;

    return (
      faq.question.toLowerCase().includes(clean) ||
      faq.answer.toLowerCase().includes(clean)
    );
  });
}

/**
 * Searches the Financial Glossary across all 26 terms, definitions, Hinglish explanations, and examples.
 */
export function searchGlossary(
  query: string = '',
  category: string | 'all' = 'all'
): GlossaryTerm[] {
  const clean = query.trim().toLowerCase();
  const matched = FINANCIAL_GLOSSARY.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    if (!matchesCategory) return false;
    if (!clean) return true;

    return (
      item.term.toLowerCase().includes(clean) ||
      item.simpleDefinition.toLowerCase().includes(clean) ||
      item.intuitiveExplanation.toLowerCase().includes(clean) ||
      item.illustrativeExample.toLowerCase().includes(clean) ||
      item.relatedTerms.some((t) => t.toLowerCase().includes(clean))
    );
  });

  if (!clean) return matched;

  return matched.sort((a, b) => {
    const aTerm = a.term.toLowerCase();
    const bTerm = b.term.toLowerCase();
    const aTermMatch = aTerm.includes(clean);
    const bTermMatch = bTerm.includes(clean);
    if (aTermMatch && !bTermMatch) return -1;
    if (!aTermMatch && bTermMatch) return 1;
    const aStarts = aTerm.startsWith(clean);
    const bStarts = bTerm.startsWith(clean);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });
}

/**
 * Retrieves a guided workflow by its code (e.g., 'WORKFLOW_A').
 */
export function getWorkflowByCode(code: string): GuidedWorkflow | undefined {
  return GUIDED_WORKFLOWS.find((w) => w.code.toUpperCase() === code.toUpperCase() || w.id === code);
}

/**
 * Returns all available guided workflows.
 */
export function getAllWorkflows(): GuidedWorkflow[] {
  return GUIDED_WORKFLOWS;
}
