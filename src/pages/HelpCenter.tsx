/**
 * FinPilot AI - Phase 12 Help Center & Workflow Guidance Page
 * Central knowledge base, guided operational workflows, searchable 26-term glossary,
 * and onboarding milestone tracker.
 */

import React, { useState } from 'react';
import {
  Compass,
  GitCommit,
  BookOpen,
  HelpCircle,
  CheckSquare,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { NavigationPage } from '../types/finance';
import { GuidedWorkflowsSection } from '../components/help/GuidedWorkflowsSection';
import { KnowledgeBaseSection } from '../components/help/KnowledgeBaseSection';
import { FinancialGlossarySection } from '../components/help/FinancialGlossarySection';
import { GettingStartedChecklist } from '../components/help/GettingStartedChecklist';
import { Phase12TestRunnerModal } from '../components/help/Phase12TestRunnerModal';
import { WelcomeOnboardingModal } from '../components/help/WelcomeOnboardingModal';

interface HelpCenterProps {
  onNavigate: (page: NavigationPage) => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'knowledge_base' | 'glossary' | 'checklist'>('workflows');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121929] border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Help Center & Workflow Guidance
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono">
              Phase 12
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Step-by-step playbooks for finance operations, searchable 11-module knowledge base,
            26-term financial glossary with conversational Hinglish breakdowns, and milestone tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsWelcomeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reopen Welcome Tour</span>
          </button>

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Run Phase 12 Tests (30)</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'workflows'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-[#121929] border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Guided Workflows (A–H)</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge_base')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'knowledge_base'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-[#121929] border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Base & FAQs</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'glossary'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-[#121929] border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Financial Glossary (26 Terms)</span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-[#121929] border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Getting Started Checklist</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'workflows' && <GuidedWorkflowsSection onNavigate={onNavigate} />}

        {activeTab === 'knowledge_base' && <KnowledgeBaseSection onNavigate={onNavigate} />}

        {activeTab === 'glossary' && <FinancialGlossarySection onNavigate={onNavigate} />}

        {activeTab === 'checklist' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <GettingStartedChecklist onNavigate={onNavigate} />
          </div>
        )}
      </div>

      {/* Modals */}
      <Phase12TestRunnerModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />

      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
