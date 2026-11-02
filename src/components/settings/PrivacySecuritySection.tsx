import React from 'react';
import {
  Shield,
  Lock,
  Eye,
  Key,
  Server,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const PrivacySecuritySection: React.FC = () => {
  const [isConfigured, setIsConfigured] = React.useState<boolean>(false);
  const [statusLoaded, setStatusLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetch('/api/gemini/status')
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(Boolean(data?.configured));
        setStatusLoaded(true);
      })
      .catch(() => {
        setIsConfigured(false);
        setStatusLoaded(true);
      });
  }, []);

  const maskedKey = isConfigured
    ? 'Configured (Server-Side Managed in Settings > Secrets)'
    : statusLoaded
    ? 'Not Configured (Deterministic Local Heuristics Active)'
    : 'Checking Server Configuration...';

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Privacy, Security & System Architecture Information
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent disclosure of data residency, client-side processing boundaries, and API credential management.
          </p>
        </div>
      </div>

      {/* Security Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Architecture 1: Local-First Processing */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Local-First In-Browser Computation</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            All primary financial operations execute strictly within your local browser JavaScript runtime:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
            <li>General Ledger double-entry validation</li>
            <li>Accounts Receivable aging calculations and DSO formulas</li>
            <li>Bank statement parsing and automated transaction matching</li>
            <li>Revenue trendline forecasting and scenario sensitivity modeling</li>
            <li>PDF/Image invoice OCR using local WebAssembly workers (PDF.js / Tesseract.js)</li>
          </ul>
        </div>

        {/* Architecture 2: External AI Gateway */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Server className="w-4 h-4 text-blue-400" />
            <span>External AI Gateway (Optional)</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            When generating grounded executive commentary or advisory summaries:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
            <li>Only high-level aggregated financial totals are transmitted to Google GenAI.</li>
            <li>Raw bank logins, card credentials, or individual tax filings are never sent.</li>
            <li>If offline or no API key is provided, the engine automatically uses deterministic financial heuristics.</li>
            <li>Zero telemetry or unsolicited analytics tracking.</li>
          </ul>
        </div>
      </div>

      {/* API Key Security Audit */}
      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Google GenAI API Key Configuration Status</span>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
              isConfigured
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isConfigured ? 'Configured & Active' : 'Offline / Heuristic Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-medium">Provider Environment Status</div>
            <div className="font-mono text-slate-200 mt-1 truncate">{maskedKey}</div>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-medium">Backup Sanitization Policy</div>
            <div className="text-slate-200 mt-1 flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>API keys are strictly omitted from JSON backups</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          For enterprise deployments, ensure all production API keys are injected server-side via process environment
          variables rather than client-exposed bundles.
        </p>
      </div>
    </div>
  );
};
