/**
 * WeaponBuffIndicator - Indicador visual de buffs ativos em armas
 * Mostra os bônus de rituais como Amaldiçoar Arma na tabela de combate
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Skull, Brain, Zap, Ghost, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeaponBuff, ELEMENT_BUFF_COLORS } from '@/hooks/useWeaponBuffs';
import { formatDamageFormula } from '@/lib/ritual-effects';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Props do componente
interface WeaponBuffIndicatorProps {
  buffs: WeaponBuff[];
  onRemoveBuff?: (buffId: string) => void;
  compact?: boolean;
  className?: string;
}

// Ícone por elemento
function ElementIcon({ element, className }: { element: string; className?: string }) {
  const iconClass = cn('w-3 h-3', className);
  
  switch (element.toLowerCase()) {
    case 'sangue':
      return <Flame className={iconClass} />;
    case 'morte':
      return <Skull className={iconClass} />;
    case 'conhecimento':
      return <Brain className={iconClass} />;
    case 'energia':
      return <Zap className={iconClass} />;
    case 'medo':
      return <Ghost className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
}

// Badge individual de buff
function BuffBadge({ 
  buff, 
  onRemove, 
  compact 
}: { 
  buff: WeaponBuff; 
  onRemove?: () => void;
  compact?: boolean;
}) {
  const colors = ELEMENT_BUFF_COLORS[buff.element] || ELEMENT_BUFF_COLORS.Conhecimento;
  
  // Monta texto dos efeitos
  const effectParts: string[] = [];
  if (buff.bonusDamage) {
    effectParts.push(`+${formatDamageFormula(buff.bonusDamage)}`);
  }
  if (buff.attackBonus) {
    effectParts.push(`+${buff.attackBonus} ataque`);
  }
  if (buff.criticalBonus) {
    effectParts.push(`crítico -${buff.criticalBonus}`);
  }
  if (buff.criticalMultiplierBonus) {
    effectParts.push(`mult. +${buff.criticalMultiplierBonus}`);
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                'border cursor-help',
                colors.bg,
                colors.text,
                colors.border
              )}
            >
              <ElementIcon element={buff.element} />
              <span>{effectParts[0]}</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{buff.ritualName}</p>
              <p className="text-xs text-muted-foreground">
                {effectParts.join(' • ')}
              </p>
              {buff.enhancements.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Aprimoramentos: {buff.enhancements.join(', ')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs',
        'border shadow-sm',
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <ElementIcon element={buff.element} className="w-4 h-4" />
      <div className="flex flex-col">
        <span className="font-medium">{buff.ritualName}</span>
        <span className="text-[10px] opacity-80">{effectParts.join(' • ')}</span>
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-1 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </motion.div>
  );
}

// Componente principal
export function WeaponBuffIndicator({
  buffs,
  onRemoveBuff,
  compact = false,
  className,
}: WeaponBuffIndicatorProps) {
  if (buffs.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      <AnimatePresence mode="popLayout">
        {buffs.map(buff => (
          <BuffBadge
            key={buff.id}
            buff={buff}
            onRemove={onRemoveBuff ? () => onRemoveBuff(buff.id) : undefined}
            compact={compact}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Painel expandido de buffs ativos (para mostrar detalhes completos)
export function WeaponBuffsPanel({
  buffs,
  onRemoveBuff,
  onClearAll,
  className,
}: {
  buffs: WeaponBuff[];
  onRemoveBuff?: (buffId: string) => void;
  onClearAll?: () => void;
  className?: string;
}) {
  if (buffs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border border-primary/30 bg-primary/5 p-3',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Buffs de Arma Ativos
          </span>
        </div>
        {onClearAll && buffs.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-destructive"
            onClick={onClearAll}
          >
            Limpar Todos
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {buffs.map(buff => (
          <BuffBadge
            key={buff.id}
            buff={buff}
            onRemove={onRemoveBuff ? () => onRemoveBuff(buff.id) : undefined}
          />
        ))}
      </div>

      {/* Resumo de bônus totais */}
      <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
        <span className="font-medium">Total:</span>{' '}
        {buffs.some(b => b.attackBonus) && (
          <span className="text-green-400">
            +{buffs.reduce((sum, b) => sum + (b.attackBonus || 0), 0)} ataque
          </span>
        )}{' '}
        {buffs.some(b => b.criticalBonus) && (
          <span className="text-amber-400">
            -{buffs.reduce((sum, b) => sum + (b.criticalBonus || 0), 0)} crítico
          </span>
        )}
      </div>
    </motion.div>
  );
}
