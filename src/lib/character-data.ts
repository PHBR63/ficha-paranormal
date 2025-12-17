// Ordem Paranormal RPG v1.3 - Character Data (Atualizado com dados oficiais do livro)
// Classes oficiais: Combatente, Especialista, Ocultista (15 trilhas no total)

import { SUPPLEMENT_ORIGINS } from './supplement-origins';
import { SUPPLEMENT_TRACKS } from './supplement-classes';

// ==================== ORIGENS PRINCIPAIS (26 origens do livro base) ====================
// Textos fiéis ao manual oficial Ordem Paranormal RPG

const CORE_ORIGINS = [
  {
    id: 'academico',
    name: 'Acadêmico',
    description: 'Você era um pesquisador ou professor universitário. De forma proposital ou não, seus estudos tocaram em assuntos misteriosos e chamaram a atenção da Ordem Realitas.',
    skills: ['ciencias', 'investigacao'],
    powers: ['Saber é Poder'],
    powerDescription: 'Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.',
  },
  {
    id: 'agente-de-saude',
    name: 'Agente de Saúde',
    description: 'Você era um profissional da saúde, como um enfermeiro, farmacêutico, médico, psicólogo ou socorrista, treinado no atendimento e cuidado de pessoas. Você pode ter sido surpreendido por um evento paranormal durante o trabalho ou mesmo cuidado de um agente da Ordem em uma emergência, que ficou surpreso com o quão bem você lidou com a situação.',
    skills: ['intuicao', 'medicina'],
    powers: ['Técnica Medicinal'],
    powerDescription: 'Sempre que cura um personagem, você adiciona seu Intelecto no total de PV curados.',
  },
  {
    id: 'amnesico',
    name: 'Amnésico',
    description: 'Você perdeu a maior parte da memória. Sabe apenas o próprio nome, ou nem isso. Sua amnésia pode ser resultado de um trauma paranormal ou mesmo de um ritual. Talvez você tenha sido vítima de cultistas? Talvez você tenha sido um cultista? Seja como for, hoje a Ordem é a única família que conhece. Quem sabe, cumprindo missões, você descubra algo sobre seu passado.',
    skills: [], // Duas à escolha do mestre
    powers: ['Vislumbres do Passado'],
    powerDescription: 'Uma vez por sessão, você pode fazer um teste de Intelecto (DT 10) para reconhecer pessoas ou lugares familiares, que tenha encontrado antes de perder a memória. Se passar, recebe 1d4 PE temporários e, a critério do mestre, uma informação útil.',
    isAmnesic: true,
  },
  {
    id: 'artista',
    name: 'Artista',
    description: 'Você era um ator, músico, escritor, dançarino, influenciador... Seu trabalho pode ter sido inspirado por uma experiência paranormal do passado e o que o público acha que é pura criatividade, a Ordem sabe que tem um lado mais sombrio.',
    skills: ['artes', 'enganacao'],
    powers: ['Magnum Opus'],
    powerDescription: 'Você é famoso por uma de suas obras. Uma vez por missão, pode determinar que uma pessoa envolvida em uma cena de interação o reconheça. Você recebe +5 em testes de Presença e de perícias baseadas em Presença contra aquela pessoa. A critério do mestre, pode receber esse bônus em outras situações nas quais seria reconhecido.',
  },
  {
    id: 'atleta',
    name: 'Atleta',
    description: 'Você competia em um esporte individual ou coletivo, como natação ou futebol. Seu desempenho pode ser fruto de uma influência paranormal que nem mesmo você conhecia ou você pode ter se envolvido em algum evento relacionado ao Outro Lado em uma de suas competições.',
    skills: ['acrobacia', 'atletismo'],
    powers: ['110%'],
    powerDescription: 'Quando faz um teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria) você pode gastar 2 PE para receber +5 nesse teste.',
  },
  {
    id: 'chef',
    name: 'Chef',
    description: 'Você é um cozinheiro amador ou profissional. Talvez trabalhasse em um restaurante, talvez simplesmente gostasse de cozinhar para a família e amigos. Como sua comida fez com que você se envolvesse com o paranormal? Ninguém sabe. Mas os outros agentes adoram quando você vai para a missão!',
    skills: ['fortitude', 'profissao'],
    powers: ['Ingrediente Secreto'],
    powerDescription: 'Em cenas de interlúdio, você pode fazer a ação alimentar-se para cozinhar um prato especial. Você, e todos os membros do grupo que fizeram a ação alimentar-se, recebem o benefício de dois pratos (caso o mesmo benefício seja escolhido duas vezes, seus efeitos se acumulam).',
  },
  {
    id: 'criminoso',
    name: 'Criminoso',
    description: 'Você vivia uma vida fora da lei, seja como mero batedor de carteiras, seja como membro de uma facção criminosa. Em algum momento, você se envolveu em um assunto da Ordem – talvez tenha roubado um item amaldiçoado? A organização, por sua vez, achou melhor recrutar seus talentos do que ter você como um estorvo.',
    skills: ['crime', 'furtividade'],
    powers: ['O Crime Compensa'],
    powerDescription: 'No final de uma missão, escolha um item encontrado na missão. Em sua próxima missão, você pode incluir esse item em seu inventário sem que ele conte em seu limite de itens por patente.',
  },
  {
    id: 'cultista-arrependido',
    name: 'Cultista Arrependido',
    description: 'Você fez parte de um culto paranormal. Talvez fossem ignorantes iludidos, que acreditavam estar contatando entidades benevolentes. Talvez soubessem exatamente o que estavam fazendo. Seja como for, algo abriu seus olhos e agora você luta pelo lado certo — embora carregue para sempre traços de sua vida pregressa. Outros membros da Ordem podem desconfiar de sua conversão e você sabe que precisará se esforçar para conquistar a confiança de todos.',
    skills: ['ocultismo', 'religiao'],
    powers: ['Traços do Outro Lado'],
    powerDescription: 'Você possui um poder paranormal à sua escolha. Porém, começa o jogo com metade da Sanidade normal para sua classe.',
    sanityModifier: -50,
  },
  {
    id: 'desgarrado',
    name: 'Desgarrado',
    description: 'Você não vivia de acordo com as normas da sociedade. Podia ser um eremita, uma pessoa em situação de rua ou simplesmente alguém que descobriu o paranormal e abandonou sua rotina — sabendo o quão frágil era a existência humana, não conseguia simplesmente continuar indo para o trabalho todo dia. De qualquer forma, a vida sem os confortos modernos o deixou mais forte.',
    skills: ['fortitude', 'sobrevivencia'],
    powers: ['Calejado'],
    powerDescription: 'Você recebe +1 PV para cada 5% de NEX.',
  },
  {
    id: 'engenheiro',
    name: 'Engenheiro',
    description: 'Enquanto os acadêmicos estão preocupados com teorias, você coloca a mão na massa, seja como engenheiro profissional, seja como inventor de garagem. Provavelmente você criou algum dispositivo paranormal que chamou a atenção da Ordem.',
    skills: ['profissao', 'tecnologia'],
    powers: ['Ferramenta Favorita'],
    powerDescription: 'Um item a sua escolha (exceto armas) conta como uma categoria abaixo (por exemplo, um item de categoria II conta como categoria I para você).',
  },
  {
    id: 'executivo',
    name: 'Executivo',
    description: 'Você possuía um trabalho de escritório em uma grande empresa, banco ou corporação. Era um administrador, advogado, contador ou de qualquer outra profissão que lida com papelada e burocracia. Sua vida era bastante normal, até que você descobriu algo que não devia. Talvez o sucesso da empresa residisse em um ritual? Talvez toda a corporação fosse fachada para um culto e o presidente, um líder cultista envolvido com entidades paranormais? Após essa descoberta, você foi recrutado pela Ordem e trocou seu trabalho de escritório por missões de campo — hoje, sua vida é tudo, menos normal.',
    skills: ['diplomacia', 'profissao'],
    powers: ['Processo Otimizado'],
    powerDescription: 'Sempre que faz um teste de perícia durante um teste estendido, ou uma ação para revisar documentos (físicos ou digitais), pode pagar 2 PE para receber +5 nesse teste.',
  },
  {
    id: 'investigador',
    name: 'Investigador',
    description: 'Você era um investigador do governo, como um perito forense ou policial federal, ou privado, como um detetive particular. Pode ter tido contato com o paranormal em algum caso ou ter sido recrutado pela Ordem por suas habilidades de resolução de mistérios.',
    skills: ['investigacao', 'percepcao'],
    powers: ['Faro para Pistas'],
    powerDescription: 'Uma vez por cena, quando fizer um teste para procurar pistas, você pode gastar 1 PE para receber +5 nesse teste.',
  },
  {
    id: 'lutador',
    name: 'Lutador',
    description: 'Você pratica uma arte marcial ou esporte de luta, ou cresceu em um bairro perigoso onde aprendeu briga de rua. Já quebrou muitos ossos, tanto seus quanto dos outros. Pode ter conhecido a Ordem após um torneio secreto envolvendo entidades do Outro Lado ou ter sido recrutado pela sua capacidade de luta.',
    skills: ['luta', 'reflexos'],
    powers: ['Mão Pesada'],
    powerDescription: 'Você recebe +2 em rolagens de dano com ataques corpo a corpo.',
  },
  {
    id: 'magnata',
    name: 'Magnata',
    description: 'Você possui muito dinheiro ou patrimônio. Pode ser o herdeiro de uma família antiga ligada ao oculto, ter criado e vendido uma empresa e decidido usar sua riqueza para uma causa maior, ou ter ganho uma loteria após inadvertidamente escolher números amaldiçoados que formavam um ritual.',
    skills: ['diplomacia', 'pilotagem'],
    powers: ['Patrocinador da Ordem'],
    powerDescription: 'Seu limite de crédito é sempre considerado um acima do atual.',
  },
  {
    id: 'mercenario',
    name: 'Mercenário',
    description: 'Você é um soldado de aluguel, que trabalha sozinho ou como parte de alguma organização que vende serviços militares. Escoltas e assassinatos fizeram parte de sua rotina por tempo o suficiente para você se envolver em alguma situação com o paranormal.',
    skills: ['iniciativa', 'intimidacao'],
    powers: ['Posição de Combate'],
    powerDescription: 'No primeiro turno de cada cena de ação, você pode gastar 2 PE para receber uma ação de movimento adicional.',
  },
  {
    id: 'militar',
    name: 'Militar',
    description: 'Você servia em uma força militar, como o exército ou a marinha. Passou muito tempo treinando com armas de fogo, até se tornar um perito no uso delas. Acostumado a obedecer ordens e partir em missões, está em casa na Ordo Realitas. O inimigo é diferente, mas um tiro bem dado continua resolvendo o problema.',
    skills: ['pontaria', 'tatica'],
    powers: ['Para Bellum'],
    powerDescription: 'Você recebe +2 em rolagens de dano com armas de fogo.',
  },
  {
    id: 'operario',
    name: 'Operário',
    description: 'Pedreiro, industriário, operador de máquinas em uma fábrica... Você passou uma parte de sua vida em um emprego braçal, desempenhando atividades práticas que lhe deram uma visão pragmática do mundo. Sua rotina mundana, entretanto, foi confrontada de alguma forma pelo paranormal, e você não consegue mais esquecer tudo que viu sobre os mistérios do mundo.',
    skills: ['fortitude', 'profissao'],
    powers: ['Ferramenta de Trabalho'],
    powerDescription: 'Escolha uma arma simples ou tática que, a critério do mestre, poderia ser usada como ferramenta em sua profissão (como uma marreta para um pedreiro). Você sabe usar a arma escolhida e recebe +1 em testes de ataque, rolagens de dano e margem de ameaça com ela.',
  },
  {
    id: 'policial',
    name: 'Policial',
    description: 'Você fez parte de uma força de segurança pública, civil ou militar. Em alguma patrulha ou chamado se deparou com um caso paranormal e sobreviveu para contar a história.',
    skills: ['percepcao', 'pontaria'],
    powers: ['Patrulha'],
    powerDescription: 'Você recebe +2 em Defesa.',
  },
  {
    id: 'religioso',
    name: 'Religioso',
    description: 'Você é devoto ou sacerdote de uma fé. Independentemente da religião que pratica, se dedica a auxiliar as pessoas com problemas espirituais. A partir disso, teve contato com o paranormal, o que fez com que fosse convocado pela Ordem.',
    skills: ['religiao', 'vontade'],
    powers: ['Acalentar'],
    powerDescription: 'Você recebe +5 em testes de Religião para acalmar. Além disso, quando acalma uma pessoa, ela recebe um número de pontos de Sanidade igual a 1d6 + a sua Presença.',
  },
  {
    id: 'servidor-publico',
    name: 'Servidor Público',
    description: 'Você possuía carreira em um órgão do governo, lidando com burocracia e atendendo pessoas. Sua rotina foi quebrada quando você viu que o prefeito era um cultista ou que a câmara de vereadores se reunia à noite para realizar rituais. Quando os próprios representantes do povo estão dispostos a sacrificá-lo para entidades malignas, onde reside nossa esperança? Hoje, você sabe a resposta para essa pergunta: na Ordo Realitas.',
    skills: ['intuicao', 'vontade'],
    powers: ['Espírito Cívico'],
    powerDescription: 'Sempre que faz um teste para ajudar, você pode gastar 1 PE para aumentar o bônus concedido em +2.',
  },
  {
    id: 'ti',
    name: 'T.I.',
    description: 'Programador, engenheiro de software ou simplesmente "o cara da T.I.", você tem treinamento e experiência para lidar com sistemas informatizados. Seu talento (ou curiosidade exagerada) chamou a atenção da Ordem.',
    skills: ['investigacao', 'tecnologia'],
    powers: ['Motor de Busca'],
    powerDescription: 'A critério do mestre, sempre que tiver acesso à internet, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Tecnologia.',
  },
  {
    id: 'teorico-da-conspiracao',
    name: 'Teórico da Conspiração',
    description: 'A humanidade nunca pisou na lua. Reptilianos ocupam importantes cargos públicos. A Terra é plana... E secretamente governada pelos Illuminati. Você sabe isso tudo, pois investigou a fundo esses importantes assuntos. Quando sua pesquisa esbarrou no paranormal, você foi recrutado. Na Ordem, sua loucura e determinação será usada para um bom propósito.',
    skills: ['investigacao', 'ocultismo'],
    powers: ['Eu Já Sabia'],
    powerDescription: 'Você não se abala tanto com entidades ou anomalias. Afinal, sempre soube que isso tudo existia. Você recebe resistência a dano mental igual ao seu Intelecto.',
  },
  {
    id: 'trabalhador-rural',
    name: 'Trabalhador Rural',
    description: 'Você trabalhava no campo ou em áreas isoladas, como fazendeiro, pescador, biólogo, veterinário... Você se acostumou com o convívio com a natureza e os animais e talvez tenha ouvido uma ou outra história de fantasmas ao redor da fogueira. Em algum momento da sua vida, porém, descobriu que muitas dessas histórias são verdadeiras.',
    skills: ['adestramento', 'sobrevivencia'],
    powers: ['Desbravador'],
    powerDescription: 'Quando faz um teste de Adestramento ou Sobrevivência, você pode gastar 2 PE para receber +5 nesse teste. Além disso, você não sofre penalidade em deslocamento por terreno difícil.',
  },
  {
    id: 'trambiqueiro',
    name: 'Trambiqueiro',
    description: 'Uma vida digna exige muito trabalho, então é melhor nem tentar. Você vivia de pequenos golpes, jogatina ilegal e falcatruas. Certo dia, enganou a pessoa errada: no dia seguinte, se viu servindo à Ordem. Pelo menos agora tem a chance de usar sua lábia para o bem.',
    skills: ['crime', 'enganacao'],
    powers: ['Impostor'],
    powerDescription: 'Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação.',
  },
  {
    id: 'universitario',
    name: 'Universitário',
    description: 'Você era aluno de uma faculdade. Em sua rotina de estudos, provas e festas, acabou descobrindo algo – talvez um livro amaldiçoado na antiga biblioteca do campus? Por seu achado, foi convocado pela Ordem. Agora, estuda com mais afinco: nesse novo curso, ouviu dizer que as provas podem ser mortais.',
    skills: ['atualidades', 'investigacao'],
    powers: ['Dedicação'],
    powerDescription: 'Você recebe +1 PE, e mais 1 PE adicional a cada NEX ímpar (15%, 25%...). Além disso, seu limite de PE por turno aumenta em 1 (em NEX 5% seu limite é 2, em NEX 10% é 3 e assim por diante; isso não afeta a DT de seus efeitos).',
  },
  {
    id: 'vitima',
    name: 'Vítima',
    description: 'Em algum momento de sua vida — infância, juventude ou início da vida adulta — você encontrou o paranormal... E a experiência não foi nada boa. Você viu os espíritos dos mortos, foi atacado por uma entidade ou mesmo foi sequestrado para ser sacrificado em um ritual impedido no último momento. A experiência foi traumática, mas você não se abateu; em vez disso, decidiu lutar para impedir que outros inocentes passem pelo mesmo. E, já tendo sido vítima do paranormal, se tornou habilidoso em evitar perigos.',
    skills: ['reflexos', 'vontade'],
    powers: ['Cicatrizes Psicológicas'],
    powerDescription: 'Você recebe +1 de Sanidade para cada 5% de NEX.',
  },
];

