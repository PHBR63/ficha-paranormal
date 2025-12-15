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
  // NOTA: Habilidades de trilha precisam ser corrigidas com textos oficiais do livro
  // Níveis corretos: 10% (1ª), 40% (2ª), 65% (3ª), 99% (4ª)
  // AGUARDANDO TEXTOS OFICIAIS DO USUÁRIO - Placeholder com estrutura correta
  {
    id: 'aniquilador',
    name: 'Aniquilador',
    classId: 'Combatente',
    description: 'Você se especializou em causar o máximo de dano possível.',
    abilities: [
      // TODO: Substituir por textos oficiais do livro
      { id: 'favorita', name: 'Favorita', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Aniquilador.', minNex: 10, isInitial: true },
      { id: 'aniquilador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Aniquilador.', minNex: 40 },
      { id: 'aniquilador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Aniquilador.', minNex: 65 },
      { id: 'aniquilador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Aniquilador.', minNex: 99 },
    ],
  },
  {
    id: 'comandante-campo',
    name: 'Comandante de Campo',
    classId: 'Combatente',
    description: 'Você lidera seus aliados em combate com maestria tática.',
    abilities: [
      { id: 'comandante-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Comandante de Campo.', minNex: 10, isInitial: true },
      { id: 'comandante-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Comandante de Campo.', minNex: 40 },
      { id: 'comandante-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Comandante de Campo.', minNex: 65 },
      { id: 'comandante-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Comandante de Campo.', minNex: 99 },
    ],
  },
  {
    id: 'guerreiro',
    name: 'Guerreiro',
    classId: 'Combatente',
    description: 'Você é um combatente versátil, dominando diversas técnicas.',
    abilities: [
      { id: 'guerreiro-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Guerreiro.', minNex: 10, isInitial: true },
      { id: 'guerreiro-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Guerreiro.', minNex: 40 },
      { id: 'guerreiro-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Guerreiro.', minNex: 65 },
      { id: 'guerreiro-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Guerreiro.', minNex: 99 },
    ],
  },
  {
    id: 'operacoes-especiais',
    name: 'Operações Especiais',
    classId: 'Combatente',
    description: 'Você foi treinado em táticas furtivas e precisas.',
    abilities: [
      { id: 'operacoes-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Operações Especiais.', minNex: 10, isInitial: true },
      { id: 'operacoes-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Operações Especiais.', minNex: 40 },
      { id: 'operacoes-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Operações Especiais.', minNex: 65 },
      { id: 'operacoes-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Operações Especiais.', minNex: 99 },
    ],
  },
  {
    id: 'tropa-choque',
    name: 'Tropa de Choque',
    classId: 'Combatente',
    description: 'Você é uma fortaleza ambulante, especializado em resistir e proteger.',
    abilities: [
      { id: 'tropa-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Tropa de Choque.', minNex: 10, isInitial: true },
      { id: 'tropa-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Tropa de Choque.', minNex: 40 },
      { id: 'tropa-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Tropa de Choque.', minNex: 65 },
      { id: 'tropa-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Tropa de Choque.', minNex: 99 },
    ],
  },

  // === TRILHAS DO ESPECIALISTA ===
  // Níveis corretos: 10% (1ª), 40% (2ª), 65% (3ª), 99% (4ª)
  {
    id: 'atirador-elite',
    name: 'Atirador de Elite',
    classId: 'Especialista',
    description: 'Você domina o combate à distância com precisão mortal.',
    abilities: [
      { id: 'atirador-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Atirador de Elite.', minNex: 10, isInitial: true },
      { id: 'atirador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Atirador de Elite.', minNex: 40 },
      { id: 'atirador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Atirador de Elite.', minNex: 65 },
      { id: 'atirador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Atirador de Elite.', minNex: 99 },
    ],
  },
  {
    id: 'infiltrador',
    name: 'Infiltrador',
    classId: 'Especialista',
    description: 'Você é especialista em entrar onde não deveria.',
    abilities: [
      { id: 'infiltrador-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Infiltrador.', minNex: 10, isInitial: true },
      { id: 'infiltrador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Infiltrador.', minNex: 40 },
      { id: 'infiltrador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Infiltrador.', minNex: 65 },
      { id: 'infiltrador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Infiltrador.', minNex: 99 },
    ],
  },
  {
    id: 'medico-campo',
    name: 'Médico de Campo',
    classId: 'Especialista',
    description: 'Você mantém sua equipe viva em situações críticas.',
    abilities: [
      { id: 'medico-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Médico de Campo.', minNex: 10, isInitial: true },
      { id: 'medico-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Médico de Campo.', minNex: 40 },
      { id: 'medico-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Médico de Campo.', minNex: 65 },
      { id: 'medico-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Médico de Campo.', minNex: 99 },
    ],
  },
  {
    id: 'negociador',
    name: 'Negociador',
    classId: 'Especialista',
    description: 'Você resolve conflitos com palavras, não violência.',
    abilities: [
      { id: 'negociador-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Negociador.', minNex: 10, isInitial: true },
      { id: 'negociador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Negociador.', minNex: 40 },
      { id: 'negociador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Negociador.', minNex: 65 },
      { id: 'negociador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Negociador.', minNex: 99 },
    ],
  },
  {
    id: 'tecnico',
    name: 'Técnico',
    classId: 'Especialista',
    description: 'Você é o gênio tecnológico da equipe.',
    abilities: [
      { id: 'tecnico-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Técnico.', minNex: 10, isInitial: true },
      { id: 'tecnico-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Técnico.', minNex: 40 },
      { id: 'tecnico-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Técnico.', minNex: 65 },
      { id: 'tecnico-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Técnico.', minNex: 99 },
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
