import { useCallback, useRef, useState } from 'react';
import type { DiceRollResult } from '@/lib/dice-roller';

export type ConfirmDicePE = (nextPE: number) => void | boolean | Promise<void | boolean>;
interface RollConfirmation {
  result: DiceRollResult;
  nextPE?: number;
  confirmPE?: ConfirmDicePE;
  onConfirmed: (result: DiceRollResult) => void;
}

/** Guarda o sorteio enquanto confirma o custo: retry nunca sorteia nem debita outro valor. */
export function useConfirmedDiceRoll() {
  const request = useRef<RollConfirmation | null>(null);
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useCallback(async (input?: RollConfirmation): Promise<boolean> => {
    if (lock.current) return false;
    request.current ??= input ?? null;
    if (!request.current) return false;
    const current = request.current;
    lock.current = true; setConfirming(true); setPending(true); setError(null);
    try {
      if (current.nextPE !== undefined) {
        if (!current.confirmPE) throw new Error('Não há confirmação de PE disponível para esta rolagem.');
        const accepted = await current.confirmPE(current.nextPE);
        if (accepted === false) throw new Error('O gasto de PE não foi confirmado. Tente confirmar novamente ou recarregue a ficha.');
      }
    } catch (cause) {
      if (request.current !== current) return true;
      setError(cause instanceof Error ? cause.message : 'O gasto de PE não foi confirmado.');
      return false;
    } finally { lock.current = false; setConfirming(false); }
    // Fechar cancela a apresentação; um débito já aceito continua no histórico
    // do servidor, sem reabrir o modal nem confirmar uma rolagem diferente.
    if (request.current !== current) return true;
    request.current = null; setPending(false);
    try { current.onConfirmed(current.result); }
    catch { setError('PE confirmado, mas a apresentação ou o histórico não atualizou. Recarregue a ficha.'); }
    return true;
  }, []);
  const reset = useCallback(() => {
    request.current = null; setPending(false); setError(null);
  }, []);
  return { confirm, reset, pending, confirming, error };
}
