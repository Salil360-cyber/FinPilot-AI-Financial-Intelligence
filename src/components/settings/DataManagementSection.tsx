import React, { useState } from 'react';
import {
  Database,
  Layers,
  FileText,
  Shield,
  HardDrive,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { StorageCategoryMeta } from '../../types/settings';

interface DataManagementSectionProps {
  storageCategories: StorageCategoryMeta[];
  totalFinPilotBytes: number;
  totalRecords: number;
  onRefresh: () => void;
}

export const DataManagementSection: React.FC<DataManagementSectionProps> = ({
  storageCategories,
  totalFinPilotBytes,
  totalRecords,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'with_data' | 'demo_only'>('all');

  const filtered = storageCategories.filter((cat) => {
    if (filter === 'with_data') return cat.recordCount > 0;
    if (filter === 'demo_only') return cat.hasDemoData;
    return true;
  });

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Application Data Management & Storage Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of supported financial data categories, record counts, and storage mechanisms.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Metadata</span>
        </button>
      </div>

      {/* Aggregate Storage Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total FinPilot Footprint</div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {(totalFinPilotBytes / 1024).toFixed(1)} <span className="text-xs text-slate-500 font-normal">KB</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Browser LocalStorage (Device-Local)
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Total Tracked Entities</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {totalRecords} <span className="text-xs text-slate-500 font-normal">records</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across 16 supported categories
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="text-xs text-slate-400">Active Storage Namespace</div>
          <div className="text-base font-bold font-mono text-cyan-400 mt-1 truncate">
            finpilot_*_v*
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Versioned, schema-isolated keys
          </div>
        </div>
      </div>

      {/* Category Filter Controls */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-xs text-slate-400 font-medium mr-1">Filter Categories:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All Categories ({storageCategories.length})
        </button>
        <button
          onClick={() => setFilter('with_data')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            filter === 'with_data'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Populated Only ({storageCategories.filter((c) => c.recordCount > 0).length})
        </button>
        <button
          onClick={() => setFilter('demo_only')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
            filter === 'demo_only'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Contains Demo Data ({storageCategories.filter((c) => c.hasDemoData).length})
        </button>
      </div>

      {/* Supported Categories Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Data Category</th>
              <th className="py-2.5 px-3">Module Origin</th>
              <th className="py-2.5 px-3 text-center">Records</th>
              <th className="py-2.5 px-3 text-right">Footprint</th>
              <th className="py-2.5 px-3">Provenance Status</th>
              <th className="py-2.5 px-3">Known Scope & Limitations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
            {filtered.map((cat) => (
              <tr key={cat.key} className="hover:bg-slate-900/40 transition">
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-white">{cat.categoryName}</div>
                  <div className="font-mono text-[10px] text-slate-500">{cat.key}</div>
                </td>

                <td className="py-2.5 px-3 text-slate-400">
                  {cat.moduleSource}
                </td>

                <td className="py-2.5 px-3 text-center font-mono font-medium">
                  {cat.recordCount}
                </td>

                <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                  {cat.byteSize > 0 ? `${(cat.byteSize / 1024).toFixed(1)} KB` : '0 KB'}
                </td>

                <td className="py-2.5 px-3">
                  {cat.hasDemoData && cat.hasUserData ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
                      Mixed (Demo + User)
                    </span>
                  ) : cat.hasDemoData ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                      Demo Fixtures
                    </span>
                  ) : cat.hasUserData ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      User Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-900 border border-slate-800">
                      Empty
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">
                  {cat.knownLimitations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
