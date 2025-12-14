// Ordem Paranormal RPG v1.3 - Character Data

export const ORIGINS = [
  {
    id: 'academico',
    name: 'Acadêmico',
    description: 'Você passou boa parte da vida estudando em uma universidade ou dedicou tempo a aprender por conta própria.',
    skills: ['Ciências', 'Investigação'],
    powers: ['Saber é Poder'],
    powerDescription: 'Ao fazer um teste de perícia de Ciências, Investigação ou Ocultismo, você pode gastar 2 PE para receber +5 no teste.',
  },
  {
    id: 'agente-de-saude',
    name: 'Agente de Saúde',
    description: 'Você trabalha na área da saúde, como médico, enfermeiro ou paramédico.',
    skills: ['Intuição', 'Medicina'],
    powers: ['Técnico em Primeiros Socorros'],
    powerDescription: 'Quando você usa a perícia Medicina para curar PV, o alvo recupera +1d6 PV adicional.',
  },
  {
    id: 'amnésico',
    name: 'Amnésico',
    description: 'Você perdeu a memória. Pode ter sido trauma, acidente ou algo mais sinistro.',
    skills: ['Escolha duas perícias'],
    powers: ['Memórias Fragmentadas'],
    powerDescription: 'Uma vez por missão, você pode "lembrar" de uma informação útil. O Mestre lhe dará uma dica sobre o cenário.',
  },
  {
    id: 'artista',
    name: 'Artista',
    description: 'Você se expressa através de alguma forma de arte - música, pintura, atuação.',
    skills: ['Artes', 'Enganação'],
    powers: ['Inspiração'],
    powerDescription: 'Você pode gastar uma ação padrão e 2 PE para conceder +2 em todos os testes de um aliado até o final da cena.',
  },
  {
    id: 'atleta',
    name: 'Atleta',
    description: 'Você dedica sua vida ao esporte e à competição física.',
    skills: ['Acrobacia', 'Atletismo'],
    powers: ['Corpo Atlético'],
    powerDescription: 'Você recebe +2 em Atletismo e +1m de deslocamento.',
  },
  {
    id: 'chef',
    name: 'Chef',
    description: 'Você é um cozinheiro habilidoso, capaz de preparar refeições incríveis.',
    skills: ['Fortitude', 'Profissão'],
    powers: ['Comfort Food'],
    powerDescription: 'Durante um descanso, você pode cozinhar para até 6 pessoas. Cada uma recupera +2d6 PV e PE.',
  },
  {
    id: 'criminoso',
    name: 'Criminoso',
    description: 'Você vive ou viveu do outro lado da lei.',
    skills: ['Crime', 'Furtividade'],
    powers: ['Contatos no Submundo'],
    powerDescription: 'Você pode conseguir itens ilegais ou informações do submundo com maior facilidade (-5 na DT).',
  },
  {
    id: 'cultista-arrependido',
    name: 'Cultista Arrependido',
    description: 'Você fez parte de um culto do Outro Lado e escapou (ou foi resgatado).',
    skills: ['Ocultismo', 'Religião'],
    powers: ['Conhecimento Proibido'],
    powerDescription: 'Você sabe coisas que não deveria. Recebe +5 em testes relacionados ao Outro Lado. Porém, sua SAN inicial é reduzida pela metade.',
    sanityModifier: 0.5,
  },
  {
    id: 'desgarrado',
    name: 'Desgarrado',
    description: 'Você não tem lar fixo e vive nas ruas ou viajando.',
    skills: ['Fortitude', 'Sobrevivência'],
    powers: ['Acostumado ao Pior'],
    powerDescription: 'Você recebe resistência a dano de frio e fome, e pode dormir em qualquer lugar sem penalidades.',
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Você trabalha com relações públicas, política ou negociações.',
    skills: ['Diplomacia', 'Intuição'],
    powers: ['Língua de Prata'],
    powerDescription: 'Você recebe +2 em Diplomacia e pode tentar convencer alguém uma vez adicional por cena.',
  },
  {
    id: 'engenheiro',
    name: 'Engenheiro',
    description: 'Você projeta e constrói coisas, desde pequenos gadgets até grandes estruturas.',
    skills: ['Profissão', 'Tecnologia'],
    powers: ['Mente Analítica'],
    powerDescription: 'Você pode analisar um equipamento ou estrutura para descobrir seus pontos fracos (+5 em teste relacionado).',
  },
  {
    id: 'executivo',
    name: 'Executivo',
    description: 'Você ocupa uma posição de liderança em uma empresa ou organização.',
    skills: ['Diplomacia', 'Profissão'],
    powers: ['Autoridade'],
    powerDescription: 'Você possui contatos e recursos. Uma vez por missão, pode requisitar um favor ou recurso de moderado valor.',
  },
  {
    id: 'investigador',
    name: 'Investigador',
    description: 'Você trabalha desvendando mistérios, seja como detetive, jornalista ou por conta própria.',
    skills: ['Investigação', 'Percepção'],
    powers: ['Olhar Atento'],
    powerDescription: 'Você recebe +2 em Investigação e Percepção, e pode notar detalhes ocultos automaticamente.',
  },
  {
    id: 'lutador',
    name: 'Lutador',
    description: 'Você treinou combate corpo a corpo, seja em academia, ringue ou nas ruas.',
    skills: ['Luta', 'Reflexos'],
    powers: ['Combate Pessoal'],
    powerDescription: 'Seus ataques desarmados causam 1d6 de dano e você recebe +2 em Luta.',
  },
  {
    id: 'militar',
    name: 'Militar',
    description: 'Você serviu (ou serve) nas forças armadas.',
    skills: ['Pontaria', 'Tática'],
    powers: ['Treinamento de Combate'],
    powerDescription: 'Você recebe +2 em Pontaria e pode sacar armas como ação livre.',
  },
  {
    id: 'operario',
    name: 'Operário',
    description: 'Você trabalha com as mãos em construção, fábrica ou manutenção.',
    skills: ['Fortitude', 'Profissão'],
    powers: ['Mãos Calejadas'],
    powerDescription: 'Você recebe resistência a dano 2 contra dano cortante, perfurante e de impacto.',
  },
  {
    id: 'policial',
    name: 'Policial',
    description: 'Você trabalha (ou trabalhou) na aplicação da lei.',
    skills: ['Percepção', 'Pontaria'],
    powers: ['Autoridade Policial'],
    powerDescription: 'Você pode requisitar auxílio das autoridades locais e possui porte de arma legal.',
  },
  {
    id: 'religioso',
    name: 'Religioso',
    description: 'Você é devoto de uma fé e pode ser um líder religioso.',
    skills: ['Religião', 'Vontade'],
    powers: ['Fé Inabalável'],
    powerDescription: 'Você recebe +2 em Vontade e pode resistir a efeitos de medo com maior facilidade.',
  },
  {
    id: 'servidor-publico',
    name: 'Servidor Público',
    description: 'Você trabalha para o governo em alguma capacidade burocrática.',
    skills: ['Diplomacia', 'Investigação'],
    powers: ['Acesso a Arquivos'],
    powerDescription: 'Você pode acessar documentos e registros oficiais que normalmente seriam restritos.',
  },
  {
    id: 'teorico-da-conspiracao',
    name: 'Teórico da Conspiração',
    description: 'Você acredita que há mais coisas entre o céu e a terra do que a maioria imagina.',
    skills: ['Investigação', 'Ocultismo'],
    powers: ['Eu Avisei!'],
    powerDescription: 'Quando algo sobrenatural acontece, você pode gastar 2 PE para ter "previsto" e receber +5 na próxima ação.',
  },
  {
    id: 'ti',
    name: 'T.I.',
    description: 'Você trabalha com tecnologia da informação, programação ou segurança digital.',
    skills: ['Investigação', 'Tecnologia'],
    powers: ['Hacker'],
    powerDescription: 'Você recebe +5 em testes para invadir sistemas e pode fazer isso remotamente.',
  },
  {
    id: 'trabalhador-rural',
    name: 'Trabalhador Rural',
    description: 'Você cresceu ou trabalha no campo, em fazendas ou áreas rurais.',
    skills: ['Adestramento', 'Sobrevivência'],
    powers: ['Vida Simples'],
    powerDescription: 'Você se recupera mais rápido em ambientes naturais (+2d6 de cura em descansos na natureza).',
  },
  {
    id: 'trambiqueiro',
    name: 'Trambiqueiro',
    description: 'Você vive de pequenos golpes e trapaças.',
    skills: ['Crime', 'Enganação'],
    powers: ['Lábia'],
    powerDescription: 'Você recebe +5 em Enganação e pode tentar enganar a mesma pessoa duas vezes por cena.',
  },
  {
    id: 'universitario',
    name: 'Universitário',
    description: 'Você é um estudante universitário, ainda aprendendo mas cheio de potencial.',
    skills: ['Atualidades', 'Investigação'],
    powers: ['Eclético'],
    powerDescription: 'Você pode fazer qualquer teste de perícia como se fosse treinado (sem bônus, mas sem penalidade).',
  },
  {
    id: 'vitima',
    name: 'Vítima',
    description: 'Você sobreviveu a um encontro com o paranormal antes de se tornar agente.',
    skills: ['Reflexos', 'Vontade'],
    powers: ['Cicatrizes'],
    powerDescription: 'Você recebe +2 em testes para resistir a efeitos do Medo e +5 contra criaturas do Outro Lado.',
  },
];

