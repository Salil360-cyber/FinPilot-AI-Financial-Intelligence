import React from 'react';
import {
  Users,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { ConcentrationAnalysis } from '../../types/forecast';
import { roundCurrency } from '../../services/salesInvoiceCalculator';

interface CustomerConcentrationSectionProps {
  concentration: ConcentrationAnalysis;
  currencySymbol?: string;
}

export const CustomerConcentrationSection: React.FC<CustomerConcentrationSectionProps> = ({
  concentration,
  currencySymbol = '$',
}) => {
  return (
    <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Customer & Revenue Concentration Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates revenue dependency on top client counterparties and Herfindahl-Hirschman Index (HHI).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
              concentration.riskRating === 'severe' || concentration.riskRating === 'high'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : concentration.riskRating === 'moderate'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            HHI Risk: {concentration.riskRating.toUpperCase()} ({concentration.herfindahlIndex})
          </span>
        </div>
      </div>

      {/* KPI Concentration Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-[#0b101b] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Top Customer Share</span>
          <div className="text-xl font-bold font-mono text-white">
            {concentration.topCustomerSharePercent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">
            {concentration.items[0]?.customerName || 'Primary Customer'}
          </p>
        </div>

        <div className="p-3.5 bg-[#0b101b] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Top 3 Customer Share</span>
          <div className="text-xl font-bold font-mono text-white">
            {concentration.top3SharePercent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400">Combined Pareto volume concentration</p>
        </div>

        <div className="p-3.5 bg-[#0b101b] border border-slate-800 rounded-lg space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Herfindahl Index (HHI)</span>
          <div className="text-xl font-bold font-mono text-white">
            {concentration.herfindahlIndex} / 10,000
          </div>
          <p className="text-[10px] text-slate-400">
            {concentration.herfindahlIndex > 2500 ? 'Highly Concentrated' : 'Well Diversified'}
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b101b] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Customer Account</th>
              <th className="px-4 py-3 text-right">Total Invoiced</th>
              <th className="px-4 py-3 text-right">Invoices</th>
              <th className="px-4 py-3 text-right">Volume Share (%)</th>
              <th className="px-4 py-3 text-right">Cumulative Share (%)</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {concentration.items.map((c) => (
              <tr key={c.customerId} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-2.5 text-white font-medium">{c.customerName}</td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-200">
                  {currencySymbol}
                  {roundCurrency(c.invoicedTotal).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-slate-400">{c.invoiceCount}</td>
                <td className="px-4 py-2.5 text-right text-purple-400 font-bold">
                  {c.percentageOfTotal.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-right text-slate-300">
                  {c.cumulativeSharePercent.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      c.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {c.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
