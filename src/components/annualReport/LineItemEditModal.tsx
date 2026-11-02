import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { FinancialLineItem, ReportingScale, StatementType } from '../../types/annualReport';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface LineItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FinancialLineItem | null;
  onSave: (updated: FinancialLineItem) => void;
}

export const LineItemEditModal: React.FC<LineItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [originalLabel, setOriginalLabel] = useState('');
  const [extractedValue, setExtractedValue] = useState<number>(0);
  const [reportingScale, setReportingScale] = useState<ReportingScale>('millions');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [userNotes, setUserNotes] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (item) {
      setOriginalLabel(item.originalLabel);
      setExtractedValue(item.extractedValue);
      setReportingScale(item.reportingScale);
      setPageNumber(item.pageNumber);
      setUserNotes(item.userNotes || '');
      setIsVerified(item.status === 'verified');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    let multiplier = 1;
    if (reportingScale === 'millions') multiplier = 1000000;
    else if (reportingScale === 'thousands') multiplier = 1000;
    else if (reportingScale === 'billions') multiplier = 1000000000;

    const normalizedValue = roundCurrency(extractedValue * multiplier);

    const updatedItem: FinancialLineItem = {
      ...item,
      originalLabel: originalLabel.trim() || item.originalLabel,
      extractedValue: roundCurrency(extractedValue),
      reportingScale,
      normalizedNumericValue: normalizedValue,
      pageNumber: Math.max(1, pageNumber),
      userNotes: userNotes.trim() || undefined,
      provenance: 'user_verified',
      status: isVerified ? 'verified' : 'unverified',
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: 'Financial Controller',
    };

    onSave(updatedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121929] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Review & Correct Financial Line Item</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between font-mono">
            <span className="text-slate-400">Normalized Field:</span>
            <span className="text-amber-300 font-bold">{item.normalizedKey}</span>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Reported Label in Filing</label>
            <input
              type="text"
              value={originalLabel}
              onChange={(e) => setOriginalLabel(e.target.value)}
              className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Extracted Value ({item.currency})</label>
              <input
                type="number"
                step="any"
                value={extractedValue}
                onChange={(e) => setExtractedValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Unit Scale</label>
              <select
                value={reportingScale}
                onChange={(e) => setReportingScale(e.target.value as ReportingScale)}
                className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              >
                <option value="millions">Millions (×1,000,000)</option>
                <option value="thousands">Thousands (×1,000)</option>
                <option value="billions">Billions (×1,000,000,000)</option>
                <option value="units">Exact Units (×1)</option>
                <option value="ambiguous">Ambiguous / Unresolved</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Source Page Number</label>
              <input
                type="number"
                min="1"
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-[#0b101b] border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">Mark as User-Verified</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Review Notes / Audit Remarks</label>
            <input
              type="text"
              placeholder="e.g. Cross-checked with Note 4 Segment Disclosures..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              className="w-full bg-[#0b101b] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 font-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800 bg-[#0f172a]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Save Correction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
