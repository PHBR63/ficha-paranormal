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
  perRound?: boolean; // Se true, só pode ser usada 1x por rodada
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
    description: 'Quando faz a ação Mirar, você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque até o final de seu próximo turno.',
    shortEffect: '+2 margem de ameaça no próximo ataque após Mirar',
    effectId: TRACK_EFFECT_IDS.DISPARO_LETAL,
    effectDuration: 'next-turn', // Até o final do próximo turno
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
  // Tracking de uso por rodada (opcional - usa estado local se não fornecido)
  isAbilityUsedThisRound?: (abilityId: string) => boolean;
  markAbilityUsedThisRound?: (abilityId: string) => void;
  /** Callback para rastrear PE gasto na rodada */
  onTrackPESpent?: (abilityName: string, cost: number) => void;
  /** Trilha de Versatilidade do personagem (se houver) */
  versatilityTrack?: {
    trackId: string;
    abilityId: string;
  } | null;
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
  isAbilityUsedThisRound,
  markAbilityUsedThisRound,
  onTrackPESpent,
  versatilityTrack,
}: UseAtiradorDeEliteTrackProps) {
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [showManeuverDrawer, setShowManeuverDrawer] = useState(false);
  
  // Estado local para tracking de rodada (fallback quando não há tracking externo)
  const [localUsedAbilities, setLocalUsedAbilities] = useState<Set<string>>(new Set());

  // Verifica se é Atirador de Elite (principal ou via Versatilidade)
  const isAtiradorEliteBase = useMemo(() => 
    classTrack === 'Atirador de Elite' || classTrack === 'atirador-elite',
    [classTrack]
  );

  // Detecta se tem habilidade de Atirador de Elite via Versatilidade
  const hasAtiradorFromVersatility = versatilityTrack?.trackId === 'atirador-elite';

  // É Atirador de Elite se for trilha principal ou via Versatilidade
  const isAtiradorElite = isAtiradorEliteBase || hasAtiradorFromVersatility;

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

  // Verifica se habilidade já foi usada nesta rodada
  const isUsedThisRound = useCallback((abilityId: string): boolean => {
    if (isAbilityUsedThisRound) return isAbilityUsedThisRound(abilityId);
    return localUsedAbilities.has(abilityId);
  }, [isAbilityUsedThisRound, localUsedAbilities]);

  // Marca habilidade como usada nesta rodada
  const markUsedThisRound = useCallback((abilityId: string): void => {
    if (markAbilityUsedThisRound) {
      markAbilityUsedThisRound(abilityId);
    } else {
      setLocalUsedAbilities(prev => new Set(prev).add(abilityId));
    }
  }, [markAbilityUsedThisRound]);

  // Reset do tracking local (para nova rodada)
  const resetRoundUsage = useCallback((): void => {
    if (!isAbilityUsedThisRound) {
      setLocalUsedAbilities(new Set());
    }
  }, [isAbilityUsedThisRound]);

  // Handler para usar habilidade ativa
  const handleUseAbility = useCallback(async (ability: AtiradorAbility) => {
    if (ability.isPassive) return;

    // O ataque confirmado é a única entrada para custo, margem e histórico de Disparo Letal.
    if (ability.id === 'disparo-letal') {
      toast.info('Use Disparo Letal no ataque', {
        description: 'Selecione a arma em Combate, confirme Mirar e ative o benefício no ataque.',
      });
      return;
    }
    
    // Verificação de uso por rodada (para habilidades com perRound: true)
    if (ability.perRound && isUsedThisRound(ability.id)) {
      toast.error(`${ability.name} já usado nesta rodada`, {
        description: 'Esta habilidade só pode ser usada uma vez por rodada.',
      });
      return;
    }
    
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
      onTrackPESpent?.(ability.name, ability.peCost);

      // Marca como usado se for habilidade por rodada
      if (ability.perRound) {
        markUsedThisRound(ability.id);
      }

      if (onActivateEffect && ability.effectId && ability.effectDuration) {
        onActivateEffect(ability.effectId, ability.name, ability.effectDuration);
      }

      toast.success(`${ability.name} ativado!`, {
        description: ability.shortEffect,
      });
    } finally {
      setTimeout(() => setActivatingAbility(null), 300);
    }
  }, [peCurrent, onPEChange, onActivateEffect, isUsedThisRound, markUsedThisRound, onTrackPESpent]);

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
    onTrackPESpent?.(ability.name, ability.peCost);

    if (onActivateEffect && ability.effectId) {
      onActivateEffect(ability.effectId, `Disparo Impactante: ${manobra.name}`, 'instant', { manobra: manobra.id });
    }

    toast.success(`Disparo Impactante: ${manobra.name}`, {
      description: `Você executa a manobra ${manobra.name} com seu disparo!`,
    });

    setShowManeuverDrawer(false);
  }, [peCurrent, onPEChange, onActivateEffect, onTrackPESpent]);

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
    
    // Tracking de rodada
    isUsedThisRound,
    resetRoundUsage,
    hasLocalTracking: !isAbilityUsedThisRound, // True se usa estado local
    
    // Helpers
    canAffordAbility: (ability: AtiradorAbility) => peCurrent >= ability.peCost,
    canUseAbility: (ability: AtiradorAbility) => {
      if (ability.isPassive) return false;
      if (ability.perRound && isUsedThisRound(ability.id)) return false;
      return peCurrent >= ability.peCost;
    },
  };
}
