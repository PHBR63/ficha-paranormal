/**
 * usePWAUpdate - Hook para gerenciar atualizações do PWA
 * Detecta quando há nova versão disponível e permite aplicar a atualização
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PWAUpdateState {
  /** Indica se há uma atualização disponível */
  hasUpdate: boolean;
  /** Indica se está verificando por atualizações */
  isChecking: boolean;
  /** Indica se está aplicando a atualização */
  isUpdating: boolean;
  /** Indica se foi dispensado pelo usuário nesta sessão */
  isDismissed: boolean;
  /** Última vez que verificou por atualizações */
  lastChecked: Date | null;
  /** Mensagem de erro, se houver */
  error: string | null;
}

export interface UsePWAUpdateReturn extends PWAUpdateState {
  /** Verifica manualmente se há atualizações */
  checkForUpdate: () => Promise<boolean>;
  /** Aplica a atualização disponível (recarrega a página) */
  applyUpdate: () => Promise<void>;
  /** Dispensa a notificação de atualização nesta sessão */
  dismiss: () => void;
  /** Reseta o estado de dispensado */
  resetDismiss: () => void;
}

/**
 * Hook para gerenciar atualizações do Service Worker do PWA
 * Detecta automaticamente novas versões e permite aplicar atualizações
 */
export function usePWAUpdate(): UsePWAUpdateReturn {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  /**
   * Verifica se há uma atualização disponível do Service Worker
   * @returns true se há atualização disponível
   */
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    // Verifica se SW é suportado
    if (!('serviceWorker' in navigator)) {
      console.log('[PWAUpdate] Service Worker não suportado');
      setError('Service Worker não suportado neste navegador');
      return false;
    }

    setIsChecking(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      
      if (!reg) {
        console.log('[PWAUpdate] Nenhum Service Worker registrado');
        setIsChecking(false);
        setLastChecked(new Date());
        return false;
      }

      registrationRef.current = reg;

      // Força uma verificação de atualização
      await reg.update();
      
      // Verifica se há um SW waiting (nova versão pronta)
      if (reg.waiting) {
        console.log('[PWAUpdate] ✅ Atualização disponível (SW waiting)');
        setHasUpdate(true);
        setIsChecking(false);
        setLastChecked(new Date());
        return true;
      }

      // Verifica se há um SW instalando
      if (reg.installing) {
        console.log('[PWAUpdate] SW instalando, aguardando...');
        
        // Aguarda o SW terminar de instalar
        await new Promise<void>((resolve) => {
          const worker = reg.installing;
          if (!worker) {
            resolve();
            return;
          }
          
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') {
              console.log('[PWAUpdate] ✅ Nova versão instalada');
              setHasUpdate(true);
              resolve();
            } else if (worker.state === 'redundant') {
              resolve();
            }
          });
          
          // Timeout de segurança
          setTimeout(resolve, 10000);
        });
      }

      setIsChecking(false);
      setLastChecked(new Date());
      
      // Verifica novamente após a instalação
      if (reg.waiting) {
        setHasUpdate(true);
        return true;
      }

      console.log('[PWAUpdate] Nenhuma atualização disponível');
      return false;
    } catch (err) {
      console.error('[PWAUpdate] Erro ao verificar atualização:', err);
      setError('Erro ao verificar atualizações');
      setIsChecking(false);
      setLastChecked(new Date());
      return false;
    }
  }, []);

  /**
   * Aplica a atualização disponível
   * Ativa o novo Service Worker e recarrega a página
   */
  const applyUpdate = useCallback(async (): Promise<void> => {
    setIsUpdating(true);
    setError(null);

    try {
      const reg = registrationRef.current || await navigator.serviceWorker.getRegistration();
      
      if (reg?.waiting) {
        console.log('[PWAUpdate] Enviando SKIP_WAITING para o novo SW');
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Aguarda um momento para o novo SW assumir
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[PWAUpdate] Recarregando página com nova versão');
      window.location.reload();
    } catch (err) {
      console.error('[PWAUpdate] Erro ao aplicar atualização:', err);
      setError('Erro ao aplicar atualização');
      setIsUpdating(false);
      
      // Tenta recarregar mesmo assim
      window.location.reload();
    }
  }, []);

  /**
   * Dispensa a notificação de atualização nesta sessão
   */
  const dismiss = useCallback(() => {
    setIsDismissed(true);
    setHasUpdate(false);
  }, []);

  /**
   * Reseta o estado de dispensado
   */
  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
  }, []);

  // Efeito para detectar atualizações automaticamente
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Handler para mudança de controller (novo SW assumiu)
    const handleControllerChange = () => {
      if (!isDismissed) {
        console.log('[PWAUpdate] Controller mudou, novo SW ativo');
        setHasUpdate(true);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    window.addEventListener('app-update-available', handleControllerChange);

    // Configura listener para detectar novas versões
    const setupUpdateListener = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          registrationRef.current = reg;
          
          // Verifica se já há uma atualização pendente
          if (reg.waiting && !isDismissed) {
            setHasUpdate(true);
          }

          // Listener para novas atualizações
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (!isDismissed) {
                    console.log('[PWAUpdate] Nova versão detectada via updatefound');
                    setHasUpdate(true);
                  }
                }
              });
            }
          });
        }
      } catch (err) {
        console.error('[PWAUpdate] Erro ao configurar listener:', err);
      }
    };

    setupUpdateListener();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('app-update-available', handleControllerChange);
    };
  }, [isDismissed]);

  return {
    hasUpdate,
    isChecking,
    isUpdating,
    isDismissed,
    lastChecked,
    error,
    checkForUpdate,
    applyUpdate,
    dismiss,
    resetDismiss,
  };
}
