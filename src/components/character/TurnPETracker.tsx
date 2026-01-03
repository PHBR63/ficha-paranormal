// Widget de tracking de PE por turno
// Controla limite de PE gasto por turno baseado no NEX
// Inclui sistema de PE Temporário para Flagelador e Lâmina Paranormal

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, AlertTriangle, Flame, Swords, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPELimitByNex } from '@/lib/dice-roller';
import { useTempPE, calculateAbsorverAngustiaPE, calculateGladiadorParanormalPE } from '@/hooks';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TurnPETrackerProps {
  nex: number;
  peCurrent: number;
  peMax: number;
  onPEChange?: (newPE: number) => void;
  className?: string;
  /** Trilha de classe do personagem */
  classTrack?: string;
  /** Habilidades do personagem (para verificar se tem Absorver Angústia/Gladiador) */
  characterAbilities?: string[];
}

/**
 * TurnPETracker - Widget para controlar PE gasto por turno
 * Segue as regras de limite de PE por NEX do Ordem Paranormal
 * Inclui sistema de PE Temporário para Flagelador e Lâmina Paranormal
 */
export function TurnPETracker({
  nex,
  peCurrent,
  peMax,
  onPEChange,
  className,
  classTrack,
  characterAbilities = [],
}: TurnPETrackerProps) {
  // PE gasto neste turno (resetado manualmente)
  const [peSpentThisTurn, setPeSpentThisTurn] = useState(0);
  
  // Sistema de PE Temporário
  const {
    tempPE,
    addTempPE,
    consumeTempPE,
    resetScene,
    hasAbsorverAngustia,
    hasGladiadorParanormal,
    maxTempPE,
  } = useTempPE({
    nex,
    classTrack,
    characterAbilities,
  });

  // Círculo selecionado para Absorver Angústia
  const [selectedCircle, setSelectedCircle] = useState<number>(1);
  
  // Limite de PE por turno baseado no NEX
  const peLimit = getPELimitByNex(nex);
  
  // PE total disponível (temporário + normal)
  const totalPEAvailable = useMemo(() => {
    return tempPE.amount + peCurrent;
  }, [tempPE.amount, peCurrent]);
  
  // Calcula quanto ainda pode gastar
  const remaining = peLimit - peSpentThisTurn;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining <= 1 && remaining > 0;

  /**
   * Gasta PE com validação
   * Consome PE temporário primeiro, depois PE normal
   */
  const spendPE = useCallback((amount: number) => {
    // Verifica limite de turno
    if (peSpentThisTurn + amount > peLimit) {
      return { success: false, error: 'Limite de PE por turno atingido!' };
    }
    
    // Verifica PE disponível total (temp + normal)
    if (totalPEAvailable < amount) {
      return { success: false, error: 'PE insuficiente!' };
    }

    // Consome PE temporário primeiro
    const { consumed: tempConsumed, remaining: remainingCost } = consumeTempPE(amount);
    
    // Se ainda tiver custo restante, consome PE normal
    if (remainingCost > 0) {
      onPEChange?.(peCurrent - remainingCost);
    }

    setPeSpentThisTurn(prev => prev + amount);
    
    return { 
      success: true, 
      tempUsed: tempConsumed,
      normalUsed: remainingCost,
    };
  }, [peSpentThisTurn, peLimit, totalPEAvailable, peCurrent, onPEChange, consumeTempPE]);

  // Reseta para novo turno
  const resetTurn = useCallback(() => {
    setPeSpentThisTurn(0);
  }, []);

  // Reseta para nova cena (também reseta PE temporário)
  const handleResetScene = useCallback(() => {
    setPeSpentThisTurn(0);
    resetScene();
  }, [resetScene]);

  // Adiciona PE temporário via Absorver Angústia
  const handleAbsorverAngustia = useCallback(() => {
    const peToAdd = calculateAbsorverAngustiaPE(selectedCircle);
    const result = addTempPE(peToAdd, 'absorver-angustia');
    return result;
  }, [selectedCircle, addTempPE]);

  // Adiciona PE temporário via Gladiador Paranormal
  const handleGladiadorParanormal = useCallback(() => {
    const peToAdd = calculateGladiadorParanormalPE();
    const result = addTempPE(peToAdd, 'gladiador-paranormal');
    return result;
  }, [addTempPE]);

  // Botões de gasto rápido
  const quickSpendOptions = [1, 2, 3, 5].filter(n => n <= peLimit);

  // Verifica se tem habilidades de PE temporário
  const hasTempPEAbilities = hasAbsorverAngustia || hasGladiadorParanormal;

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
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTurn}
                  className="text-xs h-7"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  TURNO
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reseta o contador de PE para um novo turno</p>
              </TooltipContent>
            </Tooltip>
            {hasTempPEAbilities && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetScene}
                    className="text-xs h-7 text-primary"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    CENA
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Nova cena - reseta PE temporário e contador de turno</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* PE Temporário (se tiver habilidades) */}
        <AnimatePresence>
          {hasTempPEAbilities && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    PE Temporário
                  </span>
                </div>
                <span className="font-display text-lg text-primary">
                  {tempPE.amount}
                  {hasGladiadorParanormal && (
                    <span className="text-xs text-muted-foreground ml-1">
                      / {maxTempPE} cena
                    </span>
                  )}
                </span>
              </div>

              {/* Botões de ganho de PE temporário */}
              <div className="space-y-2">
                {/* Absorver Angústia */}
                {hasAbsorverAngustia && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedCircle.toString()}
                      onValueChange={(v) => setSelectedCircle(parseInt(v))}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º</SelectItem>
                        <SelectItem value="2">2º</SelectItem>
                        <SelectItem value="3">3º</SelectItem>
                        <SelectItem value="4">4º</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAbsorverAngustia}
                      className="flex-1 h-8 text-xs border-primary/50 text-primary hover:bg-primary/20"
                    >
                      <Flame className="w-3 h-3 mr-1" />
                      Absorver Angústia (+{selectedCircle} PE)
                    </Button>
                  </div>
                )}

                {/* Gladiador Paranormal */}
                {hasGladiadorParanormal && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGladiadorParanormal}
                    disabled={tempPE.gainedThisScene >= maxTempPE}
                    className="w-full h-8 text-xs border-primary/50 text-primary hover:bg-primary/20"
                  >
                    <Swords className="w-3 h-3 mr-1" />
                    Gladiador Paranormal (+2 PE)
                    {tempPE.gainedThisScene > 0 && (
                      <span className="ml-1 opacity-70">
                        ({tempPE.gainedThisScene}/{maxTempPE})
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Indicador de consumo */}
              {tempPE.amount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  PE temporário será consumido primeiro
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
                              totalPEAvailable >= amount;
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
                      : tempPE.amount > 0
                        ? `Gasta ${amount} PE (usa temporário primeiro)`
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
            {tempPE.amount > 0 && (
              <span className="font-display text-lg text-primary">
                {tempPE.amount}
                <span className="text-xs text-muted-foreground"> temp +</span>
              </span>
            )}
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