export const CLASSES = [
  {
    id: 'Combatente',
    name: 'Combatente',
    description: 'Especialista em combate físico e tático. Possui mais pontos de vida e é melhor em situações de confronto direto.',
    pvBase: 20,
    pvPerNex: 4, // +4 PV por 5% NEX + VIG
    peBase: 2,
    pePerNex: 2, // +2 PE por 5% NEX + PRE
    sanBase: 12,
    sanPerNex: 3, // +3 SAN por 5% NEX
    skillsPerNex: 2,
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
      'Bônus em combate corpo a corpo',
      'Acesso a habilidades táticas',
    ],
  },
  {
    id: 'Especialista',
    name: 'Especialista',
    description: 'Perito em perícias e investigação. Possui mais pontos de perícia e é versátil em diversas situações.',
    pvBase: 16,
    pvPerNex: 3, // +3 PV por 5% NEX + VIG
    peBase: 3,
    pePerNex: 3, // +3 PE por 5% NEX + PRE
    sanBase: 16,
    sanPerNex: 4, // +4 SAN por 5% NEX
    skillsPerNex: 4,
    proficiencies: ['Armas simples', 'Proteções leves'],
    skillRules: {
      mandatory: [],
      choices: [],
      freeFormula: 'INT + 7',
    },
    initialAbilities: ['Eclético'],
    features: [
      'Maior quantidade de perícias',
      'Bônus em testes de perícia',
      'Versatilidade em situações variadas',
    ],
  },
  {
    id: 'Ocultista',
    name: 'Ocultista',
    description: 'Conhecedor do paranormal e dos rituais. Possui mais pontos de esforço e acesso a poderes sobrenaturais.',
    pvBase: 12,
    pvPerNex: 2, // +2 PV por 5% NEX + VIG
    peBase: 4,
    pePerNex: 4, // +4 PE por 5% NEX + PRE
    sanBase: 20,
    sanPerNex: 5, // +5 SAN por 5% NEX (maior resistência mental)
    skillsPerNex: 3,
    proficiencies: ['Armas simples'],
    skillRules: {
      mandatory: ['ocultismo', 'vontade'],
      choices: [],
      freeFormula: 'INT + 3',
    },
    initialAbilities: ['Afinidade Paranormal'],
    features: [
      'Maior quantidade de PE',
      'Acesso a rituais desde o início',
      'Resistência ao paranormal',
    ],
  },
];

