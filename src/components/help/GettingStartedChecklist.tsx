/**
 * FinPilot AI - Phase 12 Getting Started Checklist
 * Displays 5 core milestones with completion progress, interactive checkboxes,
 * direct module links, and reset capabilities.
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import {
  getMilestones,
  getMilestoneProgress,
  toggleMilestone,
  resetOnboarding,
} from '../../services/onboardingService';

interface GettingStartedChecklistProps {
  onNavigate: (page: NavigationPage) => void;
  compact?: boolean;
}

export const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({
  onNavigate,
  compact = false,
}) => {
  const [, setRenderTrigger] = useState(0);
  const forceUpdate = () => setRenderTrigger((prev) => prev + 1);

  const milestones = getMilestones();
  const progress = getMilestoneProgress();

  const handleToggle = (id: string, currentStatus: boolean) => {
    toggleMilestone(id, !currentStatus);
    forceUpdate();
  };

  const handleReset = () => {
    if (window.confirm('Reset all onboarding milestones back to incomplete?')) {
      resetOnboarding();
      forceUpdate();
    }
  };

  const isAllComplete = progress.percentage === 100;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#121929] p-5 shadow-xl space-y-5">
      {/* Header and Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {isAllComplete ? <Trophy className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Getting Started Checklist
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {progress.completedCount} / {progress.totalCount} completed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete these 5 operational milestones to master FinPilot AI financial workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/80 transition"
            title="Reset milestone checks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Onboarding Readiness</span>
          <span className="font-semibold text-amber-400 font-mono">{progress.percentage}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isAllComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {isAllComplete && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center gap-3 text-emerald-300 text-xs">
          <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong>All milestones completed!</strong> You have successfully explored and verified each of FinPilot AI’s primary operational modules.
          </div>
        </div>
      )}

      {/* Milestone List */}
      <div className="space-y-2.5">
        {milestones.map((m, idx) => (
          <div
            key={m.id}
            className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              m.isCompleted
                ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                : 'bg-[#0f172a] border-slate-700/70 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <button
                onClick={() => handleToggle(m.id, m.isCompleted)}
                className="mt-0.5 text-slate-400 hover:text-amber-400 transition"
                title={m.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {m.isCompleted ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                )}
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                  <span
                    className={`text-xs font-semibold ${
                      m.isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'
                    }`}
                  >
                    {m.title}
                  </span>
                </div>
                {!compact && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {m.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                onNavigate(m.targetPage);
                if (!m.isCompleted) {
                  toggleMilestone(m.id, true);
                  forceUpdate();
                }
              }}
              className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <span>{m.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