// Combina origens base com origens do suplemento e da comunidade
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
    tracks: ['Condutor', 'Flagelador', 'Graduado', 'Intuitivo', 'Lâmina Paranormal'],
    // Progressão de rituais do Ocultista (conforme livro de regras):
    // - Começa com 3 rituais no NEX 5%
    // - +1 ritual a cada 5% NEX
    // - Círculo 2 em NEX 25%, Círculo 3 em NEX 55%, Círculo 4 em NEX 85%
    ritualsPerNex: {
      5:  { count: 3, maxCircle: 1 },
      10: { count: 4, maxCircle: 1 },
      15: { count: 5, maxCircle: 1 },
      20: { count: 6, maxCircle: 1 },
      25: { count: 7, maxCircle: 2 },   // Desbloqueia 2º círculo
      30: { count: 8, maxCircle: 2 },
      35: { count: 9, maxCircle: 2 },
      40: { count: 10, maxCircle: 2 },
      45: { count: 11, maxCircle: 2 },
      50: { count: 12, maxCircle: 2 },
      55: { count: 13, maxCircle: 3 },  // Desbloqueia 3º círculo
      60: { count: 14, maxCircle: 3 },
      65: { count: 15, maxCircle: 3 },
      70: { count: 16, maxCircle: 3 },
      75: { count: 17, maxCircle: 3 },
      80: { count: 18, maxCircle: 3 },
      85: { count: 19, maxCircle: 4 },  // Desbloqueia 4º círculo
      90: { count: 20, maxCircle: 4 },
      95: { count: 21, maxCircle: 4 },
      99: { count: 22, maxCircle: 4 },
    },
  },
];

