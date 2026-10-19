import { useCallback, useEffect, useRef, useState } from 'react';
import { confirmMirar, dismissMirar, getMirarStatus, type MirarStatus } from '@/services/mirar-service';

/** Estado pequeno e compartilhado pelos ataques desktop/mobile; recupera Mirar após reconexão. */
export function useMirarAction(characterId: string | undefined, weaponId: string | undefined, open: boolean) {
  const [status, setStatus] = useState<MirarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operationId = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    if (!characterId) { setStatus(null); return; }
    try { setStatus(await getMirarStatus(characterId)); setError(''); }
    catch (cause) { setStatus(null); setError(cause instanceof Error ? cause.message : 'Não foi possível conferir Mirar.'); }
  }, [characterId]);
  useEffect(() => { if (open) void refresh(); }, [open, refresh]);
  const register = async (turnKey: string | null | undefined, weaponId: string | undefined, afterConfirmed?: () => Promise<unknown>) => {
    if (!characterId || !weaponId || busy) return;
    setBusy(true); setError('');
    operationId.current ??= crypto.randomUUID();
    try {
      await confirmMirar(characterId, operationId.current, turnKey ?? null, weaponId);
      // O ataque só deve ser habilitado após a ficha mostrar o saldo já debitado.
      await afterConfirmed?.();
      await refresh();
      operationId.current = null;
    }
    catch (cause) {
      const failure = cause as Error & { serverRejected?: boolean };
      if (failure.serverRejected) operationId.current = null;
      setError(failure.message || 'Mirar não confirmado. Repita a mesma tentativa.');
    } finally { setBusy(false); }
  };
  const dismiss = async () => {
    if (!characterId || !status?.available || !status.operationId || busy) return;
    setBusy(true); setError('');
    try { await dismissMirar(characterId, status.operationId); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível encerrar Mirar.'); }
    finally { setBusy(false); }
  };
  const consumed = () => { setStatus(null); setError(''); void refresh(); };
  return { registered: !!status?.available && status.weaponId === weaponId,
    pending: !!status?.available, pendingWeaponId: status?.weaponId,
    busy, error, register, dismiss, refresh, consumed };
}
