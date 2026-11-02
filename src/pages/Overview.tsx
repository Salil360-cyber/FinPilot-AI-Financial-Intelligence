import React from 'react';
import { Upload, FileUp, Sparkles, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { KpiCard } from '../components/dashboard/KpiCard';
import { ExpenseChart } from '../components/dashboard/ExpenseChart';
import { CategoryChart } from '../components/dashboard/CategoryChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { ReconciliationSummary } from '../components/dashboard/ReconciliationSummary';
import { DemoInsights } from '../components/dashboard/DemoInsights';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { useFinancial } from '../context/FinancialContext';
import { DEMO_MONTHLY_FINANCIALS } from '../data/demoData';
import { roundCurrency } from '../services/salesInvoiceCalculator';
import { ExpenseCategoryPoint, NavigationPage } from '../types/finance';

interface OverviewProps {
  onNavigate: (page: NavigationPage) => void;
  searchQuery: string;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate, searchQuery }) => {
  const { kpis, transactions } = useFinancial();

  const activeDebits = React.useMemo(() => {
    return transactions.filter((t) => t.type === 'debit' && t.ledgerStatus !== 'cancelled');
  }, [transactions]);

  // Dynamic Operating Expense Composition from active ledger
  const { expenseCategories, totalExpenseAmount } = React.useMemo(() => {
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    let total = 0;

    activeDebits.forEach((t) => {
      const cat = t.category || 'General & Admin';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 };
      }
      categoryTotals[cat].amount = roundCurrency(categoryTotals[cat].amount + t.amount);
      categoryTotals[cat].count += 1;
      total = roundCurrency(total + t.amount);
    });

    const colorMap: Record<string, string> = {
      'Cloud & Infrastructure': '#38bdf8',
      'Professional Services': '#10b981',
      'Software & Subscriptions': '#818cf8',
      'Facilities & Ops': '#e879f9',
      'Payroll & Personnel': '#f59e0b',
      'Marketing & Acquisition': '#f43f5e',
    };

    const categories: ExpenseCategoryPoint[] = Object.entries(categoryTotals)
      .map(([cat, val]) => ({
        category: cat,
        amount: val.amount,
        percentage: total > 0 ? roundCurrency((val.amount / total) * 100) : 0,
        color: colorMap[cat] || '#94a3b8',
        transactionCount: val.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { expenseCategories: categories, totalExpenseAmount: total };
  }, [activeDebits]);

  // Dynamic monthly financials with actual October expenses from active ledger
  const monthlyFinancials = React.useMemo(() => {
    const octExpenses = activeDebits
      .filter((t) => t.date.startsWith('2026-10'))
      .reduce((sum, t) => roundCurrency(sum + t.amount), 0);

    return DEMO_MONTHLY_FINANCIALS.map((item) => {
      if (item.month === 'Oct') {
        return {
          ...item,
          expenses: octExpenses > 0 ? octExpenses : 217330.75,
        };
      }
      return item;
    });
  }, [activeDebits]);

  return (
    <div className="space-y-6">
      {/* Welcome & Action Header */}
      <div className="bg-[#121929] border border-slate-800/90 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-amber-500/5 via-amber-500/0 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                FINANCIAL OPERATIONS CONSOLE
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-mono">Q3/Q4 CLOSING CYCLE</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Financial Operations Overview
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
              Consolidated intelligence summarizing invoice OCR extraction, general expense ledgers, automated bank reconciliation, and cash-flow health.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('invoice-intelligence')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('bank-reconciliation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 rounded-lg transition-colors"
            >
              <FileUp className="w-4 h-4 text-slate-400" />
              <span>Import Bank Statement</span>
            </button>
          </div>
        </div>

        {/* Demo Mode Subtitle Banner */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Operating in <strong>Enterprise Demo Mode</strong> with verified general ledger records. Newly approved invoices immediately update active metrics.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Ledger Period: Jan 1 – Oct 26, 2026
          </span>
        </div>
      </div>

      {/* KPI Cards Row (Dynamically populated from FinancialContext) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((metric) => (
          <KpiCard
            key={metric.id}
            metric={metric}
            onClick={() => {
              if (metric.id === 'reconciliation-rate') onNavigate('bank-reconciliation');
              if (metric.id === 'total-expenses') onNavigate('expense-ledger');
              if (metric.id === 'processed-invoices') onNavigate('invoice-intelligence');
              if (metric.id === 'outstanding-items') onNavigate('bank-reconciliation');
            }}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ExpenseChart data={monthlyFinancials} />
        </div>
        <div className="lg:col-span-5">
          <CategoryChart
            categories={expenseCategories}
            totalAmount={totalExpenseAmount}
          />
        </div>
      </div>

      {/* Reconciliation Summary & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ReconciliationSummary
            onNavigateToReconciliation={() => onNavigate('bank-reconciliation')}
          />
        </div>
        <div className="lg:col-span-6">
          <DemoInsights />
        </div>
      </div>

      {/* Transactions Table & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RecentTransactions
            transactions={transactions}
            globalSearchQuery={searchQuery}
            onNavigateToReconciliation={() => onNavigate('bank-reconciliation')}
          />
        </div>
        <div className="lg:col-span-4">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
