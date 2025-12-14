// Ordem Paranormal RPG v1.3 - Character Data (Atualizado com dados oficiais do livro)

// ==================== ORIGENS (26 origens oficiais) ====================

export const ORIGINS = [
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

// ==================== CLASSES ====================

export const CLASSES = [
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
  {
    id: 'aniquilador',
    name: 'Aniquilador',
    classId: 'Combatente',
    description: 'Você se especializou em causar o máximo de dano possível.',
    abilities: [
      { id: 'golpe-demolidor', name: 'Golpe Demolidor', description: 'Quando acerta um ataque corpo a corpo, pode gastar 2 PE para causar +2d8 de dano.', minNex: 5, isInitial: true },
      { id: 'golpe-cruel', name: 'Golpe Cruel', description: 'Sua margem de ameaça com ataques corpo a corpo aumenta em +2.', minNex: 25 },
      { id: 'massacre', name: 'Massacre', description: 'Quando reduz um inimigo a 0 PV, pode fazer um ataque adicional como ação livre.', minNex: 50 },
      { id: 'destruicao-total', name: 'Destruição Total', description: 'Seus ataques ignoram resistência a dano.', minNex: 75 },
      { id: 'exterminio', name: 'Extermínio', description: 'Quando usa Golpe Demolidor, o dano extra aumenta para +4d8.', minNex: 99 },
    ],
  },
  {
    id: 'comandante-campo',
    name: 'Comandante de Campo',
    classId: 'Combatente',
    description: 'Você lidera seus aliados em combate com maestria tática.',
    abilities: [
      { id: 'inspirar-confianca', name: 'Inspirar Confiança', description: 'Você pode gastar 2 PE para que aliados em alcance curto recebam +2 em ataques e testes de resistência até o início do seu próximo turno.', minNex: 5, isInitial: true },
      { id: 'estrategista', name: 'Estrategista', description: 'No início do combate, você pode gastar 3 PE para que aliados ajam na sua iniciativa.', minNex: 25 },
      { id: 'autoridade', name: 'Autoridade', description: 'Aliados em alcance curto recebem +2 em Vontade.', minNex: 50 },
      { id: 'comandar-ataque', name: 'Comandar Ataque', description: 'Você pode gastar uma ação padrão e 2 PE para que um aliado faça um ataque como reação.', minNex: 75 },
      { id: 'liderar-assalto', name: 'Liderar Assalto', description: 'Todos os aliados em alcance curto causam +1d6 de dano em ataques.', minNex: 99 },
    ],
  },
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    classId: 'Combatente',
    description: 'Você é um combatente versátil, dominando diversas técnicas.',
    abilities: [
      { id: 'tecnica-combate', name: 'Técnica de Combate', description: 'Você aprende uma técnica de combate à sua escolha.', minNex: 5, isInitial: true },
      { id: 'dureza', name: 'Dureza', description: 'Você recebe +1 em Defesa e resistência a dano 2.', minNex: 25 },
      { id: 'tecnica-adicional', name: 'Técnica Adicional', description: 'Você aprende mais uma técnica de combate.', minNex: 50 },
      { id: 'veterano-batalhas', name: 'Veterano de Batalhas', description: 'Você recebe +2 em testes de resistência e +5 PV.', minNex: 75 },
      { id: 'mestre-combate', name: 'Mestre do Combate', description: 'Você aprende mais duas técnicas de combate.', minNex: 99 },
    ],
  },
  {
    id: 'operacoes-especiais',
    name: 'Operações Especiais',
    classId: 'Combatente',
    description: 'Você foi treinado em táticas furtivas e precisas.',
    abilities: [
      { id: 'ataque-furtivo', name: 'Ataque Furtivo', description: 'Quando ataca um alvo desprevenido ou flanqueado, causa +2d6 de dano.', minNex: 5, isInitial: true },
      { id: 'assassinar', name: 'Assassinar', description: 'Ao atacar um alvo desprevenido, o dano é automaticamente crítico.', minNex: 25 },
      { id: 'sombra', name: 'Sombra', description: 'Você recebe +5 em Furtividade e não sofre penalidade por se mover rapidamente.', minNex: 50 },
      { id: 'ataque-letal', name: 'Ataque Letal', description: 'Seu Ataque Furtivo causa +4d6 de dano.', minNex: 75 },
      { id: 'golpe-fatal', name: 'Golpe Fatal', description: 'Quando acerta um ataque crítico, o alvo deve fazer um teste de Fortitude (DT = dano) ou é reduzido a 0 PV.', minNex: 99 },
    ],
  },
  {
    id: 'tropa-choque',
    name: 'Tropa de Choque',
    classId: 'Combatente',
    description: 'Você é uma fortaleza ambulante, especializado em resistir e proteger.',
    abilities: [
      { id: 'parede-aco', name: 'Parede de Aço', description: 'Quando usa uma ação para defender, você e aliados adjacentes recebem +2 em Defesa até seu próximo turno.', minNex: 5, isInitial: true },
      { id: 'bloqueio', name: 'Bloqueio', description: 'Quando é atingido por um ataque, pode gastar 2 PE para reduzir o dano em 1d12.', minNex: 25 },
      { id: 'inquebravel', name: 'Inquebrável', description: 'Você recebe +10 PV e resistência a dano 5.', minNex: 50 },
      { id: 'muralha-viva', name: 'Muralha Viva', description: 'Inimigos não podem passar por você e sofrem -2 em ataques contra aliados adjacentes a você.', minNex: 75 },
      { id: 'colosso', name: 'Colosso', description: 'Você é imune a ser movido contra sua vontade e recebe +2 em Defesa.', minNex: 99 },
    ],
  },

  // === TRILHAS DO ESPECIALISTA ===
  {
    id: 'atirador-elite',
    name: 'Atirador de Elite',
    classId: 'Especialista',
    description: 'Você domina o combate à distância com precisão mortal.',
    abilities: [
      { id: 'mira-paciente', name: 'Mira Paciente', description: 'Você pode gastar uma ação de movimento para receber +2 em seu próximo ataque à distância neste turno.', minNex: 5, isInitial: true },
      { id: 'disparo-letal', name: 'Disparo Letal', description: 'Quando acerta um ataque à distância, pode gastar 2 PE para causar +2d8 de dano.', minNex: 25 },
      { id: 'alcance-ampliado', name: 'Alcance Ampliado', description: 'O alcance de suas armas de disparo é dobrado.', minNex: 50 },
      { id: 'tiro-certeiro', name: 'Tiro Certeiro', description: 'Sua margem de ameaça com ataques à distância aumenta em +2.', minNex: 75 },
      { id: 'tiro-perfeito', name: 'Tiro Perfeito', description: 'Uma vez por rodada, você pode gastar 5 PE para que um ataque à distância seja automaticamente um crítico.', minNex: 99 },
    ],
  },
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    classId: 'Especialista',
    description: 'Você é especialista em entrar onde não deveria.',
    abilities: [
      { id: 'mestre-furtividade', name: 'Mestre da Furtividade', description: 'Você recebe +5 em Furtividade e Crime.', minNex: 5, isInitial: true },
      { id: 'camaleao', name: 'Camaleão', description: 'Você pode fazer testes de Furtividade mesmo sendo observado, gastando 2 PE.', minNex: 25 },
      { id: 'evasao', name: 'Evasão', description: 'Quando passa em um teste de Reflexos para meio dano, não sofre dano nenhum.', minNex: 50 },
      { id: 'invisivel', name: 'Invisível', description: 'Você pode gastar 3 PE para ficar invisível por uma rodada.', minNex: 75 },
      { id: 'fantasma', name: 'Fantasma', description: 'Você pode passar através de paredes e objetos sólidos, gastando 5 PE por turno.', minNex: 99 },
    ],
  },
  {
    id: 'medico-campo',
    name: 'Médico de Campo',
    classId: 'Especialista',
    description: 'Você mantém sua equipe viva em situações críticas.',
    abilities: [
      { id: 'primeiros-socorros-avancados', name: 'Primeiros Socorros Avançados', description: 'Quando usa Medicina para primeiros socorros, o alvo recupera +2d6 PV.', minNex: 5, isInitial: true },
      { id: 'cirurgiao-campo', name: 'Cirurgião de Campo', description: 'Você pode tratar condições graves (como envenenamento e sangramento) com um teste de Medicina.', minNex: 25 },
      { id: 'ressuscitador', name: 'Ressuscitador', description: 'Você pode estabilizar um aliado a 0 PV como ação de movimento.', minNex: 50 },
      { id: 'medico-milagroso', name: 'Médico Milagroso', description: 'Quando usa primeiros socorros, o alvo também recupera 1d6 PE.', minNex: 75 },
      { id: 'salva-vidas', name: 'Salva-Vidas', description: 'Uma vez por dia, pode trazer de volta um aliado que morreu há menos de 1 rodada.', minNex: 99 },
    ],
  },
  {
    id: 'negociador',
    name: 'Negociador',
    classId: 'Especialista',
    description: 'Você resolve conflitos com palavras, não violência.',
    abilities: [
      { id: 'diplomata-nato', name: 'Diplomata Nato', description: 'Você recebe +5 em Diplomacia e Intuição.', minNex: 5, isInitial: true },
      { id: 'voz-calmante', name: 'Voz Calmante', description: 'Você pode gastar 2 PE para fazer um alvo hostil se tornar indiferente por uma cena.', minNex: 25 },
      { id: 'leitor-pessoas', name: 'Leitor de Pessoas', description: 'Você automaticamente sabe quando alguém está mentindo.', minNex: 50 },
      { id: 'palavras-poder', name: 'Palavras de Poder', description: 'Quando faz um teste de Diplomacia ou Intimidação e passa, pode gastar 3 PE para que o alvo obedeça uma ordem simples.', minNex: 75 },
      { id: 'orador-lendario', name: 'Orador Lendário', description: 'Você pode convencer até mesmo criaturas irracionais ou do Outro Lado.', minNex: 99 },
    ],
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    classId: 'Especialista',
    description: 'Você é o gênio tecnológico da equipe.',
    abilities: [
      { id: 'inventar', name: 'Inventar', description: 'Você pode criar dispositivos improvisados com um teste de Tecnologia.', minNex: 5, isInitial: true },
      { id: 'aprimorar-equipamento', name: 'Aprimorar Equipamento', description: 'Você pode gastar 2 PE para dar +2 de bônus a um item até o fim da cena.', minNex: 25 },
      { id: 'sabotagem', name: 'Sabotagem', description: 'Você pode inutilizar equipamentos inimigos com um teste de Tecnologia.', minNex: 50 },
      { id: 'super-invencao', name: 'Super Invenção', description: 'Suas invenções improvisadas têm efeitos dobrados.', minNex: 75 },
      { id: 'tecnomante', name: 'Tecnomante', description: 'Você pode controlar dispositivos eletrônicos à distância.', minNex: 99 },
    ],
  },

  // === TRILHAS DO OCULTISTA ===
  {
    id: 'conduíte',
    name: 'Conduíte',
    classId: 'Ocultista',
    description: 'Você canaliza a energia do Outro Lado de forma bruta.',
    abilities: [
      { id: 'canalizar', name: 'Canalizar', description: 'Você pode gastar 2 PE para causar 2d6 de dano paranormal em um alvo em alcance curto.', minNex: 5, isInitial: true },
      { id: 'explosao-energia', name: 'Explosão de Energia', description: 'Seu Canalizar afeta todos os alvos em uma área de 3m de raio.', minNex: 25 },
      { id: 'transcender', name: 'Transcender', description: 'Você pode gastar 5 PE para receber +5 em um teste de ritual.', minNex: 50 },
      { id: 'surto-paranormal', name: 'Surto Paranormal', description: 'Seu Canalizar causa 4d6 de dano.', minNex: 75 },
      { id: 'avatar', name: 'Avatar', description: 'Uma vez por dia, você pode se fundir com uma entidade do Outro Lado, recebendo +5 em todos os testes por 1 minuto.', minNex: 99 },
    ],
  },
  {
    id: 'flagelador',
    name: 'Flagelador',
    classId: 'Ocultista',
    description: 'Você usa o próprio corpo como fonte de poder.',
    abilities: [
      { id: 'sangue-poder', name: 'Sangue é Poder', description: 'Você pode gastar PV no lugar de PE para lançar rituais (1 para 1).', minNex: 5, isInitial: true },
      { id: 'cicatriz-mistica', name: 'Cicatriz Mística', description: 'Quando usa PV para um ritual, causa +1d6 de dano.', minNex: 25 },
      { id: 'dor-concentra', name: 'Dor Concentra', description: 'Quando está com menos da metade do PV, recebe +2 em rituais.', minNex: 50 },
      { id: 'feridas-sagradas', name: 'Feridas Sagradas', description: 'Você pode gastar 5 PV para recuperar 2 PE.', minNex: 75 },
      { id: 'sacrificio-supremo', name: 'Sacrifício Supremo', description: 'Você pode gastar metade do seu PV atual para dobrar o efeito de um ritual.', minNex: 99 },
    ],
  },
  {
    id: 'graduado',
    name: 'Graduado',
    classId: 'Ocultista',
    description: 'Você estudou o paranormal de forma acadêmica.',
    abilities: [
      { id: 'formacao-academica', name: 'Formação Acadêmica', description: 'Você recebe +5 em Ocultismo e conhece um ritual adicional.', minNex: 5, isInitial: true },
      { id: 'pesquisador', name: 'Pesquisador', description: 'Você pode aprender rituais de círculos mais altos que o normal (até seu círculo +1).', minNex: 25 },
      { id: 'especialista-rituais', name: 'Especialista em Rituais', description: 'O custo em PE dos seus rituais é reduzido em 2 (mínimo 1).', minNex: 50 },
      { id: 'conhecimento-proibido', name: 'Conhecimento Proibido', description: 'Você conhece três rituais adicionais de qualquer círculo que possa lançar.', minNex: 75 },
      { id: 'mestre-arcano', name: 'Mestre Arcano', description: 'Você pode lançar rituais de 1º e 2º círculo como ação livre.', minNex: 99 },
    ],
  },
  {
    id: 'intuitivo',
    name: 'Intuitivo',
    classId: 'Ocultista',
    description: 'Seus poderes vêm da intuição e emoção.',
    abilities: [
      { id: 'instinto-paranormal', name: 'Instinto Paranormal', description: 'Você pode usar Presença no lugar de Intelecto para testes de Ocultismo.', minNex: 5, isInitial: true },
      { id: 'sexto-sentido', name: 'Sexto Sentido', description: 'Você sente presenças paranormais automaticamente em alcance médio.', minNex: 25 },
      { id: 'empatia-sobrenatural', name: 'Empatia Sobrenatural', description: 'Você pode se comunicar telepaticamente com aliados em alcance curto.', minNex: 50 },
      { id: 'premonicao', name: 'Premonição', description: 'Uma vez por dia, você pode prever o futuro próximo, recebendo +5 em iniciativa e não podendo ser surpreendido.', minNex: 75 },
      { id: 'mente-expandida', name: 'Mente Expandida', description: 'Você pode lançar rituais sem gesticular ou falar.', minNex: 99 },
    ],
  },
  {
    id: 'lamina-paranormal',
    name: 'Lâmina Paranormal',
    classId: 'Ocultista',
    description: 'Você combina magia e combate corpo a corpo.',
    abilities: [
      { id: 'arma-imbuida', name: 'Arma Imbuída', description: 'Você pode gastar 2 PE para que sua arma cause +1d6 de dano paranormal por uma cena.', minNex: 5, isInitial: true },
      { id: 'golpe-mistico', name: 'Golpe Místico', description: 'Quando acerta um ataque com arma imbuída, pode gastar 1 PE para empurrar o alvo 3m.', minNex: 25 },
      { id: 'arma-elemental', name: 'Arma Elemental', description: 'Sua arma imbuída causa dano de um elemento à sua escolha (fogo, frio, eletricidade, etc).', minNex: 50 },
      { id: 'contra-ataque-mistico', name: 'Contra-ataque Místico', description: 'Quando é atacado em corpo a corpo, pode gastar sua reação e 2 PE para fazer um ataque.', minNex: 75 },
      { id: 'avatar-lamina', name: 'Avatar da Lâmina', description: 'Sua arma imbuída causa +3d6 de dano paranormal e você recebe +2 em ataques.', minNex: 99 },
    ],
  },
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
  const ocultista = CLASSES.find(c => c.id === 'Ocultista');
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
