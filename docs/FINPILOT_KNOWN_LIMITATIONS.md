# FinPilot AI — Known Limitations & System Boundaries

**Document Version:** 1.0.0  
**Phase:** Phase 13 Release Baseline  
**Scope:** Architecture, Persistence, Client-Side OCR, External AI Integration, and Regulatory Scope  

---

## 1. Storage & Persistence Boundaries

### 1.1 HTML5 LocalStorage Constraints
- **Capacity Ceiling:** Data persistence relies on the browser's origin-scoped `localStorage` mechanism. Most modern desktop browsers enforce a strict ceiling between 5 MB and 10 MB per origin.
- **Eviction Risk:** If a user clears their browser cache, uses private/incognito browsing windows, or executes aggressive storage cleaner extensions, application data will be erased unless previously exported via the Settings > Backup & Restore facility.
- **Recommended Practice:** Operators should routinely generate and download JSON backup snapshots via the Settings module.

### 1.2 Multi-User Concurrency & Synchronization
- **Single-Tenant Sandbox:** Current architecture operates as a client-local workspace. Changes made in one browser window or device do not synchronize in real time to other team members without manual export/import.
- **No Shared Relational Database:** Out-of-the-box operation is zero-cloud and zero-subscription. Enterprise deployments requiring concurrent multi-user ACID transactions will require attaching an external SQL database (e.g., Cloud SQL PostgreSQL).

---

## 2. Document Processing & In-Browser OCR Limits

### 2.1 WebAssembly & CPU Bound Processing
- **Execution Environment:** Invoice optical character recognition (OCR) executes entirely client-side using WebAssembly-compiled Tesseract.js and PDF.js workers.
- **Performance:** Processing speed is proportional to client hardware performance. Large multi-page PDF documents (>15 pages) or high-resolution uncompressed scans (>10MB) may experience processing latency or memory pressure.
- **Layout Variance:** Complex multi-column tables, skewed scans, non-standard tabular alignments, or handwritten notes may yield partial confidence scores requiring human verification before general ledger posting.

---

## 3. External AI Integration & Network Boundaries

### 3.1 Server-Side Proxy Architecture
- **API Key Injection:** External generative commentary uses Google GenAI (`gemini-3.8-flash`) via the server-side Express proxy (`/server.ts`). An API key must be injected via the `GEMINI_API_KEY` environment variable.
- **Zero-Key Fallback:** When deployed without an external API key or in air-gapped/offline networks, the application automatically engages its deterministic financial heuristics engine. No application feature is blocked or broken by the absence of an API key.

### 3.2 Grounding Boundary
- **Strict Metric Pass-Through:** The server passes only aggregated financial summaries and rule-based indicators to the language model. The model is instructed under strict system constraints never to hallucinate metrics or invent numbers.
- **Advisory Scope:** AI commentary provides natural language contextualization of calculated ratios; it does not replace professional management review.

---

## 4. Regulatory, Compliance & Professional Disclaimer

- **Not Certified Financial or Tax Advice:** FinPilot AI is a decision-support, accounting automation, and financial analysis tool. It is not an accredited Certified Public Accountant (CPA), Chartered Financial Analyst (CFA), licensed auditor, or registered investment advisor.
- **Tax Filing Requirements:** All statutory tax calculations, VAT filings, and depreciation schedules must be verified by certified accounting personnel in accordance with jurisdiction-specific GAAP or IFRS guidelines before formal submission to regulatory authorities.
- **Audit Defense:** While FinPilot AI records immutable session snapshots and audit trail events, it does not constitute an external third-party SOC 2 or ISO 27001 certified audit trail unless deployed within a certified infrastructure.
