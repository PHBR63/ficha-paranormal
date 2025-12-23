/**
 * PWAUpdateBanner - Banner de notificação quando uma nova versão do app está disponível
 * Exibe alerta para o usuário atualizar o PWA para a versão mais recente
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAUpdateBannerProps {
  /** Callback opcional após atualização */
  onUpdate?: () => void;
}

export function PWAUpdateBanner({ onUpdate }: PWAUpdateBannerProps) {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Detecta quando há uma atualização disponível do Service Worker
  useEffect(() => {
    // Verifica se service worker é suportado
    if (!('serviceWorker' in navigator)) return;

    // Handler para quando detectar atualização
    const handleControllerChange = () => {
      // Ignora se o usuário dismissou o banner nesta sessão
      if (dismissed) return;
      setShowUpdateBanner(true);
    };

    // Registra listener para mudança de controller (novo SW disponível)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Verifica se há uma atualização pendente
    const checkForUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);
          
          // Verifica se há um SW waiting (nova versão pronta)
          if (reg.waiting) {
            setShowUpdateBanner(true);
          }

          // Listener para quando um novo SW for instalado
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Novo SW instalado, pronto para ativar
                  if (!dismissed) {
                    setShowUpdateBanner(true);
                  }
                }
              });
            }
          });

          // Força uma verificação de atualização
          reg.update().catch(console.error);
        }
      } catch (error) {
        console.error('[PWAUpdate] Erro ao verificar atualização:', error);
      }
    };

    checkForUpdate();

    // Verifica periodicamente por atualizações (a cada 5 minutos)
    const intervalId = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.update().catch(console.error);
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(intervalId);
    };
  }, [dismissed]);

  // Handler para aplicar a atualização
  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);

    try {
      // Tenta ativar o novo Service Worker
      if (registration?.waiting) {
        // Envia mensagem para o SW skipWaiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Pequeno delay para garantir que o novo SW assuma
      await new Promise(resolve => setTimeout(resolve, 500));

      // Callback opcional
      onUpdate?.();

      // Recarrega a página para usar a nova versão
      window.location.reload();
    } catch (error) {
      console.error('[PWAUpdate] Erro ao atualizar:', error);
      setIsUpdating(false);
      
      // Em caso de erro, ainda tenta recarregar
      window.location.reload();
    }
  }, [registration, onUpdate]);

  // Handler para fechar o banner
  const handleDismiss = useCallback(() => {
    setShowUpdateBanner(false);
    setDismissed(true);
  }, []);

  return (
    <AnimatePresence>
      {showUpdateBanner && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[100] safe-area-inset-top"
        >
          <div className="mx-2 mt-2 sm:mx-4 sm:mt-4">
            <div className="relative overflow-hidden rounded-lg border border-primary/30 bg-gradient-to-r from-primary/10 via-background to-primary/10 shadow-lg backdrop-blur-sm">
              {/* Brilho animado de fundo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
              
              <div className="relative flex items-center gap-3 p-3 sm:p-4">
                {/* Ícone animado */}
                <div className="flex-shrink-0">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"
                  >
                    <Sparkles className="w-5 h-5 text-primary" />
                  </motion.div>
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-semibold text-foreground">
                    Nova versão disponível
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Atualize para ter acesso às correções mais recentes
                  </p>
                </div>

                {/* Botões */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    disabled={isUpdating}
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Fechar</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="h-8 gap-1.5 bg-primary hover:bg-primary/90"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Atualizando...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Atualizar</span>
                        <span className="sm:hidden">OK</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Barra de progresso animada quando atualizando */}
              {isUpdating && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
