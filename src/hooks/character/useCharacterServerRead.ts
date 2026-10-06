import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Lê a ficha do usuário e retorna apenas a resposta mais recente deste contexto.
 * isCurrent permite conferir novamente após preparação assíncrona (inventário).
 * Não grava recursos nem autoriza acesso: a consulta mantém usuário e RLS.
 */
export function useCharacterServerRead(characterId: string, userId: string) {
  const context = `${userId}:${characterId}`;
  const currentContext = useRef(context);
  currentContext.current = context;
  const sequence = useRef(0);
  const invalidate = useCallback(() => { sequence.current++; }, []);
  useEffect(() => () => { invalidate(); }, [context, invalidate]);

  return useCallback(async () => {
    if (!characterId || !userId || currentContext.current !== context) return null;
    const requestId = ++sequence.current;
    const isCurrent = () => currentContext.current === context && sequence.current === requestId;
    try {
      const { data, error } = await supabase.from('characters').select('*')
        .eq('id', characterId).eq('user_id', userId).single();
      return isCurrent() ? { data, error, isCurrent } : null;
    } catch {
      return isCurrent() ? {
        data: null,
        error: { message: 'Não foi possível carregar a ficha. Verifique a conexão e o acesso.' },
        isCurrent,
      } : null;
    }
  }, [characterId, userId, context]);
}
