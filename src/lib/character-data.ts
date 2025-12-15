// Ordem Paranormal RPG v1.3 - Character Data (Atualizado com dados oficiais do livro)
// Inclui conteúdo do suplemento "Sobrevivendo ao Horror"

import { SUPPLEMENT_ORIGINS } from './supplement-origins';
import { SOBREVIVENTE_CLASS, SUPPLEMENT_TRACKS } from './supplement-classes';

// ==================== ORIGENS BASE (26 origens oficiais) ====================

const CORE_ORIGINS = [
  {
    id: 'academico',
    name: 'Acadêmico',
    description: 'Você passou boa parte da vida em instituições de ensino, dos anos de formação até o doutorado, se dedicando aos estudos e à carreira acadêmica.',
    skills: ['ciencias', 'investigacao'],
    powers: ['Saber é Poder'],
    powerDescription: 'Você pode gastar 2 PE para receber proficiência em um teste de perícia que você não é treinado.',
  },
  {
    id: 'agente-de-saude',
    name: 'Agente de Saúde',
    description: 'Você trabalha na área da saúde, seja como médico, enfermeiro, paramédico ou cuidador.',
    skills: ['intuicao', 'medicina'],
    powers: ['Técnico em Primeiros Socorros'],
    powerDescription: 'Quando usa a perícia Medicina para primeiros socorros, você cura +1d6 PV.',
  },
  {
    id: 'amnesico',
    name: 'Amnésico',
    description: 'Você perdeu a memória. Pode ter sido trauma, acidente ou algo mais sinistro. Você não sabe quem era antes.',
    skills: [], // Escolhe 2 perícias quaisquer
    powers: ['Memórias Fragmentadas'],
    powerDescription: 'Uma vez por missão, você pode "lembrar" de uma informação útil. O Mestre lhe dará uma dica sobre o cenário ou uma pista importante.',
    isAmnesic: true,
  },
  {
    id: 'artista',
    name: 'Artista',
    description: 'Você se expressa através de alguma forma de arte: música, pintura, escultura, dança, atuação ou outra.',
    skills: ['artes', 'enganacao'],
    powers: ['Inspiração'],
    powerDescription: 'Você pode gastar 2 PE para conceder +1d6 em um teste de um aliado que possa ver ou ouvir você.',
  },
  {
    id: 'atleta',
    name: 'Atleta',
    description: 'Você pratica algum esporte de forma profissional ou semiprofissional, dedicando-se ao condicionamento físico.',
    skills: ['acrobacia', 'atletismo'],
    powers: ['Corpo Atlético'],
    powerDescription: 'Você recebe +2 em Atletismo e seu deslocamento aumenta em 3m.',
  },
  {
    id: 'chef',
    name: 'Chef',
    description: 'Você é um cozinheiro habilidoso, capaz de preparar desde refeições simples até banquetes sofisticados.',
    skills: ['fortitude', 'profissao'],
    powers: ['Comfort Food'],
    powerDescription: 'Durante um descanso, você pode cozinhar para até 6 pessoas. Cada uma recupera +1d6 PV e PE extras.',
  },
  {
    id: 'criminoso',
    name: 'Criminoso',
    description: 'Você vive ou viveu do outro lado da lei, seja como ladrão, contrabandista, golpista ou membro de gangue.',
    skills: ['crime', 'furtividade'],
    powers: ['Contatos no Submundo'],
    powerDescription: 'Você pode conseguir itens ilegais ou informações do submundo. Uma vez por missão, pode adquirir um item ilegal de categoria até I sem custo.',
  },
  {
    id: 'cultista-arrependido',
    name: 'Cultista Arrependido',
    description: 'Você fez parte de um culto do Outro Lado antes de escapar ou ser resgatado. Carrega o peso do conhecimento proibido.',
    skills: ['ocultismo', 'religiao'],
    powers: ['Cicatrizes Interiores'],
    powerDescription: 'Você sabe coisas que não deveria. Recebe +5 em testes de Ocultismo, mas sua Sanidade máxima é reduzida em 5.',
    sanityModifier: -5,
  },
  {
    id: 'desgarrado',
    name: 'Desgarrado',
    description: 'Você não tem lar fixo. Vive nas ruas, viajando ou em abrigos. Aprendeu a sobreviver com pouco.',
    skills: ['fortitude', 'sobrevivencia'],
    powers: ['Acostumado ao Pior'],
    powerDescription: 'Você recebe resistência a frio 5 e a fome (pode passar o dobro do tempo sem comer antes de sofrer penalidades).',
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Você trabalha com relações públicas, política, negociações ou representação.',
    skills: ['diplomacia', 'intuicao'],
    powers: ['Língua de Prata'],
    powerDescription: 'Você recebe +2 em Diplomacia. Quando faz um teste de Diplomacia e falha, pode gastar 2 PE para rolar novamente.',
  },
  {
    id: 'engenheiro',
    name: 'Engenheiro',
    description: 'Você projeta e constrói coisas, desde pequenos gadgets até grandes estruturas.',
    skills: ['profissao', 'tecnologia'],
    powers: ['Ferramenta Favorita'],
    powerDescription: 'Você escolhe uma ferramenta. Recebe +5 em testes que utilizem essa ferramenta específica.',
  },
  {
    id: 'executivo',
    name: 'Executivo',
    description: 'Você ocupa uma posição de liderança em uma empresa ou organização, acostumado a tomar decisões e gerenciar pessoas.',
    skills: ['diplomacia', 'profissao'],
    powers: ['Burocracia'],
    powerDescription: 'Você pode fazer requisições à Ordem com +5 no teste. Uma vez por missão, pode adquirir um item de categoria até I sem custo.',
  },
  {
    id: 'investigador',
    name: 'Investigador',
    description: 'Você trabalha desvendando mistérios, seja como detetive particular, jornalista investigativo ou consultor.',
    skills: ['investigacao', 'percepcao'],
    powers: ['Faro para Pistas'],
    powerDescription: 'Uma vez por cena, quando faz um teste de Investigação ou Percepção, pode rolar 2d20 e escolher o melhor resultado.',
  },
  {
    id: 'lutador',
    name: 'Lutador',
    description: 'Você treinou artes marciais, boxe ou alguma forma de combate corporal, seja profissionalmente ou como hobby sério.',
    skills: ['luta', 'reflexos'],
    powers: ['Mãos Letais'],
    powerDescription: 'Seus ataques desarmados causam 1d6 de dano (em vez de 1d3) e você recebe +1 em Luta.',
  },
  {
    id: 'magnata',
    name: 'Magnata',
    description: 'Você vem de uma família rica ou construiu sua própria fortuna. Está acostumado a ter o que quer.',
    skills: ['diplomacia', 'pilotagem'],
    powers: ['Patrocinador da Ordem'],
    powerDescription: 'Você recebe +2 em testes de requisição e seu limite de crédito é uma categoria acima do normal para sua patente.',
  },
  {
    id: 'mercenario',
    name: 'Mercenário',
    description: 'Você trabalha como soldado particular, guarda-costas ou combatente de aluguel.',
    skills: ['iniciativa', 'intimidacao'],
    powers: ['Veterano de Campo'],
    powerDescription: 'Você recebe +2 em Iniciativa. Quando rola iniciativa e obtém um resultado menor que 10, considera como 10.',
  },
  {
    id: 'militar',
    name: 'Militar',
    description: 'Você serviu (ou serve) nas forças armadas, passando por treinamento militar rigoroso.',
    skills: ['pontaria', 'tatica'],
    powers: ['Treinamento de Combate'],
    powerDescription: 'Você recebe +2 em Pontaria e pode sacar ou guardar uma arma como ação livre.',
  },
  {
    id: 'operario',
    name: 'Operário',
    description: 'Você trabalha (ou trabalhou) em fábricas, construções ou manutenção, acostumado ao trabalho braçal.',
    skills: ['fortitude', 'profissao'],
    powers: ['Mãos Calejadas'],
    powerDescription: 'Você recebe +2 em Fortitude e resistência a dano de corte 2.',
  },
  {
    id: 'policial',
    name: 'Policial',
    description: 'Você trabalha (ou trabalhou) nas forças policiais, lidando com crime e ordem pública.',
    skills: ['percepcao', 'pontaria'],
    powers: ['Autoridade Policial'],
    powerDescription: 'Você possui identidade policial e porte de arma. Pode requisitar auxílio de autoridades locais (+5 no teste).',
  },
  {
    id: 'religioso',
    name: 'Religioso',
    description: 'Você é devoto de uma fé, possivelmente um líder religioso, e encontra conforto e força em sua crença.',
    skills: ['religiao', 'vontade'],
    powers: ['Fé Inabalável'],
    powerDescription: 'Você recebe +2 em Vontade e +5 em testes de resistência contra efeitos de medo.',
  },
  {
    id: 'servidor-publico',
    name: 'Servidor Público',
    description: 'Você trabalha (ou trabalhou) para o governo em alguma capacidade administrativa ou burocrática.',
    skills: ['diplomacia', 'investigacao'],
    powers: ['Acesso a Arquivos'],
    powerDescription: 'Você pode acessar registros e arquivos públicos restritos. Recebe +5 em testes para obter informações oficiais.',
  },
  {
    id: 'teorico-da-conspiracao',
    name: 'Teórico da Conspiração',
    description: 'Você sempre acreditou que há mais coisas entre o céu e a terra. Agora você sabe que estava certo.',
    skills: ['investigacao', 'ocultismo'],
    powers: ['Eu Avisei!'],
    powerDescription: 'Quando algo paranormal acontece pela primeira vez em uma cena, você pode gastar 2 PE para receber +5 em seu próximo teste.',
  },
  {
    id: 'ti',
    name: 'T.I.',
    description: 'Você trabalha com tecnologia da informação, programação, segurança digital ou suporte técnico.',
    skills: ['investigacao', 'tecnologia'],
    powers: ['Hacker'],
    powerDescription: 'Você recebe +5 em testes de Tecnologia para invadir sistemas e pode fazer isso remotamente.',
  },
  {
    id: 'trabalhador-rural',
    name: 'Trabalhador Rural',
    description: 'Você cresceu ou trabalha no campo, em fazendas, sítios ou áreas rurais.',
    skills: ['adestramento', 'sobrevivencia'],
    powers: ['Vida Simples'],
    powerDescription: 'Você se recupera mais rápido em ambientes naturais. Durante descansos ao ar livre, recupera +1d6 PV e PE extras.',
  },
  {
    id: 'trambiqueiro',
    name: 'Trambiqueiro',
    description: 'Você vive de pequenos golpes, trapaças e malandragem. Sabe como enganar pessoas e se safar de enrascadas.',
    skills: ['crime', 'enganacao'],
    powers: ['Golpista'],
    powerDescription: 'Você recebe +2 em Enganação. Quando faz um teste de Enganação e falha, pode gastar 2 PE para rolar novamente.',
  },
  {
    id: 'vitima',
    name: 'Vítima',
    description: 'Você sobreviveu a um encontro traumático com o paranormal antes de se tornar agente. As cicatrizes permanecem.',
    skills: ['reflexos', 'vontade'],
    powers: ['Cicatrizes Físicas'],
    powerDescription: 'Você recebe +1 em Defesa e resistência a dano de medo 2.',
  },
];

