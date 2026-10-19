/**
 * useBonusSummaryFromSUE - Hook que converte o Sistema Unificado de Efeitos para BonusSummary
 * 
 * Este hook atua como adapter entre o SUE (Sistema Unificado de Efeitos) e a interface
 * BonusSummary usada pelos componentes existentes. Ele elimina a duplicação de cálculo
 * e centraliza todas as fontes de bônus no SUE.
 * 
 * INTEGRAÇÃO SUE HARDENING:
 * - Expõe metadados de processamento via unifiedEffects.hardening
 * - Disponibiliza breakdown de stacking por categoria
 * - Inclui lista de efeitos excluídos para debugging
 */

import { useMemo, useCallback } from 'react';
import { useAccessoryApprovals } from './useAccessoryApprovals';
import { 
  useUnifiedEffects, 
  CharacterStateForEffects, 
  CombatContextInput,
  type UnifiedEffectsResult,
} from './useUnifiedEffects';
import { useDefenseBonuses, DefenseBonusBreakdown, ResistanceBonusBreakdown, ActiveRitualForDefense } from './useDefenseBonuses';
import { useParanormalEffects, ParanormalEffects } from './useParanormalEffects';
import { useClassPowerBonuses, ClassPowerBonusResult } from './useClassPowerBonuses';
import type { ComputedEffects } from '@/lib/unified-effects-engine';
import type { ActiveClassPower, WeaponCategory, ProtectionCategory } from '@/lib/class-powers/types';
import { getWeaponGroupName, getWeaponGroupForWeapon } from '@/lib/constants/weapon-groups';
import type { ClassPowerSubchoice } from './useCharacterBonusSummary';
import { characterPowerInput } from '@/lib/effects/character-power-input';
import type { SavedParanormalPower } from '@/lib/paranormal-powers';

// Re-exporta tipos para compatibilidade com código existente
export type { BonusBreakdown, ConditionalBonus, CombatBonuses, DamageReduction, EffectResistances, SkillBonuses, BonusSummary } from './useCharacterBonusSummary';
export { CONDITIONAL_BONUSES, hasBonusesInCategory } from './useCharacterBonusSummary';

import { 
  BonusBreakdown, 
  ConditionalBonus, 
  CombatBonuses, 
  DamageReduction, 
  EffectResistances, 
  SkillBonuses, 
  BonusSummary,
  CONDITIONAL_BONUSES
} from './useCharacterBonusSummary';

// Props do hook
export interface UseBonusSummaryFromSUEProps {
  characterId?: string;
  // Dados básicos do personagem
  origin: string;
  abilities: string[];
  generalPowers?: Array<{ id: string; name: string; description?: string; category?: string }>;
  paranormalPowers?: Array<{ id: string; name: string; element: string; description: string }>;
  inventory?: Array<{ id?: string; name: string; isEquipped?: boolean; itemType?: string; armorType?: string }>;
  nex: number;
  elementalAffinity?: string | null;
  affinityActive?: boolean;
  activeConditionalBonuses?: string[];
  /** Habilidades confirmadas pelo painel; mantém alternâncias manuais separadas. */
  activatedEffectIds?: string[];
  activeRituals?: ActiveRitualForDefense[];
  skills?: Record<string, number>;
  
  // Atributos
  strength?: number;
  agility?: number;
  vigor?: number;
  intellect?: number;
  presence?: number;
  
  // Classe e trilha
  classId?: string;
  classTrack?: string | null;
  classPowers?: (string | ActiveClassPower)[];
  
  // Trilha de Versatilidade (NEX 50%)
  versatilityTrack?: {
    trackId: string;
    trackName: string;
    abilityId: string;
    abilityName: string;
  } | null;
  
  // Equipamento
  equippedWeaponType?: WeaponCategory;
  equippedProtectionType?: ProtectionCategory;
  // ID e nome da arma equipada (para detecção automática de Especialista em Arma)
  equippedWeaponId?: string;
  equippedWeaponName?: string;
  // Arma leve equipada (para Aparas Precisas)
  isLightMeleeEquipped?: boolean;
  // Defesa base da armadura (para limite de Aparas Precisas)
  armorBaseDefense?: number;
  
  // Estado de combate
  inCombat?: boolean;
  
  // HP/PE atuais para cálculo de condições
  hpCurrent?: number;
  hpMax?: number;
  peCurrent?: number;
  peMax?: number;
  
