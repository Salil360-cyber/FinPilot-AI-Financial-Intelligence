import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Cpu,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import { DiagnosticCheckItem } from '../../types/settings';
import { runSystemDiagnostics } from '../../services/dataManagementEngine';

interface SystemDiagnosticsSectionProps {
  onOpenPhase11Tests: () => void;
}

export const SystemDiagnosticsSection: React.FC<SystemDiagnosticsSectionProps> = ({
  onOpenPhase11Tests,
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheckItem[]>(() => runSystemDiagnostics());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunDiagnostics = () => {
    setIsRunning(true);
    setTimeout(() => {
      const fresh = runSystemDiagnostics();
      setDiagnostics(fresh);
      setIsRunning(false);
    }, 400);
  };

  const getStatusBadge = (status: DiagnosticCheckItem['status']) => {
    switch (status) {
      case 'alert':
        return 'bg-red-950 text-red-300 border-red-800';
      case 'warning':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'notice':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            System Diagnostics & Architectural Integrity Checks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-phase health checks evaluating double-entry balancing, storage serialization, and security controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPhase11Tests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition border border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Phase 11 Test Suite (30)</span>
          </button>

          <button
            type="button"
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Re-run Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Diagnostics Results List */}
      <div className="space-y-3">
        {diagnostics.map((diag) => (
          <div
            key={diag.id}
            className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{diag.title}</span>
                <span className="font-mono text-[10px] text-slate-500">[{diag.id}]</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{diag.detail}</p>
              {diag.recommendation && (
                <div className="text-[11px] text-amber-400/90 font-medium">
                  Recommendation: {diag.recommendation}
                </div>
              )}
            </div>

            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${getStatusBadge(
                diag.status
              )}`}
            >
              {diag.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
