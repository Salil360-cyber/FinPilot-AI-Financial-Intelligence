import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Loader2, X, Info } from 'lucide-react';
import { extractAnnualReportFromPdf } from '../../services/annualReportExtractor';
import { ReportDocument } from '../../types/annualReport';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportImported: (report: ReportDocument) => void;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  onReportImported,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear() - 1);
  const [companyName, setCompanyName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please select a valid PDF file. Other file formats are not supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg(`File size ${(file.size / (1024 * 1024)).toFixed(1)} MB exceeds the maximum 50 MB threshold.`);
      setSelectedFile(null);
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    if (!companyName) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b(10k|10-k|annual|report|filing|fy\d+)\b/gi, '')
        .trim();
      if (cleanName) {
        setCompanyName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select an annual report PDF file to extract.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const extractedReport = await extractAnnualReportFromPdf(
        selectedFile,
        companyName || undefined,
        fiscalYear,
        (current, total, msg) => {
          setProcessingStatus(`Page ${current} of ${total}: ${msg}`);
        }
      );

      onReportImported(extractedReport);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extract financial statement figures from the PDF document.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Upload Annual Report / 10-K</h3>
              <p className="text-xs text-slate-400">Deterministic local PDF financial statement parser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3.5 bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-start space-x-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-blue-300">100% Free & Local Processing:</span> Documents are parsed entirely within your browser runtime using <span className="font-mono text-slate-200">pdfjs-dist</span>. No external paid OCR APIs or document upload services are invoked.
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : 'border-slate-700/70 hover:border-amber-500/50 hover:bg-slate-900/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,application/pdf"
              className="hidden"
              disabled={isProcessing}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-200">{selectedFile.name}</div>
                <div className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for deterministic extraction
                </div>
                <span className="text-xs text-amber-400 hover:underline pt-1">Change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Click to browse or drop SEC Form 10-K / Annual Report PDF
                </div>
                <div className="text-xs text-slate-500">PDF up to 50 MB (Annual Reports, 10-K, 20-F)</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Meridian Dynamics Corp"
                disabled={isProcessing}
                className="w-full px-3.5 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Filing Fiscal Year
              </label>
              <input
                type="number"
                value={fiscalYear}
                onChange={(e) => setFiscalYear(parseInt(e.target.value) || 2024)}
                min={1990}
                max={2030}
                disabled={isProcessing}
                className="w-full px-3.5 py-2 bg-slate-900/70 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition font-mono"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex items-start space-x-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center space-x-3 text-amber-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Extracting Financial Data...</span>
              </div>
              <p className="text-xs text-slate-400 font-mono pl-8">{processingStatus || 'Initializing parser...'}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing PDF...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Extract Statements & Narratives</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
