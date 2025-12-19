/**
 * Motor de Auditoria de Personagens - Ordem Paranormal RPG
 * 
 * Este módulo verifica automaticamente se os stats do personagem estão
 * calculados corretamente de acordo com as regras oficiais v1.3.
 * 
 * Problemas detectados:
 * - Sanidade calculada incorretamente para origens com modificador
 * - Poderes paranormais excedendo slots de Transcender
 * - HP/PE não condizentes com fórmulas oficiais
 * - Registros de Transcender inconsistentes
 * - Bônus aplicados em perícias não treinadas
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateDerivedStats, CLASSES, ORIGINS } from './character-data';
import { getPowerChoiceMilestones, getCharacterPowerChoices } from './transcender-system';

// Helpers para buscar origem e classe por ID
function getOriginById(id: string) {
  return ORIGINS.find(o => o.id === id);
}

function getClassById(id: string) {
  return CLASSES.find(c => c.id === id);
}
import { PARANORMAL_POWERS, getPowerById } from './paranormal-powers';

// ==================== TIPOS DE AUDITORIA ====================

// Severidade do problema
export type AuditSeverity = 'error' | 'warning' | 'info';

// Categoria do problema
export type AuditCategory = 
  | 'sanity'           // Problemas com cálculo de Sanidade
  | 'transcender'      // Problemas com slots de Transcender
  | 'hp'               // Problemas com HP
  | 'pe'               // Problemas com PE
  | 'defense'          // Problemas com Defesa
  | 'skills'           // Problemas com perícias
  | 'powers'           // Problemas com poderes
  | 'records';         // Inconsistências em registros

// Um problema encontrado na auditoria
export interface AuditIssue {
  id: string;                      // ID único do problema
  category: AuditCategory;         // Categoria do problema
  severity: AuditSeverity;         // Severidade
  title: string;                   // Título curto
  description: string;             // Descrição detalhada
  currentValue: number | string;   // Valor atual
  expectedValue: number | string;  // Valor esperado
  autoFixable: boolean;            // Se pode ser corrigido automaticamente
  fixAction?: string;              // Ação de correção (para exibir ao usuário)
}

// Resultado completo da auditoria
export interface AuditResult {
  characterId: string;
  characterName: string;
  timestamp: string;
  issues: AuditIssue[];
  autoFixableIssues: AuditIssue[];
  manualReviewIssues: AuditIssue[];
  stats: {
    expected: { hp: number; pe: number; san: number; defense: number };
    actual: { hp: number; pe: number; san: number; defense: number };
    bonuses: { hp: number; pe: number; san: number; defense: number };
  };
  transcender: {
    slotsTotal: number;
    slotsUsed: number;
    powersFromOrigin: number;
    powersTotal: number;
    excessPowers: number;
  };
  isHealthy: boolean;
}

// Dados do personagem necessários para auditoria
export interface CharacterForAudit {
  id: string;
  name: string;
  class: string;
  origin: string;
  nex: number;
  vigor: number;
  presence: number;
  agility: number;
  hp_max: number;
  pe_max: number;
  san_max: number;
  defense: number;
  paranormal_powers?: Array<{ id: string; name: string; [key: string]: any }>;
  skills?: Record<string, number>;
  abilities?: string[];
}

// ==================== FUNÇÕES DE AUDITORIA ====================

/**
 * Executa auditoria completa de um personagem
 */
export async function auditCharacter(character: CharacterForAudit): Promise<AuditResult> {
  const issues: AuditIssue[] = [];
  const timestamp = new Date().toISOString();
  
  // 1. Auditar cálculo de stats base (HP, PE, SAN)
  const statsAudit = auditStatsCalculation(character);
  issues.push(...statsAudit.issues);
  
  // 2. Auditar Defesa
  const defenseAudit = auditDefense(character);
  issues.push(...defenseAudit.issues);
  
  // 3. Auditar slots de Transcender
  const transcenderAudit = await auditTranscenderSlots(character);
  issues.push(...transcenderAudit.issues);
  
  // 4. Auditar registros de Transcender
  const recordsAudit = await auditTranscenderRecords(character);
  issues.push(...recordsAudit.issues);
  
  // 5. Auditar bônus de poderes em perícias
  const skillsAudit = auditSkillBonuses(character);
  issues.push(...skillsAudit.issues);
  
  // Separar problemas por tipo
  const autoFixableIssues = issues.filter(i => i.autoFixable);
  const manualReviewIssues = issues.filter(i => !i.autoFixable);
  
  return {
    characterId: character.id,
    characterName: character.name,
    timestamp,
    issues,
    autoFixableIssues,
    manualReviewIssues,
    stats: {
      expected: statsAudit.expected,
      actual: statsAudit.actual,
      bonuses: statsAudit.bonuses,
    },
    transcender: transcenderAudit.summary,
    isHealthy: issues.length === 0,
  };
}