// Classes disponíveis (apenas as 3 classes oficiais do livro base)
export const CLASSES = [...CORE_CLASSES];

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
      { id: 'inventario-otimizado', name: 'Inventário Otimizado', description: 'Você soma seu Intelecto à Força para calcular sua capacidade de carga. Além disso, itens ocupam 1 espaço a menos (mas nunca reduzido a 0).', minNex: 10, isInitial: true },
      { id: 'remendo', name: 'Remendo', description: 'Você pode gastar uma ação completa e 1 PE para remover a condição quebrado de um equipamento adjacente. Além disso, qualquer equipamento que você carregue tem sua categoria reduzida em 1 (mas nunca reduzida a 0).', minNex: 40 },
      { id: 'improvisar', name: 'Improvisar', description: 'Você pode improvisar equipamentos com materiais ao redor. Escolha um equipamento geral e gaste uma ação completa e 2 PE. Esse item funciona normalmente até o final da cena, mas é inutilizado ao término.', minNex: 65 },
      { id: 'preparado-para-tudo', name: 'Preparado para Tudo', description: 'Sempre que precisar de um item qualquer (exceto armas), você pode gastar uma ação de movimento e 3 PE por categoria para declarar que ele estava guardado em sua mochila. Depois disso, o item segue normalmente as regras de inventário.', minNex: 99 },
    ],
  },

  // === TRILHAS DO OCULTISTA ===
  // Níveis corretos: 10% (1ª), 40% (2ª), 65% (3ª), 99% (4ª)
  {
    id: 'condutor',
    name: 'Condutor',
    classId: 'Ocultista',
    description: 'Você domina os aspectos fundamentais da conjuração de rituais e é capaz de aumentar o alcance e a velocidade de suas conjurações. Conforme sua conexão com as entidades paranormais aumenta, você se torna capaz de interferir com os rituais de outros ocultistas.',
    abilities: [
      { id: 'ampliar-ritual', name: 'Ampliar Ritual', description: 'Quando lança um ritual, você pode gastar 2 PE para aumentar seu alcance em um passo (de curto para médio, de médio para longo ou de longo para extremo), ou dobrar a área de efeito.', minNex: 10, isInitial: true },
      { id: 'acelerar-ritual', name: 'Acelerar Ritual', description: 'Uma vez por rodada, você pode aumentar o custo de um ritual em 4 PE para conjurá-lo como ação livre.', minNex: 40 },
      { id: 'anular-ritual', name: 'Anular Ritual', description: 'Quando for alvo de um ritual, você pode gastar uma quantidade de PE igual ao custo pago por esse ritual e fazer um teste oposto de Ocultismo contra o conjurador. Se vencer, você anula o ritual, cancelando todos os seus efeitos.', minNex: 65 },
      { id: 'canalizar-o-medo', name: 'Canalizar o Medo', description: 'Você aprende o ritual Canalizar o Medo.', minNex: 99 },
    ],
  },
  {
    id: 'flagelador',
    name: 'Flagelador',
    classId: 'Ocultista',
    description: 'Dor é um poderoso catalisador paranormal. Você aprendeu a transformá-la em poder para seus rituais, usando sofrimento como instrumento de destruição.',
    abilities: [
      { id: 'poder-do-flagelo', name: 'Poder do Flagelo', description: 'Ao conjurar um ritual, você pode gastar seus próprios pontos de vida no lugar de PE (1 PV = 1 PE). Pontos de vida gastos dessa forma só podem ser recuperados com descanso.', minNex: 10, isInitial: true },
      { id: 'abracar-a-dor', name: 'Abraçar a Dor', description: 'Sempre que sofrer dano paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade.', minNex: 40 },
      { id: 'absorver-angustia', name: 'Absorver Angústia', description: 'Sempre que reduzir um ou mais inimigos a 0 PV com um ritual, você recebe PE temporários iguais ao círculo do ritual utilizado. Exemplo: ao usar um ritual de 2º círculo, você recebe 2 PE temporários.', minNex: 65 },
      { id: 'medo-tangivel', name: 'Medo Tangível', description: 'Você aprende o ritual Medo Tangível.', minNex: 99 },
    ],
  },
  {
    id: 'graduado',
    name: 'Graduado',
    classId: 'Ocultista',
    description: 'Você foca seus estudos e se torna um conjurador versátil e poderoso, conhecendo mais rituais que outros ocultistas e sendo capaz de torná-los mais difíceis de resistir.',
    abilities: [
      { id: 'saber-ampliado', name: 'Saber Ampliado', description: 'Você aprende um ritual de 1º círculo. Sempre que ganhar acesso a um novo círculo, aprende um ritual adicional daquele círculo. Esses rituais não contam no limite de rituais conhecidos.', minNex: 10, isInitial: true },
      { id: 'grimorio-ritualistico', name: 'Grimório Ritualístico', description: 'Você cria um grimório especial, capaz de armazenar rituais que sua mente não conseguiria guardar. Você pode armazenar um número de rituais de 1º ou 2º círculo igual ao seu Intelecto. Sempre que ganhar acesso a um novo círculo, pode incluir um novo ritual no grimório. Rituais do grimório não contam no limite de rituais conhecidos. Para conjurar um ritual do grimório, é necessário empunhar o grimório e gastar uma ação completa para consultar o ritual. O grimório ocupa 1 espaço no inventário. Se for perdido, você pode recriá-lo com duas ações de interlúdio.', minNex: 40 },
      { id: 'rituais-eficientes', name: 'Rituais Eficientes', description: 'A DT para resistir aos seus rituais aumenta em +5.', minNex: 65 },
      { id: 'conhecendo-o-medo', name: 'Conhecendo o Medo', description: 'Você aprende o ritual Conhecendo o Medo.', minNex: 99 },
    ],
  },
  {
    id: 'intuitivo',
    name: 'Intuitivo',
    classId: 'Ocultista',
    description: 'Você expande sua mente para resistir e manipular os efeitos do Outro Lado, focando em força de vontade e resistência paranormal.',
    abilities: [
      { id: 'mente-sa', name: 'Mente Sã', description: 'Você compreende melhor as entidades do Outro Lado. Você recebe resistência paranormal +5 (+5 em testes de resistência contra efeitos paranormais).', minNex: 10, isInitial: true },
      { id: 'presenca-poderosa', name: 'Presença Poderosa', description: 'Sua resistência mental faz com que você possa extrair mais do Outro Lado. Você soma seu limite de PE por turno à sua Presença ao conjurar rituais (não afeta a DT).', minNex: 40 },
      { id: 'inabalavel', name: 'Inabalável', description: 'Você recebe resistência a dano mental igual a 10. Além disso, quando é alvo de um efeito paranormal, pode fazer um teste de Vontade para reduzir o dano à metade (não sofre dano algum se passar).', minNex: 65 },
      { id: 'presenca-do-medo', name: 'Presença do Medo', description: 'Você aprende o ritual Presença do Medo.', minNex: 99 },
    ],
  },
  {
    id: 'lamina-paranormal',
    name: 'Lâmina Paranormal',
    classId: 'Ocultista',
    description: 'Alguns ocultistas preferem unir conhecimento arcano e combate físico, usando o paranormal como extensão de sua lâmina.',
    abilities: [
      { id: 'lamina-maldita', name: 'Lâmina Maldita', description: 'Você aprende o ritual Amaldiçoar Arma. Ao conjurá-lo, pode gastar +1 PE para reduzir o tempo de conjuração para movimento. Além disso, ao conjurar esse ritual, você pode usar Ocultismo no lugar de Luta ou Pontaria para testes de ataque com a arma amaldiçoada.', minNex: 10, isInitial: true },
      { id: 'gladiador-paranormal', name: 'Gladiador Paranormal', description: 'Sempre que acerta um ataque corpo a corpo, você recebe 2 PE temporários. Você pode ganhar um número máximo de PE temporários por cena igual ao seu limite de PE por turno. PE temporários desaparecem ao final da cena.', minNex: 40 },
      { id: 'conjuracao-marcial', name: 'Conjuração Marcial', description: 'Uma vez por rodada, quando lança um ritual com execução de ação padrão, você pode gastar 2 PE para fazer um ataque corpo a corpo como ação livre.', minNex: 65 },
      { id: 'lamina-do-medo', name: 'Lâmina do Medo', description: 'Você aprende o ritual Lâmina do Medo.', minNex: 99 },
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
 * ==================== PROGRESSÃO DE NEX ====================
 * Fonte: Tabelas 1.3, 1.4 e 1.5 do livro Ordem Paranormal RPG
 *
 * AUMENTO DE ATRIBUTO: NEX 20%, 50%, 80%, 95% (4 total)
 * PODERES DE CLASSE: NEX 15%, 30%, 45%, 60%, 75%, 90% (6 total)
 * HABILIDADE DE TRILHA: NEX 10%, 40%, 65%, 99% (4 total)
 * GRAU DE TREINAMENTO: NEX 35%, 70% (2 total)
 * VERSATILIDADE: NEX 50% (1 total)
 *
 * Melhorias da habilidade base da classe (25%, 55%, 85%):
 * - Combatente: Ataque Especial (3 PE +10 → 4 PE +15 → 5 PE +20)
 * - Especialista: Perito (+1d8 → +1d10 → +1d12)
 * - Ocultista: Círculos de ritual (2º → 3º → 4º)
 * 
 * - attributePoints: Pontos de atributo extras acumulados
 * - extraSkills: Perícias extras acumuladas (além das da classe)
 * - abilityChoices: Quantidade de poderes de classe escolhidos (acumulado)
 * - trackAbilityUnlocks: Habilidades de trilha desbloqueadas
 */
export interface NexProgressionData {
  attributePoints: number;  // Pontos de atributo extras (acumulados)
  extraSkills: number;      // Perícias extras (acumuladas)
  abilityChoices: number;   // Poderes de classe disponíveis (acumulado)
  trackAbilityUnlocks: number; // Habilidades de trilha desbloqueadas
}

// NEX_PROGRESSION CORRIGIDO conforme Tabelas 1.3, 1.4 e 1.5 do livro oficial:
// - Aumento de Atributo: APENAS em 20%, 50%, 80%, 95% (4 total)
// - Poderes de Classe: APENAS em 15%, 30%, 45%, 60%, 75%, 90% (6 total)
// - Habilidade de Trilha: 10%, 40%, 65%, 99% (4 total)
export const NEX_PROGRESSION: Record<number, NexProgressionData> = {
  5:  { attributePoints: 0, extraSkills: 0, abilityChoices: 0, trackAbilityUnlocks: 0 },  // Inicial
  10: { attributePoints: 0, extraSkills: 0, abilityChoices: 0, trackAbilityUnlocks: 1 },  // 1ª habilidade de trilha
  15: { attributePoints: 0, extraSkills: 0, abilityChoices: 1, trackAbilityUnlocks: 1 },  // 1º poder de classe
  20: { attributePoints: 1, extraSkills: 0, abilityChoices: 1, trackAbilityUnlocks: 1 },  // 1º aumento de atributo
  25: { attributePoints: 1, extraSkills: 0, abilityChoices: 1, trackAbilityUnlocks: 1 },  // Melhoria habilidade base (2º círculo/etc)
  30: { attributePoints: 1, extraSkills: 0, abilityChoices: 2, trackAbilityUnlocks: 1 },  // 2º poder de classe
  35: { attributePoints: 1, extraSkills: 0, abilityChoices: 2, trackAbilityUnlocks: 1 },  // 1º grau de treinamento
  40: { attributePoints: 1, extraSkills: 0, abilityChoices: 2, trackAbilityUnlocks: 2 },  // 2ª habilidade de trilha
  45: { attributePoints: 1, extraSkills: 0, abilityChoices: 3, trackAbilityUnlocks: 2 },  // 3º poder de classe
  50: { attributePoints: 2, extraSkills: 0, abilityChoices: 3, trackAbilityUnlocks: 2 },  // 2º aumento de atributo + Versatilidade
  55: { attributePoints: 2, extraSkills: 0, abilityChoices: 3, trackAbilityUnlocks: 2 },  // Melhoria habilidade base (3º círculo/etc)
  60: { attributePoints: 2, extraSkills: 0, abilityChoices: 4, trackAbilityUnlocks: 2 },  // 4º poder de classe
  65: { attributePoints: 2, extraSkills: 0, abilityChoices: 4, trackAbilityUnlocks: 3 },  // 3ª habilidade de trilha
  70: { attributePoints: 2, extraSkills: 0, abilityChoices: 4, trackAbilityUnlocks: 3 },  // 2º grau de treinamento
  75: { attributePoints: 2, extraSkills: 0, abilityChoices: 5, trackAbilityUnlocks: 3 },  // 5º poder de classe
  80: { attributePoints: 3, extraSkills: 0, abilityChoices: 5, trackAbilityUnlocks: 3 },  // 3º aumento de atributo
  85: { attributePoints: 3, extraSkills: 0, abilityChoices: 5, trackAbilityUnlocks: 3 },  // Melhoria habilidade base (4º círculo/etc)
  90: { attributePoints: 3, extraSkills: 0, abilityChoices: 6, trackAbilityUnlocks: 3 },  // 6º poder de classe
  95: { attributePoints: 4, extraSkills: 0, abilityChoices: 6, trackAbilityUnlocks: 3 },  // 4º aumento de atributo
  99: { attributePoints: 4, extraSkills: 0, abilityChoices: 6, trackAbilityUnlocks: 4 },  // 4ª habilidade de trilha (final)
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

  // Aplicar modificador de origem (Cultista Arrependido, etc.)
  // sanityModifier é uma porcentagem sobre a SANIDADE BASE (NEX 5%), não sobre o total
  // Exemplo: -50 = metade da sanidade base é subtraída (penalidade fixa)
  // Exemplo: +25 = 25% da sanidade base é adicionada (bônus fixo)
  if (originId) {
    const origin = ORIGINS.find(o => o.id === originId);
    if (origin?.sanityModifier) {
      // Calcula o modificador baseado na sanidade BASE da classe
      const baseModifier = Math.floor(classData.sanBase * origin.sanityModifier / 100);
      san = san + baseModifier; // + para bônus, - automático para penalidade (valor negativo)
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

// ==================== BÔNUS DE TREINAMENTO ====================

/**
 * Converte grau de treinamento em bônus numérico
 * 0 = Destreinado (+0), 1 = Treinado (+5), 2 = Veterano (+10), 3 = Expert (+15)
 * Conforme Ordem Paranormal RPG v1.3
 */
export const TRAINING_BONUS_MAP = [0, 5, 10, 15] as const;

export const TRAINING_LABELS = ['Destreinado', 'Treinado', 'Veterano', 'Expert'] as const;

export function getSkillBonus(trainingLevel: number): number {
  return TRAINING_BONUS_MAP[trainingLevel] ?? 0;
}

export function getTrainingLabel(trainingLevel: number): string {
  return TRAINING_LABELS[trainingLevel] ?? 'Destreinado';
}
