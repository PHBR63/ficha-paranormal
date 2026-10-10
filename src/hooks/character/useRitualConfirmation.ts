import { useCallback, useEffect, useRef, useState } from 'react';

export interface RitualConfirmationOutcome { effectsAllowed: boolean }
export type RitualConfirmationResult = boolean | void | RitualConfirmationOutcome | Promise<boolean | void | RitualConfirmationOutcome>;

/**
 * Aguarda a persistência antes de fechar a preparação ou iniciar efeitos.
 * A trava imediata impede clique duplicado antes da próxima renderização.
 * Callbacks legados sem retorno continuam compatíveis; false recusa a conjuração.
 */
export function useRitualConfirmation(open: boolean, scope = 'default') {
  const currentScope = useRef('');
  currentScope.current = `${scope}:${open}`;
  const pending = useRef(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<{ persist: () => RitualConfirmationResult; onSuccess: (result: boolean | void | RitualConfirmationOutcome) => void } | null>(null);
  useEffect(() => { if (open) { setError(null); attempt.current = null; } }, [open, scope]);

  const confirm = useCallback(async (persist: () => RitualConfirmationResult, onSuccess: (result: boolean | void | RitualConfirmationOutcome) => void) => {
    if (pending.current) return;
    pending.current = true;
    setIsConfirming(true);
    setError(null);
    const selection = currentScope.current;
    try {
      attempt.current ??= { persist, onSuccess };
      const frozen = attempt.current;
      const result = await frozen.persist();
      // O recibo pertence à seleção original; não fecha nem inicia efeitos em outra ficha.
      if (currentScope.current !== selection) return;
      if (result === false) {
        setError('A conjuração não foi confirmada. Confira o saldo e a conexão antes de tentar novamente.');
        return;
      }
      frozen.onSuccess(result);
      attempt.current = null;
    } catch {
      if (currentScope.current === selection) setError('Não foi possível confirmar a conjuração. Recarregue a ficha para conferir o saldo.');
    } finally {
      pending.current = false;
      setIsConfirming(false);
    }
  }, []);

  return { confirm, isConfirming, error };
}
