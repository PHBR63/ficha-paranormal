// Ordem Paranormal RPG v1.3 - Character Data

export const ORIGINS = [
  {
    id: 'academico',
    name: 'Acadêmico',
    description: 'Você passou boa parte da vida estudando em uma universidade ou dedicou tempo a aprender por conta própria.',
    skills: ['Ciências', 'Investigação'],
    powers: ['Saber é Poder'],
  },
  {
    id: 'agente-de-saude',
    name: 'Agente de Saúde',
    description: 'Você trabalha na área da saúde, como médico, enfermeiro ou paramédico.',
    skills: ['Intuição', 'Medicina'],
    powers: ['Técnico em Primeiros Socorros'],
  },
  {
    id: 'amnésico',
    name: 'Amnésico',
    description: 'Você perdeu a memória. Pode ter sido trauma, acidente ou algo mais sinistro.',
    skills: ['Escolha duas perícias quaisquer'],
    powers: ['Memórias Fragmentadas'],
  },
  {
    id: 'artista',
    name: 'Artista',
    description: 'Você se expressa através de alguma forma de arte - música, pintura, atuação.',
    skills: ['Artes', 'Enganação'],
    powers: ['Inspiração'],
  },
  {
    id: 'atleta',
    name: 'Atleta',
    description: 'Você dedica sua vida ao esporte e à competição física.',
    skills: ['Acrobacia', 'Atletismo'],
    powers: ['Corpo Atlético'],
  },
  {
    id: 'chef',
    name: 'Chef',
    description: 'Você é um cozinheiro habilidoso, capaz de preparar refeições incríveis.',
    skills: ['Fortitude', 'Profissão (Culinária)'],
    powers: ['Comfort Food'],
  },
  {
    id: 'criminoso',
    name: 'Criminoso',
    description: 'Você vive ou viveu do outro lado da lei.',
    skills: ['Crime', 'Furtividade'],
    powers: ['Contatos no Submundo'],
  },
  {
    id: 'cultuado',
    name: 'Cultuado',
    description: 'Você fez parte de um culto ou seita e escapou (ou ainda está envolvido).',
    skills: ['Ocultismo', 'Religião'],
    powers: ['Conhecimento Proibido'],
  },
  {
    id: 'desgarrado',
    name: 'Desgarrado',
    description: 'Você não tem lar fixo e vive nas ruas ou viajando.',
    skills: ['Fortitude', 'Sobrevivência'],
    powers: ['Acostumado ao Pior'],
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Você trabalha com relações públicas, política ou negociações.',
    skills: ['Diplomacia', 'Intuição'],
    powers: ['Língua de Prata'],
  },
  {
    id: 'engenheiro',
    name: 'Engenheiro',
    description: 'Você projeta e constrói coisas, desde pequenos gadgets até grandes estruturas.',
    skills: ['Profissão (Engenharia)', 'Tecnologia'],
    powers: ['Mente Analítica'],
  },
  {
    id: 'executivo',
    name: 'Executivo',
    description: 'Você ocupa uma posição de liderança em uma empresa ou organização.',
    skills: ['Diplomacia', 'Profissão (Empresarial)'],
    powers: ['Autoridade'],
  },
  {
    id: 'investigador',
    name: 'Investigador',
    description: 'Você trabalha desvendando mistérios, seja como detetive, jornalista ou por conta própria.',
    skills: ['Investigação', 'Percepção'],
    powers: ['Olhar Atento'],
  },
  {
    id: 'lutador',
    name: 'Lutador',
    description: 'Você treinou combate corpo a corpo, seja em academia, ringue ou nas ruas.',
    skills: ['Luta', 'Reflexos'],
    powers: ['Combate Pessoal'],
  },
  {
    id: 'militar',
    name: 'Militar',
    description: 'Você serviu (ou serve) nas forças armadas.',
    skills: ['Pontaria', 'Tática'],
    powers: ['Treinamento de Combate'],
  },
  {
    id: 'operario',
    name: 'Operário',
    description: 'Você trabalha com as mãos em construção, fábrica ou manutenção.',
    skills: ['Fortitude', 'Profissão (Trabalho Manual)'],
    powers: ['Mãos Calejadas'],
  },
  {
    id: 'policial',
    name: 'Policial',
    description: 'Você trabalha (ou trabalhou) na aplicação da lei.',
    skills: ['Percepção', 'Pontaria'],
    powers: ['Autoridade Policial'],
  },
  {
    id: 'religioso',
    name: 'Religioso',
    description: 'Você é devoto de uma fé e pode ser um líder religioso.',
    skills: ['Religião', 'Vontade'],
    powers: ['Fé Inabalável'],
  },
  {
    id: 'servidor-publico',
    name: 'Servidor Público',
    description: 'Você trabalha para o governo em alguma capacidade burocrática.',
    skills: ['Diplomacia', 'Investigação'],
    powers: ['Acesso a Arquivos'],
  },
  {
    id: 'teorico-da-conspiracao',
    name: 'Teórico da Conspiração',
    description: 'Você acredita que há mais coisas entre o céu e a terra do que a maioria imagina.',
    skills: ['Investigação', 'Ocultismo'],
    powers: ['Eu Avisei!'],
  },
  {
    id: 'ti',
    name: 'T.I.',
    description: 'Você trabalha com tecnologia da informação, programação ou segurança digital.',
    skills: ['Investigação', 'Tecnologia'],
    powers: ['Hacker'],
  },
  {
    id: 'trabalhador-rural',
    name: 'Trabalhador Rural',
    description: 'Você cresceu ou trabalha no campo, em fazendas ou áreas rurais.',
    skills: ['Adestramento', 'Sobrevivência'],
    powers: ['Vida Simples'],
  },
  {
    id: 'trambiqueiro',
    name: 'Trambiqueiro',
    description: 'Você vive de pequenos golpes e trapaças.',
    skills: ['Crime', 'Enganação'],
    powers: ['Lábia'],
  },
  {
    id: 'universitario',
    name: 'Universitário',
    description: 'Você é um estudante universitário, ainda aprendendo mas cheio de potencial.',
    skills: ['Atualidades', 'Investigação'],
    powers: ['Eclético'],
  },
  {
    id: 'vitima',
    name: 'Vítima',
    description: 'Você sobreviveu a um encontro com o paranormal antes de se tornar agente.',
    skills: ['Reflexos', 'Vontade'],
    powers: ['Cicatrizes'],
  },
];

