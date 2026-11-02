import React from 'react';
import {
  BrainCircuit,
  SlidersHorizontal,
  Download,
  Camera,
  History,
  PlayCircle,
  FileSpreadsheet,
  Printer,
  Sparkles,
} from 'lucide-react';
import { AdvisoryThresholds } from '../../types/advisory';

interface AdvisoryHeaderProps {
  onOpenThresholds: () => void;
  onOpenHistory: () => void;
  onOpenTestRunner: () => void;
  onSaveSnapshot: () => void;
  onExportInsightsCsv: () => void;
  onExportActionsCsv: () => void;
  onTriggerPrint: () => void;
  thresholds: AdvisoryThresholds;
  isAiGenerating?: boolean;
  onRegenerateAiCommentary?: () => void;
}

export const AdvisoryHeader: React.FC<AdvisoryHeaderProps> = ({
  onOpenThresholds,
  onOpenHistory,
  onOpenTestRunner,
  onSaveSnapshot,
  onExportInsightsCsv,
  onExportActionsCsv,
  onTriggerPrint,
  isAiGenerating = false,
  onRegenerateAiCommentary,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">AI Financial Advisory</h1>
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                PHASE 9 VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evidence-based financial decision support, health signals, prioritized action board, and scenario what-if modeling.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onRegenerateAiCommentary && (
          <button
            type="button"
            onClick={onRegenerateAiCommentary}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
            title="Generate fresh commentary grounded in deterministic metrics"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : 'text-indigo-400'}`} />
            {isAiGenerating ? 'Synthesizing...' : 'Refresh AI Notes'}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenThresholds}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          title="Configure advisory signal alert thresholds"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          Thresholds
        </button>

        <button
          type="button"
          onClick={onSaveSnapshot}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          title="Save timestamped snapshot to browser persistence"
        >
          <Camera className="w-3.5 h-3.5 text-blue-400" />
          Save Snapshot
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          title="View and restore saved advisory history snapshots"
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          History
        </button>

        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <div className="absolute right-0 mt-1 w-48 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-50">
            <button
              type="button"
              onClick={onExportInsightsCsv}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Advisory Insights CSV
            </button>
            <button
              type="button"
              onClick={onExportActionsCsv}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              Action Recommendations CSV
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          title="Print or Save PDF report via browser print dialog"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          Print / PDF
        </button>

        <button
          type="button"
          onClick={onOpenTestRunner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          title="Execute the 30-scenario Phase 9 test suite"
        >
          <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
          Test Suite (30)
        </button>
      </div>
    </div>
  );
};
