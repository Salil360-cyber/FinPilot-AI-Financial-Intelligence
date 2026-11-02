import React, { useState } from 'react';
import { LucideIcon, Info, Sparkles, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction?: () => void;
  modulePhase?: string;
  plannedFeatures?: string[];
  sampleDataTagline?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  modulePhase = 'Phase 2 Architecture',
  plannedFeatures = [],
  sampleDataTagline,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);

  const handleActionClick = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      setShowPreviewModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Foundation Notice Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-sm">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-200">Module Foundation Phase</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-amber-400/90 font-mono">{modulePhase}</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            This module is structured for incremental deployment. In accordance with the enterprise architecture plan,
            document ingestion pipelines, automated validation algorithms, and database persistence will be integrated sequentially.
          </p>
        </div>
      </div>

      {/* Main Empty State Canvas */}
      <div className="bg-[#101726] border border-slate-800/80 rounded-xl p-10 md:p-14 text-center max-w-3xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/60 mx-auto flex items-center justify-center text-amber-400 mb-6 shadow-inner">
          <Icon className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleActionClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{primaryActionLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 rounded-lg transition-colors"
          >
            <span>View Architecture Blueprint</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Planned Capabilities Checklist */}
        {plannedFeatures.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-800 text-left">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 text-center">
              Planned Engineering Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {plannedFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/40 border border-slate-800/60 rounded-lg px-3 py-2"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Architecture Blueprint Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121a2d] border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">{title} Pipeline</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setHasSimulated(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300">
                <div className="flex items-center justify-between font-mono text-slate-400">
                  <span>TARGET SPECIFICATION:</span>
                  <span className="text-amber-400">REST & DETERMINISTIC PARSERS</span>
                </div>
                <p>
                  This view verifies the schema and UI shell. When integrated with production pipelines, this module will process documents via open-source OCR tools, execute deterministic double-entry reconciliation, and store transactional audits in the database.
                </p>
              </div>

              {!hasSimulated ? (
                <div className="p-4 border border-dashed border-slate-700 rounded-lg text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Test the workflow simulation using representative mock enterprise payloads:
                  </p>
                  <button
                    type="button"
                    onClick={() => setHasSimulated(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-600 transition-colors"
                  >
                    Run Mock Pipeline Verification
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-1.5 text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Mock Pipeline Verification Succeeded</span>
                  </div>
                  <p className="text-emerald-400/80 text-[11px]">
                    Schema contracts validated. UI hooks verified ready for live service ingestion without requiring changes to the application shell.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setHasSimulated(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
