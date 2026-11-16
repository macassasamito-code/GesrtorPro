import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, offlineQueue, syncingOffline, syncOfflineQueue, isProActive } = useApp();

  if (isOnline && offlineQueue.length === 0) return null;

  return (
    <div className="bg-[#FEF9C3] dark:bg-[#2A230D] border-b border-[#EAB308]/40 dark:border-[#854D0E]/60 px-4 py-2 text-xs font-medium text-[#713F12] dark:text-[#FDE047]">
      <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0 text-[#854D0E] dark:text-[#FACC15]" />
          {!isOnline ? (
            <span>
              Sem internet — Pode continuar a registar vendas normalmente; os dados serão sincronizados depois.
            </span>
          ) : (
            <span>
              {offlineQueue.length}{' '}
              {offlineQueue.length === 1 ? 'venda offline pronta' : 'vendas offline prontas'} para sincronizar.
            </span>
          )}
        </div>

        {isOnline && isProActive && offlineQueue.length > 0 && (
          <button
            type="button"
            onClick={() => void syncOfflineQueue()}
            disabled={syncingOffline}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#854D0E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#713F12] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingOffline ? 'animate-spin' : ''}`} />
            <span>{syncingOffline ? 'A sincronizar...' : 'Sincronizar agora'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
