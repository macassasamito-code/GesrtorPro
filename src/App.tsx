import React from 'react';
import {
  BarChart3,
  Crown,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { AdminPanelView } from './components/AdminPanelView';
import { CustomersView } from './components/CustomersView';
import { DashboardView } from './components/DashboardView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { ProPaywallModal } from './components/ProPaywallModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ReportsView } from './components/ReportsView';
import { SettingsTeamView } from './components/SettingsTeamView';
import { WelcomeAuthView } from './components/WelcomeAuthView';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppTab } from './types';

function MainShell() {
  const {
    authReady,
    firebaseUser,
    isStaff,
    isDemoMode,
    showWelcomeScreen,
    activeTab,
    setActiveTab,
    subView,
    setSubView,
    paywallOpen,
    closePaywall,
    openPaywall,
    toast,
  } = useApp();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F6F8F6] dark:bg-[#0B140F] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-[#15803D] text-white font-display font-extrabold text-xl flex items-center justify-center mx-auto">
            GP
          </div>
          <p className="text-sm font-medium text-[#4B5E53] dark:text-[#8FA598]">A abrir GestorPro...</p>
        </div>
      </div>
    );
  }

  if (showWelcomeScreen && !firebaseUser) {
    return (
      <>
        <WelcomeAuthView />
        <ProPaywallModal open={paywallOpen} onClose={closePaywall} />
      </>
    );
  }

  const navItems: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'vender', label: 'Vender', icon: ShoppingCart },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'clientes', label: 'Clientes', icon: Users },
    ...(!isStaff ? [{ id: 'relatorios' as AppTab, label: 'Relatórios', icon: BarChart3 }] : []),
  ];

  const handleSelectTab = (tab: AppTab) => {
    setSubView('none');
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] dark:bg-[#0B140F] text-[#0F1F16] dark:text-[#F1F5F2] flex flex-col transition-colors duration-200">
      {/* Compact Sticky Top Header (3-zone contract) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#121F18]/95 backdrop-blur-md border-b border-[#E2E8E4] dark:border-[#23382C]">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => handleSelectTab('inicio')}
            className="text-lg font-display font-extrabold tracking-tight text-[#0F1F16] dark:text-[#F1F5F2] whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="h-8 w-8 rounded-xl bg-[#15803D] text-white text-xs font-extrabold flex items-center justify-center">
              GP
            </span>
            <span>GestorPro</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = subView === 'none' && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`text-sm font-semibold whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'border-[#15803D] dark:border-[#4ADE80] text-[#15803D] dark:text-[#4ADE80]'
                      : 'border-transparent text-[#4B5E53] dark:text-[#8FA598] hover:text-[#0F1F16] dark:hover:text-[#F1F5F2]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Primary Top Action Zone */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact />
            {isDemoMode && (
              <button
                type="button"
                onClick={() => openPaywall('activar o plano Pro')}
                className="min-h-[40px] rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] px-3 text-xs font-bold text-[#0F1F16] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Crown className="h-3.5 w-3.5 text-[#854D0E]" />
                <span>Pro</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubView(subView === 'definicoes' ? 'none' : 'definicoes')}
              aria-label="Definições e equipa"
              className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors ${
                subView !== 'none'
                  ? 'bg-[#15803D] text-white'
                  : 'text-[#0F1F16] dark:text-[#F1F5F2] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]'
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <OfflineIndicator />

      {/* Main Scrollable Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-5 pb-24 md:pb-8">
        {subView === 'admin' ? (
          <AdminPanelView />
        ) : subView === 'definicoes' || subView === 'equipa' ? (
          <SettingsTeamView />
        ) : activeTab === 'inicio' ? (
          <DashboardView />
        ) : activeTab === 'vender' ? (
          <PosView />
        ) : activeTab === 'produtos' ? (
          <ProductsView />
        ) : activeTab === 'clientes' ? (
          <CustomersView />
        ) : (
          <ReportsView />
        )}
      </main>

      {/* Mobile Fixed 5-Tab Bottom Navigation */}
      <nav
        aria-label="Navegação principal"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121F18]/95 backdrop-blur-md border-t border-[#E2E8E4] dark:border-[#23382C] pb-safe"
      >
        <div
          className={`grid ${isStaff ? 'grid-cols-4' : 'grid-cols-5'} h-16 items-center max-w-lg mx-auto`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = subView === 'none' && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#15803D] dark:text-[#4ADE80]' : 'text-[#4B5E53] dark:text-[#8FA598]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Pro Paywall & Payment Sheet */}
      <ProPaywallModal open={paywallOpen} onClose={closePaywall} />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-16 right-4 left-4 sm:left-auto sm:max-w-sm z-50 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg border ${
            toast.tone === 'error'
              ? 'bg-red-700 text-white border-red-800'
              : toast.tone === 'warning'
              ? 'bg-[#FEF9C3] dark:bg-[#2A230D] text-[#713F12] dark:text-[#FDE047] border-[#EAB308]'
              : 'bg-[#0F1F16] dark:bg-[#182920] text-white border-[#1E3527] dark:border-[#2E4839]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MainShell />
      </AppProvider>
    </ThemeProvider>
  );
}
