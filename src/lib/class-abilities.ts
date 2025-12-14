// Ordem Paranormal RPG v1.3 - Class Abilities by NEX
// Sistema de habilidades de classe que escalam com o nível de experiência

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
  isCore?: boolean; // Habilidade fundamental da classe, não escolhida
}

// Habilidades do Combatente
export const COMBATENTE_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { id: 'ataque-especial', name: 'Ataque Especial', description: 'Ao acertar um ataque corpo a corpo, você pode gastar 1 PE para causar +1d6 de dano. A cada 5 NEX você pode gastar +1 PE para +1d6 de dano (máximo de PE igual ao seu NEX/5).', minNex: 5, classId: 'Combatente', isCore: true },
  
  // NEX 10%
  { id: 'incansavel', name: 'Incansável', description: 'Uma vez por cena, você pode ignorar os efeitos de uma condição de fadiga ou exaustão por uma rodada.', minNex: 10, classId: 'Combatente' },
  { id: 'proteger-aliado', name: 'Proteger Aliado', description: 'Quando um aliado adjacente sofrer um ataque, você pode usar sua reação para se tornar o alvo do ataque.', minNex: 10, classId: 'Combatente' },
  { id: 'golpe-brutal', name: 'Golpe Brutal', description: 'Quando você acerta um ataque crítico, causa +2d6 de dano adicional.', minNex: 10, classId: 'Combatente' },
  
  // NEX 20%
  { id: 'ataque-extra', name: 'Ataque Extra', description: 'Você pode fazer um ataque adicional quando usa a ação atacar.', minNex: 20, classId: 'Combatente', isCore: true },
  { id: 'duracao-combate', name: 'Duração de Combate', description: 'Você recebe +10 PV permanentes.', minNex: 20, classId: 'Combatente' },
  { id: 'especialista-armas', name: 'Especialista em Armas', description: 'Escolha um tipo de arma. Você recebe +2 em ataques e +1 em dano com esse tipo de arma.', minNex: 20, classId: 'Combatente' },
  
  // NEX 35%
  { id: 'veterano-guerra', name: 'Veterano de Guerra', description: 'Você recebe +2 em todos os testes de resistência.', minNex: 35, classId: 'Combatente' },
  { id: 'furia-combate', name: 'Fúria de Combate', description: 'Quando sua vida cai abaixo da metade, você recebe +2 em ataques e +4 em dano.', minNex: 35, classId: 'Combatente' },
  { id: 'reflexos-combate', name: 'Reflexos de Combate', description: 'Você pode usar sua reação para fazer um ataque de oportunidade contra qualquer inimigo que se mover em sua área de ameaça.', minNex: 35, classId: 'Combatente' },
  
  // NEX 50%
  { id: 'segundo-ataque-extra', name: 'Segundo Ataque Extra', description: 'Você pode fazer dois ataques adicionais quando usa a ação atacar.', minNex: 50, classId: 'Combatente', isCore: true },
  { id: 'mestre-armas', name: 'Mestre das Armas', description: 'Você ignora 5 pontos de resistência a dano do alvo.', minNex: 50, classId: 'Combatente' },
  
  // NEX 75%
  { id: 'terceiro-ataque-extra', name: 'Terceiro Ataque Extra', description: 'Você pode fazer três ataques adicionais quando usa a ação atacar.', minNex: 75, classId: 'Combatente', isCore: true },
  { id: 'lenda-combate', name: 'Lenda do Combate', description: 'Você recebe +5 em iniciativa e não pode ser surpreendido.', minNex: 75, classId: 'Combatente' },
  
  // NEX 99%
  { id: 'avatar-guerra', name: 'Avatar da Guerra', description: 'Uma vez por dia, você pode entrar em um estado de combate perfeito. Por 1 minuto, todos os seus ataques são críticos automáticos.', minNex: 99, classId: 'Combatente', isCore: true },
];

