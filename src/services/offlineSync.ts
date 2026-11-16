import { useEffect, useState } from 'react';
import { OfflineQueuedSale } from '../types';

const OFFLINE_QUEUE_KEY = 'bancafacil_offline_sales_v1';

export function loadOfflineQueue(): OfflineQueuedSale[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(queue: OfflineQueuedSale[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function enqueueOfflineSale(sale: OfflineQueuedSale): OfflineQueuedSale[] {
  const current = loadOfflineQueue();
  const next = [...current, sale];
  saveOfflineQueue(next);
  return next;
}

export function removeOfflineSale(offlineId: string): OfflineQueuedSale[] {
  const current = loadOfflineQueue();
  const next = current.filter((item) => item.offlineId !== offlineId);
  saveOfflineQueue(next);
  return next;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __bfDeferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export type DevicePlatform = 'ios' | 'android' | 'desktop';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    typeof window !== 'undefined' ? window.__bfDeferredInstallPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>('desktop');

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const androidDevice = /android/.test(ua);
    setIsIOS(iosDevice);
    setPlatform(iosDevice ? 'ios' : androidDevice ? 'android' : 'desktop');

    if (window.__bfDeferredInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__bfDeferredInstallPrompt);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__bfDeferredInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      window.__bfDeferredInstallPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [deferredPrompt]);

  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || window.__bfDeferredInstallPrompt;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      window.__bfDeferredInstallPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    platform,
    install,
  };
}
