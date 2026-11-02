import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  FileText,
  Plus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Edit3,
  Calendar,
  DollarSign,
  PlayCircle,
  Check,
  XCircle,
  Clock,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { FinancialTransaction, TransactionSource, TransactionStatus, LedgerStatus } from '../types/finance';
import { serializeToCsv } from '../services/csvParser';
import { ManualTransactionModal } from '../components/ledger/ManualTransactionModal';
import { CsvImportModal } from '../components/ledger/CsvImportModal';
import { TransactionAuditModal } from '../components/ledger/TransactionAuditModal';
import { runPhase3TestSuite, Phase3TestResult } from '../services/phase3TestSuite';

type SortColumn = 'date' | 'amount' | 'vendor' | 'id' | 'category';
type SortDirection = 'asc' | 'desc';

export const ExpenseLedger: React.FC = () => {
  const { transactions, addManualTransaction, importCsvTransactions } = useFinancial();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | TransactionSource>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState<'all' | LedgerStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [inspectedTx, setInspectedTx] = useState<FinancialTransaction | null>(null);

  // Phase 3 Test Suite Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Phase3TestResult[] | null>(null);

  // Categories and Vendors options
  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [transactions]);

  const vendors = useMemo(() => {
    const set = new Set(transactions.map((t) => t.vendor).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [transactions]);

  // Counts by source
  const userUploadedCount = useMemo(() => transactions.filter((t) => t.source === 'user_uploaded').length, [transactions]);
  const importedCount = useMemo(() => transactions.filter((t) => t.source === 'imported_bank_statement').length, [transactions]);
  const manualCount = useMemo(() => transactions.filter((t) => t.source === 'manual_entry').length, [transactions]);
  const demoCount = useMemo(() => transactions.filter((t) => !t.source || t.source === 'demo').length, [transactions]);

  // Filtering
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Category filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Vendor filter
      if (selectedVendor !== 'all' && tx.vendor !== selectedVendor) return false;

      // Source filter
      if (sourceFilter !== 'all') {
        const txSource = tx.source || 'demo';
        if (txSource !== sourceFilter) return false;
      }

      // Reconciliation status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Ledger status filter (posted vs cancelled)
      if (ledgerStatusFilter !== 'all') {
        const txLedgerStatus = tx.ledgerStatus || 'posted';
        if (txLedgerStatus !== ledgerStatusFilter) return false;
      }

      // Date range
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Amount range
      const minNum = parseFloat(minAmount);
      if (!isNaN(minNum) && tx.amount < minNum) return false;
      const maxNum = parseFloat(maxAmount);
      if (!isNaN(maxNum) && tx.amount > maxNum) return false;

      // Text search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          tx.vendor.toLowerCase().includes(term) ||
          tx.account.toLowerCase().includes(term) ||
          tx.id.toLowerCase().includes(term) ||
          (tx.invoiceRef && tx.invoiceRef.toLowerCase().includes(term)) ||
          (tx.description && tx.description.toLowerCase().includes(term)) ||
          (tx.reconciliationNotes && tx.reconciliationNotes.toLowerCase().includes(term));
        if (!matches) return false;
      }

      return true;
    });
  }, [
    transactions,
    selectedCategory,
    selectedVendor,
    sourceFilter,
    statusFilter,
    ledgerStatusFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    searchTerm,
  ]);

  // Sorting
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'date':
          cmp = a.date.localeCompare(b.date);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'vendor':
          cmp = a.vendor.localeCompare(b.vendor);
          break;
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortColumn, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedTransactions = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPageSafe, pageSize]);

  // Summary Metrics of Filtered Scope
  const filteredMetrics = useMemo(() => {
    // Financial conventions: cancelled transactions do not impact active sums
    let totalDebits = 0;
    let totalCredits = 0;
    let activeCount = 0;
    let cancelledCount = 0;

    for (const t of filtered) {
      if (t.ledgerStatus === 'cancelled') {
        cancelledCount++;
      } else {
        activeCount++;
        if (t.type === 'debit') {
          totalDebits += t.amount;
        } else {
          totalCredits += t.amount;
        }
      }
    }

    return {
      totalDebits,
      totalCredits,
      netImpact: totalCredits - totalDebits,
      activeCount,
      cancelledCount,
    };
  }, [filtered]);

  // Check if any filters are currently active
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    selectedVendor !== 'all' ||
    sourceFilter !== 'all' ||
    statusFilter !== 'all' ||
    ledgerStatusFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    minAmount !== '' ||
    maxAmount !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedVendor('all');
    setSourceFilter('all');
    setStatusFilter('all');
    setLedgerStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  // CSV Export with Formula Injection protection
  const handleDownloadCsv = () => {
    const headers = [
      'Transaction ID',
      'Posting Date',
      'Counterparty / Vendor',
      'Description',
      'Category',
      'Account',
      'Amount',
      'Type',
      'Currency',
      'Invoice Ref',
      'Reconciliation Status',
      'Ledger Status',
      'Source',
      'Source File',
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.date,
      t.vendor,
      t.description || t.reconciliationNotes || '',
      t.category,
      t.account,
      t.amount,
      t.type,
      t.currency || 'USD',
      t.invoiceRef || '',
      t.status,
      t.ledgerStatus || 'posted',
      t.source || 'demo',
      t.sourceFileName || '',
    ]);

    const csvContent = serializeToCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinPilot_GeneralLedger_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  // Execute Phase 3 Test Suite
  const handleRunTests = async () => {
    setShowTestModal(true);
    setIsRunningTests(true);
    try {
      const results = await runPhase3TestSuite(transactions);
      setTestResults(results);
    } catch (e) {
      console.error('Error running test suite:', e);
    } finally {
      setIsRunningTests(false);
    }
  };

  const getSourceBadge = (source?: TransactionSource) => {
    switch (source) {
      case 'user_uploaded':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 whitespace-nowrap">
            <Sparkles className="w-2.5 h-2.5" />
            <span>User Upload</span>
          </span>
        );
      case 'imported_bank_statement':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1 whitespace-nowrap">
            <FileText className="w-2.5 h-2.5" />
            <span>Bank CSV</span>
          </span>
        );
      case 'manual_entry':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1 whitespace-nowrap">
            <Edit3 className="w-2.5 h-2.5" />
            <span>Manual Entry</span>
          </span>
        );
      case 'demo':
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 whitespace-nowrap">
            Demo Record
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">General Ledger & Expense Management</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Double-Entry Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auditable corporate transaction ledger with real-time multi-dimensional filtering, CSV reconciliation, and deterministic validation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Run 16 Automated Tests */}
          <button
            type="button"
            onClick={handleRunTests}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-xs"
            title="Execute 16 deterministic tests required for Phase 3"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Run 16 Tests</span>
          </button>

          {/* Import CSV */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>Import CSV</span>
          </button>

          {/* Manual Entry */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Add Transaction</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Local Ledger Persistence & Anti-Deletion Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Financial Audit Integrity Guarantee:</strong> In accordance with corporate accounting standards, transactions are never silently deleted. Voided transactions receive an auditable cancellation record with mandatory rationale, timestamp, and actor lineage while preserving historical reconciliation continuity.
        </div>
      </div>

      {/* Filtered Scope Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>FILTERED EXPENSES (DEBIT)</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-400">
            ${filteredMetrics.totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Operating costs & disbursements</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>FILTERED CREDITS</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400">
            ${filteredMetrics.totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Revenues & vendor refunds</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>NET MOVEMENT</span>
            <span className="text-[10px] font-mono text-slate-400">Cr - Dr</span>
          </div>
          <div
            className={`text-lg font-bold font-mono ${
              filteredMetrics.netImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {filteredMetrics.netImpact < 0 ? '-' : '+'}$
            {Math.abs(filteredMetrics.netImpact).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Net cash & ledger balance delta</div>
        </div>

        <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>DATASET SCOPE</span>
            <span className="text-[10px] font-mono text-amber-400">
              {hasActiveFilters ? 'Filtered' : 'All'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {filtered.length} <span className="text-xs font-normal text-slate-400">/ {transactions.length} rows</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {filteredMetrics.activeCount} posted · {filteredMetrics.cancelledCount} voided
          </div>
        </div>
      </div>

      {/* Primary Filter Toolbar */}
      <div className="space-y-3 bg-[#101726] border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Source Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setSourceFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                sourceFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Records ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceFilter('user_uploaded');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'user_uploaded'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>User Uploads ({userUploadedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceFilter('imported_bank_statement');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'imported_bank_statement'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3 text-sky-400" />
              <span>Bank CSV ({importedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceFilter('manual_entry');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                sourceFilter === 'manual_entry'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3 h-3 text-purple-400" />
              <span>Manual ({manualCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSourceFilter('demo');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                sourceFilter === 'demo' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Records ({demoCount})
            </button>
          </div>

          {/* Quick Search & Advanced Filter Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search vendor, ID, ref, or memo..."
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
                title="Reset all search and filter parameters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Vendor Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Vendor / Counterparty</label>
              <select
                value={selectedVendor}
                onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v === 'all' ? 'All Vendors' : v}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Expense Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Reconciliation Status */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Reconciliation Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="matched">Matched (Cleared)</option>
                <option value="pending">Pending Review</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>

            {/* Ledger Status */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Ledger State</label>
              <select
                value={ledgerStatusFilter}
                onChange={(e) => {
                  setLedgerStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
              >
                <option value="all">All (Active & Voided)</option>
                <option value="posted">Active (Posted)</option>
                <option value="cancelled">Cancelled / Voided</option>
              </select>
            </div>

            {/* Date Range Start & End */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Date From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Date To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Min Amount ($)</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Amount ($)</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => {
                  setMaxAmount(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="100000.00"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-400 text-xs font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* General Ledger Table */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px] uppercase tracking-wider select-none">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tx ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Origin / Lineage</th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Posting Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('vendor')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Counterparty / Vendor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Category</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Disbursement Account</th>
                <th
                  onClick={() => handleSort('amount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Debit (USD)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Credit (USD)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pagedTransactions.length > 0 ? (
                pagedTransactions.map((tx) => {
                  const isVoided = tx.ledgerStatus === 'cancelled';
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setInspectedTx(tx)}
                      className={`hover:bg-slate-900/40 transition-colors cursor-pointer ${
                        isVoided
                          ? 'opacity-50 bg-rose-950/10'
                          : tx.source === 'user_uploaded'
                          ? 'bg-amber-500/5'
                          : tx.source === 'imported_bank_statement'
                          ? 'bg-sky-500/5'
                          : tx.source === 'manual_entry'
                          ? 'bg-purple-500/5'
                          : ''
                      }`}
                    >
                      {/* Tx ID */}
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        <span className={`font-semibold ${isVoided ? 'line-through text-slate-500' : 'text-white'}`}>
                          {tx.id}
                        </span>
                        {isVoided && (
                          <span className="ml-1.5 text-[9px] font-sans px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            VOIDED
                          </span>
                        )}
                      </td>

                      {/* Origin Source */}
                      <td className="py-3 px-4 whitespace-nowrap font-sans">
                        {getSourceBadge(tx.source)}
                      </td>

                      {/* Posting Date */}
                      <td className="py-3 px-4 text-slate-300 font-mono tabular-nums whitespace-nowrap">
                        <span className={isVoided ? 'line-through text-slate-500' : ''}>{tx.date}</span>
                      </td>

                      {/* Counterparty / Vendor */}
                      <td className="py-3 px-4 font-sans font-medium text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={isVoided ? 'line-through text-slate-400' : ''}>{tx.vendor}</span>
                          {tx.invoiceRef && (
                            <span className="text-[10px] font-mono text-slate-400">
                              ({tx.invoiceRef})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-sans text-slate-400 whitespace-nowrap">
                        <span className={isVoided ? 'line-through text-slate-500' : ''}>{tx.category}</span>
                      </td>

                      {/* Account */}
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {tx.account}
                      </td>

                      {/* Debit */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {tx.type === 'debit' ? (
                          <span className={isVoided ? 'line-through text-slate-500' : 'text-rose-400 font-medium'}>
                            ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Credit */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {tx.type === 'credit' ? (
                          <span className={isVoided ? 'line-through text-slate-500' : 'text-emerald-400 font-medium'}>
                            ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        {isVoided ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
                            Cancelled
                          </span>
                        ) : (
                          <StatusBadge status={tx.status} />
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 font-sans text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedTx(tx);
                          }}
                          className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-white text-sm">No transactions found</h4>
                        <p className="text-xs text-slate-400">
                          No ledger postings match your current filter and search criteria.
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

        {/* Pagination & Ledger Summary Footer */}
        <div className="p-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              Showing {sorted.length === 0 ? 0 : (currentPageSafe - 1) * pageSize + 1}–
              {Math.min(currentPageSafe * pageSize, sorted.length)} of {sorted.length} records
            </span>
            <span className="text-slate-500">|</span>
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPageSafe <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded border border-slate-800 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 text-slate-300 font-mono">
              Page {currentPageSafe} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPageSafe >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded border border-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Manual Transaction Creation Modal */}
      {showAddModal && (
        <ManualTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={(txData) => addManualTransaction(txData)}
          existingTransactions={transactions}
        />
      )}

      {/* CSV Bank Statement Import Wizard Modal */}
      {showImportModal && (
        <CsvImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => setShowImportModal(false)}
          importCsvTransactions={importCsvTransactions}
          existingTransactions={transactions}
        />
      )}

      {/* Transaction Inspection & Audit Modal */}
      {inspectedTx && (
        <TransactionAuditModal
          isOpen={!!inspectedTx}
          onClose={() => setInspectedTx(null)}
          transaction={inspectedTx}
        />
      )}

      {/* Export Confirmation Modal */}
      {showExportModal && (
        <Modal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          title="Export General Ledger"
          subtitle="Generate standard RFC 4180 compliant CSV ledger export"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              You are about to export <strong>{filtered.length} general ledger postings</strong> matching your active filters.
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 font-mono text-[11px] text-slate-400">
              <div>• Standard RFC 4180 compliant format with UTF-8 encoding</div>
              <div>• OWASP spreadsheet formula injection protection (automatic neutralization)</div>
              <div>• Detailed columns: ID, Date, Counterparty, Memo, Category, Account, Amount, Debit/Credit, Currency, Invoice Ref, Status, Lineage</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Confirm & Download CSV</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Automated Phase 3 Test Suite Modal */}
      {showTestModal && (
        <Modal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
          title="General Ledger & Expense Test Suite (Phase 3)"
          subtitle="16 Automated verification scenarios covering filtering, RFC 4180 CSV parsing, formula protection, validation, and audit controls"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {isRunningTests ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-300 font-mono text-xs">Running 16 automated Phase 3 verification tests...</p>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                {/* Summary scoreboard */}
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
                          ? 'All automated accounting & ledger constraints verified successfully.'
                          : 'Some tests reported deviations. Inspect below.'}
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

                {/* List of test cases */}
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