/**
 * Audita cálculo de HP, PE e Sanidade
 */
export function auditStatsCalculation(character: CharacterForAudit): {
  issues: AuditIssue[];
  expected: { hp: number; pe: number; san: number; defense: number };
  actual: { hp: number; pe: number; san: number; defense: number };
  bonuses: { hp: number; pe: number; san: number; defense: number };
} {
  const issues: AuditIssue[] = [];
  
  // Calcula valores esperados usando a função oficial
  const expected = calculateDerivedStats(
    character.class,
    character.vigor,
    character.presence,
    character.nex,
    character.origin,
    character.abilities
  );
  
  const actual = {
    hp: character.hp_max,
    pe: character.pe_max,
    san: character.san_max,
    defense: character.defense,
  };
  
  // Os bônus serão aplicados dinamicamente por poderes paranormais
  // Por enquanto, assumimos bônus zerados para a auditoria base
  const bonuses = { hp: 0, pe: 0, san: 0, defense: 0 };
  
  // Verificar Sanidade
  // IMPORTANTE: A fórmula de Sanidade para Cultista Arrependido deve aplicar
  // -50% apenas sobre a BASE da classe, não sobre o total
  if (actual.san !== expected.san) {
    const origin = getOriginById(character.origin);
    const classData = getClassById(character.class);
    
    let description = `Sanidade esperada: ${expected.san}, encontrada: ${actual.san}.`;
    
    if (origin?.sanityModifier) {
      const baseReduction = Math.floor((classData?.sanBase || 0) * (origin.sanityModifier / 100));
      description += ` Origem "${origin.name}" aplica ${origin.sanityModifier}% sobre a base (${classData?.sanBase}), resultando em ${baseReduction} de modificador.`;
    }
    
    issues.push({
      id: `san_mismatch_${character.id}`,
      category: 'sanity',
      severity: 'error',
      title: 'Sanidade Incorreta',
      description,
      currentValue: actual.san,
      expectedValue: expected.san,
      autoFixable: true,
      fixAction: `Atualizar san_max para ${expected.san}`,
    });
  }
  
  // Verificar HP (base, sem bônus de poderes)
  // Nota: Bônus de poderes são dinâmicos e não devem ser persistidos no hp_max
  if (actual.hp !== expected.hp) {
    // Se a diferença corresponde a bônus conhecidos, é apenas informativo
    const difference = actual.hp - expected.hp;
    const isProbablyBonus = difference > 0 && difference % 5 === 0; // Sangue de Ferro dá múltiplos
    
    if (isProbablyBonus) {
      issues.push({
        id: `hp_includes_bonus_${character.id}`,
        category: 'hp',
        severity: 'info',
        title: 'HP Inclui Bônus de Poderes',
        description: `HP base esperado: ${expected.hp}. HP atual: ${actual.hp}. Diferença de +${difference} provavelmente de poderes paranormais.`,
        currentValue: actual.hp,
        expectedValue: expected.hp,
        autoFixable: false,
        fixAction: 'Verificar se bônus de poderes estão sendo aplicados corretamente',
      });
      bonuses.hp = difference;
    } else {
      issues.push({
        id: `hp_mismatch_${character.id}`,
        category: 'hp',
        severity: 'warning',
        title: 'HP Base Incorreto',
        description: `HP esperado: ${expected.hp}, encontrado: ${actual.hp}.`,
        currentValue: actual.hp,
        expectedValue: expected.hp,
        autoFixable: true,
        fixAction: `Atualizar hp_max para ${expected.hp}`,
      });
    }
  }
  
  // Verificar PE
  if (actual.pe !== expected.pe) {
    issues.push({
      id: `pe_mismatch_${character.id}`,
      category: 'pe',
      severity: 'warning',
      title: 'PE Base Incorreto',
      description: `PE esperado: ${expected.pe}, encontrado: ${actual.pe}.`,
      currentValue: actual.pe,
      expectedValue: expected.pe,
      autoFixable: true,
      fixAction: `Atualizar pe_max para ${expected.pe}`,
    });
  }
  
  return {
    issues,
    expected: { ...expected, defense: 10 + character.agility },
    actual,
    bonuses,
  };
}

