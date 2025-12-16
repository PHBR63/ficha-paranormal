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
  
  // NEX 95% - Aumento de Atributo
  { 
    id: 'aumento-atributo-95', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 95, 
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
    description: 'Seus ataques desarmados causam 1d6 pontos de dano, podem causar dano letal e se tornam ágeis (veja p. 89). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'ataque-de-oportunidade', 
    name: 'Ataque de Oportunidade', 
    description: 'Sempre que um ser sair voluntariamente de um espaço adjacente ao seu, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'combater-duas-armas', 
    name: 'Combater com Duas Armas', 
    description: 'Se estiver empunhando duas armas (e pelo menos uma for leve) e fizer uma ação agredir, você pode fazer dois ataques, um com cada arma. Se fizer isso, sofre –5 em todos os testes de ataque até seu próximo turno. Pré-requisitos: Agi 3, treinado em Luta ou Pontaria.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'combate-defensivo', 
    name: 'Combate Defensivo', 
    description: 'Quando usa a ação agredir, você pode combater defensivamente. Se fizer isso, até seu próximo turno, sofre –5 em todos os testes de ataque, mas recebe +5 na Defesa. Pré-requisito: Int 2.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'golpe-demolidor', 
    name: 'Golpe Demolidor', 
    description: 'Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar dois dados de dano extra do mesmo tipo de sua arma. Pré-requisitos: For 2, treinado em Luta.', 
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
    description: 'Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional, mas deve usar Força ou Agilidade como atributo-base do teste. Você recebe +5 no teste.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'presteza-atletica', 
    name: 'Presteza Atlética', 
    description: 'Quando faz um teste de facilitar a investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base da perícia. Se passar no teste, o próximo aliado que usar seu bônus também recebe +5 no teste.', 
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
    description: 'Você pode sacar ou guardar itens como uma ação livre (em vez de ação de movimento). Além disso, caso esteja usando a regra opcional de contagem de munição, uma vez por rodada pode recarregar uma arma de disparo como uma ação livre. Pré-requisito: treinado em Iniciativa.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'segurar-gatilho', 
    name: 'Segurar o Gatilho', 
    description: 'Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo, pagando 2 PE por cada ataque já realizado no turno. Ou seja, pode fazer o primeiro ataque extra gastando 2 PE e, se acertar, pode fazer um segundo ataque extra gastando mais 4 PE e assim por diante, até errar um ataque ou atingir o limite de seus PE por rodada. Pré-requisito: NEX 60%.', 
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
    description: 'Se estiver usando uma arma de disparo, você soma sua Agilidade nas rolagens de dano e ignora a penalidade contra alvos envolvidos em combate corpo a corpo (mesmo se não usar a ação mirar). Pré-requisito: treinado em Pontaria.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'tiro-de-cobertura', 
    name: 'Tiro de Cobertura', 
    description: 'Você pode gastar uma ação padrão e 1 PE para disparar uma arma de fogo na direção de um ser no alcance da arma para forçá-lo a se proteger. Faça um teste de Pontaria contra a Vontade do alvo. Se vencer, até o início do seu próximo turno o alvo não pode sair do lugar onde está e sofre –5 em testes de ataque. A critério do mestre, o alvo recebe +5 no teste de Vontade se estiver em um lugar extremamente perigoso, como uma casa em chamas ou um barco afundando. Este é um efeito de medo.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'transcender', 
    name: 'Transcender', 
    description: 'Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
  { 
    id: 'treinamento-pericia', 
    name: 'Treinamento em Perícia', 
    description: 'Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Combatente' 
  },
];

// ==================== HABILIDADES DO ESPECIALISTA ====================
// Textos oficiais do livro base Ordem Paranormal RPG

