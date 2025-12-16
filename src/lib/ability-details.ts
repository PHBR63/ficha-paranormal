/**
 * ability-details.ts
 * Dados expandidos de poderes de classe: pré-requisitos, exemplos de uso, sinergias
 * Fonte: Ordem Paranormal RPG - Tabelas 1.3, 1.4, 1.5
 */

// ==================== INTERFACE DE DETALHES EXPANDIDOS ====================

export interface AbilityDetails {
  id: string;
  prerequisites?: {
    attributes?: { attribute: string; value: number }[];  // Ex: { attribute: 'For', value: 2 }
    skills?: string[];                                     // Ex: ['Luta', 'Pontaria']
    nex?: number;                                          // NEX mínimo especial
    abilities?: string[];                                  // Outros poderes necessários
  };
  examples?: string[];                                     // Exemplos de uso em jogo
  synergies?: {
    abilityId: string;
    abilityName: string;
    description: string;
  }[];                                                     // Sinergias com outros poderes
  tips?: string;                                           // Dicas de otimização
  evolution?: {
    nexMarkers: number[];
    descriptions: string[];
  };
}

// ==================== DETALHES DOS PODERES DO COMBATENTE ====================

export const COMBATENTE_DETAILS: Record<string, AbilityDetails> = {
  'ataque-especial': {
    id: 'ataque-especial',
    evolution: {
      nexMarkers: [5, 25, 55, 85],
      descriptions: [
        '2 PE para +5 (ataque ou dano)',
        '3 PE para +10 (ataque ou dano)',
        '4 PE para +15 (ataque ou dano)',
        '5 PE para +20 (ataque ou dano)'
      ]
    },
    examples: [
      'Gaste 2 PE para garantir acerto contra um inimigo difícil (+5 no ataque)',
      'Em NEX 25%, gaste 3 PE para causar +10 de dano em um ataque crítico',
      'Divida o bônus: +5 ataque e +5 dano gastando 3 PE em NEX 25%'
    ],
    synergies: [
      { abilityId: 'golpe-pesado', abilityName: 'Golpe Pesado', description: 'Combine com Golpe Pesado para dano massivo em um único ataque' },
      { abilityId: 'tiro-certeiro', abilityName: 'Tiro Certeiro', description: 'Use com Tiro Certeiro para maximizar dano à distância' }
    ],
    tips: 'Guarde PE para momentos críticos. Em combates longos, prefira aplicar no dano. Contra inimigos com alta Defesa, aplique no ataque.'
  },
  
  'armamento-pesado': {
    id: 'armamento-pesado',
    prerequisites: {
      attributes: [{ attribute: 'For', value: 2 }]
    },
    examples: [
      'Empunhe um lança-granadas ou metralhadora pesada',
      'Use uma escopeta de combate com eficiência máxima'
    ],
    synergies: [
      { abilityId: 'golpe-pesado', abilityName: 'Golpe Pesado', description: 'Armas pesadas corpo a corpo ganham dado extra de dano' }
    ],
    tips: 'Essencial para builds focados em dano máximo. Combine com Força alta para aproveitar armas de duas mãos.'
  },
  
  'artista-marcial': {
    id: 'artista-marcial',
    evolution: {
      nexMarkers: [15, 35, 70],
      descriptions: [
        'Ataques desarmados causam 1d6 de dano',
        'Dano aumenta para 1d8',
        'Dano aumenta para 1d10'
      ]
    },
    examples: [
      'Ataque um cultista desarmado causando dano letal',
      'Use Agilidade ao invés de Força nos ataques (arma ágil)',
      'Combine com Combater com Duas Armas para múltiplos golpes'
    ],
    synergies: [
      { abilityId: 'combater-duas-armas', abilityName: 'Combater com Duas Armas', description: 'Punhos contam como armas leves para ataques duplos' },
      { abilityId: 'ataque-de-oportunidade', abilityName: 'Ataque de Oportunidade', description: 'Sempre preparado para atacar, mesmo sem armas' }
    ],
    tips: 'Ótimo para builds de Agilidade. Nunca fique desarmado! Escala bem com NEX.'
  },
  
  'ataque-de-oportunidade': {
    id: 'ataque-de-oportunidade',
    examples: [
      'Inimigo tenta fugir do combate corpo a corpo - gaste 1 PE e uma reação para atacá-lo',
      'Cultista se afasta para lançar ritual - aproveite para golpeá-lo'
    ],
    synergies: [
      { abilityId: 'artista-marcial', abilityName: 'Artista Marcial', description: 'Sempre pode fazer ataques de oportunidade, mesmo desarmado' },
      { abilityId: 'golpe-pesado', abilityName: 'Golpe Pesado', description: 'Ataques de oportunidade com dano aumentado' }
    ],
    tips: 'Posicione-se estrategicamente para controlar o campo de batalha. Inimigos hesitarão em se mover perto de você.'
  },
  
  'combater-duas-armas': {
    id: 'combater-duas-armas',
    prerequisites: {
      attributes: [{ attribute: 'Agi', value: 3 }],
      skills: ['Luta', 'Pontaria']
    },
    examples: [
      'Empunhe duas pistolas e faça dois ataques por turno',
      'Use uma espada e uma adaga para dois ataques corpo a corpo',
      'Aceite -5 em todos os ataques para dobrar seu potencial ofensivo'
    ],
    synergies: [
      { abilityId: 'ataque-especial', abilityName: 'Ataque Especial', description: 'Aplique bônus em ambos os ataques para maximizar dano' },
      { abilityId: 'artista-marcial', abilityName: 'Artista Marcial', description: 'Punhos contam como armas leves' }
    ],
    tips: 'A penalidade de -5 é significativa. Combine com bônus de ataque para compensar. Melhor contra inimigos com Defesa baixa.'
  },
  
  'combate-defensivo': {
    id: 'combate-defensivo',
    prerequisites: {
      attributes: [{ attribute: 'Int', value: 2 }]
    },
    examples: [
      'Enfrente um inimigo poderoso ganhando +5 em Defesa',
      'Proteja um aliado caído enquanto ele é curado'
    ],
    synergies: [
      { abilityId: 'reflexos-defensivos', abilityName: 'Reflexos Defensivos', description: 'Acumule bônus de Defesa para se tornar muito difícil de acertar' }
    ],
    tips: 'Use quando precisar sobreviver mais do que causar dano. Bom para tanquear enquanto aliados resolvem a situação.'
  },
  
  'golpe-demolidor': {
    id: 'golpe-demolidor',
    prerequisites: {
      attributes: [{ attribute: 'For', value: 2 }],
      skills: ['Luta']
    },
    examples: [
      'Destrua uma porta trancada com um golpe poderoso',
      'Quebre o escudo de um inimigo para deixá-lo vulnerável'
    ],
    tips: 'Situacional mas muito útil. Sempre tenha uma arma corpo a corpo para emergências.'
  },
  
  'golpe-pesado': {
    id: 'golpe-pesado',
    examples: [
      'Uma espada que causa 1d8 passa a causar 2d8',
      'Um machado de 1d12 causa 2d12 de dano base'
    ],
    synergies: [
      { abilityId: 'ataque-especial', abilityName: 'Ataque Especial', description: 'Combine dano base alto com bônus de dano' },
      { abilityId: 'armamento-pesado', abilityName: 'Armamento Pesado', description: 'Use com armas pesadas para dano devastador' }
    ],
    tips: 'Um dos melhores poderes de dano. Essencial para builds corpo a corpo. Priorize armas com dado de dano alto.'
  },
  
  'protecao-pesada': {
    id: 'protecao-pesada',
    prerequisites: {
      nex: 30
    },
    examples: [
      'Vista uma armadura tática completa',
      'Use equipamento de contenção da Ordem'
    ],
    synergies: [
      { abilityId: 'tanque-de-guerra', abilityName: 'Tanque de Guerra', description: 'Pré-requisito para Tanque de Guerra' }
    ],
    tips: 'Essencial para builds de tanque. Proteções pesadas têm penalidades, mas oferecem proteção superior.'
  },
  
  'reflexos-defensivos': {
    id: 'reflexos-defensivos',
    prerequisites: {
      attributes: [{ attribute: 'Agi', value: 2 }]
    },
    examples: [
      'Receba +2 permanente em Defesa e resistências',
      'Melhor chance de passar em testes de Reflexos contra explosões'
    ],
    synergies: [
      { abilityId: 'combate-defensivo', abilityName: 'Combate Defensivo', description: 'Acumule com Combate Defensivo para defesa máxima' }
    ],
    tips: 'Bônus passivo sempre ativo. Excelente custo-benefício para qualquer combatente.'
  },
  
  'saque-rapido': {
    id: 'saque-rapido',
    prerequisites: {
      skills: ['Iniciativa']
    },
    examples: [
      'Saque sua arma e ataque no mesmo turno',
      'Recarregue sua arma como ação livre durante o combate'
    ],
    tips: 'Muito útil para quem alterna entre armas ou usa armas de fogo. Economia de ações é poder.'
  },
  
  'segurar-gatilho': {
    id: 'segurar-gatilho',
    prerequisites: {
      nex: 60
    },
    examples: [
      'Acerte o primeiro tiro, gaste 2 PE para um segundo, acerte, gaste 4 PE para um terceiro...',
      'Elimine múltiplos inimigos fracos em um único turno'
    ],
    synergies: [
      { abilityId: 'tiro-certeiro', abilityName: 'Tiro Certeiro', description: 'Maximize dano de cada tiro para aproveitar múltiplos ataques' }
    ],
    tips: 'Consome muito PE mas pode devastar encontros. Reserve PE para momentos decisivos.'
  },
  
  'sentido-tatico': {
    id: 'sentido-tatico',
    prerequisites: {
      attributes: [{ attribute: 'Int', value: 2 }],
      skills: ['Percepção', 'Tática']
    },
    examples: [
      'Analise o ambiente e ganhe +3 em Defesa (com Int 3) até o fim da cena',
      'Use no início do combate para proteção duradoura'
    ],
    tips: 'Custo único de 2 PE para bônus que dura a cena toda. Sempre use no início de combates importantes.'
  },
  
  'tanque-de-guerra': {
    id: 'tanque-de-guerra',
    prerequisites: {
      abilities: ['Proteção Pesada']
    },
    examples: [
      'Sua armadura pesada ganha +2 em Defesa e resistência a dano',
      'Torne-se praticamente imparável contra ataques físicos'
    ],
    synergies: [
      { abilityId: 'protecao-pesada', abilityName: 'Proteção Pesada', description: 'Requer Proteção Pesada' }
    ],
    tips: 'O ápice do tanque. Combine com alta Defesa base e você será um muro.'
  },
  
  'tiro-certeiro': {
    id: 'tiro-certeiro',
    prerequisites: {
      skills: ['Pontaria']
    },
    examples: [
      'Some Agilidade ao dano de todas suas armas de disparo',
      'Atire em inimigos em combate corpo a corpo sem penalidade'
    ],
    synergies: [
      { abilityId: 'ataque-especial', abilityName: 'Ataque Especial', description: 'Bônus de dano empilham para tiros devastadores' },
      { abilityId: 'segurar-gatilho', abilityName: 'Segurar o Gatilho', description: 'Cada tiro adicional ganha o bônus de Agilidade' }
    ],
    tips: 'Essencial para atiradores. Invista em Agilidade para maximizar dano.'
  },
  
  'transcender': {
    id: 'transcender',
    examples: [
      'Ganhe um poder paranormal como se fosse um Ocultista',
      'Escolha poderes que complementem seu estilo de combate'
    ],
    tips: 'Atenção: você não ganha Sanidade neste aumento de NEX. Pode ser escolhido múltiplas vezes.'
  },
  
  'treinamento-pericia': {
    id: 'treinamento-pericia',
    evolution: {
      nexMarkers: [15, 35, 70],
      descriptions: [
        'Torna-se treinado em 2 perícias',
        'Pode escolher perícias já treinadas para veterano',
        'Pode escolher perícias veteranas para expert'
      ]
    },
    examples: [
      'Treine Percepção e Tática para melhor consciência situacional',
      'Evolua Pontaria para veterano (+10 em vez de +5)'
    ],
    tips: 'Pode ser escolhido múltiplas vezes. Muito versátil para preencher lacunas no grupo.'
  }
};

