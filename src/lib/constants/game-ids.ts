/**
 * Ordem Paranormal RPG - IDs Centralizados do Sistema
 * 
 * FONTE DA VERDADE para todos os IDs usados no sistema.
 * Qualquer validação, UI ou lógica de negócio deve importar deste arquivo.
 * 
 * REGRA DE CONECTIVIDADE:
 * - Nunca criar IDs duplicados em outros arquivos
 * - Sempre importar deste arquivo para garantir consistência
 * - IDs devem ser kebab-case e sem acentos
 */

// ============================================
// CLASSES
// ============================================

/**
 * IDs das classes do sistema (com inicial maiúscula conforme usado no banco)
 * Usados em: formData.characterClass, CLASS_TRACKS.classId
 */
export const CLASS_IDS = {
  COMBATENTE: 'Combatente',
  ESPECIALISTA: 'Especialista',
  OCULTISTA: 'Ocultista',
} as const;

/**
 * Array de IDs de classes válidas
 */
export const VALID_CLASS_IDS = Object.values(CLASS_IDS);

/**
 * Tipo para IDs de classes
 */
export type ClassId = typeof CLASS_IDS[keyof typeof CLASS_IDS];

// ============================================
// TRILHAS (TRACKS)
// ============================================

/**
 * IDs das trilhas do Combatente
 */
export const COMBATENTE_TRACK_IDS = {
  ANIQUILADOR: 'aniquilador',
  COMANDANTE_CAMPO: 'comandante-campo',
  GUERREIRO: 'guerreiro',
  OPERACOES_ESPECIAIS: 'operacoes-especiais',
  TROPA_CHOQUE: 'tropa-choque',
} as const;

/**
 * IDs das trilhas do Especialista
 */
export const ESPECIALISTA_TRACK_IDS = {
  ATIRADOR_ELITE: 'atirador-elite',
  INFILTRADOR: 'infiltrador',
  MEDICO_CAMPO: 'medico-campo',
  NEGOCIADOR: 'negociador',
  TECNICO: 'tecnico',
} as const;

/**
 * IDs das trilhas do Ocultista
 */
export const OCULTISTA_TRACK_IDS = {
  CONDUTOR: 'condutor',
  FLAGELADOR: 'flagelador',
  GRADUADO: 'graduado',
  INTUITIVO: 'intuitivo',
  LAMINA_PARANORMAL: 'lamina-paranormal',
} as const;

/**
 * Mapa de trilhas por classe (chaves em minúsculas para normalização)
 */
export const TRACKS_BY_CLASS = {
  combatente: Object.values(COMBATENTE_TRACK_IDS),
  especialista: Object.values(ESPECIALISTA_TRACK_IDS),
  ocultista: Object.values(OCULTISTA_TRACK_IDS),
} as const;

/**
 * Array de todas as trilhas válidas
 */
export const ALL_TRACK_IDS = [
  ...Object.values(COMBATENTE_TRACK_IDS),
  ...Object.values(ESPECIALISTA_TRACK_IDS),
  ...Object.values(OCULTISTA_TRACK_IDS),
] as const;

/**
 * Tipo para IDs de trilhas
 */
export type TrackId = typeof ALL_TRACK_IDS[number];

// ============================================
// ORIGENS (ORIGINS)
// ============================================

/**
 * IDs das origens do livro base (26 origens)
 */
export const CORE_ORIGIN_IDS = {
  ACADEMICO: 'academico',
  AGENTE_DE_SAUDE: 'agente-de-saude',
  AMNESICO: 'amnesico',
  ARTISTA: 'artista',
  ATLETA: 'atleta',
  CHEF: 'chef',
  CRIMINOSO: 'criminoso',
  CULTISTA_ARREPENDIDO: 'cultista-arrependido',
  DESGARRADO: 'desgarrado',
  ENGENHEIRO: 'engenheiro',
  EXECUTIVO: 'executivo',
  INVESTIGADOR: 'investigador',
  LUTADOR: 'lutador',
  MAGNATA: 'magnata',
  MERCENARIO: 'mercenario',
  MILITAR: 'militar',
  OPERARIO: 'operario',
  POLICIAL: 'policial',
  RELIGIOSO: 'religioso',
  SERVIDOR_PUBLICO: 'servidor-publico',
  TI: 'ti',
  TEORICO_DA_CONSPIRACAO: 'teorico-da-conspiracao',
  TRABALHADOR_RURAL: 'trabalhador-rural',
  TRAMBIQUEIRO: 'trambiqueiro',
  UNIVERSITARIO: 'universitario',
  VITIMA: 'vitima',
} as const;

