import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { ParsedInvoice, ParsedLineItem, InvoiceField, ExtractionMethod } from '../types/invoice';

// Configure pdfjs worker
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('Worker configuration notice:', e);
}

export interface ExtractionResult {
  rawText: string;
  pageCount: number;
  isScannedOrEmpty: boolean;
  error?: string;
}

/**
 * Extracts raw text from text-based PDF files using pdfjs-dist.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    let fullText = '';
    for (let pageNum = 1; pageNum <= Math.min(pageCount, 15); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items as any[]) {
        if ('str' in item) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
            pageText += '\n';
          } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
            pageText += ' ';
          }
          pageText += item.str;
          lastY = item.transform[5];
        }
      }
      fullText += pageText + '\n\n--- Page Break ---\n\n';
    }

    const trimmed = fullText.trim();
    const isScannedOrEmpty = trimmed.replace(/--- Page Break ---/g, '').trim().length < 15;

    return {
      rawText: trimmed,
      pageCount,
      isScannedOrEmpty,
    };
  } catch (err: any) {
    console.error('PDF extraction failed:', err);
    return {
      rawText: '',
      pageCount: 1,
      isScannedOrEmpty: true,
      error: `Failed to read PDF text layers: ${err.message || 'Corrupt or unreadable document.'}`,
    };
  }
}

/**
 * Extracts text from images (PNG, JPG) using browser-based Tesseract.js.
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; error?: string }> {
  let worker: any = null;
  try {
    if (onProgress) onProgress(0.1, 'Initializing OCR worker...');
    worker = await createWorker('eng');

    if (onProgress) onProgress(0.4, 'Analyzing image contrast and character matrix...');
    const imageUrl = URL.createObjectURL(file);
    const ret = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);

    if (onProgress) onProgress(0.9, 'Extracting OCR tokens...');
    await worker.terminate();

    const text = ret.data.text.trim();
    if (!text || text.length < 10) {
      return {
        text: '',
        error: 'OCR completed but detected negligible text. Please check image resolution or use manual entry.',
      };
    }

    return { text };
  } catch (err: any) {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {}
    }
    console.warn('Browser OCR could not run in this environment:', err);
    return {
      text: '',
      error: `Browser OCR engine unavailable (${err.message || 'Worker initialization failed'}). You can enter invoice fields manually or upload a text-based PDF.`,
    };
  }
}

/**
 * Normalizes raw date strings into standard ISO YYYY-MM-DD.
 */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();

  // YYYY-MM-DD
  const isoMatch = clean.match(/\b(20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = clean.match(/\b(0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])[-/.](20\d{2})\b/);
  if (slashMatch) {
    const m = slashMatch[1].padStart(2, '0');
    const d = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Month DD, YYYY (e.g. October 24, 2026 or Oct 24 2026)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const namedMatch = clean.match(/\b([A-Za-z]+)\s+([0-3]?\d)(?:st|nd|rd|th)?,?\s+(20\d{2})\b/i);
  if (namedMatch) {
    const monStr = namedMatch[1].toLowerCase();
    const mon = monthNames[monStr] || monthNames[monStr.slice(0, 3)];
    if (mon) {
      const day = namedMatch[2].padStart(2, '0');
      const year = namedMatch[3];
      return `${year}-${mon}-${day}`;
    }
  }

  return null;
}

/**
 * Parses numeric currency strings like "$38,420.50" or "1,200.00" into a float.
 */
function parseAmount(str: string): number | null {
  if (!str) return null;
  const clean = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : Math.abs(num);
}

/**
 * Main Deterministic Invoice Parser.
 * Strict regular expressions with word boundary guards and structured line-item extraction.
 */
export function parseInvoiceText(
  rawText: string,
  fileName: string,
  fileSize: number,
  method: ExtractionMethod,
  pageCount = 1
): ParsedInvoice {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Currency
  let currencyCode = 'USD';
  let currencyOrigin: InvoiceField<string>['origin'] = 'not_found';
  if (rawText.includes('EUR') || rawText.includes('€')) {
    currencyCode = 'EUR';
    currencyOrigin = 'extracted';
  } else if (rawText.includes('GBP') || rawText.includes('£')) {
    currencyCode = 'GBP';
    currencyOrigin = 'extracted';
  } else if (rawText.includes('CAD')) {
    currencyCode = 'CAD';
    currencyOrigin = 'extracted';
  } else if (rawText.includes('AUD')) {
    currencyCode = 'AUD';
    currencyOrigin = 'extracted';
  } else if (rawText.includes('USD') || rawText.includes('$')) {
    currencyCode = 'USD';
    currencyOrigin = 'extracted';
  }

  // 2. Vendor Name
  let vendorNameVal = '';
  let vendorOrigin: InvoiceField<string>['origin'] = 'not_found';

  // Check labeled prefixes: "Vendor:", "From:", "Seller:", "Company:", "Payable to:"
  for (const line of lines) {
    const match = line.match(/^(?:vendor|from|seller|biller|payable\s+to|supplier)\s*[:\-]\s*(.+)$/i);
    if (match && match[1].trim()) {
      vendorNameVal = match[1].trim();
      vendorOrigin = 'extracted';
      break;
    }
  }

  // Common enterprise vendors if explicitly found
  if (!vendorNameVal) {
    const knownVendors = [
      'Amazon Web Services', 'AWS', 'Google Cloud Platform', 'GCP', 'Microsoft Azure',
      'Snowflake Data Cloud', 'Snowflake', 'Salesforce', 'Deloitte Consulting', 'Deloitte',
      'KPMG', 'Stripe', 'Oracle', 'GitHub', 'Figma', 'WeWork', 'Datadog', 'Twilio'
    ];
    for (const v of knownVendors) {
      if (rawText.toLowerCase().includes(v.toLowerCase())) {
        vendorNameVal = v.includes('AWS') ? 'Amazon Web Services' : v.includes('Snowflake') ? 'Snowflake Data Cloud' : v.includes('Deloitte') ? 'Deloitte Consulting LLP' : v;
        vendorOrigin = 'extracted';
        break;
      }
    }
  }

  // Fallback: Check the first non-empty 3 lines for a probable company name
  // Exclude document headers like "PAYMENT RECEIPT", "INVOICE", "TAX INVOICE", "STATEMENT"
  if (!vendorNameVal && lines.length > 0) {
    const genericHeaders = [
      'invoice', 'tax invoice', 'bill to', 'payment receipt', 'receipt', 'statement',
      'remittance', 'confirmation', 'date', 'currency', 'deliverables', 'items'
    ];
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const candidate = lines[i];
      const isGeneric = genericHeaders.some((gh) => candidate.toLowerCase().includes(gh));
      if (!isGeneric && candidate.length > 2 && candidate.length < 50) {
        vendorNameVal = candidate;
        vendorOrigin = 'extracted';
        break;
      }
    }
  }

  // 3. Invoice Number
  let invoiceNumberVal = '';
  let invoiceNumberOrigin: InvoiceField<string>['origin'] = 'not_found';

  const invPatterns = [
    /\b(INV[-_][A-Za-z0-9\-_]+)\b/i,
    /(?:invoice\s*(?:#|no\.?|num(?:ber)?|id)?|bill\s*(?:#|no\.?)|inv\s*#?)\s*[:#\-]\s*([A-Za-z0-9\-_/]+)/i,
    /(?:invoice|bill|ref)\s*#\s*([A-Za-z0-9\-_/]+)/i,
  ];

  for (const pat of invPatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      const val = match[1].trim();
      const lower = val.toLowerCase();
      if (val.length >= 3 && !['date', 'due', 'for', 'to', 'invoice', 'bill'].includes(lower)) {
        invoiceNumberVal = val;
        invoiceNumberOrigin = 'extracted';
        break;
      }
    }
  }

  // 4. Invoice Date
  let invoiceDateVal = '';
  let invoiceDateOrigin: InvoiceField<string>['origin'] = 'not_found';

  const datePatterns = [
    /(?:invoice\s*date|issue\s*date|date\s*of\s*issue|dated?)\s*[:#\-]?\s*([A-Za-z0-9\s,./-]+)/i,
    /\b(20\d{2}[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/,
  ];

  for (const pat of datePatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      const norm = normalizeDate(match[1]);
      if (norm) {
        invoiceDateVal = norm;
        invoiceDateOrigin = 'extracted';
        break;
      }
    }
  }

  // 5. Due Date
  let dueDateVal = '';
  let dueDateOrigin: InvoiceField<string>['origin'] = 'not_found';

  const dueDatePatterns = [
    /(?:due\s*date|payment\s*due|due\s*by|pay\s*by)\s*[:#\-]?\s*([A-Za-z0-9\s,./-]+)/i,
  ];

  for (const pat of dueDatePatterns) {
    const match = rawText.match(pat);
    if (match && match[1]) {
      const norm = normalizeDate(match[1]);
      if (norm) {
        dueDateVal = norm;
        dueDateOrigin = 'extracted';
        break;
      }
    }
  }

  // 6. Customer Name (Billed to)
  let customerNameVal = '';
  let customerOrigin: InvoiceField<string>['origin'] = 'not_found';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(?:bill(?:ed)?\s*to|customer|client|recipient|sold\s*to):\s*(.*)$/i);
    if (match) {
      if (match[1].trim()) {
        customerNameVal = match[1].trim();
        customerOrigin = 'extracted';
        break;
      } else if (i + 1 < lines.length) {
        customerNameVal = lines[i + 1].trim();
        customerOrigin = 'extracted';
        break;
      }
    }
  }

  // 7. Vendor Address
  let vendorAddressVal = '';
  let vendorAddressOrigin: InvoiceField<string>['origin'] = 'not_found';
  const addrMatch = rawText.match(/(?:address|remit\s+to|location):\s*([^\n]+)/i);
  if (addrMatch && addrMatch[1].trim()) {
    vendorAddressVal = addrMatch[1].trim();
    vendorAddressOrigin = 'extracted';
  }

  // 8. Financial Totals (Subtotal, Discount, Tax, Total)
  // Use word boundaries \b and flexible [:\s]*[$€£]?\s*
  let subtotalVal = 0;
  let subtotalOrigin: InvoiceField<number>['origin'] = 'not_found';

  const subtotalMatch = rawText.match(/\b(?:subtotal|sub-total|sub\s*total|net\s*amount|total\s*before\s*tax)[:\s]*[$€£]?\s*([0-9,]+\.\d{2}|[0-9,]+)/i);
  if (subtotalMatch) {
    const parsed = parseAmount(subtotalMatch[1]);
    if (parsed !== null) {
      subtotalVal = parsed;
      subtotalOrigin = 'extracted';
    }
  }

  let discountVal = 0;
  let discountOrigin: InvoiceField<number>['origin'] = 'not_found';
  const discountMatch = rawText.match(/\b(?:discount|less\s*discount|promo)[:\s]*[$€£]?\s*([0-9,]+\.\d{2}|[0-9,]+)/i);
  if (discountMatch) {
    const parsed = parseAmount(discountMatch[1]);
    if (parsed !== null) {
      discountVal = parsed;
      discountOrigin = 'extracted';
    }
  }

  let taxVal = 0;
  let taxOrigin: InvoiceField<number>['origin'] = 'not_found';
  const taxMatch = rawText.match(/\b(?:state\s*sales\s*tax|sales\s*tax|state\s*tax|tax|vat|gst)(?:\s*\([^)]*\))?[:\s]*[$€£]?\s*([0-9,]+\.\d{2}|[0-9,]+)/i);
  if (taxMatch) {
    const parsed = parseAmount(taxMatch[1]);
    if (parsed !== null) {
      taxVal = parsed;
      taxOrigin = 'extracted';
    }
  }

  let totalVal = 0;
  let totalOrigin: InvoiceField<number>['origin'] = 'not_found';
  const totalMatch = rawText.match(/\b(?:total(?:\s*due|\s*amount|\s*payable)?|grand\s*total|balance\s*due|amount\s*due|net\s*payable)[:\s]*[$€£]?\s*([0-9,]+\.\d{2}|[0-9,]+)/i);
  if (totalMatch) {
    const parsed = parseAmount(totalMatch[1]);
    if (parsed !== null) {
      totalVal = parsed;
      totalOrigin = 'extracted';
    }
  }

  // 9. Tax Rate Detection
  let detectedTaxRate: number | null = null;
  let taxRateOrigin: InvoiceField<number | null>['origin'] = 'not_found';
  const taxRateMatch = rawText.match(/(?:tax|vat|gst)\s*(?:\([^)]*\)|rate)?\s*[:@]?\s*(\d+(?:\.\d+)?)\s*%/i);
  if (taxRateMatch) {
    detectedTaxRate = parseFloat(taxRateMatch[1]);
    taxRateOrigin = 'extracted';
  } else if (subtotalVal > 0 && taxVal > 0) {
    const computedRate = parseFloat(((taxVal / subtotalVal) * 100).toFixed(2));
    if (computedRate > 0 && computedRate <= 50) {
      detectedTaxRate = computedRate;
      taxRateOrigin = 'calculated';
    }
  }

  // 10. Line Items Parsing
  const lineItems: ParsedLineItem[] = [];
  // Pattern: Description ... Qty (optional units) ... Rate ... Total
  const lineItemRegex = /^(.{4,65}?)\s+(\d+(?:\.\d+)?)\s*(?:[A-Za-z]{1,8})?\s+[@$€£]?\s*([0-9,]+\.\d{2})\s+[$€£]?\s*([0-9,]+\.\d{2})$/im;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.toLowerCase().includes('subtotal') ||
      line.toLowerCase().includes('grand total') ||
      line.toLowerCase().includes('invoice date') ||
      line.toLowerCase().includes('total due') ||
      line.toLowerCase().includes('sales tax') ||
      line.toLowerCase().includes('due date') ||
      line.toLowerCase().includes('deliverables & service items')
    ) {
      continue;
    }

    const match = line.match(lineItemRegex);
    if (match) {
      const desc = match[1].trim();
      const qty = parseFloat(match[2]) || 1;
      const rate = parseAmount(match[3]) || 0;
      const tot = parseAmount(match[4]) || 0;
      const calculated = parseFloat((qty * rate).toFixed(2));
      const isMathValid = Math.abs(calculated - tot) <= 0.05;

      lineItems.push({
        id: `LI-${lineItems.length + 1}`,
        description: { value: desc, origin: 'extracted' },
        quantity: { value: qty, origin: 'extracted' },
        unitPrice: { value: rate, origin: 'extracted' },
        total: { value: tot, origin: 'extracted' },
        calculatedTotal: calculated,
        isMathValid,
      });
    }
  }

  // If subtotal is missing but line items exist, calculate it
  if (subtotalVal === 0 && lineItems.length > 0) {
    subtotalVal = parseFloat(lineItems.reduce((acc, curr) => acc + curr.total.value, 0).toFixed(2));
    subtotalOrigin = 'calculated';
  }

  const taxableAmountVal = Math.max(0, subtotalVal - discountVal);
  const taxableAmountOrigin: InvoiceField<number>['origin'] = discountVal > 0 ? 'calculated' : subtotalOrigin;

  // If total is missing but subtotal exists, calculate it
  if (totalVal === 0 && subtotalVal > 0) {
    totalVal = parseFloat((taxableAmountVal + taxVal).toFixed(2));
    totalOrigin = 'calculated';
  }

  return {
    id: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fileName,
    fileSize,
    fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
    extractionMethod: method,
    extractedAt: new Date().toISOString(),
    rawText,
    pageCount,

    vendorName: { value: vendorNameVal, origin: vendorOrigin },
    vendorAddress: { value: vendorAddressVal, origin: vendorAddressOrigin },
    invoiceNumber: { value: invoiceNumberVal, origin: invoiceNumberOrigin },
    invoiceDate: { value: invoiceDateVal, origin: invoiceDateOrigin },
    dueDate: { value: dueDateVal, origin: dueDateOrigin },
    currency: { value: currencyCode, origin: currencyOrigin },
    customerName: { value: customerNameVal, origin: customerOrigin },

    subtotal: { value: subtotalVal, origin: subtotalOrigin },
    discount: { value: discountVal, origin: discountOrigin },
    taxableAmount: { value: taxableAmountVal, origin: taxableAmountOrigin },
    taxAmount: { value: taxVal, origin: taxOrigin },
    taxRate: { value: detectedTaxRate, origin: taxRateOrigin },
    invoiceTotal: { value: totalVal, origin: totalOrigin },

    lineItems,
    status: 'needs_review',
    category: 'Operating Expenses',
    account: 'Chase Operating •••• 4092',
  };
}
