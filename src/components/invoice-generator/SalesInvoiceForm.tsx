import React, { useState, useMemo } from 'react';
import {
  SalesInvoice,
  SalesLineItem,
  TaxConfiguration,
  TaxRegimeType,
} from '../../types/salesInvoice';
import {
  calculateLineItem,
  calculateSalesInvoiceTotals,
  generateUniqueInvoiceNumber,
  validateSalesInvoiceForIssuing,
} from '../../services/salesInvoiceCalculator';
import { DEMO_USER_PROFILE } from '../../data/demoData';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  RotateCcw,
  Check,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface SalesInvoiceFormProps {
  initialInvoice?: SalesInvoice | null;
  existingInvoices: SalesInvoice[];
  onSaveDraft: (draft: Partial<SalesInvoice>) => { success: boolean; invoice?: SalesInvoice; error?: string };
  onIssueInvoice: (id: string) => { success: boolean; invoice?: SalesInvoice; error?: string };
  onCancelForm: () => void;
  onPreviewGenerated?: (invoice: SalesInvoice) => void;
}

export const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({
  initialInvoice,
  existingInvoices,
  onSaveDraft,
  onIssueInvoice,
  onCancelForm,
  onPreviewGenerated,
}) => {
  const isEditing = !!initialInvoice;

  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialInvoice?.invoiceNumber || generateUniqueInvoiceNumber(existingInvoices, 'INV-2026-')
  );
  const [currency, setCurrency] = useState(initialInvoice?.currency || 'USD');
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate || new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms] = useState(initialInvoice?.paymentTerms || 'Net 30');

  // Seller Information
  const [sellerName, setSellerName] = useState(
    initialInvoice?.seller.companyName || DEMO_USER_PROFILE.organization || 'Meridian Global Advisory Partners Inc.'
  );
  const [sellerAddress, setSellerAddress] = useState(
    initialInvoice?.seller.address || '100 Wall Street, Suite 2400, New York, NY 10005, USA'
  );
  const [sellerEmail, setSellerEmail] = useState(
    initialInvoice?.seller.email || 'billing@meridianpartners.com'
  );
  const [sellerPhone, setSellerPhone] = useState(
    initialInvoice?.seller.phone || '+1 (212) 555-0192'
  );
  const [sellerTaxId, setSellerTaxId] = useState(
    initialInvoice?.seller.taxId || 'US-EIN-12-9481920'
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialInvoice?.paymentInstructions ||
      'Wire Transfer / ACH: Chase Manhattan Bank · Routing: 021000021 · Account: 984029104'
  );

  // Customer Information
  const [customerName, setCustomerName] = useState(initialInvoice?.customer.customerName || '');
  const [customerAddress, setCustomerAddress] = useState(initialInvoice?.customer.billingAddress || '');
  const [customerEmail, setCustomerEmail] = useState(initialInvoice?.customer.email || '');
  const [customerPhone, setCustomerPhone] = useState(initialInvoice?.customer.phone || '');
  const [customerTaxId, setCustomerTaxId] = useState(initialInvoice?.customer.taxId || '');
  const [poNumber, setPoNumber] = useState(initialInvoice?.customer.poNumber || '');

  // Line Items
  const [items, setItems] = useState<SalesLineItem[]>(() => {
    if (initialInvoice && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    return [
      calculateLineItem({
        id: `item-${Date.now()}-1`,
        description: 'Financial Strategy & Treasury Advisory Services',
        quantity: 20,
        unitPrice: 250,
        discount: 0,
        discountType: 'percent',
        taxRate: 0,
      }),
    ];
  });

  // Discounts, Taxes & Additional Charges
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<'percent' | 'fixed'>(
    initialInvoice?.invoiceDiscountType || 'percent'
  );
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<string>(
    initialInvoice?.invoiceDiscountValue ? String(initialInvoice.invoiceDiscountValue) : '0'
  );

  // Tax Configuration (Supports Standard, VAT, Sales Tax, and Indian GST with CGST/SGST/IGST)
  const [taxRegime, setTaxRegime] = useState<TaxRegimeType>(
    initialInvoice?.taxConfig.regime || 'none'
  );
  const [taxLabel, setTaxLabel] = useState(initialInvoice?.taxConfig.label || 'Sales Tax');
  const [taxRate, setTaxRate] = useState<string>(
    initialInvoice?.taxConfig.defaultRate ? String(initialInvoice.taxConfig.defaultRate) : '0'
  );
  const [gstType, setGstType] = useState<'intra_state' | 'inter_state'>(
    initialInvoice?.taxConfig.gstType || 'intra_state'
  );
  const [cgstRate, setCgstRate] = useState<string>(
    initialInvoice?.taxConfig.cgstRate ? String(initialInvoice.taxConfig.cgstRate) : '9'
  );
  const [sgstRate, setSgstRate] = useState<string>(
    initialInvoice?.taxConfig.sgstRate ? String(initialInvoice.taxConfig.sgstRate) : '9'
  );
  const [igstRate, setIgstRate] = useState<string>(
    initialInvoice?.taxConfig.igstRate ? String(initialInvoice.taxConfig.igstRate) : '18'
  );

  const [additionalCharges, setAdditionalCharges] = useState<string>(
    initialInvoice?.additionalCharges ? String(initialInvoice.additionalCharges) : '0'
  );
  const [additionalChargesLabel, setAdditionalChargesLabel] = useState(
    initialInvoice?.additionalChargesLabel || 'Shipping & Courier Fee'
  );

  const [notes, setNotes] = useState(
    initialInvoice?.notes || 'Payment is requested according to agreed terms. Please reference the invoice number in the payment memo.'
  );

  // Validation & Feedback state
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-adjust due date when terms change
  const handlePaymentTermsChange = (newTerm: string) => {
    setPaymentTerms(newTerm);
    const baseDate = new Date(issueDate);
    if (isNaN(baseDate.getTime())) return;

    let daysToAdd = 30;
    if (newTerm === 'Net 15') daysToAdd = 15;
    else if (newTerm === 'Net 30') daysToAdd = 30;
    else if (newTerm === 'Net 45') daysToAdd = 45;
    else if (newTerm === 'Net 60') daysToAdd = 60;
    else if (newTerm === 'Due on Receipt') daysToAdd = 0;

    const calcDue = new Date(baseDate.getTime() + daysToAdd * 86400000);
    setDueDate(calcDue.toISOString().slice(0, 10));
  };

  // Build Tax Configuration object
  const taxConfig: TaxConfiguration = useMemo(() => {
    const isGst = taxRegime === 'gst';
    return {
      regime: taxRegime,
      label: isGst ? 'Goods & Services Tax (GST)' : taxLabel,
      defaultRate: parseFloat(taxRate) || 0,
      isGst,
      gstType,
      cgstRate: parseFloat(cgstRate) || 0,
      sgstRate: parseFloat(sgstRate) || 0,
      igstRate: parseFloat(igstRate) || 0,
    };
  }, [taxRegime, taxLabel, taxRate, gstType, cgstRate, sgstRate, igstRate]);

  // Live Totals Calculation
  const computedTotals = useMemo(() => {
    return calculateSalesInvoiceTotals({
      items,
      taxConfig,
      invoiceDiscountType,
      invoiceDiscountValue: parseFloat(invoiceDiscountValue) || 0,
      additionalCharges: parseFloat(additionalCharges) || 0,
      payments: initialInvoice?.payments || [],
    });
  }, [items, taxConfig, invoiceDiscountType, invoiceDiscountValue, additionalCharges, initialInvoice]);

  // Line item handlers
  const handleAddLineItem = () => {
    const newItem = calculateLineItem({
      id: `item-${Date.now()}-${items.length + 1}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percent',
      taxRate: 0,
    });
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof Omit<SalesLineItem, 'id' | 'lineSubtotal' | 'lineDiscountAmount' | 'taxableAmount' | 'lineTaxAmount' | 'lineTotal'>,
    val: any
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const updated = calculateLineItem({
        ...target,
        [field]: val,
      });
      copy[index] = updated;
      return copy;
    });
  };

  // Compile full invoice candidate object
  const buildInvoicePayload = (): Partial<SalesInvoice> => {
    return {
      id: initialInvoice?.id,
      invoiceNumber: invoiceNumber.trim(),
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      seller: {
        companyName: sellerName.trim(),
        address: sellerAddress.trim(),
        email: sellerEmail.trim(),
        phone: sellerPhone.trim(),
        taxId: sellerTaxId.trim(),
      },
      customer: {
        customerName: customerName.trim(),
        billingAddress: customerAddress.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
        taxId: customerTaxId.trim() || undefined,
        poNumber: poNumber.trim() || undefined,
      },
      invoiceDiscountType,
      invoiceDiscountValue: parseFloat(invoiceDiscountValue) || 0,
      taxConfig,
      additionalCharges: parseFloat(additionalCharges) || 0,
      additionalChargesLabel,
      notes: notes.trim(),
      paymentInstructions: paymentInstructions.trim(),
      payments: initialInvoice?.payments || [],
      ...computedTotals,
    };
  };

  // Save Draft Action
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    const payload = buildInvoicePayload();
    const res = onSaveDraft(payload);

    if (!res.success) {
      setErrors([res.error || 'Failed to save draft.']);
      return;
    }

    setSuccessMsg('Draft invoice saved successfully to local storage.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Issue Invoice Action
  const handleIssueInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMsg(null);

    const payload = buildInvoicePayload();

    const val = validateSalesInvoiceForIssuing(payload, existingInvoices);
    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }

    const saveRes = onSaveDraft(payload);
    if (!saveRes.success || !saveRes.invoice) {
      setErrors([saveRes.error || 'Failed to persist invoice before issuing.']);
      return;
    }

    const issueRes = onIssueInvoice(saveRes.invoice.id);
    if (!issueRes.success || !issueRes.invoice) {
      setErrors([issueRes.error || 'Failed to issue invoice.']);
      return;
    }

    if (onPreviewGenerated) {
      onPreviewGenerated(issueRes.invoice);
    }
  };

  const handleRegenerateNumber = () => {
    const next = generateUniqueInvoiceNumber(existingInvoices, 'INV-2026-');
    setInvoiceNumber(next);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancelForm}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? `Edit Draft Invoice: ${initialInvoice?.invoiceNumber}` : 'Create Customer Sales Invoice'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic B2B invoice generation with multi-currency support and configurable tax regimes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handleIssueInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validate & Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Validation Errors Notice */}
      {errors.length > 0 && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl space-y-2 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-semibold text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Please resolve the following before issuing:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-rose-300/90 text-[11px]">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form className="space-y-6">
        {/* Section 1: Invoice Metadata Header Card */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              1. Document Identification & Schedule
            </span>
            <span className="text-[11px] text-slate-400">Sequential collision-resistant numbering</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            {/* Invoice Number */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Invoice Number <span className="text-amber-400">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleRegenerateNumber}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[10px] font-mono"
                  title="Generate next available sequential number"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Currency <span className="text-amber-400">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="SGD">SGD ($) - Singapore Dollar</option>
              </select>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Issue Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  handlePaymentTermsChange(paymentTerms);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => handlePaymentTermsChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Net 15">Net 15 (15 Days)</option>
                <option value="Net 30">Net 30 (30 Days)</option>
                <option value="Net 45">Net 45 (45 Days)</option>
                <option value="Net 60">Net 60 (60 Days)</option>
                <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                <option value="Custom">Custom Terms</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Due Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parties Information (Seller & Customer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seller / Entity Profile */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Seller (Your Business Entity)
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Company / Seller Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Tax ID / GSTIN / EIN</label>
                  <input
                    type="text"
                    value={sellerTaxId}
                    onChange={(e) => setSellerTaxId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer / Client Profile */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Customer / Client
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Customer / Business Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corporation Ltd."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street, City, State/Province, Postal Code"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Customer Email</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ap@customer.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Customer Tax ID / GSTIN</label>
                  <input
                    type="text"
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                    placeholder="Optional Tax Reg #"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Itemized Line Items Table */}
        <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                3. Itemized Products & Services
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Deterministic quantity and price verification with line discounts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2 pr-3 min-w-[240px]">Description</th>
                  <th className="py-2 px-2 text-right w-24">Qty</th>
                  <th className="py-2 px-2 text-right w-32">Unit Price</th>
                  <th className="py-2 px-2 text-right w-28">Discount (%)</th>
                  <th className="py-2 px-2 text-right w-24">Tax (%)</th>
                  <th className="py-2 pl-3 text-right w-32">Line Total</th>
                  <th className="py-2 pl-2 text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 pr-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                        placeholder="Item or service description"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-400 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) => handleUpdateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleUpdateLineItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={item.discount || ''}
                        onChange={(e) => handleUpdateLineItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                        placeholder="0%"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.taxRate || ''}
                        onChange={(e) => handleUpdateLineItem(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        placeholder="0%"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-right text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-xs"
                      />
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono font-semibold text-white">
                      {currency} {item.lineTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove line item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Taxes, Discounts, and Summary Calculation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tax Regime & Discounts Configuration */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono block pb-2 border-b border-slate-800">
              4. Tax Regime & Discount Settings
            </span>

            {/* Invoice-Level Discount */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Invoice-Level Discount Type
                </label>
                <select
                  value={invoiceDiscountType}
                  onChange={(e) => setInvoiceDiscountType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ({currency})</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceDiscountValue}
                  onChange={(e) => setInvoiceDiscountValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Tax Regime Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Tax Framework
                  </label>
                  <select
                    value={taxRegime}
                    onChange={(e) => setTaxRegime(e.target.value as TaxRegimeType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="none">Tax Exempt / No Tax</option>
                    <option value="standard">Standard Sales Tax / VAT</option>
                    <option value="gst">Indian Goods & Services Tax (GST)</option>
                  </select>
                </div>

                {taxRegime === 'standard' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="e.g. 5.0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Indian GST Specific Options */}
              {taxRegime === 'gst' && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 text-[11px]">GST Supply Classification:</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gstType"
                          value="intra_state"
                          checked={gstType === 'intra_state'}
                          onChange={() => setGstType('intra_state')}
                          className="accent-amber-400"
                        />
                        <span>Intra-State (CGST + SGST)</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gstType"
                          value="inter_state"
                          checked={gstType === 'inter_state'}
                          onChange={() => setGstType('inter_state')}
                          className="accent-amber-400"
                        />
                        <span>Inter-State (IGST)</span>
                      </label>
                    </div>
                  </div>

                  {gstType === 'intra_state' ? (
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">CGST Rate (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={cgstRate}
                          onChange={(e) => setCgstRate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">SGST Rate (%)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={sgstRate}
                          onChange={(e) => setSgstRate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 font-mono">
                      <label className="block text-[10px] text-slate-400 mb-0.5">IGST Rate (%)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={igstRate}
                        onChange={(e) => setIgstRate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Charges */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Additional Charge Label
                </label>
                <input
                  type="text"
                  value={additionalChargesLabel}
                  onChange={(e) => setAdditionalChargesLabel(e.target.value)}
                  placeholder="e.g. Courier Fee"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Charge Amount ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            {/* Remittance & Terms */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Payment Instructions / Remittance Account
                </label>
                <textarea
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Invoice Notes & Terms
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Live Calculated Totals Card */}
          <div className="bg-[#121929] border border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono block pb-2 border-b border-slate-800">
                Live Calculation Breakdown
              </span>

              <div className="space-y-2 pt-3 text-xs font-mono">
                <div className="flex justify-between text-slate-400 py-1">
                  <span>Gross Subtotal:</span>
                  <span className="text-slate-200">{currency} {computedTotals.subtotal.toFixed(2)}</span>
                </div>

                {computedTotals.totalLineDiscounts > 0 && (
                  <div className="flex justify-between text-slate-400 py-1">
                    <span>Line Discounts:</span>
                    <span className="text-emerald-400">-{currency} {computedTotals.totalLineDiscounts.toFixed(2)}</span>
                  </div>
                )}

                {computedTotals.invoiceDiscountAmount > 0 && (
                  <div className="flex justify-between text-slate-400 py-1">
                    <span>Invoice-Level Discount:</span>
                    <span className="text-emerald-400">-{currency} {computedTotals.invoiceDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 py-1 border-t border-slate-800/80">
                  <span>Taxable Base Amount:</span>
                  <span className="text-slate-200 font-semibold">{currency} {computedTotals.taxableAmount.toFixed(2)}</span>
                </div>

                {/* Tax Breakdown */}
                {computedTotals.taxBreakdown.length > 0 ? (
                  computedTotals.taxBreakdown.map((t, i) => (
                    <div key={i} className="flex justify-between text-slate-400 py-1">
                      <span>{t.label}:</span>
                      <span className="text-slate-200">+{currency} {t.taxAmount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-slate-400 py-1">
                    <span>Tax:</span>
                    <span>{currency} 0.00</span>
                  </div>
                )}

                {parseFloat(additionalCharges) > 0 && (
                  <div className="flex justify-between text-slate-400 py-1">
                    <span>{additionalChargesLabel}:</span>
                    <span className="text-slate-200">+{currency} {(parseFloat(additionalCharges) || 0).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t-2 border-slate-700 text-sm font-bold text-white">
                  <span className="uppercase tracking-wider">Grand Total:</span>
                  <span className="text-amber-400 text-lg font-mono">
                    {currency} {computedTotals.grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-slate-800 text-xs font-bold text-slate-300">
                  <span>Outstanding Balance:</span>
                  <span className="text-amber-400 font-mono">
                    {currency} {computedTotals.outstandingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Final Validation Info */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-start gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Audit Compliance Check:</strong> Once issued, critical fields are locked to preserve audit integrity. Draft invoices can be saved and edited at any time.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleIssueInvoice}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  Confirm & Issue Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