/**
 * IDs das origens de suplementos/expansões (18 origens)
 * Fontes: Arsenal Paranormal, Ateliê Secreto, A Passagem, 
 * Arquivos Confidenciais, Grimório Paranormal, C.R.I.S., 
 * Missões Ordem, Remate Paranormal, Toca dos Monstros, 
 * Arquivo do Medo e Comunidade
 * 
 * Sincronizado com: src/lib/supplement-origins.ts
 */
export const SUPPLEMENT_ORIGIN_IDS = {
  // Expansões Oficiais
  AMIGO_DOS_ANIMAIS: 'amigo-dos-animais',       // Arsenal Paranormal
  ASTRONAUTA: 'astronauta',                     // Expansão Oficial
  CHEF_DO_OUTRO_LADO: 'chef-do-outro-lado',     // Ateliê Secreto
  
  // Comunidade e Outros Suplementos
  COLEGIAL: 'colegial',                         // Comunidade
  COSPLAYER: 'cosplayer',                       // Toca dos Monstros
  DIPLOMATA: 'diplomata',                       // Comunidade
  EXPLORADOR: 'explorador',                     // Arquivo do Medo
  EXPERIMENTO: 'experimento',                   // Comunidade
  FANATICO_POR_CRIATURAS: 'fanatico-por-criaturas', // Grimório Paranormal
  FOTOGRAFO: 'fotografo',                       // Comunidade
  INVENTOR_PARANORMAL: 'inventor-paranormal',   // C.R.I.S.
  JOVEM_MISTICO: 'jovem-mistico',               // A Passagem
  LEGISTA_TURNO_NOITE: 'legista-turno-noite',   // Arquivos Confidenciais
  MOTORISTA: 'motorista',                       // Comunidade
  NERD_ENTUSIASTA: 'nerd-entusiasta',           // Remate Paranormal
  PSICOLOGO: 'psicologo',                       // Missões Ordem
  PROFETIZADO: 'profetizado',                   // Comunidade
  REPORTER_INVESTIGATIVO: 'reporter-investigativo', // Comunidade
} as const;

/**
 * Array de todas as origens do livro base
 */
export const VALID_CORE_ORIGIN_IDS = Object.values(CORE_ORIGIN_IDS);

/**
 * Array de todas as origens de suplementos
 */
export const VALID_SUPPLEMENT_ORIGIN_IDS = Object.values(SUPPLEMENT_ORIGIN_IDS);

/**
 * Array de todas as origens válidas (base + suplementos)
 */
export const ALL_ORIGIN_IDS = [
  ...VALID_CORE_ORIGIN_IDS,
  ...VALID_SUPPLEMENT_ORIGIN_IDS,
] as const;

/**
 * Tipo para IDs de origens
 */
export type OriginId = typeof ALL_ORIGIN_IDS[number];

// ============================================
// PATENTES (RANKS)
// ============================================

/**
 * IDs das patentes da Ordem
 */
export const PATENT_IDS = {
  RECRUTA: 'Recruta',
  OPERADOR: 'Operador',
  AGENTE_ESPECIAL: 'Agente Especial',
  OFICIAL_DE_OPERACOES: 'Oficial de Operações',
  AGENTE_DE_ELITE: 'Agente de Elite',
} as const;

/**
 * Array de patentes válidas
 */
export const VALID_PATENT_IDS = Object.values(PATENT_IDS);

/**
 * Tipo para IDs de patentes
 */
export type PatentId = typeof PATENT_IDS[keyof typeof PATENT_IDS];

// ============================================
// NEX (NÍVEIS DE EXPERIÊNCIA)
// ============================================

/**
 * Valores de NEX válidos (5% a 99%)
 */
export const VALID_NEX_VALUES = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 
  55, 60, 65, 70, 75, 80, 85, 90, 95, 99
] as const;

/**
 * Tipo para valores de NEX
 */
export type NexValue = typeof VALID_NEX_VALUES[number];

/**
 * Chaves para armazenamento de escolhas de Grau de Treinamento
 * Usadas em: training_grade_choices no banco de dados
 * Formato JSON: { "nex35": [...], "nex70": [...] }
 */
