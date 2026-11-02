import React, { useState } from 'react';
import { X, History, Trash2, RotateCcw, Calendar, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AdvisorySnapshot } from '../../types/advisory';

interface AdvisoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: AdvisorySnapshot[];
  onRestoreSnapshot: (snapshot: AdvisorySnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onClearAllHistory: () => void;
}

export const AdvisoryHistoryModal: React.FC<AdvisoryHistoryModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onClearAllHistory,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<AdvisorySnapshot | null>(snapshots[0] || null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-[#121929] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Advisory History & Saved Snapshots ({snapshots.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Timestamped snapshots stored in browser-local persistence
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {snapshots.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">No Advisory Snapshots Saved</p>
              <p className="text-slate-500">
                Click "Save Snapshot" in the header to record an auditable advisory milestone.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Snapshots List (Left) */}
              <div className="md:col-span-5 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {snapshots.map((snap) => {
                  const isSelected = selectedSnapshot?.id === snap.id;
                  return (
                    <div
                      key={snap.id}
                      onClick={() => setSelectedSnapshot(snap)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors space-y-1.5 ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/40 text-white'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          {new Date(snap.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {snap.currency}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold truncate text-white">
                        {snap.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span>{snap.totalInsights} Findings</span>
                        <span>•</span>
                        <span className="text-rose-400">
                          {snap.insightsCountBySeverity.high_priority || 0} Critical
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Snapshot Details (Right) */}
              <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                {selectedSnapshot ? (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {selectedSnapshot.title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Saved: {new Date(selectedSnapshot.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteSnapshot(selectedSnapshot.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete this snapshot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">Total Insights</span>
                        <span className="text-white font-bold text-sm">{selectedSnapshot.totalInsights}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                        <span className="text-slate-500 block">High Priority</span>
                        <span className="text-rose-400 font-bold text-sm">
                          {selectedSnapshot.insightsCountBySeverity.high_priority || 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                        Key Health Signals at Snapshot:
                      </span>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedSnapshot.healthSignals.map((sig) => (
                          <div
                            key={sig.id}
                            className="bg-slate-950/40 p-2 rounded border border-slate-800/80 flex items-center justify-between text-[11px]"
                          >
                            <span className="text-slate-300">{sig.indicator}</span>
                            <span className="font-mono text-amber-400 font-bold">{sig.valueDisplay}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreSnapshot(selectedSnapshot);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg text-xs transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Inspect This Snapshot
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    Select a snapshot from the list to view historical details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Clear All Confirmation */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-medium">Clear all snapshots?</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllHistory();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-rose-500 text-white font-semibold rounded text-[11px] hover:bg-rose-400"
              >
                Yes, Delete All
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={snapshots.length === 0}
              className="text-slate-500 hover:text-rose-400 disabled:opacity-30 text-[11px] transition-colors"
            >
              Clear All Advisory History
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
