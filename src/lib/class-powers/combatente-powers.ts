/**
 * Poderes de Classe: COMBATENTE
 * Ordem Paranormal RPG v1.3 - Livro Base
 * 
 * O Combatente é a classe focada em combate físico, resistência e 
 * versatilidade com armas. Seus poderes oferecem bônus diretos de
 * ataque, dano, defesa e proficiências adicionais.
 */

import { UnifiedClassPower } from './types';

/**
 * Todos os poderes do Combatente, incluindo habilidades core e escolhíveis
 */
export const COMBATENTE_POWERS: UnifiedClassPower[] = [
  // ==================== HABILIDADES CORE (AUTOMÁTICAS) ====================
  
  {
    id: 'ataque-especial',
    name: 'Ataque Especial',
    classId: 'Combatente',
    isCore: true,
    minNex: 5,
    description: 'Quando faz um ataque, você pode gastar 2 PE para receber +5 no teste de ataque ou na rolagem de dano. Conforme avança de NEX, pode gastar mais PE para receber bônus maiores: 3 PE para +10 em NEX 25%, 4 PE para +15 em NEX 55%, 5 PE para +20 em NEX 85%. Você pode dividir o bônus entre ataque e dano.',
    pageReference: 'Livro Base v1.3, p.24',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'free',
        },
        attackBonus: { value: 5 },
        damageBonus: { value: 5 },
      },
      progression: {
        25: {
          kind: 'activated',
          activation: { cost: 3, action: 'free' },
          attackBonus: { value: 10 },
          damageBonus: { value: 10 },
        },
        55: {
          kind: 'activated',
          activation: { cost: 4, action: 'free' },
          attackBonus: { value: 15 },
          damageBonus: { value: 15 },
        },
        85: {
          kind: 'activated',
          activation: { cost: 5, action: 'free' },
          attackBonus: { value: 20 },
          damageBonus: { value: 20 },
        },
      },
    },
    tags: ['combate', 'ofensivo', 'pe'],
  },
  
  {
    id: 'habilidade-trilha-combatente',
    name: 'Habilidade de Trilha',
    classId: 'Combatente',
    isCore: true,
    minNex: 10,
    description: 'Em NEX 10% você escolhe uma das trilhas de combatente e recebe o primeiro poder da trilha escolhida. Você recebe um novo poder da trilha escolhida em NEX 40%, 65% e 99%.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['trilha', 'progressão'],
  },
  
  {
    id: 'aumento-atributo-20-comb',
    name: 'Aumento de Atributo',
    classId: 'Combatente',
    isCore: true,
    minNex: 20,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'grau-treinamento-35-comb',
    name: 'Grau de Treinamento',
    classId: 'Combatente',
    isCore: true,
    minNex: 35,
    description: 'Escolha um número de perícias treinadas igual a 2 + Int. Seu grau de treinamento nessas perícias aumenta (de treinado para veterano, ou de veterano para expert).',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 2, // +Int será calculado em runtime
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'aumento-atributo-50-comb',
    name: 'Aumento de Atributo',
    classId: 'Combatente',
    isCore: true,
    minNex: 50,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'versatilidade-comb',
    name: 'Versatilidade',
    classId: 'Combatente',
    isCore: true,
    minNex: 50,
    description: 'Escolha entre receber um poder de combatente ou o primeiro poder de uma trilha de combatente que não a sua.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'versatilidade'],
  },
  
  {
    id: 'grau-treinamento-70-comb',
    name: 'Grau de Treinamento',
    classId: 'Combatente',
    isCore: true,
    minNex: 70,
    description: 'Escolha um número de perícias treinadas igual a 2 + Int. Seu grau de treinamento nessas perícias aumenta (de treinado para veterano, ou de veterano para expert).',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 2,
          targetLevel: 'veteran',
        },
      },
    },
    tags: ['progressão', 'perícia'],
  },
  
  {
    id: 'aumento-atributo-80-comb',
    name: 'Aumento de Atributo',
    classId: 'Combatente',
    isCore: true,
    minNex: 80,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  {
    id: 'aumento-atributo-95-comb',
    name: 'Aumento de Atributo',
    classId: 'Combatente',
    isCore: true,
    minNex: 95,
    description: 'Aumente um atributo em +1. Você não pode aumentar um atributo além de 5 dessa forma.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'choice',
        requiresChoice: {
          type: 'attribute',
          count: 1,
        },
      },
    },
    tags: ['progressão', 'atributo'],
  },
  
  // ==================== PODERES ESCOLHÍVEIS ====================
  
  {
    id: 'armamento-pesado',
    name: 'Armamento Pesado',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Você recebe proficiência com armas pesadas. Pré-requisito: For 2.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { strength: 2 },
    },
    effects: {
      base: {
        kind: 'proficiency',
        proficiencies: {
          weapons: ['heavy'],
        },
      },
    },
    tags: ['proficiência', 'armas'],
  },
  
  {
    id: 'artista-marcial',
    name: 'Artista Marcial',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Seus ataques desarmados causam 1d6 pontos de dano, podem causar dano letal e se tornam ágeis (veja p. 89). Em NEX 35%, o dano aumenta para 1d8 e, em NEX 70%, para 1d10.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'scaling',
        grantsUnarmedDamage: {
          baseDice: '1d6',
          scaling: [
            { nex: 35, dice: '1d8' },
            { nex: 70, dice: '1d10' },
          ],
        },
        grantsAgileProperty: true,
      },
    },
    tags: ['combate', 'desarmado', 'escalável'],
  },
  
  {
    id: 'ataque-de-oportunidade',
    name: 'Ataque de Oportunidade',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Sempre que um ser sair voluntariamente de um espaço adjacente ao seu, você pode gastar uma reação e 1 PE para fazer um ataque corpo a corpo contra ele.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'reaction',
        activation: {
          cost: 1,
          action: 'reaction',
        },
        conditions: {
          weaponType: 'melee',
        },
      },
    },
    tags: ['combate', 'reação', 'corpo-a-corpo'],
  },
  
  {
    id: 'combater-duas-armas',
    name: 'Combater com Duas Armas',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Ao agredir com duas armas, sendo ao menos uma leve, pode atacar com ambas. Até o próximo turno, seus testes de ataque perdem 1d20. Pré-requisitos: Agi 3, treinado em Luta ou Pontaria.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { agility: 3 },
      skills: [{ skill: 'luta' }, { skill: 'pontaria' }], // OR logic
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0,
          action: 'standard',
        },
        attackDicePenalty: 1, // Livro Base v1.3, p. 25: penalidade em dados.
      },
    },
    tags: ['combate', 'múltiplos-ataques'],
  },
  
  {
    id: 'combate-defensivo',
    name: 'Combate Defensivo',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Ao agredir, pode combater defensivamente: até o próximo turno, seus testes de ataque perdem 1d20 e sua Defesa aumenta em +5. Pré-requisito: Int 2.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { intellect: 2 },
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 0,
          action: 'none',
        },
        attackDicePenalty: 1, // Penalidade em dados, sem subtrair do resultado numérico.
        defenseBonus: { value: 5 }, // Bônus oficial: +5
        conditions: {
          inCombat: true,
        },
      },
    },
    tags: ['combate', 'defesa'],
  },
  
  {
    id: 'golpe-demolidor',
    name: 'Golpe Demolidor',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Quando usa a manobra quebrar ou ataca um objeto, você pode gastar 1 PE para causar dois dados de dano extra do mesmo tipo de sua arma. Pré-requisitos: For 2, treinado em Luta.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { strength: 2 },
      skills: [{ skill: 'luta', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'free',
        },
        damageBonus: {
          extraDice: '2W', // Dois dados do tipo da arma, apenas ao quebrar ou atacar objetos.
        },
      },
    },
    tags: ['combate', 'dano', 'manobra'],
  },
  
  {
    id: 'golpe-pesado',
    name: 'Golpe Pesado',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Enquanto estiver empunhando uma arma corpo a corpo, o dano dela aumenta em mais um dado do mesmo tipo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'passive',
        damageBonus: {
          extraDice: '+1d',
          conditions: {
            weaponType: 'melee',
          },
        },
      },
    },
    tags: ['combate', 'dano', 'corpo-a-corpo', 'passivo'],
  },
  
  {
    id: 'incansavel',
    name: 'Incansável',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Uma vez por cena, você pode gastar 2 PE para fazer uma ação de investigação adicional, mas deve usar Força ou Agilidade como atributo-base do teste.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'resource',
        activation: {
          cost: 2,
          action: 'standard',
          perScene: true,
        },
        extraActions: [{
          actionType: 'investigation',
          cost: 2,
          perScene: true,
          skillBonus: 0,
        }],
      },
    },
    tags: ['investigação', 'ação-extra'],
  },
  
  {
    id: 'presteza-atletica',
    name: 'Presteza Atlética',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Quando fizer um teste para facilitar uma investigação, você pode gastar 1 PE para usar Força ou Agilidade no lugar do atributo-base da perícia. Se passar no teste, o próximo aliado que usar esse bônus também recebe +1d20 no teste.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'none',
        },
        conditions: {
          duringInvestigation: true,
        },
      },
    },
    tags: ['investigação', 'suporte'],
  },
  
  {
    id: 'protecao-pesada',
    name: 'Proteção Pesada',
    classId: 'Combatente',
    isCore: false,
    minNex: 30,
    description: 'Você recebe proficiência com Proteções Pesadas. Pré-requisito: NEX 30%.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'proficiency',
        proficiencies: {
          protections: ['heavy'],
        },
      },
    },
    tags: ['proficiência', 'proteção'],
  },
  
  {
    id: 'reflexos-defensivos',
    name: 'Reflexos Defensivos',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Você recebe +2 em Defesa e em testes de resistência. Pré-requisitos: Agi 2.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { agility: 2 },
    },
    effects: {
      base: {
        kind: 'passive',
        defenseBonus: { value: 2 },
        resistanceBonus: { value: 2, types: ['all'] },
      },
    },
    tags: ['defesa', 'resistência', 'passivo'],
  },
  
  {
    id: 'saque-rapido',
    name: 'Saque Rápido',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Você pode sacar ou guardar itens como uma ação livre (em vez de ação de movimento). Além disso, caso esteja usando a regra opcional de contagem de munição, uma vez por rodada pode recarregar uma arma de disparo como uma ação livre. Pré-requisito: treinado em Iniciativa.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      skills: [{ skill: 'iniciativa', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
      },
    },
    tags: ['utilidade', 'ação-livre'],
  },
  
  {
    id: 'segurar-gatilho',
    name: 'Segurar o Gatilho',
    classId: 'Combatente',
    isCore: false,
    minNex: 60,
    description: 'Sempre que acerta um ataque com uma arma de fogo, pode fazer outro ataque com a mesma arma contra o mesmo alvo, pagando 2 PE por cada ataque já realizado no turno. Pré-requisito: NEX 60%.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'triggered',
        activation: {
          cost: { baseValue: 2, scaling: [] }, // Escala com ataques
          action: 'free',
        },
        conditions: {
          weaponType: 'firearm',
          onHit: true,
        },
      },
    },
    tags: ['combate', 'múltiplos-ataques', 'arma-de-fogo'],
  },
  
  {
    id: 'sentido-tatico',
    name: 'Sentido Tático',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar uma ação de movimento e 2 PE para analisar o ambiente. Se fizer isso, recebe um bônus em Defesa e testes de resistência igual ao seu Intelecto até o final da cena. Pré-requisitos: Int 2, treinado em Percepção e Tática.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      attributes: { intellect: 2 },
      skills: [
        { skill: 'percepcao', level: 'trained' },
        { skill: 'tatica', level: 'trained' },
      ],
    },
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 2,
          action: 'movement',
        },
        defenseBonus: { value: 0 }, // Valor = Intelecto (calculado em runtime)
        resistanceBonus: { value: 0, types: ['all'] },
      },
    },
    tags: ['defesa', 'tático'],
  },
  
  {
    id: 'tanque-de-guerra',
    name: 'Tanque de Guerra',
    classId: 'Combatente',
    isCore: false,
    minNex: 30,
    description: 'Se estiver usando uma proteção pesada, sua Defesa e resistência a dano que ela fornece aumentam em +2. Pré-requisito: Proteção Pesada.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      powers: ['protecao-pesada'],
    },
    effects: {
      base: {
        kind: 'passive',
        defenseBonus: {
          value: 2,
          conditions: {
            protectionType: 'heavy',
          },
        },
        damageReduction: {
          value: 2,
          conditions: {
            protectionType: 'heavy',
          },
        },
      },
    },
    tags: ['defesa', 'proteção', 'passivo'],
  },
  
  {
    id: 'tiro-certeiro',
    name: 'Tiro Certeiro',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Se estiver usando uma arma de disparo, você soma sua Agilidade nas rolagens de dano e ignora a penalidade contra alvos envolvidos em combate corpo a corpo (mesmo se não usar a ação mirar). Pré-requisito: treinado em Pontaria.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    prerequisites: {
      skills: [{ skill: 'pontaria', level: 'trained' }],
    },
    effects: {
      base: {
        kind: 'passive',
        damageBonus: {
          attribute: 'agility',
          conditions: {
            weaponType: ['ranged', 'firearm'],
          },
        },
      },
    },
    tags: ['combate', 'dano', 'disparo', 'passivo'],
  },
  
  {
    id: 'tiro-de-cobertura',
    name: 'Tiro de Cobertura',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Você pode gastar uma ação padrão e 1 PE para disparar uma arma de fogo na direção de um ser no alcance da arma para forçá-lo a se proteger. Faça um teste de Pontaria contra a Vontade do alvo. Se vencer, até o início do seu próximo turno o alvo não pode sair do lugar onde está e sofre –5 em testes de ataque. Este é um efeito de medo.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    effects: {
      base: {
        kind: 'activated',
        activation: {
          cost: 1,
          action: 'standard',
        },
        conditions: {
          weaponType: 'firearm',
        },
      },
    },
    tags: ['combate', 'controle', 'medo'],
  },
  
  {
    id: 'transcender-comb',
    name: 'Transcender',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Escolha um poder paranormal (veja a página 114). Você recebe o poder escolhido, mas não ganha Sanidade neste aumento de NEX. Você pode escolher este poder várias vezes.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'repeatable',
        grantsPower: 'paranormal', // Referência a poder paranormal escolhido
        requiresChoice: {
          type: 'power',
          count: 1,
        },
      },
    },
    tags: ['paranormal', 'transcendência', 'repetível'],
  },
  
  {
    id: 'treinamento-pericia-comb',
    name: 'Treinamento em Perícia',
    classId: 'Combatente',
    isCore: false,
    minNex: 15,
    description: 'Escolha duas perícias. Você se torna treinado nessas perícias. A partir de NEX 35%, você pode escolher perícias nas quais já é treinado para se tornar veterano. A partir de NEX 70%, pode escolher perícias nas quais já é veterano para se tornar expert. Você pode escolher este poder várias vezes.',
    pageReference: 'Referência individual pendente; seção da classe no Livro Base v1.3, pp.24–27',
    isRepeatable: true,
    effects: {
      base: {
        kind: 'choice',
        skillTraining: {
          count: 2,
          targetLevel: 'trained',
        },
      },
      progression: {
        35: {
          kind: 'choice',
          skillTraining: {
            count: 2,
            targetLevel: 'veteran',
          },
        },
        70: {
          kind: 'choice',
          skillTraining: {
            count: 2,
            targetLevel: 'expert',
          },
        },
      },
    },
    tags: ['perícia', 'treinamento', 'repetível'],
  },
  
];