// Combina origens base com origens do suplemento
export const ORIGINS = [...CORE_ORIGINS, ...SUPPLEMENT_ORIGINS];

// ==================== CLASSES BASE ====================

const CORE_CLASSES = [
  {
    id: 'Combatente',
    name: 'Combatente',
    description: 'Especialista em combate, seja corpo a corpo ou à distância. Você é a linha de frente contra as ameaças do Outro Lado.',
    pvBase: 20,      // PV inicial = 20 + VIG
    pvPerNex: 4,     // +4 PV por NEX (além do 5%)
    peBase: 2,       // PE inicial = 2 + PRE
    pePerNex: 2,     // +2 PE por NEX
    sanBase: 12,     // SAN inicial = 12
    sanPerNex: 3,    // +3 SAN por NEX
    freeSkillsBase: 1,  // INT + 1 perícias livres
    proficiencies: ['Armas simples', 'Armas táticas', 'Proteções leves'],
    skillRules: {
      mandatory: [],
      choices: [
        { id: 'combat', options: ['luta', 'pontaria'], pick: 1, label: 'Luta ou Pontaria' },
        { id: 'defense', options: ['fortitude', 'reflexos'], pick: 1, label: 'Fortitude ou Reflexos' },
      ],
      freeFormula: 'INT + 1',
    },
    initialAbilities: ['Ataque Especial'],
    features: [
      'Maior quantidade de PV',
      'Ataques especiais poderosos',
      'Proficiência em armas táticas',
    ],
    tracks: ['Aniquilador', 'Comandante de Campo', 'Guerreiro', 'Operações Especiais', 'Tropa de Choque'],
  },
  {
    id: 'Especialista',
    name: 'Especialista',
    description: 'Perito em perícias e investigação. Você resolve problemas que não podem ser resolvidos apenas com força.',
    pvBase: 16,      // PV inicial = 16 + VIG
    pvPerNex: 3,     // +3 PV por NEX
    peBase: 3,       // PE inicial = 3 + PRE
    pePerNex: 3,     // +3 PE por NEX
    sanBase: 16,     // SAN inicial = 16
    sanPerNex: 4,    // +4 SAN por NEX
    freeSkillsBase: 7,  // INT + 7 perícias livres
    proficiencies: ['Armas simples', 'Proteções leves'],
    skillRules: {
      mandatory: [],
      choices: [],
      freeFormula: 'INT + 7',
    },
    initialAbilities: ['Eclético', 'Perícia'],
    features: [
      'Maior quantidade de perícias',
      'Pode usar perícias sem treinamento',
      'Versatilidade em investigação',
    ],
    tracks: ['Atirador de Elite', 'Infiltrador', 'Médico de Campo', 'Negociador', 'Técnico'],
  },
  {
    id: 'Ocultista',
    name: 'Ocultista',
    description: 'Conhecedor dos mistérios do Outro Lado. Você domina rituais paranormais, pagando o preço pela exposição ao desconhecido.',
    pvBase: 12,      // PV inicial = 12 + VIG
    pvPerNex: 2,     // +2 PV por NEX
    peBase: 4,       // PE inicial = 4 + PRE
    pePerNex: 4,     // +4 PE por NEX
    sanBase: 20,     // SAN inicial = 20
    sanPerNex: 5,    // +5 SAN por NEX
    freeSkillsBase: 3,  // INT + 3 perícias livres
    proficiencies: ['Armas simples'],
    skillRules: {
      mandatory: ['ocultismo', 'vontade'],
      choices: [],
      freeFormula: 'INT + 3',
    },
    initialAbilities: ['Afinidade Paranormal'],
    features: [
      'Maior quantidade de PE e SAN',
      'Acesso a rituais desde o início',
      'Conexão com o Outro Lado',
    ],
    tracks: ['Conduíte', 'Flagelador', 'Graduado', 'Intuitivo', 'Lâmina Paranormal'],
    ritualsPerNex: {
      5: { count: 1, maxCircle: 1 },
      10: { count: 2, maxCircle: 1 },
      15: { count: 3, maxCircle: 1 },
      20: { count: 4, maxCircle: 2 },
      25: { count: 5, maxCircle: 2 },
      30: { count: 6, maxCircle: 2 },
      35: { count: 7, maxCircle: 3 },
      40: { count: 8, maxCircle: 3 },
      45: { count: 9, maxCircle: 3 },
      50: { count: 10, maxCircle: 4 },
      55: { count: 11, maxCircle: 4 },
      60: { count: 12, maxCircle: 4 },
      65: { count: 13, maxCircle: 4 },
      70: { count: 14, maxCircle: 4 },
      75: { count: 15, maxCircle: 4 },
      80: { count: 16, maxCircle: 4 },
      85: { count: 17, maxCircle: 4 },
      90: { count: 18, maxCircle: 4 },
      95: { count: 19, maxCircle: 4 },
      99: { count: 20, maxCircle: 4 },
    },
  },
];

