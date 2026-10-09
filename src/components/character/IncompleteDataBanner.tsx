/**
 * IncompleteDataBanner - Banner de aviso quando dados do personagem estão incompletos
 * Exibe botão para recarregar a ficha e tenta refetch automático
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, WifiOff } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';

interface IncompleteDataBannerProps {
  /** Mensagem descrevendo o problema */
  message: string;
  /** Callback para refetch dos dados */
  onRefetch: () => Promise<unknown>;
  /** Lista de campos com problema (opcional) */
  missingFields?: string[];
}

export function IncompleteDataBanner({ 
  message, 
  onRefetch,
  missingFields = [],
}: IncompleteDataBannerProps) {
  const [isRefetching, setIsRefetching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Handler para tentar recarregar os dados
  const handleRefetch = useCallback(async () => {
    setIsRefetching(true);
    setRetryCount(prev => prev + 1);

    try {
      await onRefetch();
    } catch (error) {
      console.error('[IncompleteData] Erro ao recarregar:', error);
    } finally {
      setIsRefetching(false);
    }
  }, [onRefetch]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Ícone de aviso */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-amber-200">
                Dados do personagem incompletos
              </p>
              <p className="text-xs text-amber-300/80 mt-1">
                {message}
              </p>
              
              {/* Lista de campos faltando */}
              {missingFields.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {missingFields.map((field) => (
                    <span 
                      key={field}
                      className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              )}

              {/* Dica sobre conexão */}
              {retryCount > 1 && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400/70">
                  <WifiOff className="w-3 h-3" />
                  <span>Verifique sua conexão de internet</span>
                </div>
              )}
            </div>

            {/* Botão de refetch */}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefetch}
                disabled={isRefetching}
                className="h-8 gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefetching ? 'Carregando...' : 'Recarregar'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
