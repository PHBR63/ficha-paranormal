// Ordem Paranormal RPG v1.3 - Character Builder Engine
// Motor de regras para criação de personagem 100% fiel às regras oficiais

import { ORIGINS, CLASSES, SKILLS, calculateDerivedStats, getPatentByNex, calculateDefense, getExtraAttributePoints } from './character-data';

// ============= TYPES =============

export interface AttributeAllocation {
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
}

export interface SkillChoice {
  id: string;
  options: string[];
  pick: number;
  label: string;
}

export interface ClassSkillRules {
  mandatory: string[];
  choices: SkillChoice[];
  freePoints: number;
}

export interface SkillConflict {
  skillId: string;
  source: 'origin' | 'class';
  needsResolution: boolean;
}

export interface CharacterBuildState {
  name: string;
  playerName: string;
  concept: string;
  age: number | null;
  gender: string;
  appearance: string;
  personality: string;
  origin: string;
  characterClass: string;
  nex: number;
  patent: string; // Patente selecionada manualmente (independente do NEX)
  attributes: AttributeAllocation;
  originSkills: string[];
  classSkillChoices: Record<string, string>;
  freeSkills: string[];
  conflictResolutions: Record<string, string>;
  powers: Array<{ name: string; description: string }>;
  background: string;
}

export interface RebuildResult {
  attributes: AttributeAllocation;
  originSkills: string[];
  classSkills: {
    mandatory: string[];
    fromChoices: string[];
    free: string[];
  };
  allTrainedSkills: string[];
  conflicts: SkillConflict[];
  derivedStats: { hp: number; pe: number; san: number };
  defense: number;
  movement: number;
  proficiencies: string[];
  powers: Array<{ name: string; description: string }>;
  abilities: string[];
  patent: string;
  canFinalize: boolean;
  pendingChoices: SkillChoice[];
  pendingConflicts: string[];
}

// ============= CLASS SKILL RULES =============

export const CLASS_SKILL_RULES: Record<string, {
  mandatory: string[];
  choices: SkillChoice[];
  freeFormula: (intellect: number) => number;
}> = {
  'Combatente': {
    mandatory: [],
    choices: [
      { id: 'combat', options: ['luta', 'pontaria'], pick: 1, label: 'Luta ou Pontaria' },
      { id: 'defense', options: ['fortitude', 'reflexos'], pick: 1, label: 'Fortitude ou Reflexos' },
    ],
    freeFormula: (int) => 1 + int,
  },
  'Especialista': {
    mandatory: [],
    choices: [],
    freeFormula: (int) => 7 + int,
  },
  'Ocultista': {
    mandatory: ['ocultismo', 'vontade'],
    choices: [],
    freeFormula: (int) => 3 + int,
  },
  // Nova classe do suplemento "Sobrevivendo ao Horror"
  'Sobrevivente': {
    mandatory: ['sobrevivencia'],
    choices: [
      { id: 'survival', options: ['fortitude', 'reflexos'], pick: 1, label: 'Fortitude ou Reflexos' },
      { id: 'awareness', options: ['percepcao', 'intuicao'], pick: 1, label: 'Percepção ou Intuição' },
    ],
    freeFormula: (int) => 4 + int,
  },
};

// ============= CLASS PROFICIENCIES =============

export const CLASS_PROFICIENCIES: Record<string, string[]> = {
  'Combatente': ['Armas simples', 'Armas táticas', 'Proteções leves'],
  'Especialista': ['Armas simples', 'Proteções leves'],
  'Ocultista': ['Armas simples'],
  'Sobrevivente': ['Armas simples', 'Armas improvisadas'], // Suplemento
};

// ============= CLASS INITIAL ABILITIES (NEX 5%) =============

// Habilidades iniciais da classe - nome correto conforme livro de regras
export const CLASS_INITIAL_ABILITIES: Record<string, string[]> = {
  'Combatente': ['Ataque Especial (2 PE, +5 no ataque ou dano)'],
  'Especialista': [
    'Eclético (2 PE para ser considerado treinado em qualquer perícia)',
    'Perito (2 PE para somar +1d6 em teste de 2 perícias escolhidas)'
  ],
  'Ocultista': ['Escolhido pelo Outro Lado (pode lançar rituais)'],
  'Sobrevivente': [
    'Vontade de Viver (2 PE, ficar com 1 PV ao invés de 0, 1x/cena)',
    'Improviso (armas improvisadas causam 1d6 dano)'
  ],
};

