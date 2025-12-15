/**
 * Ordem Paranormal RPG v1.3 - Class Abilities by NEX
 * Sistema de habilidades de classe que escalam com o nível de experiência
 * Inclui conteúdo do suplemento "Sobrevivendo ao Horror"
 */

import { getAbilityChoicesByNex } from './character-data';
import { SOBREVIVENTE_ABILITIES } from './supplement-classes';

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
  isCore?: boolean; // Habilidade fundamental da classe, não escolhida
}

// ==================== HABILIDADES DO COMBATENTE ====================
// Textos oficiais do livro base Ordem Paranormal RPG

export const COMBATENTE_ABILITIES: ClassAbility[] = [
  // ========== HABILIDADES CORE (automáticas) ==========
  
  // NEX 5% - Inicial
  { 
    id: 'ataque-especial', 
    name: 'Ataque Especial', 
    description: 'Quando faz um ataque, você pode gastar 2 PE para receber +5 no teste de ataque ou na rolagem de dano. Conforme avança de NEX, você pode gastar +1 PE para receber mais bônus de +5 (veja a Tabela 1.3). Você pode aplicar cada bônus de +5 em ataque ou dano. Por exemplo, em NEX 55%, você pode gastar 4 PE para receber +5 no teste de ataque e +10 na rolagem de dano.', 
    minNex: 5, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // Habilidade de Trilha - explicação do sistema
  { 
    id: 'habilidade-trilha-combatente', 
    name: 'Habilidade de Trilha', 
    description: 'Em NEX 10% você escolhe uma das trilhas de combatente e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha escolhida em NEX 40%, 65% e 99%.', 
    minNex: 10, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 20% - Aumento de Atributo
  { 
    id: 'aumento-atributo-20', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 20, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 35% - Grau de Treinamento
  { 
    id: 'grau-treinamento-35', 
    name: 'Grau de Treinamento', 
    description: 'Escolha um número de perícias treinadas igual a 2 + Int. Seu grau de treinamento nessas perícias aumenta (de treinado para veterano, ou de veterano para expert).', 
    minNex: 35, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 50% - Aumento de Atributo + Versatilidade
  { 
    id: 'aumento-atributo-50', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 50, 
    classId: 'Combatente', 
    isCore: true 
  },
  { 
    id: 'versatilidade', 
    name: 'Versatilidade', 
    description: 'Escolha entre receber um poder de combatente ou o primeiro poder de uma trilha de combatente que não a sua.', 
    minNex: 50, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 70% - Grau de Treinamento
  { 
    id: 'grau-treinamento-70', 
    name: 'Grau de Treinamento', 
    description: 'Escolha um número de perícias treinadas igual a 2 + Int. Seu grau de treinamento nessas perícias aumenta (de treinado para veterano, ou de veterano para expert).', 
    minNex: 70, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // NEX 80% - Aumento de Atributo
  { 
    id: 'aumento-atributo-80', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 80, 
    classId: 'Combatente', 
    isCore: true 
  },
  
  // ========== PODERES DE COMBATENTE (escolhíveis) ==========
  // Recebe em NEX 15%, 30%, 45%, 60%, 75%, 90%
  
  { 
    id: 'armamento-pesado', 
    name: 'Armamento Pesado', 
    description: 'Você recebe proficiência com armas pesadas. Pré-requisito: For 2.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'artista-marcial', 
    name: 'Artista Marcial', 
    description: 'Seus ataques desarmados causam 1d6 pontos de dano, podendo causar dano letal se tornar ágeis (veja p. 59). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'ataque-de-oportunidade', 
    name: 'Ataque de Oportunidade', 
    description: 'Sempre que um adversário dentro de seu alcance ao seu sair, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'combater-duas-armas', 
    name: 'Combater com Duas Armas', 
    description: 'Se estiver empunhando duas armas e pelo menos uma for leve, e fizer a ação agredir, você pode fazer dois ataques, um com cada arma. Se fizer isso, sofre –2 em todos os testes de ataque até o seu próximo turno. Pré-requisitos: Agi 3, treinado em Luta ou Pontaria.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'combate-defensivo', 
    name: 'Combate Defensivo', 
    description: 'Quando usa a ação agredir, você pode combater defensivamente. Se fizer isso, até seu próximo turno, sofre –2 em todos os testes de ataque, mas recebe +5 na Defesa. Pré-requisito: Int 2.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'golpe-demolidor', 
    name: 'Golpe Demolidor', 
    description: 'Quando usa a manobra quebrar um objeto, você pode gastar 1 PE para causar dois dados de dano do mesmo tipo de sua arma. Pré-requisitos: For 2, treinado em Luta.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'golpe-pesado', 
    name: 'Golpe Pesado', 
    description: 'Enquanto estiver empunhando uma arma corpo a corpo, o dano dela aumenta em mais um dado do mesmo tipo.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'incansavel', 
    name: 'Incansável', 
    description: 'Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional, mas deve usar Força ou Agilidade como atributo-base do teste.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'presteza-atletica', 
    name: 'Presteza Atlética', 
    description: 'Quando faz um teste de facilitar a investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base da perícia. Se passar no teste, o próximo aliado que usar essa ação também recebe +5 no teste.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'protecao-pesada', 
    name: 'Proteção Pesada', 
    description: 'Você recebe proficiência com Proteções Pesadas. Pré-requisito: NEX 30%.', 
    minNex: 30, 
    classId: 'Combatente' 
  },
  { 
    id: 'reflexos-defensivos', 
    name: 'Reflexos Defensivos', 
    description: 'Você recebe +2 em Defesa e em testes de resistência. Pré-requisitos: Agi 2.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'saque-rapido', 
    name: 'Saque Rápido', 
    description: 'Você pode sacar ou guardar itens como uma ação livre, em vez de ação de movimento. Além disso, pode recarregar uma arma de fogo sem contar munição uma vez por rodada. Pré-requisito: treinado em Iniciativa.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'segurar-gatilho', 
    name: 'Segurar o Gatilho', 
    description: 'Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo, pagando 2 PE por ataque adicional no turno. Pode repetir até errar, atingir o limite de PE por rodada. Pré-requisito: NEX 60%.', 
    minNex: 60, 
    classId: 'Combatente' 
  },
  { 
    id: 'sentido-tatico', 
    name: 'Sentido Tático', 
    description: 'Você pode gastar uma ação de movimento e 2 PE para analisar o ambiente. Se fizer isso, recebe um bônus em Defesa e testes de resistência igual ao seu Intelecto até o final da cena. Pré-requisitos: Int 2, treinado em Percepção e Tática.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'tanque-de-guerra', 
    name: 'Tanque de Guerra', 
    description: 'Se estiver usando uma proteção pesada, sua Defesa e resistência a dano que ela fornece aumentam em +2. Pré-requisito: Proteção Pesada.', 
    minNex: 30, 
    classId: 'Combatente' 
  },
  { 
    id: 'tiro-certeiro', 
    name: 'Tiro Certeiro', 
    description: 'Se estiver usando uma arma de disparo, você soma sua Agilidade nas rolagens de dano e ignora a cobertura dos alvos envolvidos em combate corpo a corpo (mesmo se não usar a ação mirar). Pré-requisito: treinado em Pontaria.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'tiro-de-cobertura', 
    name: 'Tiro de Cobertura', 
    description: 'Você pode gastar uma ação padrão e 1 PE para disparar uma arma de fogo na direção de um ser no alcance da arma para forçá-lo a se proteger. Faça um teste de Pontaria contra a Vontade do alvo. Se vencer, até o início do seu próximo turno o alvo não pode sair do lugar onde está e sofre –5 em testes de ataque. Se estiver em local extremamente perigoso, sofre também um efeito de medo.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'transcender', 
    name: 'Transcender', 
    description: 'Escolha um poder paranormal (veja p. 114). Você recebe o poder escolhido, mas não ganha Sanidade nem aumento de NEX. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'treinamento-pericia', 
    name: 'Treinamento em Perícia', 
    description: 'Escolha duas perícias. Se estiver em NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. Em NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
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
  ...SOBREVIVENTE_ABILITIES, // Habilidades do suplemento "Sobrevivendo ao Horror"
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
 * Usa a tabela de progressão oficial do NEX
 */
export function getAbilityChoiceCount(nex: number): number {
  // Usa a função centralizada da tabela de progressão
  return getAbilityChoicesByNex(nex);
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
