/**
 * FinPilot AI - Phase 4 Smart Invoice Generator Types
 * Type definitions for outgoing sales invoices, line items, taxes, and payment tracking.
 */

export type SalesInvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface SalesLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  taxRate: number; // percentage (e.g. 18 for 18%)
  lineSubtotal: number; // quantity * unitPrice
  lineDiscountAmount: number;
  taxableAmount: number; // lineSubtotal - lineDiscountAmount
  lineTaxAmount: number;
  lineTotal: number; // taxableAmount + lineTaxAmount
}

export type TaxRegimeType = 'none' | 'standard' | 'vat' | 'sales_tax' | 'gst';

export interface TaxConfiguration {
  regime: TaxRegimeType;
  label: string;
  defaultRate: number; // %
  isGst: boolean;
  gstType?: 'inter_state' | 'intra_state'; // Inter-state = IGST; Intra-state = CGST + SGST
  cgstRate?: number; // %
  sgstRate?: number; // %
  igstRate?: number; // %
}

export interface SellerProfile {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  taxId: string; // EIN, GSTIN, VAT ID
  logoUrl?: string;
  paymentInstructions?: string;
}

export interface CustomerProfile {
  customerName: string;
  billingAddress: string;
  email: string;
  phone: string;
  taxId?: string;
  poNumber?: string;
}

export interface InvoicePayment {
  id: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: 'Bank Wire' | 'ACH Transfer' | 'Credit Card' | 'Check' | 'Cash' | 'Other';
  reference?: string;
  notes?: string;
  recordedAt: string; // ISO
  recordedBy: string;
}

export interface TaxBreakdownItem {
  label: string;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  status: SalesInvoiceStatus;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  currency: string; // USD, EUR, GBP, INR, etc.
  paymentTerms: string; // Net 15, Net 30, Net 60, Due on Receipt, Custom
  seller: SellerProfile;
  customer: CustomerProfile;
  items: SalesLineItem[];

  // Invoice-level discount & taxes
  invoiceDiscountType: 'percent' | 'fixed';
  invoiceDiscountValue: number;
  taxConfig: TaxConfiguration;
  additionalCharges: number;
  additionalChargesLabel?: string;

  notes?: string;
  paymentInstructions?: string;

  // Deterministically calculated amounts
  subtotal: number; // Sum of lineSubtotal
  totalLineDiscounts: number;
  invoiceDiscountAmount: number;
  taxableAmount: number; // (subtotal - discounts)
  taxBreakdown: TaxBreakdownItem[];
  totalTaxAmount: number;
  grandTotal: number;
  total?: number;
  amountPaid: number;
  outstandingBalance: number;

  payments: InvoicePayment[];

  createdAt: string; // ISO
  updatedAt: string; // ISO
  issuedAt?: string; // ISO
  cancelledAt?: string; // ISO
  cancelledReason?: string;
  cancelledBy?: string;
  source: 'user_created' | 'demo';
}
