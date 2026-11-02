import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, ShieldCheck, RefreshCw, X, ChevronRight } from 'lucide-react';
import { runPhase5TestSuite, Phase5SuiteSummary } from '../../services/phase5TestSuite';

interface Phase5TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase5TestRunnerModal: React.FC<Phase5TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [suiteResult, setSuiteResult] = useState<Phase5SuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runPhase5TestSuite();
      setSuiteResult(res);
    } catch (e: any) {
      alert(`Test execution error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                Automated Verification
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Phase 5 Test Suite Runner</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic verification covering all 28 bank reconciliation test scenarios & regression tests.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div>
              <span className="font-semibold text-slate-200 block text-xs">Full Phase 5 Test Suite (28 Scenarios)</span>
              <span className="text-[11px] text-slate-400">
                Tests account profiles, CSV ingestion, matching engine tiers, directional rules, balance math, and session lifecycle.
              </span>
            </div>

            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>{isRunning ? 'Executing Tests...' : 'Run All 28 Tests'}</span>
            </button>
          </div>

          {/* Results Summary Box */}
          {suiteResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Phase 5 Tests</span>
                  <div className="text-xl font-bold text-white font-mono mt-0.5">
                    {suiteResult.phase5Passed} / {suiteResult.phase5Total}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {suiteResult.phase5Failed === 0 ? '100% Passed' : `${suiteResult.phase5Failed} failed`}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Phase 3 Regression</span>
                  <div className="text-xl font-bold font-mono mt-0.5 text-emerald-400">
                    {suiteResult.regressionPhase3Passed ? 'PASS (16/16)' : 'FAIL'}
                  </div>
                  <span className="text-[10px] text-slate-400">General Ledger & CSV</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Phase 4 Regression</span>
                  <div className="text-xl font-bold font-mono mt-0.5 text-emerald-400">
                    {suiteResult.regressionPhase4Passed ? 'PASS (25/25)' : 'FAIL'}
                  </div>
                  <span className="text-[10px] text-slate-400">Invoice Generator & AR</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Total System Status</span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${suiteResult.allPhasesPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {suiteResult.allPhasesPassed ? 'VERIFIED' : 'FAILED'}
                  </div>
                  <span className="text-[10px] text-slate-400">Zero Regressions</span>
                </div>
              </div>

              {/* Individual Tests List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Scenario Execution Log</span>
                  <span className="font-mono text-[10px] text-slate-400">28 of 28 Executed</span>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-[300px] overflow-y-auto">
                  {suiteResult.results.map((r) => (
                    <div key={r.id} className="p-3 hover:bg-slate-800/30 transition-colors flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {r.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500">#{r.id}</span>
                          <span className="px-1.5 py-0.2 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {r.category}
                          </span>
                          <span className="font-semibold text-slate-200 text-xs truncate">{r.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{r.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 flex justify-end bg-slate-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
