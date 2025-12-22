// =====================================================
// Adaptador de Efeitos de Origem
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte poderes de origem para o formato UnifiedEffect
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';

/**
 * Mapeamento de poderes de origem para efeitos mecânicos
 * Baseado no Livro Base v1.3
 */
export const ORIGIN_POWER_EFFECTS: Record<string, {
  mechanics: EffectMechanics;
  description: string;
  isToggleable?: boolean;
  costPE?: number;
}> = {
  // === Acadêmico - Saber é Poder ===
  'saber-e-poder': {
    mechanics: {
      specialEffects: ['Testes de INT: +5 por 2 PE'],
    },
    description: 'Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Agente de Saúde - Técnica Medicinal ===
  'tecnica-medicinal': {
    mechanics: {
      specialEffects: ['Cura: +INT PV curados'],
    },
    description: 'Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados.',
  },
  
  // === Amnésico - Vislumbres do Passado ===
  'vislumbres-do-passado': {
    mechanics: {
      specialEffects: ['1x/sessão: teste INT DT 10 para reconhecer pessoas/lugares, +1d4 PE temp'],
    },
    description: 'Uma vez por sessão, teste de INT DT 10 para reconhecer pessoas/lugares familiares.',
    isToggleable: true,
  },
  
  // === Artista - Magnum Opus ===
  'magnum-opus': {
    mechanics: {
      specialEffects: ['1x/missão: +5 em testes de PRE contra pessoa que reconhece você'],
    },
    description: 'Você é famoso. Uma vez por missão, +5 em testes de Presença contra quem te reconhece.',
    isToggleable: true,
  },
  
  // === Atleta - 110% ===
  '110-porcento': {
    mechanics: {
      specialEffects: ['Testes de FOR/AGI (exceto Luta/Pontaria): +5 por 2 PE'],
    },
    description: 'Quando faz teste de perícia com FOR ou AGI (exceto Luta/Pontaria), +5 por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Chef - Ingrediente Secreto ===
  'ingrediente-secreto': {
    mechanics: {
      specialEffects: ['Interlúdio: todos recebem benefício de 2 pratos ao se alimentar'],
    },
    description: 'Em cenas de interlúdio, você pode cozinhar um prato especial para o grupo.',
  },
  
  // === Criminoso - O Crime Compensa ===
  'o-crime-compensa': {
    mechanics: {
      specialEffects: ['Fim da missão: 1 item encontrado não conta no limite da próxima missão'],
    },
    description: 'No final da missão, escolha um item que não contará no seu limite.',
  },
  
  // === Cultista Arrependido - Traços do Outro Lado ===
  'tracos-do-outro-lado': {
    mechanics: {
      specialEffects: ['Poder paranormal grátis', 'Começa com metade da Sanidade'],
    },
    description: 'Você possui um poder paranormal à sua escolha, mas começa com metade da Sanidade.',
  },
  
  // === Desgarrado - Calejado ===
  'calejado': {
    mechanics: {
      hpBonusPerNex: 1, // +1 PV para cada 5% de NEX
    },
    description: 'Você recebe +1 PV para cada 5% de NEX.',
  },
  
  // === Engenheiro - Ferramenta Favorita ===
  'ferramenta-favorita': {
    mechanics: {
      specialEffects: ['Um item (exceto arma) conta como 1 categoria abaixo'],
    },
    description: 'Um item à sua escolha (exceto armas) conta como uma categoria abaixo.',
  },
  
  // === Executivo - Processo Otimizado ===
  'processo-otimizado': {
    mechanics: {
      specialEffects: ['Testes estendidos/revisão de documentos: +5 por 2 PE'],
    },
    description: 'Em testes estendidos ou revisão de documentos, +5 por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Investigador - Faro para Pistas ===
  'faro-para-pistas': {
    mechanics: {
      specialEffects: ['1x/cena: +5 em teste para procurar pistas por 1 PE'],
    },
    description: 'Uma vez por cena, +5 em teste para procurar pistas por 1 PE.',
    isToggleable: true,
    costPE: 1,
  },
  
  // === Lutador - Mão Pesada ===
  'mao-pesada': {
    mechanics: {
      meleeDamageBonus: 2,
    },
    description: 'Você recebe +2 em rolagens de dano com ataques corpo a corpo.',
  },
  
  // === Magnata - Patrocinador da Ordem ===
  'patrocinador-da-ordem': {
    mechanics: {
      specialEffects: ['Limite de crédito +1 categoria'],
    },
    description: 'Seu limite de crédito é sempre considerado um acima do atual.',
  },
  
  // === Mercenário - Posição de Combate ===
  'posicao-de-combate': {
    mechanics: {
      extraAction: 'movement',
      specialEffects: ['1º turno de cena de ação: ação de movimento extra por 2 PE'],
    },
    description: 'No primeiro turno de cada cena de ação, você pode gastar 2 PE para ação de movimento extra.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Militar - Para Bellum ===
  'para-bellum': {
    mechanics: {
      rangedDamageBonus: 2, // Especificamente com armas de fogo
      specialEffects: ['+2 dano com armas de fogo'],
    },
    description: 'Você recebe +2 em rolagens de dano com armas de fogo.',
  },
  
  // === Operário - Ferramenta de Trabalho ===
  'ferramenta-de-trabalho': {
    mechanics: {
      attackBonus: 1, // Com arma escolhida
      damageBonus: 1, // Com arma escolhida
      criticalMarginBonus: 1, // Com arma escolhida
      specialEffects: ['Proficiência em arma simples/tática escolhida', '+1 ataque, dano e margem com ela'],
    },
    description: 'Proficiência e +1 ataque, dano e margem de ameaça com arma escolhida.',
  },
  
  // === Policial - Patrulha ===
  'patrulha': {
    mechanics: {
      defenseBonus: 2,
    },
    description: 'Você recebe +2 em Defesa.',
  },
  
  // === Religioso - Acalentar ===
  'acalentar': {
    mechanics: {
      skillBonus: { religiao: 5 }, // Para acalmar
      specialEffects: ['+5 em Religião para acalmar', 'Acalmar: alvo recupera 1d6+PRE Sanidade'],
    },
    description: '+5 em Religião para acalmar. Ao acalmar, alvo recebe 1d6+PRE de Sanidade.',
  },
  
  // === Servidor Público - Espírito Cívico ===
  'espirito-civico': {
    mechanics: {
      specialEffects: ['Ao ajudar: +2 no bônus concedido por 1 PE'],
    },
    description: 'Quando ajuda, pode gastar 1 PE para aumentar o bônus em +2.',
    isToggleable: true,
    costPE: 1,
  },
  
  // === T.I. - Motor de Busca ===
  'motor-de-busca': {
    mechanics: {
      specialEffects: ['Com internet: substitui teste de perícia por Tecnologia por 2 PE'],
    },
    description: 'Com acesso à internet, pode substituir qualquer teste de perícia por Tecnologia por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Teórico da Conspiração - Eu Já Sabia ===
  'eu-ja-sabia': {
    mechanics: {
      damageResistance: { mental: 0 }, // Será calculado dinamicamente baseado no INT
      specialEffects: ['Resistência a dano mental = Intelecto'],
    },
    description: 'Você recebe resistência a dano mental igual ao seu Intelecto.',
  },
  
  // === Trabalhador Rural - Desbravador ===
  'desbravador': {
    mechanics: {
      specialEffects: [
        'Testes de Adestramento/Sobrevivência: +5 por 2 PE',
        'Ignora penalidade de terreno difícil',
      ],
    },
    description: '+5 em Adestramento/Sobrevivência por 2 PE. Ignora penalidade de terreno difícil.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Trambiqueiro - Impostor ===
  'impostor': {
    mechanics: {
      specialEffects: [
        '1x/cena: +5 em Enganação para fingir ser outra pessoa',
        'Falha por 5+: descoberto',
      ],
    },
    description: 'Uma vez por cena, +5 em Enganação para fingir ser outra pessoa.',
    isToggleable: true,
  },
  
  // === Universitário - Aprendizagem Aplicada ===
  'aprendizagem-aplicada': {
    mechanics: {
      specialEffects: ['Treinado em Ciências vale como treinado em todas perícias de INT'],
    },
    description: 'Ser treinado em Ciências conta como treinado em qualquer perícia de Intelecto.',
  },
  
  // === Vítima - Cicatrizes ===
  'cicatrizes': {
    mechanics: {
      specialEffects: ['1x/cena: substitui teste de atributo por teste de Vontade'],
    },
    description: 'Uma vez por cena, você pode substituir um teste de atributo por teste de Vontade.',
    isToggleable: true,
  },
};

/**
 * Mapeamento de nomes de origem para ID do poder
 * Necessário porque os poderes são referenciados por nome nos dados
 */
const ORIGIN_NAME_TO_POWER_ID: Record<string, string> = {
  'academico': 'saber-e-poder',
  'agente-de-saude': 'tecnica-medicinal',
  'amnesico': 'vislumbres-do-passado',
  'artista': 'magnum-opus',
  'atleta': '110-porcento',
  'chef': 'ingrediente-secreto',
  'criminoso': 'o-crime-compensa',
  'cultista-arrependido': 'tracos-do-outro-lado',
  'desgarrado': 'calejado',
  'engenheiro': 'ferramenta-favorita',
  'executivo': 'processo-otimizado',
  'investigador': 'faro-para-pistas',
  'lutador': 'mao-pesada',
  'magnata': 'patrocinador-da-ordem',
  'mercenario': 'posicao-de-combate',
  'militar': 'para-bellum',
  'operario': 'ferramenta-de-trabalho',
  'policial': 'patrulha',
  'religioso': 'acalentar',
  'servidor-publico': 'espirito-civico',
  'ti': 'motor-de-busca',
  'teorico-da-conspiracao': 'eu-ja-sabia',
  'trabalhador-rural': 'desbravador',
  'trambiqueiro': 'impostor',
  'universitario': 'aprendizagem-aplicada',
  'vitima': 'cicatrizes',
};

/**
 * Normaliza um ID de origem para o formato esperado
 */
function normalizeOriginId(origin: string): string {
  return origin
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Obtém o ID do poder de uma origem
 */
function getOriginPowerId(originId: string): string | undefined {
  const normalized = normalizeOriginId(originId);
  return ORIGIN_NAME_TO_POWER_ID[normalized];
}

/**
 * Converte a origem de um personagem para UnifiedEffect[]
 * 
 * @param originId - ID da origem do personagem
 * @param originName - Nome da origem para display
 * @param intellect - Valor de Intelecto (para efeitos dinâmicos como "Eu Já Sabia")
 * @param activatedEffects - IDs de efeitos ativados manualmente
 * @returns Array de efeitos unificados
 */
export function getOriginEffects(
  originId: string,
  originName: string,
  intellect: number = 1,
  activatedEffects: string[] = []
): UnifiedEffect[] {
  const effects: UnifiedEffect[] = [];
  
  const powerId = getOriginPowerId(originId);
  if (!powerId) return effects;
  
  const powerDef = ORIGIN_POWER_EFFECTS[powerId];
  if (!powerDef) return effects;
  
  // Cria cópia das mecânicas para modificações dinâmicas
  const mechanics = { ...powerDef.mechanics };
  
  // Ajusta mecânicas dinâmicas baseadas em atributos
  if (powerId === 'eu-ja-sabia') {
    mechanics.damageResistance = { mental: intellect };
  }
  
  const effect: UnifiedEffect = {
    id: `origin-${powerId}`,
    name: getPowerNameFromId(powerId),
    description: powerDef.description,
    source: 'origin',
    sourceId: originId,
    sourceName: `Origem: ${originName}`,
    mechanics,
    isActive: powerDef.isToggleable 
      ? activatedEffects.includes(`origin-${powerId}`)
      : true,
    isToggleable: powerDef.isToggleable ?? false,
    conditions: powerDef.costPE ? {
      requiresActivation: powerDef.isToggleable,
      costPE: powerDef.costPE,
    } : undefined,
  };
  
  effects.push(effect);
  
  return effects;
}

/**
 * Obtém o nome legível do poder a partir do ID
 */
function getPowerNameFromId(powerId: string): string {
  const names: Record<string, string> = {
    'saber-e-poder': 'Saber é Poder',
    'tecnica-medicinal': 'Técnica Medicinal',
    'vislumbres-do-passado': 'Vislumbres do Passado',
    'magnum-opus': 'Magnum Opus',
    '110-porcento': '110%',
    'ingrediente-secreto': 'Ingrediente Secreto',
    'o-crime-compensa': 'O Crime Compensa',
    'tracos-do-outro-lado': 'Traços do Outro Lado',
    'calejado': 'Calejado',
    'ferramenta-favorita': 'Ferramenta Favorita',
    'processo-otimizado': 'Processo Otimizado',
    'faro-para-pistas': 'Faro para Pistas',
    'mao-pesada': 'Mão Pesada',
    'patrocinador-da-ordem': 'Patrocinador da Ordem',
    'posicao-de-combate': 'Posição de Combate',
    'para-bellum': 'Para Bellum',
    'ferramenta-de-trabalho': 'Ferramenta de Trabalho',
    'patrulha': 'Patrulha',
    'acalentar': 'Acalentar',
    'espirito-civico': 'Espírito Cívico',
    'motor-de-busca': 'Motor de Busca',
    'eu-ja-sabia': 'Eu Já Sabia',
    'desbravador': 'Desbravador',
    'impostor': 'Impostor',
    'aprendizagem-aplicada': 'Aprendizagem Aplicada',
    'cicatrizes': 'Cicatrizes',
  };
  return names[powerId] || powerId;
}

/**
 * Lista todos os efeitos de origem disponíveis
 * Útil para debug e documentação
 */
export function listAllOriginEffects(): Array<{
  originId: string;
  powerId: string;
  powerName: string;
  description: string;
  hasMechanics: boolean;
  isToggleable: boolean;
}> {
  return Object.entries(ORIGIN_NAME_TO_POWER_ID).map(([originId, powerId]) => {
    const power = ORIGIN_POWER_EFFECTS[powerId];
    return {
      originId,
      powerId,
      powerName: getPowerNameFromId(powerId),
      description: power?.description || 'Não mapeado',
      hasMechanics: !!power && Object.keys(power.mechanics).length > 0,
      isToggleable: power?.isToggleable ?? false,
    };
  });
}