export const TRAINING_GRADE_KEYS = {
  NEX_35: 'nex35',
  NEX_70: 'nex70',
} as const;

/**
 * Chaves legadas para compatibilidade retroativa
 * @deprecated Use TRAINING_GRADE_KEYS
 */
export const LEGACY_TRAINING_GRADE_KEYS = {
  NEX_35: '35',
  NEX_70: '70',
} as const;

/**
 * Tipo para chaves de Grau de Treinamento
 */
export type TrainingGradeKey = typeof TRAINING_GRADE_KEYS[keyof typeof TRAINING_GRADE_KEYS];

/**
 * Retorna a chave de Grau de Treinamento baseada no NEX atual
 * @param nex - Valor de NEX do personagem (5-99)
 * @returns A chave correspondente ('nex35' ou 'nex70') ou null se NEX não atingiu nenhum marco
 * 
 * @example
 * getTrainingGradeKey(35) // 'nex35'
 * getTrainingGradeKey(70) // 'nex70'
 * getTrainingGradeKey(50) // 'nex35' (já passou do marco 35, ainda não chegou no 70)
 * getTrainingGradeKey(20) // null (ainda não atingiu nenhum marco)
 */
export function getTrainingGradeKey(nex: number): TrainingGradeKey | null {
  if (nex >= 70) return TRAINING_GRADE_KEYS.NEX_70;
  if (nex >= 35) return TRAINING_GRADE_KEYS.NEX_35;
  return null;
}

/**
 * Retorna a chave de Grau de Treinamento exata para um marco específico
 * Útil quando você sabe exatamente qual marco está processando
 * @param nexMilestone - Marco de NEX (35 ou 70)
 * @returns A chave correspondente ou null se não for um marco válido
 */
export function getTrainingGradeKeyForMilestone(nexMilestone: 35 | 70): TrainingGradeKey {
  return nexMilestone === 35 ? TRAINING_GRADE_KEYS.NEX_35 : TRAINING_GRADE_KEYS.NEX_70;
}

// ============================================
// PERÍCIAS (SKILLS)
// ============================================

/**
 * IDs de todas as perícias do sistema
 */
export const SKILL_IDS = {
  // Baseadas em Agilidade
  ACROBACIA: 'acrobacia',
  CRIME: 'crime',
  FURTIVIDADE: 'furtividade',
  PILOTAGEM: 'pilotagem',
  PONTARIA: 'pontaria',
  REFLEXOS: 'reflexos',
  
  // Baseadas em Força
  ATLETISMO: 'atletismo',
  LUTA: 'luta',
  
  // Baseadas em Intelecto
  ATUALIDADES: 'atualidades',
  CIENCIAS: 'ciencias',
  INVESTIGACAO: 'investigacao',
  MEDICINA: 'medicina',
  OCULTISMO: 'ocultismo',
  PROFISSAO: 'profissao',
  TATICA: 'tatica',
  TECNOLOGIA: 'tecnologia',
  
  // Baseadas em Presença
  ADESTRAMENTO: 'adestramento',
  ARTES: 'artes',
  DIPLOMACIA: 'diplomacia',
  ENGANACAO: 'enganacao',
  INTIMIDACAO: 'intimidacao',
  INTUICAO: 'intuicao',
  PERCEPCAO: 'percepcao',
  RELIGIAO: 'religiao',
  SOBREVIVENCIA: 'sobrevivencia',
  VONTADE: 'vontade',
  
  // Baseada em Vigor
  FORTITUDE: 'fortitude',
  
  // Especial
  INICIATIVA: 'iniciativa',
} as const;

/**
 * Array de todas as perícias válidas
 */
export const VALID_SKILL_IDS = Object.values(SKILL_IDS);

/**
 * Tipo para IDs de perícias
 */
export type SkillId = typeof SKILL_IDS[keyof typeof SKILL_IDS];

// ============================================
// PERÍCIAS POR ATRIBUTO
// ============================================

/**
 * Mapeamento de perícias por atributo
 */
