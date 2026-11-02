import React, { useState } from 'react';
import {
  FileSearch,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Play,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { InvoiceUploader } from '../components/invoice/InvoiceUploader';
import { InvoiceReviewWorkbench } from '../components/invoice/InvoiceReviewWorkbench';
import { Phase2TestSuite } from '../components/invoice/Phase2TestSuite';
import { AuditTrailDrawer } from '../components/invoice/AuditTrailDrawer';
import { ParsedInvoice } from '../types/invoice';

export const InvoiceIntelligence: React.FC = () => {
  const { drafts, deleteDraftInvoice, addAuditLog, activeUploadInvoice, setActiveUploadInvoice } = useFinancial();

  const [activeTab, setActiveTab] = useState<'upload' | 'tests' | 'drafts' | 'audit'>('upload');
  const [successTxId, setSuccessTxId] = useState<string | null>(null);

  const handleInvoiceParsed = (invoice: ParsedInvoice) => {
    setActiveUploadInvoice(invoice);
    setSuccessTxId(null);
  };

  const handleCloseWorkbench = () => {
    setActiveUploadInvoice(null);
  };

  const handleApprovedSuccess = (txId: string) => {
    setSuccessTxId(txId);
    setActiveUploadInvoice(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">Invoice Intelligence</h1>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              PHASE 2 FUNCTIONAL
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Upload text-based PDFs or image invoices to extract, mathematically validate, and approve financial vouchers.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
            }}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'upload' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload & Ingestion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'drafts' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Drafts</span>
            {drafts.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center justify-center">
                {drafts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'tests' ? 'bg-slate-800 text-amber-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3 h-3 text-amber-400" />
            <span>Test Suite (10 Tests)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'audit' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Success Banner if an invoice was recently approved */}
      {successTxId && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/80 rounded-xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-100">Invoice Approved and Posted:</span>
              <p className="text-emerald-300/80 text-[11px] mt-0.5">
                Voucher <strong className="font-mono text-emerald-200">{successTxId}</strong> is now recorded in the Expense Ledger and General Ledger aggregates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessTxId(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Content Based on State */}
      {activeUploadInvoice ? (
        <InvoiceReviewWorkbench
          initialInvoice={activeUploadInvoice}
          onClose={handleCloseWorkbench}
          onApprovedSuccess={handleApprovedSuccess}
        />
      ) : activeTab === 'upload' ? (
        <InvoiceUploader
          onInvoiceParsed={handleInvoiceParsed}
          onAddAuditLog={addAuditLog}
        />
      ) : activeTab === 'drafts' ? (
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Unapproved Invoice Drafts ({drafts.length})</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Locally saved invoices pending reconciliation or additional review
              </p>
            </div>
          </div>

          {drafts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-900/40 rounded-lg border border-dashed border-slate-800">
              No saved drafts found. Upload or review an invoice and click "Save Draft" to preserve your session.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {drafts.map((d) => (
                <div key={d.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-white text-xs">
                        {d.invoiceNumber.value || 'Untitled Draft'}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300 text-xs">{d.vendorName.value || 'Unspecified Vendor'}</span>
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                        {d.fileName}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Total: ${d.invoiceTotal.value.toFixed(2)} · Extracted via {d.extractionMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveUploadInvoice(d);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
                    >
                      Resume Review →
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDraftInvoice(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Discard Draft"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'tests' ? (
        <Phase2TestSuite />
      ) : (
        <AuditTrailDrawer />
      )}
    </div>
  );
};
