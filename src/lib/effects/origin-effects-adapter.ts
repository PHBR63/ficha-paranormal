// =====================================================
// Adaptador de Efeitos de Origem - COMPLETO
// Ordem Paranormal RPG v1.3
// =====================================================
//
// Converte poderes de origem para o formato UnifiedEffect
// Inclui 26 origens do Livro Base + 22 origens de Suplementos
//
// IDs de origens centralizados em: src/lib/constants/game-ids.ts
//

import type { UnifiedEffect, EffectMechanics, AttributeType } from '../unified-effects-engine';

/**
 * Mapeamento COMPLETO de poderes de origem para efeitos mecânicos
 * Baseado no Livro Base v1.3 + Suplementos Oficiais
 * 
 * Total: 48 origens mapeadas
 */
export const ORIGIN_POWER_EFFECTS: Record<string, {
  mechanics: EffectMechanics;
  description: string;
  isToggleable?: boolean;
  costPE?: number;
}> = {
  // =====================================================
  // LIVRO BASE - 26 ORIGENS
  // =====================================================
  
  // === Acadêmico - Saber é Poder ===
  // REGRA OFICIAL (Livro Base v1.3): "Quando faz um teste usando Intelecto, você pode gastar 2 PE 
  // para receber +5 nesse teste."
  'saber-e-poder': {
    mechanics: {
      // Bônus aplicado via toggle no momento do teste de INT
      attributeTestBonus: {
        attribute: 'intellect',
        bonus: 5,
      },
      specialEffects: ['Testes de INT: +5 por 2 PE (ativável)'],
    },
    description: 'Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Agente de Saúde - Técnica Medicinal ===
  // REGRA OFICIAL (Livro Base v1.3): "Sempre que cura um personagem, você adiciona seu Intelecto 
  // no total de PV curados."
  'tecnica-medicinal': {
    mechanics: {
      // Bônus de cura baseado no Intelecto - aplicado automaticamente em TODAS as curas
      healingBonus: 'intellect', // Flag: indica que INT é somado ao total de cura
      specialEffects: ['Cura: +INT PV curados (passivo)'],
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
      specialEffects: ['1 item (exceto arma) conta como 1 categoria abaixo'],
    },
    description: 'Um item a sua escolha (exceto armas) conta como uma categoria abaixo.',
  },
  
  // === Executivo - Processo Otimizado ===
  'processo-otimizado': {
    mechanics: {
      specialEffects: ['Teste estendido ou revisão de documentos: +5 por 2 PE'],
    },
    description: 'Em teste estendido ou revisão de documentos, pode pagar 2 PE para +5.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Investigador - Faro para Pistas ===
  'faro-para-pistas': {
    mechanics: {
      skillBonus: { investigacao: 5 },
      specialEffects: ['+5 em Investigação (já incluído)'],
    },
    description: 'Você recebe +5 em Investigação.',
  },
  
  // === Lutador - Mão Pesada ===
  'mao-pesada': {
    mechanics: {
      meleeDamageBonus: 2, // +2 dano com ataques desarmados
      specialEffects: ['Dano desarmado: +2'],
    },
    description: 'Seus ataques desarmados causam +2 de dano.',
  },
  
  // === Magnata - Patrocinador da Ordem ===
  'patrocinador-da-ordem': {
    mechanics: {
      specialEffects: ['Limite de crédito +1 categoria', 'Se usar: patente efetiva -1 na missão'],
    },
    description: 'Seu limite de crédito é uma categoria acima. Se usar, patente efetiva -1.',
    isToggleable: true,
  },
  
  // === Mercenário - Posição de Combate ===
  'posicao-de-combate': {
    mechanics: {
      initiativeBonus: 5, // +5 Iniciativa
    },
    description: 'Você recebe +5 em Iniciativa.',
  },
  
  // === Militar - Para Bellum ===
  // REGRA OFICIAL (Livro Base v1.3): "+2 em rolagens de dano com armas de fogo"
  'para-bellum': {
    mechanics: {
      rangedDamageBonus: 2, // +2 dano com armas de fogo (tipo Disparo)
      conditionalNote: 'Apenas com armas de fogo (tipo Disparo)',
    },
    description: 'Você recebe +2 em rolagens de dano com armas de fogo.',
  },
  
  // === Operário - Ferramenta de Trabalho ===
  // REGRA OFICIAL (Livro Base v1.3): "Escolha uma arma simples ou tática que poderia ser usada como ferramenta
  // em sua profissão. Você sabe usar a arma escolhida e recebe +1 em testes de ataque, rolagens de dano
  // e margem de ameaça com ela."
  'ferramenta-de-trabalho': {
    mechanics: {
      // Bônus aplicados APENAS quando usando a arma vinculada (gerenciado pelo sistema de seleção)
      attackBonus: 1,           // +1 ataque
      damageBonus: 1,           // +1 dano
      criticalMarginBonus: 1,   // +1 margem de ameaça (reduz margem crítica em 1)
      requiresChosenWeapon: true, // Flag: indica que precisa de arma escolhida para aplicar bônus
      conditionalNote: 'Apenas com a arma escolhida (simples ou tática)',
    },
    description: 'Escolha uma arma simples ou tática. Você recebe +1 em testes de ataque, rolagens de dano e margem de ameaça com ela.',
  },
  
  // === Policial - Patrulha ===
  'patrulha': {
    mechanics: {
      defenseBonus: 2, // +2 Defesa
    },
    description: 'Você recebe +2 em Defesa.',
  },
  
  // === Religioso - Acalentar ===
  'acalentar': {
    mechanics: {
      specialEffects: ['1x/cena: +10 em teste de atributo de aliado adjacente'],
    },
    description: 'Uma vez por cena, um aliado adjacente recebe +10 em um teste de atributo.',
    isToggleable: true,
  },
  
  // === Servidor Público - Espírito Cívico ===
  'espirito-civico': {
    mechanics: {
      fortitudeBonus: 2,
      reflexosBonus: 2,
      vontadeBonus: 2,
    },
    description: 'Você recebe +2 em Fortitude, Reflexos e Vontade.',
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
  // REGRA OFICIAL (Livro Base v1.3): "Uma vez por cena, você pode gastar 2 PE para 
  // substituir um teste de perícia qualquer por um teste de Enganação."
  'impostor': {
    mechanics: {
      specialEffects: [
        '1x/cena: Substitui teste por Enganação (2 PE)',
      ],
    },
    description: 'Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Universitário - Dedicação ===
  // REGRA OFICIAL (Livro Base v1.3): "Você recebe +1 PE, e mais 1 PE adicional a cada NEX ímpar 
  // (15%, 25%...). Além disso, seu limite de PE por turno aumenta em 1 (em NEX 5% seu limite é 2, 
  // em NEX 10% é 3 e assim por diante; isso não afeta a DT de seus efeitos)."
  'dedicacao': {
    mechanics: {
      peBonus: 1,             // +1 PE base
      peBonusOddNex: 1,       // +1 PE adicional a cada NEX ímpar (15%, 25%, 35%...)
      peLimitBonus: 1,        // Limite de PE por turno +1 (passivo)
      specialEffects: ['+1 PE base', '+1 PE por NEX ímpar (15%, 25%...)', 'Limite PE/turno +1'],
    },
    description: 'Você recebe +1 PE, e mais 1 PE adicional a cada NEX ímpar (15%, 25%...). Além disso, seu limite de PE por turno aumenta em 1.',
  },
  
  // === Vítima - Cicatrizes Psicológicas ===
  // REGRA OFICIAL (Livro Base v1.3): "Você recebe +1 de Sanidade para cada 5% de NEX."
  'cicatrizes-psicologicas': {
    mechanics: {
      sanityBonusPerNex: 1,   // +1 SAN para cada 5% de NEX (passivo, automático)
      specialEffects: ['+1 SAN para cada 5% de NEX'],
    },
    description: 'Você recebe +1 de Sanidade para cada 5% de NEX.',
  },

  // =====================================================
  // SUPLEMENTOS - 22 ORIGENS EXTRAS
  // =====================================================
  
  // === Amigo dos Animais - Companheiro Animal ===
  'companheiro-animal': {
    mechanics: {
      specialEffects: [
        'Entende intenções/sentimentos de animais',
        'Aliado animal: +2 em perícia escolhida',
        'NEX 35%: aliado de tipo escolhido',
        'NEX 70%: bônus de segundo tipo de aliado',
      ],
    },
    description: 'Você possui um companheiro animal que fornece bônus progressivos.',
  },
  
  // === Astronauta - Acostumado ao Extremo ===
  'acostumado-ao-extremo': {
    mechanics: {
      damageResistance: { mental: 0 }, // 1 + INT, calculado dinamicamente
      specialEffects: ['RD mental = 1 + INT (reduz em 1 cada uso por cena)'],
    },
    description: 'Você recebe resistência a dano mental igual a 1 + seu Intelecto.',
  },
  
  // === Chef do Outro Lado - Fome do Outro Lado ===
  'fome-do-outro-lado': {
    mechanics: {
      specialEffects: [
        'Usa partes de criaturas como ingredientes',
        'Teste Profissão DT 20+1d6: RD 10 tipo do elemento OU vulnerabilidade',
      ],
    },
    description: 'Pode cozinhar partes de criaturas paranormais para criar efeitos.',
    isToggleable: true,
  },
  
  // === Colegial - Poder da Amizade ===
  'poder-da-amizade': {
    mechanics: {
      skillBonus: {}, // +2 em todos os testes perto de amigos
      specialEffects: [
        'Perto de amigo: +2 em testes de perícia',
        'Amigo morre: -1 PE por 5% NEX até fim da missão',
      ],
    },
    description: 'Perto de um amigo escolhido, você recebe +2 em testes de perícia.',
  },
  
  // === Cosplayer - Não é Fantasia, é Cosplay! ===
  'nao-e-fantasia-e-cosplay': {
    mechanics: {
      specialEffects: [
        'Disfarce usando Artes ao invés de Enganação',
        'Com cosplay relacionado: +2 no teste',
      ],
    },
    description: 'Use Artes para disfarce e ganhe +2 em testes relacionados ao cosplay.',
  },
  
  // === Diplomata - Conexões ===
  'conexoes': {
    mechanics: {
      skillBonus: { diplomacia: 5 },
      specialEffects: ['+5 Diplomacia', '2 PE + 10 min: substitui teste por Diplomacia'],
    },
    description: 'Você recebe +5 em Diplomacia e pode usar contatos para ajuda.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Explorador - Manual do Sobrevivente ===
  'manual-do-sobrevivente': {
    mechanics: {
      specialEffects: [
        'Resistir armadilhas/clima/doenças/etc: +5 por 2 PE',
        'Sono precário conta como normal em interlúdio',
      ],
    },
    description: '+5 em testes de sobrevivência/resistência por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Experimento - Mutação ===
  'mutacao': {
    mechanics: {
      damageReduction: 2, // RD 2
      skillBonus: {}, // +2 em uma perícia de FOR/AGI/VIG (escolhida)
      specialEffects: ['RD 2', '+2 em perícia de FOR/AGI/VIG', '-2 Diplomacia/Enganação'],
    },
    description: 'RD 2, +2 em perícia física, mas -2 em Diplomacia e Enganação.',
  },
  
  // === Fanático por Criaturas - Conhecimento Oculto ===
  'conhecimento-oculto': {
    mechanics: {
      specialEffects: [
        'Identifica criaturas por pistas com Ocultismo',
        'Após identificar: +2 em todos os testes contra a criatura',
      ],
    },
    description: 'Identifica criaturas por pistas e ganha +2 contra elas.',
  },
  
  // === Fotógrafo - Através da Lente ===
  'atraves-da-lente': {
    mechanics: {
      specialEffects: ['Investig/Percepção através de câmera: +5 por 2 PE'],
    },
    description: '+5 em Investigação/Percepção através de câmera por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Inventor Paranormal - Invenção Paranormal ===
  'invencao-paranormal': {
    mechanics: {
      specialEffects: [
        'Item que executa ritual de 1º círculo',
        'Teste Profissão DT 15+5/uso: conjura sem custo PE',
        'Falha: enguiça até interlúdio',
      ],
    },
    description: 'Você possui um invento que replica um ritual de 1º círculo.',
    isToggleable: true,
  },
  
  // === Jovem Místico - A Culpa é das Estrelas ===
  'a-culpa-e-das-estrelas': {
    mechanics: {
      specialEffects: [
        'Início da cena: 1 PE + d6',
        'Número da sorte: +2 em testes até fim da cena',
        'Falha: próximo uso ganha +1 número da sorte',
      ],
    },
    description: 'Role para ativar bônus de +2 em testes baseado em número da sorte.',
    isToggleable: true,
    costPE: 1,
  },
  
  // === Legista do Turno da Noite - Luto Habitual ===
  'luto-habitual': {
    mechanics: {
      damageResistance: { mental: 50 }, // 50% RD mental em cenas de morte/cadáver
      specialEffects: [
        'Metade do dano mental em cenas de morte/cadáveres',
        'Medicina (primeiros socorros/necropsia): +5 por 2 PE',
      ],
    },
    description: 'Metade do dano mental em cenas relacionadas à morte.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Motorista - Mãos no Volante ===
  'maos-no-volante': {
    mechanics: {
      specialEffects: [
        'Sem penalidade de ataque em veículo em movimento',
        'Pilotando: +5 em Pilotagem/resistência por 2 PE',
      ],
    },
    description: 'Sem penalidade em veículos e +5 em Pilotagem por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Nerd Entusiasta - O Inteligentão ===
  'o-inteligentao': {
    mechanics: {
      specialEffects: [
        'Interlúdio: pesquisa dá +1d10 em teste de INT/PRE',
        'Máximo de dados = Intelecto',
        '1 dado por teste',
      ],
    },
    description: 'Pesquisa em interlúdio dá dados de bônus para testes.',
    isToggleable: true,
  },
  
  // === Psicólogo - Terapia ===
  'terapia': {
    mechanics: {
      specialEffects: [
        'Profissão (psicólogo) como Diplomacia',
        '1x/rodada: aliado falha em resistência a dano mental, 2 PE para rerrolar com Profissão',
      ],
    },
    description: 'Use Profissão como Diplomacia e proteja aliados de dano mental.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Profetizado - Luta ou Fuga ===
  'luta-ou-fuga': {
    mechanics: {
      vontadeBonus: 2, // +2 Vontade
      specialEffects: [
        '+2 Vontade',
        'Referência à premonição: +2 PE temporários até fim da cena',
      ],
    },
    description: '+2 em Vontade e PE temporários quando vê sinais da premonição.',
  },
  
  // === Repórter Investigativo - Encontrar a Verdade ===
  'encontrar-a-verdade': {
    mechanics: {
      specialEffects: [
        'Investigação como Diplomacia para persuadir',
        'Interrogar: +5 por 2 PE',
      ],
    },
    description: 'Use Investigação como Diplomacia e +5 ao interrogar por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Hacker (T.I. alternativo) - Motor de Busca ===
  'hacker': {
    mechanics: {
      specialEffects: ['Com internet: substitui teste de perícia por Tecnologia por 2 PE'],
    },
    description: 'Com acesso à internet, pode substituir qualquer teste de perícia por Tecnologia por 2 PE.',
    isToggleable: true,
    costPE: 2,
  },
  
  // === Diplomata (Livro Base alternativo) - Expedito ===
  'expedito': {
    mechanics: {
      skillBonus: { diplomacia: 5 },
    },
    description: 'Você recebe +5 em Diplomacia.',
  },
  
  // === Detetive (Investigador alternativo) - Faro para Pistas ===
  'detetive': {
    mechanics: {
      skillBonus: { investigacao: 5 },
    },
    description: 'Você recebe +5 em Investigação.',
  },
  
  // === Médico (Agente de Saúde alternativo) - Técnica Medicinal ===
  'medico': {
    mechanics: {
      healingBonus: 'intellect', // Flag: indica que INT é somado ao total de cura
      specialEffects: ['Cura: +INT PV curados (passivo)'],
    },
    description: 'Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados.',
  },
};

/**
 * Mapeamento COMPLETO de nomes de origem para ID do poder
 * Inclui origens do Livro Base + Suplementos
 */
const ORIGIN_NAME_TO_POWER_ID: Record<string, string> = {
  // === LIVRO BASE (26 origens) ===
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
  'universitario': 'dedicacao',
  'vitima': 'cicatrizes-psicologicas',
  
  // === SUPLEMENTOS (22 origens) ===
  'amigo-dos-animais': 'companheiro-animal',
  'astronauta': 'acostumado-ao-extremo',
  'chef-do-outro-lado': 'fome-do-outro-lado',
  'colegial': 'poder-da-amizade',
  'cosplayer': 'nao-e-fantasia-e-cosplay',
  'diplomata': 'conexoes',
  'explorador': 'manual-do-sobrevivente',
  'experimento': 'mutacao',
  'fanatico-por-criaturas': 'conhecimento-oculto',
  'fotografo': 'atraves-da-lente',
  'inventor-paranormal': 'invencao-paranormal',
  'jovem-mistico': 'a-culpa-e-das-estrelas',
  'legista-turno-noite': 'luto-habitual',
  'motorista': 'maos-no-volante',
  'nerd-entusiasta': 'o-inteligentao',
  'psicologo': 'terapia',
  'profetizado': 'luta-ou-fuga',
  'reporter-investigativo': 'encontrar-a-verdade',
  
  // === ALIASES (variações de nomes) ===
  'hacker': 'motor-de-busca',
  'detetive': 'faro-para-pistas',
  'medico': 'tecnica-medicinal',
  'agente-saude': 'tecnica-medicinal',
  'cultista': 'tracos-do-outro-lado',
  'teorico-conspiracao': 'eu-ja-sabia',
  'trabalhador': 'desbravador',
  't.i.': 'motor-de-busca',
  't-i': 'motor-de-busca',
  'servidor': 'espirito-civico',
  'investidor': 'faro-para-pistas',
  'legista': 'luto-habitual',
  'reporter': 'encontrar-a-verdade',
  'jornalista': 'encontrar-a-verdade',
  'nerd': 'o-inteligentao',
  'mistico': 'a-culpa-e-das-estrelas',
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
    // === LIVRO BASE (26 origens) ===
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
    'dedicacao': 'Dedicação',
    'cicatrizes-psicologicas': 'Cicatrizes Psicológicas',
    
    // === SUPLEMENTOS ===
    'companheiro-animal': 'Companheiro Animal',
    'acostumado-ao-extremo': 'Acostumado ao Extremo',
    'fome-do-outro-lado': 'Fome do Outro Lado',
    'poder-da-amizade': 'Poder da Amizade',
    'nao-e-fantasia-e-cosplay': 'Não é Fantasia, é Cosplay!',
    'conexoes': 'Conexões',
    'manual-do-sobrevivente': 'Manual do Sobrevivente',
    'mutacao': 'Mutação',
    'conhecimento-oculto': 'Conhecimento Oculto',
    'atraves-da-lente': 'Através da Lente',
    'invencao-paranormal': 'Invenção Paranormal',
    'a-culpa-e-das-estrelas': 'A Culpa é das Estrelas',
    'luto-habitual': 'Luto Habitual',
    'maos-no-volante': 'Mãos no Volante',
    'o-inteligentao': 'O Inteligentão',
    'terapia': 'Terapia',
    'luta-ou-fuga': 'Luta ou Fuga',
    'encontrar-a-verdade': 'Encontrar a Verdade',
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
