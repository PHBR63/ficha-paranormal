/**
 * Engine de Efeitos de Trilhas - Ordem Paranormal RPG v1.3
 * 
 * Calcula e aplica automaticamente os bônus das habilidades de trilha
 * baseado no contexto do personagem.
 * 
 * @module track-effects-engine
 */

import type { 
  UnifiedTrackAbility,
  TrackAbilityMechanics,
  TrackBonusSummary,
  TrackCalculationContext,
  ActiveTrack
} from './track-types';
import type { Skill, Attribute } from './types';
import { getTrackById, getUnlockedAbilities, getTrackAbilityById } from './track-registry';

// =============================================================================
// CRIAÇÃO DE SUMÁRIO VAZIO
// =============================================================================

/**
 * Cria um sumário de bônus vazio
 * @returns TrackBonusSummary com valores zerados
 */
export function createEmptyTrackBonusSummary(): TrackBonusSummary {
  return {
    attackBonus: 0,
    damageBonus: 0,
    extraDamageDice: [],
    criticalMarginBonus: 0,
    criticalMultiplierBonus: 0,
    defenseBonus: 0,
    initiativeBonus: 0,
    bonusHP: 0,
    damageResistance: 0,
    paranormalResistance: 0,
    mentalDamageResistance: 0,
    skillBonuses: {} as Record<Skill, number>,
    categoryReduction: 0,
    ritualDTBonus: 0,
    canUseHPAsPE: false,
    canUseOccultismAsAttack: false,
    breakdown: [],
  };
}

// =============================================================================
// APLICAÇÃO DE MECÂNICAS
// =============================================================================

/**
 * Aplica as mecânicas de uma habilidade ao sumário de bônus
 * @param summary - Sumário a ser modificado
 * @param mechanics - Mecânicas a aplicar
 * @param ability - Habilidade fonte
 * @param context - Contexto de cálculo
 */
function applyTrackMechanics(
  summary: TrackBonusSummary,
  mechanics: TrackAbilityMechanics,
  ability: UnifiedTrackAbility,
  context: TrackCalculationContext
): void {
  const effects: string[] = [];
  
  // Bônus de Iniciativa
  if (mechanics.initiativeBonus) {
    summary.initiativeBonus += mechanics.initiativeBonus;
    effects.push(`+${mechanics.initiativeBonus} Iniciativa`);
  }
  
  // PV por NEX (Casca Grossa)
  if (mechanics.hpPerNexPercent) {
    const bonusHP = Math.floor(context.nex * mechanics.hpPerNexPercent);
    summary.bonusHP += bonusHP;
    effects.push(`+${bonusHP} PV`);
  }
  
  // Resistência paranormal (Mente Sã)
  if (mechanics.paranormalResistance) {
    summary.paranormalResistance += mechanics.paranormalResistance;
    effects.push(`+${mechanics.paranormalResistance} resistência paranormal`);
  }
  
  // Resistência a dano mental (Inabalável)
  if (mechanics.mentalDamageResistance) {
    summary.mentalDamageResistance += mechanics.mentalDamageResistance;
    effects.push(`Resistência mental ${mechanics.mentalDamageResistance}`);
  }
  
  // Bônus na DT de rituais (Rituais Eficientes)
  if (mechanics.ritualDTBonus) {
    summary.ritualDTBonus += mechanics.ritualDTBonus;
    effects.push(`+${mechanics.ritualDTBonus} DT rituais`);
  }
  
  // Usar PV como PE (Poder do Flagelo)
  if (mechanics.hpAsPE) {
    summary.canUseHPAsPE = true;
    effects.push('Pode usar PV como PE');
  }
  
  // Usar Ocultismo como ataque (Lâmina Maldita)
  if (mechanics.occultismAsAttack) {
    summary.canUseOccultismAsAttack = true;
    effects.push('Pode usar Ocultismo em ataques');
  }
  
  // Redução de categoria (Aniquilador, Técnico)
  if (mechanics.categoryReduction) {
    // Só aplica se for arma favorita (para Aniquilador) ou qualquer arma (para outros)
    const shouldApply = 
      mechanics.categoryReduction.targetType === 'any-weapon' ||
      (mechanics.categoryReduction.targetType === 'specific-weapon' && context.isFavoriteWeapon);
    
    if (shouldApply) {
      summary.categoryReduction = Math.max(
        summary.categoryReduction, 
        mechanics.categoryReduction.amount
      );
      effects.push(`Categoria -${mechanics.categoryReduction.amount}`);
    }
  }
  
  // Bônus de crítico (Técnica Letal, Máquina de Matar)
  if (mechanics.criticalBonus) {
    const { marginBonus, multiplierBonus, conditions } = mechanics.criticalBonus;
    
    // Verifica condições (ex: apenas corpo a corpo)
    const conditionsMet = !conditions?.weaponType || 
      (conditions.weaponType === 'melee' && isMeleeContext(context));
    
    if (conditionsMet) {
      if (marginBonus) {
        summary.criticalMarginBonus += marginBonus;
        effects.push(`+${marginBonus} margem de ameaça`);
      }
      if (multiplierBonus) {
        summary.criticalMultiplierBonus += multiplierBonus;
        effects.push(`+${multiplierBonus} multiplicador crítico`);
      }
    }
  }
  
  // Bônus de dano (Mira de Elite, Máquina de Matar)
  if (mechanics.damageBonus) {
    if (mechanics.damageBonus.value) {
      summary.damageBonus += mechanics.damageBonus.value;
      effects.push(`+${mechanics.damageBonus.value} dano`);
    }
    if (mechanics.damageBonus.attribute) {
      // O valor real depende do atributo do personagem
      effects.push(`+${mechanics.damageBonus.attribute.toUpperCase()} no dano`);
    }
    if (mechanics.damageBonus.extraDice) {
      const dice = `+${mechanics.damageBonus.extraDice.count}d`;
      summary.extraDamageDice.push(dice);
      effects.push(`${dice} dano`);
    }
  }
  
  // Bônus em perícias (Gatuno)
  if (mechanics.skillBonus) {
    mechanics.skillBonus.skills.forEach(skill => {
      const current = summary.skillBonuses[skill] || 0;
      summary.skillBonuses[skill] = current + mechanics.skillBonus!.bonus;
    });
    effects.push(`+${mechanics.skillBonus.bonus} em ${mechanics.skillBonus.skills.join(', ')}`);
  }
  
  // Efeitos quando machucado (Inquebrável)
  if (mechanics.whenWounded) {
    effects.push(`Machucado: +${mechanics.whenWounded.defenseBonus} Defesa, RD ${mechanics.whenWounded.damageResistance}`);
  }
  
  // Registra no breakdown
  if (effects.length > 0) {
    summary.breakdown.push({
      source: ability.name,
      abilityId: ability.id,
      effects,
    });
  }
}

