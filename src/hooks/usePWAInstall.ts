import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [showBrowserInstructions, setShowBrowserInstructions] = useState(false);
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para adicionar logs de debug
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`[PWA] ${message}`);
    setDebugInfo(prev => [...prev.slice(-14), logMessage]);
  }, []);

  // Função para verificar o manifest
  const checkManifest = useCallback(async () => {
    try {
      const response = await fetch('/manifest.webmanifest', { cache: 'no-store' });
      if (response.ok) {
        const manifest = await response.json();
        addDebugLog(`✅ Manifest carregado: ${manifest.name}`);
        addDebugLog(`  - icons: ${manifest.icons?.length || 0} definidos`);
        addDebugLog(`  - start_url: ${manifest.start_url}`);
        addDebugLog(`  - display: ${manifest.display}`);
        return true;
      } else {
        addDebugLog(`❌ Falha ao carregar manifest: ${response.status}`);
        return false;
      }
    } catch (error) {
      addDebugLog(`❌ Erro ao verificar manifest: ${error}`);
      return false;
    }
  }, [addDebugLog]);

  // Função para limpar cache do Service Worker
  const clearServiceWorkerCache = useCallback(async () => {
    try {
      addDebugLog('Limpando cache do Service Worker...');
      
      // Limpa todos os caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      addDebugLog(`  - ${cacheNames.length} caches removidos`);
      
      // Desregistra e re-registra o Service Worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      addDebugLog(`  - ${registrations.length} SW desregistrados`);
      
      addDebugLog('✅ Cache limpo! Recarregue a página.');
      
      // Recarrega após um breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      return true;
    } catch (error) {
      addDebugLog(`❌ Erro ao limpar cache: ${error}`);
      return false;
    }
  }, [addDebugLog]);

  useEffect(() => {
    // Detecta se está rodando como PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    // Detecta plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isChromium = /chrome|chromium|crios/.test(userAgent) && !/edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    setIsInstalled(isStandalone || isInWebAppiOS);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    addDebugLog(`Plataforma: ${isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop'}`);
    addDebugLog(`Navegador: ${isChromium ? 'Chromium' : isSafari ? 'Safari' : 'Outro'}`);
    addDebugLog(`Standalone: ${isStandalone || isInWebAppiOS ? 'Sim (instalado)' : 'Não'}`);
    addDebugLog(`HTTPS: ${location.protocol === 'https:' ? 'Sim' : 'Não'}`);

    // Verifica o manifest
    checkManifest();

    // Handler para quando o navegador detecta que o PWA pode ser instalado
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      addDebugLog('✅ beforeinstallprompt capturado!');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowBrowserInstructions(false);
      
      // Limpa o timeout de fallback
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
        promptTimeoutRef.current = null;
      }
    };

    // Handler para quando o app é instalado com sucesso
    const handleAppInstalled = () => {
      addDebugLog('✅ App instalado com sucesso!');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBrowserInstructions(false);
    };

    // Registra os listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    addDebugLog('Listeners registrados');

    // Verifica se o service worker está registrado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          addDebugLog(`SW ativo: ${reg.active?.state || 'pendente'}`);
          
          // Verifica se tem fetch handler
          if (reg.active) {
            addDebugLog('SW com fetch handler: Sim');
          }
        } else {
          addDebugLog('⚠️ Service Worker não registrado');
        }
      });
    } else {
      addDebugLog('⚠️ SW não suportado');
    }

    // Timeout de fallback: se após 5s não receber beforeinstallprompt em Android/Chromium
    if (isAndroidDevice && isChromium && !isStandalone && !isInWebAppiOS) {
      promptTimeoutRef.current = setTimeout(() => {
        if (!deferredPrompt) {
          addDebugLog('⏱️ Timeout: beforeinstallprompt não disparou');
          addDebugLog('💡 Mostrando instruções do menu do navegador');
          setShowBrowserInstructions(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (promptTimeoutRef.current) {
        clearTimeout(promptTimeoutRef.current);
      }
    };
  }, [addDebugLog, checkManifest, deferredPrompt]);

  // Função para disparar o prompt de instalação nativo
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      addDebugLog('⚠️ Prompt não disponível');
      return false;
    }

    try {
      addDebugLog('Exibindo prompt...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      addDebugLog(`Resultado: ${outcome}`);
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      addDebugLog(`❌ Erro: ${error}`);
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
    showBrowserInstructions,
    clearServiceWorkerCache,
  };
}
