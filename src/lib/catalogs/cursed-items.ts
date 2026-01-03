/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Sistema de Itens Amaldiçoados
 * 
 * Itens amaldiçoados são artefatos paranormais com poderes e maldições.
 * Cada item oferece um benefício, mas também uma desvantagem.
 */

import { ParanormalElement } from '../paranormal-powers';

// Interface para Itens Amaldiçoados
export interface CursedItem {
  id: string;
  name: string;
  category: 1 | 2 | 3 | 4; // Categoria do item (I, II, III, IV)
  element?: ParanormalElement;
  description: string;
  benefit: string;
  curse: string;
  attunement?: boolean; // Requer sintonização
  slots?: number; // Espaços de inventário
  // Campos especiais para itens que concedem rituais
  grantsRituals?: boolean; // Se true, permite usar rituais
  ritualMaxCircle?: number; // Círculo máximo dos rituais disponíveis
  ritualCount?: number; // Quantidade de rituais que o item contém
}

// ==================== ITENS AMALDIÇOADOS ====================

export const CURSED_ITEMS: CursedItem[] = [
  // === CATEGORIA I ===
  {
    id: 'anel-do-esquecimento',
    name: 'Anel do Esquecimento',
    category: 1,
    element: 'conhecimento',
    description: 'Um anel de prata enegrecida com inscrições ilegíveis.',
    benefit: 'Você pode gastar 1 PE para esquecer uma memória traumática, ignorando um teste de SAN por cena.',
    curse: 'Você ocasionalmente esquece detalhes importantes. -2 em testes de Investigação.',
    attunement: true,
    slots: 0,
  },
  {
    id: 'medalha-do-martir',
    name: 'Medalha do Mártir',
    category: 1,
    element: 'sangue',
    description: 'Uma medalha de bronze manchada de sangue seco que nunca sai.',
    benefit: 'Quando você recebe dano que o reduziria a 0 PV, pode gastar 2 PE para ficar com 1 PV em vez disso.',
    curse: 'A medalha queima sua pele. Você sofre 1 de dano no início de cada combate.',
    attunement: true,
    slots: 0,
  },
  {
    id: 'lanterna-do-limiar',
    name: 'Lanterna do Limiar',
    category: 1,
    element: 'morte',
    description: 'Uma lanterna antiga cuja chama oscila em tons azulados.',
    benefit: 'Ilumina criaturas invisíveis do Outro Lado em seu raio de luz.',
    curse: 'Atrai criaturas do Outro Lado. +1 em encontros aleatórios com entidades.',
    slots: 1,
  },
  {
    id: 'luvas-do-ladrao',
    name: 'Luvas do Ladrão',
    category: 1,
    description: 'Luvas de couro preto que parecem absorver a luz.',
    benefit: '+5 em testes de Crime para furtar ou arrombar.',
    curse: 'Você sente compulsão por roubar. Deve fazer teste de Vontade (DT 15) para não tentar furtar objetos valiosos.',
    attunement: true,
    slots: 0,
  },

  // === CATEGORIA II ===
  {
    id: 'mascara-de-carne',
    name: 'Máscara de Carne',
    category: 2,
    element: 'sangue',
    description: 'Uma máscara feita de pele humana preservada de forma antinatural.',
    benefit: 'Você pode assumir a aparência de qualquer pessoa cuja face você tenha visto. Dura até remover a máscara.',
    curse: 'Vestir a máscara causa 1d6 de dano. Removê-la causa mais 1d6.',
    attunement: true,
    slots: 1,
  },
  {
    id: 'adaga-vampirica',
    name: 'Adaga Vampírica',
    category: 2,
    element: 'morte',
    description: 'Uma adaga negra com uma lâmina que parece pulsar.',
    benefit: 'Dano 1d6+2. Quando causa dano, você recupera PV igual a metade do dano causado.',
    curse: 'A adaga exige sangue. Se não causar dano em um dia, você perde 1d6 PV ao amanhecer.',
    slots: 1,
  },
  {
    id: 'olho-de-vidro',
    name: 'Olho de Vidro',
    category: 2,
    element: 'conhecimento',
    description: 'Um olho de vidro verde que ocasionalmente pisca sozinho.',
    benefit: 'Substitui um olho. Você enxerga no escuro e através de ilusões.',
    curse: 'Você vê coisas que não deveria. Ocasionalmente tem visões perturbadoras (-1d6 SAN por sessão).',
    attunement: true,
    slots: 0,
  },
  {
    id: 'relogio-do-morto',
    name: 'Relógio do Morto',
    category: 2,
    element: 'morte',
    description: 'Um relógio de bolso que sempre marca meia-noite.',
    benefit: 'Uma vez por dia, pode "pausar" o tempo por 1 rodada (apenas você age).',
    curse: 'O relógio conta seu tempo restante. Você envelhece 1 ano por uso.',
    attunement: true,
    slots: 0,
  },

  // === CATEGORIA III ===
  {
    id: 'manto-das-sombras',
    name: 'Manto das Sombras',
    category: 3,
    element: 'morte', // Alterado de 'medo' para 'morte' (elemento oficial)
    description: 'Um manto negro que parece feito de escuridão solidificada.',
    benefit: '+10 em Furtividade. Você pode se tornar invisível em áreas de penumbra como ação de movimento.',
    curse: 'A luz do sol causa 1d6 de dano por rodada de exposição direta.',
    attunement: true,
    slots: 1,
  },
  {
    id: 'grimorio-vivo',
    name: 'Grimório Vivo',
    category: 3,
    element: 'conhecimento',
    description: 'Um livro cujas páginas se movem sozinhas e cujo texto muda.',
    benefit: 'Contém 3 rituais aleatórios de até 3º círculo. Você pode lançá-los mesmo sem ser Ocultista.',
    curse: 'O grimório sussurra. Você sofre -2 em testes de Vontade e SAN.',
    attunement: true,
    slots: 1,
    // Campos especiais para rituais
    grantsRituals: true,
    ritualMaxCircle: 3,
    ritualCount: 3,
  },
  {
    id: 'armadura-do-flagelado',
    name: 'Armadura do Flagelado',
    category: 3,
    element: 'sangue',
    description: 'Uma armadura de couro com espinhos internos.',
    benefit: 'Defesa +5. Quando recebe dano, pode gastar PV igual ao dano para anulá-lo.',
    curse: 'Os espinhos causam 2 de dano por hora vestindo. O dano não pode ser curado enquanto vestir.',
    slots: 2,
  },
  {
    id: 'espada-faminta',
    name: 'Espada Faminta',
    category: 3,
    element: 'morte',
    description: 'Uma espada longa negra que vibra quando sente sangue.',
    benefit: 'Dano 2d8+4. Crítico 18-20/×3. Quando mata um inimigo, você recupera 2d8 PV.',
    curse: 'A espada exige mortes. Se não matar em uma semana, ataca o portador (2d8 de dano).',
    attunement: true,
    slots: 2,
  },

  // === CATEGORIA IV ===
  {
    id: 'coroa-do-rei-palido',
    name: 'Coroa do Rei Pálido',
    category: 4,
    element: 'morte',
    description: 'Uma coroa de ossos fundidos com gemas negras.',
    benefit: 'Você pode controlar até 10 mortos-vivos simultaneamente. +5 em rituais de Morte.',
    curse: 'Você está morrendo lentamente. Perde 1 PV máximo por dia. Quando chegar a 0, torna-se morto-vivo.',
    attunement: true,
    slots: 0,
  },
  {
    id: 'coração-de-cristal',
    name: 'Coração de Cristal',
    category: 4,
    element: 'energia',
    description: 'Um cristal vermelho pulsante que substitui seu coração.',
    benefit: 'Você não precisa respirar, comer ou dormir. +20 PE máximo. Regenera 1 PE por rodada.',
    curse: 'Você não pode ser curado por métodos normais. Apenas rituais ou itens paranormais funcionam.',
    attunement: true,
    slots: 0,
  },
  {
    id: 'mascara-do-outro',
    name: 'Máscara do Outro',
    category: 4,
    element: 'conhecimento', // Alterado de 'medo' para 'conhecimento' (elemento oficial)
    description: 'Uma máscara branca sem feições que parece olhar através de você.',
    benefit: 'Você pode possuir temporariamente uma criatura (teste de Vontade resistido). Dura 1 cena.',
    curse: 'Algo do Outro Lado também pode possuí-lo. Uma vez por sessão, o Mestre pode assumir controle por 1 rodada.',
    attunement: true,
    slots: 0,
  },
  {
    id: 'chave-do-abismo',
    name: 'Chave do Abismo',
    category: 4,
    element: 'conhecimento',
    description: 'Uma chave de ferro negro que não abre nenhuma fechadura normal.',
    benefit: 'Pode abrir portais para o Outro Lado. Você pode se teletransportar para qualquer lugar que conheça.',
    curse: 'Cada uso atrai 1d4 criaturas do Outro Lado que tentarão atravessar junto.',
    attunement: true,
    slots: 0,
  },
];

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Retorna itens por categoria
 */
export function getItemsByCategory(category: 1 | 2 | 3 | 4): CursedItem[] {
  return CURSED_ITEMS.filter(item => item.category === category);
}

/**
 * Retorna itens por elemento
 */
export function getItemsByElement(element: ParanormalElement): CursedItem[] {
  return CURSED_ITEMS.filter(item => item.element === element);
}

/**
 * Retorna um item pelo ID
 */
export function getCursedItemById(id: string): CursedItem | undefined {
  return CURSED_ITEMS.find(item => item.id === id);
}

/**
 * Retorna a label da categoria em romano
 */
export function getCategoryLabel(category: 1 | 2 | 3 | 4): string {
  const labels: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
  };
  return labels[category];
}
