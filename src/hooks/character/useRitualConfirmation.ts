import { useCallback, useEffect, useRef, useState } from 'react';

export type RitualConfirmationResult = boolean | void | Promise<boolean | void>;

/**
 * Aguarda a persistência antes de fechar a preparação ou iniciar efeitos.
 * A trava imediata impede clique duplicado antes da próxima renderização.
 * Callbacks legados sem retorno continuam compatíveis; false recusa a conjuração.
 */
export function useRitualConfirmation(open: boolean) {
  const pending = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) setError(null); }, [open]);

  const confirm = useCallback(async (persist: () => RitualConfirmationResult, onSuccess: () => void) => {
    if (pending.current) return;
    pending.current = true;
    setIsConfirming(true);
    setError(null);
    try {
      const result = await persist();
      if (result === false) {
        setError('A conjuração não foi confirmada. Confira o saldo e a conexão antes de tentar novamente.');
        return;
      }
      onSuccess();
    } catch {
      setError('Não foi possível confirmar a conjuração. Recarregue a ficha para conferir o saldo.');
    } finally {
      pending.current = false;
      setIsConfirming(false);
    }
  }, []);

  return { confirm, isConfirming, error };
}
