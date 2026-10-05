/**
 * Poderes de Trilha Convertidos para UnifiedClassPower
 * Ordem Paranormal RPG v1.3
 * 
 * Este arquivo converte as habilidades de trilha definidas em track-combatente.ts,
 * track-especialista.ts e track-ocultista.ts para o formato UnifiedClassPower,
 * permitindo integração com o power-registry e class-power-effects-adapter.
 * 
 * As trilhas originais continuam em seus arquivos para compatibilidade com
 * track-registry.ts e track-effects-adapter.ts.
 */

import type { UnifiedClassPower, PowerMechanics, ClassId, Skill } from './types';
import { COMBATENTE_TRACKS } from './track-combatente';
import { ESPECIALISTA_TRACKS } from './track-especialista';
import { OCULTISTA_TRACKS } from './track-ocultista';
import type { UnifiedTrack, UnifiedTrackAbility, TrackAbilityMechanics } from './track-types';

/**
 * Converte uma habilidade de trilha para UnifiedClassPower
 */
function convertTrackAbilityToPower(
  ability: UnifiedTrackAbility,
  track: UnifiedTrack
): UnifiedClassPower {
  // Converte TrackAbilityMechanics para PowerMechanics
  const baseMechanics = ability.effects.base;
  
  const powerMechanics: PowerMechanics = {
    kind: baseMechanics.kind as PowerMechanics['kind'],
    
    // Ativação
    activation: baseMechanics.activation ? {
      cost: baseMechanics.activation.cost,
      action: baseMechanics.activation.action === 'varies' 
        ? 'standard' 
        : baseMechanics.activation.action,
      perScene: baseMechanics.activation.perScene,
      perRound: baseMechanics.activation.perRound,
    } : undefined,
    
    // Combate
    criticalBonus: baseMechanics.criticalBonus ? {
      marginBonus: baseMechanics.criticalBonus.marginBonus,
      multiplierBonus: baseMechanics.criticalBonus.multiplierBonus,
      conditions: baseMechanics.criticalBonus.conditions ? {
        weaponType: baseMechanics.criticalBonus.conditions.weaponType as any
      } : undefined
    } : undefined,
    
    damageBonus: baseMechanics.damageBonus ? {
      value: baseMechanics.damageBonus.value,
      attribute: baseMechanics.damageBonus.attribute,
      extraDice: baseMechanics.damageBonus.extraDice ? 
        `${baseMechanics.damageBonus.extraDice.count}${baseMechanics.damageBonus.extraDice.dieType || 'd6'}` : 
        undefined,
      conditions: baseMechanics.damageBonus.conditions ? {
        weaponType: baseMechanics.damageBonus.conditions.weaponType as any
      } : undefined
    } : undefined,
    
    // Redução de categoria
    categoryReduction: baseMechanics.categoryReduction,
    
    // Técnicas (Aniquilador)
    techniqueEffects: baseMechanics.techniqueEffects,
    
    // Liderança (Comandante de Campo)
    leadership: baseMechanics.leadership,
    
    // Ataque Furtivo (Infiltrador)
    sneakAttack: baseMechanics.sneakAttack,
    
    // Cura (Médico de Campo)
    healing: baseMechanics.healing,
    
    // Modificador de Ritual (Conduíte)
    ritualModifier: baseMechanics.ritualModifier,
    
    // Contra-mágica
    counterSpell: baseMechanics.counterSpell ? {
      costMatchesTarget: baseMechanics.counterSpell.costMatchesTarget,
      testSkill: baseMechanics.counterSpell.testSkill as Skill,
      testType: baseMechanics.counterSpell.testType as 'opposed' | 'fixed'
    } : undefined,
    
    // Ritual concedido
    grantsRitual: baseMechanics.grantsRitual,
    
    // PE temporário
    temporaryPE: baseMechanics.temporaryPE,
    
    // Bônus em perícias
    skillBonus: baseMechanics.skillBonus,
    
    // Iniciativa
    initiativeBonus: baseMechanics.initiativeBonus,
    
    // PV por NEX
    hpPerNexPercent: baseMechanics.hpPerNexPercent,
    
    // Bloqueio com Vigor
    blockVigorBonus: baseMechanics.blockVigorBonus,
    
    // Resistência paranormal
    paranormalResistance: baseMechanics.paranormalResistance,
    
    // Bônus DT ritual
    ritualDTBonus: baseMechanics.ritualDTBonus,
    
    // Provocar
    taunt: baseMechanics.taunt,
    
    // Quando machucado/morrendo
    whenWounded: baseMechanics.whenWounded,
    whenDying: baseMechanics.whenDying,
    
    // Dano máximo em crítico
    maximumDamageOnCritical: baseMechanics.maximumDamageOnCritical,
    
    // Furtividade
    stealthMovementPenalty: baseMechanics.stealthMovementPenalty,
    sneakAttackMultiplier: baseMechanics.sneakAttackMultiplier,
    ignoreStealthPenalty: baseMechanics.ignoreStealthPenalty,
    
    // Capacidade de carga
    carryCapacity: baseMechanics.carryCapacity,
    itemSpaceReduction: baseMechanics.itemSpaceReduction,
    
    // Reparo
    repairEquipment: baseMechanics.repairEquipment,
    
    // Remoção de condição
    removeCondition: baseMechanics.removeCondition,
    
    // Ressurreição
    resurrect: baseMechanics.resurrect,
    
    // Efeito social
    socialEffect: baseMechanics.socialEffect,
    
    // Buff de aliados
    allyBuff: baseMechanics.allyBuff,
    
    // Contatos
    contacts: baseMechanics.contacts,
    
    // Copiar habilidade
    copyAbility: baseMechanics.copyAbility,
    
    // Criar equipamento
    createEquipment: baseMechanics.createEquipment,
    
    // Retirar item
    retrieveItem: baseMechanics.retrieveItem,
    
    // Movimento livre
    freeMovementTo: baseMechanics.freeMovementTo,
    
    // Bônus ao curar
    onHeal: baseMechanics.onHeal,
    
    // Controle de estado
    targetStateControl: baseMechanics.targetStateControl,
    
    // Ocultismo como ataque
    occultismAsAttack: baseMechanics.occultismAsAttack,
    
    // Multiplicador ataque especial
    specialAttackMultiplier: baseMechanics.specialAttackMultiplier,
    
    // Rituais bônus
    bonusRituals: baseMechanics.bonusRituals,
    
    // Grimório
    grimoire: baseMechanics.grimoire,
    
    // Resistência a dano mental
    mentalDamageResistance: baseMechanics.mentalDamageResistance,
    
    // Ações extras de trilha
    extraActionsTrack: baseMechanics.extraActions,
    
    // Redução dano paranormal
    paranormalDamageReduction: baseMechanics.paranormalDamageReduction ? {
      testSkill: baseMechanics.paranormalDamageReduction.testSkill as Skill,
      onSuccess: baseMechanics.paranormalDamageReduction.onSuccess as 'negate' | 'half',
      onFailure: baseMechanics.paranormalDamageReduction.onFailure as 'half' | 'full'
    } : undefined,
    
    // Bônus de poder de ritual
    ritualPowerBonus: baseMechanics.ritualPowerBonus,
    
    // PV como PE (Flagelador)
    hpAsPE: baseMechanics.hpAsPE ? { ratio: baseMechanics.hpCostPerPE ?? 2 } : undefined,
    hpRecoveryRestriction: baseMechanics.hpRecoveryRestriction as 'rest-only' | 'magic-only' | undefined,
  };
  
  // Remove propriedades undefined
  Object.keys(powerMechanics).forEach(key => {
    if (powerMechanics[key as keyof PowerMechanics] === undefined) {
      delete powerMechanics[key as keyof PowerMechanics];
    }
  });
  
  return {
    id: `track-${ability.id}`,
    name: ability.name,
    classId: track.classId as ClassId,
    trackId: track.id,
    isCore: ability.isInitial,
    minNex: ability.minNex,
    description: ability.description,
    pageReference: ability.pageReference || track.pageReference,
    effects: {
      base: powerMechanics,
      // Converter progressão se existir
      progression: ability.effects.progression ? 
        Object.fromEntries(
          Object.entries(ability.effects.progression).map(([nex, mechanics]) => {
            const typedMechanics = mechanics as Partial<TrackAbilityMechanics>;
            return [
              Number(nex),
              { kind: typedMechanics.kind || 'passive' } as Partial<PowerMechanics>
            ];
          })
        ) : undefined
    },
    tags: ability.tags
  };
}

