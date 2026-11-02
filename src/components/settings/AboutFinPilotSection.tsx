import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Building,
  Layers,
  HeartHandshake,
} from 'lucide-react';

export const AboutFinPilotSection: React.FC = () => {
  const phases = [
    { num: 'Phase 1', name: 'Overview & Enterprise Architecture', status: 'Active' },
    { num: 'Phase 2', name: 'Invoice Intelligence & Client-side OCR (Tesseract / PDF.js)', status: 'Active' },
    { num: 'Phase 3', name: 'Expense Management & Double-Entry General Ledger', status: 'Active' },
    { num: 'Phase 4', name: 'Smart Invoice Generator & Accounts Receivable', status: 'Active' },
    { num: 'Phase 5', name: 'Bank Reconciliation & Multi-Tier Transaction Matching', status: 'Active' },
    { num: 'Phase 6', name: 'Financial Analytics & Deterministic Ratio Calculator', status: 'Active' },
    { num: 'Phase 7', name: 'Revenue Forecasting & Scenario Planning Engine', status: 'Active' },
    { num: 'Phase 8', name: 'Annual Report Intelligence & 10-K Statutory Ratios', status: 'Active' },
    { num: 'Phase 9', name: 'AI Financial Advisory & Grounded Health Signals', status: 'Active' },
    { num: 'Phase 10', name: 'Executive Reports & Multi-Tier Provenance Reporting', status: 'Active' },
    { num: 'Phase 11', name: 'Settings, Data Management & System Administration', status: 'Active' },
    { num: 'Phase 12', name: 'User Onboarding, Help Center & Workflow Guidance', status: 'Active' },
  ];

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              v12.0.0 Production Architecture
            </span>
          </div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            About FinPilot AI — Enterprise Financial Engine
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Client-side autonomous financial intelligence system engineered strictly with free and open-source tooling.
          </p>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2">
        <div className="font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zero Paid API & Local-First Philosophy</span>
        </div>
        <p className="text-slate-400">
          FinPilot AI is built upon the principle that robust, enterprise-grade accounting and financial intelligence
          should operate deterministically without mandatory paid API subscriptions, cloud vendor lock-in, or hidden
          telemetry. All calculations are traceable directly to underlying general ledger and bank source records.
        </p>
      </div>

      {/* Completed Capabilities Matrix */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Completed Phase Capabilities (11 Modules)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {phases.map((p) => (
            <div
              key={p.num}
              className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-mono text-[10px] text-slate-500 mr-1.5">{p.num}</span>
                  <span className="text-slate-200 font-medium">{p.name}</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 shrink-0">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