// ============= SKILLS WITH TRAINING REQUIREMENT =============

export const SKILLS_REQUIRING_TRAINING = [
  'crime', 'medicina', 'ocultismo', 'pilotagem', 'tatica', 'tecnologia'
];

// ============= ORIGIN TABLE FOR 2d20 ROLL =============

export const ORIGIN_TABLE: Array<{ min: number; max: number; originId: string }> = [
  { min: 2, max: 2, originId: 'academico' },
  { min: 3, max: 3, originId: 'agente-de-saude' },
  { min: 4, max: 4, originId: 'amnésico' },
  { min: 5, max: 5, originId: 'artista' },
  { min: 6, max: 6, originId: 'atleta' },
  { min: 7, max: 7, originId: 'chef' },
  { min: 8, max: 9, originId: 'criminoso' },
  { min: 10, max: 10, originId: 'cultista-arrependido' },
  { min: 11, max: 11, originId: 'desgarrado' },
  { min: 12, max: 12, originId: 'diplomata' },
  { min: 13, max: 13, originId: 'engenheiro' },
  { min: 14, max: 14, originId: 'executivo' },
  { min: 15, max: 16, originId: 'investigador' },
  { min: 17, max: 17, originId: 'lutador' },
  { min: 18, max: 19, originId: 'militar' },
  { min: 20, max: 20, originId: 'operario' },
  { min: 21, max: 22, originId: 'policial' },
  { min: 23, max: 23, originId: 'religioso' },
  { min: 24, max: 24, originId: 'servidor-publico' },
  { min: 25, max: 26, originId: 'teorico-da-conspiracao' },
  { min: 27, max: 28, originId: 'ti' },
  { min: 29, max: 29, originId: 'trabalhador-rural' },
  { min: 30, max: 31, originId: 'trambiqueiro' },
  { min: 32, max: 33, originId: 'universitario' },
  { min: 34, max: 40, originId: 'vitima' },
];

// ============= VALIDATION FUNCTIONS =============

/**
 * Valida a distribuição de atributos
 * REGRA DO LIVRO:
 * - Todo agente começa com 1 em cada atributo (5 pontos base já distribuídos)
 * - Você tem 4 pontos adicionais para distribuir
 * - Pode reduzir UM atributo para 0, liberando 1 ponto extra (total 5 para distribuir)
 * - Bônus NEX: pontos extras baseados no nível de exposição
 * - Limite máximo por atributo depende do NEX
 */
export function validateAttributes(allocation: AttributeAllocation, nex: number = 5): {
  valid: boolean;
  pool: number;
  usedPoints: number;
  remainingPoints: number;
  errors: string[];
} {
  const errors: string[] = [];
  const values = Object.values(allocation);
  
  // Verificar se algum está abaixo de 0
  if (values.some(v => v < 0)) {
    errors.push('Nenhum atributo pode ser menor que 0.');
  }
  
  // Verificar se mais de um atributo está em 0 (não permitido)
  const zeroCount = values.filter(v => v === 0).length;
  if (zeroCount > 1) {
    errors.push('Apenas um atributo pode ser reduzido para 0.');
  }
  
  // Limite máximo na criação depende do NEX
  const maxAttribute = getMaxAttributeByNex(nex);
  if (values.some(v => v > maxAttribute)) {
    errors.push(`Com NEX ${nex}%, nenhum atributo pode ser maior que ${maxAttribute}.`);
  }
  
  // Adicionar pontos extras por NEX
  const nexBonus = getExtraAttributePoints(nex);
  
  // Pool base = 4 pontos para distribuir além do 1 inicial em cada
  // Total esperado (sem zero): 5 (base) + 4 (pool) + NEX bonus = 9 + NEX
  // Se um atributo está em 0: o ponto que estava ali pode ser redistribuído
  // Então o total ainda é 9 + NEX (a soma de todos os valores)
  const basePool = 4;
  const pool = basePool + nexBonus;
  
  // Cálculo correto:
  // - Base inicial = 5 (1 em cada atributo)
  // - Pool para distribuir = 4 + NEX bonus
  // - Se um atributo foi reduzido a 0, você "libera" o 1 ponto que estava nele
  // - Portanto, o total máximo de pontos distribuídos = 5 + 4 + NEX = 9 + NEX
  // - Se usou a regra do zero, um dos "1" base virou 0, mas o ponto foi para outro lugar
  // - O total de pontos em atributos sempre deve ser: 5 + pool = 5 + 4 + NEX = 9 + NEX
  //   (a menos que use regra do zero, onde seria 4 + 5 + NEX = 9 + NEX - mesma coisa!)
  
  const totalActual = values.reduce((a, b) => a + b, 0);
  const maxTotal = 5 + pool; // 5 base + 4 pool + NEX bonus
  
  // Pontos restantes = quanto falta para atingir o máximo
  const remainingPoints = maxTotal - totalActual;
  
  return {
    valid: errors.length === 0 && remainingPoints === 0,
    pool,
    usedPoints: totalActual - 5, // Pontos usados além da base (pode ser negativo se alguém tem 0)
    remainingPoints: Math.max(0, remainingPoints),
    errors,
  };
}

