/**
 * useAtiradorDeEliteTrack - Hook de lógica para a trilha Atirador de Elite
 * 
 * Encapsula toda a lógica de habilidades da trilha:
 * - NEX 10%: Mira de Elite (passiva) - Proficiência balas longas + INT em dano
 * - NEX 40%: Disparo Letal (1 PE) - +2 margem de ameaça ao mirar
 * - NEX 65%: Disparo Impactante (2 PE) - Manobra ao invés de dano
 * - NEX 99%: Atirar para Matar (passiva) - Crítico = dano máximo
 * 
 * @module tracks/especialista/useAtiradorDeEliteTrack
 */

import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration, type ComputedEffects } from '@/hooks';

// =====================================================
// Tipos e Constantes
// =====================================================

/** Manobras disponíveis para Disparo Impactante */
export const MANOBRAS_IMPACTANTE = [
  { id: 'derrubar', name: 'Derrubar', description: 'Derruba o alvo' },
  { id: 'desarmar', name: 'Desarmar', description: 'Desarma o alvo' },
  { id: 'empurrar', name: 'Empurrar', description: 'Empurra o alvo' },
  { id: 'quebrar', name: 'Quebrar', description: 'Quebra item do alvo' },
] as const;

export type ManeuverType = typeof MANOBRAS_IMPACTANTE[number];

/** Definição de habilidade da trilha */
export interface AtiradorAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  isPassive: boolean;
  description: string;
  shortEffect: string;
  effectId?: string;
  effectDuration?: EffectDuration;
}

/** Habilidades do Atirador de Elite */
export const ATIRADOR_ABILITIES: AtiradorAbility[] = [
  {
    id: 'mira-de-elite',
    name: 'Mira de Elite',
    minNex: 10,
    peCost: 0,
    isPassive: true,
    description: 'Proficiência com armas de fogo que usam balas longas e soma Intelecto em rolagens de dano com essas armas.',
    shortEffect: 'Proficiência balas longas + INT em dano',
    effectId: TRACK_EFFECT_IDS.MIRA_DE_ELITE,
  },
  {
    id: 'disparo-letal',
    name: 'Disparo Letal',
    minNex: 40,
    peCost: 1,
    isPassive: false,
    description: 'Quando faz a ação mirar, você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque até o final de seu próximo turno.',
    shortEffect: '+2 margem de ameaça (ao mirar)',
    effectId: TRACK_EFFECT_IDS.DISPARO_LETAL,
    effectDuration: 'next-attack',
  },
  {
    id: 'disparo-impactante',
    name: 'Disparo Impactante',
    minNex: 65,
    peCost: 2,
    isPassive: false,
    description: 'Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre derrubar, desarmar, empurrar ou quebrar.',
    shortEffect: 'Manobra ao invés de dano',
    effectId: TRACK_EFFECT_IDS.DISPARO_IMPACTANTE,
    effectDuration: 'instant',
  },
  {
    id: 'atirar-para-matar',
    name: 'Atirar para Matar',
    minNex: 99,
    peCost: 0,
    isPassive: true,
    description: 'Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar dados.',
    shortEffect: 'Crítico = dano máximo',
    effectId: TRACK_EFFECT_IDS.ATIRAR_PARA_MATAR,
  },
];

// =====================================================
// Props do Hook
// =====================================================

export interface UseAtiradorDeEliteTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  computedEffects?: ComputedEffects;
}

// =====================================================
// Hook Principal
// =====================================================

export function useAtiradorDeEliteTrack({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
  onActivateEffect,
  isEffectActive,
  computedEffects,
}: UseAtiradorDeEliteTrackProps) {
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [showManeuverDrawer, setShowManeuverDrawer] = useState(false);

  // Verifica se é Atirador de Elite (suporta múltiplos formatos de ID)
  const isAtiradorElite = useMemo(() => 
    classTrack === 'Atirador de Elite' || classTrack === 'atirador-elite',
    [classTrack]
  );

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => 
    ATIRADOR_ABILITIES.filter(ability => nex >= ability.minNex),
    [nex]
  );

  // Dados do SUE para exibir bônus consolidados
  const sueShooterData = useMemo(() => {
    if (!computedEffects) return null;
    return {
      criticalMarginBonus: computedEffects.critical.marginBonus,
      hasMaxDamageOnCrit: computedEffects.combatAdvanced.maximumDamageOnCrit.enabled,
      damageBonus: computedEffects.damage.ranged,
    };
  }, [computedEffects]);

  // Handler para usar habilidade ativa
  const handleUseAbility = useCallback(async (ability: AtiradorAbility) => {
    if (ability.isPassive) return;
    
    if (peCurrent < ability.peCost) {
      toast.error(`PE insuficiente para ${ability.name}`, {
        description: `Necessário: ${ability.peCost} PE | Atual: ${peCurrent} PE`,
      });
      return;
    }

    // Disparo Impactante abre drawer de escolha de manobra
    if (ability.id === 'disparo-impactante') {
      setShowManeuverDrawer(true);
      return;
    }

    setActivatingAbility(ability.id);

    try {
      onPEChange(peCurrent - ability.peCost);

      if (onActivateEffect && ability.effectId && ability.effectDuration) {
        onActivateEffect(ability.effectId, ability.name, ability.effectDuration);
      }

      toast.success(`${ability.name} ativado!`, {
        description: ability.shortEffect,
      });
    } finally {
      setTimeout(() => setActivatingAbility(null), 300);
    }
  }, [peCurrent, onPEChange, onActivateEffect]);

  // Handler para escolher manobra do Disparo Impactante
  const handleManeuverChoice = useCallback((manobra: ManeuverType) => {
    const ability = ATIRADOR_ABILITIES.find(a => a.id === 'disparo-impactante')!;
    
    if (peCurrent < ability.peCost) {
      toast.error('PE insuficiente', {
        description: `Necessário: ${ability.peCost} PE`,
      });
      setShowManeuverDrawer(false);
      return;
    }

    onPEChange(peCurrent - ability.peCost);

    if (onActivateEffect && ability.effectId) {
      onActivateEffect(ability.effectId, `Disparo Impactante: ${manobra.name}`, 'instant', { manobra: manobra.id });
    }

    toast.success(`Disparo Impactante: ${manobra.name}`, {
      description: `Você executa a manobra ${manobra.name} com seu disparo!`,
    });

    setShowManeuverDrawer(false);
  }, [peCurrent, onPEChange, onActivateEffect]);

  return {
    // Estado
    isAtiradorElite,
    unlockedAbilities,
    activatingAbility,
    showManeuverDrawer,
    setShowManeuverDrawer,
    
    // Dados derivados
    intellect,
    sueShooterData,
    
    // Handlers
    handleUseAbility,
    handleManeuverChoice,
    
    // Helpers
    canAffordAbility: (ability: AtiradorAbility) => peCurrent >= ability.peCost,
  };
}
