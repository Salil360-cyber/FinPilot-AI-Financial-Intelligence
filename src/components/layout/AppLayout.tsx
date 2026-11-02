import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavigationPage } from '../../types/finance';

interface AppLayoutProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activePage,
  onNavigate,
  searchQuery,
  onSearchChange,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b101b] text-slate-100 flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        {/* Topbar */}
        <Topbar
          activePage={activePage}
          onNavigate={onNavigate}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Viewport Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Minimal Footer */}
        <footer className="px-6 py-4 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">FinPilot AI</span>
            <span>·</span>
            <span>Enterprise Financial Intelligence & Accounting Automation</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Foundation Phase 1.0</span>
            <span>·</span>
            <span className="text-amber-400/90">Demo Environment</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
