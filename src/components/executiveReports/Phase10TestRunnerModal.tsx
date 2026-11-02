import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import { runPhase10TestSuite, TestCaseResult } from '../../services/phase10TestSuite';
import { runCrossModuleConsistencyTestSuite } from '../../services/crossModuleConsistencyTestSuite';

interface Phase10TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Phase10TestRunnerModal: React.FC<Phase10TestRunnerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [suiteResult, setSuiteResult] = useState<{
    total: number;
    passed: number;
    failed: number;
    results: TestCaseResult[];
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const executeTests = () => {
    const outcome = runPhase10TestSuite();
    const crossOutcome = runCrossModuleConsistencyTestSuite();

    const crossResults: TestCaseResult[] = crossOutcome.results.map((r) => ({
      id: r.id,
      category: 'Cross-Module Parity',
      name: `${r.moduleA} ↔ ${r.moduleB}: ${r.metricName}`,
      passed: r.passed,
      expected: r.expectedValue,
      actual: r.actualValue,
      details: r.description,
    }));

    setSuiteResult({
      total: outcome.total + crossOutcome.total,
      passed: outcome.passed + crossOutcome.passed,
      failed: outcome.failed + crossOutcome.failed,
      results: [...outcome.results, ...crossResults],
    });
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    'all',
    ...Array.from(new Set(suiteResult?.results.map((r) => r.category) || [])),
  ];

  const filteredResults =
    suiteResult?.results.filter((r) => {
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }
      return true;
    }) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Executive Reporting & Cross-Module Parity — Test Suite Verification
              </h2>
              <p className="text-xs text-slate-400">
                42 deterministic scenarios verifying P&L calculations, multi-source provenance, OWASP safety, and cross-module parity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={executeTests}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-run Suite
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Scorecard */}
        {suiteResult && (
          <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{suiteResult.passed} Passed</span>
              </div>
              {suiteResult.failed > 0 && (
                <div className="flex items-center gap-1.5 font-semibold text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span>{suiteResult.failed} Failed</span>
                </div>
              )}
              <div className="text-slate-400">
                Total: <span className="text-white font-mono">{suiteResult.total}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                {((suiteResult.passed / suiteResult.total) * 100).toFixed(0)}% SUCCESS RATE
              </span>
            </div>
          </div>
        )}

        {/* Controls: Category Pills & Search */}
        <div className="p-3 bg-slate-900 border-b border-slate-800/80 flex flex-col sm:flex-row gap-2 justify-between">
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Test List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredResults.map((t) => (
            <div
              key={t.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                t.passed
                  ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  : 'bg-red-950/30 border-red-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-500">{t.id}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                    {t.category}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200">{t.name}</div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {t.passed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-800">
                    <XCircle className="w-3.5 h-3.5" />
                    FAIL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
