import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Edit3,
  Download,
  Filter,
} from 'lucide-react';
import { AdvisoryRecommendation, ActionStatus, AdvisorySeverity } from '../../types/advisory';

interface RecommendedActionsSectionProps {
  recommendations: AdvisoryRecommendation[];
  onUpdateStatus: (recId: string, newStatus: ActionStatus) => void;
  onUpdateNotes: (recId: string, notes: string) => void;
  onExportCsv: () => void;
}

export const RecommendedActionsSection: React.FC<RecommendedActionsSectionProps> = ({
  recommendations,
  onUpdateStatus,
  onUpdateNotes,
  onExportCsv,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | ActionStatus>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const filtered = recommendations.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const handleStartEditNotes = (rec: AdvisoryRecommendation) => {
    setEditingNotesId(rec.id);
    setTempNotes(rec.userNotes || '');
  };

  const handleSaveNotes = (recId: string) => {
    onUpdateNotes(recId, tempNotes);
    setEditingNotesId(null);
  };

  const statusOptions: { id: ActionStatus; label: string; color: string }[] = [
    { id: 'suggested', label: 'Suggested', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'in_review', label: 'In Review', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'accepted', label: 'Accepted', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
    { id: 'completed', label: 'Completed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { id: 'dismissed', label: 'Dismissed', color: 'text-slate-400 bg-slate-800 border-slate-700' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Prioritized Action Board ({filtered.length} of {recommendations.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational steps recommended from verified evidence. Status updates are local and do not modify underlying accounting ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({recommendations.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('suggested')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'suggested'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Suggested
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('in_review')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'in_review'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In Review
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export Plan
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
          No recommendations in the "{filterStatus}" state. Select another filter above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((rec) => {
            return (
              <div
                key={rec.id}
                className="bg-[#121929] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        rec.priority === 'high_priority'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {rec.priority.replace('_', ' ')}
                    </span>

                    {/* Status Selector Dropdown */}
                    <select
                      value={rec.status}
                      onChange={(e) => onUpdateStatus(rec.id, e.target.value as ActionStatus)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-mono focus:outline-hidden focus:border-amber-500/50"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          Status: {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    {rec.title}
                  </h3>

                  <div className="text-xs text-slate-300 space-y-1 leading-relaxed">
                    <p>
                      <strong className="text-slate-400">Target Objective:</strong> {rec.expectedObjective}
                    </p>
                    <p>
                      <strong className="text-slate-400">Suggested Action:</strong> {rec.suggestedNextStep}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>
                      <strong className="text-slate-500">Supporting Evidence:</strong> {rec.supportingEvidence}
                    </div>
                    {rec.dataLimitations && (
                      <div className="text-slate-500 text-[10px]">
                        <strong>Limitations:</strong> {rec.dataLimitations}
                      </div>
                    )}
                  </div>

                  {/* User Notes Block */}
                  {editingNotesId === rec.id ? (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <textarea
                        rows={2}
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Add management context or assignment notes..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500/50"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(rec.id)}
                          className="px-2.5 py-1 text-xs bg-amber-500 text-slate-950 font-semibold rounded hover:bg-amber-400"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                      <div className="text-slate-400">
                        {rec.userNotes ? (
                          <span>
                            <strong className="text-slate-300">Notes:</strong> {rec.userNotes}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No user notes recorded.</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditNotes(rec)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                        {rec.userNotes ? 'Edit' : 'Add Note'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  <span className="capitalize">{rec.category.replace('_', ' ')}</span>
                  <span>Updated {new Date(rec.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
