/** Compatibilidade de leitura durante a coexistência dos schemas de campanha. */
interface CampaignQueryResult<T> {
  data: T[] | null;
  error: { code: string; message: string } | null;
}

/**
 * Retorna as linhas consultadas, tolerando somente uma tabela ainda inexistente.
 * Falhas de permissão, conexão e demais erros devem chegar ao chamador.
 */
export function getCampaignRows<T>({ data, error }: CampaignQueryResult<T>): T[] {
  if (error && !['42P01', 'PGRST205'].includes(error.code)) throw error;
  return data ?? [];
}

/**
 * Une registros por ID sem modificar as entradas. A cópia v1 prevalece porque
 * chat, eventos, sussurros e diário ainda gravam nesse schema após a migração.
 */
export function mergeCampaignRows<T extends { id: string }>(legacy: T[], migrated: T[]): T[] {
  const rows = new Map(migrated.map(row => [row.id, row]));
  legacy.forEach(row => rows.set(row.id, row));
  return [...rows.values()];
}

/** Traduz o status persistido em v1 para o status já consumido pelas telas. */
export function normalizeCampaignSession<T extends { status: string }>(session: T): Omit<T, 'status'> & { status: string } {
  return { ...session, status: session.status === 'in_progress' ? 'active' : session.status };
}

/** Retorna as últimas mensagens de ambos os schemas em ordem cronológica. */
export function mergeCampaignMessages<T extends { id: string; created_at: string }>(
  legacy: T[], migrated: T[], limit = 100,
): T[] {
  return mergeCampaignRows(legacy, migrated)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    .slice(-limit);
}