export const SKILLS_BY_ATTRIBUTE = {
  agility: [
    SKILL_IDS.ACROBACIA,
    SKILL_IDS.CRIME,
    SKILL_IDS.FURTIVIDADE,
    SKILL_IDS.PILOTAGEM,
    SKILL_IDS.PONTARIA,
    SKILL_IDS.REFLEXOS,
  ],
  strength: [
    SKILL_IDS.ATLETISMO,
    SKILL_IDS.LUTA,
  ],
  intellect: [
    SKILL_IDS.ATUALIDADES,
    SKILL_IDS.CIENCIAS,
    SKILL_IDS.INVESTIGACAO,
    SKILL_IDS.MEDICINA,
    SKILL_IDS.OCULTISMO,
    SKILL_IDS.PROFISSAO,
    SKILL_IDS.SOBREVIVENCIA,
    SKILL_IDS.TATICA,
    SKILL_IDS.TECNOLOGIA,
  ],
  presence: [
    SKILL_IDS.ADESTRAMENTO,
    SKILL_IDS.ARTES,
    SKILL_IDS.DIPLOMACIA,
    SKILL_IDS.ENGANACAO,
    SKILL_IDS.INTIMIDACAO,
    SKILL_IDS.INTUICAO,
    SKILL_IDS.PERCEPCAO,
    SKILL_IDS.RELIGIAO,
    SKILL_IDS.VONTADE,
  ],
  vigor: [
    SKILL_IDS.FORTITUDE,
  ],
} as const;

/**
 * Perícias de Intelecto (usadas em poderes paranormais como "Expansão de Conhecimento")
 */
export const INTELLECT_SKILL_IDS = SKILLS_BY_ATTRIBUTE.intellect;

/**
 * Tipo para atributos
 */
export type AttributeKey = keyof typeof SKILLS_BY_ATTRIBUTE;

// ============================================
// ELEMENTOS PARANORMAIS
// ============================================

/**
 * IDs dos elementos paranormais
 */
export const ELEMENT_IDS = {
  SANGUE: 'Sangue',
  MORTE: 'Morte',
  CONHECIMENTO: 'Conhecimento',
  ENERGIA: 'Energia',
  MEDO: 'Medo',
} as const;

/**
 * Array de elementos válidos
 */
export const VALID_ELEMENT_IDS = Object.values(ELEMENT_IDS);

/**
 * Tipo para IDs de elementos
 */
export type ElementId = typeof ELEMENT_IDS[keyof typeof ELEMENT_IDS];

// ============================================
// PODERES ESPECIAIS (SPECIAL POWERS)
// ============================================

/**
 * IDs de poderes Transcender (por classe)
 * Usados para: detecção de fluxo Transcender, cálculo de penalidade de sanidade
 */
export const TRANSCENDER_POWER_IDS = {
  COMBATENTE: 'transcender-comb',
  ESPECIALISTA: 'transcender-esp',
  OCULTISTA: 'transcender-ocultista',
} as const;

/**
 * Array de todos os IDs de Transcender válidos
 */
export const ALL_TRANSCENDER_IDS = Object.values(TRANSCENDER_POWER_IDS);

/**
 * Tipo para IDs de Transcender
 */
export type TranscenderId = typeof ALL_TRANSCENDER_IDS[number];

/**
 * IDs de poderes Treinamento em Perícia (por classe)
 * Usados para: detecção de poderes repetíveis, fluxo de sub-escolha de perícia
 */
export const SKILL_TRAINING_POWER_IDS = {
  COMBATENTE: 'treinamento-pericia-comb',
  ESPECIALISTA: 'treinamento-pericia-esp',
  OCULTISTA: 'treinamento-pericia-ocult',
  /** ID legado - usar apenas para mapeamento de compatibilidade */
  LEGACY: 'treinamento-pericia',
} as const;

/**
 * Array de todos os IDs de Treinamento em Perícia válidos (inclui legado)
 */
export const ALL_SKILL_TRAINING_IDS = [
  SKILL_TRAINING_POWER_IDS.COMBATENTE,
  SKILL_TRAINING_POWER_IDS.ESPECIALISTA,
  SKILL_TRAINING_POWER_IDS.OCULTISTA,
  SKILL_TRAINING_POWER_IDS.LEGACY,
] as const;

/**
 * Tipo para IDs de Treinamento em Perícia
 */
export type SkillTrainingId = typeof ALL_SKILL_TRAINING_IDS[number];

/**
 * IDs de poderes Versatilidade (por classe)
 * Usados para: fluxo de escolha de poder adicional no NEX 50%+
 */
