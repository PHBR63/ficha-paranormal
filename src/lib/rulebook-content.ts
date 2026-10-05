/**
 * Conteúdo educativo do livro de regras - Ordem Paranormal RPG
 * 
 * Este arquivo centraliza todos os textos explicativos para ajudar
 * jogadores a entenderem as mecânicas durante a criação de personagem.
 */

// ========================================
// TIPOS
// ========================================

export interface RulebookTip {
  title: string;
  content: string;
  quote?: string;
  quoteSource?: string;
  details?: string[];
}

export interface RulebookSection {
  main: RulebookTip;
  extras?: RulebookTip[];
}

// ========================================
// GLOSSÁRIO DE TERMOS
// ========================================

export const GLOSSARY: Record<string, string> = {
  'NEX': 'Nível de Exposição Paranormal - representa a exposição do personagem ao Outro Lado.',
  'PV': 'Pontos de Vida - representam a saúde física do personagem. Quando chegam a zero, ele fica inconsciente.',
  'PE': 'Pontos de Esforço - usados para ativar habilidades especiais, rituais e esforços extras.',
  'SAN': 'Sanidade - representa a estabilidade mental. Diminui ao enfrentar horrores do Outro Lado.',
  'DT': 'Dificuldade do Teste - valor que você precisa igualar ou superar na rolagem de dado.',
  'RD': 'Resistência a Dano - absorve parte do dano recebido, geralmente vindo de armaduras.',
  'DEF': 'Defesa - representa o quão difícil é acertar você em combate. DEF = 10 + Agilidade.',
  'Treinado': 'Perícia em que você tem +5 de bônus. Algumas perícias só podem ser usadas se você for treinado.',
  'Destreinado': 'Perícia sem bônus. O atributo determina os d20; o treinamento não acrescenta bônus.',
  'Teste': 'Role os d20 determinados pelo atributo, selecione o resultado e some treinamento e outros modificadores contra a DT.',
  'Outro Lado': 'Dimensão paranormal de onde vêm as criaturas e energias sobrenaturais.',
  'Ordo Realitas': 'Organização secreta que combate ameaças paranormais. Seu personagem é um agente.',
  'Elemento': 'Tipo de energia paranormal: Sangue, Morte, Conhecimento, Energia ou Medo.',
  'Círculo': 'Nível de poder de um ritual. Quanto maior o círculo, mais poderoso e caro em PE.',
  'Proficiência': 'Capacidade de usar um tipo de equipamento (armas, armaduras) sem penalidades.',
};

// ========================================
// FÓRMULAS RÁPIDAS
// ========================================

export const QUICK_FORMULAS = [
  { name: 'Teste de Perícia', formula: 'd20 selecionado + Treinamento + modificadores vs DT' },
  { name: 'Defesa (DEF)', formula: '10 + Agilidade' },
  { name: 'PV (Combatente)', formula: '20 + Vigor (por NEX: +4 + Vigor)' },
  { name: 'PV (Especialista)', formula: '16 + Vigor (por NEX: +3 + Vigor)' },
  { name: 'PV (Ocultista)', formula: '12 + Vigor (por NEX: +2 + Vigor)' },
  { name: 'PE (Combatente)', formula: '2 + Presença (por NEX: +2 + Presença)' },
  { name: 'PE (Especialista)', formula: '3 + Presença (por NEX: +3 + Presença)' },
  { name: 'PE (Ocultista)', formula: '4 + Presença (por NEX: +4 + Presença)' },
  { name: 'Sanidade', formula: 'Determinada pela classe' },
  { name: 'Deslocamento', formula: '9m (padrão)' },
  { name: 'Treinamento', formula: '+5 no teste da perícia' },
  { name: 'Atributo Zero', formula: 'Rola 2d20 e pega o menor' },
];

// ========================================
// CONTEÚDO POR STEP
// ========================================

