/**
 * AniquiladorPassivesIndicator - Indicador visual para habilidades passivas do Aniquilador
 * Exibe A Favorita (NEX 10%), Técnica Secreta (NEX 40%) e Máquina de Matar (NEX 99%)
 * com suas respectivas reduções de categoria e bônus
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crosshair, Skull, ChevronDown, Swords, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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

interface AniquiladorPassivesIndicatorProps {
  /** Trilha de classe do personagem */
  classTrack: string | null | undefined;
  /** NEX atual do personagem (0-99) */
  nex: number;
  /** Arma favorita selecionada (se houver) */
  favoriteWeapon?: {
    id: string;
    name: string;
    damage?: string;
    category?: number;
    effectiveCategory?: number;
  } | null;
  /** Classe CSS adicional */
  className?: string;
  /** Variante de exibição */
  variant?: 'full' | 'compact' | 'minimal';
  /** Se começa expandido (apenas para variante full) */
  defaultExpanded?: boolean;
}

// Configuração das habilidades passivas por NEX
interface PassiveAbility {
  id: string;
  name: string;
  minNex: number;
  categoryReduction: number;
  effects: string[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PASSIVE_ABILITIES: PassiveAbility[] = [
  {
    id: 'a-favorita',
    name: 'A Favorita',
    minNex: 10,
    categoryReduction: 1,
    effects: ['Categoria -I'],
    icon: Star,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/15',
    borderColor: 'border-yellow-500/40',
  },
  {
    id: 'tecnica-secreta',
    name: 'Técnica Secreta',
    minNex: 40,
    categoryReduction: 2,
    effects: ['Categoria -II', 'Técnicas ativáveis'],
    icon: Crosshair,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
  },
  {
    id: 'maquina-de-matar',
    name: 'Máquina de Matar',
    minNex: 99,
    categoryReduction: 3,
    effects: ['Categoria -III', 'Margem -2', '+1 dado de dano'],
    icon: Skull,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
  },
];

/**
 * Extrai o tamanho do dado de uma fórmula de dano
 */
function extractDieInfo(damageFormula: string | undefined): { count: number; size: number } | null {
  if (!damageFormula) return null;
  const match = damageFormula.match(/(\d+)d(\d+)/i);
  if (match) {
    return { count: parseInt(match[1], 10), size: parseInt(match[2], 10) };
  }
  return null;
}

/**
 * Formata categoria como número romano
 */
function romanCategory(n: number): string {
  if (n <= 0) return '0';
  if (n === 1) return 'I';
  if (n === 2) return 'II';
  if (n === 3) return 'III';
  return n.toString();
}

export const AniquiladorPassivesIndicator = memo(function AniquiladorPassivesIndicator({
  classTrack,
  nex,
  favoriteWeapon,
  className,
  variant = 'full',
  defaultExpanded = true,
}: AniquiladorPassivesIndicatorProps) {
  // Verifica se é trilha Aniquilador
  const isAniquilador = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('aniquilador');
  }, [classTrack]);

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    return PASSIVE_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Habilidade de maior nível desbloqueada (determina redução atual de categoria)
  const highestAbility = useMemo(() => {
    if (unlockedAbilities.length === 0) return null;
    return unlockedAbilities[unlockedAbilities.length - 1];
  }, [unlockedAbilities]);

  // Info do dado extra para Máquina de Matar
  const dieInfo = useMemo(() => {
    if (!favoriteWeapon?.damage) return null;
    return extractDieInfo(favoriteWeapon.damage);
  }, [favoriteWeapon?.damage]);

  // Se não é Aniquilador ou não tem habilidades desbloqueadas, não renderiza
  if (!isAniquilador || unlockedAbilities.length === 0) return null;

  // Variante minimal - apenas badges inline
  if (variant === 'minimal') {
    return (
      <div className={cn('flex flex-wrap gap-1', className)}>
        <AnimatePresence mode="popLayout">
          {unlockedAbilities.map((ability, index) => {
            const Icon = ability.icon;
            return (
              <TooltipProvider key={ability.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Badge
                        variant="outline"
                        className={cn(
                          'gap-1 cursor-help',
                          ability.bgColor,
                          ability.color,
                          ability.borderColor
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {ability.name}
                      </Badge>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className={cn('font-medium', ability.color)}>{ability.name}</p>
                    <p className="text-xs text-muted-foreground">
                      NEX {ability.minNex}% • {ability.effects.join(', ')}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // Variante compact - resumo horizontal
  if (variant === 'compact') {
    if (!highestAbility) return null;
    const Icon = highestAbility.icon;
    
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg',
          highestAbility.bgColor,
          'border',
          highestAbility.borderColor,
          className
        )}
      >
        {/* Ícone animado */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn('p-1.5 rounded', highestAbility.bgColor)}
        >
          <Icon className={cn('w-4 h-4', highestAbility.color)} />
        </motion.div>

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-sm font-medium', highestAbility.color)}>
              {highestAbility.name}
            </span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground border-muted">
              NEX {highestAbility.minNex}%
            </Badge>
          </div>
          {favoriteWeapon && (
            <p className="text-[10px] text-muted-foreground truncate">
              {favoriteWeapon.name}
              {favoriteWeapon.effectiveCategory !== undefined && favoriteWeapon.category !== undefined && (
                <span className="ml-1">
                  • Cat. {romanCategory(favoriteWeapon.category)} → {romanCategory(favoriteWeapon.effectiveCategory)}
                </span>
              )}
              {dieInfo && nex >= 99 && (
                <span className="ml-1 text-amber-400">• +1d{dieInfo.size}</span>
              )}
            </p>
          )}
        </div>

        {/* Badges de habilidades */}
        <div className="flex gap-0.5 shrink-0">
          {unlockedAbilities.map((ability) => {
            const AbilityIcon = ability.icon;
            return (
              <TooltipProvider key={ability.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn('p-1 rounded', ability.bgColor, ability.borderColor, 'border')}>
                      <AbilityIcon className={cn('w-3 h-3', ability.color)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {ability.name} — {ability.effects[0]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Variante full - card expansível com detalhes completos
  return (
    <Collapsible defaultOpen={defaultExpanded} className={className}>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'relative overflow-hidden rounded-lg border',
          'bg-gradient-to-br from-yellow-950/30 via-orange-950/20 to-amber-950/30',
          'border-amber-500/30'
        )}
      >
        {/* Header colapsável */}
        <CollapsibleTrigger className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
          {/* Ícone da trilha */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30"
          >
            <Swords className="w-5 h-5 text-amber-400" />
          </motion.div>

          {/* Título e resumo */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-amber-400">Aniquilador</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground border-muted">
                {unlockedAbilities.length} passiva{unlockedAbilities.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {favoriteWeapon && (
              <p className="text-[10px] text-muted-foreground truncate">
                Arma Favorita: {favoriteWeapon.name}
              </p>
            )}
          </div>

          {/* Badges de status e seta */}
          <div className="flex items-center gap-2 shrink-0">
            {highestAbility && (
              <Badge 
                variant="outline" 
                className={cn('text-[9px] gap-1', highestAbility.color, highestAbility.borderColor)}
              >
                Cat. -{romanCategory(highestAbility.categoryReduction)}
              </Badge>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </div>
        </CollapsibleTrigger>

        {/* Conteúdo expandido */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t border-amber-500/20 pt-2">
            <AnimatePresence mode="popLayout">
              {unlockedAbilities.map((ability, index) => {
                const Icon = ability.icon;
                const isHighest = ability.id === highestAbility?.id;
                
                return (
                  <motion.div
                    key={ability.id}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -10, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg border transition-all',
                      ability.bgColor,
                      ability.borderColor,
                      isHighest && 'ring-1 ring-offset-1 ring-offset-background',
                      isHighest && ability.borderColor.replace('border-', 'ring-')
                    )}
                  >
                    {/* Ícone */}
                    <div className={cn('p-1.5 rounded', ability.bgColor)}>
                      <Icon className={cn('w-4 h-4', ability.color)} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-xs font-medium', ability.color)}>
                          {ability.name}
                        </span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 text-muted-foreground">
                          NEX {ability.minNex}%
                        </Badge>
                        {isHighest && (
                          <Badge variant="outline" className={cn('text-[8px] px-1 py-0', ability.color, ability.borderColor)}>
                            ATIVO
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        {ability.effects.map((effect, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 opacity-50" />
                            {effect}
                            {/* Mostra dado extra para Máquina de Matar */}
                            {ability.id === 'maquina-de-matar' && effect.includes('dado') && dieInfo && (
                              <span className="text-amber-400 ml-0.5">(d{dieInfo.size})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Resumo da arma favorita */}
            {favoriteWeapon && highestAbility && (
              <div className="mt-2 p-2 rounded bg-background/50 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Arma Favorita Atual
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{favoriteWeapon.name}</span>
                  {favoriteWeapon.category !== undefined && favoriteWeapon.effectiveCategory !== undefined && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground line-through">
                        Cat. {romanCategory(favoriteWeapon.category)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className={cn('font-bold', highestAbility.color)}>
                        Cat. {romanCategory(favoriteWeapon.effectiveCategory)}
                      </span>
                    </div>
                  )}
                </div>
                {dieInfo && nex >= 99 && (
                  <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                    <Skull className="w-3 h-3" />
                    Dano: {dieInfo.count}d{dieInfo.size} → {dieInfo.count + 1}d{dieInfo.size}
                  </p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
});

export default AniquiladorPassivesIndicator;
