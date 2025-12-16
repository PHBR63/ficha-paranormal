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
  // === HABILIDADES CORE ===
  'ecletico': {
    id: 'ecletico',
    examples: [
      'Gaste 2 PE para usar Medicina como se fosse treinado',
      'Faça um teste de Tecnologia sem treinamento, pagando 2 PE',
      'Em uma emergência, faça Pilotagem mesmo sem ter o treinamento'
    ],
    synergies: [
      { abilityId: 'engenhosidade', abilityName: 'Engenhosidade', description: 'Em NEX 40%+, pode pagar mais para ser veterano/expert' },
      { abilityId: 'conhecimento-aplicado', abilityName: 'Conhecimento Aplicado', description: 'Use Int como base mesmo em perícias não treinadas' }
    ],
    tips: 'Muito versátil! Use para cobrir perícias que ninguém no grupo tem. Guarde PE para emergências.'
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
      'Gaste 2 PE para somar 1d6 em um teste crucial de Investigação',
      'Em NEX 55%, gaste 4 PE para adicionar 1d10 em Ocultismo'
    ],
    synergies: [
      { abilityId: 'na-trilha-certa', abilityName: 'Na Trilha Certa', description: 'Combine bônus cumulativos em investigações' },
      { abilityId: 'pensamento-agil', abilityName: 'Pensamento Ágil', description: 'Mais testes = mais chances de usar Perito' }
    ],
    tips: 'Escolha perícias que você usa frequentemente. O dado extra pode virar um teste falho em sucesso.'
  },
  
  'engenhosidade': {
    id: 'engenhosidade',
    evolution: {
      nexMarkers: [40, 75],
      descriptions: [
        'Eclético pode pagar +2 PE para ser veterano (+10)',
        'Eclético pode pagar +4 PE para ser expert (+15)'
      ]
    },
    synergies: [
      { abilityId: 'ecletico', abilityName: 'Eclético', description: 'Melhora diretamente o Eclético' }
    ],
    tips: 'Em NEX alto, você pode fazer qualquer perícia como expert por 6 PE total. Extremamente poderoso!'
  },
  
  // === PODERES ESCOLHÍVEIS ===
  'artista-marcial-esp': {
    id: 'artista-marcial-esp',
    evolution: {
      nexMarkers: [15, 35, 70],
      descriptions: [
        'Ataques desarmados causam 1d6 de dano',
        'Dano aumenta para 1d8',
        'Dano aumenta para 1d10'
      ]
    },
    examples: [
      'Ataque um inimigo desarmado causando dano letal',
      'Use Agilidade para ataques (arma ágil)',
      'Nunca fique vulnerável mesmo sem armas'
    ],
    synergies: [
      { abilityId: 'ninja-urbano', abilityName: 'Ninja Urbano', description: 'Combine combate desarmado com armas táticas' }
    ],
    tips: 'Ótimo para builds furtivos que não podem carregar armas. Sempre preparado!'
  },
  
  'balistica-avancada': {
    id: 'balistica-avancada',
    examples: [
      'Use pistolas, rifles e submetralhadoras táticas',
      'Ganhe +2 em todo dano com armas de fogo',
      'Atire com uma pistola causando +2 de dano fixo'
    ],
    synergies: [
      { abilityId: 'ninja-urbano', abilityName: 'Ninja Urbano', description: 'Combine para proficiência completa em armas táticas' },
      { abilityId: 'transcender-esp', abilityName: 'Transcender', description: 'Adicione poderes paranormais para combate sobrenatural' }
    ],
    tips: 'Bom para Especialistas que querem combater. O +2 dano é sempre ativo e não custa PE.'
  },
  
  'conhecimento-aplicado': {
    id: 'conhecimento-aplicado',
    prerequisites: {
      attributes: [{ attribute: 'Int', value: 2 }]
    },
    examples: [
      'Use Intelecto em vez de Força para Atletismo',
      'Resolva problemas físicos com conhecimento técnico',
      'Faça Intimidação baseada em conhecimento de fraquezas (Int)'
    ],
    synergies: [
      { abilityId: 'perito', abilityName: 'Perito', description: 'Aplique Perito em mais situações usando Int' },
      { abilityId: 'nerd', abilityName: 'Nerd', description: 'Combine conhecimento para resolver qualquer situação' }
    ],
    tips: 'Perfeito para Especialistas com Int alto. Transforma fraquezas físicas em força intelectual.'
  },
  
  'hacker': {
    id: 'hacker',
    prerequisites: {
      skills: ['Tecnologia']
    },
    examples: [
      'Invada sistemas de segurança da Ordem com +5 no teste',
      'Hackeie câmeras de vigilância como ação completa',
      'Acesse arquivos confidenciais rapidamente em missão'
    ],
    synergies: [
      { abilityId: 'perito', abilityName: 'Perito', description: 'Combine +5 fixo com o dado de Perito em Tecnologia' },
      { abilityId: 'pensamento-agil', abilityName: 'Pensamento Ágil', description: 'Mais ações para múltiplos hacks' }
    ],
    tips: 'Em missões modernas, acesso a sistemas é crucial. A ação completa economiza muito tempo.'
  },
  
  'maos-rapidas': {
    id: 'maos-rapidas',
    prerequisites: {
      attributes: [{ attribute: 'Agi', value: 3 }],
      skills: ['Crime']
    },
    examples: [
      'Plante evidências em um suspeito como ação livre',
      'Roube as chaves de um guarda sem que perceba',
      'Desarme uma armadilha rapidamente durante fuga'
    ],
    synergies: [
      { abilityId: 'ninja-urbano', abilityName: 'Ninja Urbano', description: 'Combine furtividade com mãos rápidas' },
      { abilityId: 'perito', abilityName: 'Perito', description: 'Adicione Perito em Crime para sucesso garantido' }
    ],
    tips: 'Transforme ações de Crime em ações livres por apenas 1 PE. Perfeito para infiltrações.'
  },
  
  'mochila-utilidades': {
    id: 'mochila-utilidades',
    examples: [
      'Um kit médico que normalmente ocupa 2 espaços passa a ocupar 1',
      'Equipamento pesado se torna mais portátil',
      'Carregue mais itens essenciais para missões'
    ],
    synergies: [
      { abilityId: 'perito-explosivos', abilityName: 'Perito em Explosivos', description: 'Carregue mais explosivos com menos peso' }
    ],
    tips: 'Escolha itens que você usa frequentemente. Ótimo para kits médicos, ferramentas ou equipamentos especiais.'
  },
  
  'movimento-tatico': {
    id: 'movimento-tatico',
    prerequisites: {
      skills: ['Atletismo']
    },
    examples: [
      'Atravesse escombros sem reduzir movimento',
      'Mova-se por terreno difícil durante combate',
      'Posicione-se taticamente ignorando obstáculos'
    ],
    synergies: [
      { abilityId: 'ninja-urbano', abilityName: 'Ninja Urbano', description: 'Mobilidade + combate furtivo' },
      { abilityId: 'artista-marcial-esp', abilityName: 'Artista Marcial', description: 'Aproxime-se rapidamente para combate desarmado' }
    ],
    tips: 'Essencial em combates com terreno difícil. O posicionamento pode decidir batalhas.'
  },
  
  'na-trilha-certa': {
    id: 'na-trilha-certa',
    examples: [
      'Primeira pista: +5 no próximo teste (1 PE)',
      'Segunda pista consecutiva: +10 total no próximo (2 PE adicionais)',
      'Encadeie sucessos para bônus massivos em investigações'
    ],
    synergies: [
      { abilityId: 'perito', abilityName: 'Perito', description: 'Perito + bônus cumulativo = sucesso garantido' },
      { abilityId: 'pensamento-agil', abilityName: 'Pensamento Ágil', description: 'Mais testes = mais chance de encadear bônus' }
    ],
    tips: 'Os bônus são cumulativos! Invista PE no início da investigação para acelerar o processo.'
  },
  
  'nerd': {
    id: 'nerd',
    examples: [
      'Em investigação: "Vi isso em um documentário!" - pista extra',
      'Em combate: "Essa criatura apareceu no livro X!" - descubra fraqueza',
      'Qualquer situação: informação relevante baseada em cultura pop'
    ],
    synergies: [
      { abilityId: 'conhecimento-aplicado', abilityName: 'Conhecimento Aplicado', description: 'Conhecimento em todas as áreas' },
      { abilityId: 'perito', abilityName: 'Perito', description: 'Combine com Perito em Atualidades' }
    ],
    tips: 'Use uma vez por cena para informação valiosa. DT 20 em Atualidades - invista nessa perícia!'
  },
  
  'ninja-urbano': {
    id: 'ninja-urbano',
    examples: [
      'Use katanas, arcos e bestas táticas com proficiência',
      'Ganhe +2 dano com armas corpo a corpo táticas',
      'Elimine alvos silenciosamente com armas de disparo silenciosas'
    ],
    synergies: [
      { abilityId: 'balistica-avancada', abilityName: 'Balística Avançada', description: 'Combine para cobertura completa de armas táticas' },
      { abilityId: 'artista-marcial-esp', abilityName: 'Artista Marcial', description: 'Alterne entre desarmado e armas táticas' }
    ],
    tips: 'Ótimo para builds furtivos. O +2 dano funciona corpo a corpo E à distância com armas táticas.'
  },
  
  'pensamento-agil': {
    id: 'pensamento-agil',
    examples: [
      'Faça uma ação adicional de procurar pistas gastando 2 PE',
      'Investigue mais rapidamente que o resto do grupo',
      'Em cenas com limite de tempo, maximize suas descobertas'
    ],
    synergies: [
      { abilityId: 'perito', abilityName: 'Perito', description: 'Mais testes = mais chances de usar Perito' },
      { abilityId: 'na-trilha-certa', abilityName: 'Na Trilha Certa', description: 'Mais testes para encadear bônus' }
    ],
    tips: 'Uma vez por rodada durante investigação. Acelera muito a resolução de mistérios.'
  },
  
  'perito-explosivos': {
    id: 'perito-explosivos',
    examples: [
      'Seus explosivos têm DT aumentada baseada em Int',
      'Exclua aliados da área de explosão (até seu valor de Int)',
      'Use granadas com precisão cirúrgica'
    ],
    synergies: [
      { abilityId: 'mochila-utilidades', abilityName: 'Mochila de Utilidades', description: 'Carregue mais explosivos' },
      { abilityId: 'conhecimento-aplicado', abilityName: 'Conhecimento Aplicado', description: 'Int alto melhora ambos os poderes' }
    ],
    tips: 'Com Int 5, você pode excluir 5 aliados de uma explosão. Perfeito para emboscadas.'
  },
  
  'primeira-impressao': {
    id: 'primeira-impressao',
    examples: [
      '+5 na primeira Diplomacia para convencer um NPC importante',
      '+5 na primeira Intimidação contra um inimigo',
      '+5 na primeira Enganação para criar um disfarce'
    ],
    synergies: [
      { abilityId: 'perito', abilityName: 'Perito', description: 'Combine Perito com o bônus de primeira impressão' },
      { abilityId: 'nerd', abilityName: 'Nerd', description: 'Use conhecimento para causar melhor impressão' }
    ],
    tips: 'Funciona em Diplomacia, Enganação, Intimidação ou Intuição. Planeje seu primeiro teste!'
  },
  
  'transcender-esp': {
    id: 'transcender-esp',
    examples: [
      'Ganhe um poder paranormal mesmo sendo Especialista',
      'Escolha poderes que complementem suas perícias',
      'Combine conhecimento mundano com habilidades sobrenaturais'
    ],
    synergies: [
      { abilityId: 'balistica-avancada', abilityName: 'Balística Avançada', description: 'Combine combate mundano com poderes paranormais' }
    ],
    tips: 'ATENÇÃO: Não ganha Sanidade neste aumento de NEX. Pode ser escolhido múltiplas vezes.'
  },
  
  'treinamento-pericia-esp': {
    id: 'treinamento-pericia-esp',
    evolution: {
      nexMarkers: [15, 35, 70],
      descriptions: [
        'Torna-se treinado em 2 perícias',
        'Pode escolher perícias já treinadas para veterano',
        'Pode escolher perícias veteranas para expert'
      ]
    },
    examples: [
      'Treine Percepção e Investigação para ser um detetive completo',
      'Em NEX 35%, torne-se veterano em suas perícias principais',
      'Em NEX 70%, alcance expert nas perícias essenciais'
    ],
    tips: 'Pode ser escolhido múltiplas vezes. Especialistas brilham com perícias - invista!'
  }
};

