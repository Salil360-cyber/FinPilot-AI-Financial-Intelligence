import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { FinancialTransaction, TransactionSource } from '../../types/finance';
import { parseCsvText, autoMapCsvColumns, parseCleanDate, parseCleanAmount } from '../../services/csvParser';
import { validateLedgerTransaction } from '../../services/ledgerValidator';
import { Upload, CheckCircle2, AlertTriangle, AlertCircle, FileText, ArrowRight, Table, Sparkles, X } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number, rejectedCount: number) => void;
  importCsvTransactions: (txs: Omit<FinancialTransaction, 'id'>[], label?: string) => { successCount: number; rejectedCount: number; errors: string[] };
  existingTransactions: FinancialTransaction[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  importCsvTransactions,
  existingTransactions,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'summary'>('upload');
  const [csvFileName, setCsvFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importSource, setImportSource] = useState<TransactionSource>('imported_bank_statement');

  const [importSummary, setImportSummary] = useState<{ success: number; rejected: number; errorMessages: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvContent = `Date,Vendor,Description,Amount,Category,Account,Type,InvoiceRef
"2026-10-25","Datadog Cloud Monitoring","APM & Synthetic Monitoring Tier","$3,200.00","Cloud & Infrastructure","Chase Operating •••• 4092","debit","INV-DD-9102"
"2026-10-25","Atlassian Jira Software","Cloud Enterprise Seats","$1,450.00","Software & Subscriptions","Amex Corporate •••• 3004","debit","INV-ATL-401"
"2026-10-24","Stripe Merchant Settlement","Daily Automated Wire Payout","$94,200.00","Revenue Clearing","Chase Operating •••• 4092","credit","STRIPE-SETTLE-881"
"2026-10-23","Twilio Communications","SMS & Voice Delivery Usage","$840.50","Software & Subscriptions","Chase Operating •••• 4092","debit","INV-TW-40991"`;

  const handleProcessCsvString = (text: string, filename: string) => {
    setCsvFileName(filename);
    const parsed = parseCsvText(text);

    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      alert('CSV document contains no readable header or data rows.');
      return;
    }

    setRawHeaders(parsed.headers);
    setRawRows(parsed.rows);

    // Auto map columns
    const detected = autoMapCsvColumns(parsed.headers);
    setColumnMap(detected);
    setStep('mapping');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessCsvString(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    handleProcessCsvString(sampleCsvContent, 'sample_bank_statement_feed.csv');
  };

  // Build mapped and validated row items
  const validatedRows = rawRows.map((row, idx) => {
    const getVal = (headerKey: string): string => {
      const headerName = columnMap[headerKey];
      if (!headerName) return '';
      const colIdx = rawHeaders.indexOf(headerName);
      return colIdx >= 0 && colIdx < row.length ? row[colIdx]?.trim() || '' : '';
    };

    const rawDate = getVal('date');
    const rawVendor = getVal('vendor');
    const rawDesc = getVal('description');
    const rawAmount = getVal('amount');
    const rawCategory = getVal('category') || 'Operating Expenses';
    const rawAccount = getVal('account') || 'Chase Operating •••• 4092';
    const rawType = getVal('type').toLowerCase() === 'credit' ? 'credit' : 'debit';
    const rawInv = getVal('invoiceRef');

    const cleanDate = parseCleanDate(rawDate);
    const cleanAmt = parseCleanAmount(rawAmount);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!cleanDate) errors.push(`Invalid calendar date: "${rawDate}"`);
    if (!rawVendor) errors.push('Missing vendor or counterparty name');
    if (cleanAmt === null || cleanAmt <= 0) errors.push(`Invalid amount: "${rawAmount}"`);

    // Check duplicate
    if (cleanDate && rawVendor && cleanAmt) {
      const isDup = existingTransactions.some((ex) => {
        const exVendor = ex.vendor.toLowerCase();
        const curVendor = rawVendor.toLowerCase();
        const sameVendor = exVendor.includes(curVendor) || curVendor.includes(exVendor);
        const sameAmt = Math.abs(ex.amount - cleanAmt) < 0.01;
        const sameDate = ex.date === cleanDate;
        return sameVendor && sameAmt && sameDate;
      });
      if (isDup) warnings.push('Potential duplicate matching an existing ledger transaction.');
    }

    const candidateTx: Omit<FinancialTransaction, 'id'> | null = errors.length === 0 && cleanDate && cleanAmt !== null ? {
      date: cleanDate,
      vendor: rawVendor,
      amount: cleanAmt,
      type: rawType,
      category: rawCategory,
      account: rawAccount,
      description: rawDesc,
      invoiceRef: rawInv || undefined,
      currency: 'USD',
      status: 'review_required',
      ledgerStatus: 'posted',
      source: importSource,
      reconciliationNotes: `Imported via CSV batch from ${csvFileName}.`,
    } : null;

    return {
      rowIndex: idx + 1,
      rawRow: row,
      isValid: errors.length === 0,
      errors,
      warnings,
      candidateTx,
    };
  });

  const validRows = validatedRows.filter((r) => r.isValid && r.candidateTx !== null);
  const invalidRows = validatedRows.filter((r) => !r.isValid);

  const handleConfirmImport = () => {
    const transactionsToImport = validRows.map((r) => r.candidateTx!);
    const result = importCsvTransactions(transactionsToImport, csvFileName);

    setImportSummary({
      success: result.successCount,
      rejected: result.rejectedCount,
      errorMessages: result.errors,
    });
    setStep('summary');
    onImportSuccess(result.successCount, result.rejectedCount);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bank Statements & Ledger CSV"
      subtitle="RFC 4180 parsing with automated header mapping and duplicate audit"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono text-[11px]">
          <div className="flex items-center gap-4">
            <span className={step === 'upload' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              1. File Upload
            </span>
            <span className="text-slate-600">→</span>
            <span className={step === 'mapping' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              2. Column Mapping
            </span>
            <span className="text-slate-600">→</span>
            <span className={step === 'preview' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              3. Verification & Preview
            </span>
          </div>
          <span className="text-slate-400 font-mono">{csvFileName || 'No file selected'}</span>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl p-8 text-center transition-colors cursor-pointer bg-slate-900/40"
            >
              <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-200">Select a CSV transaction file</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Supports RFC 4180 quoted fields, internal commas, and bank feeds (up to 10MB)
              </p>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-white block">Need a test dataset?</span>
                <span className="text-[11px] text-slate-400">
                  Load a verified bank statement feed with debits, credits, and quoted fields.
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold whitespace-nowrap"
              >
                Load Sample Feed CSV
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 flex items-center justify-between">
              <span>
                Detected <strong>{rawHeaders.length} headers</strong> and <strong>{rawRows.length} data rows</strong>.
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Target Ledger Source:</span>
                <select
                  value={importSource}
                  onChange={(e) => setImportSource(e.target.value as TransactionSource)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 text-xs font-mono"
                >
                  <option value="imported_bank_statement">Imported Bank Statement</option>
                  <option value="manual_entry">Manual Ledger Import</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'date', label: 'Date Column *' },
                { key: 'vendor', label: 'Vendor / Payee *' },
                { key: 'amount', label: 'Amount Column *' },
                { key: 'type', label: 'Debit/Credit Column' },
                { key: 'description', label: 'Description / Memo' },
                { key: 'category', label: 'Expense Category' },
                { key: 'account', label: 'Account Name' },
                { key: 'invoiceRef', label: 'Invoice Reference' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-400">
                    {label}
                  </label>
                  <select
                    value={columnMap[key] || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, [key]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">(None / Default)</option>
                    {rawHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Back to File
              </button>
              <button
                type="button"
                onClick={() => setStep('preview')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg flex items-center gap-1.5"
              >
                <span>Proceed to Row Validation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VERIFICATION */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {validRows.length} Valid Rows Ready
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {invalidRows.length} Rows with Errors
                  </span>
                )}
              </div>
              <span className="text-slate-400 text-[11px]">
                Valid rows will be posted under source: <strong className="text-white font-mono">{importSource}</strong>
              </span>
            </div>

            {/* Row Inspection Table */}
            <div className="overflow-x-auto max-h-64 border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Row</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Vendor</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Status / Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {validatedRows.map((r) => (
                    <tr key={r.rowIndex} className={r.isValid ? 'hover:bg-slate-900/40' : 'bg-rose-950/20'}>
                      <td className="py-2 px-3 text-slate-500 font-mono">#{r.rowIndex}</td>
                      <td className="py-2 px-3 text-slate-300">{r.candidateTx?.date || '—'}</td>
                      <td className="py-2 px-3 font-sans font-medium text-white">{r.candidateTx?.vendor || 'Missing'}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {r.candidateTx ? `$${r.candidateTx.amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {r.isValid ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Valid</span>
                            {r.warnings.length > 0 && (
                              <span className="text-amber-400 text-[10px] font-mono">({r.warnings[0]})</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-rose-400 text-[11px] font-medium">
                            {r.errors.join('; ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('mapping')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Back to Mapping
              </button>
              <button
                type="button"
                disabled={validRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Post {validRows.length} Valid Rows</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUMMARY */}
        {step === 'summary' && importSummary && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2 text-emerald-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Import Completed Successfully</span>
              </div>
              <p className="text-xs text-emerald-300/80 leading-relaxed">
                <strong>{importSummary.success} transaction vouchers</strong> have been posted to the General Ledger under batch reference <strong>{csvFileName}</strong>.
              </p>
            </div>

            {importSummary.rejected > 0 && (
              <div className="p-4 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-2 text-rose-300">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{importSummary.rejected} Row(s) Rejected Due to Validation Failures:</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-400">
                  {importSummary.errorMessages.map((e, idx) => (
                    <div key={idx}>• {e}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
