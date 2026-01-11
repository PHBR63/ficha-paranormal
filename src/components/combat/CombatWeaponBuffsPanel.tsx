/**
 * CombatWeaponBuffsPanel - Painel de buffs de arma no CombatTracker
 * 
 * Exibe buffs de arma ativos para cada combatente com personagem vinculado,
 * mostrando contagem de rodadas e permitindo gerenciamento durante o combate.
 * 
 * @module components/combat/CombatWeaponBuffsPanel
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sword,
  Flame,
  Skull,
  Zap,
  Brain,
  Ghost,
  ChevronDown,
  ChevronUp,
  Timer,
  Sparkles,
  X,
  Clock,
  Minus,
  Plus,
} from 'lucide-react';
import type { CombatantWeaponBuffs } from '@/hooks/combat/useCombatWeaponBuffs';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import { formatDamageFormula } from '@/lib/rituals/legacy-exports';

// Props do componente
interface CombatWeaponBuffsPanelProps {
  combatantBuffs: CombatantWeaponBuffs[];
  hasTurnBasedBuffs: boolean;
  totalBuffs: number;
  currentCombatantId?: string;
  onAdvanceTurn?: () => void;
  onRemoveBuff?: (characterId: string, buffId: string) => void;
  onAdjustTurns?: (characterId: string, buffId: string, delta: number) => void;
  className?: string;
  compact?: boolean;
}

// Ícones por elemento
const ELEMENT_ICONS: Record<string, typeof Flame> = {
  Sangue: Flame,
  Morte: Skull,
  Energia: Zap,
  Conhecimento: Brain,
  Medo: Ghost,
};

// Cores por elemento
const ELEMENT_COLORS: Record<string, string> = {
  Sangue: 'text-red-400 bg-red-500/20 border-red-500/30',
  Morte: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  Energia: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  Conhecimento: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  Medo: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
};

// Componente de badge de buff individual
function BuffBadge({
  buff,
  onRemove,
  onAdjustTurns,
  compact = false,
}: {
  buff: WeaponBuff;
  onRemove?: () => void;
  onAdjustTurns?: (delta: number) => void;
  compact?: boolean;
}) {
  const ElementIcon = ELEMENT_ICONS[buff.element] || Sparkles;
  const colorClass = ELEMENT_COLORS[buff.element] || 'text-primary bg-primary/20 border-primary/30';
  
  const isRoundBased = buff.duration === 'rodadas';
  const turnsLeft = buff.turnsRemaining ?? 0;
  const isExpiring = isRoundBased && turnsLeft <= 1;
  
  // Formata efeitos do buff
  const effects: string[] = [];
  if (buff.bonusDamage) {
    effects.push(`+${formatDamageFormula(buff.bonusDamage)}`);
  }
  if (buff.attackBonus) {
    effects.push(`+${buff.attackBonus} ataque`);
  }
  if (buff.criticalBonus) {
    effects.push(`+${buff.criticalBonus} margem crítica`);
  }
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline"
              className={cn(
                'gap-1 px-2 py-0.5 text-xs border cursor-default',
                colorClass,
                isExpiring && 'animate-pulse'
              )}
            >
              <ElementIcon className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{buff.ritualName}</span>
              {isRoundBased && (
                <span className="ml-1 font-mono">({turnsLeft})</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px]">
            <div className="space-y-1">
              <p className="font-semibold">{buff.ritualName}</p>
              {effects.length > 0 && (
                <p className="text-sm text-muted-foreground">{effects.join(' • ')}</p>
              )}
              {isRoundBased && (
                <p className="text-xs text-amber-400">
                  {turnsLeft} rodada(s) restante(s)
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div 
      className={cn(
        'flex items-center justify-between gap-2 p-2 rounded-md border',
        colorClass,
        isExpiring && 'animate-pulse ring-1 ring-amber-500/50'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <ElementIcon className="w-4 h-4 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{buff.ritualName}</p>
          {effects.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">{effects.join(' • ')}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {isRoundBased && (
          <div className="flex items-center gap-1 mr-1">
            {onAdjustTurns && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onAdjustTurns(-1)}
                disabled={turnsLeft <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
            )}
            <Badge variant="secondary" className={cn('gap-1', isExpiring && 'bg-amber-500/20 text-amber-400')}>
              <Clock className="w-3 h-3" />
              {turnsLeft}
            </Badge>
            {onAdjustTurns && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onAdjustTurns(1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
        
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Componente de card de combatente com buffs
function CombatantBuffsCard({
  combatantBuff,
  isCurrentTurn,
  onRemoveBuff,
  onAdjustTurns,
  compact,
}: {
  combatantBuff: CombatantWeaponBuffs;
  isCurrentTurn: boolean;
  onRemoveBuff?: (characterId: string, buffId: string) => void;
  onAdjustTurns?: (characterId: string, buffId: string, delta: number) => void;
  compact: boolean;
}) {
  const [isOpen, setIsOpen] = useState(!compact);
  
  const turnBasedCount = combatantBuff.buffs.filter(b => b.duration === 'rodadas').length;
  const hasExpiringBuffs = combatantBuff.buffs.some(
    b => b.duration === 'rodadas' && (b.turnsRemaining ?? 0) <= 1
  );
  
  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border',
          isCurrentTurn && 'ring-1 ring-primary/50 bg-primary/5'
        )}
      >
        <Sword className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium truncate">{combatantBuff.combatantName}</span>
        <div className="flex flex-wrap gap-1 ml-auto">
          {combatantBuff.buffs.map(buff => (
            <BuffBadge
              key={buff.id}
              buff={buff}
              compact
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div 
        className={cn(
          'rounded-lg border bg-card',
          isCurrentTurn && 'ring-2 ring-primary/50 shadow-lg shadow-primary/10',
          hasExpiringBuffs && 'border-amber-500/50'
        )}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-primary" />
              <span className="font-medium">{combatantBuff.combatantName}</span>
              {isCurrentTurn && (
                <Badge variant="default" className="text-xs">Turno Atual</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {turnBasedCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Timer className="w-3 h-3" />
                  {turnBasedCount} com rodadas
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                {combatantBuff.buffs.length} buff(s)
              </Badge>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-2">
            {/* Resumo de bônus agregados */}
            {(combatantBuff.totalAttackBonus > 0 || combatantBuff.totalCriticalBonus > 0) && (
              <div className="flex gap-2 text-xs text-muted-foreground mb-2 p-2 bg-secondary/30 rounded">
                {combatantBuff.totalAttackBonus > 0 && (
                  <span>+{combatantBuff.totalAttackBonus} ataque</span>
                )}
                {combatantBuff.totalCriticalBonus > 0 && (
                  <span>+{combatantBuff.totalCriticalBonus} crítico</span>
                )}
              </div>
            )}
            
            {/* Lista de buffs */}
            <AnimatePresence>
              {combatantBuff.buffs.map(buff => (
                <motion.div
                  key={buff.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <BuffBadge
                    buff={buff}
                    onRemove={
                      combatantBuff.characterId && onRemoveBuff
                        ? () => onRemoveBuff(combatantBuff.characterId!, buff.id)
                        : undefined
                    }
                    onAdjustTurns={
                      combatantBuff.characterId && onAdjustTurns && buff.duration === 'rodadas'
                        ? (delta) => onAdjustTurns(combatantBuff.characterId!, buff.id, delta)
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * Painel principal de buffs de arma no combate
 */
export function CombatWeaponBuffsPanel({
  combatantBuffs,
  hasTurnBasedBuffs,
  totalBuffs,
  currentCombatantId,
  onAdvanceTurn,
  onRemoveBuff,
  onAdjustTurns,
  className,
  compact = false,
}: CombatWeaponBuffsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (combatantBuffs.length === 0) {
    return null;
  }
  
  const expiringCount = combatantBuffs.reduce(
    (sum, cb) => sum + cb.buffs.filter(
      b => b.duration === 'rodadas' && (b.turnsRemaining ?? 0) <= 1
    ).length,
    0
  );
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className={cn('rounded-lg border bg-card/50 backdrop-blur', className)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold">Buffs de Arma Ativos</span>
            </div>
            
            <div className="flex items-center gap-2">
              {expiringCount > 0 && (
                <Badge variant="destructive" className="gap-1 animate-pulse">
                  <Timer className="w-3 h-3" />
                  {expiringCount} expirando
                </Badge>
              )}
              <Badge variant="secondary">{totalBuffs} total</Badge>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-3 pt-0 space-y-3">
            {/* Botão de avançar turnos de buffs */}
            {hasTurnBasedBuffs && onAdvanceTurn && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={onAdvanceTurn}
              >
                <Timer className="w-4 h-4" />
                Avançar Rodada dos Buffs
              </Button>
            )}
            
            {/* Cards de combatentes */}
            <div className="space-y-2">
              {combatantBuffs.map(cb => (
                <CombatantBuffsCard
                  key={cb.combatantId}
                  combatantBuff={cb}
                  isCurrentTurn={cb.combatantId === currentCombatantId}
                  onRemoveBuff={onRemoveBuff}
                  onAdjustTurns={onAdjustTurns}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default CombatWeaponBuffsPanel;
