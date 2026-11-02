import React from 'react';
import { SalesInvoice } from '../../types/salesInvoice';
import { exportSalesInvoiceToCsv } from './SalesInvoiceExport';
import {
  Printer,
  Download,
  CreditCard,
  XCircle,
  Copy,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface SalesInvoicePreviewProps {
  invoice: SalesInvoice;
  onClose: () => void;
  onEdit?: (invoice: SalesInvoice) => void;
  onIssue?: (invoiceId: string) => void;
  onRecordPayment?: (invoice: SalesInvoice) => void;
  onCancel?: (invoice: SalesInvoice) => void;
  onDuplicate?: (invoiceId: string) => void;
}

export const SalesInvoicePreview: React.FC<SalesInvoicePreviewProps> = ({
  invoice,
  onClose,
  onEdit,
  onIssue,
  onRecordPayment,
  onCancel,
  onDuplicate,
}) => {
  const isDraft = invoice.status === 'draft';
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';
  const isPartiallyPaid = invoice.status === 'partially_paid';
  const isCancelled = invoice.status === 'cancelled';

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PAID IN FULL</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>PARTIALLY PAID</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>OVERDUE</span>
          </span>
        );
      case 'issued':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>ISSUED / UNPAID</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>VOID / CANCELLED</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            <span>DRAFT INVOICE</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title="Return to Invoice Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white font-mono">{invoice.invoiceNumber}</h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer: <span className="text-slate-200">{invoice.customer.customerName}</span> · Currency: <span className="font-mono text-amber-400">{invoice.currency}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
            title="Print invoice or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={() => exportSalesInvoiceToCsv(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          {/* Duplicate */}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(invoice.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
            >
              <Copy className="w-3.5 h-3.5 text-purple-400" />
              <span>Duplicate</span>
            </button>
          )}

          {/* Draft Actions: Edit & Issue */}
          {isDraft && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Draft</span>
            </button>
          )}

          {isDraft && onIssue && (
            <button
              type="button"
              onClick={() => onIssue(invoice.id)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Issue Invoice</span>
            </button>
          )}

          {/* Issued Actions: Record Payment & Cancel */}
          {!isDraft && !isCancelled && onRecordPayment && (
            <button
              type="button"
              onClick={() => onRecordPayment(invoice)}
              disabled={isPaid}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          {!isDraft && !isCancelled && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(invoice)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 text-xs font-medium rounded-lg transition-colors shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Browser Print-to-PDF Instruction Banner (Hidden in Print) */}
      <div className="no-print bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Free Client-Side PDF Generation:</strong> Click "Print / Save as PDF" above and select <em>"Save as PDF"</em> in your browser's print destination. The document contains dedicated CSS print styles that automatically format pages with vector typography and zero application UI headers.
        </div>
      </div>

      {/* Printable Invoice Sheet Container */}
      <div className="invoice-print-sheet bg-[#0e1422] border border-slate-800 text-slate-100 rounded-2xl p-8 sm:p-12 shadow-2xl max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                {invoice.seller.companyName}
              </h1>
            </div>
            <div className="text-xs text-slate-400 space-y-0.5 leading-relaxed font-sans">
              <p>{invoice.seller.address}</p>
              <p>Email: {invoice.seller.email} · Phone: {invoice.seller.phone}</p>
              {invoice.seller.taxId && (
                <p className="font-mono text-slate-300">Tax ID / GSTIN / EIN: {invoice.seller.taxId}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-wider text-amber-400 font-mono">
              TAX INVOICE
            </h2>
            <div className="font-mono text-sm font-semibold text-white">
              #{invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-400 font-mono space-y-0.5 pt-1">
              <div>Issue Date: <span className="text-slate-200">{invoice.issueDate}</span></div>
              <div>Due Date: <span className="text-slate-200">{invoice.dueDate}</span></div>
              <div>Payment Terms: <span className="text-slate-200">{invoice.paymentTerms}</span></div>
              {invoice.customer.poNumber && (
                <div>PO Reference: <span className="text-slate-200">{invoice.customer.poNumber}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Bill-To Section */}
        <div className="py-6 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Billed To (Customer):
            </span>
            <div className="font-bold text-sm text-white mb-1 font-sans">
              {invoice.customer.customerName}
            </div>
            <div className="text-slate-400 space-y-0.5 leading-relaxed font-sans">
              <p>{invoice.customer.billingAddress || 'No address specified'}</p>
              {invoice.customer.email && <p>Email: {invoice.customer.email}</p>}
              {invoice.customer.phone && <p>Phone: {invoice.customer.phone}</p>}
              {invoice.customer.taxId && (
                <p className="font-mono text-slate-300">Customer Tax ID / GSTIN: {invoice.customer.taxId}</p>
              )}
            </div>
          </div>

          <div className="sm:text-right flex flex-col justify-end">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Payment Status & Balance:
            </span>
            <div className="text-xs font-mono space-y-1">
              <div>
                Total Invoice Value: <span className="font-bold text-white font-mono">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
              </div>
              <div>
                Total Paid To Date: <span className="text-emerald-400 font-mono">{invoice.currency} {invoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="text-sm font-bold text-amber-400 font-mono pt-1">
                Outstanding Balance: {invoice.currency} {invoice.outstandingBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Discount</th>
                <th className="py-2.5 px-3 text-right">Tax Rate</th>
                <th className="py-2.5 pl-3 text-right">Total ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {invoice.items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="py-3 pr-4 font-medium text-slate-200">
                    <div>{item.description}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {invoice.currency} {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {item.lineDiscountAmount > 0 ? `-${invoice.currency} ${item.lineDiscountAmount.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '—'}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono font-semibold text-white">
                    {invoice.currency} {item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Calculation Breakdown */}
        <div className="py-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start gap-8">
          {/* Notes & Payment Instructions */}
          <div className="w-full sm:w-1/2 space-y-4 text-xs font-sans">
            {invoice.paymentInstructions && (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-amber-400 text-[11px] font-mono uppercase tracking-wider block">
                  Remittance / Payment Instructions
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px] font-mono">
                  {invoice.paymentInstructions}
                </p>
              </div>
            )}

            {invoice.notes && (
              <div className="text-slate-400 leading-relaxed text-[11px]">
                <strong className="text-slate-300 block mb-0.5">Terms & Conditions:</strong>
                {invoice.notes}
              </div>
            )}

            {/* Cancellation Notice if Voided */}
            {isCancelled && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl space-y-1">
                <strong className="block text-rose-200">INVOICE CANCELLED / VOIDED:</strong>
                <p className="text-[11px]">Reason: {invoice.cancelledReason || 'Voided by Controller'}</p>
                <div className="text-[10px] font-mono text-rose-400 pt-0.5">
                  Date: {invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleString() : 'N/A'} · By: {invoice.cancelledBy || 'Controller'}
                </div>
              </div>
            )}
          </div>

          {/* Financial Calculation Summary Table */}
          <div className="w-full sm:w-80 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400 py-1">
              <span>Subtotal:</span>
              <span className="text-slate-200">{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.totalLineDiscounts > 0 && (
              <div className="flex justify-between text-slate-400 py-1">
                <span>Line Discounts:</span>
                <span className="text-emerald-400">-{invoice.currency} {invoice.totalLineDiscounts.toFixed(2)}</span>
              </div>
            )}

            {invoice.invoiceDiscountAmount > 0 && (
              <div className="flex justify-between text-slate-400 py-1">
                <span>Invoice Discount:</span>
                <span className="text-emerald-400">-{invoice.currency} {invoice.invoiceDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 py-1 border-t border-slate-800">
              <span>Taxable Base:</span>
              <span className="text-slate-200">{invoice.currency} {invoice.taxableAmount.toFixed(2)}</span>
            </div>

            {/* Tax Breakdown Rows */}
            {invoice.taxBreakdown.length > 0 ? (
              invoice.taxBreakdown.map((tax, idx) => (
                <div key={idx} className="flex justify-between text-slate-400 py-1">
                  <span>{tax.label}:</span>
                  <span className="text-slate-200">+{invoice.currency} {tax.taxAmount.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-slate-400 py-1">
                <span>Tax (0%):</span>
                <span>$0.00</span>
              </div>
            )}

            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-400 py-1">
                <span>{invoice.additionalChargesLabel || 'Additional Charges'}:</span>
                <span className="text-slate-200">+{invoice.currency} {invoice.additionalCharges.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-700 text-sm font-bold text-white">
              <span className="uppercase tracking-wider">Grand Total:</span>
              <span className="text-amber-400 text-base">{invoice.currency} {invoice.grandTotal.toFixed(2)}</span>
            </div>

            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-400 py-1">
                <span>Amount Paid:</span>
                <span>-{invoice.currency} {invoice.amountPaid.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-t border-slate-800 text-xs font-bold text-slate-200">
              <span>Outstanding Balance:</span>
              <span className={invoice.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {invoice.currency} {invoice.outstandingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Table (If payments exist) */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
              Payment & Settlement Ledger History:
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-2 pr-3">Payment Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference / Trace #</th>
                    <th className="py-2 px-3">Recorded By</th>
                    <th className="py-2 pl-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3 text-slate-300">{p.paymentDate}</td>
                      <td className="py-2 px-3 text-slate-300">{p.paymentMethod}</td>
                      <td className="py-2 px-3 text-slate-400">{p.reference || '—'}</td>
                      <td className="py-2 px-3 text-slate-400">{p.recordedBy}</td>
                      <td className="py-2 pl-3 text-right text-emerald-400 font-semibold">
                        {invoice.currency} {p.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer / Sign-off Block */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-400 font-sans">
          <div>
            <p>Generated by <strong>FinPilot AI</strong> · Electronic Financial Documentation</p>
            <p className="mt-0.5">Authorized for business invoicing and financial reporting.</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-700 pb-1 mb-1 font-mono text-[9px] text-slate-400">
              Authorized Signature
            </div>
            <p>Finance & Accounting Controller</p>
          </div>
        </div>
      </div>

      {/* Embedded Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          .invoice-print-sheet {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-print-sheet h1,
          .invoice-print-sheet h2,
          .invoice-print-sheet span,
          .invoice-print-sheet td,
          .invoice-print-sheet th,
          .invoice-print-sheet div,
          .invoice-print-sheet p {
            color: #000000 !important;
          }
          .invoice-print-sheet th {
            border-bottom: 2px solid #000000 !important;
          }
          .invoice-print-sheet td {
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
};
