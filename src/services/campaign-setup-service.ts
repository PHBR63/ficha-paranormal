type SetupWrite = () => PromiseLike<{ data: { id: string } | null; error: unknown }>;

/** Combina data e hora locais em um instante válido antes de gravar a campanha. */
export function getInitialSessionTime(date: Date | null, time: string, now = new Date()): string | null {
  if (!date) return null;
  if (!Number.isFinite(date.getTime()) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error('Selecione uma data e um horário válidos para a primeira sessão.');
  }
  const [hours, minutes] = time.split(':').map(Number);
  const scheduled = new Date(date);
  scheduled.setHours(hours, minutes, 0, 0);
  if (scheduled.getHours() !== hours || scheduled.getMinutes() !== minutes || scheduled <= now) {
    throw new Error('A primeira sessão precisa de um horário futuro válido.');
  }
  return scheduled.toISOString();
}

async function confirmed(write: SetupWrite) {
  try {
    const result = await write();
    return !result.error && Boolean(result.data?.id);
  } catch {
    return false;
  }
}

/** O mundo da campanha já existe. Confirma convite e sessão separadamente, sem recriar a campanha. */
export async function confirmInitialCampaignSetup(invite: SetupWrite, session?: SetupWrite) {
  const inviteConfirmed = await confirmed(invite);
  const sessionConfirmed = session ? await confirmed(session) : null;
  return { inviteConfirmed, sessionConfirmed };
}

/** Gera um convite de formato legado com a mesma fonte aleatória do restante da aplicação. */
export function generateInitialInviteCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}