// ==================== DETALHES DOS PODERES DO ESPECIALISTA ====================

export const ESPECIALISTA_DETAILS: Record<string, AbilityDetails> = {
  'ecletico': {
    id: 'ecletico',
    examples: [
      'Gaste 2 PE para usar Medicina como se fosse treinado',
      'Faça um teste de Tecnologia sem treinamento, pagando 2 PE'
    ],
    synergies: [
      { abilityId: 'engenhosidade', abilityName: 'Engenhosidade', description: 'Em NEX 40%+, pode pagar mais para ser veterano/expert' }
    ],
    tips: 'Muito versátil! Use para cobrir perícias que ninguém no grupo tem.'
  },
  
  'perito': {
    id: 'perito',
    evolution: {
      nexMarkers: [5, 25, 55, 85],
      descriptions: [
        '+1d6 ao resultado (2 PE)',
        '+1d8 ao resultado (3 PE)',
        '+1d10 ao resultado (4 PE)',
        '+1d12 ao resultado (5 PE)'
      ]
    },
    examples: [
      'Escolha Investigação e Tecnologia como perícias de Perito',
      'Gaste 2 PE para somar 1d6 em um teste crucial de Investigação'
    ],
    tips: 'Escolha perícias que você usa frequentemente. O dado extra pode fazer a diferença em testes difíceis.'
  },
  
  'engenhosidade': {
    id: 'engenhosidade',
    evolution: {
      nexMarkers: [40, 75],
      descriptions: [
        'Eclético pode pagar +2 PE para ser veterano',
        'Eclético pode pagar +4 PE para ser expert'
      ]
    },
    synergies: [
      { abilityId: 'ecletico', abilityName: 'Eclético', description: 'Melhora diretamente o Eclético' }
    ],
    tips: 'Em NEX alto, você pode fazer qualquer perícia como expert por 6 PE total. Muito poderoso!'
  },
  
  'balistica-avancada': {
    id: 'balistica-avancada',
    examples: [
      'Use pistolas, rifles e submetralhadoras táticas',
      'Ganhe +2 em todo dano com armas de fogo'
    ],
    synergies: [
      { abilityId: 'ninja-urbano', abilityName: 'Ninja Urbano', description: 'Combine proficiências para máxima versatilidade' }
    ],
    tips: 'Bom para Especialistas que querem combater. O bônus de +2 dano é sempre ativo.'
  },
  
  'conhecimento-aplicado': {
    id: 'conhecimento-aplicado',
    prerequisites: {
      attributes: [{ attribute: 'Int', value: 2 }]
    },
    examples: [
      'Use Intelecto em vez de Força para Atletismo',
      'Resolva problemas físicos com conhecimento técnico'
    ],
    tips: 'Perfeito para Especialistas com Int alto e outros atributos baixos.'
  },
  
  'hacker': {
    id: 'hacker',
    prerequisites: {
      skills: ['Tecnologia']
    },
    examples: [
      'Invada sistemas com +5 no teste',
      'Hackeie qualquer sistema como ação completa (muito mais rápido)'
    ],
    tips: 'Em missões modernas, acesso a sistemas é crucial. Este poder economiza muito tempo.'
  },
  
  'nerd': {
    id: 'nerd',
    examples: [
      'Em investigação: "Eu vi isso em um documentário!" - ganhe uma pista extra',
      'Em combate: "Essa criatura apareceu no livro X!" - descubra uma fraqueza'
    ],
    tips: 'Muito útil em qualquer situação. Use uma vez por cena para informação valiosa.'
  },
  
  'ninja-urbano': {
    id: 'ninja-urbano',
    examples: [
      'Use katanas, arcos e bestas táticas',
      'Ganhe +2 dano com armas táticas corpo a corpo e de disparo'
    ],
    synergies: [
      { abilityId: 'balistica-avancada', abilityName: 'Balística Avançada', description: 'Combine para cobrir todas as armas táticas' }
    ],
    tips: 'Ótimo para builds furtivos que precisam eliminar alvos silenciosamente.'
  }
};

