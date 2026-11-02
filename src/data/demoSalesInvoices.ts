/**
 * FinPilot AI - Initial Demo Sales Invoices
 * Clearly labeled demo records representing customer receivables across various lifecycle statuses.
 */

import { SalesInvoice } from '../types/salesInvoice';
import { calculateSalesInvoiceTotals } from '../services/salesInvoiceCalculator';

const SELLER_DEFAULT = {
  companyName: 'Meridian Global Advisory Partners Inc.',
  address: '100 Wall Street, Suite 2400, New York, NY 10005, USA',
  email: 'billing@meridianpartners.com',
  phone: '+1 (212) 555-0192',
  taxId: 'US-EIN-12-9481920',
  paymentInstructions: 'Wire Transfer / ACH: Chase Manhattan Bank · Routing: 021000021 · Account: 984029104',
};

// 1. Draft Invoice (Unissued)
const rawDraft: any = {
  id: 'SINV-DEMO-001',
  invoiceNumber: 'INV-2026-1001',
  status: 'draft',
  issueDate: '2026-10-26',
  dueDate: '2026-11-25',
  currency: 'USD',
  paymentTerms: 'Net 30',
  seller: SELLER_DEFAULT,
  customer: {
    customerName: 'Apex Cloud Logistics Corp',
    billingAddress: '450 Innovation Parkway, Suite 500, Austin, TX 78701',
    email: 'finance@apexlogistics.io',
    phone: '+1 (512) 555-8391',
    taxId: 'TX-EIN-84-1928471',
    poNumber: 'PO-APEX-9021',
  },
  items: [
    {
      id: 'item-1',
      description: 'Enterprise Cloud Financial Systems Architecture Advisory',
      quantity: 25,
      unitPrice: 280,
      discount: 0,
      discountType: 'percent',
      taxRate: 0,
    },
    {
      id: 'item-2',
      description: 'Automated General Ledger Migration Engineering',
      quantity: 10,
      unitPrice: 150,
      discount: 0,
      discountType: 'percent',
      taxRate: 0,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'none',
    label: 'No Tax',
    defaultRate: 0,
    isGst: false,
  },
  additionalCharges: 0,
  notes: 'Draft estimate subject to final engagement scope signoff.',
  paymentInstructions: SELLER_DEFAULT.paymentInstructions,
  payments: [],
  createdAt: '2026-10-26T09:00:00Z',
  updatedAt: '2026-10-26T09:00:00Z',
  source: 'demo',
};

// 2. Issued & Unpaid (Active Net 30, Due Future)
const rawIssued: any = {
  id: 'SINV-DEMO-002',
  invoiceNumber: 'INV-2026-1002',
  status: 'issued',
  issueDate: '2026-10-18',
  dueDate: '2026-11-17',
  currency: 'USD',
  paymentTerms: 'Net 30',
  seller: SELLER_DEFAULT,
  customer: {
    customerName: 'Quantum Dynamics BioHealth Ltd',
    billingAddress: '12 Science Park Drive, Boston, MA 02115',
    email: 'ap@quantumdynamics.org',
    phone: '+1 (617) 555-4019',
    taxId: 'MA-EIN-04-9281726',
    poNumber: 'PO-QD-8812',
  },
  items: [
    {
      id: 'item-3',
      description: 'Q3 Financial Modeling & Treasury Risk Model Validation',
      quantity: 60,
      unitPrice: 320,
      discount: 5,
      discountType: 'percent',
      taxRate: 5,
    },
    {
      id: 'item-4',
      description: 'Sarbanes-Oxley Internal Control Documentation',
      quantity: 1,
      unitPrice: 6500,
      discount: 0,
      discountType: 'fixed',
      taxRate: 5,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'sales_tax',
    label: 'State Advisory Tax',
    defaultRate: 5,
    isGst: false,
  },
  additionalCharges: 250,
  additionalChargesLabel: 'Secure Document Repository Courier Fee',
  notes: 'Payment due within 30 calendar days via ACH or Fedwire.',
  paymentInstructions: SELLER_DEFAULT.paymentInstructions,
  payments: [],
  createdAt: '2026-10-18T14:20:00Z',
  updatedAt: '2026-10-18T14:30:00Z',
  issuedAt: '2026-10-18T14:30:00Z',
  source: 'demo',
};

// 3. Partially Paid Invoice
const rawPartiallyPaid: any = {
  id: 'SINV-DEMO-003',
  invoiceNumber: 'INV-2026-1003',
  status: 'partially_paid',
  issueDate: '2026-10-05',
  dueDate: '2026-11-04',
  currency: 'USD',
  paymentTerms: 'Net 30',
  seller: SELLER_DEFAULT,
  customer: {
    customerName: 'Cyberdyne Global Aerospace',
    billingAddress: '700 Technology Center Blvd, Sunnyvale, CA 94089',
    email: 'accounts@cyberdyneaero.com',
    phone: '+1 (408) 555-0912',
    taxId: 'CA-EIN-94-1029481',
    poNumber: 'PO-CYBER-5011',
  },
  items: [
    {
      id: 'item-5',
      description: 'Defense Contract Audit Agency (DCAA) Compliance Advisory',
      quantity: 80,
      unitPrice: 250,
      discount: 0,
      discountType: 'percent',
      taxRate: 0,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'none',
    label: 'Exempt',
    defaultRate: 0,
    isGst: false,
  },
  additionalCharges: 0,
  notes: 'Progress milestone billing for Phase 1 completion.',
  paymentInstructions: SELLER_DEFAULT.paymentInstructions,
  payments: [
    {
      id: 'PAY-DEMO-01',
      paymentDate: '2026-10-15',
      amount: 15000,
      paymentMethod: 'ACH Transfer',
      reference: 'ACH-TRACE-994821',
      notes: 'Initial 75% tranche received.',
      recordedAt: '2026-10-15T16:00:00Z',
      recordedBy: 'Controller (Demo)',
    },
  ],
  createdAt: '2026-10-05T10:00:00Z',
  updatedAt: '2026-10-15T16:00:00Z',
  issuedAt: '2026-10-05T10:15:00Z',
  source: 'demo',
};

// 4. Paid In Full Invoice
const rawPaid: any = {
  id: 'SINV-DEMO-004',
  invoiceNumber: 'INV-2026-1004',
  status: 'paid',
  issueDate: '2026-09-15',
  dueDate: '2026-10-15',
  currency: 'USD',
  paymentTerms: 'Net 30',
  seller: SELLER_DEFAULT,
  customer: {
    customerName: 'Helios Clean Energy Technologies',
    billingAddress: '200 Solar Way, Denver, CO 80202',
    email: 'invoicing@heliosclean.energy',
    phone: '+1 (303) 555-2918',
    taxId: 'CO-EIN-84-9102834',
    poNumber: 'PO-HELIOS-401',
  },
  items: [
    {
      id: 'item-6',
      description: 'Capital Structure & Series B Valuation Model Delivery',
      quantity: 1,
      unitPrice: 32500,
      discount: 0,
      discountType: 'fixed',
      taxRate: 0,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'none',
    label: 'Exempt',
    defaultRate: 0,
    isGst: false,
  },
  additionalCharges: 0,
  notes: 'Invoice settled in full. Thank you for your business.',
  paymentInstructions: SELLER_DEFAULT.paymentInstructions,
  payments: [
    {
      id: 'PAY-DEMO-02',
      paymentDate: '2026-10-10',
      amount: 32500,
      paymentMethod: 'Bank Wire',
      reference: 'FED-WIRE-20261010-4819',
      notes: 'Settled in full via Fedwire.',
      recordedAt: '2026-10-10T11:20:00Z',
      recordedBy: 'Controller (Demo)',
    },
  ],
  createdAt: '2026-09-15T11:00:00Z',
  updatedAt: '2026-10-10T11:20:00Z',
  issuedAt: '2026-09-15T11:30:00Z',
  source: 'demo',
};

// 5. Overdue Invoice (Issued Sept 1, Due Oct 1, Today is Oct 26)
const rawOverdue: any = {
  id: 'SINV-DEMO-005',
  invoiceNumber: 'INV-2026-1000',
  status: 'overdue',
  issueDate: '2026-09-01',
  dueDate: '2026-10-01',
  currency: 'USD',
  paymentTerms: 'Net 30',
  seller: SELLER_DEFAULT,
  customer: {
    customerName: 'Stellar Horizon Ventures LLC',
    billingAddress: '888 Brannan St, San Francisco, CA 94103',
    email: 'ap@stellarhorizon.vc',
    phone: '+1 (415) 555-9011',
    taxId: 'CA-EIN-94-3948192',
    poNumber: 'PO-SH-1092',
  },
  items: [
    {
      id: 'item-7',
      description: 'Portfolio Company Due Diligence & Financial Quality of Earnings (QoE)',
      quantity: 40,
      unitPrice: 300,
      discount: 0,
      discountType: 'percent',
      taxRate: 0,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'none',
    label: 'None',
    defaultRate: 0,
    isGst: false,
  },
  additionalCharges: 0,
  notes: 'Notice: Payment is past due. Please remit payment immediately to avoid collection fees.',
  paymentInstructions: SELLER_DEFAULT.paymentInstructions,
  payments: [],
  createdAt: '2026-09-01T09:00:00Z',
  updatedAt: '2026-09-01T09:30:00Z',
  issuedAt: '2026-09-01T09:30:00Z',
  source: 'demo',
};

// 6. Configurable GST Sample Invoice
const rawGstSample: any = {
  id: 'SINV-DEMO-006',
  invoiceNumber: 'INV-2026-1005',
  status: 'issued',
  issueDate: '2026-10-20',
  dueDate: '2026-11-19',
  currency: 'INR',
  paymentTerms: 'Net 30',
  seller: {
    companyName: 'Meridian Financial Solutions India Pvt. Ltd.',
    address: 'Level 14, Prestige Trade Tower, Palace Road, Bengaluru, Karnataka 560001, India',
    email: 'india-billing@meridianpartners.com',
    phone: '+91 80 4910 2000',
    taxId: 'GSTIN: 29AAAAA0000A1Z5',
    paymentInstructions: 'HDFC Bank Ltd · Current Account: 50200019284910 · IFSC: HDFC0000001',
  },
  customer: {
    customerName: 'Bangalore Fintech Accelerator Labs',
    billingAddress: '42 Koramangala Industrial Area, 5th Block, Bengaluru, Karnataka 560095',
    email: 'accounts@blrfintechlabs.in',
    phone: '+91 80 6100 4500',
    taxId: 'GSTIN: 29BBBBB1111B2Z6',
    poNumber: 'PO-BLR-892',
  },
  items: [
    {
      id: 'item-8',
      description: 'Fintech Regulatory Compliance & Banking Sandbox Integration Suite',
      quantity: 1,
      unitPrice: 100000,
      discount: 0,
      discountType: 'percent',
      taxRate: 18,
    },
  ],
  invoiceDiscountType: 'percent',
  invoiceDiscountValue: 0,
  taxConfig: {
    regime: 'gst',
    label: 'GST (Goods and Services Tax)',
    defaultRate: 18,
    isGst: true,
    gstType: 'intra_state',
    cgstRate: 9,
    sgstRate: 9,
  },
  additionalCharges: 0,
  notes: 'Invoice generated under GST rules. Reverse charge mechanism is not applicable.',
  paymentInstructions: 'HDFC Bank Ltd · Current Account: 50200019284910 · IFSC: HDFC0000001',
  payments: [],
  createdAt: '2026-10-20T10:00:00Z',
  updatedAt: '2026-10-20T10:30:00Z',
  issuedAt: '2026-10-20T10:30:00Z',
  source: 'demo',
};

const compileDemoInvoice = (raw: any): SalesInvoice => {
  const totals = calculateSalesInvoiceTotals({
    items: raw.items,
    taxConfig: raw.taxConfig,
    invoiceDiscountType: raw.invoiceDiscountType,
    invoiceDiscountValue: raw.invoiceDiscountValue,
    additionalCharges: raw.additionalCharges,
    payments: raw.payments,
  });

  return {
    ...raw,
    ...totals,
  };
};

export const DEMO_SALES_INVOICES: SalesInvoice[] = [
  compileDemoInvoice(rawDraft),
  compileDemoInvoice(rawIssued),
  compileDemoInvoice(rawPartiallyPaid),
  compileDemoInvoice(rawPaid),
  compileDemoInvoice(rawOverdue),
  compileDemoInvoice(rawGstSample),
];
