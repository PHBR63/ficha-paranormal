/**
 * MobileTrackPassiveEffectsWidget - Versão mobile do widget de efeitos passivos de trilha
 * Exibe efeitos especiais/passivos ativos com layout otimizado para telas pequenas
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Zap, Target, Skull, Heart, Brain, Swords, Eye, Timer } from '@/components/icons/ordem-icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTrackBonusSummary, getTrackCombatBonuses } from '@/lib/effects/track-effects-adapter';
import type { AttributeType } from '@/lib/unified-effects-engine';

interface MobileTrackPassiveEffectsWidgetProps {
  /** ID da trilha do personagem */
  classTrack: string | null | undefined;
  /** Nível de Exposição */
  nex: number;
  /** Atributos do personagem */
  attributes: Record<AttributeType, number>;
  /** Efeitos de trilha ativos (ativados pelo jogador) */
  activatedEffects?: string[];
  /** Estilo adicional */
  className?: string;
}

/** Mapeia palavras-chave dos efeitos para ícones apropriados */
function getEffectIcon(effect: string): React.ReactNode {
  const lowerEffect = effect.toLowerCase();
  
  if (lowerEffect.includes('crítico') || lowerEffect.includes('letal')) {
    return <Skull className="w-3 h-3" />;
  }
  if (lowerEffect.includes('defesa') || lowerEffect.includes('proteção') || lowerEffect.includes('blindado')) {
    return <Shield className="w-3 h-3" />;
  }
  if (lowerEffect.includes('dano') || lowerEffect.includes('ataque') || lowerEffect.includes('combate')) {
    return <Swords className="w-3 h-3" />;
  }
  if (lowerEffect.includes('iniciativa') || lowerEffect.includes('velocidade') || lowerEffect.includes('ação')) {
    return <Zap className="w-3 h-3" />;
  }
  if (lowerEffect.includes('hp') || lowerEffect.includes('vida') || lowerEffect.includes('ferido')) {
    return <Heart className="w-3 h-3" />;
  }
  if (lowerEffect.includes('perícia') || lowerEffect.includes('teste') || lowerEffect.includes('precisão')) {
    return <Target className="w-3 h-3" />;
  }
  if (lowerEffect.includes('mental') || lowerEffect.includes('paranormal') || lowerEffect.includes('sanidade')) {
    return <Brain className="w-3 h-3" />;
  }
  if (lowerEffect.includes('furtivo') || lowerEffect.includes('oculto') || lowerEffect.includes('observar')) {
    return <Eye className="w-3 h-3" />;
  }
  if (lowerEffect.includes('turno') || lowerEffect.includes('rodada') || lowerEffect.includes('duração')) {
    return <Timer className="w-3 h-3" />;
  }
  
  return <Sparkles className="w-3 h-3" />;
}

/** Determina a cor do badge com base no tipo de efeito */
function getEffectColor(effect: string): string {
  const lowerEffect = effect.toLowerCase();
  
  if (lowerEffect.includes('crítico') || lowerEffect.includes('letal') || lowerEffect.includes('dano')) {
    return 'bg-destructive/20 text-destructive border-destructive/30';
  }
  if (lowerEffect.includes('defesa') || lowerEffect.includes('proteção')) {
    return 'bg-primary/20 text-primary border-primary/30';
  }
  if (lowerEffect.includes('hp') || lowerEffect.includes('vida') || lowerEffect.includes('cura')) {
    return 'bg-hp/20 text-hp border-hp/30';
  }
  if (lowerEffect.includes('paranormal') || lowerEffect.includes('mental')) {
    return 'bg-paranormal/20 text-paranormal border-paranormal/30';
  }
  if (lowerEffect.includes('pe') || lowerEffect.includes('esforço')) {
    return 'bg-pe/20 text-pe border-pe/30';
  }
  
  return 'bg-accent/20 text-accent-foreground border-accent/30';
}

export function MobileTrackPassiveEffectsWidget({
  classTrack,
  nex,
  attributes,
  activatedEffects = [],
  className,
}: MobileTrackPassiveEffectsWidgetProps) {
  // Obtém resumo de bônus da trilha (inclui efeitos especiais)
  const trackSummary = useMemo(() => {
    return getTrackBonusSummary(classTrack, nex, attributes);
  }, [classTrack, nex, attributes]);
  
  // Obtém bônus de combate ativos (inclui efeitos especiais de ativações)
  const combatBonuses = useMemo(() => {
    return getTrackCombatBonuses(
      classTrack, 
      nex, 
      attributes, 
      'melee', // Tipo não afeta specialEffects
      activatedEffects
    );
  }, [classTrack, nex, attributes, activatedEffects]);
  
  // Combina efeitos especiais de ambas as fontes (sem duplicados)
  const allSpecialEffects = useMemo(() => {
    const effectsSet = new Set<string>();
    
    // Adiciona efeitos do resumo da trilha
    trackSummary.specialAbilities.forEach(e => effectsSet.add(e));
    
    // Adiciona efeitos de combate ativados
    combatBonuses.specialEffects.forEach(e => effectsSet.add(e));
    
    return Array.from(effectsSet);
  }, [trackSummary, combatBonuses]);
  
  // Não renderiza se não houver efeitos especiais
  if (allSpecialEffects.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 rounded-lg border border-border/50 p-3 space-y-2",
        className
      )}
    >
      {/* Header compacto */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">
          Efeitos Passivos
        </span>
        {trackSummary.trackName && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
            {trackSummary.trackName}
          </Badge>
        )}
      </div>
      
      {/* Lista de efeitos em grid para mobile */}
      <div className="flex flex-wrap gap-1">
        <AnimatePresence mode="popLayout">
          {allSpecialEffects.map((effect, index) => (
            <motion.div
              key={effect}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.03 }}
            >
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0.5 flex items-center gap-1",
                  getEffectColor(effect)
                )}
                title={effect}
              >
                {getEffectIcon(effect)}
                <span className="max-w-[80px] truncate">
                  {effect.length > 15 ? effect.substring(0, 15) + '...' : effect}
                </span>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Contador de técnicas ativas */}
      {combatBonuses.specialEffects.length > 0 && (
        <div className="text-[9px] text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/30">
          <Zap className="w-2.5 h-2.5 text-pe" />
          <span>
            {combatBonuses.specialEffects.length} técnica(s) ativa(s)
          </span>
        </div>
      )}
    </motion.div>
  );
}