// ==================== DETALHES DOS PODERES DO OCULTISTA ====================

export const OCULTISTA_DETAILS: Record<string, AbilityDetails> = {
  'escolhido-pelo-outro-lado': {
    id: 'escolhido-pelo-outro-lado',
    evolution: {
      nexMarkers: [5, 25, 55, 85],
      descriptions: [
        'Rituais de 1º círculo',
        'Rituais de 2º círculo',
        'Rituais de 3º círculo',
        'Rituais de 4º círculo'
      ]
    },
    examples: [
      'Em NEX 5%, lance rituais básicos como Arma Atroz',
      'Em NEX 25%, acesse rituais poderosos de 2º círculo',
      'Em NEX 55%, utilize rituais devastadores de 3º círculo'
    ],
    tips: 'Escolha rituais que complementem o grupo. Não foque apenas em dano - utilidades são valiosas.'
  },
  
  'afinidade-elemental': {
    id: 'afinidade-elemental',
    examples: [
      'Escolha Sangue para rituais de cura e vitalidade',
      'Escolha Energia para rituais de dano e destruição',
      'Escolha Conhecimento para rituais de informação e controle'
    ],
    tips: 'Escolha com cuidado - define seu estilo de ocultismo. Alguns rituais só funcionam com elementos específicos.'
  },
  
  'poder-paranormal': {
    id: 'poder-paranormal',
    examples: [
      'Ganhe um poder paranormal à sua escolha',
      'Poderes paranormais oferecem habilidades únicas do Outro Lado'
    ],
    tips: 'Alguns poderes paranormais são muito poderosos. Pesquise as opções antes de escolher.'
  }
};

