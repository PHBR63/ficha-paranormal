/**
 * Templates Oficiais - Seed Data
 * 6 templates oficiais balanceados (2 por classe)
 * Seguem fielmente as regras do Livro Base v1.3
 * 
 * @module lib/templates/official-templates-seed
 */

import { CLASS_IDS, ELEMENT_IDS } from '@/lib/constants/game-ids';
import type { CharacterTemplateData } from '@/types/templates';
import { TEMPLATE_SCHEMA_VERSION } from '@/types/templates';

// ========================================
// Interfaces de Template Oficial
// ========================================

export interface OfficialTemplate {
  /** ID único do template */
  id: string;
  /** Nome do template */
  name: string;
  /** Descrição do template */
  description: string;
  /** Tags do template */
  tags: string[];
  /** Nível de dificuldade */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Dados do template */
  data: CharacterTemplateData;
}

// ========================================
// Templates do Combatente
// ========================================

/**
 * Combatente - Soldado de Linha de Frente
 * Build balanceada para iniciantes focada em combate corpo a corpo
 */
const COMBATENTE_SOLDADO: OfficialTemplate = {
  id: 'official-combatente-soldado',
  name: 'Soldado de Linha de Frente',
  description: 'Combatente versátil focado em resistência e combate corpo a corpo. Ideal para jogadores iniciantes que querem proteger o grupo.',
  tags: ['tanque', 'melee', 'combate'],
  difficulty: 'beginner',
  data: {
    origin: 'militar',
    classId: CLASS_IDS.COMBATENTE,
    classTrack: 'guerreiro',
    attributes: {
      strength: 2,
      agility: 0,
      vigor: 1,
      intellect: 0,
      presence: 1,
    },
    trainedSkills: [
      'luta',      // Escolha de classe
      'fortitude', // Escolha de classe
      'pontaria',  // Origem: Militar
      'tatica',    // Origem: Militar
      'atletismo', // Perícia livre
    ],
    classSkillChoices: ['luta', 'fortitude'],
    classPowers: [],
    equipment: {
      weapons: [
        { id: 'bastao', quantity: 1 },
      ],
      items: [
        { id: 'colete-kevlar', quantity: 1 },
      ],
    },
    appearance: {
      suggested_name: 'Tenente Marcos',
      suggested_age: '28-35 anos',
      suggested_background: 'Ex-militar que serviu em operações especiais antes de descobrir o paranormal.',
      suggested_concept: 'Protetor incansável do grupo, sempre na linha de frente.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          power: 'Ataque Especial (usar poder de classe)',
          attribute_increase: { vigor: 1 },
          notes: 'Foque em aumentar resistência.',
        },
      },
      {
        nex: 15,
        suggestions: {
          power: 'Golpe Pesado (trilha Guerreiro)',
          notes: 'Dano adicional em ataques corpo a corpo.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

/**
 * Combatente - Atirador Tático
 * Build focada em combate à distância e mobilidade
 */
const COMBATENTE_ATIRADOR: OfficialTemplate = {
  id: 'official-combatente-atirador',
  name: 'Atirador Tático',
  description: 'Combatente especializado em armas de fogo e posicionamento. Para jogadores que preferem combate à distância.',
  tags: ['dps', 'ranged', 'combate'],
  difficulty: 'intermediate',
  data: {
    origin: 'policial',
    classId: CLASS_IDS.COMBATENTE,
    classTrack: 'operacoes-especiais',
    attributes: {
      strength: 0,
      agility: 2,
      vigor: 1,
      intellect: 0,
      presence: 1,
    },
    trainedSkills: [
      'pontaria',   // Escolha de classe
      'reflexos',   // Escolha de classe
      'percepcao',  // Origem: Policial
      'pontaria',   // Origem: Policial (já contada, ignorar duplicata)
      'furtividade', // Perícia livre
    ],
    classSkillChoices: ['pontaria', 'reflexos'],
    classPowers: [],
    equipment: {
      weapons: [
        { id: 'pistola-leve', quantity: 1 },
      ],
      items: [
        { id: 'colete-leve', quantity: 1 },
      ],
    },
    appearance: {
      suggested_name: 'Agente Silva',
      suggested_age: '25-32 anos',
      suggested_background: 'Ex-policial da SWAT que viu coisas inexplicáveis em uma operação.',
      suggested_concept: 'Precisão e disciplina são suas maiores armas.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          power: 'Ataque Especial',
          attribute_increase: { agility: 1 },
          notes: 'Melhore precisão e esquiva.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

// ========================================
// Templates do Especialista
// ========================================

/**
 * Especialista - Investigador de Campo
 * Build focada em investigação e suporte
 */
const ESPECIALISTA_INVESTIGADOR: OfficialTemplate = {
  id: 'official-especialista-investigador',
  name: 'Investigador de Campo',
  description: 'Especialista em encontrar pistas e resolver mistérios. Perfeito para jogadores que gostam de roleplay e investigação.',
  tags: ['investigação', 'suporte', 'social'],
  difficulty: 'beginner',
  data: {
    origin: 'investigador',
    classId: CLASS_IDS.ESPECIALISTA,
    classTrack: 'negociador',
    attributes: {
      strength: 0,
      agility: 1,
      vigor: 0,
      intellect: 2,
      presence: 1,
    },
    trainedSkills: [
      'investigacao', // Origem: Investigador
      'percepcao',    // Origem: Investigador
      'intuicao',     // Perícia livre
      'diplomacia',   // Perícia livre
      'ciencias',     // Perícia livre
      'atualidades',  // Perícia livre (INT 2 + Base 2 = 4 livres)
    ],
    classPowers: [],
    equipment: {
      weapons: [],
      items: [
        { id: 'kit-investigacao', quantity: 1 },
        { id: 'lanterna-tatica', quantity: 1 },
      ],
    },
    appearance: {
      suggested_name: 'Dra. Helena Costa',
      suggested_age: '30-40 anos',
      suggested_background: 'Detetive particular que investigou casos estranhos demais para a polícia.',
      suggested_concept: 'Nenhum detalhe escapa aos seus olhos treinados.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          power: 'Habilidade de Classe (Especialidade)',
          attribute_increase: { intellect: 1 },
          notes: 'Maximize sua capacidade investigativa.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

/**
 * Especialista - Médico de Campo
 * Build focada em cura e suporte ao grupo
 */
const ESPECIALISTA_MEDICO: OfficialTemplate = {
  id: 'official-especialista-medico',
  name: 'Médico de Campo',
  description: 'Especialista em manter o grupo vivo através de tratamentos médicos. Essencial para missões longas.',
  tags: ['suporte', 'utilitário', 'sobrevivência'],
  difficulty: 'intermediate',
  data: {
    origin: 'agente-de-saude',
    classId: CLASS_IDS.ESPECIALISTA,
    classTrack: 'medico-campo',
    attributes: {
      strength: 0,
      agility: 0,
      vigor: 1,
      intellect: 2,
      presence: 1,
    },
    trainedSkills: [
      'intuicao',    // Origem: Agente de Saúde
      'medicina',    // Origem: Agente de Saúde
      'ciencias',    // Perícia livre
      'vontade',     // Perícia livre
      'diplomacia',  // Perícia livre
      'fortitude',   // Perícia livre
    ],
    classPowers: [],
    equipment: {
      weapons: [],
      items: [
        { id: 'kit-primeiros-socorros', quantity: 2 },
        { id: 'medicamentos', quantity: 1 },
      ],
    },
    appearance: {
      suggested_name: 'Dr. Rafael Mendes',
      suggested_age: '32-45 anos',
      suggested_background: 'Médico do SAMU que atendeu vítimas de ataques paranormais.',
      suggested_concept: 'Sua missão é garantir que todos voltem para casa.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          power: 'Paramédico (trilha Médico de Campo)',
          attribute_increase: { intellect: 1 },
          notes: 'Cura mais eficiente em combate.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

// ========================================
// Templates do Ocultista
// ========================================

/**
 * Ocultista - Ritualista de Energia
 * Build focada em rituais ofensivos de Energia
 */
const OCULTISTA_RITUALISTA: OfficialTemplate = {
  id: 'official-ocultista-ritualista',
  name: 'Ritualista de Energia',
  description: 'Ocultista focado em rituais ofensivos do elemento Energia. Para jogadores que querem causar dano paranormal.',
  tags: ['dps', 'paranormal', 'ranged'],
  difficulty: 'intermediate',
  data: {
    origin: 'academico',
    classId: CLASS_IDS.OCULTISTA,
    classTrack: 'condutor',
    elementalAffinity: ELEMENT_IDS.ENERGIA,
    attributes: {
      strength: 0,
      agility: 0,
      vigor: 1,
      intellect: 2,
      presence: 1,
    },
    trainedSkills: [
      'ciencias',     // Origem: Acadêmico
      'investigacao', // Origem: Acadêmico
      'ocultismo',    // Perícia livre (essencial)
      'vontade',      // Perícia livre
    ],
    classPowers: [],
    paranormalPowers: [],
    initialRituals: [
      'choque',          // 1º círculo, Energia - dano básico
      'luz',             // 1º círculo, Energia - utilidade
      'curar-ferimentos', // 1º círculo, variado - suporte
    ],
    equipment: {
      weapons: [],
      items: [
        { id: 'grimorio', quantity: 1 },
        { id: 'item-ritual', quantity: 1 },
      ],
    },
    appearance: {
      suggested_name: 'Prof. Eduardo Santos',
      suggested_age: '35-50 anos',
      suggested_background: 'Professor universitário que descobriu textos proibidos na biblioteca.',
      suggested_concept: 'O conhecimento é a maior arma contra o desconhecido.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          ritual: 'Proteção Contra Energia (1º círculo)',
          attribute_increase: { presence: 1 },
          notes: 'Aumente PE para sustentar mais rituais.',
        },
      },
      {
        nex: 40,
        suggestions: {
          ritual: 'Ritual de 2º círculo (Energia)',
          notes: 'Acesso a rituais mais poderosos.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

/**
 * Ocultista - Guardião de Sangue
 * Build focada em suporte e proteção via elemento Sangue
 */
const OCULTISTA_GUARDIAO: OfficialTemplate = {
  id: 'official-ocultista-guardiao',
  name: 'Guardião de Sangue',
  description: 'Ocultista do elemento Sangue focado em proteção e cura. Combina magia com resistência.',
  tags: ['suporte', 'tanque', 'paranormal'],
  difficulty: 'advanced',
  data: {
    origin: 'religioso',
    classId: CLASS_IDS.OCULTISTA,
    classTrack: 'flagelador',
    elementalAffinity: ELEMENT_IDS.SANGUE,
    attributes: {
      strength: 0,
      agility: 0,
      vigor: 2,
      intellect: 1,
      presence: 1,
    },
    trainedSkills: [
      'religiao',   // Origem: Religioso
      'vontade',    // Origem: Religioso
      'ocultismo',  // Perícia livre (essencial)
      'fortitude',  // Perícia livre
    ],
    classPowers: [],
    paranormalPowers: [],
    initialRituals: [
      'curar-ferimentos',  // 1º círculo - cura
      'armamento-abencoado', // 1º círculo, Sangue - buff
      'lufada-de-purificacao', // 1º círculo - área
    ],
    equipment: {
      weapons: [],
      items: [
        { id: 'simbolo-sagrado', quantity: 1 },
        { id: 'agua-benta', quantity: 2 },
      ],
    },
    appearance: {
      suggested_name: 'Padre Miguel',
      suggested_age: '40-55 anos',
      suggested_background: 'Sacerdote que realizou exorcismos reais e viu a face do mal.',
      suggested_concept: 'A fé é o escudo contra as trevas.',
    },
    progression: [
      {
        nex: 10,
        suggestions: {
          power: 'Poder Paranormal (Sangue)',
          attribute_increase: { vigor: 1 },
          notes: 'Trilha Flagelador permite usar PV como PE.',
        },
      },
      {
        nex: 40,
        suggestions: {
          ritual: 'Ritual de 2º círculo (Sangue)',
          notes: 'Rituais de proteção mais poderosos.',
        },
      },
    ],
    schema_version: TEMPLATE_SCHEMA_VERSION,
  },
};

// ========================================
// Exportação dos Templates
// ========================================

/**
 * Lista completa de templates oficiais
 */
export const OFFICIAL_TEMPLATES: OfficialTemplate[] = [
  // Combatente
  COMBATENTE_SOLDADO,
  COMBATENTE_ATIRADOR,
  // Especialista
  ESPECIALISTA_INVESTIGADOR,
  ESPECIALISTA_MEDICO,
  // Ocultista
  OCULTISTA_RITUALISTA,
  OCULTISTA_GUARDIAO,
];

/**
 * Obtém template oficial por ID
 */
export function getOfficialTemplateById(id: string): OfficialTemplate | undefined {
  return OFFICIAL_TEMPLATES.find(t => t.id === id);
}

/**
 * Obtém templates oficiais por classe
 */
export function getOfficialTemplatesByClass(classId: string): OfficialTemplate[] {
  return OFFICIAL_TEMPLATES.filter(t => t.data.classId === classId);
}
