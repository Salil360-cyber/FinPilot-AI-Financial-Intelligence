import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinancialTransaction, ActivityEvent, KpiMetric } from '../types/finance';
import { ParsedInvoice, AuditLogEntry } from '../types/invoice';
import { SalesInvoice, InvoicePayment } from '../types/salesInvoice';
import {
  BankAccountProfile,
  ReconciliationSession,
  BankStatementTransaction,
  ReconciliationBalanceSummary,
} from '../types/reconciliation';
import { DEMO_TRANSACTIONS, DEMO_ACTIVITIES, DEMO_USER_PROFILE } from '../data/demoData';
import { DEMO_SALES_INVOICES } from '../data/demoSalesInvoices';
import { DEMO_BANK_ACCOUNTS, DEMO_RECONCILIATION_SESSIONS } from '../data/demoReconciliation';
import { validateLedgerTransaction } from '../services/ledgerValidator';
import {
  calculateSalesInvoiceTotals,
  computeSalesInvoiceStatus,
  validateSalesInvoiceForIssuing,
  generateUniqueInvoiceNumber,
  roundCurrency,
} from '../services/salesInvoiceCalculator';
import { formatCurrency } from '../services/currencyFormatter';
import {
  executeBatchMatchEngine,
  calculateReconciliationBalances,
  validateSessionCompletion,
} from '../services/reconciliationEngine';
import { ManualFinancialInputs } from '../types/analytics';
import { ForecastSnapshot, ScenarioDefinition } from '../types/forecast';
import { DEFAULT_SCENARIOS } from '../services/revenueForecastEngine';
import { ReportDocument } from '../types/annualReport';
import { DEMO_ANNUAL_REPORTS } from '../data/demoAnnualReports';

interface FinancialContextType {
  // Phase 1 - 3: General Ledger & Incoming Vendor Invoices
  transactions: FinancialTransaction[];
  recentActivities: ActivityEvent[];
  kpis: KpiMetric[];
  drafts: ParsedInvoice[];
  auditLogs: AuditLogEntry[];
  addApprovedInvoice: (invoice: ParsedInvoice, category?: string, account?: string) => { success: boolean; tx?: FinancialTransaction; error?: string };
  isInvoiceAlreadyApproved: (vendor: string, invoiceNumber: string) => { isApproved: boolean; txId?: string; existingTx?: FinancialTransaction };
  saveDraftInvoice: (invoice: ParsedInvoice) => void;
  deleteDraftInvoice: (id: string) => void;
  addManualTransaction: (txData: Omit<FinancialTransaction, 'id'>) => { success: boolean; tx?: FinancialTransaction; error?: string };
  editTransaction: (id: string, updates: Partial<FinancialTransaction>) => { success: boolean; error?: string };
  cancelTransaction: (id: string, reason: string) => { success: boolean; error?: string };
  importCsvTransactions: (newTxs: Omit<FinancialTransaction, 'id'>[], batchLabel?: string) => { successCount: number; rejectedCount: number; errors: string[] };
  addAuditLog: (action: any, details: string) => void;
  resetToDemoData: () => void;
  activeUploadInvoice: ParsedInvoice | null;
  setActiveUploadInvoice: (inv: ParsedInvoice | null) => void;

  // Phase 4: Outgoing Sales Invoices (Accounts Receivable)
  salesInvoices: SalesInvoice[];
  saveSalesInvoiceDraft: (draft: Partial<SalesInvoice>) => { success: boolean; invoice?: SalesInvoice; error?: string };
  issueSalesInvoice: (id: string) => { success: boolean; invoice?: SalesInvoice; error?: string };
  recordInvoicePayment: (id: string, paymentData: Omit<InvoicePayment, 'id' | 'recordedAt' | 'recordedBy'>) => { success: boolean; error?: string };
  duplicateSalesInvoice: (id: string) => { success: boolean; newInvoice?: SalesInvoice; error?: string };
  cancelSalesInvoice: (id: string, reason: string) => { success: boolean; error?: string };
  deleteSalesInvoiceDraft: (id: string) => { success: boolean; error?: string };
  updateSalesInvoice: (id: string, updates: Partial<SalesInvoice>) => { success: boolean; error?: string };

  // Phase 5: Bank Reconciliation & Transaction Matching
  bankAccounts: BankAccountProfile[];
  activeAccountId: string;
  setActiveAccountId: (id: string) => void;
  addBankAccountProfile: (account: BankAccountProfile) => { success: boolean; error?: string };
  updateBankAccountProfile: (id: string, updates: Partial<BankAccountProfile>) => { success: boolean; error?: string };

  reconciliationSessions: ReconciliationSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  activeSession: ReconciliationSession | undefined;
  activeSessionSummary: ReconciliationBalanceSummary | null;

  createReconciliationSession: (
    data: Omit<ReconciliationSession, 'id' | 'createdAt' | 'updatedAt'>
  ) => { success: boolean; session?: ReconciliationSession; error?: string };
  updateReconciliationSession: (id: string, updates: Partial<ReconciliationSession>) => { success: boolean; error?: string };
  deleteReconciliationSession: (id: string) => { success: boolean; error?: string };

  confirmBankMatch: (
    sessionId: string,
    bankTxId: string,
    ledgerTxId: string
  ) => { success: boolean; error?: string };
  unmatchBankTransaction: (sessionId: string, bankTxId: string) => { success: boolean; error?: string };
  excludeBankTransaction: (sessionId: string, bankTxId: string, reason: string) => { success: boolean; error?: string };
  restoreExcludedBankTransaction: (sessionId: string, bankTxId: string) => { success: boolean; error?: string };
  postUnmatchedBankTxToLedger: (
    sessionId: string,
    bankTxId: string,
    postData: {
      category: string;
      account: string;
      vendor: string;
      description?: string;
      entryType?: 'expense' | 'revenue' | 'credit_refund' | 'bank_movement';
    }
  ) => { success: boolean; tx?: FinancialTransaction; error?: string };
  runSessionAutoMatch: (
    sessionId: string,
    toleranceDays?: number
  ) => { exactCount: number; highConfidenceCount: number; conflicts: number };
  completeReconciliationSession: (sessionId: string) => { success: boolean; error?: string };
  reopenReconciliationSession: (sessionId: string, reason: string) => { success: boolean; error?: string };

  // Phase 6: Financial Analytics & Ratio Calculator
  manualFinancialInputs: ManualFinancialInputs;
  updateManualFinancialInputs: (inputs: Partial<ManualFinancialInputs>) => void;
  resetManualFinancialInputs: () => void;

  // Phase 7: Revenue Forecasting & Scenario Planning
  forecastSnapshots: ForecastSnapshot[];
  saveForecastSnapshot: (snapshot: ForecastSnapshot) => void;
  deleteForecastSnapshot: (id: string) => void;
  forecastScenarios: ScenarioDefinition[];
  updateForecastScenario: (scenario: ScenarioDefinition) => void;
  resetForecastScenarios: () => void;
  addForecastScenario: (scenario: ScenarioDefinition) => void;
  deleteForecastScenario: (id: string) => void;

