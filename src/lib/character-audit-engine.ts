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
import { calculateDerivedStats, countTranscender, CLASSES, ORIGINS, getOcultistRituals } from './character-data';
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
  | 'skill_training'   // Problemas com treinamento de perícias (níveis, quantidade)
  | 'powers'           // Problemas com poderes
  | 'records'          // Inconsistências em registros
  | 'rituals';         // Problemas com rituais (Ocultista)

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
// Interface para escolhas de treinamento em perícia (poder "Treinamento em Perícia")
export interface SkillTrainingChoiceAudit {
  skillId: string;
  fromLevel: number;
  toLevel: number;
}

// Interface para escolhas de Grau de Treinamento (NEX 35% e 70%)
export interface TrainingGradeChoicesAudit {
  35?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
  70?: Array<{ skillId: string; fromLevel: number; toLevel: number }>;
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
  intellect: number;           // Necessário para calcular perícias livres
  hp_max: number;
  pe_max: number;
  san_max: number;
  defense: number;
  paranormal_powers?: Array<{ id: string; name: string; [key: string]: any }>;
  skills?: Record<string, number>;
  abilities?: string[];
  rituals?: string[];  // IDs dos rituais (usado para auditoria de Ocultista)
  class_track?: string;  // Trilha do personagem (para validar pré-requisitos)
  skill_training_choices?: Record<string, SkillTrainingChoiceAudit[]>;  // Escolhas do poder "Treinamento em Perícia"
  training_grade_choices?: TrainingGradeChoicesAudit;  // Escolhas de Grau de Treinamento
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
  
  // 6. Auditar rituais excedentes (Ocultista)
  const ritualsAudit = auditRitualsCount(character);
  issues.push(...ritualsAudit.issues);
  
  // 7. Auditar treinamento de perícias (níveis, quantidade, grau de treinamento)
  const skillTrainingAudit = auditSkillTraining(character);
  issues.push(...skillTrainingAudit.issues);
  
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
  
