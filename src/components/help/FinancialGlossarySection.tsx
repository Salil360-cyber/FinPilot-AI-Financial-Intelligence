/**
 * FinPilot AI - Phase 12 Financial Glossary Section
 * Comprehensive interactive glossary containing all 26 required terms,
 * formal accounting definitions, intuitive/conversational Hinglish explanations,
 * and illustrative business examples.
 */

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import { FINANCIAL_GLOSSARY } from '../../data/financialGlossary';
import { GlossaryTerm } from '../../types/helpCenter';

interface FinancialGlossarySectionProps {
  onNavigate: (page: NavigationPage) => void;
}

export const FinancialGlossarySection: React.FC<FinancialGlossarySectionProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All 26 Terms' },
    { id: 'core_accounting', label: 'Core Accounting' },
    { id: 'liquidity_ratios', label: 'Liquidity & Ratios' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'forecasting', label: 'Forecasting' },
    { id: 'audit_governance', label: 'Audit & Governance' },
  ];

  const filteredTerms = FINANCIAL_GLOSSARY.filter((term: GlossaryTerm) => {
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      term.term.toLowerCase().includes(q) ||
      term.simpleDefinition.toLowerCase().includes(q) ||
      term.intuitiveExplanation.toLowerCase().includes(q) ||
      term.illustrativeExample.toLowerCase().includes(q) ||
      term.relatedTerms.some((rt) => rt.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121929] border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms, definitions, formulas, or Hindi/English explanations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0f172a] border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                  : 'bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{filteredTerms.length}</strong> of 26 financial terms
        </span>
        <span className="flex items-center gap-1 text-amber-400/90 font-mono text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          Every term includes formal English + intuitive Hinglish guidance
        </span>
      </div>

      {/* Terms Grid */}
      {filteredTerms.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121929] border border-slate-800 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No matching financial terms found</h4>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or switching to &quot;All 26 Terms&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-[#121929] p-5 shadow-lg space-y-4 hover:border-slate-700/80 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-mono">
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1.5">{item.term}</h3>
                  </div>
                  {item.relatedModule && (
                    <button
                      onClick={() => onNavigate(item.relatedModule!)}
                      className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 hover:bg-slate-800/80 transition shrink-0"
                      title="Jump to relevant application module"
                    >
                      <span>Module</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Formal Definition */}
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {item.simpleDefinition}
                </p>

                {/* Hinglish / Conversational Explanation */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/95 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300 text-[11px] uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    Simple Bhasha Mein (Intuitive Breakdown)
                  </div>
                  <p className="text-xs leading-relaxed text-amber-100/90 font-medium">
                    {item.intuitiveExplanation}
                  </p>
                </div>

                {/* Illustrative Example */}
                <div className="p-3 rounded-xl bg-[#0f172a] border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-cyan-400" />
                    Illustrative Example:
                  </div>
                  <p className="text-slate-300/90 leading-relaxed text-[11px]">
                    {item.illustrativeExample}
                  </p>
                </div>
              </div>

              {/* Related Terms */}
              {item.relatedTerms.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Related:</span>
                  {item.relatedTerms.map((rt) => (
                    <span
                      key={rt}
                      onClick={() => setSearchQuery(rt)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer transition"
                    >
                      {rt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