// Habilidades do Especialista
export const ESPECIALISTA_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { id: 'ecletico', name: 'Eclético', description: 'Você pode fazer qualquer teste de perícia como se fosse treinado (sem bônus, mas sem penalidade de destreinado).', minNex: 5, classId: 'Especialista', isCore: true },
  
  // NEX 10%
  { id: 'especialidade', name: 'Especialidade', description: 'Escolha uma perícia treinada. Você recebe +5 em testes dessa perícia.', minNex: 10, classId: 'Especialista' },
  { id: 'talento-natural', name: 'Talento Natural', description: 'Você recebe +2 PE permanentes.', minNex: 10, classId: 'Especialista' },
  { id: 'adaptavel', name: 'Adaptável', description: 'Uma vez por cena, você pode rolar novamente um teste de perícia.', minNex: 10, classId: 'Especialista' },
  
  // NEX 20%
  { id: 'pericia-bonus', name: 'Perícia Bônus', description: 'Você ganha treinamento em duas perícias adicionais à sua escolha.', minNex: 20, classId: 'Especialista', isCore: true },
  { id: 'intuicao-apurada', name: 'Intuição Apurada', description: 'Você pode gastar 2 PE para receber +5 em um teste de Intuição, Investigação ou Percepção.', minNex: 20, classId: 'Especialista' },
  { id: 'conhecimento-amplo', name: 'Conhecimento Amplo', description: 'Você recebe +2 em todos os testes de perícias baseadas em Intelecto.', minNex: 20, classId: 'Especialista' },
  
  // NEX 35%
  { id: 'virtuose', name: 'Virtuose', description: 'Escolha duas perícias treinadas. Você recebe +5 adicional em testes dessas perícias.', minNex: 35, classId: 'Especialista' },
  { id: 'mente-afiada', name: 'Mente Afiada', description: 'Você não pode ser surpreendido e recebe +5 em iniciativa.', minNex: 35, classId: 'Especialista' },
  { id: 'improvisador', name: 'Improvisador', description: 'Você pode usar qualquer objeto como ferramenta improvisada sem penalidade.', minNex: 35, classId: 'Especialista' },
  
  // NEX 50%
  { id: 'segunda-pericia-bonus', name: 'Segunda Perícia Bônus', description: 'Você ganha treinamento em mais duas perícias adicionais.', minNex: 50, classId: 'Especialista', isCore: true },
  { id: 'mestre-oficios', name: 'Mestre dos Ofícios', description: 'Você recebe +10 em uma perícia de sua escolha.', minNex: 50, classId: 'Especialista' },
  
  // NEX 75%
  { id: 'terceira-pericia-bonus', name: 'Terceira Perícia Bônus', description: 'Você ganha treinamento em mais duas perícias adicionais.', minNex: 75, classId: 'Especialista', isCore: true },
  { id: 'genio', name: 'Gênio', description: 'Você pode gastar 5 PE para ter sucesso automático em um teste de perícia.', minNex: 75, classId: 'Especialista' },
  
  // NEX 99%
  { id: 'lenda-viva', name: 'Lenda Viva', description: 'Você é considerado treinado em todas as perícias com +10 de bônus.', minNex: 99, classId: 'Especialista', isCore: true },
];

