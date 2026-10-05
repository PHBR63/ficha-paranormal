/**
 * TrackCombatBonusesBar - Barra de bônus de trilha na seção de combate
 * Mostra modificadores de dano e ataque de habilidades como Mira de Elite e Golpe Pesado
 * Inclui botão de rolagem de iniciativa com bônus automáticos
 * 
 * MIGRAÇÃO FASE 3: Usa useInitiativeRollWithSUE para integração completa com SUE
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Swords, Target, Zap, Shield, Brain, Sparkles, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { DiceRollResult } from '@/lib/dice-roller';
import { useInitiativeRollWithSUE, InitiativeRollCharacterConfig } from '@/hooks/sue/useInitiativeRollWithSUE';
import { BonusBreakdown, CombatBonuses, DamageReduction, EffectResistances } from '@/hooks/useCharacterBonusSummary';

interface TrackCombatBonusesBarProps {
  combat: CombatBonuses;
  damageReduction: DamageReduction;
  effectResistances: EffectResistances;
  agility?: number; // Atributo de Agilidade para iniciativa
  // Dados do personagem para integração SUE
  characterClass?: string;
  classTrack?: string;
  nex?: number;
  attributes?: { strength: number; agility: number; vigor: number; intellect: number; presence: number };
  activeConditions?: string[];
  skillBonuses?: Record<string, number>;
  /** Trilha obtida via Versatilidade (NEX 50%) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
  onInitiativeRoll?: (result: DiceRollResult) => void; // Callback para rolagem
  className?: string;
}

// Componente de item de bônus individual
function BonusItem({
  icon: Icon,
  label,
  value,
  tooltip,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tooltip: React.ReactNode;
  variant?: 'default' | 'attack' | 'damage' | 'defense' | 'critical';
}) {
  const variantColors = {
    default: 'bg-muted/50 text-foreground',
    attack: 'bg-primary/15 text-primary border-primary/30',
    damage: 'bg-destructive/15 text-destructive border-destructive/30',
    defense: 'bg-energy/15 text-energy border-energy/30',
    critical: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium cursor-help",
              variantColors[variant]
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="uppercase text-[10px]">{label}</span>
            <span className="font-display">{typeof value === 'number' && value > 0 ? `+${value}` : value}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Renderiza breakdown de bônus
function renderBreakdown(breakdown: BonusBreakdown[]) {
  return (
    <div className="space-y-1">
      {breakdown.map((b, i) => (
        <div key={i} className="flex items-center justify-between text-xs">
          <span className={cn(!b.active && "text-muted-foreground line-through")}>
            {b.source}
            {b.conditional && <span className="text-muted-foreground ml-1">({b.conditional})</span>}
          </span>
          <span className={cn("font-medium", b.active && "text-primary")}>
            {typeof b.value === 'number' && b.value > 0 ? `+${b.value}` : b.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TrackCombatBonusesBar({
  combat,
  damageReduction,
  effectResistances,
  agility = 0,
  characterClass = 'Combatente',
  classTrack,
  nex = 5,
  attributes,
  activeConditions = [],
  skillBonuses,
  versatilityTrack,
  onInitiativeRoll,
  className,
}: TrackCombatBonusesBarProps) {
  // Estado para animação de rolagem
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);

  // Configuração do personagem para o hook SUE
  const characterConfig = useMemo<InitiativeRollCharacterConfig>(() => ({
    characterClass,
    classTrack,
    nex,
    versatilityTrack,
    attributes: attributes || {
      strength: 1,
      agility: agility,
      vigor: 1,
      intellect: 1,
      presence: 1,
    },
    activeConditions,
    skills: skillBonuses,
  }), [characterClass, classTrack, nex, attributes, agility, activeConditions, versatilityTrack, skillBonuses]);

  // Hook de iniciativa integrado com SUE
  const { executeInitiativeRoll, getInitiativeBonusBreakdown } = useInitiativeRollWithSUE(characterConfig);

  // Obtém breakdown de bônus para exibição
  const initiativeBreakdown = useMemo(() => getInitiativeBonusBreakdown(), [getInitiativeBonusBreakdown]);

  // Handler para rolagem de iniciativa usando SUE
  const handleInitiativeRoll = useCallback(() => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    // Simula delay de rolagem para feedback visual
    setTimeout(() => {
      const result = executeInitiativeRoll();
      
      setLastResult(result);
      setIsRolling(false);
      onInitiativeRoll?.(result);
    }, 300);
  }, [isRolling, executeInitiativeRoll, onInitiativeRoll]);

  // Filtra apenas bônus de habilidades de trilha
  const attackBonuses = combat.attack.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const damageBonuses = combat.damage.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const criticalBonuses = combat.criticalMargin.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const initiativeBonuses = combat.initiative.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );
  const rdPhysical = damageReduction.physical.breakdown.filter(b => 
    b.type === 'ability' && b.active
  );

  // Se não há bônus de trilha e não temos callback de iniciativa, não mostra nada
  const hasTrackBonuses = 
    attackBonuses.length > 0 || 
    damageBonuses.length > 0 || 
    criticalBonuses.length > 0 ||
    initiativeBonuses.length > 0 ||
    rdPhysical.length > 0;
  
  // Mostra se tem bônus de trilha OU se tem callback de iniciativa
  if (!hasTrackBonuses && !onInitiativeRoll) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Bônus de Ataque */}
      {attackBonuses.length > 0 && (
        <BonusItem
          icon={Crosshair}
          label="Ataque"
          value={attackBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="attack"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Ataque (Trilha)</p>
              {renderBreakdown(attackBonuses)}
            </div>
          }
        />
      )}

      {/* Bônus de Dano */}
      {damageBonuses.length > 0 && (
        <BonusItem
          icon={Swords}
          label="Dano"
          value={
            damageBonuses.some(b => typeof b.value === 'string')
              ? damageBonuses.map(b => `+${b.value}`).join(' ')
              : damageBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)
          }
          variant="damage"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Dano (Trilha)</p>
              {renderBreakdown(damageBonuses)}
            </div>
          }
        />
      )}

      {/* Margem de Ameaça */}
      {criticalBonuses.length > 0 && (
        <BonusItem
          icon={Target}
          label="Crítico"
          value={criticalBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="critical"
          tooltip={
            <div>
              <p className="font-medium mb-1">Margem de Ameaça (Trilha)</p>
              {renderBreakdown(criticalBonuses)}
              <p className="text-muted-foreground text-[10px] mt-1">
                Reduz número necessário para crítico
              </p>
            </div>
          }
        />
      )}

      {/* Iniciativa - Badge de bônus ou botão de rolagem */}
      {initiativeBonuses.length > 0 ? (
        <BonusItem
          icon={Zap}
          label="Iniciativa"
          value={initiativeBonuses.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="default"
          tooltip={
            <div>
              <p className="font-medium mb-1">Bônus de Iniciativa (Trilha)</p>
              {renderBreakdown(initiativeBonuses)}
            </div>
          }
        />
      ) : null}

      {/* Botão de Rolagem de Iniciativa */}
      {onInitiativeRoll && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInitiativeRoll}
                  disabled={isRolling}
                  className={cn(
                    "h-7 px-2.5 gap-1.5 text-xs font-medium",
                    "border-primary/40 hover:border-primary hover:bg-primary/10",
                    isRolling && "animate-pulse"
                  )}
                >
                  <motion.div
                    animate={isRolling ? { rotate: 360 } : {}}
                    transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                  >
                    <Dices className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                  <span>Iniciativa</span>
                  {initiativeBreakdown.total > 0 && (
                    <span className="text-primary font-display">+{initiativeBreakdown.total}</span>
                  )}
                  {initiativeBreakdown.total === 0 && (
                    <span className="text-muted-foreground font-display">+0</span>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Rolar Iniciativa</p>
                <div className="text-xs space-y-0.5 text-muted-foreground">
                  {/* Breakdown de fontes do SUE */}
                  {initiativeBreakdown.sources.map((source, i) => (
                    <p key={i} className={source.type === 'track' ? 'text-primary' : ''}>
                      {source.label}: +{source.value}
                    </p>
                  ))}
                  <p className="text-foreground font-medium border-t border-border pt-1 mt-1">
                    Total: +{initiativeBreakdown.total}
                  </p>
                </div>
                {lastResult && (
                  <div className="pt-1 border-t border-border mt-1">
                    <p className="text-xs">
                      Última rolagem: <span className="font-display text-primary">{lastResult.total}</span>
                    </p>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Redução de Dano */}
      {rdPhysical.length > 0 && (
        <BonusItem
          icon={Shield}
          label="RD"
          value={rdPhysical.reduce((sum, b) => sum + (typeof b.value === 'number' ? b.value : 0), 0)}
          variant="defense"
          tooltip={
            <div>
              <p className="font-medium mb-1">Redução de Dano (Trilha)</p>
              {renderBreakdown(rdPhysical)}
              <p className="text-muted-foreground text-[10px] mt-1">
                Reduz dano físico recebido
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}