// Combina classes base com classe do suplemento (Sobrevivente)
export const CLASSES = [...CORE_CLASSES, SOBREVIVENTE_CLASS];

// ==================== TRILHAS DE CLASSE ====================

export interface ClassTrack {
  id: string;
  name: string;
  classId: string;
  description: string;
  abilities: TrackAbility[];
}

export interface TrackAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  isInitial?: boolean;
}

export const CLASS_TRACKS: ClassTrack[] = [
  // === TRILHAS DO COMBATENTE ===
  // Textos oficiais do livro base Ordem Paranormal RPG
  {
    id: 'aniquilador',
    name: 'Aniquilador',
    classId: 'Combatente',
    description: 'Você é treinado para abater alvos com eficiência e velocidade. Suas armas são suas melhores amigas e você cuida tão bem delas quanto de seus companheiros de equipe. Talvez até melhor.',
    abilities: [
      { 
        id: 'a-favorita', 
        name: 'A Favorita', 
        description: 'Escolha uma arma para ser sua favorita, como katana ou fuzil de assalto. A categoria da arma escolhida é reduzida em I.', 
        minNex: 10, 
        isInitial: true 
      },
      { 
        id: 'tecnica-secreta', 
        name: 'Técnica Secreta', 
        description: 'A categoria da arma favorita passa a ser reduzida em II. Quando faz um ataque com ela, você pode gastar 2 PE para executar um dos efeitos abaixo como parte do ataque. Você pode adicionar mais efeitos gastando +2 PE por efeito adicional.\n\n• Amplo. O ataque pode atingir um alvo adicional em seu alcance e adjacente ao original (use o mesmo teste de ataque para ambos).\n• Destruidor. Aumenta o multiplicador de crítico da arma em +1.', 
        minNex: 40 
      },
      { 
        id: 'tecnica-sublime', 
        name: 'Técnica Sublime', 
        description: 'Você adiciona os seguintes efeitos à lista de sua Técnica Secreta:\n\n• Letal. Aumenta a margem de ameaça em +2. Você pode escolher este efeito duas vezes para aumentar a margem de ameaça em +5.\n• Perfurante. Ignora até 5 pontos de resistência a dano de qualquer tipo do alvo.', 
        minNex: 65 
      },
      { 
        id: 'maquina-de-matar', 
        name: 'Máquina de Matar', 
        description: 'A categoria da arma favorita passa a ser reduzida em III, ela recebe +2 na margem de ameaça e seu dano aumenta em um dado do mesmo tipo.', 
        minNex: 99 
      },
    ],
  },
  {
    id: 'comandante-campo',
    name: 'Comandante de Campo',
    classId: 'Combatente',
    description: 'Sem um oficial uma batalha não passa de uma briga de bar. Você é treinado para coordenar e auxiliar seus companheiros em combate, tomando decisões rápidas e tirando melhor proveito da situação e do talento de seus aliados.',
    abilities: [
      { 
        id: 'inspirar-confianca', 
        name: 'Inspirar Confiança', 
        description: 'Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado.', 
        minNex: 10, 
        isInitial: true 
      },
      { 
        id: 'estrategista', 
        name: 'Estrategista', 
        description: 'Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE por aliado que quiser direcionar (limitado pelo seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional.', 
        minNex: 40 
      },
      { 
        id: 'brecha-na-guarda', 
        name: 'Brecha na Guarda', 
        description: 'Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo. Além disso, o alcance de Inspirar Confiança e Estrategista aumenta para médio.', 
        minNex: 65 
      },
      { 
        id: 'oficial-comandante', 
        name: 'Oficial Comandante', 
        description: 'Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele.', 
        minNex: 99 
      },
    ],
  },
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    classId: 'Combatente',
    description: 'Você treinou sua musculatura e movimentos a ponto de transformar seu corpo em uma verdadeira arma. Com golpes corpo a corpo tão poderosos quanto uma bala, você enfrenta inimigos sem medo.',
    abilities: [
      { 
        id: 'tecnica-letal', 
        name: 'Técnica Letal', 
        description: 'Você recebe um aumento de +2 na margem de ameaça com todos os seus ataques corpo a corpo.', 
        minNex: 10, 
        isInitial: true 
      },
      { 
        id: 'revidar', 
        name: 'Revidar', 
        description: 'Sempre que bloquear um ataque, você pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo no inimigo que o atacou.', 
        minNex: 40 
      },
      { 
        id: 'forca-opressora', 
        name: 'Força Opressora', 
        description: 'Quando acerta um ataque corpo a corpo, você pode gastar 1 PE para realizar uma manobra derrubar ou empurrar contra o alvo do ataque como ação livre. Se escolher empurrar, recebe um bônus de +5 para cada 10 pontos de dano que causou no alvo. Se escolher derrubar e vencer no teste oposto, você pode gastar 1 PE para fazer um ataque adicional contra o alvo caído.', 
        minNex: 65 
      },
      { 
        id: 'potencia-maxima', 
        name: 'Potência Máxima', 
        description: 'Quando usa seu Ataque Especial com armas corpo a corpo, todos os bônus numéricos são dobrados. Por exemplo, se usar 5 PE para receber +5 no ataque e +15 no dano, você recebe +10 no ataque e +30 no dano.', 
        minNex: 99 
      },
    ],
  },
  {
    id: 'operacoes-especiais',
    name: 'Operações Especiais',
    classId: 'Combatente',
    description: 'Você é um combatente eficaz. Suas ações são calculadas e otimizadas, sempre antevendo os movimentos inimigos e se posicionando da maneira mais inteligente no campo de batalha.',
    abilities: [
      { 
        id: 'iniciativa-aprimorada', 
        name: 'Iniciativa Aprimorada', 
        description: 'Você recebe +5 em Iniciativa e uma ação de movimento adicional na primeira rodada.', 
        minNex: 10, 
        isInitial: true 
      },
      { 
        id: 'ataque-extra', 
        name: 'Ataque Extra', 
        description: 'Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.', 
        minNex: 40 
      },
      { 
        id: 'surto-de-adrenalina', 
        name: 'Surto de Adrenalina', 
        description: 'Uma vez por rodada, você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional.', 
        minNex: 65 
      },
      { 
        id: 'sempre-alerta', 
        name: 'Sempre Alerta', 
        description: 'Você recebe uma ação padrão adicional no início de cada cena de combate.', 
        minNex: 99 
      },
    ],
  },
  {
    id: 'tropa-choque',
    name: 'Tropa de Choque',
    classId: 'Combatente',
    description: 'Você é duro na queda. Treinou seu corpo para resistir a traumas físicos, tornando-o praticamente inquebrável, e por isso não teme se colocar entre seus aliados e o perigo.',
    abilities: [
      { 
        id: 'casca-grossa', 
        name: 'Casca Grossa', 
        description: 'Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida.', 
        minNex: 10, 
        isInitial: true 
      },
      { 
        id: 'cai-dentro', 
        name: 'Cai Dentro', 
        description: 'Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado. Este poder só funciona se você puder ser efetivamente atacado e estiver no alcance do ataque (por exemplo, adjacente a um oponente atacando em corpo a corpo ou dentro do alcance de uma arma de ataque à distância). Um oponente que passe no teste de Vontade não pode ser afetado por seu poder Cai Dentro até o final da cena.', 
        minNex: 40 
      },
      { 
        id: 'duro-de-matar', 
        name: 'Duro de Matar', 
        description: 'Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal.', 
        minNex: 65 
      },
      { 
        id: 'inquebravel', 
        name: 'Inquebrável', 
        description: 'Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, em vez do normal, você não fica indefeso e ainda pode realizar ações. Você ainda segue as regras de morte normalmente.', 
        minNex: 99 
      },
    ],
  },

  // === TRILHAS DO ESPECIALISTA ===
  // Textos oficiais do livro base Ordem Paranormal RPG
  // Níveis corretos: 10% (1ª), 40% (2ª), 65% (3ª), 99% (4ª)
  {
    id: 'atirador-elite',
    name: 'Atirador de Elite',
    classId: 'Especialista',
    description: 'Um tiro, uma morte. Ao contrário dos combatentes, você é perito em neutralizar ameaças à distância, terminando uma briga antes mesmo que ela comece. Você trata sua arma como uma ferramenta de precisão, sendo capaz de executar façanhas incríveis.',
    abilities: [
      { id: 'mira-elite', name: 'Mira de Elite', description: 'Você recebe proficiência com armas de fogo que usam balas longas e soma seu Intelecto nas rolagens de dano com essas armas.', minNex: 10, isInitial: true },
      { id: 'disparo-letal', name: 'Disparo Letal', description: 'Quando faz a ação mirar, você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque que fizer até o final do seu próximo turno.', minNex: 40 },
      { id: 'disparo-impactante', name: 'Disparo Impactante', description: 'Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre: derrubar, desarmar, empurrar ou quebrar.', minNex: 65 },
      { id: 'atirar-matar', name: 'Atirar para Matar', description: 'Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar os dados.', minNex: 99 },
    ],
  },
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    classId: 'Especialista',
    description: 'Você é um perito em infiltração e sabe neutralizar alvos desprevenidos sem causar alarde. Combinando talento acrobático, destreza manual e conhecimento técnico, você é capaz de superar qualquer barreira de defesa.',
    abilities: [
      { id: 'ataque-furtivo-trilha', name: 'Ataque Furtivo', description: 'Você sabe atingir os pontos vitais de um inimigo distraído. Uma vez por rodada, quando atinge um alvo desprevenido, flanqueado ou que você esteja atacando corpo a corpo com uma arma leve, pode gastar 1 PE para causar +1d6 de dano do mesmo tipo da arma. O dano adicional aumenta para +2d6 em NEX 40%, +3d6 em NEX 65% e +4d6 em NEX 99%.', minNex: 10, isInitial: true },
      { id: 'gatuno', name: 'Gatuno', description: 'Você recebe +5 em Atletismo e Crime e pode percorrer seu deslocamento normal ao se esconder, sem penalidade (veja Furtividade).', minNex: 40 },
      { id: 'assassinar', name: 'Assassinar', description: 'Você pode gastar uma ação de movimento e 3 PE para analisar um alvo em alcance curto. Até o final do seu próximo turno, seu próximo Ataque Furtivo causa dano dobrado e você soma seus dados de dano extras dessa habilidade duas vezes. Além disso, se o alvo ficar inconsciente ou morrendo, você escolhe se ele fica inconsciente ou morrendo (Fortitude DT Agi evita).', minNex: 65 },
      { id: 'sombra-fugaz', name: 'Sombra Fugaz', description: 'Quando faz um teste de Furtividade após atacar ou realizar outra ação chamativa, você pode gastar 3 PE para não sofrer penalidade no teste.', minNex: 99 },
    ],
  },
  {
    id: 'medico-campo',
    name: 'Médico de Campo',
    classId: 'Especialista',
    description: 'Você é treinado em técnicas de primeiros socorros e tratamento de emergência, capaz de manter um grupo de agentes vivo mesmo nas piores condições.',
    abilities: [
      { id: 'paramedico', name: 'Paramédico', description: 'Você pode usar uma ação padrão e 2 PE para curar 2d10 pontos de vida de você ou de um aliado adjacente. A cura aumenta em +1d10 em NEX 40%, +1d10 em NEX 65% e +1d10 em NEX 99%. Você pode gastar +1 PE por dado adicional.', minNex: 10, isInitial: true },
      { id: 'equipe-trauma', name: 'Equipe de Trauma', description: 'Você pode usar uma ação padrão e 2 PE para remover uma condição negativa (exceto morrendo) de um aliado adjacente.', minNex: 40 },
      { id: 'resgate', name: 'Resgate', description: 'Uma vez por rodada, se estiver adjacente a um aliado morrendo, você pode se aproximar dele como ação livre (desde que seja possível pelo deslocamento). Além disso, sempre que curar PV ou remover condições de um aliado, ele recebe +5 na Defesa até o início do seu próximo turno.', minNex: 65 },
      { id: 'reanimacao', name: 'Reanimação', description: 'Uma vez por cena, você pode gastar uma ação completa e 10 PE para trazer de volta à vida um personagem que tenha morrido na mesma cena (exceto morte por dano massivo).', minNex: 99 },
    ],
  },
  {
    id: 'negociador',
    name: 'Negociador',
    classId: 'Especialista',
    description: 'Você é um diplomata habilidoso, capaz de influenciar aliados e adversários com palavras afiadas, usando empatia, persuasão e manipulação.',
    abilities: [
      { id: 'eloquencia', name: 'Eloquência', description: 'Você pode gastar 1 PE para afetar todas as pessoas em alcance curto com sua fala. Faça um teste de Diplomacia, Enganação ou Intimidação contra a Vontade dos alvos. Se vencer, os alvos ficam fascinados enquanto você se concentrar. Se atacar alguém, a fascinação acaba. Um alvo bem-sucedido recebe +5 em resistência e tem direito a novo teste por rodada. Uma pessoa que passe no teste fica imune a este efeito por 1 dia.', minNex: 10, isInitial: true },
      { id: 'discurso-motivador', name: 'Discurso Motivador', description: 'Você pode gastar uma ação padrão e 4 PE para inspirar seus aliados. Você e todos os aliados em alcance curto ganham +1 em testes de perícia até o final da cena. Em NEX 65%, pode gastar 8 PE para conceder +2 em vez disso.', minNex: 40 },
      { id: 'eu-conheco-um-cara', name: 'Eu Conheço um Cara', description: 'Uma vez por missão, você pode ativar sua rede de contatos para trocar equipamentos, obter informações, resgatar alguém ou resolver um problema similar. O mestre define quando essa habilidade pode ser usada e quais favores podem ser obtidos.', minNex: 65 },
      { id: 'truque-mestre', name: 'Truque de Mestre', description: 'Você pode gastar 5 PE para simular o efeito de qualquer habilidade que tenha visto um aliado usar durante a cena. Você ignora pré-requisitos, paga todos os custos e usa os parâmetros como se tivesse a habilidade.', minNex: 99 },
    ],
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    classId: 'Especialista',
    description: 'Sua principal habilidade é a manutenção, reparo e improvisação de equipamentos, garantindo que o grupo esteja sempre preparado.',
    abilities: [
      { id: 'inventario-otimizado', name: 'Inventário Otimizado', description: 'Você soma seu Intelecto à Força para calcular sua capacidade de carga.', minNex: 10, isInitial: true },
      { id: 'remendo', name: 'Remendo', description: 'Você pode gastar uma ação completa e 1 PE para remover a condição quebrado de um equipamento adjacente. Além disso, qualquer equipamento que você carregue tem sua categoria reduzida em 1.', minNex: 40 },
      { id: 'improvisar', name: 'Improvisar', description: 'Você pode improvisar equipamentos com materiais ao redor. Escolha um equipamento geral e gaste uma ação completa e 2 PE. Esse item funciona normalmente até o final da cena, mas é inutilizado ao término.', minNex: 65 },
      { id: 'preparado-para-tudo', name: 'Preparado para Tudo', description: 'Sempre que precisar de um item qualquer (exceto armas), você pode gastar uma ação de movimento e 3 PE por categoria para declarar que ele estava guardado em sua mochila. Depois disso, o item segue normalmente as regras de inventário.', minNex: 99 },
    ],
  },

  // === TRILHAS DO OCULTISTA ===
  // Níveis corretos: 10% (1ª), 40% (2ª), 65% (3ª), 99% (4ª)
  {
    id: 'conduíte',
    name: 'Conduíte',
    classId: 'Ocultista',
    description: 'Você canaliza a energia do Outro Lado de forma bruta.',
    abilities: [
      { id: 'conduite-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Conduíte.', minNex: 10, isInitial: true },
      { id: 'conduite-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Conduíte.', minNex: 40 },
      { id: 'conduite-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Conduíte.', minNex: 65 },
      { id: 'conduite-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Conduíte.', minNex: 99 },
    ],
  },
  {
    id: 'flagelador',
    name: 'Flagelador',
    classId: 'Ocultista',
    description: 'Você usa o próprio corpo como fonte de poder.',
    abilities: [
      { id: 'flagelador-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Flagelador.', minNex: 10, isInitial: true },
      { id: 'flagelador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Flagelador.', minNex: 40 },
      { id: 'flagelador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Flagelador.', minNex: 65 },
      { id: 'flagelador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Flagelador.', minNex: 99 },
    ],
  },
  {
    id: 'graduado',
    name: 'Graduado',
    classId: 'Ocultista',
    description: 'Você estudou o paranormal de forma acadêmica.',
    abilities: [
      { id: 'graduado-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Graduado.', minNex: 10, isInitial: true },
      { id: 'graduado-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Graduado.', minNex: 40 },
      { id: 'graduado-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Graduado.', minNex: 65 },
      { id: 'graduado-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Graduado.', minNex: 99 },
    ],
  },
  {
    id: 'intuitivo',
    name: 'Intuitivo',
    classId: 'Ocultista',
    description: 'Seus poderes vêm da intuição e emoção.',
    abilities: [
      { id: 'intuitivo-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Intuitivo.', minNex: 10, isInitial: true },
      { id: 'intuitivo-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Intuitivo.', minNex: 40 },
      { id: 'intuitivo-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Intuitivo.', minNex: 65 },
      { id: 'intuitivo-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Intuitivo.', minNex: 99 },
    ],
  },
  {
    id: 'lamina-paranormal',
    name: 'Lâmina Paranormal',
    classId: 'Ocultista',
    description: 'Você combina magia e combate corpo a corpo.',
    abilities: [
      { id: 'lamina-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Lâmina Paranormal.', minNex: 10, isInitial: true },
      { id: 'lamina-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Lâmina Paranormal.', minNex: 40 },
      { id: 'lamina-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Lâmina Paranormal.', minNex: 65 },
      { id: 'lamina-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Lâmina Paranormal.', minNex: 99 },
    ],
  },
  // Adiciona as trilhas do suplemento "Sobrevivendo ao Horror"
  ...SUPPLEMENT_TRACKS,
];

