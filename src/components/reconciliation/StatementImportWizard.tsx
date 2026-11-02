import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { BankCsvColumnMapping, BankStatementParseResult } from '../../types/reconciliation';
import { parseBankStatementCsv, autoSuggestBankMapping } from '../../services/reconciliationEngine';
import { parseCsvText } from '../../services/csvParser';
import { SAMPLE_BANK_STATEMENT_CSV } from '../../data/demoReconciliation';

interface StatementImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (sessionId: string) => void;
}

export const StatementImportWizard: React.FC<StatementImportWizardProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const { bankAccounts, activeAccountId, createReconciliationSession, runSessionAutoMatch } = useFinancial();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId);
  const [sessionName, setSessionName] = useState('');
  const [openingBalance, setOpeningBalance] = useState<string>('248500.00');
  const [closingBalance, setClosingBalance] = useState<string>('219904.75');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<BankCsvColumnMapping>({
    date: 'Date',
    description: 'Description',
    amountMode: 'split_debit_credit',
    debit: 'Debit',
    credit: 'Credit',
    counterparty: 'Counterparty',
    reference: 'Reference',
    balance: 'Balance',
  });

  const [parseResult, setParseResult] = useState<BankStatementParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentAccount = bankAccounts.find((a) => a.id === selectedAccountId) || bankAccounts[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('chase_commercial_oct_2026.csv');
    setCsvContent(SAMPLE_BANK_STATEMENT_CSV);
    setSessionName('October 2026 Monthly Reconciliation');
    setOpeningBalance('248500.00');
    setClosingBalance('219904.75');
    processCsvText(SAMPLE_BANK_STATEMENT_CSV, 'chase_commercial_oct_2026.csv');
  };

  const processCsvText = (text: string, fName: string) => {
    const parsed = parseCsvText(text);
    setDetectedHeaders(parsed.headers);
    const suggested = autoSuggestBankMapping(parsed.headers);
    setColumnMapping(suggested);

    if (!sessionName) {
      setSessionName(`Statement Import - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`);
    }

    setStep(2);
  };

  const handleValidateAndPreview = () => {
    if (!csvContent) return;
    setIsProcessing(true);

    try {
      const result = parseBankStatementCsv(csvContent, columnMapping);
      setParseResult(result);
      setStep(3);
    } catch (e: any) {
      alert(`CSV parsing failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    if (!parseResult || parseResult.validTransactions.length === 0) return;

    const opBal = parseFloat(openingBalance) || currentAccount?.openingBalance || 0;
    const clBal = parseFloat(closingBalance) || 0;
    const minDate = parseResult.detectedDateRange.start || new Date().toISOString().slice(0, 10);
    const maxDate = parseResult.detectedDateRange.end || new Date().toISOString().slice(0, 10);

    const txsWithIds = parseResult.validTransactions.map((tx, idx) => ({
      ...tx,
      id: `stmt-imp-${Date.now()}-${idx + 1}`,
      sessionId: '',
      accountId: selectedAccountId,
    }));

    const result = createReconciliationSession({
      accountId: selectedAccountId,
      sessionName: sessionName.trim() || `Reconciliation ${minDate} to ${maxDate}`,
      statementPeriodStart: minDate,
      statementPeriodEnd: maxDate,
      openingBalance: opBal,
      statementClosingBalance: clBal,
      status: 'in_progress',
      sourceFileName: fileName || 'uploaded_statement.csv',
      transactions: txsWithIds as any,
    });

    if (result.success && result.session) {
      // Run automatic initial pass match engine
      runSessionAutoMatch(result.session.id, 3);
      if (onImportComplete) {
        onImportComplete(result.session.id);
      }
      onClose();
    } else {
      alert(result.error || 'Failed to create reconciliation session.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                Step {step} of 3
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Bank Statement Ingestion Wizard</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload and validate bank statement files without credential exposure or cloud transmission.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* STEP 1: Select File & Account */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Target Bank Account</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      setSelectedAccountId(e.target.value);
                      const acc = bankAccounts.find((a) => a.id === e.target.value);
                      if (acc) setOpeningBalance(acc.openingBalance.toFixed(2));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-amber-400 text-xs"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.accountNumberMasked}) - {acc.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Session Name (Optional)</label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g. October 2026 Bank Reconciliation"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-amber-400 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Statement Opening Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-amber-400 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Starting balance from your physical or PDF statement</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Statement Closing Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-hidden focus:border-amber-400 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Target closing balance to reconcile against</p>
                </div>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 rounded-xl p-8 text-center transition-colors bg-slate-900/30">
                <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-200 text-sm">Upload Bank Statement CSV</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Supports standard CSV exports from Chase, SVB, Bank of America, Wells Fargo, etc.
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors">
                    <span>Select CSV File</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <span className="text-slate-500">or</span>

                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    Load Sample Statement (Chase)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 flex items-center gap-2.5">
                <FileText className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Detected <strong>{detectedHeaders.length} columns</strong> in file <em>"{fileName}"</em>. Please confirm field mappings below:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Posting Date Column *</label>
                  <select
                    value={columnMapping.date}
                    onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- Select Date Column --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Value Date Column (Optional)</label>
                  <select
                    value={columnMapping.valueDate || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, valueDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- None / Same as Posting Date --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description / Memo *</label>
                  <select
                    value={columnMapping.description}
                    onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- Select Description Column --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Counterparty / Payee</label>
                  <select
                    value={columnMapping.counterparty || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, counterparty: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- Extracted from Description --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Reference / Cheque #</label>
                  <select
                    value={columnMapping.reference || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, reference: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- Optional Reference Column --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Running Balance (Optional)</label>
                  <select
                    value={columnMapping.balance || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, balance: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">-- Optional Balance Column --</option>
                    {detectedHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount Mode Selector */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">Amount Representation</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={columnMapping.amountMode === 'split_debit_credit'}
                      onChange={() => setColumnMapping({ ...columnMapping, amountMode: 'split_debit_credit' })}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-slate-300">Separate Debit & Credit Columns</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={columnMapping.amountMode === 'single_signed'}
                      onChange={() => setColumnMapping({ ...columnMapping, amountMode: 'single_signed' })}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-slate-300">Single Amount Column (+/- signed)</span>
                  </label>
                </div>

                {columnMapping.amountMode === 'split_debit_credit' ? (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-slate-400 mb-1">Debit (Outflow / Money Out)</label>
                      <select
                        value={columnMapping.debit || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, debit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                      >
                        <option value="">-- Select Debit Column --</option>
                        {detectedHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Credit (Inflow / Money In)</label>
                      <select
                        value={columnMapping.credit || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, credit: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                      >
                        <option value="">-- Select Credit Column --</option>
                        {detectedHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-slate-400 mb-1">Amount Column</label>
                    <select
                      value={columnMapping.amount || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                    >
                      <option value="">-- Select Amount Column --</option>
                      {detectedHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Validation */}
          {step === 3 && parseResult && (
            <div className="space-y-4">
              {/* Validation Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Total Valid Rows</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {parseResult.validTransactions.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Ready for reconciliation</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Errors Detected</span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${parseResult.errors.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {parseResult.errors.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Rows skipped</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Duplicate Warnings</span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${parseResult.duplicateCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {parseResult.duplicateCount}
                  </div>
                  <span className="text-[10px] text-slate-500">Duplicate signatures</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Statement Period</span>
                  <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                    {parseResult.detectedDateRange.start} to {parseResult.detectedDateRange.end}
                  </div>
                  <span className="text-[10px] text-slate-500">Auto-detected range</span>
                </div>
              </div>

              {/* Errors callout if any */}
              {parseResult.errors.length > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 space-y-1">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>{parseResult.errors.length} rows have validation issues and will not be imported:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-300/80">
                    {parseResult.errors.slice(0, 3).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {parseResult.errors.length > 3 && (
                      <li>...and {parseResult.errors.length - 3} more errors.</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Transactions Preview Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-300">
                  Transaction Lines Preview (First 5 records)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-mono">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Counterparty</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Ref</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parseResult.validTransactions.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-mono text-slate-300">{row.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-200">{row.counterparty}</td>
                          <td className="py-2 px-3 text-slate-400 truncate max-w-[200px]">{row.description}</td>
                          <td className="py-2 px-3 font-mono text-slate-400">{row.reference || '-'}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                                row.type === 'debit'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {row.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-right font-bold text-slate-200">
                            ${row.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {step === 1 && (
              <button
                type="button"
                disabled={!csvContent}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-40"
              >
                <span>Continue to Column Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={!columnMapping.date || !columnMapping.description || isProcessing}
                onClick={handleValidateAndPreview}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Validate & Preview</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!parseResult || parseResult.validTransactions.length === 0}
                onClick={handleCommitImport}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Commit & Ingest into Session</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
