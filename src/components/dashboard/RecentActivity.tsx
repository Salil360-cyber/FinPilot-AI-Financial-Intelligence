import React from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { FileText, RefreshCw, AlertCircle, FileCheck, CreditCard } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { recentActivities } = useFinancial();
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'reconciliation':
        return <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ledger':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'report':
        return <FileCheck className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Audit & Ingestion Activity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of automated and user-verified financial events
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">Activity Log</span>
      </div>

      <div className="space-y-4 mt-4">
        {recentActivities.slice(0, 6).map((act) => (
          <div key={act.id} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
              {getEventIcon(act.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-200 truncate">
                  {act.title}
                </h4>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {act.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {act.description}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                <span>Actor: {act.user}</span>
                <span>·</span>
                <span
                  className={
                    act.status === 'completed'
                      ? 'text-emerald-400'
                      : act.status === 'flagged'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }
                >
                  {act.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