// ================================================================================
// PODERES NÃO-OFICIAIS REMOVIDOS (não constam no Livro Base v1.3)
// ================================================================================
// Os seguintes poderes foram removidos por não constarem no material oficial:
// - Avanço Tático
// - Combate à Distância  
// - Força Bruta
// - Ímpeto
// - Pancada Revigorante
// - Resistente
// - Saúde de Ferro
// - Treinamento Defensivo
// - Valentão
// - Ataque Pesado
// - Especialista em Arma
//
// TODO: Futuramente implementar sistema de filtro por categoria:
// - Homebrew: Conteúdo caseiro criado por usuários
// - Expansão: Conteúdo de suplementos oficiais (quando identificados)
// - Beta: Conteúdo em teste
// ================================================================================

/**
 * Retorna todos os poderes core do Combatente
 */
export function getCombatenteCorePowers(): UnifiedClassPower[] {
  return COMBATENTE_POWERS.filter(p => p.isCore);
}

/**
 * Retorna todos os poderes escolhíveis do Combatente
 */
export function getCombatenteChoosablePowers(): UnifiedClassPower[] {
  return COMBATENTE_POWERS.filter(p => !p.isCore);
}

/**
 * Retorna poderes disponíveis para um NEX específico
 */
export function getCombatentePowersAtNex(nex: number): UnifiedClassPower[] {
  return COMBATENTE_POWERS.filter(p => p.minNex <= nex);
}
