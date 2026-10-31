/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationPage } from './types/finance';
import { FinancialProvider } from './context/FinancialContext';
import { AppLayout } from './components/layout/AppLayout';
import { Overview } from './pages/Overview';
import { InvoiceIntelligence } from './pages/InvoiceIntelligence';
import { ExpenseLedger } from './pages/ExpenseLedger';
import { InvoiceGenerator } from './pages/InvoiceGenerator';
import { BankReconciliation } from './pages/BankReconciliation';
import { FinancialAnalytics } from './pages/FinancialAnalytics';
import { RevenueForecast } from './pages/RevenueForecast';
import { AnnualReportIntelligence } from './pages/AnnualReportIntelligence';
import { FinancialAdvisory } from './pages/FinancialAdvisory';
import { ExecutiveReports } from './pages/ExecutiveReports';
import { Settings } from './pages/Settings';
import { HelpCenter } from './pages/HelpCenter';
import { WelcomeOnboardingModal } from './components/help/WelcomeOnboardingModal';
import { getOnboardingState } from './services/onboardingService';

export default function App() {
  const [activePage, setActivePage] = useState<NavigationPage>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    try {
      const state = getOnboardingState();
      return !state.hasCompletedWelcome && !state.hasDismissedOnboarding;
    } catch {
      return false;
    }
  });

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'overview':
        return <Overview onNavigate={setActivePage} searchQuery={searchQuery} />;
      case 'invoice-intelligence':
        return <InvoiceIntelligence />;
      case 'expense-ledger':
        return <ExpenseLedger />;
      case 'invoice-generator':
        return <InvoiceGenerator />;
      case 'bank-reconciliation':
        return <BankReconciliation />;
      case 'financial-analytics':
        return <FinancialAnalytics />;
      case 'revenue-forecast':
        return <RevenueForecast />;
      case 'annual-report':
        return <AnnualReportIntelligence />;
      case 'ai-advisory':
        return <FinancialAdvisory />;
      case 'executive-reports':
        return <ExecutiveReports />;
      case 'help-center':
        return <HelpCenter onNavigate={setActivePage} />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview onNavigate={setActivePage} searchQuery={searchQuery} />;
    }
  };

  return (
    <FinancialProvider>
      <AppLayout
        activePage={activePage}
        onNavigate={setActivePage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {renderCurrentPage()}
      </AppLayout>

      <WelcomeOnboardingModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onNavigate={setActivePage}
      />
    </FinancialProvider>
  );
}
