import React, { useState } from 'react';
import { Download, Laptop, Share, Smartphone, X } from 'lucide-react';
import { DevicePlatform, usePWAInstall } from '../services/offlineSync';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, platform, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<DevicePlatform>(platform);

  if (isInstalled) return null;

  const handleTrigger = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) return;
    }
    setGuideTab(platform);
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleTrigger()}
        className={`flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors whitespace-nowrap shrink-0 ${
          compact
            ? 'min-h-[40px] border border-[#15803D]/30 dark:border-[#4ADE80]/30 bg-[#F0FDF4] dark:bg-[#143322] text-[#15803D] dark:text-[#4ADE80] hover:bg-[#DCFCE7] dark:hover:bg-[#19402B] px-3 text-xs'
            : 'min-h-[48px] w-full bg-[#15803D] text-white hover:bg-[#166534] px-4 text-sm'
        }`}
      >
        {platform === 'ios' && !isInstallable ? (
          <Share className="h-4 w-4 shrink-0" />
        ) : (
          <Download className="h-4 w-4 shrink-0" />
        )}
        <span>
          {compact
            ? 'Instalar'
            : isInstallable
            ? 'Instalar App no Dispositivo'
            : 'Instalar GestorPro (App Offline)'}
        </span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F1F16]/60 dark:bg-black/75 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121F18] p-6 shadow-2xl border border-[#E2E8E4] dark:border-[#23382C]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#0F1F16] dark:text-[#F1F5F2]">Instalar o GestorPro</h3>
                <p className="text-xs text-[#4B5E53] dark:text-[#8FA598] mt-0.5">
                  Funciona como app nativa e regista vendas mesmo sem internet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Fechar"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#4B5E53] dark:text-[#8FA598] hover:bg-[#F1F5F2] dark:hover:bg-[#182920]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Platform Tabs */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-[#F6F8F6] dark:bg-[#0E1813] p-1 border border-[#E2E8E4] dark:border-[#23382C]">
              <button
                type="button"
                onClick={() => setGuideTab('android')}
                className={`min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  guideTab === 'android'
                    ? 'bg-white dark:bg-[#182920] text-[#15803D] dark:text-[#4ADE80] shadow-xs'
                    : 'text-[#4B5E53] dark:text-[#8FA598]'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('ios')}
                className={`min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  guideTab === 'ios'
                    ? 'bg-white dark:bg-[#182920] text-[#15803D] dark:text-[#4ADE80] shadow-xs'
                    : 'text-[#4B5E53] dark:text-[#8FA598]'
                }`}
              >
                <Share className="h-3.5 w-3.5" />
                <span>iPhone/iPad</span>
              </button>
              <button
                type="button"
                onClick={() => setGuideTab('desktop')}
                className={`min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  guideTab === 'desktop'
                    ? 'bg-white dark:bg-[#182920] text-[#15803D] dark:text-[#4ADE80] shadow-xs'
                    : 'text-[#4B5E53] dark:text-[#8FA598]'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>Computador</span>
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E2E8E4] dark:border-[#23382C] bg-[#F8FAF8] dark:bg-[#182920] p-4">
              {guideTab === 'android' && (
                <ol className="space-y-2 text-sm text-[#36493E] dark:text-[#B9C9BF]">
                  <li>1. Abra o <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">GestorPro</strong> no navegador <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Chrome</strong> ou <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Edge</strong>.</li>
                  <li>2. Toque no menu <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">⋮</strong> (três pontos no canto superior direito).</li>
                  <li>3. Escolha <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Instalar aplicação</strong> ou <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Adicionar ao ecrã inicial</strong>.</li>
                  <li>4. Confirme em <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Instalar</strong> para criar o ícone no telemóvel.</li>
                </ol>
              )}

              {guideTab === 'ios' && (
                <ol className="space-y-2 text-sm text-[#36493E] dark:text-[#B9C9BF]">
                  <li>1. Abra o <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">GestorPro</strong> no navegador <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Safari</strong>.</li>
                  <li>2. Toque no botão <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Partilhar</strong> (ícone de quadrado com seta para cima).</li>
                  <li>3. Deslize para baixo e toque em <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Adicionar ao Ecrã Principal</strong>.</li>
                  <li>4. Toque em <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Adicionar</strong> no canto superior direito.</li>
                </ol>
              )}

              {guideTab === 'desktop' && (
                <ol className="space-y-2 text-sm text-[#36493E] dark:text-[#B9C9BF]">
                  <li>1. Abra o <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">GestorPro</strong> no <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Google Chrome</strong> ou <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Microsoft Edge</strong>.</li>
                  <li>2. Clique no ícone de <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">Instalar</strong> no lado direito da barra de endereço (ou no menu <strong className="text-[#0F1F16] dark:text-[#F1F5F2]">⋮ → Guardar e partilhar → Instalar GestorPro</strong>).</li>
                  <li>3. A aplicação abrirá numa janela própria e funcionará offline.</li>
                </ol>
              )}
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await install();
                  if (ok) setShowGuideModal(false);
                }}
                className="mt-4 min-h-[48px] w-full rounded-xl bg-[#15803D] text-sm font-bold text-white hover:bg-[#166534]"
              >
                Instalar Agora
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-2.5 min-h-[46px] w-full rounded-xl border border-[#CBD5CF] dark:border-[#2E4839] bg-white dark:bg-[#182920] text-sm font-semibold text-[#0F1F16] dark:text-[#F1F5F2]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
