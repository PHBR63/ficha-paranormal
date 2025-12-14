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

// ==================== HABILIDADES DO COMBATENTE ====================

export const COMBATENTE_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { 
    id: 'ataque-especial', 
    name: 'Ataque Especial', 
    description: 'Ao acertar um ataque, você pode gastar 2 PE para causar +1d8 de dano. Para cada +2 PE extras gastos, causa +1d8 de dano adicional (limitado pelo seu NEX/5).', 
    minNex: 5, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 10%
  { id: 'incansavel', name: 'Incansável', description: 'Uma vez por cena, você pode ignorar os efeitos de uma condição de fadiga ou exaustão por uma rodada.', minNex: 10, classId: 'Combatente' },
  { id: 'golpe-brutal', name: 'Golpe Brutal', description: 'Quando você acerta um ataque crítico, causa +1d12 de dano adicional.', minNex: 10, classId: 'Combatente' },
  { id: 'proteger-aliado', name: 'Proteger Aliado', description: 'Quando um aliado adjacente sofrer um ataque, você pode usar sua reação para se tornar o alvo do ataque.', minNex: 10, classId: 'Combatente' },
  { id: 'reflexos-combate', name: 'Reflexos de Combate', description: 'Você não fica desprevenido contra ataques corpo a corpo e pode fazer ataques de oportunidade mesmo quando desprevenido.', minNex: 10, classId: 'Combatente' },
  
  // NEX 15%
  { id: 'saque-rapido', name: 'Saque Rápido', description: 'Você pode sacar ou guardar itens como ação livre e recebe +2 em Iniciativa.', minNex: 15, classId: 'Combatente' },
  { id: 'tolerancia-dor', name: 'Tolerância à Dor', description: 'Você recebe resistência a dano 2 (todos os tipos, exceto mental).', minNex: 15, classId: 'Combatente' },
  
  // NEX 20%
  { id: 'ataque-extra', name: 'Ataque Extra', description: 'Você pode fazer um ataque adicional quando usa a ação atacar.', minNex: 20, classId: 'Combatente', isCore: true },
  { id: 'especialista-armas', name: 'Especialista em Armas', description: 'Escolha um tipo de arma (espadas, armas de fogo, etc.). Você recebe +2 em ataques e +1 no multiplicador de crítico com esse tipo.', minNex: 20, classId: 'Combatente' },
  { id: 'dureza', name: 'Dureza', description: 'Seu limite de PV aumenta em +10.', minNex: 20, classId: 'Combatente' },
  
  // NEX 25%
  { id: 'furia-combate', name: 'Fúria de Combate', description: 'Quando sua vida cai abaixo da metade, você recebe +2 em ataques e +4 em dano até o fim do combate.', minNex: 25, classId: 'Combatente' },
  { id: 'veterano-guerra', name: 'Veterano de Guerra', description: 'Você recebe +2 em todos os testes de resistência (Fortitude, Reflexos e Vontade).', minNex: 25, classId: 'Combatente' },
  
  // NEX 30%
  { id: 'precisao-mortal', name: 'Precisão Mortal', description: 'Sua margem de ameaça com armas aumenta em +2.', minNex: 30, classId: 'Combatente' },
  { id: 'investida-implacavel', name: 'Investida Implacável', description: 'Quando faz uma investida, você não sofre penalidade em Defesa e causa +2d8 de dano.', minNex: 30, classId: 'Combatente' },
  
  // NEX 35%
  { id: 'mestre-criticos', name: 'Mestre de Críticos', description: 'Quando confirma um crítico, você pode gastar 2 PE para maximizar o dano do crítico.', minNex: 35, classId: 'Combatente' },
  { id: 'resistencia-superior', name: 'Resistência Superior', description: 'Sua resistência a dano aumenta para 5 (todos os tipos, exceto mental).', minNex: 35, classId: 'Combatente' },
  
  // NEX 40%
  { id: 'golpe-devastador', name: 'Golpe Devastador', description: 'Uma vez por turno, quando acerta um ataque, pode gastar 5 PE para causar +3d12 de dano.', minNex: 40, classId: 'Combatente' },
  
  // NEX 45%
  { id: 'indomavel', name: 'Indomável', description: 'Você é imune a efeitos de medo e recebe +5 em testes de Vontade.', minNex: 45, classId: 'Combatente' },
  
  // NEX 50%
  { id: 'segundo-ataque-extra', name: 'Segundo Ataque Extra', description: 'Você pode fazer dois ataques adicionais quando usa a ação atacar (três ataques no total).', minNex: 50, classId: 'Combatente', isCore: true },
  { id: 'mestre-armas', name: 'Mestre das Armas', description: 'Seus ataques ignoram 5 pontos de resistência a dano do alvo.', minNex: 50, classId: 'Combatente' },
  
  // NEX 55%+
  { id: 'ultimo-suspiro', name: 'Último Suspiro', description: 'Uma vez por dia, quando seria reduzido a 0 PV, você fica com 1 PV em vez disso.', minNex: 55, classId: 'Combatente' },
  { id: 'ira-implacavel', name: 'Ira Implacável', description: 'Quando ativa Fúria de Combate, os bônus aumentam para +4 em ataques e +8 em dano.', minNex: 60, classId: 'Combatente' },
  { id: 'destruidor', name: 'Destruidor', description: 'Seus ataques ignoram resistência a dano completamente.', minNex: 65, classId: 'Combatente' },
  
  // NEX 75%
  { id: 'terceiro-ataque-extra', name: 'Terceiro Ataque Extra', description: 'Você pode fazer três ataques adicionais quando usa a ação atacar (quatro ataques no total).', minNex: 75, classId: 'Combatente', isCore: true },
  { id: 'lenda-combate', name: 'Lenda do Combate', description: 'Você não pode ser surpreendido, recebe +10 em iniciativa e seus ataques causam +2d8 de dano permanente.', minNex: 75, classId: 'Combatente' },
  
  // NEX 99%
  { id: 'avatar-guerra', name: 'Avatar da Guerra', description: 'Uma vez por dia, você pode entrar em um estado de combate perfeito por 1 minuto. Durante esse tempo, todos os seus ataques são críticos automáticos e você é imune a dano.', minNex: 99, classId: 'Combatente', isCore: true },
];

