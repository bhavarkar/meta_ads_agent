import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClientProvider } from './context/ClientContext';
import { Sidebar, NavItem } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { CompetitorIntelPage } from './pages/CompetitorIntelPage';
import { StrategyGeneratorPage } from './pages/StrategyGeneratorPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReelsStudioPage } from './pages/ReelsStudioPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { ClientsPage } from './pages/ClientsPage';
import { TeamManagementPage } from './pages/TeamManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CreateCampaignModal } from './components/campaigns/CreateCampaignModal';
import { UploadReelModal } from './components/reels/UploadReelModal';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | 'reset'>('login');
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [passedHook, setPassedHook] = useState<string>('');

  // Modals
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isUploadReelOpen, setIsUploadReelOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const handleAdoptHook = (hookText: string) => {
    setPassedHook(hookText);
    setCurrentTab('strategy');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 animate-pulse mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-400">Loading MetaPilot AI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return <SignupPage onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    if (authScreen === 'reset') {
      return <ResetPasswordPage onNavigateToLogin={() => setAuthScreen('login')} />;
    }
    return (
      <LoginPage
        onNavigateToSignup={() => setAuthScreen('signup')}
        onNavigateToReset={() => setAuthScreen('reset')}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Fixed Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenAddClient={() => setIsAddClientOpen(true)}
          onNavigate={(tab) => setCurrentTab(tab as any)}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenCreateCampaign={() => setIsCreateCampaignOpen(true)}
              onOpenUploadReel={() => setIsUploadReelOpen(true)}
            />
          )}

          {currentTab === 'competitors' && (
            <CompetitorIntelPage onUseHookInStrategy={handleAdoptHook} />
          )}

          {currentTab === 'strategy' && (
            <StrategyGeneratorPage
              initialHook={passedHook}
              onCampaignCreated={() => setCurrentTab('campaigns')}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsPage onOpenCreate={() => setIsCreateCampaignOpen(true)} />
          )}

          {currentTab === 'reels' && (
            <ReelsStudioPage onOpenUpload={() => setIsUploadReelOpen(true)} />
          )}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'recommendations' && <RecommendationsPage />}

          {currentTab === 'automations' && <AutomationsPage />}

          {currentTab === 'clients' && (
            <ClientsPage
              isOpenAddModal={isAddClientOpen}
              onCloseAddModal={() => setIsAddClientOpen(false)}
              onOpenAddModal={() => setIsAddClientOpen(true)}
            />
          )}

          {currentTab === 'team' && <TeamManagementPage />}

          {currentTab === 'audit-logs' && <AuditLogsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        onSuccess={() => setCurrentTab('campaigns')}
      />

      <UploadReelModal
        isOpen={isUploadReelOpen}
        onClose={() => setIsUploadReelOpen(false)}
        onSuccess={() => setCurrentTab('reels')}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ClientProvider>
          <AppContent />
        </ClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
