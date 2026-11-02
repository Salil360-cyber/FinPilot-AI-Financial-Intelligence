import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import { runPhase8TestSuite, Phase8TestResult } from '../../services/phase8TestSuite';

interface Phase8TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase8TestRunnerModal: React.FC<Phase8TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<Phase8TestResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; passed: number; failed: number } | null>(null);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const suiteResults = await runPhase8TestSuite((res) => {
        setResults((prev) => [...prev, res]);
      });

      const passed = suiteResults.filter((r) => r.passed).length;
      setSummary({
        total: suiteResults.length,
        passed,
        failed: suiteResults.length - passed,
      });
    } catch (err) {
      console.error('Test suite error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Phase 8 Verification Suite & Regressions</h3>
              <p className="text-xs text-slate-400">28 deterministic verification tests + Phases 2–7 regression checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {summary && (
            <div
              className={'p-4 rounded-xl border flex items-center justify-between text-xs ' + (
                summary.failed === 0
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              )}
            >
              <div className="flex items-center space-x-3">
                {summary.failed === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-sm">
                    {summary.failed === 0 ? 'All 28 Test Scenarios Passed (100%)' : summary.failed + ' Test(s) Failed'}
                  </span>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Total: {summary.total} • Passed: {summary.passed} • Failed: {summary.failed}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {results.length === 0 && !isRunning && (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
                Click "Run All 28 Tests" to execute the deterministic validation tests, accounting equation checks, ratio calculations, and regression suite.
              </div>
            )}

            {results.map((res) => (
              <div
                key={res.id}
                className={'p-3 rounded-lg border text-xs flex items-start space-x-3 ' + (
                  res.passed
                    ? 'bg-slate-900/50 border-slate-800 text-slate-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                )}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      [{res.id}] {res.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{res.durationMs}ms</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{res.message}</div>
                </div>
              </div>
            ))}

            {isRunning && (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center space-x-3 text-amber-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing test scenario #{results.length + 1}...</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Run All 28 Tests</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
