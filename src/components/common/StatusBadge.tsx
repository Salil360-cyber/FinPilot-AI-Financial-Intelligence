import React from 'react';
import { TransactionStatus } from '../../types/finance';

interface StatusBadgeProps {
  status: TransactionStatus;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showDot = true }) => {
  switch (status) {
    case 'matched':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />}
          <span>Matched</span>
        </span>
      );
    case 'review_required':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />}
          <span>Review Required</span>
        </span>
      );
    case 'unmatched':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" aria-hidden="true" />}
          <span>Unmatched</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />}
          <span>Pending Clearing</span>
        </span>
      );
  }
};