// ==================== PERÍCIAS ====================

export const SKILLS = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'agility', description: 'Equilíbrio, saltos, piruetas e outras manobras acrobáticas.', requiresTraining: false },
  { id: 'adestramento', name: 'Adestramento', attribute: 'presence', description: 'Treinar, acalmar e comandar animais.', requiresTraining: true },
  { id: 'artes', name: 'Artes', attribute: 'presence', description: 'Criar e avaliar obras de arte, tocar instrumentos, atuar.', requiresTraining: true },
  { id: 'atletismo', name: 'Atletismo', attribute: 'strength', description: 'Correr, escalar, nadar e outras atividades físicas intensas.', requiresTraining: false },
  { id: 'atualidades', name: 'Atualidades', attribute: 'intellect', description: 'Conhecimento geral sobre notícias, cultura pop e eventos atuais.', requiresTraining: false },
  { id: 'ciencias', name: 'Ciências', attribute: 'intellect', description: 'Física, química, biologia, matemática e outras ciências exatas e naturais.', requiresTraining: true },
  { id: 'crime', name: 'Crime', attribute: 'agility', description: 'Arrombamento, furto, falsificação e outras atividades ilegais.', requiresTraining: true },
  { id: 'diplomacia', name: 'Diplomacia', attribute: 'presence', description: 'Negociar, persuadir e causar boa impressão.', requiresTraining: false },
  { id: 'enganacao', name: 'Enganação', attribute: 'presence', description: 'Mentir, blefar, disfarçar-se e fingir.', requiresTraining: false },
  { id: 'fortitude', name: 'Fortitude', attribute: 'vigor', description: 'Resistir a fadiga, venenos, doenças e rigores físicos.', requiresTraining: false },
  { id: 'furtividade', name: 'Furtividade', attribute: 'agility', description: 'Mover-se silenciosamente e se esconder.', requiresTraining: false },
  { id: 'iniciativa', name: 'Iniciativa', attribute: 'agility', description: 'Velocidade de reação para agir primeiro em combate.', requiresTraining: false },
  { id: 'intimidacao', name: 'Intimidação', attribute: 'presence', description: 'Coagir, ameaçar e assustar.', requiresTraining: false },
  { id: 'intuicao', name: 'Intuição', attribute: 'presence', description: 'Perceber intenções, detectar mentiras e seguir pressentimentos.', requiresTraining: false },
  { id: 'investigacao', name: 'Investigação', attribute: 'intellect', description: 'Procurar pistas, pesquisar informações e resolver enigmas.', requiresTraining: false },
  { id: 'luta', name: 'Luta', attribute: 'strength', description: 'Combate corpo a corpo com armas ou desarmado.', requiresTraining: false },
  { id: 'medicina', name: 'Medicina', attribute: 'intellect', description: 'Tratar ferimentos, curar doenças e realizar procedimentos médicos.', requiresTraining: true },
  { id: 'ocultismo', name: 'Ocultismo', attribute: 'intellect', description: 'Conhecimento sobre o paranormal, criaturas do Outro Lado e rituais.', requiresTraining: true },
  { id: 'percepcao', name: 'Percepção', attribute: 'presence', description: 'Notar detalhes, ouvir ruídos e detectar ameaças.', requiresTraining: false },
  { id: 'pilotagem', name: 'Pilotagem', attribute: 'agility', description: 'Dirigir veículos terrestres, aquáticos e aéreos.', requiresTraining: true },
  { id: 'pontaria', name: 'Pontaria', attribute: 'agility', description: 'Combate à distância com armas de fogo ou arremesso.', requiresTraining: false },
  { id: 'profissao', name: 'Profissão', attribute: 'intellect', description: 'Conhecimento e habilidades de uma profissão específica.', requiresTraining: false },
  { id: 'reflexos', name: 'Reflexos', attribute: 'agility', description: 'Esquivar de ataques, armadilhas e efeitos de área.', requiresTraining: false },
  { id: 'religiao', name: 'Religião', attribute: 'presence', description: 'Conhecimento sobre religiões, crenças e tradições espirituais.', requiresTraining: true },
  { id: 'sobrevivencia', name: 'Sobrevivência', attribute: 'intellect', description: 'Orientar-se, rastrear, encontrar comida e sobreviver na natureza.', requiresTraining: false },
  { id: 'tatica', name: 'Tática', attribute: 'intellect', description: 'Planejamento militar, estratégia e análise de situações de combate.', requiresTraining: true },
  { id: 'tecnologia', name: 'Tecnologia', attribute: 'intellect', description: 'Usar, consertar e hackear equipamentos eletrônicos e sistemas.', requiresTraining: true },
  { id: 'vontade', name: 'Vontade', attribute: 'presence', description: 'Resistir a manipulação mental, medo e efeitos que afetam a mente.', requiresTraining: false },
];

