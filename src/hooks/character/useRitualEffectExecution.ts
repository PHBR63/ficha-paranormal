import { useCallback, useRef, useState } from 'react';

/** Aguarda a aplicação do efeito e mantém a etapa aberta se o servidor recusar. */
export function useRitualEffectExecution() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apply: (() => void | Promise<void>) | undefined, advance: () => void) => {
    if (locked.current) return;
    if (!apply) {
      setError('Aplicação automática indisponível. O efeito permanece pendente; os PE consumidos não são estornados.');
      return;
    }
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      await apply();
      advance();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'O servidor não confirmou o efeito. Tente novamente.');
    } finally {
      locked.current = false;
      setPending(false);
    }
  }, []);

  return { execute, pending, error };
}