  // Condições ativas
  activeConditions?: string[];
  
  // Sub-escolhas de poderes de classe (Especialista em Arma, Perito, etc.)
  classPowerChoices?: Record<string, ClassPowerSubchoice>;
}

/**
 * Converte breakdown do SUE para formato BonusBreakdown
 */
function convertToBreakdown(
  source: string,
  value: number | string,
  sourceType: 'origin' | 'ability' | 'general_power' | 'paranormal' | 'equipment' | 'ritual' | 'skill_training',
  conditional?: string
): BonusBreakdown {
  return {
    source,
    value,
    type: sourceType,
    conditional,
    active: true,
  };
}

/**
 * Hook que usa o SUE como fonte única de verdade e converte para BonusSummary
 */
export function useBonusSummaryFromSUE({
  characterId,
  origin,
  abilities,
  generalPowers = [],
  paranormalPowers = [],
  inventory = [],
  nex,
  elementalAffinity,
  affinityActive = false,
  activeConditionalBonuses = [],
  activatedEffectIds = [],
  activeRituals = [],
  skills = {},
  strength = 1,
  agility = 1,
  vigor = 1,
  intellect = 1,
  presence = 1,
  classId,
  classTrack,
  classPowers = [],
  equippedWeaponType,
  equippedProtectionType,
  equippedWeaponId,
  equippedWeaponName,
  isLightMeleeEquipped = false,
  armorBaseDefense,
  inCombat = false,
  hpCurrent = 0,
  hpMax = 0,
  peCurrent = 0,
  peMax = 0,
  activeConditions = [],
  versatilityTrack,
  classPowerChoices = {},
}: UseBonusSummaryFromSUEProps): BonusSummary & { 
  accessories: ReturnType<typeof useAccessoryApprovals>;
  /** Acesso completo ao resultado do SUE (inclui hardening) */
  unifiedEffects: UnifiedEffectsResult;
  /** Atalho para metadados de hardening */
  hardeningMetadata: UnifiedEffectsResult['hardening']['metadata'] | null;
} {
  
  const accessories = useAccessoryApprovals(characterId, inventory);
  // Monta o estado do personagem para o SUE
  const characterState = useMemo<CharacterStateForEffects>(() => ({
    origin,
    classId: classId || '',
    classTrack,
    nex,
    attributes: {
      strength,
      agility,
      vigor,
      intellect,
      presence,
    },
    conditions: activeConditions,
    activeRituals: activeRituals.map(r => ({
      ritualId: r.ritualId,
      ritualName: r.ritualName,
      element: 'conhecimento', // Default - não disponível no ActiveRitualForDefense
      circle: 1, // Default - não disponível no ActiveRitualForDefense
      selectedEnhancements: r.enhancements || [],
    })),
    elementalAffinity,
    affinityActive,
    currentHP: hpCurrent,
    maxHP: hpMax,
    currentPE: peCurrent,
    maxPE: peMax,
    // Novos campos para bônus condicionais
    generalPowers: generalPowers.map(p => p.id),
    abilities,
    classPowers:characterPowerInput(abilities,classId || '',nex,classPowerChoices),
    paranormalPowers:paranormalPowers as SavedParanormalPower[],
    // Disparo Letal só pode ser ativado pelo ataque confirmado; estados legados de toggle
    // não concedem margem nem aparecem como uma segunda entrada de cobrança.
    activeConditionalBonuses: activeConditionalBonuses.filter(id => id !== 'disparo-letal' && id !== 'track-disparo-letal'),
    activatedEffectIds: [...new Set([...activeConditionalBonuses, ...activatedEffectIds]
      .filter(id => id !== 'disparo-letal' && id !== 'track-disparo-letal'))],
    // Trilha de Versatilidade (NEX 50%)
    versatilityTrack: versatilityTrack || undefined,
  }), [
    origin, classTrack, classId, nex,
    strength, agility, vigor, intellect, presence,
    activeConditions, activeRituals,
    hpCurrent, hpMax, peCurrent, peMax,
    elementalAffinity, affinityActive,
    generalPowers, abilities, activeConditionalBonuses, activatedEffectIds,
    versatilityTrack,classPowerChoices,paranormalPowers,
  ]);
  
  // Obtém efeitos unificados do SUE
  const unifiedEffects = useUnifiedEffects(characterState);
  
  // Monta lista de poderes de classe para useDefenseBonuses (Aparas Precisas)
  const safeClassPowers = useMemo(() => classPowers.filter(power => {
    if (typeof power === 'string') return !!power.trim();
    const saved = power as ActiveClassPower & { id?: string; name?: string } | null;
    return !!saved && !!(saved.powerId || saved.id || saved.name);
  }), [classPowers]);
  const classPowersForDefense = useMemo(() => safeClassPowers.map(power => {
    if (typeof power === 'string') return { name: power };
    const saved = power as ActiveClassPower & { id?: string; name?: string };
    const id = saved.id || saved.powerId;
    return { id, name: saved.name || id || '' };
  }), [safeClassPowers]);
  
  // Mantém hooks legados para dados ainda não migrados para o SUE
  const defenseBonuses = useDefenseBonuses({ 
    characterId,
    origin, 
    abilities, 
    generalPowers, 
    classPowers: classPowersForDefense,
    inventory, 
    activeRituals, 
    skills, 
    activeConditionalBonuses,
    intellect,
    agility,
    isLightMeleeEquipped,
    armorBaseDefense,
  });
  
  const paranormalEffects = useParanormalEffects({ 
    powers: paranormalPowers, 
    nex, 
    elementalAffinity: elementalAffinity as any, 
    affinityActive 
  });
  
  const classPowerBonuses = useClassPowerBonuses({
    nex,
    classId: classId || '',
    classTrack,
    attributes: { strength, agility, vigor, intellect, presence },
    classPowers: safeClassPowers,
    abilities,
    equippedWeaponType,
    equippedProtectionType,
    inCombat,
    inInvestigation: false,
    isFavoriteWeapon: false,
  });
  
  // Helper para verificar bônus condicional ativo
  const isConditionalActive = useCallback((id: string) => 
    activeConditionalBonuses.includes(id),
  [activeConditionalBonuses]);
  
  // Converte SUE para BonusSummary
  const bonusSummary = useMemo<BonusSummary>(() => {
    const computed = unifiedEffects.computed;
    // Cada fonte conhecida no motor participa uma única vez do subtotal.
    const normalize=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const modeled=(source:string)=>unifiedEffects.allEffects.some(effect=>normalize(effect.name).includes(normalize(source)));
    const legacyDefense=defenseBonuses.breakdown.filter(b=>b.active && !b.excluded && !modeled(b.source));
    const legacyResistances=defenseBonuses.resistances.breakdown.filter(b=>b.active && !modeled(b.source));
    
    // === COMBATE (do SUE) ===
    const combat: CombatBonuses = {
      attack: {
        total: computed.attack.general + computed.attack.melee + computed.attack.ranged,
        breakdown: computed.attack.breakdown.map(b => 
          convertToBreakdown(b.source, b.value, 'ability', b.conditional)
        ),
      },
      damage: {
        total: computed.damage.general + computed.damage.melee + computed.damage.ranged,
        extraDice: [...computed.damage.extraDice],
        breakdown: computed.damage.breakdown.map(b => 
          convertToBreakdown(b.source, b.value, 'ability', b.conditional)
        ),
      },
      criticalMargin: {
        total: computed.critical.marginBonus,
        breakdown: computed.critical.breakdown
          .filter(b => b.type === 'margin')
          .map(b => convertToBreakdown(b.source, b.value, 'ability')),
      },
      initiative: {
        total: computed.initiative.bonus,
        breakdown: computed.initiative.breakdown.map(b => 
          convertToBreakdown(b.source, b.value, 'ability')
        ),
      },
    };
    
    // === REDUÇÃO DE DANO (do SUE) ===
    // O SUE usa tipos de dano específicos do Ordem (balistico, corte, etc.)
    // O BonusSummary legado usa apenas "physical" e "paranormal" como categorias
    const damageReduction: DamageReduction = {
      physical: {
        total: computed.damageReduction.physical,
        breakdown: computed.damageReduction.breakdown
          .filter(b => !b.type || ['balistico', 'corte', 'impacto', 'perfuracao'].includes(b.type as string))
          .map(b => convertToBreakdown(b.source, b.value, 'ability')),
      },
      paranormal: {
        total: computed.damageReduction.paranormal,
        breakdown: computed.damageReduction.breakdown
          .filter(b => ['mental', 'sangue', 'morte', 'conhecimento', 'energia', 'medo'].includes(b.type as string))
          .map(b => convertToBreakdown(b.source, b.value, 'paranormal')),
      },
    };
    
    // === RESISTÊNCIAS A EFEITOS ===
    // O SUE usa DamageType que não inclui 'poison'/'disease' diretamente
    // Mapeia dos tipos do sistema legado
    const effectResistances: EffectResistances = {
      poison: (computed.damageResistance as Record<string, number>)?.['poison'] || 0,
      disease: (computed.damageResistance as Record<string, number>)?.['disease'] || 0,
      mental: computed.damageResistance.mental || 0,
      breakdown: [],
    };
    
    // === PERÍCIAS (do SUE) ===
    const skillBonuses: SkillBonuses = {};
    for (const [skill, data] of Object.entries(computed.skills)) {
      if (data.bonus !== 0) {
        skillBonuses[skill] = {
          total: data.bonus,
          breakdown: data.sources.map(s => convertToBreakdown(s, data.bonus, 'ability')),
        };
      }
    }
    
    for (const [skill, bonus] of Object.entries(accessories.bonuses)) {
      const current = skillBonuses[skill] ?? { total: 0, breakdown: [] };
      skillBonuses[skill] = { total: current.total + bonus,
        breakdown: [...current.breakdown, convertToBreakdown('Acessório aprovado e em uso (maior bônus de item)', bonus, 'equipment')] };
    }
    // === EFEITOS ESPECIAIS (do SUE) ===
    const special: BonusBreakdown[] = computed.specialEffects.map(e => ({
      source: e.source,
      value: e.effect,
      type: 'ability' as const,
      active: true,
    }));
    
    // === BÔNUS CONDICIONAIS ===
    const conditionalBonuses: ConditionalBonus[] = [];
    
    // Set para rastrear IDs já adicionados e evitar duplicatas
    const addedBonusIds = new Set<string>();
    
    // Converte efeitos toggleáveis do SUE para bônus condicionais
    for (const toggle of computed.toggleableEffects) {
      // Normaliza o ID para evitar duplicatas (ex: track-disparo-letal vs disparo-letal)
      const normalizedId = toggle.id.replace(/^track-/, '');

      // O seletor de ataque apresenta custo e margem; esta chave antiga criava sucesso local falso.
      if (normalizedId === 'disparo-letal') continue;
      
      // Pula se já foi adicionado (evita duplicatas)
      if (addedBonusIds.has(normalizedId) || addedBonusIds.has(toggle.id)) {
        continue;
      }
      
      conditionalBonuses.push({
        id: toggle.id,
        name: toggle.name,
        condition: toggle.condition || '',
        active: toggle.isActive,
        effects: toggle.effects,
        source: 'ability' as const,
      });
      
      // Marca ambos os IDs como adicionados
      addedBonusIds.add(toggle.id);
      addedBonusIds.add(normalizedId);
    }
    
    // Adiciona bônus condicionais do sistema legado (poderes gerais)
    const hasPower = (id: string) => generalPowers.some(p => p.id === id);
    const hasAbility = (name: string) => {
      const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return abilities.some(a => {
        const aLower = typeof a === 'string' ? a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
        return aLower.includes(normalized);
      });
    };
    
    // Poderes gerais condicionais
    if (hasPower('foco-arma')) {
      const isActive = isConditionalActive('foco-arma');
      conditionalBonuses.push({
        id: 'foco-arma',
        name: 'Foco em Arma',
        condition: 'Com arma escolhida',
        active: isActive,
        effects: ['+2 ataque'],
        source: 'general_power',
      });
      if (isActive) {
        combat.attack.total += 2;
        combat.attack.breakdown.push(convertToBreakdown('Foco em Arma', 2, 'general_power', 'com arma escolhida'));
      }
    }
    
    if (hasPower('ataque-poderoso')) {
      const isActive = isConditionalActive('ataque-poderoso');
      conditionalBonuses.push({
        id: 'ataque-poderoso',
        name: 'Ataque Poderoso',
        condition: 'Ação de ataque (-2 ataque)',
        active: isActive,
        effects: ['+5 dano', '-2 ataque'],
        source: 'general_power',
      });
      if (isActive) {
        combat.damage.total += 5;
        combat.attack.total -= 2;
        combat.damage.breakdown.push(convertToBreakdown('Ataque Poderoso', 5, 'general_power', 'por -2 no ataque'));
      }
    }
    
    if (hasPower('fanatico')) {
      const isActive = isConditionalActive('fanatico');
      conditionalBonuses.push({
        id: 'fanatico',
        name: 'Fanático',
        condition: 'HP < 50%',
        active: isActive,
        effects: ['+2 ataque', '+2 dano'],
        source: 'general_power',
      });
      if (isActive) {
        combat.attack.total += 2;
        combat.damage.total += 2;
        combat.attack.breakdown.push(convertToBreakdown('Fanático', 2, 'general_power', 'com menos de 50% PV'));
        combat.damage.breakdown.push(convertToBreakdown('Fanático', 2, 'general_power', 'com menos de 50% PV'));
      }
    }
    
    // === ESPECIALISTA EM ARMA (Poder de Classe do Combatente) ===
    // Regra oficial: +2 ataque e +2 dano com armas do grupo escolhido
    // Poder repetível: pode ter múltiplos grupos escolhidos
    // DETECÇÃO AUTOMÁTICA: verifica se a arma equipada pertence a um grupo escolhido
    const especialistaArmaChoices = Object.entries(classPowerChoices)
      .filter(([_, choice]) => choice.powerId === 'especialista-arma' && choice.choiceType === 'weaponGroup');
    
    if (especialistaArmaChoices.length > 0) {
      // Agrupa todas as escolhas de Especialista em Arma
      const allWeaponGroups: string[] = [];
      for (const [_, choice] of especialistaArmaChoices) {
        allWeaponGroups.push(...choice.chosenValues);
      }
      
      // Detecta grupo da arma equipada (por ID ou nome)
      const equippedWeaponGroup = getWeaponGroupForWeapon(equippedWeaponId || '') 
        || getWeaponGroupForWeapon(equippedWeaponName || '');
      
      // Cria bônus condicional para cada grupo de armas
      for (const weaponGroupId of allWeaponGroups) {
        const groupName = getWeaponGroupName(weaponGroupId);
        const bonusId = `especialista-arma-${weaponGroupId}`;
        
        // Detecção automática: ativa se a arma equipada pertence a este grupo
        const isAutoActive = equippedWeaponGroup === weaponGroupId;
        // Permite override manual via active_conditional_bonuses
        const isManuallyActive = isConditionalActive(bonusId);
        const isActive = isAutoActive || isManuallyActive;
        
        conditionalBonuses.push({
          id: bonusId,
          name: `Especialista em Arma (${groupName})`,
          condition: isAutoActive 
            ? `✓ Arma equipada: ${equippedWeaponName || equippedWeaponId}` 
            : `Com arma do grupo ${groupName}`,
          active: isActive,
          effects: ['+2 ataque', '+2 dano'],
          source: 'ability',
        });
        
        // Aplica bônus quando ativo (automático ou manual)
        if (isActive) {
          combat.attack.total += 2;
          combat.damage.total += 2;
          combat.attack.breakdown.push(convertToBreakdown(`Especialista em Arma (${groupName})`, 2, 'ability', `com ${groupName}`));
          combat.damage.breakdown.push(convertToBreakdown(`Especialista em Arma (${groupName})`, 2, 'ability', `com ${groupName}`));
        }
      }
    }
    
    // Combate Defensivo
    if (hasAbility('combate defensivo')) {
      const isActive = isConditionalActive('combate-defensivo');
      conditionalBonuses.push({
        id: 'combate-defensivo',
        name: 'Combate Defensivo',
        condition: 'Ação agredir (até próximo turno)',
        active: isActive,
        effects: ['+5 Defesa', '-1d20 em ataques'],
        source: 'ability',
      });
      // A penalidade em dados é aplicada na rolagem; não altera o bônus numérico.
    }
    
    // Sentido Tático
    if (hasAbility('sentido tatico')) {
      const isActive = isConditionalActive('sentido-tatico');
      conditionalBonuses.push({
        id: 'sentido-tatico',
        name: 'Sentido Tático',
        condition: '2 PE + ação movimento (cena)',
        active: isActive,
        effects: [`+${intellect} Defesa`, `+${intellect} resistências`],
        source: 'ability',
      });
    }
    
    // Iniciativa Melhorada
    if (hasPower('iniciativa-melhorada')) {
      combat.initiative.total += 5;
      combat.initiative.breakdown.push(convertToBreakdown('Iniciativa Melhorada', 5, 'general_power'));
    }
    
    // Dureza Natural
    if (hasPower('dureza-natural')) {
      damageReduction.physical.total += 2;
      damageReduction.physical.breakdown.push(convertToBreakdown('Dureza Natural', 2, 'general_power'));
    }
    
    // Sangue Resistente
    if (hasPower('sangue-resistente')) {
      damageReduction.paranormal.total += 5;
      damageReduction.paranormal.breakdown.push(convertToBreakdown('Sangue Resistente', 5, 'general_power'));
    }
    
    // Constituição Forte
    if (hasPower('constituicao-forte')) {
      effectResistances.poison = 5;
      effectResistances.disease = 5;
      effectResistances.breakdown.push(convertToBreakdown('Constituição Forte', 5, 'general_power', 'veneno e doença'));
    }
    
    // Resistência Mental
    if (hasPower('resistencia-mental')) {
      effectResistances.mental = 5;
      effectResistances.breakdown.push(convertToBreakdown('Resistência Mental', 5, 'general_power', 'dano mental'));
    }
    
    // === RETORNO ===
    return {
      defense: {
        total: computed.defense.general + legacyDefense.reduce((sum,b)=>sum+b.bonus,0),
        breakdown: [
          ...legacyDefense,
          ...computed.defense.breakdown.map(b => ({
            source: b.source,
            type: 'ability' as const,
            bonus: b.value,
            active: true,
            conditional: b.conditional,
          })),

        ],
      },
      resistances: {
        fortitude: {
          total: computed.resistances.fortitude + legacyResistances.reduce((sum,b)=>sum+b.fortitude,0),
          breakdown: [
            ...legacyResistances.filter(b => b.fortitude > 0),
            ...computed.resistances.breakdown.filter(b => b.resistance === 'fortitude').map(b => ({
              source: b.source,
              type: 'ability' as const,
              fortitude: b.value,
              reflexos: 0,
              vontade: 0,
              active: true,
            })),
          ],
        },
        reflexos: {
          total: computed.resistances.reflexos + legacyResistances.reduce((sum,b)=>sum+b.reflexos,0),
          breakdown: [
            ...legacyResistances.filter(b => b.reflexos > 0),
            ...computed.resistances.breakdown.filter(b => b.resistance === 'reflexos').map(b => ({
              source: b.source,
              type: 'ability' as const,
              fortitude: 0,
              reflexos: b.value,
              vontade: 0,
              active: true,
            })),
          ],
        },
        vontade: {
          total: computed.resistances.vontade + legacyResistances.reduce((sum,b)=>sum+b.vontade,0),
          breakdown: [
            ...legacyResistances.filter(b => b.vontade > 0),
            ...computed.resistances.breakdown.filter(b => b.resistance === 'vontade').map(b => ({
              source: b.source,
              type: 'ability' as const,
              fortitude: 0,
              reflexos: 0,
              vontade: b.value,
              active: true,
            })),
          ],
        },
      },
      combat,
      damageReduction,
      effectResistances,
      skills: skillBonuses,
      special,
      paranormalEffects,
      conditionalBonuses,
      // A trilha já foi consolidada pelo SUE; não repetir o subtotal do hook legado.
      hpBonus: computed.resources.hpBonus,
      peBonus: computed.resources.peBonus,
      // Bônus de movimento (Ligeireza, condições, etc.)
      movementBonus: computed.movement.bonus,
      movementBreakdown: computed.movement.breakdown,
      // Reduções de categoria de equipamento (A Favorita, Técnica Secreta, etc.)
      categoryReductions: computed.inventory.categoryReductions,
      defenseBonuses,
      classPowerBonuses,
    };
  }, [
    unifiedEffects, 
    defenseBonuses, 
    paranormalEffects, 
    classPowerBonuses,
    abilities, 
    generalPowers, 
    isConditionalActive,
    intellect,
    accessories.bonuses,
  ]);
  
  // Retorna BonusSummary + acesso ao SUE com hardening
  return {
    ...bonusSummary,
    accessories,
    unifiedEffects,
    hardeningMetadata: unifiedEffects.hardening?.metadata ?? null,
  };
}
