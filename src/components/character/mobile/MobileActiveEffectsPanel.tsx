/**
 * MobileActiveEffectsPanel - Painel compacto de efeitos ativos do SUE para mobile
 * Exibe resumo dos efeitos unificados ativos do personagem
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  AlertTriangle, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  Target,
  BookOpen,
  Flame,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  UnifiedEffectsResult,
  UnifiedEffect,
} from '@/hooks/useUnifiedEffects';

interface MobileActiveEffectsPanelProps {
  effectsResult: UnifiedEffectsResult;
  className?: string;
}

// Cores por fonte
const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  origin: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  track: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  condition: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  ritual: { bg: 'bg-red-500/10', text: 'text-red-400' },
  class_ability: { bg: 'bg-green-500/10', text: 'text-green-400' },
  class_power: { bg: 'bg-green-500/10', text: 'text-green-400' },
  general_power: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  paranormal_power: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
};

// Ícones por fonte
const SOURCE_ICONS: Record<string, React.ElementType> = {
  origin: User,
  track: Target,
  condition: AlertTriangle,
  ritual: Sparkles,
  class_ability: Shield,
  class_power: Sword,
  general_power: Zap,
  paranormal_power: Flame,
};

// Labels
const SOURCE_LABELS: Record<string, string> = {
  origin: 'Origem',
  track: 'Trilha',
  condition: 'Condição',
  ritual: 'Ritual',
  class_ability: 'Habilidade',
  class_power: 'Poder',
  general_power: 'Geral',
  paranormal_power: 'Paranormal',
};

// Card de efeito compacto
const EffectCard = memo(function EffectCard({ effect }: { effect: UnifiedEffect }) {
  const colors = SOURCE_COLORS[effect.source] || SOURCE_COLORS.origin;
  const Icon = SOURCE_ICONS[effect.source] || User;
  const mechanics = effect.mechanics;

  // Extrai bônus para exibição
  const bonuses: string[] = [];
  if (mechanics.attackBonus) bonuses.push(`+${mechanics.attackBonus} Ataque`);
  if (mechanics.damageBonus) bonuses.push(`+${mechanics.damageBonus} Dano`);
  if (mechanics.defenseBonus) bonuses.push(`+${mechanics.defenseBonus} Defesa`);
  if (mechanics.initiativeBonus) bonuses.push(`+${mechanics.initiativeBonus} Iniciativa`);
  if (mechanics.hpBonus) bonuses.push(`+${mechanics.hpBonus} PV`);
  if (mechanics.peBonus) bonuses.push(`+${mechanics.peBonus} PE`);

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border",
      colors.bg,
      "border-border/50"
    )}>
      <Icon className={cn("w-4 h-4 shrink-0", colors.text)} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">{effect.name}</span>
        {bonuses.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {bonuses.slice(0, 2).map((b, i) => (
              <span key={i} className={cn("text-[9px] font-medium", colors.text)}>
                {b}
              </span>
            ))}
            {bonuses.length > 2 && (
              <span className="text-[9px] text-muted-foreground">+{bonuses.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export const MobileActiveEffectsPanel = memo(function MobileActiveEffectsPanel({
  effectsResult,
  className,
}: MobileActiveEffectsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { allEffects, computed } = effectsResult;
  const activeEffects = allEffects.filter(e => e.isActive);

  if (activeEffects.length === 0) return null;

  // Resumo de bônus totais
  const totalAttack = computed.attack.general || 0;
  const totalDefense = computed.defense.general || 0;
  const totalHP = computed.resources.hpBonus || 0;
  const totalInitiative = computed.initiative.bonus || 0;

  const hasSignificantBonuses = totalAttack !== 0 || totalDefense !== 0 || totalHP !== 0 || totalInitiative !== 0;

  return (
    <div className={cn("ordo-panel", className)}>
      {/* Header colapsável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Efeitos Ativos</span>
          <Badge variant="secondary" className="text-[10px]">
            {activeEffects.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mini resumo */}
          {hasSignificantBonuses && !isExpanded && (
            <div className="flex items-center gap-1.5">
              {totalAttack !== 0 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 text-red-400 border-red-400/30">
                  <Sword className="w-2.5 h-2.5" />
                  {totalAttack > 0 ? '+' : ''}{totalAttack}
                </Badge>
              )}
              {totalDefense !== 0 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 gap-0.5 text-blue-400 border-blue-400/30">
                  <Shield className="w-2.5 h-2.5" />
                  {totalDefense > 0 ? '+' : ''}{totalDefense}
                </Badge>
              )}
            </div>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Resumo de bônus totais */}
              {hasSignificantBonuses && (
                <div className="grid grid-cols-4 gap-2">
                  {totalAttack !== 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-500/10 border border-red-500/20">
                      <Sword className="h-3 w-3 text-red-400" />
                      <span className={cn("text-xs font-bold", totalAttack > 0 ? "text-green-400" : "text-red-400")}>
                        {totalAttack > 0 ? '+' : ''}{totalAttack}
                      </span>
                    </div>
                  )}
                  {totalDefense !== 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                      <Shield className="h-3 w-3 text-blue-400" />
                      <span className={cn("text-xs font-bold", totalDefense > 0 ? "text-green-400" : "text-red-400")}>
                        {totalDefense > 0 ? '+' : ''}{totalDefense}
                      </span>
                    </div>
                  )}
                  {totalHP !== 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-green-500/10 border border-green-500/20">
                      <Heart className="h-3 w-3 text-green-400" />
                      <span className={cn("text-xs font-bold", totalHP > 0 ? "text-green-400" : "text-red-400")}>
                        {totalHP > 0 ? '+' : ''}{totalHP}
                      </span>
                    </div>
                  )}
                  {totalInitiative !== 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <Zap className="h-3 w-3 text-yellow-400" />
                      <span className={cn("text-xs font-bold", totalInitiative > 0 ? "text-green-400" : "text-red-400")}>
                        {totalInitiative > 0 ? '+' : ''}{totalInitiative}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de efeitos */}
              <div className="space-y-1.5">
                {activeEffects.slice(0, 6).map((effect) => (
                  <EffectCard key={effect.id} effect={effect} />
                ))}
                {activeEffects.length > 6 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">
                    +{activeEffects.length - 6} efeitos adicionais
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MobileActiveEffectsPanel;
