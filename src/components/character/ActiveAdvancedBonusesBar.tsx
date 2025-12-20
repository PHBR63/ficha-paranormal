/**
 * ActiveAdvancedBonusesBar - Barra de indicadores visuais para bônus condicionais avançados
 * Mostra quando Assassinar, Potência Máxima ou Atirar para Matar estão ativos
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Swords, Target, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Interface para bônus condicional ativo
interface ActiveBonus {
  id: string;
  name: string;
  effect: string;
  active: boolean;
}

interface ActiveAdvancedBonusesBarProps {
  /** Lista de bônus condicionais ativos */
  activeBonuses: ActiveBonus[];
  className?: string;
}

// Mapeamento de ícones e cores por ID do bônus
const bonusConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; glowColor: string }> = {
  'assassinar': {
    icon: Crosshair,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    glowColor: 'shadow-red-500/50',
  },
  'potencia-maxima': {
    icon: Swords,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    glowColor: 'shadow-amber-500/50',
  },
  'atirar-matar': {
    icon: Target,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    glowColor: 'shadow-orange-500/50',
  },
  'ataque-furtivo': {
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    glowColor: 'shadow-purple-500/50',
  },
};

export function ActiveAdvancedBonusesBar({
  activeBonuses,
  className,
}: ActiveAdvancedBonusesBarProps) {
  // Filtra apenas os bônus ativos
  const activeList = activeBonuses.filter(b => b.active);

  // Se não há bônus ativos, não mostra nada
  if (activeList.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Título */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
        <Zap className="w-3 h-3 text-primary animate-pulse" />
        <span>Bônus Ativos</span>
      </div>

      {/* Lista de bônus */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {activeList.map((bonus) => {
            const config = bonusConfig[bonus.id] || {
              icon: Zap,
              color: 'text-primary',
              bgColor: 'bg-primary/20',
              glowColor: 'shadow-primary/50',
            };
            const Icon = config.icon;

            return (
              <motion.div
                key={bonus.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                layout
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  config.bgColor,
                  'border-current/30',
                  'shadow-lg',
                  config.glowColor
                )}
              >
                {/* Ícone pulsante */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className={cn('p-1 rounded', config.bgColor)}
                >
                  <Icon className={cn('w-4 h-4', config.color)} />
                </motion.div>

                {/* Info do bônus */}
                <div className="flex flex-col">
                  <span className={cn('text-sm font-medium', config.color)}>
                    {bonus.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {bonus.effect}
                  </span>
                </div>

                {/* Badge de ativo */}
                <Badge 
                  variant="outline" 
                  className={cn('text-[10px] ml-1', config.color, 'border-current/50')}
                >
                  ATIVO
                </Badge>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Hook para extrair bônus avançados ativos do summary de bônus
 */
export function useActiveAdvancedBonuses(
  conditionalBonuses: Array<{ id: string; name: string; effects: string[]; active: boolean }>
): ActiveBonus[] {
  // IDs dos bônus avançados que queremos rastrear
  const advancedBonusIds = ['assassinar', 'potencia-maxima', 'atirar-matar', 'ataque-furtivo'];

  return conditionalBonuses
    .filter(b => advancedBonusIds.includes(b.id))
    .map(b => ({
      id: b.id,
      name: b.name,
      effect: b.effects[0] || '',
      active: b.active,
    }));
}

export default ActiveAdvancedBonusesBar;