/**
 * Verifica se o contexto é de arma corpo a corpo
 */
function isMeleeContext(context: TrackCalculationContext): boolean {
  const meleeTypes = ['melee', 'light-melee', 'tactical-melee', 'tactical'];
  return context.weaponType ? meleeTypes.includes(context.weaponType) : false;
}

// =============================================================================
// CÁLCULO DE BÔNUS DE TRILHA
// =============================================================================

/**
 * Calcula todos os bônus de uma trilha para um personagem
 * @param trackId - ID da trilha
 * @param context - Contexto de cálculo
 * @returns Sumário de bônus
 */
export function calculateTrackBonuses(
  trackId: string,
  context: TrackCalculationContext
): TrackBonusSummary {
  const summary = createEmptyTrackBonusSummary();
  
  const track = getTrackById(trackId);
  if (!track) return summary;
  
  // Obtém habilidades desbloqueadas
  const unlockedAbilities = getUnlockedAbilities(trackId, context.nex);
  
  // Aplica cada habilidade
  for (const ability of unlockedAbilities) {
    // Aplica mecânicas base
    applyTrackMechanics(summary, ability.effects.base, ability, context);
    
    // Aplica progressão se houver
    if (ability.effects.progression) {
      for (const [nexStr, mechanics] of Object.entries(ability.effects.progression)) {
        const nexThreshold = parseInt(nexStr);
        if (context.nex >= nexThreshold) {
          applyTrackMechanics(summary, mechanics as TrackAbilityMechanics, ability, context);
        }
      }
    }
  }
  
  return summary;
}

/**
 * Calcula bônus a partir de uma trilha ativa
 * @param activeTrack - Trilha ativa do personagem
 * @param context - Contexto de cálculo
 * @returns Sumário de bônus
 */
export function calculateActiveTackBonuses(
  activeTrack: ActiveTrack,
  context: TrackCalculationContext
): TrackBonusSummary {
  return calculateTrackBonuses(activeTrack.trackId, context);
}

// =============================================================================
// FUNÇÕES DE CONSULTA
// =============================================================================

/**
 * Verifica se uma habilidade de trilha está ativa
 * @param abilityId - ID da habilidade
 * @param trackId - ID da trilha ativa do personagem
 * @param nex - NEX do personagem
 * @returns true se a habilidade está ativa
 */
