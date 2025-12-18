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
  getPowerById,
  calculatePowerModifiers,
  ELEMENT_LABELS,
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
      deathThreshold: -10, // Padrão do jogo
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

    // Processa cada poder para efeitos específicos
    for (const power of powers) {
      const fullPower = getPowerById(power.id);
      if (!fullPower) continue;

      const hasAffinity = affinityActive && fullPower.element === elementalAffinity;
      const nexMultiplier = Math.floor(nex / 5); // Multiplicador baseado em NEX

      switch (power.id) {
        // === PODERES DE SANGUE ===
        case 'anatomia-insana':
          // +2 Fortitude (ou +5 com afinidade)
          effects.fortitudeBonus += hasAffinity ? 5 : 2;
          effects.activeEffects.push(`Anatomia Insana: +${hasAffinity ? 5 : 2} Fortitude`);
          break;

        case 'arma-de-sangue':
          // Criar arma de sangue (efeito especial, não numérico)
          effects.activeEffects.push(`Arma de Sangue: Pode criar arma${hasAffinity ? ' (+2 dano)' : ''}`);
          break;

        case 'sangue-de-ferro':
          // +2 PV por NEX (ou +4 com afinidade)
          const hpPerNex = hasAffinity ? 4 : 2;
          effects.hpBonus += hpPerNex * nexMultiplier;
          effects.activeEffects.push(`Sangue de Ferro: +${effects.hpBonus} PV`);
          break;

        case 'sangue-fervente':
          // +1d6 em rituais de Sangue (ou +2d6 com afinidade)
          effects.bloodRitualDamageBonus = hasAffinity ? '+2d6' : '+1d6';
          effects.activeEffects.push(`Sangue Fervente: ${effects.bloodRitualDamageBonus} em rituais de Sangue`);
          break;

        case 'sangue-vivo':
          // Cura 1d6 por rodada (ou 2d6 com afinidade)
          effects.passiveHealingPerRound = hasAffinity ? '2d6' : '1d6';
          effects.activeEffects.push(`Sangue Vivo: Cura ${effects.passiveHealingPerRound}/rodada`);
          break;

        // === PODERES DE MORTE ===
        case 'encarar-a-morte':
          // Morre em -10 PV (ou -20 com afinidade)
          effects.deathThreshold = hasAffinity ? -20 : -10;
          effects.activeEffects.push(`Encarar a Morte: Morre em ${effects.deathThreshold} PV`);
          break;

        case 'escapar-da-morte':
          // 1/sessão não morre (ou 2/sessão com afinidade)
          effects.escapeDeathUses = hasAffinity ? 2 : 1;
          effects.activeEffects.push(`Escapar da Morte: ${effects.escapeDeathUses}x/sessão`);
          break;

        case 'potencial-aprimorado':
          // +1 PE por NEX (ou +2 com afinidade)
          const pePerNex = hasAffinity ? 2 : 1;
          effects.peBonus += pePerNex * nexMultiplier;
          effects.activeEffects.push(`Potencial Aprimorado: +${effects.peBonus} PE`);
          break;

        case 'potencial-reaproveitado':
          // Recupera PE ao matar (efeito especial)
          effects.activeEffects.push(`Potencial Reaproveitado: Recupera PE ao matar${hasAffinity ? ' (dobrado)' : ''}`);
          break;

        case 'surto-temporal':
          // Ação extra 1/cena (ou 2/cena com afinidade)
          effects.temporalSurgeUses = hasAffinity ? 2 : 1;
          effects.activeEffects.push(`Surto Temporal: ${effects.temporalSurgeUses}x/cena`);
          break;

        // === PODERES DE CONHECIMENTO ===
        case 'expansao-de-conhecimento':
          // +5 em perícias de Intelecto escolhidas pelo jogador
          const savedPower = power as SavedParanormalPower;
          const chosenSkills = savedPower.choices?.skills || [];
          if (chosenSkills.length > 0) {
            for (const skillId of chosenSkills) {
              effects.skillBonuses[skillId] = (effects.skillBonuses[skillId] || 0) + 5;
            }
            effects.activeEffects.push(`Expansão de Conhecimento: +5 em ${chosenSkills.join(', ')}`);
          } else {
            // Fallback se ainda não escolheu
            effects.activeEffects.push(`Expansão de Conhecimento: +5 em ${hasAffinity ? '2' : '1'} perícia(s) de Int (escolha pendente)`);
          }
          break;

        case 'percepcao-paranormal':
          // Detectar presença sobrenatural
          effects.activeEffects.push(`Percepção Paranormal: Detecta presenças${hasAffinity ? ' (tipo específico)' : ''}`);
          break;

        case 'precognicao':
          // +2 Defesa e resistências (ou +5 com afinidade)
          const precogBonus = hasAffinity ? 5 : 2;
          effects.defenseBonus += precogBonus;
          effects.fortitudeBonus += precogBonus;
          effects.reflexBonus += precogBonus;
          effects.willpowerBonus += precogBonus;
          effects.activeEffects.push(`Precognição: +${precogBonus} Defesa e resistências`);
          break;

        case 'sensitivo':
          // +5 Diplomacia, Intimidação, Intuição (ou +10 com afinidade)
          const sensitivoBonus = hasAffinity ? 10 : 5;
          effects.skillBonuses['diplomacia'] = (effects.skillBonuses['diplomacia'] || 0) + sensitivoBonus;
          effects.skillBonuses['intimidação'] = (effects.skillBonuses['intimidação'] || 0) + sensitivoBonus;
          effects.skillBonuses['intuição'] = (effects.skillBonuses['intuição'] || 0) + sensitivoBonus;
          effects.activeEffects.push(`Sensitivo: +${sensitivoBonus} Diplomacia, Intimidação, Intuição`);
          break;

        case 'visao-do-oculto':
          // +5 Percepção (ou +10 com afinidade)
          const visaoBonus = hasAffinity ? 10 : 5;
          effects.skillBonuses['percepção'] = (effects.skillBonuses['percepção'] || 0) + visaoBonus;
          effects.activeEffects.push(`Visão do Oculto: +${visaoBonus} Percepção`);
          break;

        // === PODERES DE ENERGIA ===
        case 'afortunado':
          // +2 testes de perícia (ou +5 com afinidade)
          // Aplicado globalmente em perícias
          const afortunadoBonus = hasAffinity ? 5 : 2;
          effects.activeEffects.push(`Afortunado: +${afortunadoBonus} em testes de perícia`);
          break;

        case 'campo-protetor':
          // +5 Defesa na esquiva (ou +10 com afinidade)
          const campoBonus = hasAffinity ? 10 : 5;
          effects.defenseBonus += campoBonus;
          effects.activeEffects.push(`Campo Protetor: +${campoBonus} Defesa (esquiva)`);
          break;

        case 'causalidade-fortuita':
          // Chance de efeito extra
          effects.activeEffects.push(`Causalidade Fortuita: Chance de efeito extra${hasAffinity ? ' (dobrada)' : ''}`);
          break;

        case 'golpe-de-sorte':
          // +1 margem de ameaça (ou +2 com afinidade)
          effects.threatMarginBonus += hasAffinity ? 2 : 1;
          effects.activeEffects.push(`Golpe de Sorte: +${effects.threatMarginBonus} margem de ameaça`);
          break;

        case 'manipular-entropia':
          // Rolar 2d20 1/cena (ou 3d20 com afinidade)
          effects.canRerollOnes = true;
          effects.rerollDiceCount = hasAffinity ? 3 : 2;
          effects.activeEffects.push(`Manipular Entropia: Rolar ${effects.rerollDiceCount}d20 1x/cena`);
          break;

        // === PODERES GENÉRICOS ===
        case 'aprender-ritual':
          effects.activeEffects.push('Aprender Ritual: +1 ritual conhecido');
          break;

        case 'resistir-a-elemento':
          // Resistência 5 a um elemento escolhido pelo jogador
          const resistPower = power as SavedParanormalPower;
          const resistElement = resistPower.choices?.resistElement;
          if (resistElement) {
            effects.elementalResistances[resistElement] = (effects.elementalResistances[resistElement] || 0) + 5;
            effects.activeEffects.push(`Resistir a Elemento: Resistência 5 a ${ELEMENT_LABELS[resistElement]}`);
          } else {
            effects.activeEffects.push('Resistir a Elemento: Resistência 5 a 1 elemento (escolha pendente)');
          }
          break;
      }
    }

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
