/**
 * Hook de lógica para a trilha Conduíte
 * 
 * Gerencia:
 * - Habilidades ativas: Ampliar Ritual, Acelerar Ritual, Anular Ritual
 * - Passivas: Canalizar o Medo (NEX 99%)
 * - Custo de PE e ativação de efeitos
 * 
 * @module tracks/ocultista/useConduiteTrack
 */

import { useMemo, useCallback, useState } from 'react';
import { useToast } from '../../../../hooks/use-toast';
import type { EffectDuration } from '../../../../hooks/useActivatedEffects';

// =====================================================
// TIPOS E CONSTANTES
// =====================================================

/** Habilidade ativa da trilha Conduíte */
export interface ConduiteAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number | 'variable';
  actionType: 'free' | 'reaction';
  shortEffect: string;
  trigger?: string;
  description: string;
}

/** Passiva da trilha Conduíte */
export interface ConduitePassive {
  name: string;
  minNex: number;
  effect: string;
}

/** IDs de efeitos para o SUE */
export const CONDUITE_EFFECT_IDS = {
  AMPLIAR: 'track-ampliar-ritual',
  ACELERAR: 'track-acelerar-ritual',
  ANULAR: 'track-anular-ritual',
} as const;

/** Habilidades ativas da trilha */
export const CONDUITE_ABILITIES: ConduiteAbility[] = [
  {
    id: 'ampliar-ritual',
    name: 'Ampliar Ritual',
    minNex: 10,
    peCost: 2,
    actionType: 'free',
    trigger: 'Ao conjurar ritual',
    description: 'Quando lança um ritual, você pode gastar 2 PE para aumentar seu alcance em um passo ou dobrar a área de efeito.',
    shortEffect: '+1 passo alcance ou 2x área',
  },
  {
    id: 'acelerar-ritual',
    name: 'Acelerar Ritual',
    minNex: 40,
    peCost: 4,
    actionType: 'free',
    trigger: '1x por rodada',
    description: 'Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como ação livre.',
    shortEffect: 'Conjura como ação livre',
  },
  {
    id: 'anular-ritual',
    name: 'Anular Ritual',
    minNex: 65,
    peCost: 'variable',
    actionType: 'reaction',
    trigger: 'Ao ser alvo de ritual',
    description: 'Quando for alvo de um ritual, pode gastar PE igual ao custo do ritual e fazer teste oposto de Ocultismo para anulá-lo.',
    shortEffect: 'Anula ritual inimigo',
  },
];

/** Passivas da trilha */
export const CONDUITE_PASSIVES: ConduitePassive[] = [
  { name: 'Canalizar o Medo', minNex: 99, effect: 'Aprende o ritual Canalizar o Medo' },
];

// =====================================================
// PROPS DO HOOK
// =====================================================

export interface UseConduiteTrackProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useConduiteTrack({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  onActivateEffect,
}: UseConduiteTrackProps) {
  const { toast } = useToast();
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);

  // Verifica se é trilha Conduíte (ID: condutor)
  const isConduite = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('conduit') || trackNorm.includes('conduíte') || trackNorm === 'condutor';
  }, [classTrack]);

  // Habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    return CONDUITE_ABILITIES.filter(a => nex >= a.minNex);
  }, [nex]);

  // Passivas desbloqueadas pelo NEX
  const unlockedPassives = useMemo(() => {
    return CONDUITE_PASSIVES.filter(p => nex >= p.minNex);
  }, [nex]);

  // Verificar se pode pagar o custo de PE
  const canAffordAbility = useCallback((ability: ConduiteAbility): boolean => {
    if (ability.peCost === 'variable') return true;
    return peCurrent >= ability.peCost;
  }, [peCurrent]);

  // Usar habilidade ativa
  const handleUseAbility = useCallback(async (ability: ConduiteAbility) => {
    // Custo variável - apenas notifica
    if (ability.peCost === 'variable') {
      toast({
        title: ability.name,
        description: 'Gaste PE igual ao custo do ritual inimigo e faça teste de Ocultismo.',
      });
      return;
    }

    // Verifica PE suficiente
    if (peCurrent < ability.peCost) {
      toast({ title: 'PE insuficiente', description: 'Você não tem PE suficiente.' });
      return;
    }

    // Feedback visual de ativação
    setActivatingAbility(ability.id);
    await new Promise(r => setTimeout(r, 300));

    // Deduz PE
    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    // Ativa efeito no SUE
    const effectId = ability.id === 'ampliar-ritual'
      ? CONDUITE_EFFECT_IDS.AMPLIAR
      : ability.id === 'acelerar-ritual'
        ? CONDUITE_EFFECT_IDS.ACELERAR
        : CONDUITE_EFFECT_IDS.ANULAR;

    onActivateEffect?.(effectId, ability.name, 'instant');

    // Notifica sucesso
    toast({
      title: `${ability.name} ativado!`,
      description: `${ability.shortEffect}. -${ability.peCost} PE`,
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, toast, onActivateEffect]);

  return {
    // Estado
    isConduite,
    activatingAbility,

    // Dados
    unlockedAbilities,
    unlockedPassives,

    // Ações
    canAffordAbility,
    handleUseAbility,
  };
}