  // Calcula valores esperados usando a função oficial (incluindo penalidade de Transcender)
  const transcender = countTranscender(character.abilities);
  const expected = calculateDerivedStats(
    character.class,
    character.vigor,
    character.presence,
    character.nex,
    character.origin,
    character.abilities,
    transcender
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
 * 
 * CORREÇÃO: Agora considera TODOS os tipos de registro:
 * - 'transcender': escolha padrão de Transcender
 * - 'transcender_legacy': registros retroativos para poderes antigos
 * - 'origin_power': poder concedido pela origem (ex: Cultista Arrependido)
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
  
  // Calcular slots de Transcender disponíveis baseado no NEX
  const milestones = getPowerChoiceMilestones();
  const slotsTotal = milestones.filter(m => m <= character.nex).length;
  
  // Verificar se a origem concede poder paranormal inicial
  const origin = getOriginById(character.origin);
  const originGrantsPower = origin?.id === 'cultista-arrependido'; // Traços do Outro Lado
  const powersFromOrigin = originGrantsPower ? 1 : 0;
  
  // Buscar TODOS os registros resolvidos de escolha de poder
  const choices = await getCharacterPowerChoices(character.id);
  
  // Contar registros por tipo (todos os resolvidos)
  const allResolvedChoices = choices.filter(c => c.status === 'resolved');
  
  // Slots usados = escolhas de Transcender ou Transcender Legacy resolvidas
  const transcenderChoices = allResolvedChoices.filter(c => 
    c.choice_type === 'transcender' || c.choice_type === 'transcender_legacy'
  );
  const slotsUsed = transcenderChoices.length;
  
  // Registros de origem (não contam como slot)
  const originPowerRecords = allResolvedChoices.filter(c => 
    c.choice_type === 'origin_power'
  );
  const registeredOriginPowers = originPowerRecords.length;
  
  // Total de poderes que o personagem deveria ter:
  // = slots usados + poderes de origem registrados
  // Se não há registros, usa o limite teórico
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
      fixAction: 'Clique em "Remover Poderes" para escolher quais poderes excedentes deseja remover',
    });
  }
  
  // Verificar discrepância entre poderes e registros
  // Coleta TODOS os power IDs registrados (de qualquer tipo de escolha)
  const registeredPowerIds = new Set<string>();
  allResolvedChoices.forEach(c => {
    const resolution = c.resolution as { powerId?: string } | null;
    if (resolution?.powerId) {
      registeredPowerIds.add(resolution.powerId);
    }
  });
  
  // Conta poderes sem registro
  const unregisteredPowers = powers.filter(p => !registeredPowerIds.has(p.id));
  
  if (unregisteredPowers.length > 0) {
    issues.push({
      id: `unregistered_powers_${character.id}`,
      category: 'records',
      severity: 'warning',
      title: 'Poderes Sem Registro de Transcender',
      description: `${unregisteredPowers.length} poder(es) paranormal(is) não têm registro correspondente na tabela de escolhas. Isso pode indicar poderes adicionados antes do sistema de Transcender.`,
      currentValue: registeredPowerIds.size,
      expectedValue: powersTotal,
      autoFixable: true, // Pode ser sincronizado automaticamente
      fixAction: 'Sincronizar registros de Transcender automaticamente',
    });
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

// ==================== AUDITORIA DE TREINAMENTO DE PERÍCIAS ====================

/**
 * Quantidade base de perícias livres por classe
 * Combatente: 1 + INT
 * Especialista: 7 + INT
 * Ocultista: 3 + INT
 */
const CLASS_FREE_SKILLS_FORMULA: Record<string, (intellect: number) => number> = {
  'Combatente': (int) => 1 + int,
  'Especialista': (int) => 7 + int,
  'Ocultista': (int) => 3 + int,
};

/**
 * Perícias obrigatórias por classe
 */
const CLASS_MANDATORY_SKILLS: Record<string, string[]> = {
  'Combatente': [], // Escolha entre Luta/Pontaria e Fortitude/Reflexos (não são obrigatórias fixas)
  'Especialista': [],
  'Ocultista': ['ocultismo', 'vontade'],
};

/**
 * Pré-requisitos de trilha (perícias que devem estar treinadas)
 */
const TRACK_SKILL_PREREQUISITES: Record<string, string[]> = {
  'medico-campo': ['medicina'],
  'medico-de-campo': ['medicina'],
};

/**
 * Conta instâncias do poder "Treinamento em Perícia"
 */
function countSkillTrainingPowers(abilities: string[] = []): number {
  return abilities.filter(a => 
    a.toLowerCase().includes('treinamento em perícia') ||
    a.toLowerCase().includes('treinamento em pericia')
  ).length;
}

/**
 * Audita treinamento de perícias
 * Verifica quantidade, níveis, e conformidade com classe/origem/trilha
 */
export function auditSkillTraining(character: CharacterForAudit): {
  issues: AuditIssue[];
  summary: {
    totalTrained: number;
    expectedTrained: number;
    veteranCount: number;
    expertCount: number;
    validVeteran: number;
    validExpert: number;
    pendingGradeChoices: ('35' | '70')[];
  };
} {
  const issues: AuditIssue[] = [];
  const skills = character.skills || {};
  const nex = character.nex;
  const intellect = character.intellect || 0;
  const characterClass = character.class;
  const classTrack = character.class_track;
  const trainingGradeChoices = character.training_grade_choices || {};
  
  // Contar perícias por nível
  const skillCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const level of Object.values(skills)) {
    const clampedLevel = Math.min(3, Math.max(0, level)) as 0 | 1 | 2 | 3;
    skillCounts[clampedLevel]++;
  }
  
  const totalTrained = skillCounts[1] + skillCounts[2] + skillCounts[3];
  const veteranCount = skillCounts[2] + skillCounts[3]; // Veterano ou superior
  const expertCount = skillCounts[3];
  
  // ========== 1. Validar Níveis Veterano (NEX 35%) ==========
  const grade35Choices = trainingGradeChoices['35'] || [];
  const grade35SkillIds = new Set(grade35Choices.map(c => c.skillId));
  
  // Verificar se há perícias em Veterano sem registro (NEX 35%)
  let validVeteran = 0;
  for (const [skillId, level] of Object.entries(skills)) {
    if (level >= 2) {
      // Nível Veterano ou superior
      if (nex < 35) {
        // Erro: NEX insuficiente para Veterano
        issues.push({
          id: `invalid_veteran_nex_${skillId}`,
          category: 'skill_training',
          severity: 'error',
          title: 'Nível Veterano Inválido',
          description: `A perícia "${skillId}" está em nível Veterano, mas o personagem tem NEX ${nex}%. É necessário NEX 35%+ para perícias Veterano.`,
          currentValue: level,
          expectedValue: 1,
          autoFixable: true,
          fixAction: `Rebaixar ${skillId} para Treinado (nível 1)`,
        });
      } else if (level === 2 && !grade35SkillIds.has(skillId)) {
        // Aviso: sem registro no Grau de Treinamento
        issues.push({
          id: `unregistered_veteran_${skillId}`,
          category: 'skill_training',
          severity: 'warning',
          title: 'Veterano Sem Registro',
          description: `A perícia "${skillId}" está em nível Veterano, mas não há registro no Grau de Treinamento (NEX 35%). Isso pode indicar uma inconsistência.`,
          currentValue: 'Veterano',
          expectedValue: 'Registro em training_grade_choices',
          autoFixable: false,
          fixAction: 'Verificar se a perícia foi escolhida corretamente no Grau de Treinamento',
        });
      } else {
        validVeteran++;
      }
    }
  }
  
  // ========== 2. Validar Níveis Expert (NEX 70%) ==========
  const grade70Choices = trainingGradeChoices['70'] || [];
  const grade70SkillIds = new Set(grade70Choices.map(c => c.skillId));
  
  let validExpert = 0;
  for (const [skillId, level] of Object.entries(skills)) {
    if (level >= 3) {
      // Nível Expert
      if (nex < 70) {
        // Erro: NEX insuficiente para Expert
        issues.push({
          id: `invalid_expert_nex_${skillId}`,
          category: 'skill_training',
          severity: 'error',
          title: 'Nível Expert Inválido',
          description: `A perícia "${skillId}" está em nível Expert, mas o personagem tem NEX ${nex}%. É necessário NEX 70%+ para perícias Expert.`,
          currentValue: level,
          expectedValue: 2,
          autoFixable: true,
          fixAction: `Rebaixar ${skillId} para Veterano (nível 2)`,
        });
      } else if (!grade70SkillIds.has(skillId)) {
        // Aviso: sem registro no Grau de Treinamento
        issues.push({
          id: `unregistered_expert_${skillId}`,
          category: 'skill_training',
          severity: 'warning',
          title: 'Expert Sem Registro',
          description: `A perícia "${skillId}" está em nível Expert, mas não há registro no Grau de Treinamento (NEX 70%). Isso pode indicar uma inconsistência.`,
          currentValue: 'Expert',
          expectedValue: 'Registro em training_grade_choices',
          autoFixable: false,
          fixAction: 'Verificar se a perícia foi escolhida corretamente no Grau de Treinamento',
        });
      } else {
        validExpert++;
      }
    }
  }
  
  // ========== 3. Verificar Grau de Treinamento Pendente ==========
  const pendingGradeChoices: ('35' | '70')[] = [];
  
  // Grau de Treinamento disponível em NEX 35%
  if (nex >= 35 && grade35Choices.length === 0) {
    const freeSkillFormula = CLASS_FREE_SKILLS_FORMULA[characterClass];
    const expectedCount = freeSkillFormula ? Math.max(0, freeSkillFormula(intellect) - 2) + 2 : 2;
    
    issues.push({
      id: `pending_training_grade_35_${character.id}`,
      category: 'skill_training',
      severity: 'warning',
      title: 'Grau de Treinamento Pendente (NEX 35%)',
      description: `O personagem atingiu NEX 35%, mas não configurou o Grau de Treinamento. Escolha ${expectedCount} perícia(s) para subir de Treinado para Veterano.`,
      currentValue: 0,
      expectedValue: expectedCount,
      autoFixable: false,
      fixAction: 'Clique para configurar o Grau de Treinamento',
    });
    pendingGradeChoices.push('35');
  }
  
  // Grau de Treinamento disponível em NEX 70%
  if (nex >= 70 && grade70Choices.length === 0) {
    const freeSkillFormula = CLASS_FREE_SKILLS_FORMULA[characterClass];
    const expectedCount = freeSkillFormula ? Math.max(0, freeSkillFormula(intellect) - 2) + 2 : 2;
    
    issues.push({
      id: `pending_training_grade_70_${character.id}`,
      category: 'skill_training',
      severity: 'warning',
      title: 'Grau de Treinamento Pendente (NEX 70%)',
      description: `O personagem atingiu NEX 70%, mas não configurou o Grau de Treinamento. Escolha ${expectedCount} perícia(s) para subir de Veterano para Expert (ou Treinado para Veterano).`,
      currentValue: 0,
      expectedValue: expectedCount,
      autoFixable: false,
      fixAction: 'Clique para configurar o Grau de Treinamento',
    });
    pendingGradeChoices.push('70');
  }
  
  // ========== 4. Validar Perícias Obrigatórias da Classe ==========
  const mandatorySkills = CLASS_MANDATORY_SKILLS[characterClass] || [];
  for (const skillId of mandatorySkills) {
    const skillLevel = skills[skillId] || 0;
    if (skillLevel < 1) {
      issues.push({
        id: `missing_mandatory_skill_${skillId}`,
        category: 'skill_training',
        severity: 'error',
        title: 'Perícia Obrigatória Faltando',
        description: `A classe ${characterClass} requer a perícia "${skillId}" treinada, mas ela está destreinada (nível 0).`,
        currentValue: skillLevel,
        expectedValue: '≥1 (treinado)',
        autoFixable: false,
        fixAction: 'Treinar a perícia obrigatória',
      });
    }
  }
  
  // ========== 5. Validar Perícias Concedidas pela Origem ==========
  // Cada origem (exceto Amnésico) concede 2 perícias que devem estar treinadas
  const originData = getOriginById(character.origin);
  if (originData && !originData.isAmnesic && originData.skills && originData.skills.length > 0) {
    for (const skillId of originData.skills) {
      const skillLevel = skills[skillId] || 0;
      if (skillLevel < 1) {
        issues.push({
          id: `missing_origin_skill_${skillId}`,
          category: 'skill_training',
          severity: 'error',
          title: 'Perícia da Origem Faltando',
          description: `A origem "${originData.name}" concede a perícia "${skillId}" treinada, mas ela está destreinada (nível 0).`,
          currentValue: skillLevel,
          expectedValue: '≥1 (treinado)',
          autoFixable: false,
          fixAction: `Treinar ${skillId} (concedida pela origem ${originData.name})`,
        });
      }
    }
  }
  
  // ========== 6. Validar Pré-requisitos de Trilha ==========
  if (classTrack) {
    const trackPrereqs = TRACK_SKILL_PREREQUISITES[classTrack.toLowerCase()] || [];
    for (const skillId of trackPrereqs) {
      const skillLevel = skills[skillId] || 0;
      if (skillLevel < 1) {
        issues.push({
          id: `missing_track_prereq_${skillId}`,
          category: 'skill_training',
          severity: 'error',
          title: 'Pré-requisito de Trilha',
          description: `A trilha "${classTrack}" requer a perícia "${skillId}" treinada, mas ela está destreinada (nível 0).`,
          currentValue: skillLevel,
          expectedValue: '≥1 (treinado)',
          autoFixable: false,
          fixAction: `Treinar ${skillId} para usar esta trilha`,
        });
      }
    }
  }
  
  // ========== 6. Calcular Perícias Esperadas ==========
  // Origem: 2 perícias (exceto Amnésico que é variável)
  // Classe: depende da fórmula
  const origin = getOriginById(character.origin);
  const originSkillCount = origin?.id === 'amnesico' ? 2 : (origin?.skills?.length || 2);
  
  const freeSkillFormula = CLASS_FREE_SKILLS_FORMULA[characterClass];
  const classSkillsBase = freeSkillFormula ? freeSkillFormula(intellect) : 0;
  
  // Perícias adicionais do poder "Treinamento em Perícia" (2 por instância)
  const skillTrainingPowers = countSkillTrainingPowers(character.abilities);
  const additionalSkills = skillTrainingPowers * 2;
  
  // Total esperado (considerando sobreposição entre origem e classe)
  // Nota: Não subtraímos sobreposição porque o sistema de criação já lida com conflitos
  const expectedTrained = originSkillCount + classSkillsBase + additionalSkills;
  
  // Verificar discrepância significativa (apenas se houver MENOS perícias que o esperado)
  // Ter mais é permitido (via poderes ou outros bônus)
  if (totalTrained < expectedTrained - 2) {
    issues.push({
      id: `low_trained_skills_${character.id}`,
      category: 'skill_training',
      severity: 'info',
      title: 'Perícias Treinadas Abaixo do Esperado',
      description: `O personagem tem ${totalTrained} perícias treinadas, mas esperava-se pelo menos ${expectedTrained} (${originSkillCount} origem + ${classSkillsBase} classe${additionalSkills > 0 ? ` + ${additionalSkills} de poderes` : ''}). Verifique se todas as perícias foram escolhidas.`,
      currentValue: totalTrained,
      expectedValue: expectedTrained,
      autoFixable: false,
      fixAction: 'Verificar seleção de perícias na criação do personagem',
    });
  }
  
  return {
    issues,
    summary: {
      totalTrained,
      expectedTrained,
      veteranCount,
      expertCount,
      validVeteran,
      validExpert,
      pendingGradeChoices,
    },
  };
}

