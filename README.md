# FinPilot AI – Financial Data Intelligence & Operational Risk Platform

## Overview

FinPilot AI is an integrated financial operations and intelligence platform designed to bring invoice processing, expense and ledger management, invoice generation, bank reconciliation, financial analytics, revenue forecasting, AI-assisted financial advisory, and executive reporting into one application.

The project combines financial workflow management with document processing, analytical reporting, validation checks, and AI-assisted capabilities.

> **Project status:** Portfolio demonstration project. The provided interface screenshots show the application in Demo Mode with demonstration records.

## Problem Statement

Financial operations involve multiple connected activities, including invoice handling, expense tracking, ledger management, bank reconciliation, receivables monitoring, and financial reporting.

When these workflows are managed separately, reviewing financial information and maintaining consistency across processes can become challenging.

FinPilot AI was developed to demonstrate how these workflows can be organized within an integrated financial operations interface.

## Project Objectives

- Integrate multiple financial workflows into one application.
- Support invoice document processing using OCR.
- Organize expense and ledger information.
- Support invoice generation and receivables tracking.
- Compare bank statement entries with ledger records.
- Present financial analytics and revenue forecasting.
- Provide AI-assisted financial advisory capabilities.
- Support executive reporting and operational review.

## STAR Method – Project Explanation

### 1. Situation

Financial workflows involving invoices, expenses, ledgers, bank reconciliation, receivables, and reporting require information to be managed across multiple processes.

Document extraction, financial calculations, reconciliation, and reporting consistency are important considerations in these workflows.

### 2. Task

Develop an integrated financial intelligence platform that brings financial workflow management, document processing, analytics, forecasting, and reporting capabilities together.

### 3. Action

- Implemented invoice intelligence, expense and ledger management, invoice generation, and bank reconciliation modules.
- Integrated OCR-related document processing using Tesseract.js and PDF.js.
- Integrated Google Gemini API-based AI capabilities with a deterministic fallback approach when AI functionality is unavailable.
- Designed financial analytics and revenue forecasting workflows.
- Created reporting views covering operating expenses, receivables, reconciliation status, and financial performance indicators.
- Reviewed financial calculations, reporting consistency, currency formatting, and CSV formula-injection safeguards.
- Documented application behavior, test results, and known limitations.

### 4. Result

- Built 12 test suites with **295 test cases** in total. The 285 that run outside the browser pass with `npm test` (285/285); the 10 Invoice Intelligence (Phase 2) tests run inside the app.
- Documented checks for financial reporting consistency, currency formatting, and spreadsheet-export security.
- Built an integrated demonstration of invoice processing, ledger management, reconciliation, financial analytics, and reporting workflows.
- Identified limitations requiring human review, particularly for complex OCR extraction.

## Application Modules & Screenshots

### 1. Financial Operations Overview

The overview dashboard consolidates key financial indicators, including total expenses, processed invoices, reconciliation rate, outstanding items, and operating trends.

![Financial Operations Overview](docs/screenshots/01-financial-overview.png)

### 2. Invoice Intelligence

Supports invoice document upload and OCR-related extraction workflows, mathematical validation, and invoice processing.

![Invoice Intelligence](docs/screenshots/02-invoice-intelligence.png)

### 3. Expense Ledger

Provides a general ledger and expense management interface with transaction records, debit and credit information, filtering, CSV import/export, and validation workflows.

![Expense Ledger](docs/screenshots/03-expense-ledger.png)

### 4. Invoice Generator

Supports customer invoice creation, invoice tracking, outstanding balance monitoring, and payment status visibility.

![Invoice Generator](docs/screenshots/04-invoice-generator.png)

### 5. Bank Reconciliation

Provides a workflow for comparing bank statement entries with general ledger records, identifying unmatched transactions, reviewing exceptions, and tracking reconciliation status.

![Bank Reconciliation](docs/screenshots/05-bank-reconciliation.png)

### 6. Financial Analytics

Presents financial analysis views covering revenue, expenses, profitability, financial ratios, period comparisons, and cash movement.

