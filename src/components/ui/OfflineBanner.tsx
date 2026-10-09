/**
 * Banner de Status Offline
 * 
 * Exibe um banner no topo da tela quando o usuário está offline,
 * com animação suave de entrada/saída.
 * 
 * @module components/ui/OfflineBanner
 */

import React from 'react';
import { WifiOff, RefreshCw } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export interface OfflineBannerProps {
  /** Indica se o usuário está offline */
  isOffline: boolean;
  /** Callback para tentar reconectar */
  onRetry?: () => void;
  /** Mostrar botão de retry */
  showRetryButton?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * Componente de banner offline com animação
 */
export const OfflineBanner = React.memo(function OfflineBanner({
  isOffline,
  onRetry,
  showRetryButton = true,
  className,
}: OfflineBannerProps) {
  const handleRetry = React.useCallback(() => {
    // Tenta recarregar para verificar conexão
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn(
            'overflow-hidden bg-warning text-warning-foreground',
            className
          )}
        >
          <div role="status" className="flex flex-wrap items-center justify-center gap-3 px-4 py-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              Você está offline. Alterações só ficam confirmadas após resposta do servidor. Confira as pendências no histórico ao reconectar.
            </span>
            {showRetryButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-7 gap-1.5 bg-warning/20 hover:bg-warning/40 text-warning-foreground"
              >
                <RefreshCw className="h-3 w-3" />
                Reconectar
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default OfflineBanner;
