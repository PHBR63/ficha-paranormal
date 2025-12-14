// Widget que mostra stats efetivos com modificadores de condições aplicados
// Integra automaticamente os efeitos do game-engine.ts

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Footprints, XCircle, Ban, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEffectiveDefense,
  getTestModifier,
  canAct,
  canMove,
  CONDITION_EFFECTS,
} from '@/lib/game-engine';
import { CONDITIONS } from '@/lib/conditions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EffectiveStatsWidgetProps {
  baseDefense: number;
  baseMovement: number;
  conditions: string[];
  className?: string;
}

/**
 * EffectiveStatsWidget - Mostra defesa e deslocamento efetivos
 * considerando todos os modificadores de condições ativas
 */
export function EffectiveStatsWidget({
  baseDefense,
  baseMovement,
  conditions,
  className,
}: EffectiveStatsWidgetProps) {
  // Calcula valores efetivos usando game-engine
  const effectiveDefense = getEffectiveDefense(baseDefense, conditions);
  const testModifier = getTestModifier(conditions);
  const playerCanAct = canAct(conditions);
  const playerCanMove = canMove(conditions);

  // Calcula modificador de defesa
  const defenseModifier = effectiveDefense - baseDefense;

  // Calcula modificador de movimento
  let effectiveMovement = baseMovement;
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect) {
      if (effect.movementModifier === -2) {
        effectiveMovement = 0;
      } else if (effect.movementModifier === -1) {
        effectiveMovement = Math.floor(baseMovement / 2);
      }
    }
  }

  // Coleta detalhes dos modificadores para tooltip
  const defenseBreakdown: { condition: string; modifier: number }[] = [];
  const testBreakdown: { condition: string; modifier: number }[] = [];

  for (const conditionId of conditions) {
    const condition = CONDITIONS[conditionId];
    const effect = CONDITION_EFFECTS[conditionId];
    if (!effect || !condition) continue;

    if (effect.defenseModifier !== 0) {
      defenseBreakdown.push({ condition: condition.name, modifier: effect.defenseModifier });
    }
    if (effect.testModifier !== 0) {
      testBreakdown.push({ condition: condition.name, modifier: effect.testModifier });
    }
  }

  const hasDefenseChange = defenseModifier !== 0;
  const hasMovementChange = effectiveMovement !== baseMovement;
  const hasTestPenalty = testModifier !== 0;
  const hasCriticalStatus = !playerCanAct || !playerCanMove;

  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {/* Defesa Efetiva */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                hasDefenseChange
                  ? 'bg-destructive/10 border border-destructive/30'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <Shield
                  className={cn(
                    'w-5 h-5',
                    hasDefenseChange ? 'text-destructive' : 'text-muted-foreground'
                  )}
                />
                <span className="text-sm text-muted-foreground">DEFESA</span>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={effectiveDefense}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className={cn(
                      'font-display text-2xl',
                      hasDefenseChange ? 'text-destructive' : ''
                    )}
                  >
                    {effectiveDefense}
                  </motion.span>
                </AnimatePresence>
                {hasDefenseChange && (
                  <span className="text-sm text-destructive font-medium">
                    ({defenseModifier > 0 ? '+' : ''}{defenseModifier})
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          {defenseBreakdown.length > 0 && (
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-sm">Modificadores de Defesa:</p>
                <p className="text-muted-foreground text-xs">Base: {baseDefense}</p>
                {defenseBreakdown.map((item, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {item.condition}: {item.modifier > 0 ? '+' : ''}{item.modifier}
                  </p>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Deslocamento Efetivo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                hasMovementChange
                  ? 'bg-warning/10 border border-warning/30'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <Footprints
                  className={cn(
                    'w-5 h-5',
                    hasMovementChange ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className="text-sm text-muted-foreground">DESLOCAMENTO</span>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={effectiveMovement}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className={cn(
                      'font-display text-2xl',
                      hasMovementChange ? 'text-primary' : ''
                    )}
                  >
                    {effectiveMovement}m
                  </motion.span>
                </AnimatePresence>
                {hasMovementChange && (
                  <span className="text-sm text-primary font-medium">
                    (base {baseMovement}m)
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          {hasMovementChange && (
            <TooltipContent side="left">
              <p className="text-sm">Movimento reduzido por condição ativa</p>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Modificador de Testes */}
        {hasTestPenalty && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">TESTES</span>
                </div>
                <span className="font-display text-2xl text-primary">
                  {testModifier > 0 ? '+' : ''}{testModifier}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-sm">Modificadores de Teste:</p>
                {testBreakdown.map((item, i) => (
                  <p key={i} className="text-xs text-primary">
                    {item.condition}: {item.modifier > 0 ? '+' : ''}{item.modifier}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Status Críticos */}
        {hasCriticalStatus && (
          <div className="space-y-2">
            {!playerCanAct && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive"
              >
                <Ban className="w-5 h-5" />
                <span className="font-display text-sm tracking-wider">NÃO PODE AGIR</span>
              </motion.div>
            )}
            {!playerCanMove && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-destructive"
              >
                <XCircle className="w-5 h-5" />
                <span className="font-display text-sm tracking-wider">NÃO PODE MOVER</span>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
