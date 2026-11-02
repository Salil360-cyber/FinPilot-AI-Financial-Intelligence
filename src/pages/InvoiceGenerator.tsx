import React, { useState, useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { SalesInvoice, SalesInvoiceStatus } from '../types/salesInvoice';
import { SalesInvoiceForm } from '../components/invoice-generator/SalesInvoiceForm';
import { SalesInvoicePreview } from '../components/invoice-generator/SalesInvoicePreview';
import { RecordPaymentModal } from '../components/invoice-generator/RecordPaymentModal';
import { CancelInvoiceModal } from '../components/invoice-generator/CancelInvoiceModal';
import { exportSalesInvoicesSummaryToCsv } from '../components/invoice-generator/SalesInvoiceExport';
import { runPhase4TestSuite, Phase4TestResult } from '../services/phase4TestSuite';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Download,
  Copy,
  Edit3,
  Trash2,
  XCircle,
  ShieldCheck,
  PlayCircle,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CreditCard,
  Eye,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { roundCurrency } from '../services/salesInvoiceCalculator';

type WorkspaceView = 'list' | 'create' | 'edit' | 'preview';
type SortColumn = 'invoiceNumber' | 'customer' | 'issueDate' | 'dueDate' | 'grandTotal' | 'status';
type SortDirection = 'asc' | 'desc';

export const InvoiceGenerator: React.FC = () => {
  const {
    salesInvoices,
    saveSalesInvoiceDraft,
    issueSalesInvoice,
    recordInvoicePayment,
    duplicateSalesInvoice,
    cancelSalesInvoice,
    deleteSalesInvoiceDraft,
    transactions,
  } = useFinancial();

  // Active View Navigation
  const [currentView, setCurrentView] = useState<WorkspaceView>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SalesInvoiceStatus>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('issueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<SalesInvoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<SalesInvoice | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Automated Phase 4 Test Suite Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Phase4TestResult[] | null>(null);

  // Unique currencies in the dataset
  const currencies = useMemo(() => {
    const set = new Set(salesInvoices.map((inv) => inv.currency).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [salesInvoices]);

  // Overall Financial Overview KPI Metrics (for non-cancelled invoices)
  const overviewMetrics = useMemo(() => {
    // Separate metrics strictly per currency — never mix or sum different currency amounts
    const byCurrency: Record<
      string,
      {
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
        overdueCount: number;
        overdueAmount: number;
        activeCount: number;
      }
    > = {};
    let draftCount = 0;

    salesInvoices.forEach((inv) => {
      if (inv.status === 'cancelled') return;

      if (inv.status === 'draft') {
        draftCount++;
        return;
      }

      const curr = inv.currency || 'USD';
      if (!byCurrency[curr]) {
        byCurrency[curr] = {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          overdueCount: 0,
          overdueAmount: 0,
          activeCount: 0,
        };
      }

      byCurrency[curr].totalInvoiced = roundCurrency(byCurrency[curr].totalInvoiced + inv.grandTotal);
      byCurrency[curr].totalPaid = roundCurrency(byCurrency[curr].totalPaid + inv.amountPaid);
      byCurrency[curr].totalOutstanding = roundCurrency(byCurrency[curr].totalOutstanding + inv.outstandingBalance);
      byCurrency[curr].activeCount++;

      if (inv.status === 'overdue') {
        byCurrency[curr].overdueCount++;
        byCurrency[curr].overdueAmount = roundCurrency(byCurrency[curr].overdueAmount + inv.outstandingBalance);
      }
    });

    const usd = byCurrency['USD'] || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      overdueCount: 0,
      overdueAmount: 0,
      activeCount: 0,
    };

    const inr = byCurrency['INR'] || {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      overdueCount: 0,
      overdueAmount: 0,
      activeCount: 0,
    };

    return {
      usd,
      inr,
      byCurrency,
      draftCount,
    };
  }, [salesInvoices]);

  // Filtering
  const filteredInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;

      // Currency filter
      if (currencyFilter !== 'all' && inv.currency !== currencyFilter) return false;

      // Date range filter (issueDate)
      if (startDate && inv.issueDate < startDate) return false;
      if (endDate && inv.issueDate > endDate) return false;

      // Text search (invoiceNumber, customerName, poNumber)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNum = inv.invoiceNumber.toLowerCase().includes(term);
        const matchCust = inv.customer.customerName.toLowerCase().includes(term);
        const matchPo = inv.customer.poNumber && inv.customer.poNumber.toLowerCase().includes(term);
        if (!matchNum && !matchCust && !matchPo) return false;
      }

      return true;
    });
  }, [salesInvoices, statusFilter, currencyFilter, startDate, endDate, searchTerm]);

  // Sorting
  const sortedInvoices = useMemo(() => {
    const list = [...filteredInvoices];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'invoiceNumber':
          cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'customer':
          cmp = a.customer.customerName.localeCompare(b.customer.customerName);
          break;
        case 'issueDate':
          cmp = a.issueDate.localeCompare(b.issueDate);
          break;
        case 'dueDate':
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'grandTotal':
          cmp = a.grandTotal - b.grandTotal;
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredInvoices, sortColumn, sortDirection]);

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    currencyFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCurrencyFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  // Actions
  const handleOpenPreview = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setCurrentView('preview');
  };

  const handleOpenEdit = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setCurrentView('edit');
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setCurrentView('create');
  };

  const handleDuplicate = (id: string) => {
    const res = duplicateSalesInvoice(id);
    if (res.success && res.newInvoice) {
      setSelectedInvoice(res.newInvoice);
      setCurrentView('edit');
    }
  };

  const handleRunTests = async () => {
    setShowTestModal(true);
    setIsRunningTests(true);
    try {
      const results = await runPhase4TestSuite(salesInvoices, transactions);
      setTestResults(results);
    } catch (e) {
      console.error('Error running Phase 4 test suite:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getStatusBadge = (status: SalesInvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1 w-max">
            <Clock className="w-2.5 h-2.5" />
            <span>Partially Paid</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-max">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Overdue</span>
          </span>
        );
      case 'issued':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
            <FileText className="w-2.5 h-2.5" />
            <span>Issued</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800 flex items-center gap-1 w-max">
            <XCircle className="w-2.5 h-2.5" />
            <span>Voided</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 w-max">
            <Edit3 className="w-2.5 h-2.5" />
            <span>Draft</span>
          </span>
        );
    }
  };

  // Render Subviews (Create, Edit, Preview)
  if (currentView === 'create' || currentView === 'edit') {
    return (
      <SalesInvoiceForm
        initialInvoice={currentView === 'edit' ? selectedInvoice : null}
        existingInvoices={salesInvoices}
        onSaveDraft={saveSalesInvoiceDraft}
        onIssueInvoice={issueSalesInvoice}
        onCancelForm={() => {
          setSelectedInvoice(null);
          setCurrentView('list');
        }}
        onPreviewGenerated={(inv) => {
          setSelectedInvoice(inv);
          setCurrentView('preview');
        }}
      />
    );
  }

  if (currentView === 'preview' && selectedInvoice) {
    // Keep selectedInvoice fresh with latest state
    const current = salesInvoices.find((inv) => inv.id === selectedInvoice.id) || selectedInvoice;
    return (
      <SalesInvoicePreview
        invoice={current}
        onClose={() => {
          setSelectedInvoice(null);
          setCurrentView('list');
        }}
        onEdit={(inv) => {
          setSelectedInvoice(inv);
          setCurrentView('edit');
        }}
        onIssue={(id) => {
          const res = issueSalesInvoice(id);
          if (res.success && res.invoice) {
            setSelectedInvoice(res.invoice);
          }
        }}
        onRecordPayment={(inv) => setPaymentModalInvoice(inv)}
        onCancel={(inv) => setCancelModalInvoice(inv)}
        onDuplicate={(id) => handleDuplicate(id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">Smart Invoice Generator</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Accounts Receivable
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create, issue, track, and manage customer billing with deterministic tax calculations and audit trail lineage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Run 25 Automated Tests */}
          <button
            type="button"
            onClick={handleRunTests}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
            title="Execute 25 deterministic verification scenarios for Phase 4"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Run 25 Tests</span>
          </button>

          {/* Export CSV Summary */}
          <button
            type="button"
            onClick={() => exportSalesInvoicesSummaryToCsv(filteredInvoices)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          {/* Create Invoice Primary Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Accounting Distinction & Anti-Contamination Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Accounts Receivable Separation Verified:</strong> Customer invoices generated here are <em>outgoing sales invoices</em>. In accordance with strict accounting rules, they are completely segregated from vendor disbursements and do not contaminate the Phase 3 Expense Ledger.
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>TOTAL RECEIVABLES (USD)</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            ${overviewMetrics.usd.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">
            {overviewMetrics.inr.totalInvoiced > 0
              ? `INR shown separately: ₹${overviewMetrics.inr.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Across all non-draft USD customer invoices'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>OUTSTANDING BALANCE (USD)</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-400">
            ${overviewMetrics.usd.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">
            {overviewMetrics.inr.totalOutstanding > 0
              ? `INR outstanding: ₹${overviewMetrics.inr.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'Uncollected client billings'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>SETTLED CASH PAYMENTS (USD)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            ${overviewMetrics.usd.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Recorded receipts via wire/ACH</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>OVERDUE AR (USD)</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-400">
            ${overviewMetrics.usd.overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">
            {overviewMetrics.usd.overdueCount} past-due invoice(s)
          </div>
        </div>
      </div>

      {/* Multi-Currency Portfolio Summary */}
      {overviewMetrics.inr.totalInvoiced > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-400 font-semibold text-[11px]">Multi-Currency Separation:</span>
            <span className="text-slate-400">Never adds amounts in different currencies. Portfolio totals tracked by currency.</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-slate-300">
              USD (Non-Draft): <strong className="text-white">${overviewMetrics.usd.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              INR (Shown Separately): <strong className="text-emerald-400">₹{overviewMetrics.inr.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[#101726] border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Invoices ({salesInvoices.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'draft' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drafts ({salesInvoices.filter((i) => i.status === 'draft').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('issued')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'issued' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Issued ({salesInvoices.filter((i) => i.status === 'issued').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('partially_paid')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'partially_paid' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Partially Paid ({salesInvoices.filter((i) => i.status === 'partially_paid').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paid ({salesInvoices.filter((i) => i.status === 'paid').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overdue ({salesInvoices.filter((i) => i.status === 'overdue').length})
            </button>
          </div>

          {/* Search & Advanced Filters Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice # or customer..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400/60"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg border border-rose-900/40 transition-colors flex items-center gap-1"
                title="Reset all search filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Currency</label>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Currencies' : c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Issue Date From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Issue Date To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Invoices List Table */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th
                  onClick={() => handleSort('invoiceNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customer')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer / Client</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('issueDate')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Issue Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dueDate')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grandTotal')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Grand Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {sortedInvoices.length > 0 ? (
                sortedInvoices.map((inv) => {
                  const isVoided = inv.status === 'cancelled';
                  const percentPaid = inv.grandTotal > 0 ? Math.min(100, Math.round((inv.amountPaid / inv.grandTotal) * 100)) : 0;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleOpenPreview(inv)}
                      className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${
                        isVoided ? 'opacity-40 bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${isVoided ? 'line-through text-slate-500' : 'text-white'}`}>
                            {inv.invoiceNumber}
                          </span>
                          {inv.source === 'demo' && (
                            <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              Demo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer & PO */}
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className={isVoided ? 'line-through text-slate-400' : ''}>
                            {inv.customer.customerName}
                          </span>
                          {inv.customer.poNumber && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ({inv.customer.poNumber})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 tabular-nums whitespace-nowrap">
                        <span className={isVoided ? 'line-through text-slate-500' : ''}>{inv.issueDate}</span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isVoided
                              ? 'line-through text-slate-500'
                              : inv.status === 'overdue'
                              ? 'text-rose-400 font-semibold'
                              : 'text-slate-300'
                          }
                        >
                          {inv.dueDate}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className={`font-semibold ${isVoided ? 'line-through text-slate-500' : 'text-white'}`}>
                          {inv.currency} {inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Balance Due & Progress Bar */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={
                              isVoided
                                ? 'line-through text-slate-500'
                                : inv.outstandingBalance === 0
                                ? 'text-emerald-400 font-semibold'
                                : 'text-amber-400 font-semibold'
                            }
                          >
                            {inv.currency} {inv.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          {!isVoided && inv.status !== 'draft' && (
                            <div className="w-20 ml-auto bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full transition-all"
                                style={{ width: `${percentPaid}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(inv)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Preview Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {inv.status === 'draft' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(inv)}
                                className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                                title="Edit Draft"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(inv.id)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {!isVoided && inv.status !== 'draft' && (
                            <button
                              type="button"
                              onClick={() => setPaymentModalInvoice(inv)}
                              disabled={inv.status === 'paid'}
                              className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-slate-800 transition-colors"
                              title="Record Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDuplicate(inv.id)}
                            className="p-1 text-slate-400 hover:text-purple-400 rounded hover:bg-slate-800 transition-colors"
                            title="Duplicate as New Draft"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {!isVoided && inv.status !== 'draft' && (
                            <button
                              type="button"
                              onClick={() => setCancelModalInvoice(inv)}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                              title="Cancel / Void Invoice"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-sm">No sales invoices found</h4>
                        <p className="text-xs text-slate-400">
                          No invoices match your active status, date, or customer filters.
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset All Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing {filteredInvoices.length} of {salesInvoices.length} invoices</span>
          <span>Reporting Currency: Multi-Currency Supported</span>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <RecordPaymentModal
          isOpen={!!paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          invoice={paymentModalInvoice}
          onSavePayment={(id, payment) => {
            const res = recordInvoicePayment(id, payment);
            if (res.success) {
              setPaymentModalInvoice(null);
            }
            return res;
          }}
        />
      )}

      {/* Cancel Invoice Modal */}
      {cancelModalInvoice && (
        <CancelInvoiceModal
          isOpen={!!cancelModalInvoice}
          onClose={() => setCancelModalInvoice(null)}
          invoice={cancelModalInvoice}
          onConfirmCancel={(id, reason) => {
            const res = cancelSalesInvoice(id, reason);
            if (res.success) {
              setCancelModalInvoice(null);
            }
            return res;
          }}
        />
      )}

      {/* Delete Draft Confirmation Modal */}
      {deleteConfirmId && (
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Draft Invoice"
          subtitle="Unissued drafts can be removed before formal dispatch."
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to delete this unissued draft? This will permanently remove the working draft from your browser's local cache.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Keep Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSalesInvoiceDraft(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors"
              >
                Delete Draft
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Automated Phase 4 Test Suite Modal */}
      {showTestModal && (
        <Modal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          title="Smart Invoice Generator Test Suite (Phase 4)"
          subtitle="25 Automated verification scenarios covering calculations, tax regimes, issuing, payment tracking, GL separation, and regressions"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {isRunningTests ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-300 font-mono text-xs">Running 25 automated Phase 4 verification tests...</p>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                {/* Scoreboard */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {testResults.filter((r) => r.passed).length} of {testResults.length} Tests Passed
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {testResults.every((r) => r.passed)
                          ? 'All automated accounting, invoice calculation, and regression tests passed.'
                          : 'Some tests reported deviations. Review below.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunTests}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-xs font-mono"
                  >
                    Rerun Tests
                  </button>
                </div>

                {/* Test items list */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {testResults.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        t.passed
                          ? 'bg-emerald-950/20 border-emerald-900/40'
                          : 'bg-rose-950/30 border-rose-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {t.passed ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-200">
                            Test {t.id}: {t.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{t.durationMs}ms</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 pl-6 leading-relaxed">
                        {t.message}
                      </p>
                      {t.details && (
                        <div className="mt-1.5 pl-6 font-mono text-[10px] text-slate-500 bg-slate-900/40 p-1.5 rounded">
                          {t.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