  // Phase 8: Annual Report Intelligence
  annualReports: ReportDocument[];
  activeReportId: string | null;
  setActiveReportId: (id: string | null) => void;
  saveAnnualReport: (report: ReportDocument) => void;
  updateAnnualReport: (report: ReportDocument) => void;
  deleteAnnualReport: (id: string) => void;
  resetAnnualReports: () => void;
}

export const DEFAULT_MANUAL_FINANCIAL_INPUTS: ManualFinancialInputs = {
  asOfDate: '2026-10-27',
  currentAssets: 4120000,
  inventory: 640000,
  prepaidExpenses: 120000,
  currentLiabilities: 1702480,
  cashAndEquivalents: 2340000,
  totalAssets: 6850000,
  totalLiabilities: 3330000,
  totalDebt: 1200000,
  totalEquity: 3520000,
  cogs: undefined,
  beginningAssets: 6400000,
  endingAssets: 6850000,
  beginningEquity: 3200000,
  endingEquity: 3520000,
  beginningAr: 780000,
  endingAr: 820000,
  notes: 'Manual balance-sheet inputs prepared for internal controller review.',
  updatedAt: '2026-10-25T12:00:00.000Z',
};

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const LOCAL_STORAGE_TRANSACTIONS_KEY = 'finpilot_user_transactions_v3';
const LOCAL_STORAGE_DRAFTS_KEY = 'finpilot_invoice_drafts_v3';
const LOCAL_STORAGE_AUDIT_KEY = 'finpilot_audit_logs_v3';
const LOCAL_STORAGE_DEMO_OVERRIDES_KEY = 'finpilot_demo_overrides_v3';

// Phase 4 LocalStorage Keys
const LOCAL_STORAGE_SALES_INVOICES_KEY = 'finpilot_outgoing_invoices_v4';
const LOCAL_STORAGE_SALES_OVERRIDES_KEY = 'finpilot_sales_invoice_overrides_v4';

// Phase 5 LocalStorage Keys
const LOCAL_STORAGE_BANK_ACCOUNTS_KEY = 'finpilot_bank_accounts_v5';
const LOCAL_STORAGE_RECON_SESSIONS_KEY = 'finpilot_reconciliation_sessions_v5';
const LOCAL_STORAGE_ACTIVE_SESSION_KEY = 'finpilot_active_recon_session_v5';

// Phase 6 LocalStorage Key
const LOCAL_STORAGE_MANUAL_INPUTS_KEY = 'finpilot_manual_inputs_v6';

// Phase 7 LocalStorage Keys
const LOCAL_STORAGE_FORECAST_SNAPSHOTS_KEY = 'finpilot_forecast_snapshots_v7';
const LOCAL_STORAGE_FORECAST_SCENARIOS_KEY = 'finpilot_forecast_scenarios_v7';

