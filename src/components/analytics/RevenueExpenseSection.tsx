import React from 'react';
import { DollarSign, Clock, Users, Building, AlertCircle, CheckCircle2, TrendingDown, Repeat } from 'lucide-react';
import { RevenueAnalyticsSummary, ExpenseAnalyticsSummary } from '../../types/analytics';

interface RevenueExpenseSectionProps {
  revenue: RevenueAnalyticsSummary;
  expenses: ExpenseAnalyticsSummary;
  currency: string;
}

export const RevenueExpenseSection: React.FC<RevenueExpenseSectionProps> = ({
  revenue,
  expenses,
  currency,
}) => {
  return (
    <div className="space-y-6">
      {/* SECTION 1: REVENUE & RECEIVABLES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Revenue & Accounts Receivable Analytics</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict accounting separation: Invoiced sales vs verified cash payments received
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            {currency}
          </span>
        </div>

        {/* Revenue Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Issued Sales Total</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${revenue.issuedInvoicesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">Across {revenue.issuedInvoicesCount} issued invoices</span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Cash Payments Collected</span>
            <div className="text-xl font-bold font-mono text-white">
              ${revenue.cashPaymentsReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">{revenue.cashPaymentsCount} payments processed</span>
          </div>

          <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Outstanding Receivables</span>
            <div className="text-xl font-bold font-mono text-amber-400">
              ${revenue.outstandingReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400">{revenue.unpaidInvoicesCount} invoices pending payment</span>
          </div>
        </div>

        {/* AR Ageing Buckets */}
        <div className="p-4 bg-[#121929] border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Accounts Receivable Ageing Schedule</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Past Due: ${revenue.overdueInvoicesTotal.toLocaleString()} ({revenue.overdueInvoicesCount} invoices)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono text-slate-400">Current (0-30 Days)</span>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                ${revenue.ageingBuckets.current.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400">Normal terms</span>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono text-slate-400">31 - 60 Days</span>
              <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                ${revenue.ageingBuckets.days31to60.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-400">Follow-up suggested</span>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono text-slate-400">61 - 90 Days</span>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                ${revenue.ageingBuckets.days61to90.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-400">Escalate dunning</span>
            </div>

            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg">
              <span className="text-[10px] uppercase font-mono text-slate-400">Over 90 Days</span>
              <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                ${revenue.ageingBuckets.over90.toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-400">Default review</span>
            </div>
          </div>
        </div>

        {/* Customer Concentration Table */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Sales Distribution & Concentration</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {revenue.revenueByCustomer.length} Active Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/40">
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4 text-right">Invoices</th>
                  <th className="py-2.5 px-4 text-right">Invoiced Total</th>
                  <th className="py-2.5 px-4 text-right">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {revenue.revenueByCustomer.length > 0 ? (
                  revenue.revenueByCustomer.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">
                        {c.customer}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">{c.invoiceCount}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-white">
                        ${c.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-400">
                        {c.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 text-xs">
                      No customer revenue records found in this scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: OPERATING EXPENSES */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>General Ledger Operating Expense Analytics</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Analyzes active posted expense debits; non-expense transfers and cancelled vouchers are separated
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Active: <strong>${expenses.totalOperatingExpenses.toLocaleString()}</strong>
          </span>
        </div>

        {/* Expense Category Breakdown Table */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Expense Distribution by Category</span>
            <span className="text-[10px] font-mono text-slate-400">
              {expenses.expensesByCategory.length} Categories Active
            </span>
          </div>

          <div className="p-4 space-y-3">
            {expenses.expensesByCategory.map((cat, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">{cat.category}</span>
                  <div className="font-mono text-right">
                    <span className="text-white font-bold">${cat.amount.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({cat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors & Recurring Patterns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Vendors */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Top Counterparty Outflows</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">By Total Spend</span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {expenses.expensesByVendor.slice(0, 5).map((v, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <div className="font-sans font-medium text-slate-200 truncate max-w-[200px]">
                    {v.vendor}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">${v.amount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{v.percentage.toFixed(1)}% of expenses</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Patterns */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-sky-400" />
                <span>Detected Recurring Spending Patterns</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Empirical Pattern</span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {expenses.recurringPatterns.length > 0 ? (
                expenses.recurringPatterns.map((p, i) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-sans font-medium text-slate-200">{p.vendor}</div>
                      <div className="text-[10px] text-slate-400">{p.frequencyEstimate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">~${p.typicalAmount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Total: ${p.totalSpent.toLocaleString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No repeating multi-period patterns detected in this scope.
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 italic pt-1">
              * Note: These are observed spending cadences from posted vouchers, not contractual guarantees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
