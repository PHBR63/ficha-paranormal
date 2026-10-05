/** Pool de testes: Livro Base v1.3, pp. 11 e 75; atributos negativos: suplemento p. 81. */
export interface AttributeDicePool {
  count: number;
  keep: 'highest' | 'lowest';
}

/**
 * Recebe atributo e penalidade em d20; retorna quantidade e critério de seleção.
 * Penalidade em dados não altera o atributo nem o modificador numérico do teste.
 * Ao reduzir um pool positivo abaixo de um, inverte a penalidade e mantém o pior.
 */
export function getAttributeDicePool(attribute: number, dicePenalty = 0): AttributeDicePool {
  if (!Number.isSafeInteger(attribute) || !Number.isSafeInteger(dicePenalty) || dicePenalty < 0) {
    throw new Error('Atributo e penalidade em dados devem ser inteiros; a penalidade deve ser não negativa.');
  }
  if (attribute <= 0) {
    return { count: 2 + Math.abs(attribute) + dicePenalty, keep: 'lowest' };
  }
  const remaining = attribute - dicePenalty;
  return remaining >= 1
    ? { count: remaining, keep: 'highest' }
    : { count: attribute + dicePenalty, keep: 'lowest' };
}

/** Lança o pool recebido e retorna todos os dados e o valor selecionado, sem somar bônus. */
export function rollAttributeDicePool(attribute: number, dicePenalty = 0) {
  const pool = getAttributeDicePool(attribute, dicePenalty);
  const dice = Array.from({ length: pool.count }, () => Math.floor(Math.random() * 20) + 1);
  const kept = pool.keep === 'highest' ? Math.max(...dice) : Math.min(...dice);
  return { ...pool, dice, kept };
}