// ==================== HABILIDADES DO ESPECIALISTA ====================

export const ESPECIALISTA_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { 
    id: 'ecletico', 
    name: 'Eclético', 
    description: 'Você pode fazer qualquer teste de perícia, mesmo que não seja treinado. Se for treinado, recebe +2 no teste.', 
    minNex: 5, 
    classId: 'Especialista', 
    isCore: true 
  },
  { 
    id: 'pericia', 
    name: 'Perícia', 
    description: 'Você recebe treinamento em uma perícia à sua escolha (não precisa ser da sua classe).', 
    minNex: 5, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 10%
  { id: 'especialidade', name: 'Especialidade', description: 'Escolha uma perícia treinada. Você recebe +5 em testes dessa perícia.', minNex: 10, classId: 'Especialista' },
  { id: 'talento-natural', name: 'Talento Natural', description: 'Você recebe +2 PE máximos permanentes.', minNex: 10, classId: 'Especialista' },
  { id: 'adaptavel', name: 'Adaptável', description: 'Uma vez por cena, você pode rolar novamente um teste de perícia.', minNex: 10, classId: 'Especialista' },
  { id: 'proficiencia-arma', name: 'Proficiência em Arma', description: 'Você recebe proficiência em uma arma à sua escolha.', minNex: 10, classId: 'Especialista' },
  
  // NEX 15%
  { id: 'ataque-furtivo', name: 'Ataque Furtivo', description: 'Quando ataca um alvo desprevenido ou flanqueado, você causa +1d6 de dano.', minNex: 15, classId: 'Especialista' },
  { id: 'pesquisador', name: 'Pesquisador', description: 'Você recebe +5 em Investigação e Ciências.', minNex: 15, classId: 'Especialista' },
  
  // NEX 20%
  { id: 'pericia-bonus', name: 'Perícia Bônus', description: 'Você ganha treinamento em duas perícias adicionais à sua escolha.', minNex: 20, classId: 'Especialista', isCore: true },
  { id: 'intuicao-apurada', name: 'Intuição Apurada', description: 'Você pode gastar 2 PE para receber +5 em um teste de Intuição, Investigação ou Percepção.', minNex: 20, classId: 'Especialista' },
  { id: 'conhecimento-amplo', name: 'Conhecimento Amplo', description: 'Você recebe +2 em todos os testes de perícias baseadas em Intelecto.', minNex: 20, classId: 'Especialista' },
  
  // NEX 25%
  { id: 'mente-afiada', name: 'Mente Afiada', description: 'Você recebe +5 em iniciativa e não pode ser surpreendido.', minNex: 25, classId: 'Especialista' },
  { id: 'oportunismo', name: 'Oportunismo', description: 'O dano extra do seu Ataque Furtivo aumenta para +2d6.', minNex: 25, classId: 'Especialista' },
  
  // NEX 30%
  { id: 'improvisador', name: 'Improvisador', description: 'Você pode usar qualquer objeto como ferramenta improvisada sem penalidade.', minNex: 30, classId: 'Especialista' },
  { id: 'evasao', name: 'Evasão', description: 'Quando passa em um teste de Reflexos para meio dano, não sofre dano nenhum.', minNex: 30, classId: 'Especialista' },
  
  // NEX 35%
  { id: 'virtuose', name: 'Virtuose', description: 'Escolha duas perícias treinadas. Você recebe +5 adicional em testes dessas perícias.', minNex: 35, classId: 'Especialista' },
  { id: 'ataque-preciso', name: 'Ataque Preciso', description: 'O dano extra do seu Ataque Furtivo aumenta para +3d6.', minNex: 35, classId: 'Especialista' },
  
  // NEX 40%
  { id: 'sexto-sentido', name: 'Sexto Sentido', description: 'Você sente presenças hostis em alcance curto e nunca é pego desprevenido.', minNex: 40, classId: 'Especialista' },
  
  // NEX 45%
  { id: 'talento-sublime', name: 'Talento Sublime', description: 'Quando faz um teste de perícia, se obtiver 10 ou menos no d20, considera como 11.', minNex: 45, classId: 'Especialista' },
  
  // NEX 50%
  { id: 'segunda-pericia-bonus', name: 'Segunda Perícia Bônus', description: 'Você ganha treinamento em mais duas perícias adicionais.', minNex: 50, classId: 'Especialista', isCore: true },
  { id: 'mestre-oficios', name: 'Mestre dos Ofícios', description: 'Você recebe +10 em uma perícia de sua escolha.', minNex: 50, classId: 'Especialista' },
  { id: 'ataque-letal', name: 'Ataque Letal', description: 'O dano extra do seu Ataque Furtivo aumenta para +5d6.', minNex: 50, classId: 'Especialista' },
  
  // NEX 55%+
  { id: 'habilidoso-demais', name: 'Habilidoso Demais', description: 'Você recebe +2 em todos os testes de perícia.', minNex: 55, classId: 'Especialista' },
  { id: 'acao-ardilosa', name: 'Ação Ardilosa', description: 'Você pode fazer uma ação de movimento adicional por turno.', minNex: 60, classId: 'Especialista' },
  { id: 'golpe-certeiro', name: 'Golpe Certeiro', description: 'O dano extra do seu Ataque Furtivo aumenta para +7d6.', minNex: 65, classId: 'Especialista' },
  
  // NEX 75%
  { id: 'terceira-pericia-bonus', name: 'Terceira Perícia Bônus', description: 'Você ganha treinamento em mais duas perícias adicionais.', minNex: 75, classId: 'Especialista', isCore: true },
  { id: 'genio', name: 'Gênio', description: 'Você pode gastar 5 PE para ter sucesso automático em um teste de perícia (exceto resistência).', minNex: 75, classId: 'Especialista' },
  
  // NEX 99%
  { id: 'lenda-viva', name: 'Lenda Viva', description: 'Você é considerado treinado em todas as perícias com +10 de bônus. Sua margem de crítico em perícias é sempre 19-20.', minNex: 99, classId: 'Especialista', isCore: true },
];