/**
 * Retorna o valor máximo de atributo permitido baseado no NEX
 * Exportada para uso em outros componentes
 */
export function getMaxAttributeByNex(nex: number): number {
  // Na criação (NEX 5%) o máximo é 3
  // A cada avanço de NEX, o limite pode aumentar (regra do livro)
  // Por simplicidade: NEX 5-15% = 3, NEX 20-35% = 4, NEX 40%+ = 5
  if (nex <= 15) return 3;
  if (nex <= 35) return 4;
  return 5;
}

/**
 * Obtém as perícias da origem (normaliza para IDs)
 */
export function getOriginSkills(originId: string): string[] {
  const origin = ORIGINS.find(o => o.id === originId);
  if (!origin) return [];
  
  // Caso especial: Amnésico pode escolher 2 perícias
  if (originId === 'amnésico') {
    return []; // Retorna vazio, usuário escolhe
  }
  
  // Normalizar nomes para IDs
  return origin.skills.map(skillName => {
    const skill = SKILLS.find(s => 
      s.name.toLowerCase() === skillName.toLowerCase()
    );
    return skill?.id || skillName.toLowerCase().replace(/\s+/g, '-');
  });
}

/**
 * Obtém as regras de perícias da classe
 */
export function getClassSkillRules(classId: string, intellect: number): ClassSkillRules {
  const rules = CLASS_SKILL_RULES[classId];
  if (!rules) {
    return { mandatory: [], choices: [], freePoints: 0 };
  }
  
  return {
    mandatory: rules.mandatory,
    choices: rules.choices,
    freePoints: Math.max(0, rules.freeFormula(intellect)),
  };
}

/**
 * Detecta conflitos entre perícias de origem e classe
 */
export function detectSkillConflicts(
  originSkills: string[],
  classMandatorySkills: string[],
  classChoiceSkills: string[]
): SkillConflict[] {
  const conflicts: SkillConflict[] = [];
  
  // Verificar se perícias obrigatórias da classe já estão na origem
  for (const skillId of classMandatorySkills) {
    if (originSkills.includes(skillId)) {
      conflicts.push({
        skillId,
        source: 'class',
        needsResolution: true,
      });
    }
  }
  
  return conflicts;
}

/**
 * Rola a idade do personagem (2d6 + 15)
 */
export function rollAge(): { dice: number[]; result: number } {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return {
    dice: [d1, d2],
    result: d1 + d2 + 15,
  };
}

/**
 * Rola origem aleatória (2d20, soma)
 */
export function rollOrigin(): { dice: number[]; total: number; originId: string } {
  const d1 = Math.floor(Math.random() * 20) + 1;
  const d2 = Math.floor(Math.random() * 20) + 1;
  const total = d1 + d2;
  
  const entry = ORIGIN_TABLE.find(e => total >= e.min && total <= e.max);
  const originId = entry?.originId || 'vitima'; // Fallback para Vítima
  
  return { dice: [d1, d2], total, originId };
}

/**
 * Pipeline principal: reconstrói a ficha completa a partir do estado
 */