export const SKILLS = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'agility', description: 'Equilíbrio, saltos e manobras acrobáticas.', requiresTraining: false },
  { id: 'adestramento', name: 'Adestramento', attribute: 'presence', description: 'Treinar e controlar animais.', requiresTraining: false },
  { id: 'artes', name: 'Artes', attribute: 'presence', description: 'Criar e apreciar obras artísticas.', requiresTraining: false },
  { id: 'atletismo', name: 'Atletismo', attribute: 'strength', description: 'Correr, escalar, nadar e outras atividades físicas.', requiresTraining: false },
  { id: 'atualidades', name: 'Atualidades', attribute: 'intellect', description: 'Conhecimentos gerais e cultura pop.', requiresTraining: false },
  { id: 'ciencias', name: 'Ciências', attribute: 'intellect', description: 'Física, química, biologia e outras ciências.', requiresTraining: true },
  { id: 'crime', name: 'Crime', attribute: 'agility', description: 'Arrombamento, furto e outras atividades ilícitas.', requiresTraining: true },
  { id: 'diplomacia', name: 'Diplomacia', attribute: 'presence', description: 'Negociar, convencer e persuadir.', requiresTraining: false },
  { id: 'enganacao', name: 'Enganação', attribute: 'presence', description: 'Mentir, disfarçar e enganar.', requiresTraining: false },
  { id: 'fortitude', name: 'Fortitude', attribute: 'vigor', description: 'Resistir a fadiga, venenos e doenças.', requiresTraining: false },
  { id: 'furtividade', name: 'Furtividade', attribute: 'agility', description: 'Mover-se sem ser notado.', requiresTraining: false },
  { id: 'iniciativa', name: 'Iniciativa', attribute: 'agility', description: 'Velocidade de reação em combate.', requiresTraining: false },
  { id: 'intimidacao', name: 'Intimidação', attribute: 'presence', description: 'Coagir e amedrontar.', requiresTraining: false },
  { id: 'intuicao', name: 'Intuição', attribute: 'intellect', description: 'Perceber intenções e mentiras.', requiresTraining: false },
  { id: 'investigacao', name: 'Investigação', attribute: 'intellect', description: 'Procurar pistas e resolver mistérios.', requiresTraining: false },
  { id: 'luta', name: 'Luta', attribute: 'strength', description: 'Combate corpo a corpo.', requiresTraining: false },
  { id: 'medicina', name: 'Medicina', attribute: 'intellect', description: 'Tratar ferimentos e doenças.', requiresTraining: true },
  { id: 'ocultismo', name: 'Ocultismo', attribute: 'intellect', description: 'Conhecimento sobre o paranormal.', requiresTraining: true },
  { id: 'percepcao', name: 'Percepção', attribute: 'presence', description: 'Notar detalhes e ameaças.', requiresTraining: false },
  { id: 'pilotagem', name: 'Pilotagem', attribute: 'agility', description: 'Dirigir veículos.', requiresTraining: true },
  { id: 'pontaria', name: 'Pontaria', attribute: 'agility', description: 'Combate à distância.', requiresTraining: false },
  { id: 'profissao', name: 'Profissão', attribute: 'intellect', description: 'Conhecimentos de uma profissão específica.', requiresTraining: false },
  { id: 'reflexos', name: 'Reflexos', attribute: 'agility', description: 'Esquivar de ataques e armadilhas.', requiresTraining: false },
  { id: 'religiao', name: 'Religião', attribute: 'presence', description: 'Conhecimento sobre religiões e crenças.', requiresTraining: false },
  { id: 'sobrevivencia', name: 'Sobrevivência', attribute: 'intellect', description: 'Orientar-se e sobreviver na natureza.', requiresTraining: false },
  { id: 'tatica', name: 'Tática', attribute: 'intellect', description: 'Planejamento e estratégia militar.', requiresTraining: true },
  { id: 'tecnologia', name: 'Tecnologia', attribute: 'intellect', description: 'Usar e consertar equipamentos eletrônicos.', requiresTraining: true },
  { id: 'vontade', name: 'Vontade', attribute: 'presence', description: 'Resistir a manipulação mental e medo.', requiresTraining: false },
];

