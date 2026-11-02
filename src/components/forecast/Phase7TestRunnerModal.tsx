import React, { useState } from 'react';
import {
  X,
  PlayCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  runPhase7TestSuite,
  Phase7TestSuiteSummary,
  TestResultItem,
} from '../../services/phase7TestSuite';
import { useFinancial } from '../../context/FinancialContext';

interface Phase7TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase7TestRunnerModal: React.FC<Phase7TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { transactions, salesInvoices } = useFinancial();
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<Phase7TestSuiteSummary | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runPhase7TestSuite(transactions, salesInvoices);
      setSummary(res);
    } catch (e) {
      console.error('Test execution failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredResults = summary
    ? filterCategory === 'all'
      ? summary.results
      : summary.results.filter((r) => r.category === filterCategory)
    : [];

  const categories = summary
    ? Array.from(new Set(summary.results.map((r) => r.category)))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121929] border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <PlayCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                Phase 7 Automated Verification Suite
              </h2>
              <p className="text-xs text-slate-400">
                28 Deterministic Scenarios + Regressions for Phase 2, 3, 4, 5, 6
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Metric Bar */}
        <div className="p-4 bg-[#0b101b] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running 28 Test Scenarios...' : 'Execute Test Suite'}</span>
            </button>
          </div>

          {summary && (
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">
                Tests: <strong className="text-white">{summary.phase7Total}</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                Passed: {summary.phase7Passed}
              </span>
              <span
                className={`font-bold ${
                  summary.phase7Failed === 0 ? 'text-slate-400' : 'text-rose-400'
                }`}
              >
                Failed: {summary.phase7Failed}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                  summary.allPhasesPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {summary.allPhasesPassed ? 'ALL PHASES PASSED' : 'REGRESSION DETECTED'}
              </span>
            </div>
          )}
        </div>

        {/* Content & Test List */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {summary && (
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
              <span className="text-slate-400 text-[11px] font-mono uppercase">Category:</span>
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All ({summary.results.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    filterCategory === cat
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {!summary && !isRunning && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-medium text-slate-300">Test runner ready.</p>
              <p className="text-[11px]">
                Click "Execute Test Suite" to run all 28 Phase 7 scenarios and verify backwards compatibility.
              </p>
            </div>
          )}

          {isRunning && (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="font-medium text-white">Running Phase 7 calculations & regressions...</p>
            </div>
          )}

          {summary && (
            <div className="space-y-2">
              {filteredResults.map((test) => {
                const isExpanded = expandedDetails[test.id];
                return (
                  <div
                    key={test.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      test.passed
                        ? 'bg-[#0b101b] border-slate-800/80 hover:border-slate-700'
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpand(test.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        {test.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-mono text-slate-400 text-[11px]">
                          #{test.id.toString().padStart(2, '0')}
                        </span>
                        <span className="font-medium text-white">{test.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                          {test.category}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            test.passed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {test.passed ? 'PASS' : 'FAIL'}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1">
                        {test.details && (
                          <div>
                            <span className="text-slate-400">Details: </span>
                            <span className="text-emerald-300/90">{test.details}</span>
                          </div>
                        )}
                        {test.message && (
                          <div className="text-rose-300">
                            <span className="text-rose-400">Message: </span>
                            {test.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
