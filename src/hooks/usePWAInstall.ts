import { useState, useEffect, useCallback, useRef } from 'react';

// Chave para persistência no localStorage
const PWA_INSTALLED_KEY = 'pwa-installed';

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
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showBrowserInstructions, setShowBrowserInstructions] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
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

  // Função para marcar como instalado
  const markAsInstalled = useCallback(() => {
    try {
      localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      addDebugLog('💾 Status de instalação salvo no localStorage');
    } catch (e) {
      addDebugLog('⚠️ Não foi possível salvar no localStorage');
    }
  }, [addDebugLog]);

  // Função para verificar se foi instalado anteriormente
  const checkPreviousInstallation = useCallback(() => {
    try {
      return localStorage.getItem(PWA_INSTALLED_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Detecta se está rodando como PWA instalado (modo standalone)
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isRunningStandalone = standaloneMode || isInWebAppiOS;
    
    // Verifica instalação anterior no localStorage
    const wasInstalledBefore = checkPreviousInstallation();
    
    // Detecta plataforma
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isChromium = /chrome|chromium|crios/.test(userAgent) && !/edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    
    setIsStandalone(isRunningStandalone);
    setIsInstalled(isRunningStandalone || wasInstalledBefore);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    addDebugLog(`Plataforma: ${isIOSDevice ? 'iOS' : isAndroidDevice ? 'Android' : 'Desktop'}`);
    addDebugLog(`Navegador: ${isChromium ? 'Chromium' : isSafari ? 'Safari' : 'Outro'}`);
    
    if (isRunningStandalone) {
      addDebugLog(`✅ Standalone: Sim (executando como app)`);
    } else if (wasInstalledBefore) {
      addDebugLog(`📱 Instalado anteriormente (abra pela tela inicial)`);
    } else {
      addDebugLog(`Standalone: Não`);
    }
    
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
      addDebugLog('🎉 App instalado com sucesso!');
      markAsInstalled();
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBrowserInstructions(false);
      setJustInstalled(true);
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
    // Mas só se não estiver instalado
    // Usamos uma ref local para evitar problemas com o state deferredPrompt
    const currentDeferredPrompt = deferredPrompt;
    if (isAndroidDevice && isChromium && !isRunningStandalone && !wasInstalledBefore) {
      promptTimeoutRef.current = setTimeout(() => {
        // Verifica via ref para evitar closure stale
        if (!currentDeferredPrompt) {
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
    // Removemos deferredPrompt das dependências para evitar re-execuções desnecessárias
    // O estado é gerenciado pelo handler handleBeforeInstall
  }, [addDebugLog, checkManifest, checkPreviousInstallation, markAsInstalled]);

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
        markAsInstalled();
        setIsInstalled(true);
        setIsInstallable(false);
        setJustInstalled(true);
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      addDebugLog(`❌ Erro: ${error}`);
      console.error('Erro ao instalar PWA:', error);
      return false;
    }
  }, [deferredPrompt, addDebugLog, markAsInstalled]);

  // Função para resetar o estado de instalação (útil para debug)
  const resetInstallState = useCallback(() => {
    try {
      localStorage.removeItem(PWA_INSTALLED_KEY);
      addDebugLog('🔄 Estado de instalação resetado');
      setIsInstalled(false);
      setJustInstalled(false);
    } catch (e) {
      addDebugLog('⚠️ Não foi possível resetar estado');
    }
  }, [addDebugLog]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    promptInstall,
    debugInfo,
    showBrowserInstructions,
    clearServiceWorkerCache,
    justInstalled,
    resetInstallState,
  };
}
