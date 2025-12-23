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
 * IDs das origens de suplementos/expansões
 */
export const SUPPLEMENT_ORIGIN_IDS = {
  AMIGO_DOS_ANIMAIS: 'amigo-dos-animais',
  ASTRONAUTA: 'astronauta',
  CHEF_DO_OUTRO_LADO: 'chef-do-outro-lado',
  COLEGIAL: 'colegial',
  COSPLAYER: 'cosplayer',
  DIPLOMATA: 'diplomata',
  EXPLORADOR: 'explorador',
  EXPERIMENTO: 'experimento',
  FANATICO_POR_CRIATURAS: 'fanatico-por-criaturas',
  FOTOGRAFO: 'fotografo',
  INVENTOR_PARANORMAL: 'inventor-paranormal',
  JOVEM_MISTICO: 'jovem-mistico',
  LEGISTA_TURNO_NOITE: 'legista-turno-noite',
  MOTORISTA: 'motorista',
  NERD_ENTUSIASTA: 'nerd-entusiasta',
  PSICOLOGO: 'psicologo',
  PROFETIZADO: 'profetizado',
  REPORTER_INVESTIGATIVO: 'reporter-investigativo',
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
