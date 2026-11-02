import React, { useState } from 'react';
import { X, Play, CheckCircle2, XCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { runPhase9TestSuite, Phase9TestResult } from '../../services/phase9TestSuite';

interface Phase9TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase9TestRunnerModal: React.FC<Phase9TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<Phase9TestResult[]>([]);
  const [hasRun, setHasRun] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartTests = async () => {
    setIsRunning(true);
    setResults([]);
    setHasRun(true);

    const testResults: Phase9TestResult[] = [];
    await runPhase9TestSuite((res) => {
      testResults.push(res);
      setResults([...testResults]);
    });

    setIsRunning(false);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const total = 30;
  const progressPct = Math.round((results.length / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Phase 9 Verification Suite (30 Scenarios)
              </h3>
              <p className="text-[11px] text-slate-400">
                Deterministic Advisory Validation & Regression Safety Suite
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Stats Bar */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-mono">
                Executed: <strong>{results.length}</strong> / {total}
              </span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed: <strong>{passedCount}</strong>
              </span>
              {failedCount > 0 && (
                <span className="text-rose-400 font-mono flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Failed: <strong>{failedCount}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={handleStartTests}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {hasRun ? 'Re-Run Suite' : 'Run 30 Tests'}
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                failedCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
          {!hasRun ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">Test Suite Ready</p>
              <p className="text-slate-500">
                Click "Run 30 Tests" to evaluate all Phase 9 financial advisory algorithms and Phase 2-8 regression safety boundaries.
              </p>
            </div>
          ) : (
            results.map((res) => (
              <div
                key={res.id}
                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs font-mono transition-colors ${
                  res.passed
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-slate-500 shrink-0">#{res.id}</span>
                  <span className="truncate font-sans font-medium text-slate-100">{res.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px] text-slate-500 font-sans hidden sm:inline">
                    {res.message}
                  </span>
                  <span>{res.durationMs}ms</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {passedCount === 30 ? 'All 30 deterministic checks passed (100%)' : 'Deterministic test harness'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