// Habilidades do Ocultista
export const OCULTISTA_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { id: 'afinidade-paranormal', name: 'Afinidade Paranormal', description: 'Você pode lançar rituais e possui afinidade com o Outro Lado.', minNex: 5, classId: 'Ocultista', isCore: true },
  
  // NEX 10%
  { id: 'ritual-bonus', name: 'Ritual Bônus', description: 'Você aprende um ritual adicional de 1º círculo.', minNex: 10, classId: 'Ocultista' },
  { id: 'resistencia-paranormal', name: 'Resistência Paranormal', description: 'Você recebe +5 em testes de resistência contra efeitos do Outro Lado.', minNex: 10, classId: 'Ocultista' },
  { id: 'sangue-ritual', name: 'Sangue Ritual', description: 'Você pode usar PV no lugar de PE para lançar rituais (1:1).', minNex: 10, classId: 'Ocultista' },
  
  // NEX 20%
  { id: 'segundo-circulo', name: 'Segundo Círculo', description: 'Você pode lançar rituais de 2º círculo.', minNex: 20, classId: 'Ocultista', isCore: true },
  { id: 'canalizar-energia', name: 'Canalizar Energia', description: 'Você pode gastar 2 PE para recuperar 2d6 PV ou causar 2d6 de dano paranormal em um alvo adjacente.', minNex: 20, classId: 'Ocultista' },
  { id: 'mente-blindada', name: 'Mente Blindada', description: 'Você recebe resistência a dano mental 5.', minNex: 20, classId: 'Ocultista' },
  
  // NEX 35%
  { id: 'terceiro-circulo', name: 'Terceiro Círculo', description: 'Você pode lançar rituais de 3º círculo.', minNex: 35, classId: 'Ocultista', isCore: true },
  { id: 'ritual-acelerado', name: 'Ritual Acelerado', description: 'Uma vez por cena, você pode lançar um ritual como ação livre.', minNex: 35, classId: 'Ocultista' },
  { id: 'reserva-arcana', name: 'Reserva Arcana', description: 'Você recebe +10 PE permanentes.', minNex: 35, classId: 'Ocultista' },
  
  // NEX 50%
  { id: 'quarto-circulo', name: 'Quarto Círculo', description: 'Você pode lançar rituais de 4º círculo.', minNex: 50, classId: 'Ocultista', isCore: true },
  { id: 'mestre-rituais', name: 'Mestre dos Rituais', description: 'O custo de PE dos seus rituais é reduzido em 2 (mínimo 1).', minNex: 50, classId: 'Ocultista' },
  
  // NEX 75%
  { id: 'quinto-circulo', name: 'Quinto Círculo', description: 'Você pode lançar rituais de 5º círculo.', minNex: 75, classId: 'Ocultista', isCore: true },
  { id: 'transcendencia', name: 'Transcendência', description: 'Você pode gastar 10 PE para ficar imune a dano por uma rodada.', minNex: 75, classId: 'Ocultista' },
  
  // NEX 99%
  { id: 'avatar-outro-lado', name: 'Avatar do Outro Lado', description: 'Você se torna parcialmente uma criatura do Outro Lado. Recebe imunidade a efeitos de medo e +10 em todos os testes de rituais.', minNex: 99, classId: 'Ocultista', isCore: true },
];

// Todas as habilidades agrupadas
export const ALL_CLASS_ABILITIES: ClassAbility[] = [
  ...COMBATENTE_ABILITIES,
  ...ESPECIALISTA_ABILITIES,
  ...OCULTISTA_ABILITIES,
];

/**
 * Retorna as habilidades disponíveis para uma classe e NEX específico
 */
export function getAvailableAbilities(classId: string, nex: number): ClassAbility[] {
  return ALL_CLASS_ABILITIES.filter(
    ability => ability.classId === classId && ability.minNex <= nex
  );
}

/**
 * Retorna as habilidades core (automáticas) para uma classe e NEX
 */
export function getCoreAbilities(classId: string, nex: number): ClassAbility[] {
  return getAvailableAbilities(classId, nex).filter(ability => ability.isCore);
}

/**
 * Retorna as habilidades escolhíveis para uma classe e NEX
 */
export function getChoosableAbilities(classId: string, nex: number): ClassAbility[] {
  return getAvailableAbilities(classId, nex).filter(ability => !ability.isCore);
}

/**
 * Calcula quantas habilidades o personagem pode escolher baseado no NEX
 * Regra: 1 escolha a cada 10% de NEX (arredondado para baixo)
 */
export function getAbilityChoiceCount(nex: number): number {
  return Math.floor(nex / 10);
}

/**
 * Retorna habilidades organizadas por tier de NEX
 */
export function getAbilitiesByTier(classId: string): Record<number, ClassAbility[]> {
  const tiers: Record<number, ClassAbility[]> = {};
  const abilities = ALL_CLASS_ABILITIES.filter(a => a.classId === classId);
  
  for (const ability of abilities) {
    if (!tiers[ability.minNex]) {
      tiers[ability.minNex] = [];
    }
    tiers[ability.minNex].push(ability);
  }
  
  return tiers;
}
