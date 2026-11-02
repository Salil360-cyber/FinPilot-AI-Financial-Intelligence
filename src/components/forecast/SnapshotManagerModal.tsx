import React, { useState } from 'react';
import {
  X,
  BookmarkPlus,
  Trash2,
  Calendar,
  Clock,
  Layers,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  ForecastSnapshot,
  ForecastRunResult,
  ScenarioDefinition,
} from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface SnapshotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: ForecastSnapshot[];
  onSaveSnapshot: (snapshot: ForecastSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onLoadSnapshot: (snapshot: ForecastSnapshot) => void;
  currentRunResult: ForecastRunResult;
  currentScenarios: ScenarioDefinition[];
  currencySymbol?: string;
}

export const SnapshotManagerModal: React.FC<SnapshotManagerModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onSaveSnapshot,
  onDeleteSnapshot,
  onLoadSnapshot,
  currentRunResult,
  currentScenarios,
  currencySymbol = '$',
}) => {
  const [snapshotName, setSnapshotName] = useState(
    `Forecast Snapshot - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  );
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!snapshotName.trim()) return;

    const newSnapshot: ForecastSnapshot = {
      id: `SNAP-${Date.now().toString(36).toUpperCase()}`,
      snapshotName: snapshotName.trim(),
      createdAt: new Date().toISOString(),
      createdBy: 'Financial Controller',
      metric: currentRunResult.metric,
      currency: currentRunResult.currency,
      horizonMonths: currentRunResult.horizonMonths,
      method: currentRunResult.methodConfig.method,
      projectedTotal: currentRunResult.projectedTotal,
      historicalTotal: currentRunResult.historicalSummary.totalValue,
      runResult: currentRunResult,
      scenarios: currentScenarios,
      notes: notes.trim() || undefined,
    };

    onSaveSnapshot(newSnapshot);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121929] border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Forecast Snapshots & Versioning</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Storage Disclosure Notice */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Local Storage Notice:</p>
              <p className="text-slate-300 mt-0.5">
                Saved snapshots are preserved in your browser's local sandbox (`finpilot_forecast_snapshots_v7`). They freeze historical actuals and model parameters so subsequent ledger entries will never retroactively overwrite past snapshot records.
              </p>
            </div>
          </div>

          {/* Save Current Workspace as New Snapshot */}
          <div className="p-4 bg-[#0b101b] border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-semibold text-white uppercase text-[11px] font-mono tracking-wider">
              Capture Current Forecast as Snapshot
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Snapshot Title</label>
                <input
                  type="text"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-[11px]">Scope & Horizon</label>
                <div className="px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-300 font-mono">
                  {currentRunResult.metric} • {currentRunResult.horizonMonths}M Horizon
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">Notes / Controller Memo</label>
              <input
                type="text"
                placeholder="Optional review notes, target variance explanations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400 text-[11px] font-mono">
                Projected Total: {currencySymbol}{Math.round(currentRunResult.projectedTotal).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Snapshot Saved!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save Snapshot</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of Saved Snapshots */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white uppercase text-[11px] font-mono tracking-wider">
              Saved Forecast Versions ({snapshots.length})
            </h3>

            {snapshots.length === 0 ? (
              <div className="p-6 bg-[#0b101b] border border-slate-800 rounded-lg text-center text-slate-400">
                No saved forecast snapshots yet. Save your first version above.
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3.5 bg-[#0b101b] border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{snap.snapshotName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {snap.horizonMonths}M Horizon
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                          {snap.method}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Captured: {new Date(snap.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Projected Total: {currencySymbol}{Math.round(snap.projectedTotal).toLocaleString()}</span>
                      </div>
                      {snap.notes && (
                        <p className="text-[11px] text-slate-400 italic">“{snap.notes}”</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSnapshot(snap);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        Load Version
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSnapshot(snap.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