export const ESPECIALISTA_ABILITIES: ClassAbility[] = [
  // ========== HABILIDADES CORE (automáticas) ==========
  
  // NEX 5% - Inicial
  { 
    id: 'ecletico', 
    name: 'Eclético', 
    description: 'Quando faz um teste de uma perícia, você pode gastar 2 PE para receber os benefícios de ser treinado nessa perícia.', 
    minNex: 5, 
    classId: 'Especialista', 
    isCore: true 
  },
{ 
    id: 'perito', 
    name: 'Perito', 
    description: 'Escolha duas perícias nas quais você é treinado (exceto Luta e Pontaria). Quando faz um teste de uma dessas perícias, pode gastar 2 PE para somar +1d6 ao resultado. Conforme avança de NEX, o dado melhora: +1d8 (3 PE) em NEX 25%, +1d10 (4 PE) em NEX 45%, +1d12 (5 PE) em NEX 65%, +2d12 (6 PE) em NEX 85%.', 
    minNex: 5, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // Habilidade de Trilha - explicação do sistema
  { 
    id: 'habilidade-trilha-especialista', 
    name: 'Habilidade de Trilha', 
    description: 'Em NEX 10%, você escolhe uma das trilhas de especialista disponíveis e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha escolhida em NEX 40%, 65% e 99%.', 
    minNex: 10, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 20% - Aumento de Atributo
  { 
    id: 'aumento-atributo-20-esp', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 20, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 35% - Grau de Treinamento
  { 
    id: 'grau-treinamento-35-esp', 
    name: 'Grau de Treinamento', 
    description: 'Escolha um número de perícias treinadas igual a 5 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).', 
    minNex: 35, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 40% - Engenhosidade
  { 
    id: 'engenhosidade', 
    name: 'Engenhosidade', 
    description: 'Em NEX 40%, quando usa sua habilidade Eclético, você pode gastar 2 PE adicionais para receber os benefícios de ser veterano na perícia. Em NEX 75%, você pode gastar 4 PE adicionais para receber os benefícios de ser expert na perícia.', 
    minNex: 40, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 50% - Aumento de Atributo + Versatilidade
  { 
    id: 'aumento-atributo-50-esp', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 50, 
    classId: 'Especialista', 
    isCore: true 
  },
  { 
    id: 'versatilidade-esp', 
    name: 'Versatilidade', 
    description: 'Escolha entre receber um poder de especialista ou o primeiro poder de uma trilha de especialista que não a sua.', 
    minNex: 50, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 70% - Grau de Treinamento
  { 
    id: 'grau-treinamento-70-esp', 
    name: 'Grau de Treinamento', 
    description: 'Escolha um número de perícias treinadas igual a 5 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).', 
    minNex: 70, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 80% - Aumento de Atributo
  { 
    id: 'aumento-atributo-80-esp', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 80, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // NEX 95% - Aumento de Atributo
  { 
    id: 'aumento-atributo-95-esp', 
    name: 'Aumento de Atributo', 
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.', 
    minNex: 95, 
    classId: 'Especialista', 
    isCore: true 
  },
  
  // ========== PODERES DE ESPECIALISTA (escolhíveis) ==========
  // Recebe em NEX 15%, 30%, 45%, 60%, 75%, 90%
  
  { 
    id: 'artista-marcial-esp', 
    name: 'Artista Marcial', 
    description: 'Seus ataques desarmados causam 1d6 de dano, podendo causar dano letal e contam como armas ágeis. Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'balistica-avancada', 
    name: 'Balística Avançada', 
    description: 'Você recebe proficiência com armas táticas de fogo e +2 em rolagens de dano com armas de fogo.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'conhecimento-aplicado', 
    name: 'Conhecimento Aplicado', 
    description: 'Quando faz um teste de perícia (exceto Luta e Pontaria), você pode gastar 2 PE para mudar o atributo-base da perícia para Intelecto. Pré-requisito: Int 2.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
{ 
    id: 'hacker', 
    name: 'Hacker', 
    description: 'Você recebe +5 em testes de Tecnologia para invadir sistemas e elimina o tempo necessário para hackear qualquer sistema para uma ação completa. Pré-requisito: treinado em Tecnologia.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'maos-rapidas', 
    name: 'Mãos Rápidas', 
    description: 'Ao fazer um teste de Crime, você pode pagar 1 PE para fazê-lo como uma ação livre. Pré-requisitos: Agi 3, treinado em Crime.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'mochila-utilidades', 
    name: 'Mochila de Utilidades', 
    description: 'Um item à sua escolha (exceto armas) conta como se estivesse uma categoria abaixo e ocupa 1 espaço a menos.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'movimento-tatico', 
    name: 'Movimento Tático', 
    description: 'Você pode gastar 1 PE para ignorar penalidades em deslocamento por terreno difícil e se posicionar até o final do turno. Pré-requisito: treinado em Atletismo.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
{ 
    id: 'na-trilha-certa', 
    name: 'Na Trilha Certa', 
    description: 'Sempre que tiver sucesso em um teste para procurar pistas, você pode gastar 1 PE para receber +5 no próximo teste. Os custos e os bônus são cumulativos (se passar num segundo teste, pode pagar 2 PE para receber um total de +5 no próximo teste, e assim por diante).', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'nerd', 
    name: 'Nerd', 
    description: 'Você é um repositório de conhecimento útil (e inútil). Uma vez por cena, pode gastar 2 PE para fazer um teste de Atualidades (DT 20). Se passar: Em investigação: recebe uma pista extra. Em combate: descobre uma fraqueza do inimigo. Em outro contexto: o mestre fornece uma informação relevante. A fonte pode ser qualquer coisa plausível (livro, filme, série etc.).', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'ninja-urbano', 
    name: 'Ninja Urbano', 
    description: 'Você recebe proficiência com armas táticas de ataque corpo a corpo e de disparo e recebe +2 em rolagens de dano com essas armas.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'pensamento-agil', 
    name: 'Pensamento Ágil', 
    description: 'Uma vez por rodada, durante uma cena de investigação, você pode gastar 2 PE para fazer uma ação de procurar pistas adicional.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'perito-explosivos', 
    name: 'Perito em Explosivos', 
    description: 'Você soma seu Intelecto à DT para resistir aos seus explosivos e pode excluir um número de alvos da explosão igual ao seu valor de Intelecto.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'primeira-impressao', 
    name: 'Primeira Impressão', 
    description: 'Você recebe +5 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição que fizer em uma cena.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'transcender-esp', 
    name: 'Transcender', 
    description: 'Escolha um poder paranormal (veja p. 114). Você recebe o poder escolhido, mas não ganha Sanidade nem aumento de NEX. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
  { 
    id: 'treinamento-pericia-esp', 
    name: 'Treinamento em Perícia', 
    description: 'Escolha duas perícias. Em NEX 35%, pode escolher perícias treinadas para se tornarem veteranas. Em NEX 70%, pode escolher perícias veteranas para se tornarem expert. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Especialista' 
  },
];

// ==================== HABILIDADES DO OCULTISTA ====================

export const OCULTISTA_ABILITIES: ClassAbility[] = [
  // ==================== HABILIDADES CORE (AUTOMÁTICAS) ====================
  
  // NEX 5% - Escolhido pelo Outro Lado (Base da Classe)
  { 
    id: 'escolhido-pelo-outro-lado', 
    name: 'Escolhido pelo Outro Lado', 
    description: 'Você teve uma experiência paranormal e foi marcado pelo Outro Lado, absorvendo conhecimento proibido necessário para realizar rituais. Você pode lançar rituais de 1º círculo. Conforme seu NEX aumenta, pode lançar rituais de círculos maiores: 2º círculo em NEX 25%, 3º círculo em NEX 55%, 4º círculo em NEX 85%. Você começa com três rituais de 1º círculo e aprende um ritual adicional sempre que avança de NEX.', 
    minNex: 5, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 10% - Habilidade de Trilha
  { 
    id: 'habilidade-de-trilha-ocultista', 
    name: 'Habilidade de Trilha', 
    description: 'Em NEX 10%, você escolhe uma das trilhas de ocultista disponíveis e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha em NEX 40%, 65% e 99%.', 
    minNex: 10, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 20% - Aumento de Atributo
  { 
    id: 'aumento-atributo-ocultista-20', 
    name: 'Aumento de Atributo', 
    description: 'Em NEX 20%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.', 
    minNex: 20, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 25% - 2º Círculo
  { 
    id: 'segundo-circulo', 
    name: '2º Círculo de Rituais', 
    description: 'Você pode lançar rituais de 2º círculo.', 
    minNex: 25, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 35% - Grau de Treinamento
  { 
    id: 'grau-treinamento-ocultista-35', 
    name: 'Grau de Treinamento', 
    description: 'Em NEX 35%, escolha um número de perícias treinadas igual a 3 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).', 
    minNex: 35, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 50% - Aumento de Atributo + Versatilidade
  { 
    id: 'aumento-atributo-ocultista-50', 
    name: 'Aumento de Atributo', 
    description: 'Em NEX 50%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.', 
    minNex: 50, 
    classId: 'Ocultista', 
    isCore: true 
  },
  { 
    id: 'versatilidade-ocultista', 
    name: 'Versatilidade', 
    description: 'Em NEX 50%, escolha entre receber um poder de ocultista ou receber o primeiro poder de uma trilha de ocultista que não a sua.', 
    minNex: 50, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 55% - 3º Círculo
  { 
    id: 'terceiro-circulo', 
    name: '3º Círculo de Rituais', 
    description: 'Você pode lançar rituais de 3º círculo.', 
    minNex: 55, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 70% - Grau de Treinamento
  { 
    id: 'grau-treinamento-ocultista-70', 
    name: 'Grau de Treinamento', 
    description: 'Em NEX 70%, escolha um número de perícias treinadas igual a 3 + Int. O grau de treinamento dessas perícias aumenta em um nível (treinado → veterano → expert).', 
    minNex: 70, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 80% - Aumento de Atributo
  { 
    id: 'aumento-atributo-ocultista-80', 
    name: 'Aumento de Atributo', 
    description: 'Em NEX 80%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.', 
    minNex: 80, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 85% - 4º Círculo
  { 
    id: 'quarto-circulo', 
    name: '4º Círculo de Rituais', 
    description: 'Você pode lançar rituais de 4º círculo.', 
    minNex: 85, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // NEX 95% - Aumento de Atributo
  { 
    id: 'aumento-atributo-ocultista-95', 
    name: 'Aumento de Atributo', 
    description: 'Em NEX 95%, aumente um atributo à sua escolha em +1. Nenhum atributo pode ultrapassar 5 por esse método.', 
    minNex: 95, 
    classId: 'Ocultista', 
    isCore: true 
  },
  
  // ==================== PODERES ESCOLHÍVEIS ====================
  // Disponíveis em NEX 15%, 30% e a cada 15% subsequentes
  
  { 
    id: 'camuflar-ocultismo', 
    name: 'Camuflar Ocultismo', 
    description: 'Você pode gastar uma ação livre para esconder símbolos e sigilos desenhados ou gravados em objetos ou na sua pele, tornando-os invisíveis para outras pessoas além de você. Além disso, ao lançar um ritual, pode gastar +2 PE para lançá-lo sem componentes ritualísticos e sem gesticular, usando apenas concentração. Outros seres só perceberão que você lançou um ritual se passarem em um teste de Ocultismo (DT 25).', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'criar-selo', 
    name: 'Criar Selo', 
    description: 'Você pode fabricar selos paranormais de rituais que conheça. Fabricar um selo gasta uma ação demorada e um número de PE igual ao custo do ritual. Você pode ter um número máximo de selos criados ao mesmo tempo igual à sua Presença.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'envolto-em-misterio', 
    name: 'Envolto em Mistério', 
    description: 'Sua aparência e postura assombrosas permitem manipular e assustar pessoas ignorantes ou supersticiosas. O mestre define quando esse poder pode ser usado. Como regra geral, você recebe +5 em Enganação e Intimidação contra pessoas não treinadas em Ocultismo.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'especialista-em-elemento', 
    name: 'Especialista em Elemento', 
    description: 'Escolha um elemento. A DT para resistir aos seus rituais desse elemento aumenta em +2.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'ferramentas-paranormais', 
    name: 'Ferramentas Paranormais', 
    description: 'Você reduz a categoria de um item paranormal em 1 e pode ativar itens paranormais sem pagar seu custo em PE.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'guiado-pelo-paranormal', 
    name: 'Guiado pelo Paranormal', 
    description: 'Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'identificacao-paranormal', 
    name: 'Identificação Paranormal', 
    description: 'Você recebe +10 em testes de Ocultismo para identificar criaturas, objetos ou rituais paranormais.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'improvisar-componentes', 
    name: 'Improvisar Componentes', 
    description: 'Uma vez por cena, você pode gastar uma ação completa para fazer um teste de Investigação (DT 15). Se passar, encontra objetos que podem servir como componentes ritualísticos de um elemento à sua escolha. O mestre decide se é possível usar este poder na cena atual.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'intuicao-paranormal', 
    name: 'Intuição Paranormal', 
    description: 'Sempre que usa a ação facilitar a investigação, você pode usar Intelecto ou Presença no teste, à sua escolha.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'ritual-potente', 
    name: 'Ritual Potente', 
    description: 'Você soma seu Intelecto nas rolagens de dano ou efeitos de cura de seus rituais. Pré-requisito: Int 2.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'ritual-predileto', 
    name: 'Ritual Predileto', 
    description: 'Escolha um ritual que você conhece. O custo desse ritual é reduzido em –1 PE. Essa redução se acumula com reduções vindas de outras fontes.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'tatuagem-ritualistica', 
    name: 'Tatuagem Ritualística', 
    description: 'Símbolos marcados em sua pele reduzem em –1 PE o custo de rituais de alcance pessoal que têm você como alvo.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'transcender-ocultista', 
    name: 'Transcender', 
    description: 'Escolha um poder paranormal. Você recebe o poder escolhido, mas não ganha Sanidade nem aumento de NEX. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  { 
    id: 'treinamento-em-pericia-ocultista', 
    name: 'Treinamento em Perícia', 
    description: 'Escolha duas perícias. Em NEX 35%, você pode escolher perícias nas quais já é treinado para se tornarem veteranas. Em NEX 70%, pode escolher perícias nas quais já é veterano para se tornarem expert. Você pode escolher este poder várias vezes.', 
    minNex: 15, 
    classId: 'Ocultista' 
  },
  
  // Poderes com pré-requisitos de NEX mais alto
  { 
    id: 'mestre-em-elemento', 
    name: 'Mestre em Elemento', 
    description: 'Escolha um elemento. O custo para lançar rituais desse elemento diminui em –1 PE. Pré-requisitos: Especialista em Elemento escolhido, NEX 45%.', 
    minNex: 45, 
    classId: 'Ocultista' 
  },
  { 
    id: 'fluxo-de-poder', 
    name: 'Fluxo de Poder', 
    description: 'Você pode manter dois efeitos sustentados de rituais ativos ao mesmo tempo, pagando o custo de cada efeito separadamente. Pré-requisito: NEX 60%.', 
    minNex: 60, 
    classId: 'Ocultista' 
  },
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
