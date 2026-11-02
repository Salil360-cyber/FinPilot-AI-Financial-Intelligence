/**
 * FinPilot AI - Phase 12 Contextual Help Card
 * Reusable banner/card providing clear situational guidance,
 * key operational workflows, and shortcuts to documentation.
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronRight, X, Sparkles, BookOpen } from 'lucide-react';
import { NavigationPage } from '../../types/finance';

interface ContextualHelpCardProps {
  title: string;
  description: string;
  workflowCode?: string;
  workflowTitle?: string;
  helpArticleId?: string;
  onNavigate: (page: NavigationPage) => void;
  storageDismissKey?: string;
}

export const ContextualHelpCard: React.FC<ContextualHelpCardProps> = ({
  title,
  description,
  workflowTitle,
  onNavigate,
  storageDismissKey,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (!storageDismissKey) return false;
    try {
      return localStorage.getItem(`finpilot_dismiss_${storageDismissKey}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    if (storageDismissKey) {
      try {
        localStorage.setItem(`finpilot_dismiss_${storageDismissKey}`, 'true');
      } catch {
        // ignore
      }
    }
  };

  if (isDismissed) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#121929] to-[#121929] p-4 text-xs text-slate-300 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">{title}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              Guide
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed max-w-2xl">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          onClick={() => onNavigate('help-center')}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{workflowTitle || 'Help & Workflows'}</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
          title="Dismiss guidance"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
