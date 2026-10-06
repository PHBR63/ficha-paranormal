import { getParanormalPowerEffects } from '@/lib/effects/paranormal-powers-effects-adapter';
/**
 * Hook useParanormalEffects
 * Calcula automaticamente os bônus de poderes paranormais nos stats do personagem
 * 
 * Baseado nos 22 poderes oficiais do livro (páginas 114-116)
 */

import { useMemo } from 'react';
import {
  ParanormalPower,
  ParanormalElement,
  SavedParanormalPower,
  calculatePowerModifiers,
} from '@/lib/paranormal-powers';

export interface ParanormalEffects {
  // Bônus de HP (Sangue de Ferro)
  hpBonus: number;
  // Bônus de PE (Potencial Aprimorado)
  peBonus: number;
  // Bônus de Defesa (Precognição, Campo Protetor)
  defenseBonus: number;
  // Bônus de resistência a testes (Precognição, Anatomia Insana)
  fortitudeBonus: number;
  reflexBonus: number;
  willpowerBonus: number;
  // Bônus de perícias
  skillBonuses: Record<string, number>;
  // Margem de ameaça (Golpe de Sorte)
  threatMarginBonus: number;
  // Resistências elementais (Resistir a Elemento)
  elementalResistances: Record<string, number>;
  // Morte adiada (Encarar a Morte)
  deathThreshold: number;
  // Usos de Escapar da Morte
  escapeDeathUses: number;
  // Usos de Surto Temporal
  temporalSurgeUses: number;
  // Pode rolar novamente 1s (Manipular Entropia)
  canRerollOnes: boolean;
  rerollDiceCount: number;
  // Bônus de dano em rituais de Sangue (Sangue Fervente)
  bloodRitualDamageBonus: string;
  // Cura passiva por rodada (Sangue Vivo)
  passiveHealingPerRound: string;
  // Lista de efeitos ativos formatados para exibição
  activeEffects: string[];
  // Modificadores raw para uso em cálculos
  rawModifiers: Record<string, number>;
}

interface UseParanormalEffectsParams {
  powers: ParanormalPower[] | SavedParanormalPower[] | Array<{ id: string; name: string; element: string; description: string; choices?: SavedParanormalPower['choices'] }>;
  nex: number;
  elementalAffinity?: ParanormalElement | null;
  affinityActive?: boolean;
}

export function useParanormalEffects({
  powers,
  nex,
  elementalAffinity,
  affinityActive = false,
}: UseParanormalEffectsParams): ParanormalEffects {
  return useMemo(() => {
    // Valores padrão
    const effects: ParanormalEffects = {
      hpBonus: 0,
      peBonus: 0,
      defenseBonus: 0,
      fortitudeBonus: 0,
      reflexBonus: 0,
      willpowerBonus: 0,
      skillBonuses: {},
      threatMarginBonus: 0,
      elementalResistances: {},
      deathThreshold: 0, // O livro usa PV zero e Morrendo, sem limiar negativo.
      escapeDeathUses: 0,
      temporalSurgeUses: 0,
      canRerollOnes: false,
      rerollDiceCount: 0,
      bloodRitualDamageBonus: '',
      passiveHealingPerRound: '',
      activeEffects: [],
      rawModifiers: {},
    };

    if (!powers || powers.length === 0) {
      return effects;
    }

    // Calcula modificadores usando a função do lib
    const powerIds = powers.map(p => p.id);
    effects.rawModifiers = calculatePowerModifiers(
      powerIds,
      nex,
      affinityActive,
      elementalAffinity || undefined
    );

    const unified = getParanormalPowerEffects(powers as SavedParanormalPower[], nex, elementalAffinity, affinityActive);
    for (const effect of unified) {
      const m = effect.mechanics;
      effects.hpBonus += m.hpBonus ?? 0;
      effects.peBonus += m.peBonus ?? 0;
      effects.defenseBonus += m.defenseBonus ?? 0;
      effects.fortitudeBonus += m.fortitudeBonus ?? 0;
      effects.reflexBonus += m.reflexosBonus ?? 0;
      effects.willpowerBonus += m.vontadeBonus ?? 0;
      effects.threatMarginBonus += m.criticalMarginBonus ?? 0;
      for (const [skill, value] of Object.entries(m.skillBonus ?? {})) if (typeof value === 'number') effects.skillBonuses[skill] = (effects.skillBonuses[skill] ?? 0) + value;
      for (const [element, value] of Object.entries(m.damageResistance ?? {})) if (typeof value === 'number') effects.elementalResistances[element] = Math.max(effects.elementalResistances[element] ?? 0, value);
      effects.activeEffects.push(effect.description, ...(m.specialEffects ?? []));
    }
    // Gatilhos, usos por cena e rerrolagens exigem contexto; não publicar cura/ações como bônus permanentes.
    return effects;
  }, [powers, nex, elementalAffinity, affinityActive]);
}

/**
 * Aplica os bônus de poderes paranormais aos stats base
 */
export function applyParanormalBonuses(
  baseStats: {
    hp_max: number;
    pe_max: number;
    defense: number;
  },
  effects: ParanormalEffects
): {
  hp_max: number;
  pe_max: number;
  defense: number;
} {
  return {
    hp_max: baseStats.hp_max + effects.hpBonus,
    pe_max: baseStats.pe_max + effects.peBonus,
    defense: baseStats.defense + effects.defenseBonus,
  };
}