export function hasTrackAbility(
  abilityId: string,
  trackId: string | undefined,
  nex: number
): boolean {
  if (!trackId) return false;
  
  const ability = getTrackAbilityById(abilityId);
  if (!ability) return false;
  
  // Verifica se a habilidade pertence à trilha ativa
  if (ability.trackId !== trackId) return false;
  
  // Verifica se o NEX é suficiente
  return ability.minNex <= nex;
}

/**
 * Calcula dados extras de Ataque Furtivo
 * @param nex - NEX do personagem
 * @param hasAssassinate - Se ativou Assassinar
 * @returns String com os dados (ex: "+3d6")
 */
export function calculateSneakAttackDice(nex: number, hasAssassinate: boolean = false): string {
  let diceCount: number;
  
  if (nex >= 99) diceCount = 4;
  else if (nex >= 65) diceCount = 3;
  else if (nex >= 40) diceCount = 2;
  else diceCount = 1;
  
  if (hasAssassinate) {
    diceCount *= 2; // Assassinar dobra os dados
  }
  
  return `+${diceCount}d6`;
}

/**
 * Calcula a cura do Paramédico
 * @param nex - NEX do personagem
 * @param extraDice - Dados extras pagos com PE
 * @returns String com os dados de cura (ex: "4d10")
 */
export function calculateParamedicHealing(nex: number, extraDice: number = 0): string {
  let baseDice: number;
  
  if (nex >= 99) baseDice = 5;
  else if (nex >= 65) baseDice = 4;
  else if (nex >= 40) baseDice = 3;
  else baseDice = 2;
  
  const totalDice = baseDice + extraDice;
  return `${totalDice}d10`;
}

/**
 * Calcula o bônus do Ataque Especial com Potência Máxima
 * @param peSpent - PE gasto no Ataque Especial
 * @param hasPotenciaMaxima - Se possui Potência Máxima
 * @returns Bônus total disponível
 */
export function calculateSpecialAttackBonus(
  peSpent: number,
  hasPotenciaMaxima: boolean = false
): { attackBonus: number; damageBonus: number; total: number } {
  // Tabela oficial de PE -> Bônus
  let baseBonus: number;
  if (peSpent >= 5) baseBonus = 20;
  else if (peSpent >= 4) baseBonus = 15;
  else if (peSpent >= 3) baseBonus = 10;
  else baseBonus = 5;
  
  const multiplier = hasPotenciaMaxima ? 2 : 1;
  const total = baseBonus * multiplier;
  
  return {
    attackBonus: total,
    damageBonus: total,
    total,
  };
}

// =============================================================================
// MAPEAMENTO LEGADO
// =============================================================================

/**
 * Mapeia nomes de habilidades legadas para IDs de habilidades de trilha
 * @param legacyNames - Array de nomes de habilidades
 * @returns Array de IDs de habilidades
 */
