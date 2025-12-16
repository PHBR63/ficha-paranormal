// Widget de tracking de PE por turno
// Controla limite de PE gasto por turno baseado no NEX

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TurnPETrackerProps {
  nex: number;
  peCurrent: number;
  peMax: number;
  onPEChange?: (newPE: number) => void;
  className?: string;
}

/**
 * TurnPETracker - Widget para controlar PE gasto por turno
 * Segue as regras de limite de PE por NEX do Ordem Paranormal
 */
export function TurnPETracker({
  nex,
  peCurrent,
  peMax,
  onPEChange,
  className,
}: TurnPETrackerProps) {
  // PE gasto neste turno (resetado manualmente)
  const [peSpentThisTurn, setPeSpentThisTurn] = useState(0);
  
  // Limite de PE por turno baseado no NEX
  const peLimit = getPELimitByNex(nex);
  
  // Calcula quanto ainda pode gastar
  const remaining = peLimit - peSpentThisTurn;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 1 && remaining > 0;

  // Gasta PE com validação
  const spendPE = useCallback((amount: number) => {
    // Verifica limite de turno
    if (peSpentThisTurn + amount > peLimit) {
      return { success: false, error: 'Limite de PE por turno atingido!' };
    }
    
    // Verifica PE disponível
    if (peCurrent < amount) {
      return { success: false, error: 'PE insuficiente!' };
    }

    setPeSpentThisTurn(prev => prev + amount);
    onPEChange?.(peCurrent - amount);
    return { success: true };
  }, [peSpentThisTurn, peLimit, peCurrent, onPEChange]);

  // Reseta para novo turno
  const resetTurn = useCallback(() => {
    setPeSpentThisTurn(0);
  }, []);

  // Botões de gasto rápido
  const quickSpendOptions = [1, 2, 3, 5].filter(n => n <= peLimit);

  return (
    <TooltipProvider>
      <div className={cn('ordo-panel p-4 space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-pe" />
            <span className="font-display text-sm tracking-wider text-muted-foreground">
              PE / TURNO
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetTurn}
                className="text-xs h-7"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                NOVO TURNO
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reseta o contador de PE para um novo turno</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Barra de progresso do PE gasto */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gasto neste turno</span>
            <span className={cn(
              'font-display',
              isAtLimit ? 'text-destructive' : isNearLimit ? 'text-primary' : 'text-pe'
            )}>
              {peSpentThisTurn} / {peLimit}
            </span>
          </div>
          
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(peSpentThisTurn / peLimit) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-colors',
                isAtLimit 
                  ? 'bg-destructive' 
                  : isNearLimit 
                    ? 'bg-primary' 
                    : 'bg-pe'
              )}
            />
          </div>

          {/* Indicador de limite */}
          <AnimatePresence>
            {isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-2 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Limite de PE por turno atingido!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botões de gasto rápido */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Gastar PE
          </span>
          <div className="flex flex-wrap gap-2">
            {quickSpendOptions.map(amount => {
              const canSpend = !isAtLimit && 
                              peSpentThisTurn + amount <= peLimit && 
                              peCurrent >= amount;
              return (
                <Tooltip key={amount}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canSpend}
                      onClick={() => spendPE(amount)}
                      className={cn(
                        'h-8 min-w-[3rem] font-display',
                        canSpend 
                          ? 'border-pe/50 text-pe hover:bg-pe/20' 
                          : 'opacity-50'
                      )}
                    >
                      -{amount}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!canSpend 
                      ? peSpentThisTurn + amount > peLimit 
                        ? 'Excederia o limite de PE por turno' 
                        : 'PE insuficiente'
                      : `Gasta ${amount} PE`}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* PE Disponível */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">PE Disponível</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-pe">{peCurrent}</span>
            <span className="text-sm text-muted-foreground">/ {peMax}</span>
          </div>
        </div>

        {/* Limite por NEX info */}
        <div className="text-xs text-muted-foreground text-center">
          <span className="opacity-70">
            NEX {nex}% = máximo {peLimit} PE por turno
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
