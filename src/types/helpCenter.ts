/**
 * FinPilot AI - Phase 12: User Onboarding, Help Center & Workflow Guidance Types
 * Comprehensive data contracts for onboarding milestones, guided journeys,
 * searchable knowledge base, and financial glossary.
 */

import { NavigationPage } from './finance';

export type HelpCategory =
  | 'invoices'
  | 'ledger'
  | 'sales_invoices'
  | 'reconciliation'
  | 'analytics'
  | 'forecasting'
  | 'annual_reports'
  | 'advisory'
  | 'executive_reports'
  | 'settings'
  | 'backup_restore';

export interface HelpArticle {
  id: string;
  category: HelpCategory;
  categoryLabel: string;
  title: string;
  summary: string;
  content: string[]; // Structured paragraphs
  keyTakeaways: string[];
  relatedModule?: NavigationPage;
  relatedModuleLabel?: string;
  keywords: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: HelpCategory;
  relatedModule?: NavigationPage;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  instruction: string;
  detail: string;
  warningNote?: string;
  actionTip?: string;
}

export interface GuidedWorkflow {
  id: string;
  code: string; // e.g. "WORKFLOW_A"
  title: string;
  subtitle: string;
  targetModule: NavigationPage;
  targetModuleLabel: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  overview: string;
  prerequisites: string[];
  steps: WorkflowStep[];
  regulatoryDisclaimer?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  category: 'core_accounting' | 'liquidity_ratios' | 'reconciliation' | 'forecasting' | 'audit_governance';
  categoryLabel: string;
  simpleDefinition: string;
  intuitiveExplanation: string; // Conversational / Hinglish-friendly explanation
  illustrativeExample: string;
  relatedTerms: string[];
  relatedModule?: NavigationPage;
}

export interface OnboardingMilestone {
  id: string;
  title: string;
  description: string;
  targetPage: NavigationPage;
  actionLabel: string;
  isCompleted: boolean;
}

export interface OnboardingState {
  hasCompletedWelcome: boolean;
  hasDismissedOnboarding: boolean;
  completedMilestoneIds: string[];
  startedWithDemoData: boolean;
  lastOpenedTimestamp: string;
  version: string;
}

export const ONBOARDING_STORAGE_KEY = 'finpilot_onboarding_v12';

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  hasCompletedWelcome: false,
  hasDismissedOnboarding: false,
  completedMilestoneIds: [],
  startedWithDemoData: false,
  lastOpenedTimestamp: new Date().toISOString(),
  version: '12.0.0',
};

export const INITIAL_MILESTONES: OnboardingMilestone[] = [
  {
    id: 'explore_overview',
    title: 'Explore Overview & Financial Health Scorecards',
    description: 'Review total operating revenue, expenses, and cash reserves across active operations.',
    targetPage: 'overview',
    actionLabel: 'Open Overview',
    isCompleted: false,
  },
  {
    id: 'review_invoices',
    title: 'Review Vendor Invoices & Client-Side OCR',
    description: 'Inspect extracted invoice fields, line items, and verify tax compliance rules.',
    targetPage: 'invoice-intelligence',
    actionLabel: 'Open Invoice Intelligence',
    isCompleted: false,
  },
  {
    id: 'inspect_ledger',
    title: 'Verify General Ledger & Double-Entry Postings',
    description: 'Review posted double-entry journal records, vendor allocations, and voucher audit IDs.',
    targetPage: 'expense-ledger',
    actionLabel: 'Open Expense Ledger',
    isCompleted: false,
  },
  {
    id: 'check_reconciliation',
    title: 'Inspect Bank Reconciliation & Auto-Match Engine',
    description: 'Pair bank clearing statement movements against book records with confidence scoring.',
    targetPage: 'bank-reconciliation',
    actionLabel: 'Open Bank Reconciliation',
    isCompleted: false,
  },
  {
    id: 'generate_report_backup',
    title: 'Generate an Executive Report or Data Backup',
    description: 'Compile a multi-tier financial summary and export a portable JSON backup file.',
    targetPage: 'executive-reports',
    actionLabel: 'Open Executive Reports',
    isCompleted: false,
  },
];
