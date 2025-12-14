/**
 * Widget que mostra stats efetivos com modificadores de condições e proteções aplicados
 * Integra automaticamente os efeitos do game-engine.ts e cálculo de armadura
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Footprints, XCircle, Ban, AlertTriangle, ShieldCheck, ArrowDown } from 'lucide-react';
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

// Interface para item de inventário com proteção
interface InventoryItemWithArmor {
  name: string;
  isEquipped?: boolean;
  itemType?: string;
  rd?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: string;
}

interface EffectiveStatsWidgetProps {
  baseDefense: number;
  baseMovement: number;
  conditions: string[];
  inventory?: InventoryItemWithArmor[];
  className?: string;
}

/**
 * EffectiveStatsWidget - Mostra defesa e deslocamento efetivos
 * considerando modificadores de condições e proteções equipadas
 */
export function EffectiveStatsWidget({
  baseDefense,
  baseMovement,
  conditions,
  inventory = [],
  className,
}: EffectiveStatsWidgetProps) {
  // Calcula proteção das armaduras equipadas
  const armorStats = useMemo(() => {
    const equippedArmors = inventory
      .filter(item => item.isEquipped && item.itemType === 'armor' && item.rd !== undefined)
      .map(item => ({
        name: item.name,
        rd: item.rd || 0,
        agilityPenalty: item.agilityPenalty || 0,
        speedPenalty: item.speedPenalty || 0,
        type: item.armorType || 'leve',
      }));

    const totalRD = equippedArmors.reduce((sum, armor) => sum + armor.rd, 0);
    const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + armor.agilityPenalty, 0);
    const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + armor.speedPenalty, 0);

    return {
      totalRD,
      totalAgilityPenalty,
      totalSpeedPenalty,
      equippedArmors,
      hasArmorEquipped: equippedArmors.length > 0,
    };
  }, [inventory]);

  // Aplica penalidade de armadura na defesa base
  const defenseWithArmorPenalty = baseDefense + armorStats.totalAgilityPenalty;

  // Calcula valores efetivos usando game-engine (aplicando condições)
  const effectiveDefense = getEffectiveDefense(defenseWithArmorPenalty, conditions);
  const testModifier = getTestModifier(conditions);
  const playerCanAct = canAct(conditions);
  const playerCanMove = canMove(conditions);

  // Calcula modificador de defesa por condições
  const defenseModifierFromConditions = effectiveDefense - defenseWithArmorPenalty;
  const totalDefenseChange = effectiveDefense - baseDefense;

  // Calcula modificador de movimento
  let effectiveMovement = baseMovement + armorStats.totalSpeedPenalty;
  for (const conditionId of conditions) {
    const effect = CONDITION_EFFECTS[conditionId];
    if (effect) {
      if (effect.movementModifier === -2) {
        effectiveMovement = 0;
      } else if (effect.movementModifier === -1) {
        effectiveMovement = Math.floor(effectiveMovement / 2);
      }
    }
  }
  effectiveMovement = Math.max(0, effectiveMovement);

  // Coleta detalhes dos modificadores para tooltip
  const defenseBreakdown: { source: string; modifier: number }[] = [];
  const testBreakdown: { condition: string; modifier: number }[] = [];

  // Adiciona penalidades de armadura ao breakdown
  armorStats.equippedArmors.forEach(armor => {
    if (armor.agilityPenalty !== 0) {
      defenseBreakdown.push({ source: armor.name, modifier: armor.agilityPenalty });
    }
  });

  // Adiciona modificadores de condições
  for (const conditionId of conditions) {
    const condition = CONDITIONS[conditionId];
    const effect = CONDITION_EFFECTS[conditionId];
    if (!effect || !condition) continue;

    if (effect.defenseModifier !== 0) {
      defenseBreakdown.push({ source: condition.name, modifier: effect.defenseModifier });
    }
    if (effect.testModifier !== 0) {
      testBreakdown.push({ condition: condition.name, modifier: effect.testModifier });
    }
  }

  const hasDefenseChange = totalDefenseChange !== 0;
  const hasMovementChange = effectiveMovement !== baseMovement;
  const hasTestPenalty = testModifier !== 0;
  const hasCriticalStatus = !playerCanAct || !playerCanMove;
  const hasRD = armorStats.totalRD > 0;

  return (
    <TooltipProvider>
      <div className={cn('space-y-3', className)}>
        {/* RD Total - Resistência a Dano */}
        {hasRD && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">RD (RESISTÊNCIA)</span>
                </div>
                <motion.span
                  key={armorStats.totalRD}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-2xl text-primary"
                >
                  {armorStats.totalRD}
                </motion.span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium text-sm">Resistência a Dano:</p>
                <p className="text-xs text-muted-foreground">
                  Reduz {armorStats.totalRD} pontos de todo dano recebido
                </p>
                <div className="pt-1 border-t border-border/50 mt-1">
                  {armorStats.equippedArmors.map((armor, i) => (
                    <p key={i} className="text-xs">
                      {armor.name}: RD {armor.rd}
                    </p>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Defesa Efetiva */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-between p-3 rounded-lg transition-colors',
                hasDefenseChange
                  ? totalDefenseChange < 0
                    ? 'bg-destructive/10 border border-destructive/30'
                    : 'bg-primary/10 border border-primary/30'
                  : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <Shield
                  className={cn(
                    'w-5 h-5',
                    hasDefenseChange
                      ? totalDefenseChange < 0
                        ? 'text-destructive'
                        : 'text-primary'
                      : 'text-muted-foreground'
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
                      hasDefenseChange
                        ? totalDefenseChange < 0
                          ? 'text-destructive'
                          : 'text-primary'
                        : ''
                    )}
                  >
                    {effectiveDefense}
                  </motion.span>
                </AnimatePresence>
                {hasDefenseChange && (
                  <span
                    className={cn(
                      'text-sm font-medium',
                      totalDefenseChange < 0 ? 'text-destructive' : 'text-primary'
                    )}
                  >
                    ({totalDefenseChange > 0 ? '+' : ''}{totalDefenseChange})
                  </span>
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">Cálculo de Defesa:</p>
              <p className="text-muted-foreground text-xs">Base: {baseDefense}</p>
              {defenseBreakdown.map((item, i) => (
                <p
                  key={i}
                  className={cn(
                    'text-xs',
                    item.modifier < 0 ? 'text-destructive' : 'text-primary'
                  )}
                >
                  {item.source}: {item.modifier > 0 ? '+' : ''}{item.modifier}
                </p>
              ))}
              <p className="text-xs font-medium pt-1 border-t border-border/50">
                Total: {effectiveDefense}
              </p>
            </div>
          </TooltipContent>
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
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium text-sm">Cálculo de Deslocamento:</p>
              <p className="text-muted-foreground text-xs">Base: {baseMovement}m</p>
              {armorStats.equippedArmors
                .filter(a => a.speedPenalty !== 0)
                .map((armor, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {armor.name}: {armor.speedPenalty}m
                  </p>
                ))}
              {conditions.some(c => CONDITION_EFFECTS[c]?.movementModifier) && (
                <p className="text-xs text-destructive">Condição reduz movimento</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Penalidades de Armadura */}
        {armorStats.totalAgilityPenalty !== 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-lg text-xs text-muted-foreground">
            <ArrowDown className="w-3 h-3 text-destructive" />
            <span>
              Penalidade de armadura: {armorStats.totalAgilityPenalty} em testes de Agilidade
            </span>
          </div>
        )}

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