export function mapLegacyTrackAbilities(legacyNames: string[]): string[] {
  const legacyMap: Record<string, string> = {
    // Combatente - Aniquilador
    'a favorita': 'a-favorita',
    'técnica secreta': 'tecnica-secreta',
    'técnica sublime': 'tecnica-sublime',
    'máquina de matar': 'maquina-de-matar',
    
    // Combatente - Comandante de Campo
    'inspirar confiança': 'inspirar-confianca',
    'estrategista': 'estrategista',
    'brecha na guarda': 'brecha-na-guarda',
    'oficial comandante': 'oficial-comandante',
    
    // Combatente - Guerreiro
    'técnica letal': 'tecnica-letal',
    'revidar': 'revidar',
    'força opressora': 'forca-opressora',
    'potência máxima': 'potencia-maxima',
    
    // Combatente - Operações Especiais
    'iniciativa aprimorada': 'iniciativa-aprimorada',
    'ataque extra': 'ataque-extra',
    'surto de adrenalina': 'surto-de-adrenalina',
    'sempre alerta': 'sempre-alerta',
    
    // Combatente - Tropa de Choque
    'casca grossa': 'casca-grossa',
    'cai dentro': 'cai-dentro',
    'duro de matar': 'duro-de-matar',
    'inquebrável': 'inquebravel',
    
    // Especialista - Atirador de Elite
    'mira de elite': 'mira-elite',
    'disparo letal': 'disparo-letal',
    'disparo impactante': 'disparo-impactante',
    'atirar para matar': 'atirar-matar',
    
    // Especialista - Infiltrador
    'ataque furtivo': 'ataque-furtivo-trilha',
    'gatuno': 'gatuno',
    'assassinar': 'assassinar',
    'sombra fugaz': 'sombra-fugaz',
    
    // Especialista - Médico de Campo
    'paramédico': 'paramedico',
    'equipe de trauma': 'equipe-trauma',
    'resgate': 'resgate',
    'reanimação': 'reanimacao',
    
    // Especialista - Negociador
    'eloquência': 'eloquencia',
    'discurso motivador': 'discurso-motivador',
    'eu conheço um cara': 'eu-conheco-um-cara',
    'truque de mestre': 'truque-mestre',
    
    // Especialista - Técnico
    'inventário otimizado': 'inventario-otimizado',
    'remendo': 'remendo',
    'improvisar': 'improvisar',
    'preparado para tudo': 'preparado-para-tudo',
    
    // Ocultista - Condutor
    'ampliar ritual': 'ampliar-ritual',
    'acelerar ritual': 'acelerar-ritual',
    'anular ritual': 'anular-ritual',
    'canalizar o medo': 'canalizar-o-medo',
    
    // Ocultista - Flagelador
    'poder do flagelo': 'poder-do-flagelo',
    'abraçar a dor': 'abracar-a-dor',
    'absorver angústia': 'absorver-angustia',
    'medo tangível': 'medo-tangivel',
    
    // Ocultista - Graduado
    'saber ampliado': 'saber-ampliado',
    'grimório ritualístico': 'grimorio-ritualistico',
    'rituais eficientes': 'rituais-eficientes',
    'conhecendo o medo': 'conhecendo-o-medo',
    
    // Ocultista - Intuitivo
    'mente sã': 'mente-sa',
    'presença poderosa': 'presenca-poderosa',
    'inabalável': 'inabalavel',
    'presença do medo': 'presenca-do-medo',
    
    // Ocultista - Lâmina Paranormal
    'lâmina maldita': 'lamina-maldita',
    'gladiador paranormal': 'gladiador-paranormal',
    'conjuração marcial': 'conjuracao-marcial',
    'lâmina do medo': 'lamina-do-medo',
  };
  
  return legacyNames
    .map(name => legacyMap[name.toLowerCase()] || name)
    .filter(Boolean);
}

// =============================================================================
// DEBUG
// =============================================================================

/**
 * Retorna um breakdown detalhado dos bônus de trilha
 * @param trackId - ID da trilha
 * @param context - Contexto de cálculo
 * @returns String com detalhamento
 */
export function getDetailedTrackBreakdown(
  trackId: string,
  context: TrackCalculationContext
): string {
  const summary = calculateTrackBonuses(trackId, context);
  const track = getTrackById(trackId);
  
  if (!track) return `Trilha "${trackId}" não encontrada`;
  
  const lines: string[] = [
    `=== ${track.name} (${track.classId}) ===`,
    `NEX: ${context.nex}%`,
    '',
    '--- Bônus Aplicados ---',
  ];
  
  if (summary.initiativeBonus) lines.push(`Iniciativa: +${summary.initiativeBonus}`);
  if (summary.bonusHP) lines.push(`PV Bônus: +${summary.bonusHP}`);
  if (summary.paranormalResistance) lines.push(`Resistência Paranormal: +${summary.paranormalResistance}`);
  if (summary.mentalDamageResistance) lines.push(`Resistência Mental: ${summary.mentalDamageResistance}`);
  if (summary.criticalMarginBonus) lines.push(`Margem de Ameaça: +${summary.criticalMarginBonus}`);
  if (summary.categoryReduction) lines.push(`Redução de Categoria: ${summary.categoryReduction}`);
  if (summary.ritualDTBonus) lines.push(`DT Rituais: +${summary.ritualDTBonus}`);
  if (summary.canUseHPAsPE) lines.push('Pode usar PV como PE');
  if (summary.canUseOccultismAsAttack) lines.push('Pode usar Ocultismo como ataque');
  
  if (summary.extraDamageDice.length > 0) {
    lines.push(`Dados de Dano Extra: ${summary.extraDamageDice.join(', ')}`);
  }
  
  const skillKeys = Object.keys(summary.skillBonuses) as Skill[];
  if (skillKeys.length > 0) {
    lines.push('Bônus em Perícias:');
    skillKeys.forEach(skill => {
      lines.push(`  ${skill}: +${summary.skillBonuses[skill]}`);
    });
  }
  
  lines.push('', '--- Detalhamento por Habilidade ---');
  summary.breakdown.forEach(entry => {
    lines.push(`${entry.source}:`);
    entry.effects.forEach(effect => lines.push(`  • ${effect}`));
  });
  
  return lines.join('\n');
}
