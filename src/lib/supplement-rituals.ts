/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Novos Rituais do Suplemento
 */

import { Ritual } from './rituals-data';

// ==================== NOVOS RITUAIS DO SUPLEMENTO ====================

export const SUPPLEMENT_RITUALS: Ritual[] = [
  // === RITUAIS DE SANGUE ===
  {
    id: 'sangue-corrosivo',
    name: 'Sangue Corrosivo',
    circle: 2,
    element: 'sangue',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Sustentada',
    resistance: 'Fortitude parcial',
    description: 'Você transforma o sangue do alvo em ácido. O alvo sofre 3d6 de dano por turno. Se passar no teste, sofre metade.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 5d6.' },
      { cost: 2, description: 'O ácido também afeta equipamentos, degradando armaduras.' },
    ],
  },
  {
    id: 'transfusao-massa',
    name: 'Transfusão em Massa',
    circle: 3,
    element: 'sangue',
    execution: 'Completa',
    range: 'Médio',
    target: 'Até 6 criaturas',
    duration: 'Instantânea',
    description: 'Você redistribui a força vital entre aliados. A soma do PV atual de todos os alvos é dividida igualmente entre eles.',
    cost: 5,
    enhancements: [
      { cost: 3, description: 'Cada alvo também recupera 2d8 PV adicionais.' },
      { cost: 5, description: 'Você pode incluir inimigos como "doadores", drenando seu PV para o grupo.' },
    ],
  },
  {
    id: 'pacto-sangue',
    name: 'Pacto de Sangue',
    circle: 1,
    element: 'sangue',
    execution: 'Completa',
    range: 'Toque',
    target: 'Você e 1 aliado',
    duration: 'Cena',
    description: 'Você cria um vínculo de sangue com um aliado. Vocês compartilham PV (dano é dividido entre ambos).',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'Vocês também compartilham PE.' },
      { cost: 3, description: 'Podem se comunicar telepaticamente enquanto o pacto durar.' },
    ],
  },

  // === RITUAIS DE MORTE ===
  {
    id: 'maldicao-tumulo',
    name: 'Maldição do Túmulo',
    circle: 2,
    element: 'morte',
    execution: 'Padrão',
    range: 'Médio',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade parcial',
    description: 'Você amaldiçoa o alvo com a marca da morte. Ele sofre -4 em todos os testes e -2 em Defesa. Se passar no teste, sofre apenas -2 em testes.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O alvo também sofre 2d6 de dano necrótico por turno.' },
      { cost: 5, description: 'Se o alvo morrer sob a maldição, se torna um morto-vivo sob seu controle.' },
    ],
  },
  {
    id: 'legiao-mortos',
    name: 'Legião de Mortos',
    circle: 3,
    element: 'morte',
    execution: 'Completa',
    range: 'Médio',
    target: 'Área',
    duration: 'Cena',
    description: 'Você levanta todos os cadáveres em alcance médio como mortos-vivos sob seu controle (até seu NEX/10 zumbis).',
    cost: 6,
    enhancements: [
      { cost: 3, description: 'Os zumbis têm o dobro de PV.' },
      { cost: 5, description: 'Você pode levantar esqueletos em vez de zumbis, que são mais rápidos e causam +1d6 de dano.' },
    ],
  },
  {
    id: 'sussurro-final',
    name: 'Sussurro Final',
    circle: 1,
    element: 'morte',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 cadáver',
    duration: 'Instantânea',
    description: 'Você ouve as últimas palavras ou pensamentos de uma pessoa morta. Funciona até 24 horas após a morte.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Funciona até uma semana após a morte.' },
      { cost: 3, description: 'Você vê os últimos momentos através dos olhos do morto.' },
    ],
  },

  // === RITUAIS DE CONHECIMENTO ===
  {
    id: 'clarividencia',
    name: 'Clarividência',
    circle: 2,
    element: 'conhecimento',
    execution: 'Completa',
    range: 'Ilimitado',
    target: 'Local conhecido',
    duration: 'Sustentada',
    description: 'Você pode ver e ouvir o que acontece em um local que você conhece ou pode descrever precisamente.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'Você pode se comunicar através do sensor de clarividência.' },
      { cost: 5, description: 'Você pode lançar rituais através do sensor.' },
    ],
  },
  {
    id: 'memoria-perfeita-ritual',
    name: 'Memória Perfeita',
    circle: 1,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você consegue lembrar perfeitamente de tudo que viu e ouviu durante o ritual. Recebe +5 em Investigação e Ciências.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'A duração aumenta para 1 dia.' },
      { cost: 3, description: 'Você também pode compartilhar memórias com um aliado tocado.' },
    ],
  },
  {
    id: 'visao-probabilistica',
    name: 'Visão Probabilística',
    circle: 3,
    element: 'conhecimento',
    execution: 'Padrão',
    range: 'Pessoal',
    target: 'Você',
    duration: 'Cena',
    description: 'Você vê múltiplas possibilidades do futuro. Pode rolar 2d20 em todos os testes e escolher o melhor resultado.',
    cost: 5,
    enhancements: [
      { cost: 3, description: 'Você também vê ataques antes de acontecerem. +4 em Defesa.' },
      { cost: 5, description: 'Você pode rolar 3d20 e escolher qualquer resultado.' },
    ],
  },

  // === RITUAIS DE ENERGIA ===
  {
    id: 'tempestade-eletrica',
    name: 'Tempestade Elétrica',
    circle: 3,
    element: 'energia',
    execution: 'Completa',
    range: 'Longo',
    target: 'Área de 9m de raio',
    duration: 'Sustentada',
    resistance: 'Reflexos parcial',
    description: 'Você invoca uma tempestade de raios. No início de cada turno seu, raios atingem todos na área, causando 4d6 de dano elétrico.',
    cost: 6,
    enhancements: [
      { cost: 3, description: 'O dano aumenta para 6d6.' },
      { cost: 5, description: 'Você pode direcionar um raio específico para causar 8d6 em um único alvo.' },
    ],
  },
  {
    id: 'escudo-forca',
    name: 'Escudo de Força',
    circle: 2,
    element: 'energia',
    execution: 'Reação',
    range: 'Curto',
    target: 'Você ou 1 aliado',
    duration: 'Instantânea',
    description: 'Você cria um escudo de energia que bloqueia um ataque, concedendo +10 em Defesa.',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'O escudo protege até 3 aliados adjacentes.' },
      { cost: 3, description: 'O escudo rebate o ataque para o atacante (reflexos anula).' },
    ],
  },
  {
    id: 'sobrecarga',
    name: 'Sobrecarga',
    circle: 1,
    element: 'energia',
    execution: 'Padrão',
    range: 'Toque',
    target: '1 dispositivo',
    duration: 'Instantânea',
    description: 'Você sobrecarrega um dispositivo eletrônico, destruindo-o. Se for uma arma, ela explode causando 2d6 de dano ao portador.',
    cost: 1,
    enhancements: [
      { cost: 2, description: 'Afeta todos os dispositivos em alcance curto.' },
      { cost: 3, description: 'A explosão causa 4d6 de dano.' },
    ],
  },

  // === RITUAIS DE MEDO ===
  {
    id: 'terror-absoluto',
    name: 'Terror Absoluto',
    circle: 3,
    element: 'medo',
    execution: 'Padrão',
    range: 'Médio',
    target: 'Criaturas à sua escolha',
    duration: 'Cena',
    resistance: 'Vontade parcial',
    description: 'Você projeta o medo mais profundo de cada alvo. Alvos que falharem no teste ficam paralisados de medo. Mesmo os que passarem sofrem -4 em todos os testes.',
    cost: 6,
    enhancements: [
      { cost: 3, description: 'Alvos paralisados também sofrem 3d6 de dano mental por turno.' },
      { cost: 5, description: 'O efeito persiste mesmo após o alvo sair do alcance.' },
    ],
  },
  {
    id: 'loucura',
    name: 'Loucura',
    circle: 2,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade anula',
    description: 'Você enlouquece temporariamente o alvo. Ele não pode distinguir aliados de inimigos e ataca o alvo mais próximo.',
    cost: 3,
    enhancements: [
      { cost: 3, description: 'O alvo prioriza atacar seus próprios aliados.' },
      { cost: 5, description: 'A duração aumenta para 1 dia.' },
    ],
  },
  {
    id: 'pesadelo-desperto',
    name: 'Pesadelo Desperto',
    circle: 1,
    element: 'medo',
    execution: 'Padrão',
    range: 'Curto',
    target: '1 criatura',
    duration: 'Cena',
    resistance: 'Vontade parcial',
    description: 'O alvo começa a ter alucinações de seus piores medos. Sofre -2 em todos os testes e 1d6 de dano mental por turno. Metade se passar no teste.',
    cost: 2,
    enhancements: [
      { cost: 2, description: 'As alucinações parecem tão reais que o alvo pode atacá-las, gastando suas ações.' },
      { cost: 3, description: 'O dano aumenta para 2d6.' },
    ],
  },
];

/**
 * Retorna os rituais do suplemento por círculo
 */
export function getSupplementRitualsByCircle(circle: number): Ritual[] {
  return SUPPLEMENT_RITUALS.filter(ritual => ritual.circle === circle);
}

/**
 * Retorna os rituais do suplemento por elemento
 */
export function getSupplementRitualsByElement(element: string): Ritual[] {
  return SUPPLEMENT_RITUALS.filter(ritual => ritual.element === element);
}

/**
 * Retorna um ritual do suplemento pelo ID
 */
export function getSupplementRitualById(id: string): Ritual | undefined {
  return SUPPLEMENT_RITUALS.find(ritual => ritual.id === id);
}
