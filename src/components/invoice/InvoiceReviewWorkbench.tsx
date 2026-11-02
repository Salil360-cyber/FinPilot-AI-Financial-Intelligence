import React, { useState, useMemo } from 'react';
import {
  ParsedInvoice,
  ParsedLineItem,
  FieldOrigin,
  InvoiceValidationReport,
  ValidationResult,
} from '../../types/invoice';
import { validateInvoice } from '../../services/invoiceValidator';
import { useFinancial } from '../../context/FinancialContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Calculator,
  Save,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Building2,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  Eye,
  Info,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface InvoiceReviewWorkbenchProps {
  initialInvoice: ParsedInvoice;
  onClose: () => void;
  onApprovedSuccess?: (txId: string) => void;
}

export const InvoiceReviewWorkbench: React.FC<InvoiceReviewWorkbenchProps> = ({
  initialInvoice,
  onClose,
  onApprovedSuccess,
}) => {
  const { transactions, addApprovedInvoice, isInvoiceAlreadyApproved, saveDraftInvoice, addAuditLog } = useFinancial();

  const [invoice, setInvoice] = useState<ParsedInvoice>(initialInvoice);
  const [tolerance, setTolerance] = useState<number>(0.05);
  const [selectedCategory, setSelectedCategory] = useState<string>(invoice.category || 'Cloud & Infrastructure');
  const [selectedAccount, setSelectedAccount] = useState<string>(invoice.account || 'Chase Operating •••• 4092');

  const [showRawText, setShowRawText] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if this invoice is already approved in the ledger
  const dupCheck = useMemo(() => {
    return isInvoiceAlreadyApproved(invoice.vendorName.value, invoice.invoiceNumber.value);
  }, [invoice.vendorName.value, invoice.invoiceNumber.value, transactions]);

  // Run validation engine on current working state
  const validationReport: InvoiceValidationReport = useMemo(() => {
    return validateInvoice(invoice, {
      roundingTolerance: tolerance,
      existingTransactions: transactions,
    });
  }, [invoice, tolerance, transactions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Field updater
  const updateField = (fieldKey: keyof ParsedInvoice, val: any) => {
    setInvoice((prev) => {
      const currentField = prev[fieldKey] as any;
      const updated = {
        ...prev,
        [fieldKey]: {
          ...currentField,
          value: val,
          origin: 'manual' as FieldOrigin,
          isEdited: true,
        },
      };
      return updated;
    });
    addAuditLog('FIELD_EDITED', `Field "${String(fieldKey)}" updated manually to "${val}"`);
  };

  // Line item updater
  const updateLineItem = (id: string, field: keyof ParsedLineItem, val: any) => {
    setInvoice((prev) => {
      const updatedLines = prev.lineItems.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item };
        if (field === 'description' || field === 'quantity' || field === 'unitPrice' || field === 'total') {
          (updatedItem[field] as any) = {
            value: val,
            origin: 'manual' as FieldOrigin,
            isEdited: true,
          };
        }

        // Recalculate line total check
        const qty = field === 'quantity' ? val : item.quantity.value;
        const rate = field === 'unitPrice' ? val : item.unitPrice.value;
        const total = field === 'total' ? val : item.total.value;
        updatedItem.calculatedTotal = parseFloat((qty * rate).toFixed(2));
        updatedItem.isMathValid = Math.abs(updatedItem.calculatedTotal - total) <= tolerance;

        return updatedItem;
      });

      return {
        ...prev,
        lineItems: updatedLines,
      };
    });
  };

  const addLineItem = () => {
    const newItem: ParsedLineItem = {
      id: `LI-${Date.now()}`,
      description: { value: 'New Deliverable or Service Line', origin: 'manual' },
      quantity: { value: 1, origin: 'manual' },
      unitPrice: { value: 0, origin: 'manual' },
      total: { value: 0, origin: 'manual' },
      calculatedTotal: 0,
      isMathValid: true,
    };
    setInvoice((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
    addAuditLog('FIELD_EDITED', 'Added new manual line item');
  };

  const removeLineItem = (id: string) => {
    setInvoice((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.id !== id),
    }));
    addAuditLog('FIELD_EDITED', `Removed line item ${id}`);
  };

  // Recalculate totals from line items
  const handleRecalculate = () => {
    const lineItemSum = invoice.lineItems.reduce((acc, curr) => acc + curr.total.value, 0);
    const subtotal = lineItemSum > 0 ? parseFloat(lineItemSum.toFixed(2)) : invoice.subtotal.value;
    const discount = invoice.discount.value || 0;
    const taxable = Math.max(0, subtotal - discount);
    
    // If tax rate exists, compute tax
    let tax = invoice.taxAmount.value;
    if (invoice.taxRate.value !== null && invoice.taxRate.value > 0) {
      tax = parseFloat(((taxable * invoice.taxRate.value) / 100).toFixed(2));
    }
    const total = parseFloat((taxable + tax).toFixed(2));

    setInvoice((prev) => ({
      ...prev,
      subtotal: { value: subtotal, origin: 'calculated', isEdited: true },
      taxableAmount: { value: taxable, origin: 'calculated', isEdited: true },
      taxAmount: { value: tax, origin: prev.taxAmount.origin, isEdited: true },
      invoiceTotal: { value: total, origin: 'calculated', isEdited: true },
    }));

    addAuditLog('RECALCULATED', `Recalculated totals: Subtotal $${subtotal}, Tax $${tax}, Total $${total}`);
    showToast('Recalculated line items and totals against validation rules.');
  };

  const handleSaveDraft = () => {
    saveDraftInvoice({ ...invoice, category: selectedCategory, account: selectedAccount });
    showToast(`Draft for invoice "${invoice.invoiceNumber.value || 'Untitled'}" saved.`);
  };

  const handleExecuteApproval = () => {
    setApprovalError(null);
    const res = addApprovedInvoice(invoice, selectedCategory, selectedAccount);
    if (!res.success) {
      setApprovalError(res.error || 'Failed to approve invoice.');
      return;
    }

    setShowApprovalModal(false);
    showToast(`Invoice approved and posted to General Ledger as ${res.tx?.id}!`);
    if (onApprovedSuccess && res.tx) {
      onApprovedSuccess(res.tx.id);
    }
  };

  const renderOriginBadge = (origin: FieldOrigin) => {
    switch (origin) {
      case 'extracted':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Extracted directly from document text">
            Extracted
          </span>
        );
      case 'calculated':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Calculated by FinPilot arithmetic rules">
            Calculated
          </span>
        );
      case 'manual':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20" title="Entered or modified manually by user">
            Manual
          </span>
        );
      case 'not_found':
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Not detected in document; requires manual entry">
            Not Found
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Invoice Review: {invoice.invoiceNumber.value || '(Unnamed Invoice)'}
                </h1>
                <span className="text-xs font-mono text-slate-400">·</span>
                <span className="text-xs font-mono text-slate-300">
                  {invoice.vendorName.value || 'Unidentified Vendor'}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Method: {invoice.extractionMethod}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Source File: <strong className="text-slate-300 font-mono">{invoice.fileName}</strong> ({(invoice.fileSize / 1024).toFixed(1)} KB) · Extracted {invoice.pageCount} page(s)
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{showRawText ? 'Hide Document Text' : 'View Document Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleRecalculate}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5"
              title="Recalculate sums and re-run all validation rules"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Recalculate</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              disabled={!validationReport.canApprove || dupCheck.isApproved}
              onClick={() => setShowApprovalModal(true)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${
                !validationReport.canApprove || dupCheck.isApproved
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400/50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{dupCheck.isApproved ? 'Already Approved' : 'Approve Invoice'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-400 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Duplicate warning banner if already approved */}
        {dupCheck.isApproved && (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Double Approval Prevented:</strong> This invoice ({invoice.invoiceNumber.value}) has already been posted to the General Ledger as <strong>{dupCheck.txId}</strong>.
              </span>
            </div>
            <span className="font-mono text-[11px] text-amber-400/90">LOCKED</span>
          </div>
        )}
      </div>

      {/* Raw Extracted Text Drawer */}
      {showRawText && (
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 font-mono">Original Document Text Layer</span>
            <button
              type="button"
              onClick={() => setShowRawText(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed">
            {invoice.rawText || '(No text extracted from document)'}
          </pre>
        </div>
      )}

      {/* 2-Column Split: Left = Editable Header & Line Items; Right = Totals & Validation Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Extracted Metadata & Line Items */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Fields Form */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Invoice Header & Entity Data
              </h2>
              <span className="text-[11px] text-slate-400">Editable for OCR Corrections</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Vendor Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Vendor Name</label>
                  {renderOriginBadge(invoice.vendorName.origin)}
                </div>
                <input
                  type="text"
                  value={invoice.vendorName.value}
                  onChange={(e) => updateField('vendorName', e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none ${
                    !invoice.vendorName.value ? 'border-rose-700 bg-rose-950/20' : 'border-slate-800 focus:border-amber-400/60'
                  }`}
                />
              </div>

              {/* Invoice Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Invoice # / ID</label>
                  {renderOriginBadge(invoice.invoiceNumber.origin)}
                </div>
                <input
                  type="text"
                  value={invoice.invoiceNumber.value}
                  onChange={(e) => updateField('invoiceNumber', e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2 font-mono text-white text-xs focus:outline-none ${
                    !invoice.invoiceNumber.value ? 'border-rose-700 bg-rose-950/20' : 'border-slate-800 focus:border-amber-400/60'
                  }`}
                />
              </div>

              {/* Currency */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Currency</label>
                  {renderOriginBadge(invoice.currency.origin)}
                </div>
                <select
                  value={invoice.currency.value}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-amber-400/60"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>

              {/* Invoice Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Invoice Date</label>
                  {renderOriginBadge(invoice.invoiceDate.origin)}
                </div>
                <input
                  type="date"
                  value={invoice.invoiceDate.value}
                  onChange={(e) => updateField('invoiceDate', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Due Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Due Date</label>
                  {renderOriginBadge(invoice.dueDate.origin)}
                </div>
                <input
                  type="date"
                  value={invoice.dueDate.value}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>

              {/* Customer Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[11px] text-slate-400 uppercase">Customer / Billed To</label>
                  {renderOriginBadge(invoice.customerName.origin)}
                </div>
                <input
                  type="text"
                  value={invoice.customerName.value}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="e.g. Meridian Dynamics Corp"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400/60"
                />
              </div>
            </div>

            {/* Vendor Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[11px] text-slate-400 uppercase">Vendor Address / Remit Location</label>
                {renderOriginBadge(invoice.vendorAddress.origin)}
              </div>
              <input
                type="text"
                value={invoice.vendorAddress.value}
                onChange={(e) => updateField('vendorAddress', e.target.value)}
                placeholder="e.g. P.O. Box 84023, Seattle, WA"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Extracted Line Items ({invoice.lineItems.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quantity × Unit Price = Line Total cross-check enforced
                </p>
              </div>

              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {invoice.lineItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-lg border border-dashed border-slate-800 text-slate-400 text-xs">
                No itemized line items detected. You can add items manually or verify using summary totals.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-y border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-2 text-right w-20">Qty</th>
                      <th className="py-2.5 px-2 text-right w-28">Unit Price</th>
                      <th className="py-2.5 px-3 text-right w-32">Line Total</th>
                      <th className="py-2.5 px-2 text-center w-24">Math Check</th>
                      <th className="py-2.5 px-2 text-right w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {invoice.lineItems.map((li) => (
                      <tr key={li.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={li.description.value}
                            onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-sans"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="any"
                            value={li.quantity.value}
                            onChange={(e) => updateLineItem(li.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 text-xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={li.unitPrice.value}
                            onChange={(e) => updateLineItem(li.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={li.total.value}
                            onChange={(e) => updateLineItem(li.id, 'total', parseFloat(e.target.value) || 0)}
                            className={`w-full bg-slate-900 border rounded px-2 py-1 text-right font-semibold text-xs ${
                              !li.isMathValid ? 'border-rose-700 text-rose-300' : 'border-slate-800 text-white'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {li.isMathValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400" title={`Matches Qty × Rate: $${li.calculatedTotal.toFixed(2)}`}>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400" title={`Expected $${li.calculatedTotal.toFixed(2)}`}>
                              <AlertCircle className="w-3 h-3" />
                              <span>Mismatch</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeLineItem(li.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Line Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Totals & Validation Checklist */}
        <div className="lg:col-span-4 space-y-6">
          {/* Financial Totals Panel */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                Financial Totals & Tax
              </h2>
              <span className="text-xs font-mono text-slate-400">{invoice.currency.value}</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Subtotal */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-mono text-[11px]">Subtotal</label>
                  {renderOriginBadge(invoice.subtotal.origin)}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.subtotal.value}
                    onChange={(e) => updateField('subtotal', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 font-mono text-right text-white text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-mono text-[11px]">Discount</label>
                  {renderOriginBadge(invoice.discount.origin)}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.discount.value}
                    onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 font-mono text-right text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              {/* Tax Amount & Rate */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-mono text-[11px]">Tax Amount</label>
                    {renderOriginBadge(invoice.taxAmount.origin)}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={invoice.taxAmount.value}
                      onChange={(e) => updateField('taxAmount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 font-mono text-right text-white text-xs focus:outline-none focus:border-amber-400/60"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-mono text-[11px]">Tax Rate (%)</label>
                    {renderOriginBadge(invoice.taxRate.origin)}
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.taxRate.value !== null ? invoice.taxRate.value : ''}
                    placeholder="e.g. 5.0"
                    onChange={(e) => updateField('taxRate', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-right text-slate-300 text-xs focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              {/* Invoice Grand Total */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold text-white font-mono">Invoice Grand Total</label>
                  {renderOriginBadge(invoice.invoiceTotal.origin)}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={invoice.invoiceTotal.value}
                    onChange={(e) => updateField('invoiceTotal', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg pl-7 pr-3 py-2 font-mono font-bold text-right text-amber-300 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Validation Checklist Panel */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                  Validation Engine
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    validationReport.overallValid
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                  }`}
                >
                  {validationReport.passCount} / {validationReport.results.length} PASSED
                </span>
              </div>
            </div>

            {/* Check Results List */}
            <div className="space-y-2">
              {validationReport.results.map((res: ValidationResult) => (
                <div
                  key={res.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    res.status === 'passed'
                      ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                      : res.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-800/50 text-amber-200'
                      : res.status === 'failed'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[11px] truncate">{res.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase shrink-0 ${
                        res.status === 'passed'
                          ? 'text-emerald-400'
                          : res.status === 'warning'
                          ? 'text-amber-400'
                          : 'text-rose-400 font-bold'
                      }`}
                    >
                      {res.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    {res.reason}
                  </p>

                  {res.formula && (
                    <div className="text-[10px] font-mono text-slate-400 pt-0.5 border-t border-slate-800/60">
                      {res.formula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title="Confirm Invoice Approval & Ledger Entry"
          subtitle="Post verified invoice directly to General Ledger"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Vendor:</span>
                <span className="text-white font-semibold">{invoice.vendorName.value}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Invoice Identifier:</span>
                <span className="font-mono text-white font-semibold">{invoice.invoiceNumber.value}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Date of Record:</span>
                <span className="font-mono text-slate-200">{invoice.invoiceDate.value || 'Today'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">Posting Amount:</span>
                <span className="font-mono font-bold text-amber-400">
                  ${invoice.invoiceTotal.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency.value}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px] uppercase">Cost Center / Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Software & Subscriptions">Software & Subscriptions</option>
                  <option value="Facilities & Ops">Facilities & Ops</option>
                  <option value="Marketing & Acquisition">Marketing & Acquisition</option>
                  <option value="Payroll & Personnel">Payroll & Personnel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px] uppercase">Disbursement Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  <option value="Chase Operating •••• 4092">Chase Operating •••• 4092</option>
                  <option value="Silicon Valley Commercial •••• 8810">Silicon Valley Commercial •••• 8810</option>
                  <option value="Amex Corporate •••• 3004">Amex Corporate •••• 3004</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px] leading-relaxed">
              <span className="font-semibold block mb-0.5">Audit Trail Commitment:</span>
              This explicit approval will generate an immutable General Ledger transaction voucher and link the extraction metadata. Double approvals of this invoice number will be permanently blocked.
            </div>

            {approvalError && (
              <div className="p-3 bg-rose-950 border border-rose-800 rounded-lg text-rose-300 text-xs">
                {approvalError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
              >
                Back to Review
              </button>
              <button
                type="button"
                onClick={handleExecuteApproval}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Post to Ledger</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
