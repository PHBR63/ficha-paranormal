/**
 * ConditionBadges - Exibe badges das condições ativas do personagem
 * 
 * Mostra visualmente as condições com ícones, cores e tooltips informativos.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Ghost,
  Zap,
  Shuffle,
  Sparkles,
  AlertCircle,
  BatteryLow,
  Frown,
  BatteryWarning,
  Moon,
  ArrowDown,
  EyeOff,
  HeartCrack,
  Droplets,
  Grip,
  PersonStanding,
  Link,
  Anchor,
  Snail,
  Lock,
  EarOff,
  ShieldOff,
  ShieldX,
  ShieldAlert,
  Flame,
  Skull,
  Mountain,
  X,
  Timer,
  Infinity,
  Clock,
} from 'lucide-react';
import type { ActiveCondition } from '@/hooks/character/useConditions';

// Mapeamento de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  ghost: Ghost,
  zap: Zap,
  shuffle: Shuffle,
  sparkles: Sparkles,
  'alert-circle': AlertCircle,
  'battery-low': BatteryLow,
  frown: Frown,
  'battery-warning': BatteryWarning,
  moon: Moon,
  'arrow-down': ArrowDown,
  'eye-off': EyeOff,
  'heart-crack': HeartCrack,
  droplets: Droplets,
  grip: Grip,
  'person-standing': PersonStanding,
  link: Link,
  anchor: Anchor,
  snail: Snail,
  lock: Lock,
  'ear-off': EarOff,
  'shield-off': ShieldOff,
  'shield-x': ShieldX,
  'shield-alert': ShieldAlert,
  flame: Flame,
  skull: Skull,
  mountain: Mountain,
};

// Mapeamento de cores
const COLOR_MAP: Record<string, string> = {
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  brown: 'bg-amber-700/20 text-amber-600 border-amber-700/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stone: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
};

interface ConditionBadgesProps {
  conditions: ActiveCondition[];
  onRemove?: (conditionId: string) => void;
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}

export function ConditionBadges({
  conditions,
  onRemove,
  compact = false,
  maxVisible,
  className,
}: ConditionBadgesProps) {
  // Ordena por tipo e nome
  const sortedConditions = useMemo(() => {
    return [...conditions].sort((a, b) => {
      // Debuffs primeiro, depois condições, depois buffs
      const typeOrder = { debuff: 0, condition: 1, effect: 2, buff: 3 };
      const orderA = typeOrder[a.condition_type] ?? 1;
      const orderB = typeOrder[b.condition_type] ?? 1;
      if (orderA !== orderB) return orderA - orderB;
      return a.condition_name.localeCompare(b.condition_name);
    });
  }, [conditions]);

  const visibleConditions = maxVisible 
    ? sortedConditions.slice(0, maxVisible) 
    : sortedConditions;
  const hiddenCount = maxVisible ? Math.max(0, sortedConditions.length - maxVisible) : 0;

  if (conditions.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn('flex flex-wrap gap-1', className)}>
        <AnimatePresence mode="popLayout">
          {visibleConditions.map((condition) => (
            <ConditionBadge
              key={condition.id}
              condition={condition}
              onRemove={onRemove}
              compact={compact}
            />
          ))}
        </AnimatePresence>

        {hiddenCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{hiddenCount}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Badge individual de condição
 */
function ConditionBadge({
  condition,
  onRemove,
  compact,
}: {
  condition: ActiveCondition;
  onRemove?: (conditionId: string) => void;
  compact?: boolean;
}) {
  const Icon = ICON_MAP[condition.icon || ''] || AlertCircle;
  const colorClass = COLOR_MAP[condition.color || 'slate'] || COLOR_MAP.slate;

  // Formata duração
  const durationLabel = useMemo(() => {
    if (condition.duration_type === 'permanent') return null;
    if (condition.duration_type === 'scene') return 'Cena';
    if (condition.duration_type === 'until_rest') return 'Até descanso';
    if (condition.duration_type === 'until_end_of_turn') return 'Até fim do turno';
    if (condition.duration_remaining !== null) {
      return `${condition.duration_remaining}r`;
    }
    return null;
  }, [condition]);

  const DurationIcon = condition.duration_type === 'permanent' 
    ? Infinity 
    : condition.duration_type === 'scene'
    ? Clock
    : Timer;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          layout
        >
          <Badge
            variant="outline"
            className={cn(
              'gap-1 border cursor-default transition-colors',
              colorClass,
              compact ? 'px-1.5 py-0.5' : 'px-2 py-1',
              onRemove && 'cursor-pointer hover:opacity-80'
            )}
            onClick={() => onRemove?.(condition.id)}
          >
            <Icon className={cn('flex-shrink-0', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
            
            {!compact && (
              <span className="text-xs font-medium">{condition.condition_name}</span>
            )}

            {/* Stacks */}
            {condition.stacks > 1 && (
              <span className="text-[10px] font-bold">×{condition.stacks}</span>
            )}

            {/* Duração */}
            {durationLabel && !compact && (
              <span className="text-[10px] opacity-70 flex items-center gap-0.5">
                <DurationIcon className="w-2.5 h-2.5" />
                {durationLabel}
              </span>
            )}

            {/* Botão remover */}
            {onRemove && (
              <X className={cn(
                'flex-shrink-0 opacity-50 hover:opacity-100',
                compact ? 'w-2.5 h-2.5' : 'w-3 h-3'
              )} />
            )}
          </Badge>
        </motion.div>
      </TooltipTrigger>

      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="font-medium">{condition.condition_name}</span>
            {condition.stacks > 1 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                {condition.stacks}x
              </Badge>
            )}
          </div>

          {condition.description && (
            <p className="text-xs text-muted-foreground">{condition.description}</p>
          )}

          {condition.mechanical_effect && (
            <p className="text-xs font-medium text-primary">
              {condition.mechanical_effect}
            </p>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border">
            <DurationIcon className="w-3 h-3" />
            <span>
              {condition.duration_type === 'permanent' && 'Permanente'}
              {condition.duration_type === 'rounds' && `${condition.duration_remaining} rodada(s) restante(s)`}
              {condition.duration_type === 'scene' && 'Até o fim da cena'}
              {condition.duration_type === 'until_rest' && 'Até descansar'}
              {condition.duration_type === 'until_end_of_turn' && 'Até o fim do turno'}
            </span>
          </div>

          {condition.source_name && (
            <p className="text-[10px] text-muted-foreground">
              Fonte: {condition.source_name}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Versão compacta para uso em listas
 */
export function ConditionBadgesCompact({
  conditions,
  maxVisible = 3,
  className,
}: {
  conditions: ActiveCondition[];
  maxVisible?: number;
  className?: string;
}) {
  return (
    <ConditionBadges
      conditions={conditions}
      compact
      maxVisible={maxVisible}
      className={className}
    />
  );
}
