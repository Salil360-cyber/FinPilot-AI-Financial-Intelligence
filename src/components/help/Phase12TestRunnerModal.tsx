/**
 * FinPilot AI - Phase 12 Test Runner Modal
 * Interactive in-app verification runner executing all 30 Phase 12 test scenarios.
 */

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { runPhase12TestSuite, Phase12TestSuiteReport } from '../../services/phase12TestSuite';

interface Phase12TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase12TestRunnerModal: React.FC<Phase12TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [report, setReport] = useState<Phase12TestSuiteReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const rep = runPhase12TestSuite();
      setReport(rep);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0f172a] shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#121929]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Phase 12 Verification Suite
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  30 Scenarios
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated regression & functional validation for Onboarding, Help Center & Glossary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-[#0b101b]">
          <div className="text-xs text-slate-400">
            {report ? (
              <span className="flex items-center gap-2">
                <span
                  className={`font-semibold ${
                    report.overallStatus === 'passed' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {report.overallStatus.toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {report.passedTests} / {report.totalTests} Passed
                </span>
                <span>•</span>
                <span className="font-mono text-slate-500">
                  {new Date(report.executedAt).toLocaleTimeString()}
                </span>
              </span>
            ) : (
              <span>Click &quot;Run Verification&quot; to execute all 30 tests in real time.</span>
            )}
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Verification</span>
              </>
            )}
          </button>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {!report && !isRunning && (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p>Ready to execute 30 Phase 12 validation scenarios.</p>
            </div>
          )}

          {report && (
            <div className="space-y-2">
              {report.results.map((r, i) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    r.status === 'passed'
                      ? 'bg-slate-900/50 border-slate-800 text-slate-200'
                      : 'bg-rose-950/20 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {r.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">#{i + 1}</span>
                        <span>{r.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">({r.id})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.description}</p>
                      {r.error && (
                        <p className="text-[11px] font-mono text-rose-400 mt-1 p-2 rounded bg-rose-950/40 border border-rose-800/40">
                          {r.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {r.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#121929] flex items-center justify-between text-xs text-slate-400">
          <span>Phase 12 Onboarding, Help Center & Workflow Guidance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
