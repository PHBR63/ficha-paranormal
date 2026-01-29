/**
 * ConditionBadge - Badge para exibir condições do sistema Ordem Paranormal
 * 
 * NOTA: Usa atributo title nativo para tooltip em vez de Radix Tooltip
 * Isso evita o erro React #185 (Maximum update depth exceeded) quando
 * múltiplos badges são renderizados em sequência (AnimatePresence + setRef)
 * 
 * @module components/ui/condition-badge
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CONDITIONS, type Condition } from "@/lib/conditions";
import { CONDITION_EFFECTS } from "@/lib/game-engine";

interface ConditionBadgeProps {
  conditionId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onRemove?: () => void;
  turnsRemaining?: number;
  animate?: boolean;
}

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5 gap-0.5',
  md: 'text-sm px-2 py-1 gap-1',
  lg: 'text-base px-3 py-1.5 gap-1.5',
};

const iconSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * Gera texto de tooltip concatenado para o badge
 * Inclui nome, descrição, efeito e remoção quando disponíveis
 */
function buildTooltipText(
  condition: Condition, 
  effect?: typeof CONDITION_EFFECTS[keyof typeof CONDITION_EFFECTS]
): string {
  const parts: string[] = [
    `${condition.icon} ${condition.name}`,
    condition.description,
    `Efeito: ${condition.effect}`,
  ];
  
  if (condition.removal) {
    parts.push(`Remoção: ${condition.removal}`);
  }
  
  if (effect) {
    const modParts: string[] = [];
    if (effect.defenseModifier !== 0) {
      modParts.push(`Defesa: ${effect.defenseModifier > 0 ? '+' : ''}${effect.defenseModifier}`);
    }
    if (effect.testModifier !== 0) {
      modParts.push(`Testes: ${effect.testModifier > 0 ? '+' : ''}${effect.testModifier}`);
    }
    if (!effect.canAct) modParts.push('Não pode agir');
    if (!effect.canMove) modParts.push('Não pode se mover');
    if (modParts.length > 0) {
      parts.push(`Modificadores: ${modParts.join(', ')}`);
    }
  }
  
  return parts.join(' | ');
}

export const ConditionBadge = React.forwardRef<HTMLDivElement, ConditionBadgeProps>(({
  conditionId,
  size = 'md',
  showTooltip = true,
  onRemove,
  turnsRemaining,
  animate = true,
}, ref) => {
  const condition = CONDITIONS[conditionId];
  const effect = CONDITION_EFFECTS[conditionId];
  
  if (!condition) return null;

  const colorClasses = getColorClasses(condition.color);
  const isCritical = ['morrendo', 'inconsciente', 'indefeso', 'paralisado'].includes(conditionId);
  const isMental = ['perturbado', 'enlouquecendo', 'confuso', 'apavorado'].includes(conditionId);

  // Gera texto de tooltip para atributo title nativo (evita Radix Tooltip que causa loop #185)
  const tooltipText = showTooltip ? buildTooltipText(condition, effect) : undefined;

  return (
    <motion.div
      ref={ref}
      layout
      initial={animate ? { scale: 0, opacity: 0 } : undefined}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={onRemove ? { scale: 1.05 } : undefined}
      title={tooltipText}
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        sizeStyles[size],
        colorClasses.bg,
        colorClasses.border,
        colorClasses.text,
        isCritical && "animate-pulse",
        isMental && "animate-pulse-subtle",
        onRemove && "cursor-pointer hover:opacity-80"
      )}
      onClick={onRemove}
    >
      <span className={iconSizes[size]}>{condition.icon}</span>
      <span>{condition.name}</span>
      {turnsRemaining !== undefined && (
        <span className="ml-1 px-1 bg-background/30 rounded text-xs">
          {turnsRemaining}
        </span>
      )}
    </motion.div>
  );
});

ConditionBadge.displayName = "ConditionBadge";

function getColorClasses(color: string) {
  switch (color) {
    case 'health':
    case 'destructive':
      return {
        bg: 'bg-destructive/20',
        border: 'border-destructive/50',
        text: 'text-destructive',
      };
    case 'warning':
      return {
        bg: 'bg-primary/20',
        border: 'border-primary/50',
        text: 'text-primary',
      };
    case 'success':
      return {
        bg: 'bg-success/20',
        border: 'border-success/50',
        text: 'text-success',
      };
    case 'sanity':
    case 'paranormal':
      return {
        bg: 'bg-paranormal/20',
        border: 'border-paranormal/50',
        text: 'text-paranormal',
      };
    case 'accent':
    case 'energy':
      return {
        bg: 'bg-accent/20',
        border: 'border-accent/50',
        text: 'text-accent',
      };
    case 'death':
      return {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/50',
        text: 'text-purple-400',
      };
    default:
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
      };
  }
}

// Lista de condições com animações (memoizada para evitar re-renders)
interface ConditionListProps {
  conditions: string[];
  size?: 'sm' | 'md' | 'lg';
  onRemove?: (conditionId: string) => void;
  maxVisible?: number;
}

export const ConditionList = React.memo(function ConditionList({
  conditions,
  size = 'md',
  onRemove,
  maxVisible,
}: ConditionListProps) {
  const visibleConditions = maxVisible ? conditions.slice(0, maxVisible) : conditions;
  const hiddenCount = maxVisible ? Math.max(0, conditions.length - maxVisible) : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      <AnimatePresence mode="popLayout">
        {visibleConditions.map((conditionId) => (
          <ConditionBadge
            key={conditionId}
            conditionId={conditionId}
            size={size}
            onRemove={onRemove ? () => onRemove(conditionId) : undefined}
          />
        ))}
        {hiddenCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "inline-flex items-center rounded-md bg-muted border border-border",
              sizeStyles[size]
            )}
          >
            +{hiddenCount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