/**
 * Converte todas as habilidades de uma trilha para poderes
 */
function convertTrackToPowers(track: UnifiedTrack): UnifiedClassPower[] {
  return track.abilities.map(ability => convertTrackAbilityToPower(ability, track));
}

// =============================================================================
// PODERES DE TRILHA DO COMBATENTE
// =============================================================================

/**
 * Poderes de todas as trilhas do Combatente convertidos
 */
export const COMBATENTE_TRACK_POWERS: UnifiedClassPower[] = 
  COMBATENTE_TRACKS.flatMap(convertTrackToPowers);

// =============================================================================
// PODERES DE TRILHA DO ESPECIALISTA
// =============================================================================

/**
 * Poderes de todas as trilhas do Especialista convertidos
 */
export const ESPECIALISTA_TRACK_POWERS: UnifiedClassPower[] = 
  ESPECIALISTA_TRACKS.flatMap(convertTrackToPowers);

// =============================================================================
// PODERES DE TRILHA DO OCULTISTA
// =============================================================================

/**
 * Poderes de todas as trilhas do Ocultista convertidos
 */
export const OCULTISTA_TRACK_POWERS: UnifiedClassPower[] = 
  OCULTISTA_TRACKS.flatMap(convertTrackToPowers);

// =============================================================================
// TODOS OS PODERES DE TRILHA
// =============================================================================

