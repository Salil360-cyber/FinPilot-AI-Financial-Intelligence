import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { runPhase2TestSuite, TestExecutionResult } from '../../services/sampleInvoices';
import { useFinancial } from '../../context/FinancialContext';

export const Phase2TestSuite: React.FC = () => {
  const { transactions } = useFinancial();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestExecutionResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleExecuteTests = async () => {
    setIsRunning(true);
    try {
      const suiteResults = await runPhase2TestSuite(transactions);
      setResults(suiteResults);
      setHasRun(true);
    } catch (e) {
      console.error('Test execution error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  // Run automatically on first mount
  useEffect(() => {
    handleExecuteTests();
  }, []);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const totalDuration = results.reduce((acc, curr) => acc + curr.durationMs, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
              PHASE 2 COMPLIANCE TEST HARNESS
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-400 font-mono">10 DETERMINISTIC SCENARIOS</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Automated Invoice Intelligence Test Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executes and asserts extraction, format checks, arithmetic validations, and duplicate prevention.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExecuteTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Executing Suite...' : 'Re-Run All 10 Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Suite Status</span>
          <div className="flex items-center gap-2 mt-1">
            {passedCount === totalCount && totalCount > 0 ? (
              <span className="text-2xl font-bold font-mono text-emerald-400">100% PASSED</span>
            ) : isRunning ? (
              <span className="text-2xl font-bold font-mono text-amber-400">RUNNING</span>
            ) : (
              <span className="text-2xl font-bold font-mono text-rose-400">ATTENTION</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {passedCount} of {totalCount} tests verified passing
          </span>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Cumulative Execution Time</span>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {totalDuration} ms
          </div>
          <span className="text-[11px] text-slate-400">Client-side browser performance</span>
        </div>

        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono uppercase text-slate-400">Privacy & Cost Guarantee</span>
          <div className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero External API Calls</span>
          </div>
          <span className="text-[11px] text-slate-400">Deterministic local verification</span>
        </div>
      </div>

      {/* Test Scenarios Table */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Test Matrix Results
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Section 10 Requirements Compliance
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {results.map((t) => (
            <div key={t.id} className="p-4 hover:bg-slate-900/40 transition-colors flex items-start gap-3.5">
              <div className="shrink-0 mt-0.5">
                {t.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-semibold">Test {t.id}:</span>
                    <h4 className="text-xs font-semibold text-slate-100">{t.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
                    <span className="text-slate-400">{t.durationMs}ms</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        t.passed
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.message}
                </p>

                {t.details && (
                  <div className="mt-1.5 p-2 bg-slate-950/60 rounded border border-slate-800 font-mono text-[11px] text-slate-400">
                    {t.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
