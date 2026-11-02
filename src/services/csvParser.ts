/**
 * FinPilot AI - RFC 4180 Compliant CSV Parser & Serializer
 * Features:
 * - Proper handling of quoted fields with internal commas
 * - Proper handling of escaped double quotes ("")
 * - Spreadsheet formula injection sanitization (OWASP standard)
 * - Row-level validation and column auto-mapping
 */

export interface ParsedCsvData {
  headers: string[];
  rows: string[][];
  rawRowCount: number;
}

export interface CsvValidationRow {
  rowIndex: number;
  rawRow: Record<string, string>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedTransaction?: {
    date: string;
    vendor: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    category: string;
    account: string;
    invoiceRef?: string;
    currency: string;
  };
}

/**
 * Parses raw CSV text according to RFC 4180 specification.
 * Handles quoted fields with internal commas and escaped quotation marks ("").
 */
export function parseCsvText(csvText: string): ParsedCsvData {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  const len = csvText.length;
  for (let i = 0; i < len; i++) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : null;

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> literal "
          currentField += '"';
          i++; // Skip the second quote
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Carriage return; ignore if followed by \n
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          result.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          result.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if text doesn't end in newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      result.push(currentRow);
    }
  }

  if (result.length === 0) {
    return { headers: [], rows: [], rawRowCount: 0 };
  }

  const headers = result[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows = result.slice(1);

  return {
    headers,
    rows,
    rawRowCount: rows.length,
  };
}

/**
 * Sanitizes untrusted text values to prevent Spreadsheet Formula Injection (CSV Injection).
 * Prepend single quote (') if the field starts with '=', '+', '-', '@', '\t', or '\r'.
 */
export function sanitizeForSpreadsheet(val: string): string {
  if (!val) return '';
  const firstChar = val.charAt(0);
  if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
    // Only prepend ' if it's not a standard negative number like "-120.50"
    if (firstChar === '-' && /^-?\d+(\.\d+)?$/.test(val.trim())) {
      return val;
    }
    return `'${val}`;
  }
  return val;
}

/**
 * Serializes data rows to RFC 4180 CSV format with formula injection protection.
 */
export function serializeToCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const formatCell = (cell: string | number | undefined | null): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell);
    const sanitized = sanitizeForSpreadsheet(str);
    // Escape internal quotes by doubling them
    const escaped = sanitized.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map((r) => r.map(formatCell).join(',')).join('\n');

  return `${headerLine}\n${rowLines}`;
}

/**
 * Auto-detects matching column names based on common financial naming conventions.
 */
export function autoMapCsvColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {
    date: '',
    vendor: '',
    description: '',
    amount: '',
    debit: '',
    credit: '',
    category: '',
    account: '',
    type: '',
    invoiceRef: '',
    currency: '',
  };

  for (const h of headers) {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!map.date && (clean.includes('date') || clean === 'dt' || clean.includes('postingdate') || clean.includes('txdate'))) {
      map.date = h;
    } else if (!map.vendor && (clean.includes('vendor') || clean.includes('counterparty') || clean.includes('entity') || clean.includes('payee') || clean.includes('merchant'))) {
      map.vendor = h;
    } else if (!map.amount && (clean === 'amount' || clean === 'total' || clean === 'netamount' || clean === 'grossamount')) {
      map.amount = h;
    } else if (!map.debit && (clean.includes('debit') || clean === 'dr')) {
      map.debit = h;
    } else if (!map.credit && (clean.includes('credit') || clean === 'cr')) {
      map.credit = h;
    } else if (!map.description && (clean.includes('desc') || clean.includes('memo') || clean.includes('narrative') || clean.includes('detail'))) {
      map.description = h;
    } else if (!map.category && (clean.includes('cat') || clean.includes('costcenter') || clean.includes('department'))) {
      map.category = h;
    } else if (!map.account && (clean.includes('account') || clean.includes('acct') || clean.includes('bank'))) {
      map.account = h;
    } else if (!map.type && (clean === 'type' || clean === 'entrytype' || clean === 'drcr')) {
      map.type = h;
    } else if (!map.invoiceRef && (clean.includes('inv') || clean.includes('ref') || clean.includes('voucher') || clean.includes('checkno'))) {
      map.invoiceRef = h;
    } else if (!map.currency && (clean.includes('curr') || clean === 'ccy')) {
      map.currency = h;
    }
  }

  return map;
}

/**
 * Parses and validates raw numeric amount strings.
 */
export function parseCleanAmount(raw: string): number | null {
  if (!raw) return null;
  // Remove currency signs, commas, extra whitespace
  const clean = raw.replace(/[^\d.-]/g, '').trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.abs(num);
}

/**
 * Normalizes date format to YYYY-MM-DD.
 */
export function parseCleanDate(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim();

  // YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (isValidCalendarDate(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // MM/DD/YYYY
  const usMatch = clean.match(/^(0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])[-/.](\d{4})$/);
  if (usMatch) {
    const m = parseInt(usMatch[1], 10);
    const d = parseInt(usMatch[2], 10);
    const y = parseInt(usMatch[3], 10);
    if (isValidCalendarDate(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}