/**
 * Audita cálculo de Defesa
 */
export function auditDefense(character: CharacterForAudit): { issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  
  const expectedDefense = 10 + character.agility;
  
  if (character.defense !== expectedDefense) {
    // Se maior, pode ser bônus de armadura/poderes
    if (character.defense > expectedDefense) {
      issues.push({
        id: `defense_includes_bonus_${character.id}`,
        category: 'defense',
        severity: 'info',
        title: 'Defesa Inclui Bônus',
        description: `Defesa base: 10 + AGI (${character.agility}) = ${expectedDefense}. Atual: ${character.defense}. Bônus de +${character.defense - expectedDefense} provavelmente de armadura ou poderes.`,
        currentValue: character.defense,
        expectedValue: expectedDefense,
        autoFixable: false,
      });
    } else {
      issues.push({
        id: `defense_mismatch_${character.id}`,
        category: 'defense',
        severity: 'warning',
        title: 'Defesa Incorreta',
        description: `Defesa esperada: ${expectedDefense} (10 + AGI ${character.agility}), encontrada: ${character.defense}.`,
        currentValue: character.defense,
        expectedValue: expectedDefense,
        autoFixable: true,
        fixAction: `Atualizar defense para ${expectedDefense}`,
      });
    }
  }
  
  return { issues };
}

/**
 * Audita slots de Transcender vs poderes paranormais
 */
export async function auditTranscenderSlots(character: CharacterForAudit): Promise<{
  issues: AuditIssue[];
  summary: {
    slotsTotal: number;
    slotsUsed: number;
    powersFromOrigin: number;
    powersTotal: number;
    excessPowers: number;
  };
}> {
  const issues: AuditIssue[] = [];
  const powers = character.paranormal_powers || [];
  
  // Calcular slots de Transcender disponíveis
  const milestones = getPowerChoiceMilestones();
  const slotsTotal = milestones.filter(m => m <= character.nex).length;
  
  // Verificar se a origem concede poder paranormal inicial
  const origin = getOriginById(character.origin);
  const originGrantsPower = origin?.id === 'cultista-arrependido'; // Traços do Outro Lado
  const powersFromOrigin = originGrantsPower ? 1 : 0;
  
  // Buscar registros reais de Transcender
  const choices = await getCharacterPowerChoices(character.id);
  const transcenderChoices = choices.filter(c => 
    c.choice_type === 'transcender' && c.status === 'resolved'
  );
  const slotsUsed = transcenderChoices.length;
  
  // Total de poderes que o personagem deveria ter
  const maxLegitPowers = slotsTotal + powersFromOrigin;
  const powersTotal = powers.length;
  const excessPowers = Math.max(0, powersTotal - maxLegitPowers);
  
  if (excessPowers > 0) {
    issues.push({
      id: `excess_powers_${character.id}`,
      category: 'transcender',
      severity: 'error',
      title: 'Poderes Paranormais Excedentes',
      description: `O personagem tem ${powersTotal} poderes, mas deveria ter no máximo ${maxLegitPowers} (${slotsTotal} slots de Transcender${powersFromOrigin > 0 ? ` + ${powersFromOrigin} da origem` : ''}). Excesso de ${excessPowers} poder(es).`,
      currentValue: powersTotal,
      expectedValue: maxLegitPowers,
      autoFixable: false,
      fixAction: 'Revisar manualmente quais poderes são legítimos e remover os excedentes',
    });
  }
  
  // Verificar se há discrepância entre poderes e registros
  if (powersTotal > 0 && slotsUsed < (powersTotal - powersFromOrigin)) {
    const unregisteredPowers = powersTotal - powersFromOrigin - slotsUsed;
    if (unregisteredPowers > 0) {
      issues.push({
        id: `unregistered_powers_${character.id}`,
        category: 'records',
        severity: 'warning',
        title: 'Poderes Sem Registro de Transcender',
        description: `${unregisteredPowers} poder(es) paranormal(is) não têm registro correspondente na tabela de escolhas. Isso pode indicar poderes adicionados antes do sistema de Transcender.`,
        currentValue: slotsUsed,
        expectedValue: powersTotal - powersFromOrigin,
        autoFixable: false,
        fixAction: 'Sincronizar registros de Transcender (requer revisão manual)',
      });
    }
  }
  
  return {
    issues,
    summary: {
      slotsTotal,
      slotsUsed,
      powersFromOrigin,
      powersTotal,
      excessPowers,
    },
  };
}

