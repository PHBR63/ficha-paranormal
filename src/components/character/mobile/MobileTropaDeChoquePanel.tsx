/**
 * MobileTropaDeChoquePanel - Versão mobile do painel Tropa de Choque
 * 
 * REFATORADO PARA CONSUMIR DADOS DO SUE (Sistema Unificado de Efeitos)
 * Otimizado para telas pequenas
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldAlert, 
  Heart, 
  Skull,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import type { ComputedEffects } from '@/lib/unified-effects-engine';

// =====================================================
// Definições de habilidades
// =====================================================

// Habilidades ativadas (reações)
const TROPA_ABILITIES = [
  {
    id: 'cai-dentro',
    name: 'Cai Dentro',
    minNex: 40,
    peCost: 1,
    shortEffect: 'Inimigo ataca você',
    icon: ShieldAlert,
    usesVigorDT: true,
    progressionNex: undefined as number | undefined,
  },
  {
    id: 'duro-de-matar',
    name: 'Duro de Matar',
    minNex: 65,
    peCost: 2,
    shortEffect: 'Dano ÷ 2',
    icon: Heart,
    usesVigorDT: false,
    progressionNex: 85,
  },
];

// Passivos/Condicionais
const PASSIVE_ABILITIES = [
  {
    id: 'casca-grossa',
    name: 'Casca Grossa',
    minNex: 10,
    effect: '+1 PV por 5% NEX',
    icon: Shield,
  },
  {
    id: 'inquebravel',
    name: 'Inquebrável',
    minNex: 99,
    effect: '+5 Def, RD 5 (machucado)',
    icon: Skull,
  },
] as const;

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration';

// =====================================================
// Props do Componente
// =====================================================

interface MobileTropaDeChoquePanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  vigor: number;
  hpCurrent: number;
  hpMax: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  /** Dados consolidados do SUE (opcional - se fornecido, usa dados do SUE) */
  computedEffects?: ComputedEffects;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
}

// IDs de efeitos da Tropa de Choque
const TROPA_EFFECT_IDS = {
  CAI_DENTRO: 'track-cai-dentro',
  DURO_DE_MATAR: 'track-duro-matar',
} as const;

// =====================================================
// Componente Principal
// =====================================================

