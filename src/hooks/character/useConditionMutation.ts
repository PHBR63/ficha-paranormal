import { useCallback, useRef, useState } from 'react';

/** Aguarda persistência e bloqueia cliques concorrentes; falhas permanecem visíveis na tela. */
export function useConditionMutation<T>(onChange: (conditions: T[]) => void | Promise<void>) {
  const pending = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveConditions = useCallback(async (conditions: T[]) => {
    if (pending.current) return false;
    pending.current = true;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onChange(conditions);
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar as condições. Tente novamente.');
      return false;
    } finally {
      pending.current = false;
      setIsSaving(false);
    }
  }, [onChange]);
  return { saveConditions, isSaving, saveError };
}
