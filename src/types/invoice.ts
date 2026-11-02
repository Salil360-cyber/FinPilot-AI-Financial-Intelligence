/**
 * FinPilot AI - Phase 2 Invoice Intelligence Types
 * Strict typing for deterministic financial extraction, validation, and review.
 */

export type FieldOrigin = 'extracted' | 'calculated' | 'manual' | 'not_found';

export interface InvoiceField<T> {
  value: T;
  origin: FieldOrigin;
  confidence?: number;
  rawLabel?: string;
  isEdited?: boolean;
}

export interface ParsedLineItem {
  id: string;
  description: InvoiceField<string>;
  quantity: InvoiceField<number>;
  unitPrice: InvoiceField<number>;
  total: InvoiceField<number>;
  calculatedTotal: number;
  isMathValid: boolean;
  notes?: string;
}

export type ExtractionMethod =
  | 'pdf_text_layer'
  | 'browser_ocr'
  | 'manual_entry'
  | 'synthetic_sample';

export interface ParsedInvoice {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'image' | 'manual';
  extractionMethod: ExtractionMethod;
  extractedAt: string;
  rawText: string;
  pageCount: number;

  // Header & Vendor fields
  vendorName: InvoiceField<string>;
  vendorAddress: InvoiceField<string>;
  invoiceNumber: InvoiceField<string>;
  invoiceDate: InvoiceField<string>;
  dueDate: InvoiceField<string>;
  currency: InvoiceField<string>;
  customerName: InvoiceField<string>;

  // Financial Totals
  subtotal: InvoiceField<number>;
  discount: InvoiceField<number>;
  taxableAmount: InvoiceField<number>;
  taxAmount: InvoiceField<number>;
  taxRate: InvoiceField<number | null>;
  invoiceTotal: InvoiceField<number>;

  // Line items
  lineItems: ParsedLineItem[];

  // Review & Approval state
  status: 'draft' | 'needs_review' | 'approved' | 'rejected';
  approvedTxId?: string;
  approvedAt?: string;
  category?: string;
  account?: string;
}

export type ValidationCheckId =
  | 'SUBTOTAL_MATH'
  | 'LINE_ITEM_MATH'
  | 'NEGATIVE_AMOUNTS'
  | 'DATE_FORMATS'
  | 'MISSING_INVOICE_NUMBER'
  | 'MISSING_VENDOR_NAME'
  | 'CURRENCY_CONSISTENCY'
  | 'DUPLICATE_INVOICE';

export type ValidationStatus = 'passed' | 'warning' | 'failed' | 'not_enough_info';

export interface ValidationResult {
  id: ValidationCheckId;
  label: string;
  status: ValidationStatus;
  reason: string;
  formula?: string;
  calculatedValue?: number | string;
  expectedValue?: number | string;
  impact: 'blocking' | 'warning' | 'info';
}

export interface InvoiceValidationReport {
  overallValid: boolean;
  canApprove: boolean;
  results: ValidationResult[];
  passCount: number;
  warningCount: number;
  failedCount: number;
  insufficientCount: number;
  roundingTolerance: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'FILE_SELECTED'
    | 'EXTRACTION_STARTED'
    | 'EXTRACTION_COMPLETED'
    | 'EXTRACTION_FAILED'
    | 'FIELD_EDITED'
    | 'VALIDATION_EXECUTED'
    | 'RECALCULATED'
    | 'INVOICE_APPROVED'
    | 'INVOICE_DRAFT_SAVED'
    | 'INVOICE_REJECTED';
  details: string;
  actor: string;
}
