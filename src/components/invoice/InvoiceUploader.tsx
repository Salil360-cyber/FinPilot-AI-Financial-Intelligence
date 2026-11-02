import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, Sparkles, ShieldCheck, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { extractTextFromPdf, extractTextFromImage, parseInvoiceText } from '../../services/invoiceExtractor';
import { ParsedInvoice } from '../../types/invoice';
import { SYNTHETIC_SAMPLE_DOCUMENTS } from '../../services/sampleInvoices';

interface InvoiceUploaderProps {
  onInvoiceParsed: (invoice: ParsedInvoice) => void;
  onAddAuditLog: (action: any, details: string) => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({
  onInvoiceParsed,
  onAddAuditLog,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFileMeta, setSelectedFileMeta] = useState<{ name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSelectedFileMeta({ name: file.name, size: file.size });

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`);
      onAddAuditLog('EXTRACTION_FAILED', `File ${file.name} exceeded 15MB size limit.`);
      return;
    }

    // Validate type
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setErrorMessage(`Unsupported file format (${file.type || file.name.split('.').pop()}). Please upload a PDF, PNG, or JPEG invoice.`);
      onAddAuditLog('EXTRACTION_FAILED', `Rejected unsupported format for ${file.name}`);
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0.15);
    setProcessingStatus('Reading file bytes in browser...');
    onAddAuditLog('FILE_SELECTED', `Selected ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    try {
      let rawText = '';
      let method: ParsedInvoice['extractionMethod'] = 'pdf_text_layer';
      let pageCount = 1;

      if (isPdf) {
        setProcessingStatus('Extracting text stream via PDF layer (pdfjs-dist)...');
        setProcessingProgress(0.45);
        onAddAuditLog('EXTRACTION_STARTED', `Extracting text from ${file.name} using pdfjs-dist`);

        const pdfResult = await extractTextFromPdf(file);
        pageCount = pdfResult.pageCount;

        if (pdfResult.error) {
          throw new Error(pdfResult.error);
        }

        if (pdfResult.isScannedOrEmpty) {
          // Document has no text layer. Attempt OCR or explain limitation clearly.
          setProcessingStatus('PDF has no text layer. Attempting client-side image OCR...');
          setProcessingProgress(0.65);
          setErrorMessage(
            'Notice: This PDF appears to be a scanned image with no embedded text layer. While text-based PDFs extract instantly, scanned files require manual field entry if browser OCR is unavailable.'
          );
        }
        rawText = pdfResult.rawText;
        method = 'pdf_text_layer';
      } else {
        // Image invoice via Tesseract.js
        setProcessingStatus('Initializing browser OCR engine (Tesseract.js)...');
        setProcessingProgress(0.35);
        onAddAuditLog('EXTRACTION_STARTED', `Running browser OCR on ${file.name}`);

        const ocrResult = await extractTextFromImage(file, (progress, status) => {
          setProcessingProgress(progress);
          setProcessingStatus(status);
        });

        if (ocrResult.error && !ocrResult.text) {
          setErrorMessage(ocrResult.error);
          setIsProcessing(false);
          // Allow creating an invoice shell with manual entry
          const manualShell = parseInvoiceText('', file.name, file.size, 'manual_entry', 1);
          onInvoiceParsed(manualShell);
          return;
        }
        rawText = ocrResult.text;
        method = 'browser_ocr';
      }

      setProcessingStatus('Parsing financial tokens, line items, and tax rates...');
      setProcessingProgress(0.85);

      const parsedInvoice = parseInvoiceText(rawText, file.name, file.size, method, pageCount);
      setProcessingProgress(1.0);
      onAddAuditLog(
        'EXTRACTION_COMPLETED',
        `Successfully extracted ${parsedInvoice.lineItems.length} line items and total $${parsedInvoice.invoiceTotal.value} from ${file.name}`
      );

      // Brief transition
      setTimeout(() => {
        setIsProcessing(false);
        onInvoiceParsed(parsedInvoice);
      }, 400);
    } catch (err: any) {
      console.error('Invoice processing error:', err);
      setIsProcessing(false);
      setErrorMessage(`Processing error: ${err.message || 'Unable to parse document.'}`);
      onAddAuditLog('EXTRACTION_FAILED', `Failed to process ${file.name}: ${err.message}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleLoadSyntheticSample = (sampleId: string) => {
    const sample = SYNTHETIC_SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (!sample) return;

    onAddAuditLog('FILE_SELECTED', `Loaded synthetic specimen: ${sample.title}`);
    setIsProcessing(true);
    setProcessingStatus(`Parsing synthetic specimen "${sample.title}"...`);
    setProcessingProgress(0.6);

    setTimeout(() => {
      const parsed = parseInvoiceText(sample.rawText, sample.fileName, sample.fileSize, 'pdf_text_layer');
      setIsProcessing(false);
      onInvoiceParsed(parsed);
      onAddAuditLog('EXTRACTION_COMPLETED', `Extracted synthetic specimen: ${sample.title}`);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-400 leading-relaxed">
          <strong className="text-slate-200">100% Client-Side Privacy Guarantee:</strong> All document parsing, text extraction, and mathematical validations occur entirely within your local web browser. Your invoices are never uploaded to remote cloud APIs or external AI providers.
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#121929] border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/5 shadow-lg scale-[1.005]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/80 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Drag & Drop Your Invoice Document
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Supports text-based <span className="text-slate-200 font-mono">PDF</span>, and image-based{' '}
              <span className="text-slate-200 font-mono">PNG / JPEG</span> (up to 15MB)
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              Browse Files on Computer
            </button>

            {selectedFileMeta && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFileMeta(null);
                  setErrorMessage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-slate-400 hover:text-slate-200 p-2 rounded-lg flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Selection</span>
              </button>
            )}
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-2 text-amber-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {processingStatus}
              </span>
              <span>{Math.round(processingProgress * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(processingProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl text-left flex items-start gap-3 text-xs text-rose-300 max-w-xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-200">Validation Notice:</span>
              <p className="mt-0.5 leading-relaxed text-rose-300/90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Synthetic Test Specimens Bar */}
      <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Or Test With Realistic Synthetic Specimens
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly simulate real text-based invoice scenarios and arithmetic checks without needing your own files
            </p>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 self-start sm:self-auto">
            INTERACTIVE SAMPLES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {SYNTHETIC_SAMPLE_DOCUMENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleLoadSyntheticSample(sample.id)}
              disabled={isProcessing}
              className="text-left p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 transition-all duration-150 group space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                  {sample.title}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 ml-1 ${
                    sample.expectedResult === 'valid'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                      : sample.expectedResult === 'duplicate'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                  }`}
                >
                  {sample.expectedResult.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {sample.tagline}
              </p>
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span>{sample.fileName}</span>
                <span className="text-amber-400 group-hover:underline">Load & Review →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