/**
 * Audita quantidade de rituais do Ocultista
 * Verifica se o personagem excede o limite permitido pelo NEX
 */
export function auditRitualsCount(character: CharacterForAudit): { issues: AuditIssue[] } {
  const issues: AuditIssue[] = [];
  
  // Só Ocultistas têm limite de rituais
  if (character.class !== 'Ocultista') {
    return { issues };
  }
  
  const rituals = character.rituals || [];
  const limits = getOcultistRituals(character.nex);
  
  if (!limits) {
    return { issues };
  }
  
  const maxRituals = limits.count;
  const currentCount = rituals.length;
  const excessRituals = currentCount - maxRituals;
  
  if (excessRituals > 0) {
    issues.push({
      id: `excess_rituals_${character.id}`,
      category: 'rituals',
      severity: 'error',
      title: 'Rituais Excedentes',
      description: `O personagem tem ${currentCount} rituais, mas deveria ter no máximo ${maxRituals} (limite para NEX ${character.nex}%). Excesso de ${excessRituals} ritual(is).`,
      currentValue: currentCount,
      expectedValue: maxRituals,
      autoFixable: false,
      fixAction: 'Clique em "Remover Rituais" para escolher quais rituais excedentes deseja remover',
    });
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
  issues: AuditIssue[],
  characterData?: {
    paranormal_powers?: Array<{ id: string; name: string }>;
    nex?: number;
    origin?: string;
    skills?: Record<string, number>;  // Perícias atuais para correção de níveis
  }
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
  
  // Preparar updates para stats
  const updates: Record<string, number | Record<string, number>> = {};
  
  // Coletar correções de perícias separadamente
  const skillFixes: Array<{ skillId: string; newLevel: number }> = [];
  
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
        
      case 'records':
        // Sincronizar registros de Transcender para poderes legados
        if (issue.id.startsWith('unregistered_powers_') && characterData) {
          const powers = characterData.paranormal_powers || [];
          const nex = characterData.nex || 5;
          const origin = characterData.origin || '';
          
          if (powers.length > 0) {
            console.log('[AutoFix] Sincronizando registros de Transcender...');
            const syncResult = await syncTranscenderRecords(
              characterId,
              userId,
              powers,
              nex,
              origin
            );
            
            if (syncResult.created > 0) {
              appliedFixes.push(`${syncResult.created} registro(s) de Transcender sincronizado(s)`);
            }
            
            if (syncResult.errors.length > 0) {
              errors.push(...syncResult.errors);
            }
          }
        }
        break;
        
      case 'skill_training':
        // Rebaixar níveis de perícia inválidos
        if (issue.id.startsWith('invalid_veteran_nex_') || issue.id.startsWith('invalid_expert_nex_')) {
          // Extrair skillId do ID do problema (ex: invalid_veteran_nex_medicina)
          const skillId = issue.id.replace('invalid_veteran_nex_', '').replace('invalid_expert_nex_', '');
          const newLevel = issue.expectedValue as number;
          skillFixes.push({ skillId, newLevel });
          appliedFixes.push(`${skillId} rebaixado para nível ${newLevel}`);
        }
        break;
    }
  }
  
  // Aplicar correções de perícias se houver
  if (skillFixes.length > 0 && characterData?.skills) {
    const updatedSkills = { ...characterData.skills };
    for (const fix of skillFixes) {
      updatedSkills[fix.skillId] = fix.newLevel;
    }
    updates.skills = updatedSkills;
  }
  
  // Aplicar updates no banco (stats)
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
  // Nota: Não temos acesso a abilities neste contexto, então não aplicamos penalidade de Transcender
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

