import { useCallback, useEffect, useRef, useState } from 'react';
import { confirmMirar, getMirarStatus } from '@/services/mirar-service';

/** Estado pequeno e compartilhado pelos ataques desktop/mobile; recupera Mirar após reconexão. */
export function useMirarAction(characterId: string | undefined, controlled: boolean, open: boolean) {
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operationId = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    if (!characterId || !controlled) { setRegistered(false); return; }
    try { setRegistered(await getMirarStatus(characterId)); setError(''); }
    catch (cause) { setRegistered(false); setError(cause instanceof Error ? cause.message : 'Não foi possível conferir Mirar.'); }
  }, [characterId, controlled]);
  useEffect(() => { if (open) void refresh(); }, [open, refresh]);
  const register = async (turnKey: string | null | undefined, weaponId: string | undefined) => {
    if (!characterId || !controlled || !turnKey || !weaponId || busy) return;
    setBusy(true); setError('');
    operationId.current ??= crypto.randomUUID();
    try { await confirmMirar(characterId, operationId.current, turnKey, weaponId); operationId.current = null; await refresh(); }
    catch (cause) {
      const failure = cause as Error & { serverRejected?: boolean };
      if (failure.serverRejected) operationId.current = null;
      setError(failure.message || 'Mirar não confirmado. Repita a mesma tentativa.');
    } finally { setBusy(false); }
  };
  const consumed = () => { setRegistered(false); setError(''); void refresh(); };
  return { registered, busy, error, register, refresh, consumed };
}