/**
 * Audita consistência dos registros de Transcender
 */
export async function auditTranscenderRecords(character: CharacterForAudit): Promise<{
  issues: AuditIssue[];
}> {
  const issues: AuditIssue[] = [];
  const powers = character.paranormal_powers || [];
  
  if (powers.length === 0) {
    return { issues };
  }
  
  // Buscar registros existentes
  const choices = await getCharacterPowerChoices(character.id);
  const resolvedChoices = choices.filter(c => 
    c.choice_type === 'transcender' && c.status === 'resolved'
  );
  
  // Verificar se cada poder registrado existe no personagem
  for (const choice of resolvedChoices) {
    const resolution = choice.resolution as { powerId?: string; powerName?: string } | null;
    if (!resolution?.powerId) continue;
    
    const hasPower = powers.some(p => p.id === resolution.powerId);
    if (!hasPower) {
      issues.push({
        id: `orphan_choice_${choice.id}`,
        category: 'records',
        severity: 'warning',
        title: 'Registro de Transcender Órfão',
        description: `Registro de Transcender para "${resolution.powerName || resolution.powerId}" (NEX ${choice.nex}%) não corresponde a nenhum poder no personagem.`,
        currentValue: resolution.powerId,
        expectedValue: 'Poder existente no personagem',
        autoFixable: false,
        fixAction: 'Verificar se o poder foi removido indevidamente ou se o registro está incorreto',
      });
    }
  }
  
  return { issues };
}

/**
 * Audita bônus de poderes em perícias não treinadas
 */
export function auditSkillBonuses(character: CharacterForAudit): { issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  const powers = character.paranormal_powers || [];
  const skills = character.skills || {};
  
  // Verificar "Expansão de Conhecimento" que dá +5 em perícias de INT
  const expansaoConhecimento = powers.find(p => p.id === 'expansao-conhecimento');
  if (expansaoConhecimento) {
    // Extrai escolhas salvas
    const savedPower = expansaoConhecimento as { choices?: { skills?: string[] } };
    const chosenSkills = savedPower.choices?.skills || [];
    
    for (const skillId of chosenSkills) {
      const skillRank = skills[skillId] || 0;
      if (skillRank === 0) {
        issues.push({
          id: `untrained_skill_bonus_${skillId}`,
          category: 'skills',
          severity: 'info',
          title: 'Bônus em Perícia Destreinada',
          description: `"Expansão de Conhecimento" aplica +5 em "${skillId}", mas esta perícia não está treinada (rank 0). O bônus ainda se aplica, mas o personagem pode não conseguir usar a perícia sem treinamento dependendo da situação.`,
          currentValue: skillRank,
          expectedValue: '≥1 (treinado)',
          autoFixable: false,
          fixAction: 'Considerar treinar a perícia para maximizar o benefício do poder',
        });
      }
    }
  }
  
  return { issues };
}

// ==================== FUNÇÕES DE AUTO-CORREÇÃO ====================

/**
 * Corrige automaticamente problemas seguros
 * Retorna lista de correções aplicadas
 */
export async function autoFixCharacterIssues(
  characterId: string,
  userId: string,
  issues: AuditIssue[]
): Promise<{
  success: boolean;
  fixedCount: number;
  errors: string[];
  appliedFixes: string[];
}> {
  const errors: string[] = [];
  const appliedFixes: string[] = [];
  
  // Filtrar apenas problemas auto-corrigíveis
  const fixableIssues = issues.filter(i => i.autoFixable);
  
  if (fixableIssues.length === 0) {
    return { success: true, fixedCount: 0, errors: [], appliedFixes: [] };
  }
  
  // Preparar updates
  const updates: Record<string, number> = {};
  
  for (const issue of fixableIssues) {
    switch (issue.category) {
      case 'sanity':
        updates.san_max = issue.expectedValue as number;
        // Se san_current > san_max, ajustar também
        updates.san_current = issue.expectedValue as number;
        appliedFixes.push(`Sanidade corrigida para ${issue.expectedValue}`);
        break;
        
      case 'hp':
        updates.hp_max = issue.expectedValue as number;
        appliedFixes.push(`HP máximo corrigido para ${issue.expectedValue}`);
        break;
        
      case 'pe':
        updates.pe_max = issue.expectedValue as number;
        appliedFixes.push(`PE máximo corrigido para ${issue.expectedValue}`);
        break;
        
      case 'defense':
        updates.defense = issue.expectedValue as number;
        appliedFixes.push(`Defesa corrigida para ${issue.expectedValue}`);
        break;
    }
  }
  
  // Aplicar updates no banco
  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('characters')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', characterId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('[AutoFix] Erro ao aplicar correções:', error);
      errors.push(error.message);
      return { success: false, fixedCount: 0, errors, appliedFixes: [] };
    }
  }
  
  return {
    success: true,
    fixedCount: appliedFixes.length,
    errors,
    appliedFixes,
  };
}