export function rebuildCharacterSheet(state: CharacterBuildState): RebuildResult {
  // 1. Validar atributos (passando NEX para considerar pontos extras)
  const attrValidation = validateAttributes(state.attributes, state.nex);
  
  // 2. Obter perícias da origem
  const originSkills = state.origin ? getOriginSkills(state.origin) : [];
  
  // 3. Obter regras de perícias da classe
  const classRules = state.characterClass 
    ? getClassSkillRules(state.characterClass, state.attributes.intellect)
    : { mandatory: [], choices: [], freePoints: 0 };
  
  // 4. Perícias da classe vindas de escolhas
  // Nota: Aceita qualquer perícia válida em classSkillChoices,
  // incluindo escolhas alternativas quando há conflito com origem
  const classSkillsFromChoices: string[] = [];
  for (const choice of classRules.choices) {
    const selected = state.classSkillChoices[choice.id];
    if (selected) {
      // Se o usuário escolheu uma perícia (seja das opções ou alternativa),
      // ela deve ser incluída. A validação é feita na UI.
      classSkillsFromChoices.push(selected);
    }
  }
  
  // 5. Detectar conflitos
  const conflicts = detectSkillConflicts(
    originSkills,
    classRules.mandatory,
    classSkillsFromChoices
  );
  
  // 6. Calcular todas as perícias treinadas
  const allTrainedSkills = new Set<string>();
  
  // Adicionar perícias da origem
  originSkills.forEach(s => allTrainedSkills.add(s));
  
  // Adicionar perícias obrigatórias da classe (se não houver conflito)
  for (const skillId of classRules.mandatory) {
    if (!originSkills.includes(skillId)) {
      allTrainedSkills.add(skillId);
    } else {
      // Conflito: usar resolução se existir
      const resolution = state.conflictResolutions[skillId];
      if (resolution) {
        allTrainedSkills.add(resolution);
      }
    }
  }
  
  // Adicionar perícias das escolhas
  classSkillsFromChoices.forEach(s => allTrainedSkills.add(s));
  
  // Adicionar perícias livres
  state.freeSkills.forEach(s => allTrainedSkills.add(s));
  
  // 7. Calcular stats derivados
  const derivedStats = state.characterClass
    ? calculateDerivedStats(
        state.characterClass,
        state.attributes.vigor,
        state.attributes.presence,
        state.nex,
        state.origin
      )
    : { hp: 0, pe: 0, san: 0 };
  
  // 8. Proficiências
  const proficiencies = CLASS_PROFICIENCIES[state.characterClass] || [];
  
  // 9. Habilidades iniciais
  const abilities = CLASS_INITIAL_ABILITIES[state.characterClass] || [];
  
  // 10. Poderes da origem
  const origin = ORIGINS.find(o => o.id === state.origin);
  const originPowers = origin?.powers.map(p => ({
    name: p,
    description: origin.powerDescription || '',
  })) || [];
  
  // 11. Verificar choices pendentes
  const pendingChoices = classRules.choices.filter(
    choice => !state.classSkillChoices[choice.id]
  );
  
  // 12. Verificar conflitos pendentes
  const pendingConflicts = conflicts
    .filter(c => c.needsResolution && !state.conflictResolutions[c.skillId])
    .map(c => c.skillId);
  
  // 13. Pode finalizar?
  const canFinalize = 
    state.name.trim().length >= 2 &&
    state.origin !== '' &&
    state.characterClass !== '' &&
    attrValidation.valid &&
    attrValidation.remainingPoints === 0 &&
    pendingChoices.length === 0 &&
    pendingConflicts.length === 0;
  
  return {
    attributes: state.attributes,
    originSkills,
    classSkills: {
      mandatory: classRules.mandatory,
      fromChoices: classSkillsFromChoices,
      free: state.freeSkills,
    },
    allTrainedSkills: Array.from(allTrainedSkills),
    conflicts,
    derivedStats,
    defense: calculateDefense(state.attributes.agility),
    movement: 9, // Base padrão
    proficiencies,
    powers: [...originPowers, ...state.powers],
    abilities,
    patent: state.patent || 'Recruta', // Usar patente selecionada manualmente
    canFinalize,
    pendingChoices,
    pendingConflicts,
  };
}

/**
 * Converte o estado de build para o formato do FormData original
 */
export function buildStateToFormData(state: CharacterBuildState): Record<string, number> {
  const skills: Record<string, number> = {};
  
  // Marcar todas as perícias treinadas como nível 1
  const result = rebuildCharacterSheet(state);
  for (const skillId of result.allTrainedSkills) {
    skills[skillId] = 1;
  }
  
  return skills;
}
