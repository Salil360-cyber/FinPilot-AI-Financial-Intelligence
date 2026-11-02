import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  FileCheck2,
  Copy,
  Lock,
  RotateCcw,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  FinPilotBackupArtifact,
  RestoreMode,
  RestorePreview,
  RestoreResult,
} from '../../types/settings';
import {
  generateFullBackupArtifact,
  validateAndPreviewBackup,
  executeRestore,
} from '../../services/dataManagementEngine';

interface BackupRestoreSectionProps {
  entityName: string;
  onRefreshStorage: () => void;
  onToast: (msg: string) => void;
}

export const BackupRestoreSection: React.FC<BackupRestoreSectionProps> = ({
  entityName,
  onRefreshStorage,
  onToast,
}) => {
  const [lastExportArtifact, setLastExportArtifact] = useState<FinPilotBackupArtifact | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger Download of Backup JSON
  const handleExportBackup = () => {
    try {
      const artifact = generateFullBackupArtifact(entityName);
      const jsonString = JSON.stringify(artifact, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().split('T')[0];
      const safeEntity = (artifact.entityName || 'FinPilot').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = url;
      link.setAttribute('download', `FinPilot_Backup_${safeEntity}_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setLastExportArtifact(artifact);
      onToast(`Full backup created successfully (${artifact.metadata.totalRecordCount} records)`);
    } catch (err: any) {
      onToast(`Backup generation failed: ${err.message}`);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSelectedFileContent(content);
      const preview = validateAndPreviewBackup(content);
      setRestorePreview(preview);
      setRestoreResult(null);
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleConfirmRestore = () => {
    if (!selectedFileContent) return;
    setIsProcessing(true);
    setShowConfirmModal(false);

    try {
      const artifact: FinPilotBackupArtifact = JSON.parse(selectedFileContent);
      const result = executeRestore(artifact, restoreMode, {
        createSafetyBackupFirst: createSafetyBackup,
      });

      setRestoreResult(result);
      setIsProcessing(false);
      onRefreshStorage();

      if (result.status === 'success') {
        onToast(result.message);
      } else {
        onToast(`Restore completed with status: ${result.status}`);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setRestoreResult({
        status: 'failed',
        restoredCategories: [],
        failedCategories: [],
        recordsRestored: 0,
        message: `Restore failed: ${err.message}`,
      });
      onToast(`Restore failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            Full Data Backup & Restore Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export complete encrypted-ready JSON snapshots and restore application state with atomic safety checks.
          </p>
        </div>
      </div>

      {/* Grid: Backup on Left, Restore on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL A: CREATE BACKUP */}
        <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Full Application Backup</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Creates a versioned, portable JSON artifact encompassing all 16 supported categories: General Ledger,
              Sales Invoices, Bank Reconciliation sessions, Forecasts, Annual Reports, and Executive Configurations.
            </p>

            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security & Credential Guarantee</span>
              </div>
              <p>
                API keys, bearer tokens, passwords, and private authentication secrets are strictly excluded from
                backup payloads per OWASP guidelines.
              </p>
            </div>

            {lastExportArtifact && (
              <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-900/40 text-[11px] text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Latest Export Verified
                </div>
                <div>Entity: <span className="text-white">{lastExportArtifact.entityName}</span></div>
                <div>Records: <span className="font-mono text-white">{lastExportArtifact.metadata.totalRecordCount}</span></div>
                <div>Checksum: <span className="font-mono text-white">{lastExportArtifact.metadata.checksum}</span></div>
              </div>
            )}
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate & Download Backup JSON</span>
          </button>
        </div>

        {/* PANEL B: RESTORE FROM BACKUP */}
        <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore from Backup File</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload an existing <span className="font-mono text-slate-300">finpilot-ai-backup</span> JSON file to inspect
            contents and restore accounting records.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-4 border border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-xs text-slate-300 transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Select .json Backup File to Inspect</span>
          </button>

          {/* Validation & Preview Card */}
          {restorePreview && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Backup Validation Preview</span>
                {restorePreview.isValid ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" /> Compatible Schema
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 px-2 py-0.5 rounded bg-red-950/60 border border-red-800">
                    <XCircle className="w-3 h-3" /> Incompatible / Invalid
                  </span>
                )}
              </div>

              {restorePreview.validationErrors.length > 0 && (
                <div className="p-2.5 rounded bg-red-950/40 border border-red-900/60 text-[11px] text-red-300 space-y-1">
                  {restorePreview.validationErrors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}

              {restorePreview.isValid && (
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>Entity: <span className="text-white font-medium">{restorePreview.entityName}</span></div>
                    <div>Schema: <span className="text-white font-mono">{restorePreview.schemaVersion}</span></div>
                    <div>Exported: <span className="text-white">{new Date(restorePreview.exportTimestamp).toLocaleDateString()}</span></div>
                    <div>Total Records: <span className="text-white font-mono font-bold">{restorePreview.totalRecords}</span></div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                      Select Restoration Strategy:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRestoreMode('merge')}
                        className={`p-2 rounded border text-left text-[11px] transition ${
                          restoreMode === 'merge'
                            ? 'bg-blue-950/60 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-semibold">Merge Mode (Safe)</div>
                        <div className="text-[10px] text-slate-400">Adds new records; skips duplicate IDs</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreMode('replace')}
                        className={`p-2 rounded border text-left text-[11px] transition ${
                          restoreMode === 'replace'
                            ? 'bg-amber-950/60 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="font-semibold">Replace Mode</div>
                        <div className="text-[10px] text-slate-400">Overwrites target categories completely</div>
                      </button>
                    </div>
                  </div>

                  {restoreMode === 'replace' && (
                    <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createSafetyBackup}
                        onChange={(e) => setCreateSafetyBackup(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <span>Create automatic safety backup before overwriting</span>
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition"
                  >
                    Execute {restoreMode === 'replace' ? 'Replace' : 'Merge'} Restore
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Outcome Result Card */}
          {restoreResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                restoreResult.status === 'success'
                  ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                  : restoreResult.status === 'partial'
                  ? 'bg-amber-950/30 border-amber-800 text-amber-200'
                  : 'bg-red-950/30 border-red-800 text-red-200'
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                {restoreResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span>Restoration Status: {restoreResult.status.toUpperCase()}</span>
              </div>
              <p className="leading-relaxed opacity-90">{restoreResult.message}</p>
              {restoreResult.safetyBackupCreated && (
                <div className="text-[11px] text-emerald-400/90 font-mono">
                  • Pre-restore safety snapshot created in browser storage.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm {restoreMode === 'replace' ? 'Destructive Replace' : 'Merge'} Restore</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {restoreMode === 'replace'
                ? `You are about to overwrite current records in FinPilot AI with ${restorePreview?.totalRecords} record(s) from "${restorePreview?.entityName}". This action cannot be undone unless a safety backup is preserved.`
                : `You are about to merge ${restorePreview?.totalRecords} record(s) into your current workspace. Existing records with identical IDs will be preserved.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition"
              >
                {isProcessing ? 'Restoring...' : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
