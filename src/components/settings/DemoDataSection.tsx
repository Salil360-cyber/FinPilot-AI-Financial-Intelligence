import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { StorageCategoryMeta } from '../../types/settings';
import { removeDemoDataOnly } from '../../services/dataManagementEngine';

interface DemoDataSectionProps {
  storageCategories: StorageCategoryMeta[];
  onResetToDemoData: () => void;
  onRefreshStorage: () => void;
  onToast: (msg: string) => void;
}

export const DemoDataSection: React.FC<DemoDataSectionProps> = ({
  storageCategories,
  onResetToDemoData,
  onRefreshStorage,
  onToast,
}) => {
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [lastCleanResult, setLastCleanResult] = useState<{
    demoRemoved: number;
    userPreserved: number;
    affected: string[];
  } | null>(null);

  const demoCategories = storageCategories.filter((c) => c.hasDemoData);
  const totalDemoDetected = demoCategories.reduce((acc, c) => acc + c.recordCount, 0);

  const handleCleanDemoData = () => {
    setShowCleanModal(false);
    const result = removeDemoDataOnly();
    setLastCleanResult({
      demoRemoved: result.demoRecordsRemoved,
      userPreserved: result.userRecordsPreserved,
      affected: result.affectedCategories,
    });
    onRefreshStorage();
    onToast(`Cleaned ${result.demoRecordsRemoved} demo fixtures. Preserved ${result.userRecordsPreserved} user records.`);
  };

  const handleConfirmReinitialize = () => {
    setShowResetModal(false);
    onResetToDemoData();
    onRefreshStorage();
    onToast('Demo data reinitialized across all modules.');
  };

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Demonstration Data Lifecycle Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely strip demonstration fixtures without touching real financial records, or reset to factory demo state.
          </p>
        </div>
      </div>

      {/* Demo Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Demo Records Detected</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {totalDemoDetected}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {demoCategories.length} active module(s)
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Provenance Isolation Status</div>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>Strict Tagged Provenance</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Records explicitly tagged with source: demo
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Production Readiness</div>
          <div className="text-base font-bold text-slate-200 mt-1">
            {totalDemoDetected > 0 ? 'Demo Data Active' : 'Pure User Records'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalDemoDetected > 0 ? 'Clean demo data before external audit' : 'Ready for executive signoff'}
          </div>
        </div>
      </div>

      {/* Modules with Demo Data */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Modules Containing Demonstration Fixtures
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Phase 1–3 General Ledger</span>
              <span className="font-mono text-purple-400">12 demo entries</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Vendors: AWS Cloud Hosting, WeWork Lease, Apex Legal, Global Logistics.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Phase 4 Smart Invoice Generator</span>
              <span className="font-mono text-purple-400">5 demo invoices</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Clients: Acme Global Corp, Zenith Tech Solutions, Apex Retail.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Phase 5 Bank Reconciliation</span>
              <span className="font-mono text-purple-400">3 accounts • 2 sessions</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Accounts: Chase Operating, Silicon Valley Treasury, Stripe Clearing.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Phase 8 Annual Report Intelligence</span>
              <span className="font-mono text-purple-400">1 statutory 10-K filing</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Filing: Meridian Dynamics Corp FY2025 (PricewaterhouseCoopers audit).
            </p>
          </div>
        </div>
      </div>

      {/* Safety Cleanup Report */}
      {lastCleanResult && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-800 rounded-xl text-xs text-emerald-200 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Demo Cleanup Execution Completed</span>
          </div>
          <div>Removed: <span className="font-mono font-bold text-white">{lastCleanResult.demoRemoved}</span> demo fixtures.</div>
          <div>User Records Preserved: <span className="font-mono font-bold text-white">{lastCleanResult.userPreserved}</span> authentic entries.</div>
          <div className="text-[11px] text-emerald-400">
            Affected categories: {lastCleanResult.affected.join(', ') || 'None'}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400">
          Cleaned data can be re-populated anytime via reinitialization.
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowCleanModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Demo Data Only (Preserve User Data)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reinitialize Factory Demo Data</span>
          </button>
        </div>
      </div>

      {/* Clean Demo Data Confirmation Modal */}
      {showCleanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Confirm Demo Data Cleanup</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action scans all financial categories and deletes <strong>ONLY</strong> demonstration records tagged
              with <span className="font-mono text-purple-400">source: demo</span>. Your authentic uploaded invoices,
              manual journal entries, and custom forecast models will be <strong>strictly preserved</strong>.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCleanModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanDemoData}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Clean Demo Fixtures
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reinitialize Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <RotateCcw className="w-5 h-5" />
              <span>Confirm Demo Reinitialization</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This operation restores standard demonstration fixtures across General Ledger, Sales Invoices, Bank
              Accounts, and Annual Reports. User-entered records will remain alongside the demo items.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReinitialize}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition"
              >
                Reinitialize Demo Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
