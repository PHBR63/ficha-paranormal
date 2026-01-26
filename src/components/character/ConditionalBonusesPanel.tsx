/**
 * ConditionalBonusesPanel - Painel colapsável com bônus condicionais de trilha
 * Permite ativar/desativar bônus como Inquebrável, Disparo Letal, Ataque Furtivo
 * 
 * Agora inclui indicadores de exclusão por stacking (SUE Hardening)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Shield, Crosshair, Sparkles, Target, Swords, Zap, Brain, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConditionalBonus } from '@/hooks/useCharacterBonusSummary';
import { StackingExclusionIndicator, type ExcludedEffectInfo } from './StackingExclusionIndicator';

interface ConditionalBonusesPanelProps {
  conditionalBonuses: ConditionalBonus[];
  onToggleBonus: (bonusId: string, active: boolean) => void;
  /** Efeitos excluídos por stacking (do SUE Hardening) */
  excludedEffects?: ExcludedEffectInfo[];
  className?: string;
}

// Mapeia ícones por ID do bônus
function getBonusIcon(bonusId: string) {
  const iconMap: Record<string, React.ElementType> = {
    'inquebravel': Shield,
    'disparo-letal': Crosshair,
    'ataque-furtivo': Sparkles,
    'fanatico': Swords,
    'ataque-poderoso': Zap,
    'foco-arma': Target,
    'combate-defensivo': Shield,
    'sentido-tatico': Eye,
    // Fase 4: Bônus condicionais avançados
    'assassinar': Crosshair,      // Infiltrador: ataque letal
    'potencia-maxima': Swords,    // Guerreiro: força dobrada
    'atirar-matar': Target,       // Atirador de Elite: crítico máximo
    'bloqueio-casca-grossa': Shield,
  };
  return iconMap[bonusId] || Zap;
}

// Mapeia cores por tipo de fonte
function getSourceColor(source: ConditionalBonus['source']) {
  const colorMap: Record<ConditionalBonus['source'], string> = {
    ability: 'text-primary border-primary/30 bg-primary/10',
    general_power: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    paranormal: 'text-paranormal border-paranormal/30 bg-paranormal/10',
    origin: 'text-energy border-energy/30 bg-energy/10',
  };
  return colorMap[source] || 'text-muted-foreground border-border bg-muted/30';
}

function getSourceLabel(source: ConditionalBonus['source']) {
  const labelMap: Record<ConditionalBonus['source'], string> = {
    ability: 'Habilidade',
    general_power: 'Poder Geral',
    paranormal: 'Paranormal',
    origin: 'Origem',
  };
  return labelMap[source] || 'Outro';
}

export function ConditionalBonusesPanel({
  conditionalBonuses,
  onToggleBonus,
  excludedEffects = [],
  className,
}: ConditionalBonusesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Se não há bônus condicionais, não mostra nada
  if (conditionalBonuses.length === 0) {
    return null;
  }

  const activeCount = conditionalBonuses.filter(b => b.active).length;

  return (
    <div className={cn("ordo-panel", className)}>
      {/* Header colapsável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Bônus Condicionais</span>
          {activeCount > 0 && (
            <Badge variant="outline" className="text-xs bg-primary/20 border-primary/30 text-primary">
              {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Conteúdo expansível */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {conditionalBonuses.map((bonus) => {
                const Icon = getBonusIcon(bonus.id);
                const sourceColor = getSourceColor(bonus.source);
                
                return (
                  <motion.div
                    key={bonus.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-start justify-between p-2.5 rounded-lg border transition-all",
                      bonus.active 
                        ? "bg-primary/10 border-primary/30" 
                        : "bg-muted/30 border-border/50 opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={cn(
                        "p-1.5 rounded",
                        bonus.active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "font-medium text-sm",
                            bonus.active ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {bonus.name}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 py-0", sourceColor)}
                          >
                            {getSourceLabel(bonus.source)}
                          </Badge>
                        </div>
                        
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {bonus.condition}
                        </p>
                        
                        {/* Efeitos */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {bonus.effects.map((effect, i) => (
                            <span
                              key={i}
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                bonus.active 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {effect}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Toggle */}
                    <Switch
                      checked={bonus.active}
                      onCheckedChange={(checked) => onToggleBonus(bonus.id, checked)}
                      className="shrink-0 ml-2"
                    />
                  </motion.div>
                );
              })}
              
              {/* Indicador de Exclusões por Stacking */}
              {excludedEffects.length > 0 && (
                <div className="pt-2 border-t border-border/30">
                  <StackingExclusionIndicator
                    excludedEffects={excludedEffects}
                    variant="badge"
                  />
                </div>
              )}
              
              {/* Dica */}
              <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border/30">
                Ative quando as condições forem atendidas em combate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}