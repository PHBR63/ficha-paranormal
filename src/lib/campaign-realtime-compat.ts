/**
 * Recebe uma sessão persistida e retorna uma cópia com o status de interface.
 * O banco legado usa in_progress; SessionCard e o diário esperam active.
 * Não altera a origem dos dados nem mistura campanhas de versões diferentes.
 */
export function normalizeCampaignSession<T extends { status: string }>(session: T): Omit<T, 'status'> & { status: string } {
  return { ...session, status: session.status === 'in_progress' ? 'active' : session.status };
}
