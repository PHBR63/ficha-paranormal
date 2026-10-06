/** Extrai rótulos apenas para a tela; não reserializa nem altera condições persistidas. */
export function getCampaignConditionLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(condition => {
    if (typeof condition === 'string') return condition;
    if (condition && typeof condition === 'object') {
      if ('name' in condition && typeof condition.name === 'string') return condition.name;
      if ('id' in condition && typeof condition.id === 'string') return condition.id;
    }
    return 'Condição externa (conferir manualmente)';
  });
}
