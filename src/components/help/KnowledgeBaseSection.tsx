/**
 * FinPilot AI - Phase 12 Searchable Knowledge Base & FAQs Section
 * Offline, searchable documentation covering all 11 core financial modules.
 */

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { NavigationPage } from '../../types/finance';
import { HELP_ARTICLES, FAQ_ITEMS } from '../../data/helpArticles';
import { HelpCategory, HelpArticle, FaqItem } from '../../types/helpCenter';

interface KnowledgeBaseSectionProps {
  onNavigate: (page: NavigationPage) => void;
}

export const KnowledgeBaseSection: React.FC<KnowledgeBaseSectionProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'all'>('all');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(HELP_ARTICLES[0].id);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const categories: { id: HelpCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Modules' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'ledger', label: 'General Ledger' },
    { id: 'sales_invoices', label: 'Sales & AR' },
    { id: 'reconciliation', label: 'Reconciliation' },
    { id: 'analytics', label: 'Analytics & Ratios' },
    { id: 'forecasting', label: 'Forecasting' },
    { id: 'annual_reports', label: 'Annual Reports' },
    { id: 'advisory', label: 'AI Advisory' },
    { id: 'executive_reports', label: 'Executive Reports' },
    { id: 'settings', label: 'Settings' },
    { id: 'backup_restore', label: 'Backup & Restore' },
  ];

  const filteredArticles = HELP_ARTICLES.filter((article: HelpArticle) => {
    const matchesCat = selectedCategory === 'all' || article.category === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q) ||
      article.keywords.some((k) => k.toLowerCase().includes(q)) ||
      article.content.some((c) => c.toLowerCase().includes(q)) ||
      article.keyTakeaways.some((t) => t.toLowerCase().includes(q))
    );
  });

  const filteredFaqs = FAQ_ITEMS.filter((faq: FaqItem) => {
    const matchesCat = selectedCategory === 'all' || faq.category === selectedCategory;
    if (!matchesCat) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    );
  });

  const toggleArticle = (id: string) => {
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121929] border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles, FAQs, workflows, or accounting guidelines..."
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

      {/* Articles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Knowledge Base Guides ({filteredArticles.length})
            </h3>
          </div>
          <span>Offline client-side knowledge base</span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#121929] border border-slate-800 text-slate-400 text-xs">
            No documentation articles found matching your query.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const isExpanded = expandedArticleId === article.id;
              return (
                <div
                  key={article.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isExpanded
                      ? 'border-slate-700 bg-[#121929] shadow-xl'
                      : 'border-slate-800/80 bg-[#121929]/70 hover:border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => toggleArticle(article.id)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                          {article.categoryLabel}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100">{article.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{article.summary}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {article.relatedModule && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(article.relatedModule!);
                          }}
                          className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 px-2.5 py-1 rounded-lg border border-slate-800 hover:bg-slate-800 transition"
                        >
                          <span>{article.relatedModuleLabel || 'Open Module'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button className="text-slate-400 hover:text-slate-200 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4 text-xs text-slate-300">
                      {/* Content Paragraphs */}
                      <div className="space-y-2.5 leading-relaxed text-slate-300">
                        {article.content.map((p, idx) => (
                          <p key={idx}>{p}</p>
                        ))}
                      </div>

                      {/* Key Takeaways */}
                      {article.keyTakeaways.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-2">
                          <h5 className="font-semibold text-amber-400 text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Key Takeaways
                          </h5>
                          <div className="space-y-1.5">
                            {article.keyTakeaways.map((takeaway, i) => (
                              <div key={i} className="flex items-start gap-2 text-slate-300 text-[11px]">
                                <span className="text-amber-400 mt-0.5">•</span>
                                <span>{takeaway}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keywords & Direct Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {article.keywords.map((kw) => (
                            <span
                              key={kw}
                              onClick={() => setSearchQuery(kw)}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300 cursor-pointer transition"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        {article.relatedModule && (
                          <button
                            onClick={() => onNavigate(article.relatedModule!)}
                            className="self-end sm:self-center px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition"
                          >
                            <span>Launch {article.relatedModuleLabel || 'Module'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Frequently Asked Questions ({filteredFaqs.length})
          </h3>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#121929] border border-slate-800 text-slate-400 text-xs">
            No FAQs matching your query.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-slate-800 bg-[#121929] overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-medium text-slate-200 hover:text-amber-300 transition"
                  >
                    <span>{faq.question}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 bg-[#0f172a]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
