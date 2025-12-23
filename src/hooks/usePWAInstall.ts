import { useState, useEffect, useCallback } from 'react';

/**
 * Interface para o evento beforeinstallprompt do navegador
 * Este evento é disparado quando o PWA atende aos critérios de instalação
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook para gerenciar a instalação do PWA
 * Detecta se o app pode ser instalado e fornece método para iniciar instalação
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Função para adicionar logs de debug
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[PWA] ${message}`);
    setDebugInfo(prev => [...prev.slice(-9), logMessage]);
  }, []);

  useEffect(() => {
    // Detecta se está rodando como PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    // Detecta plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isChromium = /chrome|chromium|crios/.test(userAgent) && !/edg/.test(userAgent);
    
    setIsInstalled(isStandalone || isInWebAppiOS);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    addDebugLog(`Plataforma detectada: ${isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop'}`);
    addDebugLog(`Navegador Chromium: ${isChromium ? 'Sim' : 'Não'}`);
    addDebugLog(`Modo standalone: ${isStandalone || isInWebAppiOS ? 'Sim (já instalado)' : 'Não'}`);

    // Handler para quando o navegador detecta que o PWA pode ser instalado
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      addDebugLog('✅ Evento beforeinstallprompt capturado!');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Handler para quando o app é instalado com sucesso
    const handleAppInstalled = () => {
      addDebugLog('✅ App instalado com sucesso!');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Registra os listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    addDebugLog('Listeners de instalação registrados');

    // Verifica se o service worker está registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          addDebugLog(`Service Worker registrado: ${reg.scope}`);
        } else {
          addDebugLog('⚠️ Service Worker não registrado');
        }
      });
    } else {
      addDebugLog('⚠️ Service Worker não suportado neste navegador');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [addDebugLog]);

  // Função para disparar o prompt de instalação nativo
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      addDebugLog('⚠️ Prompt de instalação não disponível');
      return false;
    }

    try {
      addDebugLog('Exibindo prompt de instalação...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      addDebugLog(`Resultado da instalação: ${outcome}`);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      addDebugLog(`❌ Erro na instalação: ${error}`);
      console.error('Erro ao instalar PWA:', error);
      return false;
    }
  }, [deferredPrompt, addDebugLog]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    debugInfo,
  };
}