// ==================== PROGRESSÃO POR NEX (TABELA OFICIAL) ====================

/**
 * Tabela de progressão por NEX - Define benefícios ganhos a cada nível
 * Baseado nas regras oficiais do livro Ordem Paranormal v1.3
 * 
 * - attributePoints: Pontos de atributo extras acumulados
 * - extraSkills: Perícias extras acumuladas (além das da classe)
 * - abilityChoices: Quantidade de habilidades opcionais da classe
 * - trackAbilityUnlocks: Habilidades de trilha desbloqueadas
 */
export interface NexProgressionData {
  attributePoints: number;  // Pontos de atributo extras (acumulados)
  extraSkills: number;      // Perícias extras (acumuladas)
  abilityChoices: number;   // Habilidades opcionais disponíveis
  trackAbilityUnlocks: number; // Habilidades de trilha desbloqueadas
}

// NEX_PROGRESSION corrigido conforme regras oficiais:
// - Primeiro ponto de atributo extra só no NEX 20%
// - trackAbilityUnlocks: máximo de 4 (NEX 10%, 40%, 65%, 99%)
export const NEX_PROGRESSION: Record<number, NexProgressionData> = {
  5:  { attributePoints: 0, extraSkills: 0, abilityChoices: 1, trackAbilityUnlocks: 0 },  // Sem habilidade de trilha ainda
  10: { attributePoints: 0, extraSkills: 1, abilityChoices: 1, trackAbilityUnlocks: 1 },  // 1ª habilidade de trilha
  15: { attributePoints: 0, extraSkills: 1, abilityChoices: 1, trackAbilityUnlocks: 1 },  // CORRIGIDO: 0 pontos extras
  20: { attributePoints: 1, extraSkills: 2, abilityChoices: 2, trackAbilityUnlocks: 1 },  // Primeiro ponto de atributo
  25: { attributePoints: 1, extraSkills: 2, abilityChoices: 2, trackAbilityUnlocks: 1 },
  30: { attributePoints: 2, extraSkills: 3, abilityChoices: 2, trackAbilityUnlocks: 1 },
  35: { attributePoints: 2, extraSkills: 3, abilityChoices: 3, trackAbilityUnlocks: 1 },
  40: { attributePoints: 3, extraSkills: 4, abilityChoices: 3, trackAbilityUnlocks: 2 },  // 2ª habilidade de trilha
  45: { attributePoints: 3, extraSkills: 4, abilityChoices: 3, trackAbilityUnlocks: 2 },
  50: { attributePoints: 4, extraSkills: 5, abilityChoices: 4, trackAbilityUnlocks: 2 },
  55: { attributePoints: 4, extraSkills: 5, abilityChoices: 4, trackAbilityUnlocks: 2 },
  60: { attributePoints: 5, extraSkills: 6, abilityChoices: 4, trackAbilityUnlocks: 2 },
  65: { attributePoints: 5, extraSkills: 6, abilityChoices: 5, trackAbilityUnlocks: 3 },  // 3ª habilidade de trilha
  70: { attributePoints: 6, extraSkills: 7, abilityChoices: 5, trackAbilityUnlocks: 3 },
  75: { attributePoints: 6, extraSkills: 7, abilityChoices: 5, trackAbilityUnlocks: 3 },
  80: { attributePoints: 7, extraSkills: 8, abilityChoices: 6, trackAbilityUnlocks: 3 },
  85: { attributePoints: 7, extraSkills: 8, abilityChoices: 6, trackAbilityUnlocks: 3 },
  90: { attributePoints: 8, extraSkills: 9, abilityChoices: 6, trackAbilityUnlocks: 3 },
  95: { attributePoints: 8, extraSkills: 9, abilityChoices: 7, trackAbilityUnlocks: 3 },
  99: { attributePoints: 9, extraSkills: 10, abilityChoices: 7, trackAbilityUnlocks: 4 },  // 4ª habilidade de trilha
};