export const TRAINING_LEVELS = [
  { id: 0, name: 'Destreinado', bonus: 0, minNex: 0 },
  { id: 1, name: 'Treinado', bonus: 5, minNex: 0 },
  { id: 2, name: 'Veterano', bonus: 10, minNex: 35 },
  { id: 3, name: 'Expert', bonus: 15, minNex: 70 },
];

export const PATENTS = [
  { nex: 5, name: 'Recruta', itemLimit: { cat0: 2, cat1: 0, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 10, name: 'Recruta', itemLimit: { cat0: 2, cat1: 0, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 15, name: 'Recruta', itemLimit: { cat0: 2, cat1: 0, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 20, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 25, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 30, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 35, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 40, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 45, name: 'Operador', itemLimit: { cat0: 3, cat1: 1, cat2: 0, cat3: 0, cat4: 0 } },
  { nex: 50, name: 'Agente Especial', itemLimit: { cat0: 3, cat1: 2, cat2: 1, cat3: 0, cat4: 0 } },
  { nex: 55, name: 'Agente Especial', itemLimit: { cat0: 3, cat1: 2, cat2: 1, cat3: 0, cat4: 0 } },
  { nex: 60, name: 'Agente Especial', itemLimit: { cat0: 3, cat1: 2, cat2: 1, cat3: 0, cat4: 0 } },
  { nex: 65, name: 'Agente Especial', itemLimit: { cat0: 3, cat1: 2, cat2: 1, cat3: 0, cat4: 0 } },
  { nex: 70, name: 'Agente Especial', itemLimit: { cat0: 3, cat1: 2, cat2: 1, cat3: 0, cat4: 0 } },
  { nex: 75, name: 'Oficial de Operações', itemLimit: { cat0: 3, cat1: 3, cat2: 2, cat3: 1, cat4: 0 } },
  { nex: 80, name: 'Oficial de Operações', itemLimit: { cat0: 3, cat1: 3, cat2: 2, cat3: 1, cat4: 0 } },
  { nex: 85, name: 'Oficial de Operações', itemLimit: { cat0: 3, cat1: 3, cat2: 2, cat3: 1, cat4: 0 } },
  { nex: 90, name: 'Oficial de Operações', itemLimit: { cat0: 3, cat1: 3, cat2: 2, cat3: 1, cat4: 0 } },
  { nex: 95, name: 'Oficial de Operações', itemLimit: { cat0: 3, cat1: 3, cat2: 2, cat3: 1, cat4: 0 } },
  { nex: 99, name: 'Agente de Elite', itemLimit: { cat0: 3, cat1: 3, cat2: 3, cat3: 2, cat4: 0 } },
];

export function getPatentByNex(nex: number): string {
  if (nex >= 99) return 'Agente de Elite';
  if (nex >= 75) return 'Oficial de Operações';
  if (nex >= 50) return 'Agente Especial';
  if (nex >= 20) return 'Operador';
  return 'Recruta';
}

/**
 * Calcula os stats derivados baseado nas fórmulas oficiais v1.3
 * 
 * Combatente: PV = (20 + VIG) + ((Floor(NEX/5) - 1) * (4 + VIG))
 * Especialista: PV = (16 + VIG) + ((Floor(NEX/5) - 1) * (3 + VIG))
 * Ocultista: PV = (12 + VIG) + ((Floor(NEX/5) - 1) * (2 + VIG))
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

  const nexMultiplier = Math.floor(nex / 5);
  
  // Primeiro nível usa a base, subsequentes usam o incremento
  let hp: number;
  let pe: number;
  let san: number;

  if (nexMultiplier <= 1) {
    // NEX 5% - usa apenas a base
    hp = classData.pvBase + vigor;
    pe = classData.peBase + presence;
    san = classData.sanBase;
  } else {
    // NEX > 5% - base + incrementos
    hp = (classData.pvBase + vigor) + ((nexMultiplier - 1) * (classData.pvPerNex + vigor));
    pe = (classData.peBase + presence) + ((nexMultiplier - 1) * (classData.pePerNex + presence));
    san = classData.sanBase + ((nexMultiplier - 1) * classData.sanPerNex);
  }

  // Modificador de origem (ex: Cultista Arrependido tem SAN/2)
  if (originId) {
    const origin = ORIGINS.find(o => o.id === originId);
    if (origin?.sanityModifier) {
      san = Math.floor(san * origin.sanityModifier);
    }
  }

  return { hp, pe, san };
}

export function getAttributeBonus(value: number): number {
  return value;
}

// Calcula a defesa base
export function calculateDefense(agility: number): number {
  return 10 + agility;
}

// Calcula a capacidade de carga
export function calculateCarryCapacity(strength: number): number {
  return Math.max(2, 5 * strength);
}
