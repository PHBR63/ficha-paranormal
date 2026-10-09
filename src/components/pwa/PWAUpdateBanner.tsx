/**
 * PWAUpdateBanner - Banner de notificação quando uma nova versão do app está disponível
 * Exibe alerta para o usuário atualizar o PWA para a versão mais recente
 * Utiliza o hook usePWAUpdate para gerenciar o estado de atualização
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Download, Sparkles } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks';

interface PWAUpdateBannerProps {
  /** Callback opcional após atualização */
  onUpdate?: () => void;
  /** Intervalo de verificação automática em ms (default: 5 minutos) */
  checkInterval?: number;
}

export function PWAUpdateBanner({ 
  onUpdate, 
  checkInterval = 5 * 60 * 1000 
}: PWAUpdateBannerProps) {
  const {
    hasUpdate,
    isUpdating,
    isDismissed,
    applyUpdate,
    dismiss,
    checkForUpdate,
  } = usePWAUpdate();

  // Verifica periodicamente por atualizações
  useEffect(() => {
    const intervalId = setInterval(() => {
      checkForUpdate();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkForUpdate, checkInterval]);

  // Handler para aplicar atualização
  const handleUpdate = async () => {
    onUpdate?.();
    await applyUpdate();
  };

  // Não mostra se foi dispensado ou não há atualização
  const showBanner = hasUpdate && !isDismissed;

  return (
    <AnimatePresence>
      {showBanner && (
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
                    onClick={dismiss}
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
