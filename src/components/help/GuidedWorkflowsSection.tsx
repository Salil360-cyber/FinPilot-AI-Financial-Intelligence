/**
 * FinPilot AI - Phase 12 Guided Workflows Section
 * Interactive operational playbooks for all 8 standard financial journeys (A through H).
 */

import React, { useState } from 'react';
import {
  GitCommit,
  Clock,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import { GUIDED_WORKFLOWS } from '../../data/guidedWorkflows';
import { GuidedWorkflow } from '../../types/helpCenter';

interface GuidedWorkflowsSectionProps {
  onNavigate: (page: NavigationPage) => void;
}

export const GuidedWorkflowsSection: React.FC<GuidedWorkflowsSectionProps> = ({ onNavigate }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<GuidedWorkflow>(GUIDED_WORKFLOWS[0]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const handleSelectWorkflow = (wf: GuidedWorkflow) => {
    setSelectedWorkflow(wf);
    setActiveStepIndex(0);
  };

  const getDifficultyBadge = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Advanced':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Selection Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GUIDED_WORKFLOWS.map((wf) => {
          const isSelected = wf.id === selectedWorkflow.id;
          return (
            <button
              key={wf.id}
              onClick={() => handleSelectWorkflow(wf)}
              className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-[#121929] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400 uppercase">
                    {wf.code}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                      wf.difficulty
                    )}`}
                  >
                    {wf.difficulty}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-100 line-clamp-1">{wf.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{wf.subtitle}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {wf.estimatedMinutes} mins
                </span>
                <span className="text-amber-400/80 font-medium flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Workflow Detailed Card */}
      <div className="rounded-2xl border border-slate-800 bg-[#121929] p-6 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {selectedWorkflow.code}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getDifficultyBadge(
                  selectedWorkflow.difficulty
                )}`}
              >
                {selectedWorkflow.difficulty}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                ~{selectedWorkflow.estimatedMinutes} minutes
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">{selectedWorkflow.title}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{selectedWorkflow.overview}</p>
          </div>

          <button
            onClick={() => onNavigate(selectedWorkflow.targetModule)}
            className="self-start lg:self-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 shrink-0"
          >
            <span>Open {selectedWorkflow.targetModuleLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prerequisites */}
        {selectedWorkflow.prerequisites.length > 0 && (
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
            <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Workflow Prerequisites
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400">
              {selectedWorkflow.prerequisites.map((prereq, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{prereq}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stepper Navigation */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-amber-400" />
            Execution Steps ({selectedWorkflow.steps.length} Steps)
          </h4>

          {/* Step tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedWorkflow.steps.map((st, idx) => (
              <button
                key={st.stepNumber}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center gap-2 ${
                  activeStepIndex === idx
                    ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                    : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    activeStepIndex === idx ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {st.stepNumber}
                </span>
                <span className="truncate">{st.title}</span>
              </button>
            ))}
          </div>

          {/* Active Step Content */}
          {selectedWorkflow.steps[activeStepIndex] && (
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800/80 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    STEP {selectedWorkflow.steps[activeStepIndex].stepNumber} OF{' '}
                    {selectedWorkflow.steps.length}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">
                    {selectedWorkflow.steps[activeStepIndex].title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeStepIndex > 0 && (
                    <button
                      onClick={() => setActiveStepIndex((prev) => prev - 1)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
                    >
                      Previous
                    </button>
                  )}
                  {activeStepIndex < selectedWorkflow.steps.length - 1 ? (
                    <button
                      onClick={() => setActiveStepIndex((prev) => prev + 1)}
                      className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition font-medium flex items-center gap-1"
                    >
                      Next Step <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onNavigate(selectedWorkflow.targetModule)}
                      className="px-3 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition font-medium flex items-center gap-1"
                    >
                      Execute in {selectedWorkflow.targetModuleLabel} <CheckCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs leading-relaxed font-medium">
                {selectedWorkflow.steps[activeStepIndex].instruction}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedWorkflow.steps[activeStepIndex].detail}
              </p>

              {/* Action Tip */}
              {selectedWorkflow.steps[activeStepIndex].actionTip && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-300">Action Tip: </span>
                    {selectedWorkflow.steps[activeStepIndex].actionTip}
                  </div>
                </div>
              )}

              {/* Warning Note */}
              {selectedWorkflow.steps[activeStepIndex].warningNote && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200/90 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-rose-300">Operational Precaution: </span>
                    {selectedWorkflow.steps[activeStepIndex].warningNote}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Regulatory Disclaimer */}
        {selectedWorkflow.regulatoryDisclaimer && (
          <div className="text-[11px] text-slate-500 italic pt-2 border-t border-slate-800/80">
            Compliance Note: {selectedWorkflow.regulatoryDisclaimer}
          </div>
        )}
      </div>
    </div>
  );
};
