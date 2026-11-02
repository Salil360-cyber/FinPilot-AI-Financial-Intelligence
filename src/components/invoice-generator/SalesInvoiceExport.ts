/**
 * FinPilot AI - Sales Invoice CSV Exporter
 * Compliant with RFC 4180 and protected against Spreadsheet Formula Injection.
 */

import { SalesInvoice } from '../../types/salesInvoice';
import { sanitizeForSpreadsheet, serializeToCsv } from '../../services/csvParser';

export function exportSalesInvoiceToCsv(invoice: SalesInvoice): void {
  const headers = [
    'Document Type',
    'Invoice Number',
    'Status',
    'Issue Date',
    'Due Date',
    'Currency',
    'Seller Name',
    'Seller Tax ID',
    'Customer Name',
    'Customer Tax ID',
    'Customer PO',
    'Item #',
    'Item Description',
    'Quantity',
    'Unit Price',
    'Line Discount',
    'Line Tax Rate (%)',
    'Line Subtotal',
    'Line Total',
    'Invoice Subtotal',
    'Invoice Discount',
    'Taxable Amount',
    'Total Tax',
    'Additional Charges',
    'Grand Total',
    'Amount Paid',
    'Outstanding Balance',
    'Payment Instructions',
    'Notes',
  ];

  const rows = invoice.items.map((item, idx) => [
    'Sales Invoice Line',
    invoice.invoiceNumber,
    invoice.status,
    invoice.issueDate,
    invoice.dueDate,
    invoice.currency,
    invoice.seller.companyName,
    invoice.seller.taxId || '',
    invoice.customer.customerName,
    invoice.customer.taxId || '',
    invoice.customer.poNumber || '',
    idx + 1,
    item.description,
    item.quantity,
    item.unitPrice,
    item.lineDiscountAmount,
    item.taxRate,
    item.lineSubtotal,
    item.lineTotal,
    invoice.subtotal,
    invoice.invoiceDiscountAmount,
    invoice.taxableAmount,
    invoice.totalTaxAmount,
    invoice.additionalCharges,
    invoice.grandTotal,
    invoice.amountPaid,
    invoice.outstandingBalance,
    invoice.paymentInstructions || '',
    invoice.notes || '',
  ]);

  const csvContent = serializeToCsv(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${invoice.invoiceNumber}_Export.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportSalesInvoicesSummaryToCsv(invoices: SalesInvoice[]): void {
  const headers = [
    'Invoice Number',
    'Status',
    'Customer Name',
    'Issue Date',
    'Due Date',
    'Currency',
    'Subtotal',
    'Tax Amount',
    'Grand Total',
    'Amount Paid',
    'Outstanding Balance',
    'Source',
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.status,
    inv.customer.customerName,
    inv.issueDate,
    inv.dueDate,
    inv.currency,
    inv.subtotal,
    inv.totalTaxAmount,
    inv.grandTotal,
    inv.amountPaid,
    inv.outstandingBalance,
    inv.source,
  ]);

  const csvContent = serializeToCsv(headers, rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `FinPilot_Sales_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
