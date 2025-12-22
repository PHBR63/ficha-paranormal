/**
 * Utilitários de validação de tipos - Sistema genérico
 * 
 * Propósito: Fornecer funções de validação reutilizáveis
 * que evitam erros de tipos inválidos em tempo de execução.
 * 
 * Uso: Para evitar erros como "cannot read property of undefined"
 * quando acessamos propriedades de objetos com chaves dinâmicas.
 */

/**
 * Verifica se um valor é uma chave válida de um objeto.
 * Útil para validar tipos de enum ou chaves de Record antes de acessar.
 * 
 * @param key - O valor a ser verificado
 * @param obj - O objeto de referência com as chaves válidas
 * @returns true se key é uma chave válida de obj
 * 
 * @example
 * const config = { a: 1, b: 2 };
 * if (isValidKey(userInput, config)) {
 *   console.log(config[userInput]); // Acesso seguro
 * }
 */
export function isValidKey<T extends object>(
  key: unknown,
  obj: T
): key is keyof T {
  return typeof key === 'string' && key in obj;
}

/**
 * Retorna o valor se for uma chave válida, ou o fallback.
 * Garante que sempre retornamos uma chave válida do objeto.
 * 
 * @param key - O valor a ser verificado
 * @param obj - O objeto de referência com as chaves válidas
 * @param fallback - Chave padrão a usar se key não for válida
 * @returns key se válido, senão fallback
 * 
 * @example
 * const groups = { weapon: [], armor: [], misc: [] };
 * const type = getValidKeyOrFallback(item.type, groups, 'misc');
 * groups[type].push(item); // Sempre seguro
 */
export function getValidKeyOrFallback<T extends object>(
  key: unknown,
  obj: T,
  fallback: keyof T
): keyof T {
  return isValidKey(key, obj) ? key : fallback;
}

/**
 * Wrapper seguro para acessar arrays em objetos Record.
 * Retorna o array se existir, ou um array vazio se a chave não existir.
 * 
 * @param record - O objeto Record contendo arrays
 * @param key - A chave a acessar
 * @param fallbackKey - Chave alternativa opcional
 * @returns O array correspondente ou array vazio
 * 
 * @example
 * const groups: Record<string, Item[]> = { weapon: [...], armor: [...] };
 * const items = safeArrayAccess(groups, unknownType, 'misc');
 * // Sempre retorna um array, nunca undefined
 */
export function safeArrayAccess<T>(
  record: Record<string, T[]>,
  key: string,
  fallbackKey?: string
): T[] {
  if (key in record) {
    return record[key];
  }
  if (fallbackKey && fallbackKey in record) {
    return record[fallbackKey];
  }
  return [];
}

/**
 * Valida e retorna um valor de um conjunto de valores permitidos.
 * Útil para validar enums ou literais de tipos.
 * 
 * @param value - O valor a validar
 * @param allowedValues - Array de valores permitidos
 * @param fallback - Valor padrão se não for válido
 * @returns O valor se válido, senão fallback
 * 
 * @example
 * type Status = 'active' | 'inactive';
 * const status = validateEnumValue(input, ['active', 'inactive'], 'inactive');
 */
export function validateEnumValue<T>(
  value: unknown,
  allowedValues: readonly T[],
  fallback: T
): T {
  if (allowedValues.includes(value as T)) {
    return value as T;
  }
  return fallback;
}

/**
 * Wrapper para acessar propriedades de objetos de forma segura.
 * Retorna undefined se o objeto ou a chave não existirem.
 * 
 * @param obj - O objeto a acessar
 * @param key - A chave a acessar
 * @returns O valor ou undefined
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  if (obj == null) return undefined;
  return obj[key];
}