/**
 * Retorna os benefícios de progressão para um dado NEX
 */
export function getNexProgression(nex: number): NexProgressionData {
  return NEX_PROGRESSION[nex] || NEX_PROGRESSION[5];
}

/**
 * Calcula pontos de atributo extras por NEX
 */
export function getExtraAttributePoints(nex: number): number {
  return getNexProgression(nex).attributePoints;
}

/**
 * Calcula perícias extras por NEX
 */
export function getExtraSkillsByNex(nex: number): number {
  return getNexProgression(nex).extraSkills;
}

/**
 * Calcula quantidade de habilidades opcionais por NEX
 */
export function getAbilityChoicesByNex(nex: number): number {
  return getNexProgression(nex).abilityChoices;
}

// ==================== NÍVEIS DE TREINAMENTO ====================

export const TRAINING_LEVELS = [
  { id: 0, name: 'Destreinado', bonus: 0, minNex: 0 },
  { id: 1, name: 'Treinado', bonus: 5, minNex: 0 },
  { id: 2, name: 'Veterano', bonus: 10, minNex: 35 },
  { id: 3, name: 'Expert', bonus: 15, minNex: 70 },
];

// ==================== PATENTES ====================

export const PATENTS = [
  { nex: 5, name: 'Recruta', itemLimit: { cat0: 2, catI: 0, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 10, name: 'Recruta', itemLimit: { cat0: 2, catI: 0, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 15, name: 'Recruta', itemLimit: { cat0: 2, catI: 0, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 20, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 25, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 30, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 35, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 40, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 45, name: 'Operador', itemLimit: { cat0: 3, catI: 1, catII: 0, catIII: 0, catIV: 0 } },
  { nex: 50, name: 'Agente Especial', itemLimit: { cat0: 3, catI: 2, catII: 1, catIII: 0, catIV: 0 } },
  { nex: 55, name: 'Agente Especial', itemLimit: { cat0: 3, catI: 2, catII: 1, catIII: 0, catIV: 0 } },
  { nex: 60, name: 'Agente Especial', itemLimit: { cat0: 3, catI: 2, catII: 1, catIII: 0, catIV: 0 } },
  { nex: 65, name: 'Agente Especial', itemLimit: { cat0: 3, catI: 2, catII: 1, catIII: 0, catIV: 0 } },
  { nex: 70, name: 'Agente Especial', itemLimit: { cat0: 3, catI: 2, catII: 1, catIII: 0, catIV: 0 } },
  { nex: 75, name: 'Oficial de Operações', itemLimit: { cat0: 3, catI: 3, catII: 2, catIII: 1, catIV: 0 } },
  { nex: 80, name: 'Oficial de Operações', itemLimit: { cat0: 3, catI: 3, catII: 2, catIII: 1, catIV: 0 } },
  { nex: 85, name: 'Oficial de Operações', itemLimit: { cat0: 3, catI: 3, catII: 2, catIII: 1, catIV: 0 } },
  { nex: 90, name: 'Oficial de Operações', itemLimit: { cat0: 3, catI: 3, catII: 2, catIII: 1, catIV: 0 } },
  { nex: 95, name: 'Oficial de Operações', itemLimit: { cat0: 3, catI: 3, catII: 2, catIII: 1, catIV: 0 } },
  { nex: 99, name: 'Agente de Elite', itemLimit: { cat0: 3, catI: 3, catII: 3, catIII: 2, catIV: 1 } },
];

export function getPatentByNex(nex: number): string {
  if (nex >= 99) return 'Agente de Elite';
  if (nex >= 75) return 'Oficial de Operações';
  if (nex >= 50) return 'Agente Especial';
  if (nex >= 20) return 'Operador';
  return 'Recruta';
}

// ==================== ELEMENTOS PARANORMAIS ====================

export const PARANORMAL_ELEMENTS = [
  { id: 'sangue', name: 'Sangue', description: 'O elemento da vida, cura e vitalidade, mas também da dor e sacrifício.' },
  { id: 'morte', name: 'Morte', description: 'O elemento do fim, decadência e comunicação com os mortos.' },
  { id: 'conhecimento', name: 'Conhecimento', description: 'O elemento da mente, informação e manipulação mental.' },
  { id: 'energia', name: 'Energia', description: 'O elemento da força bruta, eletricidade, fogo e destruição.' },
  { id: 'medo', name: 'Medo', description: 'O elemento do terror, ilusões e pesadelos.' },
];

// ==================== CÁLCULOS DE STATS DERIVADOS ====================

/**
 * Calcula os stats derivados baseado nas fórmulas oficiais v1.3
 * 
 * PV = Base da Classe + VIG + ((NEX/5 - 1) * (Progressão + VIG))
 * PE = Base da Classe + PRE + ((NEX/5 - 1) * (Progressão + PRE))
 * SAN = Base da Classe + ((NEX/5 - 1) * Progressão)
 */
export function calculateDerivedStats(
  characterClass: string,
  vigor: number,
  presence: number,
  nex: number,
  originId?: string
): { hp: number; pe: number; san: number } {
  const classData = CLASSES.find(c => c.id === characterClass);
  if (!classData) {
    return { hp: 0, pe: 0, san: 0 };
  }

  const nexMultiplier = Math.floor(nex / 5) - 1;

  // PV = Base + VIG + (Multiplicador * (ProgressãoPV + VIG))
  const hp = classData.pvBase + vigor + Math.max(0, nexMultiplier) * (classData.pvPerNex + vigor);

  // PE = Base + PRE + (Multiplicador * (ProgressãoPE + PRE))
  const pe = classData.peBase + presence + Math.max(0, nexMultiplier) * (classData.pePerNex + presence);

  // SAN = Base + (Multiplicador * ProgressãoSAN)
  let san = classData.sanBase + Math.max(0, nexMultiplier) * classData.sanPerNex;

  // Aplicar modificador de origem (Cultista Arrependido)
  if (originId) {
    const origin = ORIGINS.find(o => o.id === originId);
    if (origin?.sanityModifier) {
      san = san + origin.sanityModifier;
    }
  }

  return { hp, pe, san: Math.max(0, san) };
}

/**
 * Retorna o bônus de atributo
 */
export function getAttributeBonus(value: number): number {
  return value;
}

/**
 * Calcula a Defesa base
 * Defesa = 10 + AGI
 */
export function calculateDefense(agility: number): number {
  return 10 + agility;
}

/**
 * Calcula a capacidade de carga
 * Carga = FOR × 5 kg
 */
export function calculateCarryCapacity(strength: number): number {
  return strength * 5;
}

/**
 * Calcula o deslocamento base
 * Deslocamento = 9m (pode ser modificado por origem/habilidades)
 */
export function calculateMovement(originId?: string): number {
  let movement = 9;
  
  if (originId === 'atleta') {
    movement += 3; // Atleta recebe +3m de deslocamento
  }
  
  return movement;
}

/**
 * Calcula quantas perícias livres a classe oferece
 */
export function calculateFreeSkills(classId: string, intellect: number): number {
  const classData = CLASSES.find(c => c.id === classId);
  if (!classData) return 0;
  
  return intellect + classData.freeSkillsBase;
}

/**
 * Retorna os rituais disponíveis para um Ocultista baseado no NEX
 */
export function getOcultistRituals(nex: number): { count: number; maxCircle: number } | null {
  // Busca especificamente nas classes base (CORE_CLASSES) pois só o Ocultista tem ritualsPerNex
  const ocultista = CORE_CLASSES.find(c => c.id === 'Ocultista') as typeof CORE_CLASSES[2] | undefined;
  if (!ocultista?.ritualsPerNex) return null;
  
  const rituals = ocultista.ritualsPerNex[nex as keyof typeof ocultista.ritualsPerNex];
  return rituals || { count: 1, maxCircle: 1 };
}

/**
 * Retorna as trilhas disponíveis para uma classe
 */
export function getClassTracks(classId: string): ClassTrack[] {
  return CLASS_TRACKS.filter(track => track.classId === classId);
}

/**
 * Retorna uma trilha específica por ID
 */
export function getTrackById(trackId: string): ClassTrack | undefined {
  return CLASS_TRACKS.find(track => track.id === trackId);
}

/**
 * Retorna as habilidades de trilha disponíveis para um NEX específico
 */
export function getAvailableTrackAbilities(trackId: string, nex: number): TrackAbility[] {
  const track = getTrackById(trackId);
  if (!track) return [];
  
  return track.abilities.filter(ability => ability.minNex <= nex);
}
