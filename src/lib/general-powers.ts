/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Poderes Gerais (disponíveis para qualquer classe)
 * 
 * Poderes Gerais são habilidades que qualquer personagem pode adquirir,
 * independentemente de sua classe. Contam como escolhas de habilidade.
 */

export interface GeneralPower {
  id: string;
  name: string;
  description: string;
  minNex: number;
  requirement?: string; // Requisito para adquirir (outra habilidade, atributo, etc)
  category: 'combate' | 'pericia' | 'paranormal' | 'social' | 'sobrevivencia';
}

// ==================== PODERES GERAIS ====================

export const GENERAL_POWERS: GeneralPower[] = [
  // === COMBATE ===
  {
    id: 'acrobatico',
    name: 'Acrobático',
    description: 'Você pode usar Agilidade em vez de Força para ataques corpo a corpo com armas leves.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'ambidestria',
    name: 'Ambidestria',
    description: 'Você pode empunhar duas armas leves e fazer um ataque adicional por turno com a arma secundária (com penalidade de -4 em ambos os ataques).',
    minNex: 10,
    category: 'combate',
  },
  {
    id: 'ataque-poderoso',
    name: 'Ataque Poderoso',
    description: 'Você pode sofrer -2 em um ataque para causar +5 de dano.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    description: 'Você pode sofrer -2 em ataques para receber +2 em Defesa até o próximo turno.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'disparo-preciso',
    name: 'Disparo Preciso',
    description: 'Você não sofre penalidade por disparar contra alvos em combate corpo a corpo.',
    minNex: 10,
    category: 'combate',
  },
  {
    id: 'esquiva',
    name: 'Esquiva',
    description: 'Você recebe +2 em Defesa (não cumulativo com armaduras médias ou pesadas).',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'fanático',
    name: 'Fanático',
    description: 'Você recebe +2 em ataques e dano quando está com menos da metade do PV.',
    minNex: 15,
    category: 'combate',
  },
  {
    id: 'foco-arma',
    name: 'Foco em Arma',
    description: 'Escolha um tipo de arma. Você recebe +2 em ataques com armas desse tipo.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'iniciativa-melhorada',
    name: 'Iniciativa Melhorada',
    description: 'Você recebe +5 em Iniciativa.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'proficiencia-armadura',
    name: 'Proficiência em Armaduras',
    description: 'Você recebe proficiência em um tipo de armadura que não possui.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'proficiencia-arma',
    name: 'Proficiência em Arma',
    description: 'Você recebe proficiência em um tipo de arma que não possui.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'reflexos-rapidos',
    name: 'Reflexos Rápidos',
    description: 'Você pode fazer uma ação de movimento adicional no primeiro turno de cada combate.',
    minNex: 10,
    category: 'combate',
  },
  {
    id: 'saque-rapido',
    name: 'Saque Rápido',
    description: 'Você pode sacar ou guardar itens como ação livre.',
    minNex: 5,
    category: 'combate',
  },
  {
    id: 'tiro-duplo',
    name: 'Tiro Duplo',
    description: 'Você pode fazer dois ataques à distância por turno, com penalidade de -2 em cada.',
    minNex: 15,
    category: 'combate',
  },
  {
    id: 'vitalidade',
    name: 'Vitalidade',
    description: 'Você recebe +1 PV por nível (retroativo).',
    minNex: 5,
    category: 'combate',
  },

  // === PERÍCIA ===
  {
    id: 'competencia',
    name: 'Competência',
    description: 'Você recebe treinamento em uma perícia à sua escolha.',
    minNex: 5,
    category: 'pericia',
  },
  {
    id: 'especializacao',
    name: 'Especialização',
    description: 'Escolha uma perícia treinada. Você recebe +5 nessa perícia.',
    minNex: 10,
    requirement: 'Treinado na perícia',
    category: 'pericia',
  },
  {
    id: 'furtivo',
    name: 'Furtivo',
    description: 'Você recebe +2 em Furtividade e pode se esconder mesmo sendo observado (com penalidade de -10).',
    minNex: 10,
    category: 'pericia',
  },
  {
    id: 'investigador-nato',
    name: 'Investigador Nato',
    description: 'Você recebe +2 em Investigação e Percepção. Pode rolar novamente testes falhados dessas perícias uma vez por cena.',
    minNex: 10,
    category: 'pericia',
  },
  {
    id: 'linguista',
    name: 'Linguista',
    description: 'Você fala, lê e escreve três idiomas adicionais.',
    minNex: 5,
    category: 'pericia',
  },
  {
    id: 'medicina-avancada',
    name: 'Medicina Avançada',
    description: 'Quando usa Medicina para primeiros socorros, o alvo recupera +1d6 PV.',
    minNex: 10,
    requirement: 'Treinado em Medicina',
    category: 'pericia',
  },
  {
    id: 'negociador',
    name: 'Negociador',
    description: 'Você recebe +2 em Diplomacia e Enganação. Pode rolar novamente testes falhados dessas perícias uma vez por cena.',
    minNex: 10,
    category: 'pericia',
  },

  // === PARANORMAL ===
  {
    id: 'afinidade-elemento',
    name: 'Afinidade com Elemento',
    description: 'Escolha um elemento (Sangue, Morte, Conhecimento, Energia ou Medo). Você recebe +2 em rituais desse elemento.',
    minNex: 5,
    category: 'paranormal',
  },
  {
    id: 'conhecimento-proibido',
    name: 'Conhecimento Proibido',
    description: 'Você estudou textos proibidos. Recebe +5 em Ocultismo, mas -5 em SAN máxima.',
    minNex: 10,
    category: 'paranormal',
  },
  {
    id: 'foco-ritual',
    name: 'Foco em Ritual',
    description: 'Escolha um ritual que conhece. O custo em PE desse ritual é reduzido em 1 (mínimo 1).',
    minNex: 10,
    requirement: 'Conhecer pelo menos um ritual',
    category: 'paranormal',
  },
  {
    id: 'resistir-paranormal',
    name: 'Resistir ao Paranormal',
    description: 'Você recebe +5 em testes de resistência contra rituais e efeitos paranormais.',
    minNex: 10,
    category: 'paranormal',
  },
  {
    id: 'ritual-aprendido',
    name: 'Ritual Aprendido',
    description: 'Você aprende um ritual de 1º círculo (mesmo não sendo Ocultista). Pode lançá-lo gastando o dobro do PE.',
    minNex: 15,
    category: 'paranormal',
  },
  {
    id: 'sangue-resistente',
    name: 'Sangue Resistente',
    description: 'Você recebe resistência a dano paranormal 5.',
    minNex: 15,
    category: 'paranormal',
  },
  {
    id: 'sentir-paranormal',
    name: 'Sentir o Paranormal',
    description: 'Você pode sentir presenças paranormais em alcance curto. Sabe a direção, mas não a distância exata.',
    minNex: 5,
    category: 'paranormal',
  },

  // === SOCIAL ===
  {
    id: 'carismatico',
    name: 'Carismático',
    description: 'Você recebe +2 em todas as perícias baseadas em Presença.',
    minNex: 5,
    category: 'social',
  },
  {
    id: 'conexoes',
    name: 'Conexões',
    description: 'Você conhece pessoas em todos os lugares. Uma vez por missão, pode encontrar um contato útil.',
    minNex: 10,
    category: 'social',
  },
  {
    id: 'intimidador',
    name: 'Intimidador',
    description: 'Você recebe +5 em Intimidação e pode usar Força em vez de Presença para essa perícia.',
    minNex: 10,
    category: 'social',
  },
  {
    id: 'lideranca',
    name: 'Liderança',
    description: 'Aliados em alcance curto recebem +1 em ataques e testes de resistência.',
    minNex: 15,
    category: 'social',
  },
  {
    id: 'mentiroso-habil',
    name: 'Mentiroso Hábil',
    description: 'Você recebe +5 em Enganação e adversários têm -5 para perceber suas mentiras.',
    minNex: 10,
    category: 'social',
  },
  {
    id: 'presenca-ameacadora',
    name: 'Presença Ameaçadora',
    description: 'Inimigos sofrem -2 em ataques contra você no primeiro turno de combate.',
    minNex: 10,
    category: 'social',
  },

  // === SOBREVIVÊNCIA ===
  {
    id: 'constituicao-forte',
    name: 'Constituição Forte',
    description: 'Você recebe +2 em Fortitude e resistência a veneno e doença 5.',
    minNex: 5,
    category: 'sobrevivencia',
  },
  {
    id: 'dureza-natural',
    name: 'Dureza Natural',
    description: 'Você recebe resistência a dano 2 (não paranormal).',
    minNex: 10,
    category: 'sobrevivencia',
  },
  {
    id: 'recuperacao-rapida',
    name: 'Recuperação Rápida',
    description: 'Você recupera o dobro de PV e PE durante descansos.',
    minNex: 10,
    category: 'sobrevivencia',
  },
  {
    id: 'resistencia-mental',
    name: 'Resistência Mental',
    description: 'Você recebe +2 em Vontade e resistência a dano mental 5.',
    minNex: 10,
    category: 'sobrevivencia',
  },
  {
    id: 'segundo-vento',
    name: 'Segundo Vento',
    description: 'Uma vez por cena, você pode gastar uma ação de movimento para recuperar 1d8 PV.',
    minNex: 10,
    category: 'sobrevivencia',
  },
  {
    id: 'sobrevivente-nato',
    name: 'Sobrevivente Nato',
    description: 'Você recebe +2 em Sobrevivência e pode encontrar comida e água em qualquer ambiente.',
    minNex: 5,
    category: 'sobrevivencia',
  },
  {
    id: 'tolerancia-dor',
    name: 'Tolerância à Dor',
    description: 'Você ignora os efeitos das condições Fatigado e Debilitado por um número de rodadas igual ao seu Vigor.',
    minNex: 15,
    category: 'sobrevivencia',
  },
  {
    id: 'vontade-ferro',
    name: 'Vontade de Ferro',
    description: 'Você é imune a efeitos de medo.',
    minNex: 20,
    category: 'sobrevivencia',
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna poderes gerais disponíveis para um NEX específico
 */
export function getAvailableGeneralPowers(nex: number): GeneralPower[] {
  return GENERAL_POWERS.filter(power => power.minNex <= nex);
}

/**
 * Retorna poderes gerais por categoria
 */
export function getGeneralPowersByCategory(category: GeneralPower['category']): GeneralPower[] {
  return GENERAL_POWERS.filter(power => power.category === category);
}

/**
 * Retorna um poder geral pelo ID
 */
export function getGeneralPowerById(id: string): GeneralPower | undefined {
  return GENERAL_POWERS.find(power => power.id === id);
}

/**
 * Retorna as categorias de poderes gerais
 */
export function getGeneralPowerCategories(): GeneralPower['category'][] {
  return ['combate', 'pericia', 'paranormal', 'social', 'sobrevivencia'];
}

/**
 * Retorna o nome traduzido da categoria
 */
export function getCategoryName(category: GeneralPower['category']): string {
  const names: Record<GeneralPower['category'], string> = {
    combate: 'Combate',
    pericia: 'Perícia',
    paranormal: 'Paranormal',
    social: 'Social',
    sobrevivencia: 'Sobrevivência',
  };
  return names[category];
}