export const VERSATILITY_POWER_IDS = {
  COMBATENTE: 'versatilidade-comb',
  ESPECIALISTA: 'versatilidade-esp',
} as const;

/**
 * Array de todos os IDs de Versatilidade válidos
 */
export const ALL_VERSATILITY_IDS = Object.values(VERSATILITY_POWER_IDS);

/**
 * Tipo para IDs de Versatilidade
 */
export type VersatilityId = typeof ALL_VERSATILITY_IDS[number];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Verifica se uma trilha é válida para uma classe
 * @param trackId ID da trilha
 * @param classId ID da classe (pode ser "Combatente" ou "combatente")
 */
export function isValidTrackForClass(trackId: string, classId: string): boolean {
  const normalizedClassId = classId.toLowerCase() as keyof typeof TRACKS_BY_CLASS;
  const tracks = TRACKS_BY_CLASS[normalizedClassId];
  if (!tracks) return false;
  return (tracks as readonly string[]).includes(trackId);
}

/**
 * Obtém as trilhas válidas para uma classe
 * @param classId ID da classe (pode ser "Combatente" ou "combatente")
 */
export function getTracksForClass(classId: string): readonly string[] {
  const normalizedClassId = classId.toLowerCase() as keyof typeof TRACKS_BY_CLASS;
  return TRACKS_BY_CLASS[normalizedClassId] ?? [];
}

/**
 * Verifica se um ID de classe é válido
 */
export function isValidClassId(id: string): id is ClassId {
  return VALID_CLASS_IDS.includes(id as ClassId);
}

/**
 * Verifica se um ID de origem é válido
 */
export function isValidOriginId(id: string): id is OriginId {
  return (ALL_ORIGIN_IDS as readonly string[]).includes(id);
}

/**
 * Verifica se um ID de trilha é válido
 */
export function isValidTrackId(id: string): id is TrackId {
  return (ALL_TRACK_IDS as readonly string[]).includes(id);
}

/**
 * Verifica se um valor de NEX é válido
 */
export function isValidNexValue(value: number): value is NexValue {
  return (VALID_NEX_VALUES as readonly number[]).includes(value);
}

/**
 * Verifica se um ID de perícia é válido
 */
export function isValidSkillId(id: string): id is SkillId {
  return (VALID_SKILL_IDS as readonly string[]).includes(id);
}

/**
 * Verifica se um ID de patente é válido
 */
export function isValidPatentId(id: string): id is PatentId {
  return (VALID_PATENT_IDS as readonly string[]).includes(id);
}

/**
 * Verifica se um ID de elemento é válido
 */
export function isValidElementId(id: string): id is ElementId {
  return (VALID_ELEMENT_IDS as readonly string[]).includes(id);
}

/**
 * Verifica se um ID de elemento é válido (case-insensitive)
 * Útil para comparar elementos que podem vir em minúsculas ou maiúsculas
 */
export function isValidElementIdIgnoreCase(id: string): boolean {
  const normalized = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
  return (VALID_ELEMENT_IDS as readonly string[]).includes(normalized);
}

/**
 * Normaliza um ID de elemento para o formato padrão (inicial maiúscula)
 * @returns O ID normalizado ou null se inválido
 */
export function normalizeElementId(id: string): ElementId | null {
  const normalized = id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
  if ((VALID_ELEMENT_IDS as readonly string[]).includes(normalized)) {
    return normalized as ElementId;
  }
  return null;
}

/**
 * Obtém o ID da patente pelo nome (case-insensitive)
 */
export function getPatentIdByName(name: string): PatentId | null {
  const found = VALID_PATENT_IDS.find(
    p => p.toLowerCase() === name.toLowerCase()
  );
  return found || null;
}

/**
 * Verifica se uma perícia pertence a um atributo específico
 */
export function isSkillOfAttribute(skillId: string, attribute: AttributeKey): boolean {
  const skills = SKILLS_BY_ATTRIBUTE[attribute];
  return (skills as readonly string[]).includes(skillId);
}

/**
 * Obtém o atributo de uma perícia
 */
export function getSkillAttribute(skillId: string): AttributeKey | null {
  for (const [attr, skills] of Object.entries(SKILLS_BY_ATTRIBUTE)) {
    if ((skills as readonly string[]).includes(skillId)) {
      return attr as AttributeKey;
    }
  }
  return null;
}