// ==================== VALIDAÇÃO PRÉ-SALVAMENTO ====================

/**
 * Valida dados do personagem antes de salvar
 * Retorna erros que devem bloquear o salvamento
 */
export function validateBeforeSave(data: {
  class?: string;
  origin?: string;
  nex?: number;
  vigor?: number;
  presence?: number;
  agility?: number;
  hp_max?: number;
  pe_max?: number;
  san_max?: number;
  paranormal_powers?: Array<{ id: string }>;
}): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validar limite de poderes paranormais
  if (data.nex && data.paranormal_powers && data.origin) {
    const milestones = getPowerChoiceMilestones();
    const slotsTotal = milestones.filter(m => m <= data.nex).length;
    
    const origin = getOriginById(data.origin);
    const powersFromOrigin = origin?.id === 'cultista-arrependido' ? 1 : 0;
    const maxPowers = slotsTotal + powersFromOrigin;
    
    if (data.paranormal_powers.length > maxPowers) {
      errors.push(
        `Limite de poderes paranormais excedido: ${data.paranormal_powers.length}/${maxPowers} (${slotsTotal} Transcender${powersFromOrigin > 0 ? ` + ${powersFromOrigin} origem` : ''})`
      );
    }
  }
  
  // Validar se stats fazem sentido com os atributos
  if (data.class && data.vigor !== undefined && data.presence !== undefined && data.nex) {
    const expected = calculateDerivedStats(
      data.class,
      data.vigor,
      data.presence,
      data.nex,
      data.origin
    );
    
    // HP muito diferente do esperado
    if (data.hp_max !== undefined) {
      const hpDiff = Math.abs(data.hp_max - expected.hp);
      if (hpDiff > 50) {
        warnings.push(`HP (${data.hp_max}) difere significativamente do esperado (${expected.hp})`);
      }
    }
    
    // Sanidade muito diferente
    if (data.san_max !== undefined) {
      const sanDiff = Math.abs(data.san_max - expected.san);
      if (sanDiff > 20) {
        warnings.push(`Sanidade (${data.san_max}) difere significativamente do esperado (${expected.san})`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calcula o número máximo de poderes paranormais permitidos
 */
export function getMaxParanormalPowers(nex: number, originId: string): {
  total: number;
  fromTranscender: number;
  fromOrigin: number;
} {
  const milestones = getPowerChoiceMilestones();
  const fromTranscender = milestones.filter(m => m <= nex).length;
  
  const origin = getOriginById(originId);
  const fromOrigin = origin?.id === 'cultista-arrependido' ? 1 : 0;
  
  return {
    total: fromTranscender + fromOrigin,
    fromTranscender,
    fromOrigin,
  };
}

/**
 * Verifica se o personagem pode adicionar mais poderes paranormais
 */
export function canAddParanormalPower(
  currentPowersCount: number,
  nex: number,
  originId: string,
  transcenderUsed: number
): {
  canAdd: boolean;
  reason?: string;
  slotsRemaining: number;
} {
  const limits = getMaxParanormalPowers(nex, originId);
  
  // Slots de Transcender restantes
  const transcenderRemaining = limits.fromTranscender - transcenderUsed;
  
  if (transcenderRemaining <= 0) {
    return {
      canAdd: false,
      reason: `Todos os ${limits.fromTranscender} slots de Transcender foram usados. Próximo slot disponível no NEX ${getPowerChoiceMilestones().find(m => m > nex) || 'máximo'}%.`,
      slotsRemaining: 0,
    };
  }
  
  if (currentPowersCount >= limits.total) {
    return {
      canAdd: false,
      reason: `Limite de ${limits.total} poderes paranormais atingido.`,
      slotsRemaining: 0,
    };
  }
  
  return {
    canAdd: true,
    slotsRemaining: transcenderRemaining,
  };
}