/**
 * Sincroniza registros de Transcender para poderes legados
 * Cria registros retroativos para poderes que não têm entrada em character_power_choices
 * 
 * IMPORTANTE: Esta função deve ser usada com cuidado - apenas para personagens
 * criados antes do sistema de Transcender ser implementado.
 */
export async function syncTranscenderRecords(
  characterId: string,
  userId: string,
  powers: Array<{ id: string; name: string }>,
  nex: number,
  originId: string
): Promise<{ created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  
  try {
    // Buscar registros existentes
    const { data: existingRecords, error: fetchError } = await supabase
      .from('character_power_choices')
      .select('resolution')
      .eq('character_id', characterId)
      .eq('status', 'resolved');
    
    if (fetchError) {
      console.error('[syncTranscenderRecords] Erro ao buscar registros:', fetchError);
      return { created: 0, errors: [fetchError.message] };
    }
    
    // Extrai IDs dos poderes já registrados
    const registeredPowerIds = new Set<string>();
    existingRecords?.forEach(record => {
      const resolution = record.resolution as { powerId?: string } | null;
      if (resolution?.powerId) {
        registeredPowerIds.add(resolution.powerId);
      }
    });
    
    // Identifica poderes sem registro
    const unregisteredPowers = powers.filter(p => !registeredPowerIds.has(p.id));
    
    if (unregisteredPowers.length === 0) {
      console.log('[syncTranscenderRecords] Todos os poderes já têm registro');
      return { created: 0, errors: [] };
    }
    
    // Obtém milestones de Transcender para atribuir NEX retroativamente
    const milestones = getPowerChoiceMilestones();
    const usedMilestones = existingRecords?.length || 0;
    
    // Verifica se origem concede poder (Cultista Arrependido)
    const origin = getOriginById(originId);
    const originGrantsPower = origin?.id === 'cultista-arrependido';
    
    // Cria registros para cada poder não registrado
    for (let i = 0; i < unregisteredPowers.length; i++) {
      const power = unregisteredPowers[i];
      
      // Primeiro poder de Cultista Arrependido não usa slot de Transcender
      const isOriginPower = originGrantsPower && i === 0 && !registeredPowerIds.size;
      
      // Determina o NEX do milestone para este registro
      const milestoneIndex = usedMilestones + i - (isOriginPower ? 1 : 0);
      const assignedNex = milestoneIndex >= 0 && milestoneIndex < milestones.length
        ? milestones[milestoneIndex]
        : nex;
      
      const { error: insertError } = await supabase
        .from('character_power_choices')
        .insert({
          character_id: characterId,
          user_id: userId,
          nex: assignedNex,
          choice_type: isOriginPower ? 'origin_power' : 'transcender_legacy',
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          sanity_delta: 0, // Não afeta sanidade retroativamente
          resolution: {
            powerId: power.id,
            powerName: power.name,
            legacySync: true,
            syncedAt: new Date().toISOString(),
          },
        });
      
      if (insertError) {
        console.error('[syncTranscenderRecords] Erro ao criar registro:', insertError);
        errors.push(`Erro ao registrar ${power.name}: ${insertError.message}`);
      } else {
        created++;
        console.log(`[syncTranscenderRecords] Registro criado para: ${power.name} (NEX ${assignedNex})`);
      }
    }
    
    return { created, errors };
  } catch (err) {
    console.error('[syncTranscenderRecords] Erro geral:', err);
    return { created: 0, errors: [err instanceof Error ? err.message : 'Erro desconhecido'] };
  }
}