// ==================== FUNÇÃO PARA OBTER DETALHES ====================

export function getAbilityDetails(abilityId: string): AbilityDetails | null {
  return (
    COMBATENTE_DETAILS[abilityId] ||
    ESPECIALISTA_DETAILS[abilityId] ||
    OCULTISTA_DETAILS[abilityId] ||
    null
  );
}

// ==================== FUNÇÃO PARA EXTRAIR PRÉ-REQUISITOS DA DESCRIÇÃO ====================

export function parsePrerequisitesFromDescription(description: string): AbilityDetails['prerequisites'] {
  const prerequisites: AbilityDetails['prerequisites'] = {};
  
  // Regex para encontrar pré-requisitos
  const prereqMatch = description.match(/Pré-requisitos?:\s*([^.]+)/i);
  if (!prereqMatch) return undefined;
  
  const prereqText = prereqMatch[1];
  
  // Atributos (Ex: "For 2", "Agi 3")
  const attrMatches = prereqText.matchAll(/(For|Agi|Int|Vig|Pre)\s*(\d+)/gi);
  const attributes: { attribute: string; value: number }[] = [];
  for (const match of attrMatches) {
    attributes.push({ attribute: match[1], value: parseInt(match[2]) });
  }
  if (attributes.length > 0) prerequisites.attributes = attributes;
  
  // Perícias (Ex: "treinado em Luta", "treinado em Pontaria")
  const skillMatches = prereqText.matchAll(/treinado em\s+(\w+(?:\s+\w+)?)/gi);
  const skills: string[] = [];
  for (const match of skillMatches) {
    skills.push(match[1]);
  }
  if (skills.length > 0) prerequisites.skills = skills;
  
  // NEX (Ex: "NEX 30%")
  const nexMatch = prereqText.match(/NEX\s*(\d+)%/i);
  if (nexMatch) prerequisites.nex = parseInt(nexMatch[1]);
  
  // Outros poderes (Ex: "Proteção Pesada")
  const abilityMatch = prereqText.match(/Proteção Pesada|Armamento Pesado/i);
  if (abilityMatch) prerequisites.abilities = [abilityMatch[0]];
  
  return Object.keys(prerequisites).length > 0 ? prerequisites : undefined;
}