// Phase 8 LocalStorage Keys
const LOCAL_STORAGE_ANNUAL_REPORTS_KEY = 'finpilot_annual_reports_v8';
const LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY = 'finpilot_active_report_id_v8';

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load user-created and imported transactions from localStorage
  const [userTransactions, setUserTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse stored transactions:', e);
      return [];
    }
  });

  // Overrides applied to demo records (edits, cancellations)
  const [demoOverrides, setDemoOverrides] = useState<Record<string, Partial<FinancialTransaction>>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DEMO_OVERRIDES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Load incoming vendor drafts
  const [drafts, setDrafts] = useState<ParsedInvoice[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DRAFTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Audit logs for session
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Working active incoming invoice being reviewed/edited
  const [activeUploadInvoice, setActiveUploadInvoice] = useState<ParsedInvoice | null>(null);

  // Phase 4: User-created outgoing sales invoices
  const [userSalesInvoices, setUserSalesInvoices] = useState<SalesInvoice[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SALES_INVOICES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Failed to parse stored sales invoices:', e);
      return [];
    }
  });

  // Phase 4: Overrides for demo sales invoices
  const [demoSalesOverrides, setDemoSalesOverrides] = useState<Record<string, Partial<SalesInvoice>>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SALES_OVERRIDES_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Phase 5: Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccountProfile[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BANK_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : DEMO_BANK_ACCOUNTS;
    } catch (e) {
      return DEMO_BANK_ACCOUNTS;
    }
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    return DEMO_BANK_ACCOUNTS[0]?.id || 'acct-chase-4092';
  });

  // Phase 5: Reconciliation Sessions State
  const [reconciliationSessions, setReconciliationSessions] = useState<ReconciliationSession[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_RECON_SESSIONS_KEY);
      return stored ? JSON.parse(stored) : DEMO_RECONCILIATION_SESSIONS;
    } catch (e) {
      return DEMO_RECONCILIATION_SESSIONS;
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
      if (stored) return stored;
    } catch (e) {
      // ignore
    }
    return DEMO_RECONCILIATION_SESSIONS[0]?.id || 'session-oct-2026';
  });

  // General Ledger Transactions (Phase 1-3)
  const transactions: FinancialTransaction[] = [
    ...userTransactions,
    ...DEMO_TRANSACTIONS.map((demo) => {
      const override = demoOverrides[demo.id] || {};
      return {
        ...demo,
        source: 'demo' as const,
        ledgerStatus: (override.ledgerStatus || 'posted') as any,
        ...override,
      };
    }),
  ];

  // Outgoing Sales Invoices (Phase 4)
  const salesInvoices: SalesInvoice[] = [
    ...userSalesInvoices.map((inv) => {
      const dynamicStatus = computeSalesInvoiceStatus(inv);
      return dynamicStatus !== inv.status ? { ...inv, status: dynamicStatus } : inv;
    }),
    ...DEMO_SALES_INVOICES.map((demo) => {
      const override = demoSalesOverrides[demo.id] || {};
      const combined = { ...demo, ...override };
      const dynamicStatus = computeSalesInvoiceStatus(combined);
      return { ...combined, status: dynamicStatus };
    }),
  ];

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS_KEY, JSON.stringify(userTransactions));
    } catch (e) {
      console.error('Error saving user transactions to localStorage:', e);
    }
  }, [userTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DEMO_OVERRIDES_KEY, JSON.stringify(demoOverrides));
    } catch (e) {
      console.error('Error saving demo overrides to localStorage:', e);
    }
  }, [demoOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFTS_KEY, JSON.stringify(drafts));
    } catch (e) {
      console.error('Error saving drafts to localStorage:', e);
    }
  }, [drafts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(auditLogs.slice(-200)));
    } catch (e) {
      console.error('Error saving audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SALES_INVOICES_KEY, JSON.stringify(userSalesInvoices));
    } catch (e) {
      console.error('Error saving user sales invoices to localStorage:', e);
    }
  }, [userSalesInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SALES_OVERRIDES_KEY, JSON.stringify(demoSalesOverrides));
    } catch (e) {
      console.error('Error saving demo sales overrides to localStorage:', e);
    }
  }, [demoSalesOverrides]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BANK_ACCOUNTS_KEY, JSON.stringify(bankAccounts));
    } catch (e) {
      console.error('Error saving bank accounts to localStorage:', e);
    }
  }, [bankAccounts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECON_SESSIONS_KEY, JSON.stringify(reconciliationSessions));
    } catch (e) {
      console.error('Error saving reconciliation sessions to localStorage:', e);
    }
  }, [reconciliationSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, activeSessionId);
    } catch (e) {
      console.error('Error saving active reconciliation session ID to localStorage:', e);
    }
  }, [activeSessionId]);

  // Phase 6: Manual Financial Inputs State
  const [manualFinancialInputs, setManualFinancialInputs] = useState<ManualFinancialInputs>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MANUAL_INPUTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.cogs === 1850000) {
          parsed.cogs = undefined;
        }
        return parsed;
      }
      return DEFAULT_MANUAL_FINANCIAL_INPUTS;
    } catch (e) {
      return DEFAULT_MANUAL_FINANCIAL_INPUTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MANUAL_INPUTS_KEY, JSON.stringify(manualFinancialInputs));
    } catch (e) {
      console.error('Error saving manual financial inputs to localStorage:', e);
    }
  }, [manualFinancialInputs]);

  const updateManualFinancialInputs = (updates: Partial<ManualFinancialInputs>) => {
    setManualFinancialInputs((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    addAuditLog('MANUAL_INPUTS_UPDATED', `Updated balance sheet inputs for as-of date ${updates.asOfDate || manualFinancialInputs.asOfDate}.`);
  };

  const resetManualFinancialInputs = () => {
    setManualFinancialInputs(DEFAULT_MANUAL_FINANCIAL_INPUTS);
    localStorage.removeItem(LOCAL_STORAGE_MANUAL_INPUTS_KEY);
    addAuditLog('MANUAL_INPUTS_RESET', 'Reset manual balance sheet inputs to initial baseline.');
  };

  // Phase 7: Forecast Snapshots & Scenarios State
  const [forecastSnapshots, setForecastSnapshots] = useState<ForecastSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORECAST_SNAPSHOTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [forecastScenarios, setForecastScenarios] = useState<ScenarioDefinition[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORECAST_SCENARIOS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SCENARIOS;
    } catch (e) {
      return DEFAULT_SCENARIOS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FORECAST_SNAPSHOTS_KEY, JSON.stringify(forecastSnapshots));
    } catch (e) {
      console.error('Error saving forecast snapshots to localStorage:', e);
    }
  }, [forecastSnapshots]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FORECAST_SCENARIOS_KEY, JSON.stringify(forecastScenarios));
    } catch (e) {
      console.error('Error saving forecast scenarios to localStorage:', e);
    }
  }, [forecastScenarios]);

  const saveForecastSnapshot = (snapshot: ForecastSnapshot) => {
    setForecastSnapshots((prev) => [snapshot, ...prev.filter((s) => s.id !== snapshot.id)]);
    addAuditLog('FORECAST_SNAPSHOT_SAVED', `Saved forecast snapshot "${snapshot.snapshotName}" (${snapshot.metric}, ${snapshot.horizonMonths}M horizon).`);
  };

  const deleteForecastSnapshot = (id: string) => {
    setForecastSnapshots((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('FORECAST_SNAPSHOT_DELETED', `Deleted forecast snapshot ${id}.`);
  };

  const updateForecastScenario = (scenario: ScenarioDefinition) => {
    setForecastScenarios((prev) => prev.map((s) => (s.id === scenario.id ? scenario : s)));
    addAuditLog('FORECAST_SCENARIO_UPDATED', `Updated scenario assumptions for "${scenario.name}".`);
  };

  const addForecastScenario = (scenario: ScenarioDefinition) => {
    setForecastScenarios((prev) => [...prev, scenario]);
    addAuditLog('FORECAST_SCENARIO_CREATED', `Created custom forecast scenario "${scenario.name}".`);
  };

  const deleteForecastScenario = (id: string) => {
    setForecastScenarios((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('FORECAST_SCENARIO_DELETED', `Removed forecast scenario ${id}.`);
  };

  const resetForecastScenarios = () => {
    setForecastScenarios(DEFAULT_SCENARIOS);
    localStorage.removeItem(LOCAL_STORAGE_FORECAST_SCENARIOS_KEY);
    addAuditLog('FORECAST_SCENARIOS_RESET', 'Reset scenario planning parameters to baseline system defaults.');
  };

  // Phase 8: Annual Report Intelligence State
  const [annualReports, setAnnualReports] = useState<ReportDocument[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ANNUAL_REPORTS_KEY);
      return stored ? JSON.parse(stored) : DEMO_ANNUAL_REPORTS;
    } catch (e) {
      return DEMO_ANNUAL_REPORTS;
    }
  });

  const [activeReportId, setActiveReportId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY);
      if (stored) return stored;
    } catch (e) {
      // ignore
    }
    return DEMO_ANNUAL_REPORTS[0]?.id || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ANNUAL_REPORTS_KEY, JSON.stringify(annualReports));
    } catch (e) {
      console.error('Error saving annual reports to localStorage:', e);
    }
  }, [annualReports]);

  useEffect(() => {
    try {
      if (activeReportId) {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY, activeReportId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY);
      }
    } catch (e) {
      console.error('Error saving active report ID to localStorage:', e);
    }
  }, [activeReportId]);

  const saveAnnualReport = (report: ReportDocument) => {
    setAnnualReports((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    setActiveReportId(report.id);
    addAuditLog('ANNUAL_REPORT_SAVED', `Saved annual report "${report.entityName} ${report.fiscalYear}".`);
  };

  const updateAnnualReport = (report: ReportDocument) => {
    setAnnualReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
    addAuditLog('ANNUAL_REPORT_UPDATED', `Updated review data for annual report "${report.entityName} ${report.fiscalYear}".`);
  };

  const deleteAnnualReport = (id: string) => {
    setAnnualReports((prev) => prev.filter((r) => r.id !== id));
    if (activeReportId === id) {
      const remaining = annualReports.filter((r) => r.id !== id);
      setActiveReportId(remaining[0]?.id || null);
    }
    addAuditLog('ANNUAL_REPORT_DELETED', `Deleted annual report ${id}.`);
  };

  const resetAnnualReports = () => {
    setAnnualReports(DEMO_ANNUAL_REPORTS);
    setActiveReportId(DEMO_ANNUAL_REPORTS[0]?.id || null);
    localStorage.removeItem(LOCAL_STORAGE_ANNUAL_REPORTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY);
    addAuditLog('ANNUAL_REPORTS_RESET', 'Reset annual reports to demonstration baseline.');
  };

  const addAuditLog = (action: any, details: string) => {
    const entry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      actor: DEMO_USER_PROFILE.name.split(',')[0],
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Vendor Invoice Verification (Phase 2)
  const isInvoiceAlreadyApproved = (vendor: string, invoiceNumber: string) => {
    if (!invoiceNumber || !invoiceNumber.trim()) return { isApproved: false };
    const normVendor = (vendor || '').trim().toLowerCase();
    const normInv = invoiceNumber.trim().toLowerCase();

    const existingTx = transactions.find((t) => {
      const matchInv = t.invoiceRef && t.invoiceRef.trim().toLowerCase() === normInv;
      if (!matchInv) return false;
      if (!normVendor) return true;
      return t.vendor.trim().toLowerCase().includes(normVendor) || normVendor.includes(t.vendor.trim().toLowerCase());
    });

    if (existingTx) {
      return { isApproved: true, txId: existingTx.id, existingTx };
    }
    return { isApproved: false };
  };

  const addApprovedInvoice = (
    invoice: ParsedInvoice,
    category: string = 'Operating Expenses',
    account: string = 'Chase Operating •••• 4092'
  ): { success: boolean; tx?: FinancialTransaction; error?: string } => {
    const invNumber = invoice.invoiceNumber.value;
    const vendor = invoice.vendorName.value || 'Unspecified Vendor';

    const check = isInvoiceAlreadyApproved(vendor, invNumber);
    if (check.isApproved) {
      return {
        success: false,
        error: `Invoice "${invNumber}" from ${vendor} is already posted to the General Ledger as voucher ${check.txId}.`,
      };
    }

    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: FinancialTransaction = {
      id: txId,
      date: invoice.invoiceDate.value || new Date().toISOString().slice(0, 10),
      vendor,
      category,
      account,
      amount: invoice.invoiceTotal.value,
      type: 'debit',
      status: 'matched',
      ledgerStatus: 'posted',
      entryType: 'expense',
      invoiceRef: invNumber,
      reconciliationNotes: `Automated posting from Phase 2 OCR extraction. File: ${invoice.fileName}`,
      confidenceScore: (invoice as any).confidenceScore,
      source: 'user_uploaded',
      sourceFileName: invoice.fileName,
      approvedAt: new Date().toISOString(),
      currency: invoice.currency.value || 'USD',
      subtotal: invoice.subtotal.value,
      taxAmount: invoice.taxAmount.value,
    };

    setUserTransactions((prev) => [newTx, ...prev]);
    setDrafts((prev) => prev.filter((d) => d.id !== invoice.id));

    addAuditLog(
      'INVOICE_APPROVED',
      `Approved invoice ${invNumber} from ${vendor} for ${invoice.currency.value || '$'}${invoice.invoiceTotal.value.toFixed(2)}. Posted to ledger as ${txId}.`
    );

    return { success: true, tx: newTx };
  };

  const addManualTransaction = (
    txData: Omit<FinancialTransaction, 'id'>
  ): { success: boolean; tx?: FinancialTransaction; error?: string } => {
    const val = validateLedgerTransaction(txData, transactions);
    if (!val.isValid) {
      return { success: false, error: val.errors.join(' ') };
    }

    const txId = `TX-MAN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: FinancialTransaction = {
      ...txData,
      id: txId,
      source: txData.source || 'manual_entry',
      ledgerStatus: txData.ledgerStatus || 'posted',
      status: txData.status || 'matched',
      currency: txData.currency || 'USD',
      confidenceScore: 1.0,
      reconciliationNotes: txData.reconciliationNotes || 'Created manually by Controller in General Ledger workbench.',
    };

    setUserTransactions((prev) => [newTx, ...prev]);
    addAuditLog('TRANSACTION_CREATED', `Manually created ${newTx.type} transaction ${txId} (${newTx.vendor}, $${newTx.amount.toFixed(2)})`);

    return { success: true, tx: newTx };
  };

  const editTransaction = (
    id: string,
    updates: Partial<FinancialTransaction>
  ): { success: boolean; error?: string } => {
    const isUserTx = userTransactions.some((t) => t.id === id);

    if (isUserTx) {
      setUserTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...updates,
            editedAt: new Date().toISOString(),
            editedFields: Object.keys(updates),
          };
        })
      );
    } else {
      setDemoOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...updates,
          editedAt: new Date().toISOString(),
          editedFields: Object.keys(updates),
        },
      }));
    }

    addAuditLog('TRANSACTION_EDITED', `Updated transaction ${id} fields: ${Object.keys(updates).join(', ')}`);
    return { success: true };
  };

  const cancelTransaction = (
    id: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A cancellation reason is required for financial audit compliance.' };
    }

    const cancellationData = {
      ledgerStatus: 'cancelled' as const,
      cancelledAt: new Date().toISOString(),
      cancelledReason: reason.trim(),
      cancelledBy: DEMO_USER_PROFILE.name.split(',')[0],
    };

    const isUserTx = userTransactions.some((t) => t.id === id);
    if (isUserTx) {
      setUserTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...cancellationData } : t))
      );
    } else {
      setDemoOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...cancellationData,
        },
      }));
    }

    addAuditLog('TRANSACTION_CANCELLED', `Cancelled transaction ${id}. Reason: "${reason.trim()}"`);
    return { success: true };
  };

  const importCsvTransactions = (
    newTxs: Omit<FinancialTransaction, 'id'>[],
    batchLabel?: string
  ): { successCount: number; rejectedCount: number; errors: string[] } => {
    let successCount = 0;
    let rejectedCount = 0;
    const errors: string[] = [];
    const validToAdd: FinancialTransaction[] = [];
    const batchId = `BATCH-${Date.now().toString(36)}`;

    newTxs.forEach((candidate, idx) => {
      const val = validateLedgerTransaction(candidate, [...transactions, ...validToAdd]);
      if (val.isValid) {
        const txId = `TX-CSV-${Math.floor(1000 + Math.random() * 9000)}`;
        validToAdd.push({
          ...candidate,
          id: txId,
          source: 'imported_bank_statement',
          ledgerStatus: 'posted',
          status: 'matched',
          confidenceScore: 1.0,
          importBatchId: batchId,
          reconciliationNotes: `Imported via CSV batch ${batchLabel || batchId}. Line #${idx + 1}.`,
        });
        successCount++;
      } else {
        rejectedCount++;
        errors.push(`Row ${idx + 1} (${candidate.vendor || 'Unknown'}): ${val.errors.join('; ')}`);
      }
    });

    if (validToAdd.length > 0) {
      setUserTransactions((prev) => [...validToAdd, ...prev]);
      addAuditLog('CSV_IMPORT', `Imported ${validToAdd.length} transactions from CSV statement batch "${batchLabel || batchId}". Rejected: ${rejectedCount}.`);
    }

    return { successCount, rejectedCount, errors };
  };

  const saveDraftInvoice = (invoice: ParsedInvoice) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.id === invoice.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = invoice;
        return updated;
      }
      return [invoice, ...prev];
    });
    addAuditLog('DRAFT_SAVED', `Saved incoming vendor draft invoice ${invoice.invoiceNumber.value || 'Untitled'}`);
  };

  const deleteDraftInvoice = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    addAuditLog('DRAFT_DELETED', `Deleted incoming vendor draft ${id}`);
  };

  // Phase 4: Outgoing Sales Invoice Operations
  const saveSalesInvoiceDraft = (
    draftData: Partial<SalesInvoice>
  ): { success: boolean; invoice?: SalesInvoice; error?: string } => {
    const existingId = draftData.id;
    const isExisting = existingId && userSalesInvoices.some((inv) => inv.id === existingId);

    const nowIso = new Date().toISOString();
    const invoiceId = existingId || `SINV-USER-${Date.now()}`;
    const invoiceNum =
      draftData.invoiceNumber?.trim() ||
      generateUniqueInvoiceNumber(salesInvoices, 'INV-2026-');

    const calculated = calculateSalesInvoiceTotals({
      items: draftData.items || [],
      taxConfig: draftData.taxConfig || { regime: 'none', label: 'No Tax', defaultRate: 0, isGst: false },
      invoiceDiscountType: draftData.invoiceDiscountType || 'percent',
      invoiceDiscountValue: draftData.invoiceDiscountValue || 0,
      additionalCharges: draftData.additionalCharges || 0,
      payments: draftData.payments || [],
    });

    const finalizedDraft: SalesInvoice = {
      id: invoiceId,
      invoiceNumber: invoiceNum,
      status: 'draft',
      issueDate: draftData.issueDate || nowIso.slice(0, 10),
      dueDate: draftData.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      currency: draftData.currency || 'USD',
      paymentTerms: draftData.paymentTerms || 'Net 30',
      seller: draftData.seller || {
        companyName: DEMO_USER_PROFILE.organization || 'Meridian Dynamics Corp',
        address: '100 Wall Street, Suite 2400, New York, NY 10005',
        email: DEMO_USER_PROFILE.email || 'billing@meridiandynamics.corp',
        phone: '+1 (212) 555-0192',
        taxId: 'US-EIN-12-9481920',
      },
      customer: draftData.customer || {
        customerName: '',
        billingAddress: '',
        email: '',
        phone: '',
      },
      items: calculated.items,
      invoiceDiscountType: draftData.invoiceDiscountType || 'percent',
      invoiceDiscountValue: draftData.invoiceDiscountValue || 0,
      taxConfig: draftData.taxConfig || { regime: 'none', label: 'No Tax', defaultRate: 0, isGst: false },
      additionalCharges: calculated.grandTotal > 0 ? draftData.additionalCharges || 0 : 0,
      additionalChargesLabel: draftData.additionalChargesLabel,
      notes: draftData.notes,
      paymentInstructions: draftData.paymentInstructions,
      subtotal: calculated.subtotal,
      totalLineDiscounts: calculated.totalLineDiscounts,
      invoiceDiscountAmount: calculated.invoiceDiscountAmount,
      taxableAmount: calculated.taxableAmount,
      taxBreakdown: calculated.taxBreakdown,
      totalTaxAmount: calculated.totalTaxAmount,
      grandTotal: calculated.grandTotal,
      amountPaid: calculated.amountPaid,
      outstandingBalance: calculated.outstandingBalance,
      payments: draftData.payments || [],
      createdAt: draftData.createdAt || nowIso,
      updatedAt: nowIso,
      source: 'user_created',
    };

    if (isExisting) {
      setUserSalesInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? finalizedDraft : inv))
      );
      addAuditLog('OUTGOING_INVOICE_DRAFT_UPDATED', `Updated sales invoice draft ${finalizedDraft.invoiceNumber}.`);
    } else {
      setUserSalesInvoices((prev) => [finalizedDraft, ...prev]);
      addAuditLog('OUTGOING_INVOICE_DRAFT_CREATED', `Created new sales invoice draft ${finalizedDraft.invoiceNumber}.`);
    }

    return { success: true, invoice: finalizedDraft };
  };

  const issueSalesInvoice = (
    id: string
  ): { success: boolean; invoice?: SalesInvoice; error?: string } => {
    const target = salesInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: `Invoice with ID "${id}" could not be found.` };
    }

    if (target.status !== 'draft' && target.issuedAt) {
      return { success: true, invoice: target };
    }

    const validation = validateSalesInvoiceForIssuing(target, salesInvoices);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const issuedAt = new Date().toISOString();
    const updatedInvoice: SalesInvoice = {
      ...target,
      status: 'issued',
      issuedAt,
      updatedAt: issuedAt,
    };

    const isUser = userSalesInvoices.some((inv) => inv.id === id);
    if (isUser) {
      setUserSalesInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
      );
    } else {
      setDemoSalesOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          status: 'issued',
          issuedAt,
          updatedAt: issuedAt,
        },
      }));
    }

    addAuditLog(
      'OUTGOING_INVOICE_ISSUED',
      `Issued customer sales invoice ${target.invoiceNumber} to ${target.customer.customerName} for ${target.currency} ${target.grandTotal.toFixed(2)}.`
    );

    return { success: true, invoice: updatedInvoice };
  };

  const recordInvoicePayment = (
    id: string,
    paymentData: Omit<InvoicePayment, 'id' | 'recordedAt' | 'recordedBy'>
  ): { success: boolean; error?: string } => {
    const target = salesInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: 'Invoice not found.' };
    }

    if (target.status === 'draft') {
      return { success: false, error: 'Cannot record payments against an unissued draft invoice.' };
    }

    if (target.status === 'cancelled') {
      return { success: false, error: 'Cannot record payments against a voided/cancelled invoice.' };
    }

    if (isNaN(paymentData.amount) || paymentData.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    const maxPayable = roundCurrency(target.outstandingBalance);
    const incomingAmt = roundCurrency(paymentData.amount);
    if (incomingAmt > maxPayable + 0.005) {
      return {
        success: false,
        error: `Payment amount (${target.currency} ${incomingAmt.toFixed(2)}) exceeds remaining balance (${target.currency} ${maxPayable.toFixed(2)}).`,
      };
    }

    const nowIso = new Date().toISOString();
    const newPayment: InvoicePayment = {
      ...paymentData,
      id: `PAY-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      amount: incomingAmt,
      recordedAt: nowIso,
      recordedBy: `${DEMO_USER_PROFILE.name.split(',')[0]} (Controller)`,
    };

    const updatedPayments = [...(target.payments || []), newPayment];
    const newAmountPaid = roundCurrency(updatedPayments.reduce((sum, p) => sum + p.amount, 0));
    const newBalance = roundCurrency(Math.max(0, target.grandTotal - newAmountPaid));

    const updatedInvoicePartial: Partial<SalesInvoice> = {
      payments: updatedPayments,
      amountPaid: newAmountPaid,
      outstandingBalance: newBalance,
      updatedAt: nowIso,
    };

    const newStatus = computeSalesInvoiceStatus({
      ...target,
      ...updatedInvoicePartial,
    });
    updatedInvoicePartial.status = newStatus;

    const isUser = userSalesInvoices.some((inv) => inv.id === id);
    if (isUser) {
      setUserSalesInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...updatedInvoicePartial } : inv))
      );
    } else {
      setDemoSalesOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...updatedInvoicePartial,
        },
      }));
    }

    addAuditLog(
      'OUTGOING_INVOICE_PAYMENT_RECORDED',
      `Recorded payment of ${target.currency} ${incomingAmt.toFixed(2)} on invoice ${target.invoiceNumber}.`
    );

    return { success: true };
  };

  const duplicateSalesInvoice = (
    id: string
  ): { success: boolean; newInvoice?: SalesInvoice; error?: string } => {
    const target = salesInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: 'Source invoice not found.' };
    }

    const nowIso = new Date().toISOString();
    const newInvNum = generateUniqueInvoiceNumber(salesInvoices, 'INV-2026-');
    const newId = `SINV-USER-${Date.now()}`;

    const duplicated: SalesInvoice = {
      ...target,
      id: newId,
      invoiceNumber: newInvNum,
      status: 'draft',
      issueDate: nowIso.slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      payments: [],
      amountPaid: 0,
      outstandingBalance: target.grandTotal,
      createdAt: nowIso,
      updatedAt: nowIso,
      issuedAt: undefined,
      cancelledAt: undefined,
      cancelledReason: undefined,
      cancelledBy: undefined,
      source: 'user_created',
    };

    setUserSalesInvoices((prev) => [duplicated, ...prev]);
    addAuditLog('OUTGOING_INVOICE_DUPLICATED', `Duplicated invoice ${target.invoiceNumber} as new draft ${newInvNum}.`);
    return { success: true, newInvoice: duplicated };
  };

  const cancelSalesInvoice = (
    id: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A cancellation reason is required for accounting audit compliance.' };
    }

    const target = salesInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: 'Invoice not found.' };
    }

    const nowIso = new Date().toISOString();
    const cancellationData = {
      status: 'cancelled' as const,
      cancelledAt: nowIso,
      cancelledReason: reason.trim(),
      cancelledBy: DEMO_USER_PROFILE.name.split(',')[0],
      updatedAt: nowIso,
    };

    const isUser = userSalesInvoices.some((inv) => inv.id === id);
    if (isUser) {
      setUserSalesInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, ...cancellationData } : inv))
      );
    } else {
      setDemoSalesOverrides((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          ...cancellationData,
        },
      }));
    }

    addAuditLog('OUTGOING_INVOICE_CANCELLED', `Cancelled sales invoice ${target.invoiceNumber}. Reason: "${reason.trim()}"`);
    return { success: true };
  };

  const deleteSalesInvoiceDraft = (
    id: string
  ): { success: boolean; error?: string } => {
    const target = salesInvoices.find((inv) => inv.id === id);
    if (!target) {
      return { success: false, error: 'Draft invoice not found.' };
    }

    if (target.status !== 'draft') {
      return {
        success: false,
        error: 'Only unissued draft invoices may be deleted. Issued invoices must be formally cancelled with an audit reason.',
      };
    }

    setUserSalesInvoices((prev) => prev.filter((inv) => inv.id !== id));
    addAuditLog('OUTGOING_INVOICE_DRAFT_DELETED', `Deleted unissued draft invoice ${target.invoiceNumber}.`);
    return { success: true };
  };

  const updateSalesInvoice = (
    id: string,
    updates: Partial<SalesInvoice>
  ): { success: boolean; error?: string } => {
    const isUser = userSalesInvoices.some((inv) => inv.id === id);
    if (!isUser) {
      return { success: false, error: 'Demo invoices cannot be directly modified without duplicating.' };
    }

    setUserSalesInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        const merged = { ...inv, ...updates, updatedAt: new Date().toISOString() };
        const calculated = calculateSalesInvoiceTotals({
          items: merged.items,
          taxConfig: merged.taxConfig,
          invoiceDiscountType: merged.invoiceDiscountType,
          invoiceDiscountValue: merged.invoiceDiscountValue,
          additionalCharges: merged.additionalCharges,
          payments: merged.payments,
        });
        return { ...merged, ...calculated };
      })
    );

    return { success: true };
  };

  // ==========================================
  // Phase 5: Bank Reconciliation & Profiles
  // ==========================================

  const addBankAccountProfile = (
    account: BankAccountProfile
  ): { success: boolean; error?: string } => {
    if (!account.name || !account.accountNumberMasked) {
      return { success: false, error: 'Account name and account number are required.' };
    }
    setBankAccounts((prev) => [...prev, account]);
    addAuditLog('BANK_ACCOUNT_CREATED', `Added bank profile "${account.name}" (${account.bankName} ${account.accountNumberMasked}).`);
    return { success: true };
  };

  const updateBankAccountProfile = (
    id: string,
    updates: Partial<BankAccountProfile>
  ): { success: boolean; error?: string } => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
    addAuditLog('BANK_ACCOUNT_UPDATED', `Updated bank profile "${id}".`);
    return { success: true };
  };

  const createReconciliationSession = (
    data: Omit<ReconciliationSession, 'id' | 'createdAt' | 'updatedAt'>
  ): { success: boolean; session?: ReconciliationSession; error?: string } => {
    const nowIso = new Date().toISOString();
    const sessionId = `session-${Date.now().toString(36)}`;
    const newSession: ReconciliationSession = {
      ...data,
      id: sessionId,
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setReconciliationSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(sessionId);
    addAuditLog('RECONCILIATION_SESSION_CREATED', `Created reconciliation session "${newSession.sessionName}" for account ${newSession.accountId}.`);
    return { success: true, session: newSession };
  };

  const updateReconciliationSession = (
    id: string,
    updates: Partial<ReconciliationSession>
  ): { success: boolean; error?: string } => {
    setReconciliationSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
    return { success: true };
  };

  const deleteReconciliationSession = (
    id: string
  ): { success: boolean; error?: string } => {
    setReconciliationSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = reconciliationSessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      }
    }
    addAuditLog('RECONCILIATION_SESSION_DELETED', `Deleted session "${id}".`);
    return { success: true };
  };

  const confirmBankMatch = (
    sessionId: string,
    bankTxId: string,
    ledgerTxId: string
  ): { success: boolean; error?: string } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const bankTx = session.transactions.find((t) => t.id === bankTxId);
    if (!bankTx) return { success: false, error: 'Bank statement transaction not found.' };

    const ledgerTx = transactions.find((t) => t.id === ledgerTxId);
    if (!ledgerTx) return { success: false, error: 'General Ledger transaction not found.' };

    // Update bank statement transaction
    const updatedTx: BankStatementTransaction = {
      ...bankTx,
      matchStatus: 'manually_matched',
      matchedLedgerTxId: ledgerTxId,
      matchedLedgerTx: ledgerTx,
      matchConfidence: 100,
      matchSignals: [
        `Manually matched by Controller (${DEMO_USER_PROFILE.name.split(',')[0]})`,
        `Linked to GL Voucher ${ledgerTxId} (${ledgerTx.vendor}, $${ledgerTx.amount.toFixed(2)})`,
      ],
    };

    // Update GL transaction status to matched
    editTransaction(ledgerTxId, {
      status: 'matched',
      reconciliationNotes: `Matched with bank statement line ${bankTx.reference || bankTx.id} ($${bankTx.amount.toFixed(2)}) on ${bankTx.date}.`,
    });

    // Update session
    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          transactions: s.transactions.map((t) => (t.id === bankTxId ? updatedTx : t)),
        };
      })
    );

    addAuditLog(
      'TRANSACTION_RECONCILED',
      `Reconciled bank line "${bankTx.description}" ($${bankTx.amount.toFixed(2)}) with GL voucher ${ledgerTxId}.`
    );

    return { success: true };
  };

  const unmatchBankTransaction = (
    sessionId: string,
    bankTxId: string
  ): { success: boolean; error?: string } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const bankTx = session.transactions.find((t) => t.id === bankTxId);
    if (!bankTx) return { success: false, error: 'Bank transaction not found.' };

    const prevLedgerId = bankTx.matchedLedgerTxId;

    const updatedTx: BankStatementTransaction = {
      ...bankTx,
      matchStatus: 'unmatched',
      matchedLedgerTxId: undefined,
      matchedLedgerTx: undefined,
      matchConfidence: 0,
      matchSignals: ['Match removed by Controller.'],
    };

    // If previously linked GL voucher is not used elsewhere, revert its status
    if (prevLedgerId) {
      editTransaction(prevLedgerId, {
        status: 'unmatched',
        reconciliationNotes: 'Unlinked from bank statement during reconciliation adjustment.',
      });
    }

    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          transactions: s.transactions.map((t) => (t.id === bankTxId ? updatedTx : t)),
        };
      })
    );

    addAuditLog('TRANSACTION_UNMATCHED', `Unlinked bank transaction "${bankTx.description}" ($${bankTx.amount.toFixed(2)}).`);
    return { success: true };
  };

  const excludeBankTransaction = (
    sessionId: string,
    bankTxId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A justification reason is required to exclude bank transactions.' };
    }

    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const bankTx = session.transactions.find((t) => t.id === bankTxId);
    if (!bankTx) return { success: false, error: 'Bank transaction not found.' };

    // If it was previously matched, free up the GL voucher
    if (bankTx.matchedLedgerTxId) {
      editTransaction(bankTx.matchedLedgerTxId, { status: 'unmatched' });
    }

    const nowIso = new Date().toISOString();
    const updatedTx: BankStatementTransaction = {
      ...bankTx,
      matchStatus: 'excluded',
      matchedLedgerTxId: undefined,
      matchedLedgerTx: undefined,
      exclusionReason: reason.trim(),
      excludedAt: nowIso,
      excludedBy: DEMO_USER_PROFILE.name.split(',')[0],
      matchSignals: [`Excluded from reconciliation: "${reason.trim()}"`],
    };

    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: nowIso,
          transactions: s.transactions.map((t) => (t.id === bankTxId ? updatedTx : t)),
        };
      })
    );

    addAuditLog(
      'TRANSACTION_EXCLUDED',
      `Excluded bank transaction "${bankTx.description}" ($${bankTx.amount.toFixed(2)}). Reason: "${reason.trim()}".`
    );

    return { success: true };
  };

  const restoreExcludedBankTransaction = (
    sessionId: string,
    bankTxId: string
  ): { success: boolean; error?: string } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const bankTx = session.transactions.find((t) => t.id === bankTxId);
    if (!bankTx) return { success: false, error: 'Bank transaction not found.' };

    const updatedTx: BankStatementTransaction = {
      ...bankTx,
      matchStatus: 'unmatched',
      exclusionReason: undefined,
      excludedAt: undefined,
      excludedBy: undefined,
      matchSignals: ['Restored to active reconciliation pool.'],
    };

    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          transactions: s.transactions.map((t) => (t.id === bankTxId ? updatedTx : t)),
        };
      })
    );

    addAuditLog('TRANSACTION_RESTORED', `Restored previously excluded bank line "${bankTx.description}".`);
    return { success: true };
  };

  const postUnmatchedBankTxToLedger = (
    sessionId: string,
    bankTxId: string,
    postData: {
      category: string;
      account: string;
      vendor: string;
      description?: string;
      entryType?: 'expense' | 'revenue' | 'credit_refund' | 'bank_movement';
    }
  ): { success: boolean; tx?: FinancialTransaction; error?: string } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const bankTx = session.transactions.find((t) => t.id === bankTxId);
    if (!bankTx) return { success: false, error: 'Bank transaction not found.' };

    const glTxType: 'debit' | 'credit' = bankTx.type === 'debit' ? 'debit' : 'credit';
    const entryType = postData.entryType || (glTxType === 'debit' ? 'expense' : 'revenue');

    const txId = `TX-REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLedgerTx: FinancialTransaction = {
      id: txId,
      date: bankTx.date,
      vendor: postData.vendor.trim() || bankTx.counterparty || 'Bank Counterparty',
      category: postData.category,
      account: postData.account,
      amount: bankTx.amount,
      type: glTxType,
      status: 'matched',
      ledgerStatus: 'posted',
      entryType,
      description: postData.description || bankTx.description,
      invoiceRef: bankTx.reference || `STMT-${bankTx.id}`,
      reconciliationNotes: `Reconciliation posting generated from bank line "${bankTx.description}". Reference: ${bankTx.reference || 'None'}.`,
      confidenceScore: 1.0,
      source: 'imported_bank_statement',
      currency: 'USD',
      sourceFileName: session.sourceFileName,
      approvedAt: new Date().toISOString(),
    };

    // Add to General Ledger
    setUserTransactions((prev) => [newLedgerTx, ...prev]);

    // Mark bank transaction as matched and linked to this newly created GL entry
    const nowIso = new Date().toISOString();
    const updatedBankTx: BankStatementTransaction = {
      ...bankTx,
      matchStatus: 'manually_matched',
      matchedLedgerTxId: txId,
      matchedLedgerTx: newLedgerTx,
      postedToLedgerTxId: txId,
      postedAt: nowIso,
      matchConfidence: 100,
      matchSignals: [`Explicitly posted to GL as voucher ${txId} (${newLedgerTx.category}).`],
    };

    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: nowIso,
          transactions: s.transactions.map((t) => (t.id === bankTxId ? updatedBankTx : t)),
        };
      })
    );

    addAuditLog(
      'TRANSACTION_POSTED_AND_RECONCILED',
      `Posted bank statement line "${bankTx.description}" ($${bankTx.amount.toFixed(2)}) directly to General Ledger as ${txId} and reconciled.`
    );

    return { success: true, tx: newLedgerTx };
  };

  const runSessionAutoMatch = (
    sessionId: string,
    toleranceDays: number = 3
  ): { exactCount: number; highConfidenceCount: number; conflicts: number } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { exactCount: 0, highConfidenceCount: 0, conflicts: 0 };

    const result = executeBatchMatchEngine(session.transactions, transactions, toleranceDays);

    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          updatedAt: new Date().toISOString(),
          transactions: result.updatedTransactions,
        };
      })
    );

    addAuditLog(
      'AUTO_MATCH_EXECUTED',
      `Executed batch match engine on "${session.sessionName}". Cleared ${result.newExactMatches + result.newHighConfidence} items, identified ${result.conflicts} conflicts.`
    );

    return {
      exactCount: result.newExactMatches,
      highConfidenceCount: result.newHighConfidence,
      conflicts: result.conflicts,
    };
  };

  const completeReconciliationSession = (
    sessionId: string
  ): { success: boolean; error?: string } => {
    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const validation = validateSessionCompletion(session, transactions);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    const nowIso = new Date().toISOString();
    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          status: 'completed',
          completedAt: nowIso,
          completedBy: DEMO_USER_PROFILE.name.split(',')[0],
          updatedAt: nowIso,
        };
      })
    );

    addAuditLog(
      'RECONCILIATION_SESSION_COMPLETED',
      `Reconciliation session "${session.sessionName}" successfully balanced and officially closed by ${DEMO_USER_PROFILE.name.split(',')[0]}.`
    );

    return { success: true };
  };

  const reopenReconciliationSession = (
    sessionId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A justification reason is required to reopen a closed reconciliation session.' };
    }

    const session = reconciliationSessions.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Session not found.' };

    const nowIso = new Date().toISOString();
    setReconciliationSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          status: 'reopened',
          reopenedAt: nowIso,
          reopenedReason: reason.trim(),
          reopenedBy: DEMO_USER_PROFILE.name.split(',')[0],
          updatedAt: nowIso,
        };
      })
    );

    addAuditLog(
      'RECONCILIATION_SESSION_REOPENED',
      `Reconciliation session "${session.sessionName}" reopened. Reason: "${reason.trim()}".`
    );

    return { success: true };
  };

  const resetToDemoData = () => {
    setUserTransactions([]);
    setDemoOverrides({});
    setDrafts([]);
    setUserSalesInvoices([]);
    setDemoSalesOverrides({});
    setBankAccounts(DEMO_BANK_ACCOUNTS);
    setReconciliationSessions(DEMO_RECONCILIATION_SESSIONS);
    setActiveSessionId(DEMO_RECONCILIATION_SESSIONS[0]?.id || 'session-oct-2026');

    localStorage.removeItem(LOCAL_STORAGE_TRANSACTIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_DEMO_OVERRIDES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_DRAFTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SALES_INVOICES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SALES_OVERRIDES_KEY);
    localStorage.removeItem(LOCAL_STORAGE_BANK_ACCOUNTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_RECON_SESSIONS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MANUAL_INPUTS_KEY);
    setManualFinancialInputs(DEFAULT_MANUAL_FINANCIAL_INPUTS);

    setForecastSnapshots([]);
    setForecastScenarios(DEFAULT_SCENARIOS);
    localStorage.removeItem(LOCAL_STORAGE_FORECAST_SNAPSHOTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_FORECAST_SCENARIOS_KEY);

    setAnnualReports(DEMO_ANNUAL_REPORTS);
    setActiveReportId(DEMO_ANNUAL_REPORTS[0]?.id || null);
    localStorage.removeItem(LOCAL_STORAGE_ANNUAL_REPORTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ACTIVE_REPORT_ID_KEY);

    addAuditLog('FILE_SELECTED', 'Reset ledger, sales invoices, bank profiles, reconciliation sessions, balance sheet inputs, forecast scenarios, and annual reports to default demonstration state.');
  };

  // Compute live KPIs
  const activeTransactions = transactions.filter((t) => t.ledgerStatus !== 'cancelled');
  const currentTotalExpenses = activeTransactions
    .filter((t) => t.type === 'debit')
    .reduce((acc, t) => roundCurrency(acc + t.amount), 0);
  const processedInvoicesCount = activeTransactions.filter((t) => Boolean(t.invoiceRef)).length;
  const matchedCount = activeTransactions.filter((t) => t.status === 'matched').length;
  const currentReconciliationRate =
    activeTransactions.length > 0 ? ((matchedCount / activeTransactions.length) * 100).toFixed(1) : '0.0';
  const outstandingCount = activeTransactions.filter((t) => t.status !== 'matched').length;

  const kpis: KpiMetric[] = [
    {
      id: 'total-expenses',
      label: 'Total Expenses (YTD)',
      value: formatCurrency(currentTotalExpenses),
      rawValue: currentTotalExpenses,
      change: userTransactions.length > 0 ? `+${userTransactions.filter((t) => t.ledgerStatus !== 'cancelled').length} user records` : '',
      changeType: 'neutral',
      timeframe: 'FY 2026 Active Ledger',
      subtext: `Aggregates ${activeTransactions.filter((t) => t.type === 'debit').length} active general ledger debit postings`,
    },
    {
      id: 'processed-invoices',
      label: 'Processed Invoices',
      value: processedInvoicesCount.toString(),
      rawValue: processedInvoicesCount,
      change: userTransactions.length > 0 ? `+${userTransactions.length} added` : '',
      changeType: 'neutral',
      timeframe: 'Current Period',
      subtext: `${processedInvoicesCount} invoices linked in General Ledger`,
    },
    {
      id: 'reconciliation-rate',
      label: 'Reconciliation Rate',
      value: `${currentReconciliationRate}%`,
      rawValue: parseFloat(currentReconciliationRate),
      change: '',
      changeType: 'neutral',
      timeframe: 'Active Ledger',
      subtext: `${matchedCount} of ${activeTransactions.length} active ledger lines cleared`,
    },
    {
      id: 'outstanding-items',
      label: 'Outstanding Items',
      value: outstandingCount.toString(),
      rawValue: outstandingCount,
      change: `${outstandingCount} require review`,
      changeType: outstandingCount > 0 ? 'neutral' : 'positive',
      timeframe: 'Pending resolution',
      subtext: 'Includes unmatched bank entries and review flags',
    },
  ];

  // Activities feed
  const recentActivities: ActivityEvent[] = [
    ...userTransactions.slice(0, 3).map((tx) => ({
      id: `act-user-${tx.id}`,
      title: `${tx.source === 'user_uploaded' ? 'Invoice Approved' : tx.source === 'imported_bank_statement' ? 'Bank Reconciliation Line' : 'Manual Ledger Entry'} (${tx.invoiceRef || tx.id})`,
      description: `${tx.vendor}: $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${tx.type === 'debit' ? 'debited to' : 'credited to'} ${tx.account}.`,
      timestamp: 'Just now',
      type: 'reconciliation' as const,
      user: DEMO_USER_PROFILE.name.split(',')[0],
      status: tx.ledgerStatus === 'cancelled' ? ('flagged' as const) : ('completed' as const),
    })),
    ...DEMO_ACTIVITIES,
  ];

  // Active session and balance summary
  const activeSession = reconciliationSessions.find((s) => s.id === activeSessionId);
  const activeSessionSummary = activeSession ? calculateReconciliationBalances(activeSession, transactions) : null;

  return (
    <FinancialContext.Provider
      value={{
        transactions,
        recentActivities,
        kpis,
        drafts,
        auditLogs,
        addApprovedInvoice,
        isInvoiceAlreadyApproved,
        saveDraftInvoice,
        deleteDraftInvoice,
        addManualTransaction,
        editTransaction,
        cancelTransaction,
        importCsvTransactions,
        addAuditLog,
        resetToDemoData,
        activeUploadInvoice,
        setActiveUploadInvoice,

        // Phase 4
        salesInvoices,
        saveSalesInvoiceDraft,
        issueSalesInvoice,
        recordInvoicePayment,
        duplicateSalesInvoice,
        cancelSalesInvoice,
        deleteSalesInvoiceDraft,
        updateSalesInvoice,

        // Phase 5
        bankAccounts,
        activeAccountId,
        setActiveAccountId,
        addBankAccountProfile,
        updateBankAccountProfile,

        reconciliationSessions,
        activeSessionId,
        setActiveSessionId,
        activeSession,
        activeSessionSummary,
        createReconciliationSession,
        updateReconciliationSession,
        deleteReconciliationSession,

        confirmBankMatch,
        unmatchBankTransaction,
        excludeBankTransaction,
        restoreExcludedBankTransaction,
        postUnmatchedBankTxToLedger,
        runSessionAutoMatch,
        completeReconciliationSession,
        reopenReconciliationSession,

        // Phase 6
        manualFinancialInputs,
        updateManualFinancialInputs,
        resetManualFinancialInputs,

        // Phase 7
        forecastSnapshots,
        saveForecastSnapshot,
        deleteForecastSnapshot,
        forecastScenarios,
        updateForecastScenario,
        resetForecastScenarios,
        addForecastScenario,
        deleteForecastScenario,

        // Phase 8
        annualReports,
        activeReportId,
        setActiveReportId,
        saveAnnualReport,
        updateAnnualReport,
        deleteAnnualReport,
        resetAnnualReports,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const useFinancialContext = useFinancial;