/**
 * Array com todos os poderes de trilha convertidos (60 poderes no total)
 * - 5 trilhas de Combatente x 4 habilidades = 20 poderes
 * - 5 trilhas de Especialista x 4 habilidades = 20 poderes
 * - 5 trilhas de Ocultista x 4 habilidades = 20 poderes
 */
export const ALL_TRACK_POWERS: UnifiedClassPower[] = [
  ...COMBATENTE_TRACK_POWERS,
  ...ESPECIALISTA_TRACK_POWERS,
  ...OCULTISTA_TRACK_POWERS,
];

// =============================================================================
// FUNÇÕES DE BUSCA ESPECÍFICAS PARA TRILHAS
// =============================================================================

/**
 * Retorna poderes de uma trilha específica
 */
export function getTrackPowers(trackId: string): UnifiedClassPower[] {
  return ALL_TRACK_POWERS.filter(power => power.trackId === trackId);
}

/**
 * Retorna trilhas disponíveis para uma classe
 */
export function getTracksForClass(classId: ClassId): string[] {
  const trackIds = new Set<string>();
  ALL_TRACK_POWERS.forEach(power => {
    if (power.classId === classId && power.trackId) {
      trackIds.add(power.trackId);
    }
  });
  return Array.from(trackIds);
}

/**
 * Retorna o poder inicial de uma trilha (NEX 10%)
 */
export function getInitialTrackPower(trackId: string): UnifiedClassPower | undefined {
  return ALL_TRACK_POWERS.find(
    power => power.trackId === trackId && power.minNex === 10
  );
}

/**
 * Estatísticas dos poderes de trilha
 */
export function getTrackPowerStats(): {
  total: number;
  byClass: Record<ClassId, number>;
  byTrack: Record<string, number>;
} {
  const byClass: Record<ClassId, number> = {
    'Combatente': COMBATENTE_TRACK_POWERS.length,
    'Especialista': ESPECIALISTA_TRACK_POWERS.length,
    'Ocultista': OCULTISTA_TRACK_POWERS.length,
  };
  
  const byTrack: Record<string, number> = {};
  ALL_TRACK_POWERS.forEach(power => {
    if (power.trackId) {
      byTrack[power.trackId] = (byTrack[power.trackId] || 0) + 1;
    }
  });
  
  return {
    total: ALL_TRACK_POWERS.length,
    byClass,
    byTrack,
  };
}
