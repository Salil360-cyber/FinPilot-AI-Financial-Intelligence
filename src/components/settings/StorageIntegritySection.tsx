import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  Server,
} from 'lucide-react';
import { StorageCategoryMeta } from '../../types/settings';

interface StorageIntegritySectionProps {
  storageCategories: StorageCategoryMeta[];
  totalFinPilotBytes: number;
  onRefresh: () => void;
}

export const StorageIntegritySection: React.FC<StorageIntegritySectionProps> = ({
  storageCategories,
  totalFinPilotBytes,
  onRefresh,
}) => {
  const [browserEstimate, setBrowserEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then((est) => {
          if (est.usage !== undefined && est.quota !== undefined) {
            setBrowserEstimate({ usage: est.usage, quota: est.quota });
          }
        })
        .catch(() => {
          // Ignore
        });
    }
  }, []);

  const corruptedCount = storageCategories.filter((c) => c.status === 'corrupted').length;
  const validCount = storageCategories.filter((c) => c.status === 'valid').length;

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Storage Footprint & Integrity Verification
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time diagnostics of browser localStorage allocation, quota estimation, and syntax integrity.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Scan Storage Health</span>
        </button>
      </div>

      {/* Storage Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">FinPilot AI Local Footprint</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {(totalFinPilotBytes / 1024).toFixed(1)} <span className="text-xs text-slate-500 font-normal">KB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Approx. {((totalFinPilotBytes / (5 * 1024 * 1024)) * 100).toFixed(2)}% of standard 5MB quota
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Origin Storage Usage</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {browserEstimate
              ? `${(browserEstimate.usage / (1024 * 1024)).toFixed(1)} MB`
              : 'Estimating...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {browserEstimate
              ? `Max Available Quota: ${(browserEstimate.quota / (1024 * 1024 * 1024)).toFixed(1)} GB`
              : 'Browser Storage API estimate'}
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">JSON Syntax Integrity</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
            {corruptedCount === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Valid</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">{corruptedCount} Corrupted</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {validCount} verified parsing states
          </div>
        </div>
      </div>

      {/* Storage Architecture Limitations Disclosure */}
      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/70 text-xs text-slate-400 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Storage Persistence Architecture & Boundaries</span>
        </div>
        <p>
          FinPilot AI utilizes HTML5 <span className="font-mono text-slate-300">localStorage</span> for client-side
          state isolation. All accounting entries remain inside your browser sandbox on this machine.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
          <li>Data is persistent across browser tabs and browser restarts.</li>
          <li>Clearing browser history or site data will purge locally stored records.</li>
          <li>Private/Incognito browsing sessions run in isolated sandboxes that vanish on tab close.</li>
          <li>Always generate regular JSON backups via the Backup & Restore center before clearing cache.</li>
        </ul>
      </div>
    </div>
  );
};
