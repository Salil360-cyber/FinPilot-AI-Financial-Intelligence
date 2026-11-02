import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import {
  resetPreferencesToDefault,
  removeDemoDataOnly,
  executeGlobalDataReset,
  generateFullBackupArtifact,
} from '../../services/dataManagementEngine';

interface ResetDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshStorage: () => void;
  onToast: (msg: string) => void;
}

export const ResetDeleteModal: React.FC<ResetDeleteModalProps> = ({
  isOpen,
  onClose,
  onRefreshStorage,
  onToast,
}) => {
  const [activeAction, setActiveAction] = useState<'preferences' | 'demo' | 'global'>('preferences');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSafetyBackup = () => {
    try {
      const artifact = generateFullBackupArtifact('Safety_Pre_Reset');
      const jsonString = JSON.stringify(artifact, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FinPilot_Safety_Pre_Reset_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast('Safety backup downloaded');
    } catch (err: any) {
      onToast(`Failed to generate safety backup: ${err.message}`);
    }
  };

  const handleExecute = () => {
    setIsProcessing(true);

    if (activeAction === 'preferences') {
      const res = resetPreferencesToDefault();
      setIsProcessing(false);
      onRefreshStorage();
      onToast(res.message);
      onClose();
    } else if (activeAction === 'demo') {
      const res = removeDemoDataOnly();
      setIsProcessing(false);
      onRefreshStorage();
      onToast(`Removed ${res.demoRecordsRemoved} demo fixtures. Preserved ${res.userRecordsPreserved} user records.`);
      onClose();
    } else if (activeAction === 'global') {
      if (confirmationInput !== 'CONFIRM RESET') {
        setIsProcessing(false);
        onToast('Please type "CONFIRM RESET" exactly to proceed.');
        return;
      }
      const res = executeGlobalDataReset();
      setIsProcessing(false);
      onRefreshStorage();
      onToast(`Global reset complete: ${res.clearedKeys.length} FinPilot storage keys cleared. Unrelated storage preserved.`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Reset & Deletion Governance</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveAction('preferences')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              activeAction === 'preferences'
                ? 'bg-blue-950/60 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold">Reset Prefs</div>
            <div className="text-[10px] text-slate-500">Restore UI defaults</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('demo')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              activeAction === 'demo'
                ? 'bg-purple-950/60 border-purple-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold">Clean Demo Data</div>
            <div className="text-[10px] text-slate-500">Keep real user entries</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('global')}
            className={`p-2.5 rounded-lg border text-left text-xs transition ${
              activeAction === 'global'
                ? 'bg-rose-950/60 border-rose-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-rose-400">Global Reset</div>
            <div className="text-[10px] text-slate-500">Wipe all FinPilot keys</div>
          </button>
        </div>

        {/* Description Body */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
          {activeAction === 'preferences' && (
            <p>
              Restores Company Profile, date/number formats, and financial display preferences back to original
              factory defaults. <strong>No accounting records, invoices, or transactions are altered.</strong>
            </p>
          )}

          {activeAction === 'demo' && (
            <p>
              Scans all active modules and removes only sample records tagged as demonstration fixtures
              (<span className="font-mono text-purple-400">source: demo</span>).{' '}
              <strong>Your real imported invoices and ledger transactions are strictly preserved.</strong>
            </p>
          )}

          {activeAction === 'global' && (
            <div className="space-y-3">
              <p className="text-rose-300">
                <strong>Destructive Action:</strong> This will permanently delete all FinPilot AI records from this
                browser, including General Ledger transactions, invoices, bank reconciliation sessions, and reports.
                Unrelated website storage will not be touched.
              </p>

              <div>
                <label className="block text-slate-400 text-[11px] font-medium mb-1">
                  Type <span className="font-mono text-white font-bold">CONFIRM RESET</span> to verify:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="CONFIRM RESET"
                  className="w-full bg-slate-950 border border-rose-800/80 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSafetyBackup}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Safety Backup First (Recommended)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isProcessing || (activeAction === 'global' && confirmationInput !== 'CONFIRM RESET')}
            className={`px-4 py-2 font-semibold text-xs rounded-lg transition disabled:opacity-50 ${
              activeAction === 'global'
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isProcessing ? 'Executing...' : 'Execute Selected Operation'}
          </button>
        </div>
      </div>
    </div>
  );
};