// ==================== DETALHES DOS PODERES DO OCULTISTA ====================

export const OCULTISTA_DETAILS: Record<string, AbilityDetails> = {
  // === HABILIDADES CORE ===
  'escolhido-pelo-outro-lado': {
    id: 'escolhido-pelo-outro-lado',
    evolution: {
      nexMarkers: [5, 25, 55, 85],
      descriptions: [
        'Rituais de 1º círculo (3 rituais iniciais)',
        'Rituais de 2º círculo desbloqueados',
        'Rituais de 3º círculo desbloqueados',
        'Rituais de 4º círculo desbloqueados'
      ]
    },
    examples: [
      'Em NEX 5%, lance rituais básicos como Arma Atroz ou Proteção',
      'Em NEX 25%, acesse rituais poderosos como Velocidade',
      'Em NEX 55%, utilize rituais devastadores de 3º círculo',
      'Em NEX 85%, domine os rituais mais poderosos do jogo'
    ],
    tips: 'Você aprende 1 ritual novo a cada aumento de NEX. Escolha rituais que complementem o grupo.'
  },
  
  'afinidade-elemental': {
    id: 'afinidade-elemental',
    examples: [
      'Sangue: rituais de cura, vitalidade e manipulação de vida',
      'Energia: rituais de dano, destruição e manipulação de forças',
      'Conhecimento: rituais de informação, controle mental e adivinhação',
      'Morte: rituais de necromancia, medo e enfraquecimento',
      'Medo: rituais de terror, ilusão e manipulação emocional'
    ],
    synergies: [
      { abilityId: 'especialista-em-elemento', abilityName: 'Especialista em Elemento', description: 'Aumente a DT de rituais do seu elemento' },
      { abilityId: 'mestre-em-elemento', abilityName: 'Mestre em Elemento', description: 'Reduza o custo de rituais do seu elemento' }
    ],
    tips: 'Escolha com cuidado - define seu estilo de ocultismo. Alguns rituais só funcionam com elementos específicos.'
  },
  
  'poder-paranormal': {
    id: 'poder-paranormal',
    examples: [
      'Ganhe um poder paranormal à sua escolha',
      'Poderes como Abrigo Mental protegem contra ataques psíquicos',
      'Poderes como Telecinese permitem manipular objetos à distância'
    ],
    tips: 'Pesquise os poderes paranormais disponíveis. Alguns são extremamente poderosos em builds específicos.'
  },
  
  'segundo-circulo': {
    id: 'segundo-circulo',
    examples: [
      'Desbloqueie rituais mais poderosos como Velocidade',
      'Acesse curas mais fortes e danos maiores',
      'Rituais de utilidade avançados disponíveis'
    ],
    tips: 'Marco importante em NEX 25%. Planeje quais rituais de 2º círculo você quer aprender.'
  },
  
  'terceiro-circulo': {
    id: 'terceiro-circulo',
    examples: [
      'Rituais devastadores de alto nível',
      'Capacidades que mudam o rumo de combates',
      'Utilidades poderosas para investigação'
    ],
    tips: 'Em NEX 55% você se torna um ocultista de verdade. Escolha rituais que definam seu estilo.'
  },
  
  'quarto-circulo': {
    id: 'quarto-circulo',
    examples: [
      'Os rituais mais poderosos do Outro Lado',
      'Capacidades que desafiam a realidade',
      'Poder absoluto sobre seu elemento'
    ],
    tips: 'Ápice do poder paranormal em NEX 85%. Use com sabedoria - ou loucura.'
  },
  
  // === PODERES ESCOLHÍVEIS ===
  'camuflar-ocultismo': {
    id: 'camuflar-ocultismo',
    examples: [
      'Esconda sigilos tatuados em sua pele de olhares curiosos',
      'Lance um ritual sem que ninguém perceba (+2 PE)',
      'Disfarce atividades paranormais em ambientes públicos'
    ],
    synergies: [
      { abilityId: 'tatuagem-ritualistica', abilityName: 'Tatuagem Ritualística', description: 'Esconda suas tatuagens e lance rituais pessoais secretamente' },
      { abilityId: 'envolto-em-misterio', abilityName: 'Envolto em Mistério', description: 'Controle quando revelar sua natureza paranormal' }
    ],
    tips: 'DT 25 em Ocultismo para perceber seu ritual. Perfeito para infiltrações e situações sociais.'
  },
  
  'criar-selo': {
    id: 'criar-selo',
    examples: [
      'Crie um selo de Proteção para usar em emergência',
      'Prepare selos de cura para o grupo antes de missões',
      'Tenha rituais prontos sem gastar ações em combate'
    ],
    synergies: [
      { abilityId: 'ritual-predileto', abilityName: 'Ritual Predileto', description: 'Reduza o custo de criar selos do seu ritual favorito' },
      { abilityId: 'tatuagem-ritualistica', abilityName: 'Tatuagem Ritualística', description: 'Combine selos com tatuagens para máxima eficiência' }
    ],
    tips: 'Máximo de selos = sua Presença. Prepare-se antes das missões! Selos não exigem componentes na ativação.'
  },
  
  'envolto-em-misterio': {
    id: 'envolto-em-misterio',
    examples: [
      '+5 em Enganação contra pessoas não treinadas em Ocultismo',
      '+5 em Intimidação usando sua aura sobrenatural',
      'Manipule cultistas e supersticiosos com facilidade'
    ],
    synergies: [
      { abilityId: 'camuflar-ocultismo', abilityName: 'Camuflar Ocultismo', description: 'Controle quando revelar e quando esconder sua natureza' },
      { abilityId: 'intuicao-paranormal', abilityName: 'Intuição Paranormal', description: 'Combine presença misteriosa com intuição sobrenatural' }
    ],
    tips: 'Funciona contra a maioria dos NPCs mundanos. Use para interrogatórios e negociações.'
  },
  
  'especialista-em-elemento': {
    id: 'especialista-em-elemento',
    examples: [
      'Rituais de Energia com DT +2 para resistir',
      'Rituais de Sangue mais difíceis de ignorar',
      'Seus rituais do elemento escolhido são mais poderosos'
    ],
    synergies: [
      { abilityId: 'mestre-em-elemento', abilityName: 'Mestre em Elemento', description: 'Pré-requisito para Mestre em Elemento' },
      { abilityId: 'afinidade-elemental', abilityName: 'Afinidade Elemental', description: 'Combine com sua afinidade para maximizar um elemento' }
    ],
    tips: 'Escolha o elemento que você mais usa. +2 na DT faz grande diferença contra inimigos.'
  },
  
  'ferramentas-paranormais': {
    id: 'ferramentas-paranormais',
    examples: [
      'Um item paranormal de categoria II conta como I',
      'Ative itens paranormais sem gastar PE',
      'Use itens amaldiçoados com menos risco'
    ],
    synergies: [
      { abilityId: 'ritual-potente', abilityName: 'Ritual Potente', description: 'Maximize uso de itens e rituais' },
      { abilityId: 'criar-selo', abilityName: 'Criar Selo', description: 'Combine selos com itens paranormais' }
    ],
    tips: 'Essencial se você encontrar muitos itens paranormais. Economiza PE e espaço de inventário.'
  },
  
  'guiado-pelo-paranormal': {
    id: 'guiado-pelo-paranormal',
    examples: [
      'Use seus poderes para encontrar pistas ocultas',
      'Faça uma ação de investigação adicional por 2 PE',
      'O Outro Lado sussurra segredos para você'
    ],
    synergies: [
      { abilityId: 'intuicao-paranormal', abilityName: 'Intuição Paranormal', description: 'Combine para ser o investigador sobrenatural do grupo' },
      { abilityId: 'identificacao-paranormal', abilityName: 'Identificação Paranormal', description: 'Investigue e identifique ameaças paranormais' }
    ],
    tips: 'Uma vez por cena. Ótimo para investigações onde o tempo é essencial.'
  },
  
  'identificacao-paranormal': {
    id: 'identificacao-paranormal',
    examples: [
      '+10 para identificar o que é aquela criatura do Outro Lado',
      '+10 para entender um objeto amaldiçoado',
      '+10 para reconhecer um ritual sendo lançado'
    ],
    synergies: [
      { abilityId: 'guiado-pelo-paranormal', abilityName: 'Guiado pelo Paranormal', description: 'Investigue e identifique ameaças' },
      { abilityId: 'intuicao-paranormal', abilityName: 'Intuição Paranormal', description: 'Combine intuição com conhecimento' }
    ],
    tips: '+10 é um bônus enorme! Você se torna o especialista do grupo em ameaças paranormais.'
  },
  
  'improvisar-componentes': {
    id: 'improvisar-componentes',
    examples: [
      'Encontre componentes de Sangue em um açougue',
      'Improvise componentes de Energia em uma usina',
      'Use objetos do ambiente como componentes rituais'
    ],
    synergies: [
      { abilityId: 'ritual-predileto', abilityName: 'Ritual Predileto', description: 'Combine com rituais de custo reduzido' },
      { abilityId: 'camuflar-ocultismo', abilityName: 'Camuflar Ocultismo', description: 'Lance rituais sem componentes preparados' }
    ],
    tips: 'DT 15 em Investigação. Use quando ficar sem componentes em campo. Depende do ambiente.'
  },
  
  'intuicao-paranormal': {
    id: 'intuicao-paranormal',
    examples: [
      'Some Int ou Pre em testes de facilitar investigação',
      'Ajude aliados com insights sobrenaturais',
      'Perceba conexões ocultas entre pistas'
    ],
    synergies: [
      { abilityId: 'guiado-pelo-paranormal', abilityName: 'Guiado pelo Paranormal', description: 'Seja o investigador paranormal definitivo' },
      { abilityId: 'ritual-potente', abilityName: 'Ritual Potente', description: 'Int alto beneficia ambos os poderes' }
    ],
    tips: 'Escolha Int ou Pre baseado no seu build. Ajudar o grupo é sempre valioso.'
  },
  
  'ritual-potente': {
    id: 'ritual-potente',
    prerequisites: {
      attributes: [{ attribute: 'Int', value: 2 }]
    },
    examples: [
      'Some Int ao dano de Raio Destruidor',
      'Some Int à cura de Rituais de Sangue',
      'Todos os seus rituais ficam mais fortes'
    ],
    synergies: [
      { abilityId: 'especialista-em-elemento', abilityName: 'Especialista em Elemento', description: 'Rituais mais fortes E mais difíceis de resistir' },
      { abilityId: 'mestre-em-elemento', abilityName: 'Mestre em Elemento', description: 'Rituais mais fortes E mais baratos' }
    ],
    tips: 'Essencial para Ocultistas focados em dano ou cura. Invista em Intelecto!'
  },
  
  'ritual-predileto': {
    id: 'ritual-predileto',
    examples: [
      'Proteção custa -1 PE (de 1 para 0 PE base)',
      'Seu ritual mais usado fica mais eficiente',
      'A redução acumula com outras fontes'
    ],
    synergies: [
      { abilityId: 'mestre-em-elemento', abilityName: 'Mestre em Elemento', description: 'Reduções de custo acumulam!' },
      { abilityId: 'tatuagem-ritualistica', abilityName: 'Tatuagem Ritualística', description: 'Combine reduções para rituais pessoais' }
    ],
    tips: 'Escolha seu ritual mais usado. Com múltiplas reduções, rituais podem custar 0 PE!'
  },
  
  'tatuagem-ritualistica': {
    id: 'tatuagem-ritualistica',
    examples: [
      '-1 PE em Proteção (alcance pessoal, você como alvo)',
      '-1 PE em qualquer buff pessoal',
      'Combine com outras reduções de custo'
    ],
    synergies: [
      { abilityId: 'ritual-predileto', abilityName: 'Ritual Predileto', description: 'Reduções acumulam para o mesmo ritual' },
      { abilityId: 'camuflar-ocultismo', abilityName: 'Camuflar Ocultismo', description: 'Esconda suas tatuagens místicas' }
    ],
    tips: 'Funciona apenas em rituais de alcance pessoal COM VOCÊ como alvo. Muito bom para buffs.'
  },
  
  'transcender-ocultista': {
    id: 'transcender-ocultista',
    examples: [
      'Ganhe um poder paranormal adicional',
      'Expanda suas capacidades sobrenaturais',
      'Pode ser escolhido múltiplas vezes'
    ],
    tips: 'ATENÇÃO: Não ganha Sanidade neste aumento de NEX. Use para poderes paranormais poderosos.'
  },
  
  'treinamento-em-pericia-ocultista': {
    id: 'treinamento-em-pericia-ocultista',
    evolution: {
      nexMarkers: [15, 35, 70],
      descriptions: [
        'Torna-se treinado em 2 perícias',
        'Pode escolher perícias já treinadas para veterano',
        'Pode escolher perícias veteranas para expert'
      ]
    },
    examples: [
      'Treine Ocultismo e Vontade para resistência mental',
      'Em NEX 35%, torne-se veterano em suas perícias principais',
      'Em NEX 70%, alcance expert em Ocultismo'
    ],
    tips: 'Pode ser escolhido múltiplas vezes. Ocultistas se beneficiam de Ocultismo e Vontade altos.'
  },
  
  // === PODERES COM NEX ALTO ===
  'mestre-em-elemento': {
    id: 'mestre-em-elemento',
    prerequisites: {
      nex: 45,
      abilities: ['Especialista em Elemento']
    },
    examples: [
      'Rituais de Energia custam -1 PE',
      'Lance mais rituais do seu elemento favorito',
      'Combine com outras reduções de custo'
    ],
    synergies: [
      { abilityId: 'especialista-em-elemento', abilityName: 'Especialista em Elemento', description: 'Requer este poder. Rituais fortes E baratos' },
      { abilityId: 'ritual-predileto', abilityName: 'Ritual Predileto', description: 'Reduções de custo acumulam!' },
      { abilityId: 'ritual-potente', abilityName: 'Ritual Potente', description: 'Rituais baratos E poderosos' }
    ],
    tips: 'NEX 45%+ e requer Especialista. Com múltiplas reduções, rituais ficam muito eficientes.'
  },
  
  'fluxo-de-poder': {
    id: 'fluxo-de-poder',
    prerequisites: {
      nex: 60
    },
    examples: [
      'Mantenha Proteção E Arma Atroz ao mesmo tempo',
      'Sustente dois efeitos com uma única ação livre',
      'Dobre sua versatilidade em combate'
    ],
    synergies: [
      { abilityId: 'ritual-predileto', abilityName: 'Ritual Predileto', description: 'Reduza o custo de manutenção' },
      { abilityId: 'tatuagem-ritualistica', abilityName: 'Tatuagem Ritualística', description: 'Rituais pessoais sustentados custam menos' }
    ],
    tips: 'NEX 60%+. Você ainda paga o custo de cada efeito, mas economiza ações. Muito poderoso!'
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
  
  // NEX mínimo (Ex: "NEX 30%", "NEX 60%")
  const nexMatch = prereqText.match(/NEX\s*(\d+)%?/i);
  if (nexMatch) prerequisites.nex = parseInt(nexMatch[1]);
  
  // Outros poderes (Ex: "Proteção Pesada", "Especialista em Elemento")
  const abilityMatches = prereqText.match(/(?:poder|habilidade)?\s*"?([A-Z][^,."]+)"?/gi);
  if (abilityMatches) {
    const abilities = abilityMatches
      .map(m => m.replace(/^(?:poder|habilidade)?\s*"?/i, '').replace(/"?\s*$/, ''))
      .filter(a => a.length > 2 && !a.match(/^(For|Agi|Int|Vig|Pre|NEX|treinado)/i));
    if (abilities.length > 0) prerequisites.abilities = abilities;
  }
  
  return Object.keys(prerequisites).length > 0 ? prerequisites : undefined;
}