export const CLASSES = [
  {
    id: 'Combatente',
    name: 'Combatente',
    description: 'Especialista em combate físico e tático. Possui mais pontos de vida e é melhor em situações de confronto direto.',
    pvPerNex: 4, // +4 PV por 5% NEX + VIG
    pePerNex: 2, // +2 PE por 5% NEX + PRE
    sanPerNex: 3, // +3 SAN por 5% NEX
    skillsPerNex: 2,
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
    pvPerNex: 3, // +3 PV por 5% NEX + VIG
    pePerNex: 3, // +3 PE por 5% NEX + PRE
    sanPerNex: 4, // +4 SAN por 5% NEX
    skillsPerNex: 4,
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
    pvPerNex: 2, // +2 PV por 5% NEX + VIG
    pePerNex: 4, // +4 PE por 5% NEX + PRE
    sanPerNex: 3, // +3 SAN por 5% NEX
    skillsPerNex: 3,
    features: [
      'Maior quantidade de PE',
      'Acesso a rituais desde o início',
      'Resistência ao paranormal',
    ],
  },
];

export const SKILLS = [
  { id: 'acrobacia', name: 'Acrobacia', attribute: 'agility' },
  { id: 'adestramento', name: 'Adestramento', attribute: 'presence' },
  { id: 'artes', name: 'Artes', attribute: 'presence' },
  { id: 'atletismo', name: 'Atletismo', attribute: 'strength' },
  { id: 'atualidades', name: 'Atualidades', attribute: 'intellect' },
  { id: 'ciencias', name: 'Ciências', attribute: 'intellect' },
  { id: 'crime', name: 'Crime', attribute: 'agility' },
  { id: 'diplomacia', name: 'Diplomacia', attribute: 'presence' },
  { id: 'enganacao', name: 'Enganação', attribute: 'presence' },
  { id: 'fortitude', name: 'Fortitude', attribute: 'vigor' },
  { id: 'furtividade', name: 'Furtividade', attribute: 'agility' },
  { id: 'iniciativa', name: 'Iniciativa', attribute: 'agility' },
  { id: 'intimidacao', name: 'Intimidação', attribute: 'presence' },
  { id: 'intuicao', name: 'Intuição', attribute: 'intellect' },
  { id: 'investigacao', name: 'Investigação', attribute: 'intellect' },
  { id: 'luta', name: 'Luta', attribute: 'strength' },
  { id: 'medicina', name: 'Medicina', attribute: 'intellect' },
  { id: 'ocultismo', name: 'Ocultismo', attribute: 'intellect' },
  { id: 'percepcao', name: 'Percepção', attribute: 'presence' },
  { id: 'pilotagem', name: 'Pilotagem', attribute: 'agility' },
  { id: 'pontaria', name: 'Pontaria', attribute: 'agility' },
  { id: 'profissao', name: 'Profissão', attribute: 'intellect' },
  { id: 'reflexos', name: 'Reflexos', attribute: 'agility' },
  { id: 'religiao', name: 'Religião', attribute: 'presence' },
  { id: 'sobrevivencia', name: 'Sobrevivência', attribute: 'intellect' },
  { id: 'tatica', name: 'Tática', attribute: 'intellect' },
  { id: 'tecnologia', name: 'Tecnologia', attribute: 'intellect' },
  { id: 'vontade', name: 'Vontade', attribute: 'presence' },
];

export const TRAINING_LEVELS = [
  { id: 0, name: 'Destreinado', bonus: 0 },
  { id: 1, name: 'Treinado', bonus: 5 },
  { id: 2, name: 'Veterano', bonus: 10 },
  { id: 3, name: 'Expert', bonus: 15 },
];

export const PATENTS = [
  { nex: 5, name: 'Recruta', itemLimit: 'Categoria 0' },
  { nex: 20, name: 'Operador', itemLimit: 'Categoria I' },
  { nex: 50, name: 'Agente Especial', itemLimit: 'Categoria II' },
  { nex: 75, name: 'Oficial de Operações', itemLimit: 'Categoria III' },
  { nex: 99, name: 'Agente de Elite', itemLimit: 'Categoria IV' },
];

export function getPatentByNex(nex: number): string {
  if (nex >= 99) return 'Agente de Elite';
  if (nex >= 75) return 'Oficial de Operações';
  if (nex >= 50) return 'Agente Especial';
  if (nex >= 20) return 'Operador';
  return 'Recruta';
}

export function calculateDerivedStats(
  characterClass: string,
  vigor: number,
  presence: number,
  nex: number
): { hp: number; pe: number; san: number } {
  const classData = CLASSES.find(c => c.id === characterClass);
  if (!classData) {
    return { hp: 0, pe: 0, san: 0 };
  }

  const nexMultiplier = Math.floor(nex / 5);
  
  const hp = (classData.pvPerNex + vigor) * nexMultiplier;
  const pe = (classData.pePerNex + presence) * nexMultiplier;
  const san = classData.sanPerNex * nexMultiplier;

  return { hp, pe, san };
}

export function getAttributeBonus(value: number): number {
  return value;
}