export function MobileTropaDeChoquePanel({
  classTrack,
  nex,
  peCurrent,
  vigor,
  hpCurrent,
  hpMax,
  onPEChange,
  className,
  computedEffects,
  onActivateEffect,
  isEffectActive,
}: MobileTropaDeChoquePanelProps) {
  // ===== VERIFICAÇÕES DE TRILHA =====
  const isTropaDeChoque = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('tropa') || normalized.includes('choque') || 
           classTrack === 'tropa-choque';
  }, [classTrack]);

  // ===== DADOS DO SUE (se disponível) =====
  
  // Bônus de Inquebrável do SUE
  const sueWoundedBonuses = computedEffects?.combatAdvanced?.conditionalBonuses?.whenWounded;
  const sueDyingBonuses = computedEffects?.combatAdvanced?.conditionalBonuses?.whenDying;
  
  // Taunt (Cai Dentro) do SUE
  const sueTaunt = computedEffects?.combatAdvanced?.taunt;

  // ===== HABILIDADES DESBLOQUEADAS =====
  const unlockedActiveAbilities = useMemo(() => 
    TROPA_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  const unlockedPassiveAbilities = useMemo(() =>
    PASSIVE_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  // ===== CÁLCULOS DERIVADOS =====
  
  // DT baseada em Vigor
  const vigorDT = useMemo(() => 10 + vigor, [vigor]);

  // Verifica se está machucado
  const isWounded = useMemo(() => hpCurrent < (hpMax / 2), [hpCurrent, hpMax]);

  // Calcula bônus de PV
  const cascaGrossaHP = useMemo(() => Math.floor(nex / 5), [nex]);
  
  // ===== BÔNUS CONDICIONAIS DO SUE =====
  
  // Bônus de defesa e RD quando machucado (do SUE ou fallback)
  const woundedDefenseBonus = useMemo(() => {
    if (sueWoundedBonuses && isWounded) {
      return sueWoundedBonuses.defenseBonus ?? 0;
    }
    return (nex >= 99 && isWounded) ? 5 : 0;
  }, [sueWoundedBonuses, isWounded, nex]);

  const woundedDamageResistance = useMemo(() => {
    if (sueWoundedBonuses && isWounded) {
      return sueWoundedBonuses.damageReduction ?? 0;
    }
    return (nex >= 99 && isWounded) ? 5 : 0;
  }, [sueWoundedBonuses, isWounded, nex]);

  // ===== HANDLERS =====
  
  const handleUseAbility = useCallback((abilityId: string, peCost: number, abilityName: string) => {
    if (peCurrent < peCost) {
      toast({
        title: "PE Insuficiente",
        description: `Precisa de ${peCost} PE.`,
        variant: "destructive",
      });
      return;
    }

    onPEChange(peCurrent - peCost);

    if (abilityId === 'cai-dentro') {
      onActivateEffect?.(TROPA_EFFECT_IDS.CAI_DENTRO, 'Cai Dentro', 'instant', { dt: vigorDT });
      toast({
        title: "Cai Dentro!",
        description: `DT ${vigorDT} (Vontade)`,
      });
    } else if (abilityId === 'duro-de-matar') {
      onActivateEffect?.(TROPA_EFFECT_IDS.DURO_DE_MATAR, 'Duro de Matar', 'instant');
      toast({
        title: "Duro de Matar!",
        description: `Dano reduzido à metade.`,
      });
    }
  }, [peCurrent, onPEChange, vigorDT, onActivateEffect]);

  // ===== RENDER CONDICIONAL =====
  
  if (!isTropaDeChoque || (unlockedActiveAbilities.length === 0 && unlockedPassiveAbilities.length === 0)) {
    return null;
  }

  return (
    <MobileCollapsibleSection
      title="Tropa de Choque"
      icon={<Shield className="w-4 h-4 text-primary" />}
      badge={`${unlockedActiveAbilities.length + unlockedPassiveAbilities.length}`}
      defaultOpen={true}
      className={className}
    >
      <div className="space-y-3">
        {/* Bônus ativos do SUE (quando machucado) */}
        {(woundedDefenseBonus > 0 || woundedDamageResistance > 0) && (
          <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 space-y-1">
            <p className="text-[10px] font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Inquebrável Ativo
            </p>
            <div className="flex gap-1 flex-wrap">
              {woundedDefenseBonus > 0 && (
                <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                  +{woundedDefenseBonus} Def
                </Badge>
              )}
              {woundedDamageResistance > 0 && (
                <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                  RD {woundedDamageResistance}
                </Badge>
              )}
              {sueDyingBonuses?.canAct && (
                <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">
                  Age morrendo
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Passivos */}
        {unlockedPassiveAbilities.map((ability) => {
          const Icon = ability.icon;
          const isInquebravel = ability.id === 'inquebravel';
          
          return (
            <div
              key={ability.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-md border border-border/50",
                isInquebravel && isWounded 
                  ? "bg-destructive/10 border-destructive/30" 
                  : "bg-muted/30"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 shrink-0",
                isInquebravel && isWounded ? "text-destructive" : "text-primary"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">{ability.name}</span>
                  {ability.id === 'casca-grossa' && (
                    <Badge variant="outline" className="text-[9px] text-primary">
                      +{cascaGrossaHP} PV
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-primary">{ability.effect}</p>
              </div>
              {isInquebravel && isWounded ? (
                <Badge variant="destructive" className="text-[9px] shrink-0">
                  ATIVO
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  Passivo
                </Badge>
              )}
            </div>
          );
        })}

        {/* Reações */}
        {unlockedActiveAbilities.map((ability) => {
          const Icon = ability.icon;
          const canAfford = peCurrent >= ability.peCost;
          const hasProgression = ability.progressionNex && nex >= ability.progressionNex;

          return (
            <motion.div
              key={ability.id}
              className="flex items-center gap-2 p-2 rounded-md border border-border/50 bg-card"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-medium">{ability.name}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {ability.peCost} PE
                  </Badge>
                  {hasProgression && (
                    <Badge variant="outline" className="text-[9px] text-energy border-energy/30">
                      <Zap className="w-2 h-2" />
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {ability.shortEffect}
                  {ability.usesVigorDT && ` (DT ${vigorDT})`}
                </p>
              </div>
              <Button
                size="sm"
                variant="default"
                disabled={!canAfford}
                onClick={() => handleUseAbility(ability.id, ability.peCost, ability.name)}
                className="h-7 text-[10px] px-2 shrink-0"
              >
                Usar
              </Button>
            </motion.div>
          );
        })}
      </div>
    </MobileCollapsibleSection>
  );
}
