"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CONDITIONS, type Condition } from "@/lib/conditions";
import { CONDITION_EFFECTS } from "@/lib/game-engine";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const badge = (
    <motion.div
      ref={ref}
      layout
      initial={animate ? { scale: 0, opacity: 0 } : undefined}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={onRemove ? { scale: 1.05 } : undefined}
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

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{condition.icon}</span>
              <span className="font-semibold">{condition.name}</span>
            </div>
            <p className="text-muted-foreground text-sm">{condition.description}</p>
            <div className="border-t border-border pt-2">
              <p className="text-sm font-medium text-primary">Efeito:</p>
              <p className="text-sm">{condition.effect}</p>
            </div>
            {condition.removal && (
              <div className="border-t border-border pt-2">
                <p className="text-sm font-medium text-success">Remoção:</p>
                <p className="text-sm">{condition.removal}</p>
              </div>
            )}
            {effect && (
              <div className="border-t border-border pt-2 space-y-1 text-xs">
                {effect.defenseModifier !== 0 && (
                  <div className="flex justify-between">
                    <span>Defesa:</span>
                    <span className={effect.defenseModifier < 0 ? 'text-destructive' : 'text-success'}>
                      {effect.defenseModifier > 0 ? '+' : ''}{effect.defenseModifier}
                    </span>
                  </div>
                )}
                {effect.testModifier !== 0 && (
                  <div className="flex justify-between">
                    <span>Testes:</span>
                    <span className={effect.testModifier < 0 ? 'text-destructive' : 'text-success'}>
                      {effect.testModifier > 0 ? '+' : ''}{effect.testModifier}
                    </span>
                  </div>
                )}
                {!effect.canAct && (
                  <div className="text-destructive">⚠️ Não pode agir</div>
                )}
                {!effect.canMove && (
                  <div className="text-destructive">⚠️ Não pode se mover</div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
    default:
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
      };
  }
}

// List of conditions with animations
interface ConditionListProps {
  conditions: string[];
  size?: 'sm' | 'md' | 'lg';
  onRemove?: (conditionId: string) => void;
  maxVisible?: number;
}

export function ConditionList({
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
}
