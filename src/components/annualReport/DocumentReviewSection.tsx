import React, { useState } from 'react';
import { ReportDocument } from '../../types/annualReport';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface DocumentReviewSectionProps {
  report: ReportDocument;
}

export const DocumentReviewSection: React.FC<DocumentReviewSectionProps> = ({
  report,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const pages = report.extractedPages || [];
  const totalPages = pages.length;

  const activePageData = pages.find((p) => p.pageNumber === currentPage);

  const filteredPages = searchQuery.trim()
    ? pages.filter((p) => p.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : pages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <span>Filing Source Document Review</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Raw text stream extracted from <span className="font-mono text-slate-200">{report.fileName}</span>
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search extracted text..."
            className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition w-64"
          />
        </div>
      </div>

      {totalPages === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
          No page text available for this filing.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2 h-[550px] overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Document Pages ({filteredPages.length})
            </div>
            {filteredPages.map((p) => (
              <button
                key={p.pageNumber}
                onClick={() => setCurrentPage(p.pageNumber)}
                className={'w-full text-left px-3 py-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ' + (
                  currentPage === p.pageNumber
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span>Page {p.pageNumber}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {p.text.length} chars
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between h-[550px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-semibold text-slate-200">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
              {activePageData?.text || 'No text content on this page.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
