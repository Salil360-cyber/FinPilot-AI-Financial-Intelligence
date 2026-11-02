import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Clock, ShieldCheck, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuditTrailDrawer: React.FC = () => {
  const { auditLogs } = useFinancial();

  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
            Document Ingestion Audit Trail ({auditLogs.length} Events)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically timestamped action logs for verification and compliance
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          LOCAL AUDIT LOG
        </span>
      </div>

      <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No audit actions recorded in this session yet. Upload or edit an invoice to view the trail.
          </div>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
              <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-amber-400 font-semibold uppercase">
                    {log.action.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {log.details}
                </p>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Actor: {log.actor} · ID: {log.id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