export const STEP_CONTENT: Record<string, RulebookSection> = {
  // ---- CONCEITO ----
  concept: {
    main: {
      title: 'O que é um Agente?',
      content: 'Seu personagem é um agente da Ordo Realitas, uma organização secreta que investiga e combate ameaças paranormais. O conceito é uma frase curta que resume quem seu personagem é — sua essência.',
      quote: '"Antes de ser um agente, você era alguém. O que aconteceu para você entrar nesse mundo?"',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Um bom conceito ajuda a guiar suas decisões durante o jogo',
        'Pense em algo que explique por que seu personagem está nessa vida',
        'Pode ser uma profissão, um trauma, ou uma motivação',
      ],
    },
    extras: [
      {
        title: 'Dica de Roleplay',
        content: 'O conceito não precisa ser complexo. "Ex-médica que viu coisas que não deveria" já conta uma história. Use isso para interpretar seu personagem nas sessões.',
      }
    ]
  },

  // ---- NEX ----
  nex: {
    main: {
      title: 'Nível de Experiência (NEX)',
      content: 'O NEX representa o quanto seu agente evoluiu na Ordo Realitas. Vai de 5% (recruta) até 99% (lenda viva). A cada aumento de NEX, você recebe benefícios como mais atributos, perícias e habilidades.',
      quote: '"Quanto maior seu NEX, mais você viu, mais você sabe — e mais você perdeu."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'NEX mede a exposição ao paranormal, com progressão de 5% a 99% para agentes.',
        'NEX e patente são progressões distintas; a patente depende de Prestígio.',
      ],
    },
    extras: [
      {
        title: 'Progressão de NEX',
        content: 'A cada 5% de NEX você ganha benefícios. Isso inclui pontos de atributo extras, perícias adicionais, e escolhas de habilidades de classe. Use isso para planejar seu personagem.',
      },
      {
        title: 'Importante',
        content: 'Se você está criando um personagem com NEX acima de 5%, certifique-se de que o Mestre autorizou. Personagens mais experientes são significativamente mais poderosos.',
      }
    ]
  },

  // ---- ATRIBUTOS ----
  attributes: {
    main: {
      title: 'Os Cinco Atributos',
      content: 'Atributos representam as capacidades fundamentais do seu personagem. Cada um vai de 0 a 5 e afeta diferentes aspectos do jogo. Você distribui pontos entre eles na criação.',
      quote: '"Seu corpo e mente são suas ferramentas mais importantes. Escolha sabiamente onde investir."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Agilidade (AGI): Reflexos, equilíbrio, precisão. Afeta Defesa.',
        'Força (FOR): Poder físico. Afeta dano corpo a corpo.',
        'Intelecto (INT): Raciocínio e memória. Dá perícias extras.',
        'Presença (PRE): Carisma e força de vontade. Afeta PE.',
        'Vigor (VIG): Resistência física. Afeta PV.',
      ],
    },
    extras: [
      {
        title: 'A Regra do Zero',
        content: 'Você pode reduzir UM atributo para 0 e ganhar +1 ponto extra para distribuir. Porém, qualquer teste usando esse atributo rola 2d20 e pega o MENOR resultado (desvantagem). Use com sabedoria!',
      },
      {
        title: 'Fórmulas Importantes',
        content: 'DEF = 10 + Agilidade. PV depende de Vigor + Classe. PE depende de Presença + Classe. Perícias livres: Combatente INT + 1; Especialista INT + 7; Ocultista INT + 3. Somam-se às concessões da origem e obrigatórias da classe.',
      }
    ]
  },

  // ---- ORIGEM ----
  origin: {
    main: {
      title: 'De Onde Você Veio?',
      content: 'A origem representa a vida do seu personagem ANTES de entrar para a Ordo Realitas. Ela define 2 perícias treinadas automaticamente e concede um poder especial único.',
      quote: '"Todo mundo tem um passado. O seu trouxe você até aqui."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Cada origem dá 2 perícias já treinadas',
        'O poder de origem é uma habilidade única e permanente',
        'Algumas origens têm modificadores especiais (ex: Amnésico)',
        'Escolha algo que combine com o conceito do personagem',
      ],
    },
    extras: [
      {
        title: 'Perícias da Origem',
        content: 'As perícias dadas pela origem são automáticas e não contam contra seu limite de perícias livres. Se uma perícia da origem conflitar com uma obrigatória da classe, escolha outra perícia para compensar o treinamento repetido.',
      },
      {
        title: 'Origens Especiais',
        content: 'Algumas origens têm regras especiais. O Amnésico escolhe duas perícias quaisquer. O Cultista Arrependido e a Vítima começam com metade da Sanidade máxima.',
      }
    ]
  },

  // ---- CLASSE ----
  class: {
    main: {
      title: 'As Três Classes',
      content: 'A classe define o papel do seu personagem em combate e investigação. Cada uma tem PV, PE e SAN diferentes, além de perícias e habilidades exclusivas.',
      quote: '"Há três caminhos na Ordem. O da força, o da perícia, e o do conhecimento proibido."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Combatente: Mais PV, foco em combate direto. Ideal para linha de frente.',
        'Especialista: Equilibrado, mais perícias. Versátil e adaptável.',
        'Ocultista: Mais PE, acesso a rituais. Poder paranormal, mas arriscado.',
      ],
    },
    extras: [
      {
        title: 'Combatente',
        content: 'O tanque do grupo. Tem o maior PV (20 + VIG inicial) e ganha +4 + VIG por NEX. Menos PE, mas é resistente e causa muito dano. Proficiente em todas as armas e armaduras.',
      },
      {
        title: 'Especialista',
        content: 'O coringa. PV médio (16 + VIG), PE médio (3 + PRE). Ganha mais perícias que qualquer classe (INT + 7). Excelente para investigação e utilidade fora de combate.',
      },
      {
        title: 'Ocultista',
        content: 'O místico. Menor PV (12 + VIG), mas mais PE (4 + PRE). ÚNICO que pode aprender rituais. Poderoso, mas sanidade é um recurso constante. Para jogadores que querem arriscar.',
      }
    ]
  },

  // ---- TRILHA ----
  track: {
    main: {
      title: 'Especialização de Classe',
      content: 'A trilha representa a especialização do seu personagem dentro da classe. Cada trilha oferece quatro habilidades, desbloqueadas em NEX 10%, 40%, 65% e 99%.',
      quote: '"Encontre seu caminho e domine-o. Não há espaço para meias medidas."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Você recebe a primeira habilidade de trilha em NEX 10%; o criador permite planejar sua escolha antes desse marco.',
        'Escolher a trilha antes de NEX 10% não libera sua primeira habilidade.',
        'Habilidades seguintes desbloqueiam conforme o NEX aumenta',
        'A trilha define seu estilo de jogo dentro da classe',
      ],
    },
    extras: [
      {
        title: 'Marcos de Trilha',
        content: 'NEX 10%: 1ª habilidade. NEX 40%: 2ª. NEX 65%: 3ª. NEX 99%: 4ª.',
      }
    ]
  },

  // ---- PERÍCIAS ----
  skills: {
    main: {
      title: 'Sistema de Perícias',
      content: 'Perícias representam conhecimentos e habilidades específicas. Ser treinado em uma perícia dá +5 nos testes. Algumas perícias só podem ser usadas se você for treinado.',
      quote: '"Conhecimento é poder. Treinamento é sobrevivência."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Teste de perícia: d20 selecionado + Treinamento + modificadores vs DT',
        'Treinado: +5. Veterano: +10. Expert: +15. O atributo define os dados e não é somado ao total.',
        'Perícias marcadas com ⚠ requerem treinamento para serem usadas',
        'Você recebe perícias da origem, classe, e escolhe perícias livres',
      ],
    },
    extras: [
      {
        title: 'Fontes de Perícias',
        content: 'Origem: 2 perícias automáticas. Classe: Perícias obrigatórias e escolhas. Livres: Baseado na classe + INT. Exemplo: Especialista recebe INT + 7 perícias à escolha.',
      },
      {
        title: 'Perícias que Requerem Treinamento',
        content: 'Algumas perícias como Ocultismo, Pilotagem, Medicina e outras só podem ser usadas se você tiver treinamento. Sem treinamento, você simplesmente não sabe fazer.',
      }
    ]
  },

  // ---- RITUAIS ----
  rituals: {
    main: {
      title: 'Rituais Paranormais',
      content: 'Rituais são poderes sobrenaturais disponíveis apenas para Ocultistas. Usam PE para serem conjurados e pertencem a um dos cinco Elementos paranormais.',
      quote: '"O Outro Lado oferece poder, mas cobra seu preço. Sempre."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Elementos: Sangue, Morte, Conhecimento, Energia, Medo',
        'Círculos: 1º ao 4º. Quanto maior, mais poderoso e caro',
        'Custo: Cada ritual gasta PE. Alguns têm aprimoramentos (+PE)',
        'NEX determina quantos rituais você conhece e círculo máximo',
      ],
    },
    extras: [
      {
        title: 'Os Cinco Elementos',
        content: 'Sangue: Cura e dano vital. Morte: Necromanc e enfraquecimento. Conhecimento: Informação e manipulação mental. Energia: Destruição e proteção. Medo: Terror e ilusões.',
      },
      {
        title: 'Progressão de Rituais',
        content: 'NEX 5%: 2 rituais, até 1º círculo. NEX 10%: 3 rituais. NEX 20%: até 2º círculo. NEX 35%: até 3º círculo. NEX 50%+: até 4º círculo. Quantidade aumenta a cada 5% de NEX.',
      }
    ]
  },

  // ---- HABILIDADES ----
  abilities: {
    main: {
      title: 'Habilidades de Classe',
      content: 'Além das habilidades da trilha, cada classe possui habilidades gerais que você pode escolher conforme sobe de NEX. Algumas são automáticas, outras são opcionais.',
      quote: '"Com experiência vem poder. Escolha bem como usar o seu."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Habilidades Fundamentais: Concedidas automaticamente pela classe',
        'Habilidades Opcionais: Você escolhe entre várias opções',
        'O número de escolhas aumenta com o NEX',
        'Leia as descrições com atenção - algumas mudam seu estilo de jogo',
      ],
    },
  },

  // ---- REVISÃO ----
  review: {
    main: {
      title: 'Finalizando o Dossiê',
      content: 'Revise todas as informações do seu personagem. Verifique se os cálculos estão corretos e se todas as escolhas foram feitas. Lembre-se: você pode editar qualquer seção clicando no ícone de edição.',
      details: [
        'Confira se todos os pontos de atributo foram distribuídos',
        'Verifique se as perícias livres foram escolhidas',
        'Para Ocultistas: confirme os rituais selecionados',
        'Revise as habilidades escolhidas',
      ],
    },
    extras: [
      {
        title: 'Resumo das Fórmulas',
        content: 'DEF = 10 + AGI. PV/PE/SAN dependem da classe e atributos. Teste = d20 selecionado + Treinamento (+5 se treinado) + modificadores. Atributo 0 = desvantagem (2d20, menor).',
      }
    ]
  },

  // ---- INFORMAÇÕES BÁSICAS ----
  basicInfo: {
    main: {
      title: 'Identificação do Agente',
      content: 'As informações básicas ajudam a dar vida ao seu personagem. O nome, o jogador que o controla e o histórico formam a base da identidade do seu agente.',
      quote: '"Um agente sem história é apenas uma ficha. Dê vida ao seu personagem."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'Nome do Personagem: Como ele é conhecido na Ordo',
        'Nome do Jogador: Quem controla este agente',
        'Histórico: Anote detalhes importantes, motivações e eventos passados',
      ],
    },
    extras: [
      {
        title: 'Dicas de Background',
        content: 'Use o histórico para registrar: como descobriu o paranormal, por que entrou na Ordem, relações importantes, medos e objetivos pessoais. Isso enriquece a interpretação.',
      }
    ]
  },

  // ---- PATENTE ----
  patent: {
    main: {
      title: 'Patentes na Ordo Realitas',
      content: `A patente representa seu posto hierárquico dentro da Ordem. Ela determina seu acesso a recursos, influência e responsabilidades.

| Patente | Pontos de Prestígio |
|---------|--------------------|
| Recruta | 0–19 |
| Operador | 20–49 |
| Agente Especial | 50–99 |
| Oficial de Operações | 100–199 |
| Agente de Elite | 200 ou mais |`,
      quote: '"A patente não é apenas um título. É prova do que você sobreviveu."',
      quoteSource: 'Texto de ambientação do aplicativo',
      details: [
        'A patente determina: limite de crédito, equipamentos disponíveis, acesso a informações',
        'Patentes mais altas trazem mais responsabilidade e missões perigosas',
        'Patente e NEX são progressões distintas: a patente depende de Pontos de Prestígio e decisão da campanha.',
      ],
    },
    extras: [
      {
        title: 'Importante',
        content: 'O NEX não determina automaticamente a patente. Confira os Pontos de Prestígio e a orientação do mestre.',
      },
      {
        title: 'Limite de Crédito',
        content: 'Cada patente define quanto a Ordem disponibiliza para equipamentos e despesas. Patentes mais altas têm acesso a itens paranormais e recursos especiais.',
      }
    ]
  },
};

// ========================================
// FUNÇÃO HELPER
// ========================================

/**
 * Retorna o conteúdo do rulebook para um step específico
 */
export function getRulebookContent(stepId: string): RulebookSection | null {
  return STEP_CONTENT[stepId] || null;
}

/**
 * Retorna a definição de um termo do glossário
 */
export function getGlossaryTerm(term: string): string | null {
  return GLOSSARY[term] || null;
}
