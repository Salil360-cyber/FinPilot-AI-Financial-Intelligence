import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Sliders,
  Database,
  Download,
  Sparkles,
  HardDrive,
  ShieldCheck,
  Activity,
  Info,
  Save,
  CheckCircle2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useFinancialContext } from '../context/FinancialContext';
import {
  CompanyProfile,
  FinancialPreferences,
  StorageCategoryMeta,
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_FINANCIAL_PREFERENCES,
} from '../types/settings';
import {
  getStoredCompanyProfile,
  getStoredFinancialPreferences,
  inspectStorageMetadata,
  generateFullBackupArtifact,
} from '../services/dataManagementEngine';

// Components
import { CompanyProfileSection } from '../components/settings/CompanyProfileSection';
import { FinancialPreferencesSection } from '../components/settings/FinancialPreferencesSection';
import { DataManagementSection } from '../components/settings/DataManagementSection';
import { BackupRestoreSection } from '../components/settings/BackupRestoreSection';
import { DemoDataSection } from '../components/settings/DemoDataSection';
import { StorageIntegritySection } from '../components/settings/StorageIntegritySection';
import { PrivacySecuritySection } from '../components/settings/PrivacySecuritySection';
import { SystemDiagnosticsSection } from '../components/settings/SystemDiagnosticsSection';
import { AboutFinPilotSection } from '../components/settings/AboutFinPilotSection';
import { ResetDeleteModal } from '../components/settings/ResetDeleteModal';
import { Phase11TestRunnerModal } from '../components/settings/Phase11TestRunnerModal';

type SettingsTab =
  | 'company_profile'
  | 'financial_preferences'
  | 'data_management'
  | 'backup_restore'
  | 'demo_data'
  | 'storage_integrity'
  | 'privacy_security'
  | 'system_diagnostics'
  | 'about_finpilot';

export const Settings: React.FC = () => {
  const { resetToDemoData } = useFinancialContext();

  const [activeTab, setActiveTab] = useState<SettingsTab>('company_profile');
  const [profile, setProfile] = useState<CompanyProfile>(() => getStoredCompanyProfile());
  const [preferences, setPreferences] = useState<FinancialPreferences>(() =>
    getStoredFinancialPreferences()
  );

  const [storageMeta, setStorageMeta] = useState(() => inspectStorageMetadata());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefreshStorage = () => {
    setStorageMeta(inspectStorageMetadata());
    setProfile(getStoredCompanyProfile());
    setPreferences(getStoredFinancialPreferences());
  };

  const handleQuickBackup = () => {
    try {
      const artifact = generateFullBackupArtifact(profile.companyName);
      const jsonString = JSON.stringify(artifact, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `FinPilot_Backup_${profile.companyName.replace(/\s+/g, '_')}_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Quick backup downloaded successfully');
    } catch (err: any) {
      showToast(`Backup failed: ${err.message}`);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'company_profile', label: 'Company Profile', icon: Building2 },
    { id: 'financial_preferences', label: 'Financial Preferences', icon: Sliders },
    { id: 'data_management', label: 'Data Management', icon: Database },
    { id: 'backup_restore', label: 'Backup & Restore', icon: Download },
    { id: 'demo_data', label: 'Demo Data Lifecycle', icon: Sparkles },
    { id: 'storage_integrity', label: 'Storage & Integrity', icon: HardDrive },
    { id: 'privacy_security', label: 'Privacy & Security', icon: ShieldCheck },
    { id: 'system_diagnostics', label: 'System Diagnostics', icon: Activity },
    { id: 'about_finpilot', label: 'About FinPilot AI', icon: Info },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-800 text-white border border-slate-700 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Phase 11
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Centralized System Administration
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Settings, Data Management & Administration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage company preferences, inspect storage footprint, export full backups, and govern demonstration data.
          </p>
        </div>

        {/* Global Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestRunner(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition border border-slate-700"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verification Tests (30)</span>
          </button>

          <button
            onClick={handleQuickBackup}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Quick Backup JSON</span>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/80 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset & Deletion</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION RENDERINGS */}
      {activeTab === 'company_profile' && (
        <CompanyProfileSection
          profile={profile}
          onUpdateProfile={(updated) => {
            setProfile(updated);
            handleRefreshStorage();
          }}
          onToast={showToast}
        />
      )}

      {activeTab === 'financial_preferences' && (
        <FinancialPreferencesSection
          preferences={preferences}
          onUpdatePreferences={(updated) => {
            setPreferences(updated);
            handleRefreshStorage();
          }}
          onToast={showToast}
        />
      )}

      {activeTab === 'data_management' && (
        <DataManagementSection
          storageCategories={storageMeta.categories}
          totalFinPilotBytes={storageMeta.totalFinPilotBytes}
          totalRecords={storageMeta.totalRecords}
          onRefresh={handleRefreshStorage}
        />
      )}

      {activeTab === 'backup_restore' && (
        <BackupRestoreSection
          entityName={profile.companyName}
          onRefreshStorage={handleRefreshStorage}
          onToast={showToast}
        />
      )}

      {activeTab === 'demo_data' && (
        <DemoDataSection
          storageCategories={storageMeta.categories}
          onResetToDemoData={resetToDemoData}
          onRefreshStorage={handleRefreshStorage}
          onToast={showToast}
        />
      )}

      {activeTab === 'storage_integrity' && (
        <StorageIntegritySection
          storageCategories={storageMeta.categories}
          totalFinPilotBytes={storageMeta.totalFinPilotBytes}
          onRefresh={handleRefreshStorage}
        />
      )}

      {activeTab === 'privacy_security' && <PrivacySecuritySection />}

      {activeTab === 'system_diagnostics' && (
        <SystemDiagnosticsSection onOpenPhase11Tests={() => setShowTestRunner(true)} />
      )}

      {activeTab === 'about_finpilot' && <AboutFinPilotSection />}

      {/* Modals */}
      <ResetDeleteModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onRefreshStorage={handleRefreshStorage}
        onToast={showToast}
      />

      <Phase11TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />
    </div>
  );
};