![Financial Analytics](docs/screenshots/06-financial-analytics.png)

### 7. AI Financial Advisory

Provides AI-assisted financial decision-support features, including diagnostic findings, prioritized action items, and what-if scenario modeling.

![AI Financial Advisory](docs/screenshots/07-ai-financial-advisory.png)

### 8. Help Center & Workflow Guidance

Includes guided financial workflows, a knowledge base, FAQs, a financial glossary, and onboarding guidance.

![Help Center Workflows](docs/screenshots/08-help-center-workflows.png)

## Features

- Invoice OCR and document processing
- Expense and general ledger management
- Invoice generation
- Bank reconciliation and transaction matching
- Financial analytics and ratio calculations
- Revenue forecasting
- Annual report intelligence
- AI-assisted financial advisory
- Executive reporting
- CSV import and export workflows
- Help center and guided workflows

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Backend | Express.js |
| AI Integration | Google Gemini API |
| OCR Processing | Tesseract.js |
| PDF Processing | PDF.js |
| Data Persistence | Browser-based localStorage |
| Reporting | Financial dashboards and CSV reports |

## Testing & Quality Checks

The project has **12 test suites with 295 test cases**:

| Suite | Tests | How it runs |
|---|---|---|
| Phases 3–12 (ledger, invoicing, reconciliation, analytics, forecasting, annual reports, advisory, executive reports, settings, help center) | 275 | `npm test` |
| Cross-module consistency | 10 | `npm test` |
| Phase 2 – Invoice Intelligence | 10 | Inside the app (React component) |

`npm test` runs the 285 headless tests with an in-memory replacement for the browser's localStorage. Current result: **285/285 passed**. `npm run lint` (TypeScript type-check) passes with no errors, and `npm run build` produces the production bundle.

Documented checks include:

- Financial calculation consistency
- Reporting consistency
- Currency formatting
- Cross-module consistency
- CSV formula-injection safeguards

The reported pass rate is based on the documented test suite. It is not a claim of complete code coverage or a guarantee that the application is bug-free.

## Run Locally

**Prerequisites:** Node.js 20 or newer.

```bash
npm install
cp .env.example .env         # add your own GEMINI_API_KEY (optional: the app falls back to rule-based logic without it)
npm run dev                  # starts the app on http://localhost:3000
npm test                     # runs the 285 headless test cases
npm run lint                 # TypeScript type-check
```

Never commit a real API key; `.env*` files are git-ignored (only `.env.example` is tracked).

## Project Structure

| Path | Contents |
|---|---|
| `src/pages/` | One page per module (overview, invoices, ledger, reconciliation, analytics, forecast, advisory, reports, settings, help) |
| `src/components/` | UI components, grouped by module |
| `src/services/` | Calculation engines, validators, Gemini integration and the test suites |
| `src/data/` | Demo data, glossary and help articles |
| `server.ts` | Express server (serves the app and the Gemini API route) |
| `scripts/run-test-suites.ts` | Headless test runner used by `npm test` |
| `docs/` | QA report, known limitations, screenshots |

## Known Limitations

- Application data persistence uses browser-based localStorage.
- Complex OCR extraction requires human review.
- Annual report extraction includes simulated or rule-based processing.
- AI-assisted outputs require human review before being used in financial decisions.
- The application is a portfolio demonstration and is not certified financial, accounting, tax, audit, or investment advice.
- Demonstration screenshots contain demo-mode records and should not be interpreted as actual client or company financial data.

## Key Skills Demonstrated

- Financial Data Analysis
- Data Validation
- Invoice Processing
- OCR Integration
- Expense and Ledger Management
- Bank Reconciliation
- Financial Reporting
- Data Quality Checks
- AI API Integration
- Testing and Quality Assurance
- Problem-Solving

## Project Disclaimer

FinPilot AI is a portfolio project developed for learning and demonstration purposes. Demonstration records and interface metrics are not representations of actual financial institution data. Financial outputs and AI-assisted suggestions should be reviewed by qualified professionals before real-world use.