// ==================== HABILIDADES DO OCULTISTA ====================

export const OCULTISTA_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { 
    id: 'afinidade-paranormal', 
    name: 'Afinidade Paranormal', 
    description: 'Você pode lançar rituais de 1º círculo. Escolha um elemento: você recebe +2 em rituais desse elemento e -2 em rituais do elemento oposto.', 
    minNex: 5, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 10%
  { id: 'ritual-bonus', name: 'Ritual Bônus', description: 'Você aprende um ritual adicional de qualquer círculo que possa lançar.', minNex: 10, classId: 'Ocultista' },
  { id: 'resistencia-paranormal', name: 'Resistência Paranormal', description: 'Você recebe +5 em testes de resistência contra efeitos do Outro Lado e rituais.', minNex: 10, classId: 'Ocultista' },
  { id: 'sangue-ritual', name: 'Sangue Ritual', description: 'Você pode usar PV no lugar de PE para lançar rituais (1 para 1). PV gastos assim não podem ser curados por 1 dia.', minNex: 10, classId: 'Ocultista' },
  { id: 'conjuracao-precisa', name: 'Conjuração Precisa', description: 'Você pode excluir um número de alvos igual ao seu Intelecto de seus rituais de área.', minNex: 10, classId: 'Ocultista' },
  
  // NEX 15%
  { id: 'foco-paranormal', name: 'Foco Paranormal', description: 'Você recebe +2 em testes de rituais.', minNex: 15, classId: 'Ocultista' },
  { id: 'mente-blindada', name: 'Mente Blindada', description: 'Você recebe resistência a dano mental 5 e +2 em Vontade.', minNex: 15, classId: 'Ocultista' },
  
  // NEX 20%
  { id: 'segundo-circulo', name: 'Segundo Círculo', description: 'Você pode lançar rituais de 2º círculo.', minNex: 20, classId: 'Ocultista', isCore: true },
  { id: 'canalizar-energia', name: 'Canalizar Energia', description: 'Você pode gastar 2 PE para recuperar 2d8 PV ou causar 2d8 de dano paranormal em um alvo adjacente.', minNex: 20, classId: 'Ocultista' },
  { id: 'poder-expandido', name: 'Poder Expandido', description: 'O custo em PE para aprimoramentos de rituais é reduzido em 1 (mínimo 1).', minNex: 20, classId: 'Ocultista' },
  
  // NEX 25%
  { id: 'fluxo-poder', name: 'Fluxo de Poder', description: 'Uma vez por cena, você pode lançar um ritual como ação livre.', minNex: 25, classId: 'Ocultista' },
  { id: 'ritual-acelerado', name: 'Ritual Acelerado', description: 'Você pode gastar +2 PE para lançar um ritual de execução padrão como ação de movimento.', minNex: 25, classId: 'Ocultista' },
  
  // NEX 30%
  { id: 'resistencia-superior-ocultista', name: 'Resistência Superior', description: 'Sua resistência a dano mental aumenta para 10.', minNex: 30, classId: 'Ocultista' },
  { id: 'canalizar-maior', name: 'Canalizar Maior', description: 'O dano/cura do seu Canalizar Energia aumenta para 4d8.', minNex: 30, classId: 'Ocultista' },
  
  // NEX 35%
  { id: 'terceiro-circulo', name: 'Terceiro Círculo', description: 'Você pode lançar rituais de 3º círculo.', minNex: 35, classId: 'Ocultista', isCore: true },
  { id: 'reserva-arcana', name: 'Reserva Arcana', description: 'Você recebe +10 PE máximos permanentes.', minNex: 35, classId: 'Ocultista' },
  { id: 'formula-memorizada', name: 'Fórmula Memorizada', description: 'Escolha um ritual de 1º ou 2º círculo. Você pode lançá-lo gastando metade do PE.', minNex: 35, classId: 'Ocultista' },
  
  // NEX 40%
  { id: 'mestre-elementos', name: 'Mestre dos Elementos', description: 'Você não sofre mais penalidade em rituais do elemento oposto ao seu.', minNex: 40, classId: 'Ocultista' },
  
  // NEX 45%
  { id: 'transcender-limites', name: 'Transcender Limites', description: 'Uma vez por dia, você pode lançar um ritual sem gastar PE.', minNex: 45, classId: 'Ocultista' },
  
  // NEX 50%
  { id: 'quarto-circulo', name: 'Quarto Círculo', description: 'Você pode lançar rituais de 4º círculo.', minNex: 50, classId: 'Ocultista', isCore: true },
  { id: 'mestre-rituais', name: 'Mestre dos Rituais', description: 'O custo de PE dos seus rituais é reduzido em 2 (mínimo 1).', minNex: 50, classId: 'Ocultista' },
  { id: 'conjuracao-poderosa', name: 'Conjuração Poderosa', description: 'O dano dos seus rituais aumenta em +1 dado.', minNex: 50, classId: 'Ocultista' },
  
  // NEX 55%+
  { id: 'magia-instintiva', name: 'Magia Instintiva', description: 'Você pode lançar rituais mesmo se estiver imobilizado ou sem componentes.', minNex: 55, classId: 'Ocultista' },
  { id: 'poder-absoluto', name: 'Poder Absoluto', description: 'A DT dos seus rituais aumenta em +2.', minNex: 60, classId: 'Ocultista' },
  { id: 'rituais-devastadores', name: 'Rituais Devastadores', description: 'O dano dos seus rituais aumenta em +2 dados.', minNex: 65, classId: 'Ocultista' },
  { id: 'arcano-supremo', name: 'Arcano Supremo', description: 'Você pode lançar rituais de 1º e 2º círculo como ação livre.', minNex: 70, classId: 'Ocultista' },
  
  // NEX 75%
  { id: 'transcendencia', name: 'Transcendência', description: 'Você pode gastar 10 PE para ficar imune a todo dano por uma rodada.', minNex: 75, classId: 'Ocultista' },
  { id: 'conexao-profunda', name: 'Conexão Profunda', description: 'Você pode usar seu PE para alimentar rituais de aliados (a qualquer distância).', minNex: 75, classId: 'Ocultista' },
  
  // NEX 99%
  { id: 'avatar-outro-lado', name: 'Avatar do Outro Lado', description: 'Você se torna parcialmente uma criatura do Outro Lado. Recebe imunidade a efeitos de medo e doenças, voo 18m, e +10 em todos os testes de rituais.', minNex: 99, classId: 'Ocultista', isCore: true },
];

// ==================== TODAS AS HABILIDADES ====================

export const ALL_CLASS_ABILITIES: ClassAbility[] = [
  ...COMBATENTE_ABILITIES,
  ...ESPECIALISTA_ABILITIES,
  ...OCULTISTA_ABILITIES,
];

// ==================== FUNÇÕES AUXILIARES ====================

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
 * Regra: 1 escolha a cada 5% de NEX (a partir do 10%)
 */
export function getAbilityChoiceCount(nex: number): number {
  // NEX 5% = 0 escolhas (só core)
  // NEX 10% = 1 escolha
  // NEX 15% = 2 escolhas
  // ...
  return Math.max(0, Math.floor(nex / 5) - 1);
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

/**
 * Retorna as habilidades novas desbloqueadas em um NEX específico
 */
export function getNewAbilitiesAtNex(classId: string, nex: number): ClassAbility[] {
  return ALL_CLASS_ABILITIES.filter(
    ability => ability.classId === classId && ability.minNex === nex
  );
}
