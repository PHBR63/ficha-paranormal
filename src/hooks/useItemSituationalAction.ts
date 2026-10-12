import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { activityClient, awaitActivityResponse, confirmActivity } from '@/services/character-activity-service';
import type { Json } from '@/integrations/supabase/types';
import type { CharacterActivityEvent } from '@/types/character-activity';

/** Conserva o mesmo pedido após resposta incerta: o servidor recupera o recibo sem rerrolar. */
export function useItemSituationalAction(characterId: string, onRefetch: () => unknown | Promise<unknown>) {
  const queries = useQueryClient();
  const running = useRef(false);
  const intent = useRef<{ id: string; characterId: string; request: Json } | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<CharacterActivityEvent | null>(null);
  const confirm = async (request: Json) => {
    if (running.current) return;
    running.current = true; setBusy(true); setError(''); setReceipt(null);
    // Não reaproveita uma intenção de outra ficha: o componente também recebe key por ficha.
    if (!intent.current || intent.current.characterId !== characterId) intent.current = { id: crypto.randomUUID(), characterId, request };
    const command = intent.current;
    try {
      const response = await awaitActivityResponse(activityClient.rpc('confirm_character_item_action', {
        p_operation_id: command.id, p_character_id: command.characterId, p_request: command.request,
      }));
      if (response.error) {
        // Erros determinísticos do banco não executaram a transação. Rede/timeout exigem recuperação.
        if (['22023', '40001', '42501', '23505', '55004'].includes(response.error.code)) { intent.current = undefined; setUncertain(false); }
        throw new Error(response.error.code === '42501' ? 'Você não tem permissão para esta ficha.'
          : response.error.code === '40001' ? 'A ficha ou o item mudou. Atualize a página antes de tentar novamente.'
          : response.error.code === '55004' || response.error.code === '22023' ? response.error.message
          : 'O servidor não confirmou. Recupere a mesma tentativa antes de iniciar outra.');
      }
      const event = confirmActivity(response.data, command.characterId, command.id);
      intent.current = undefined; setUncertain(false); setReceipt(event);
      await queries.invalidateQueries({ queryKey: ['character-activity', command.characterId] });
      try { if (await onRefetch() === null) throw new Error('Ficha não atualizada'); }
      catch { setError('A ação foi confirmada, mas a ficha não atualizou. Recarregue para conferir; não repita a ação.'); }
    } catch (failure) {
      setUncertain(!!intent.current);
      setError(failure instanceof Error ? failure.message : 'Não foi possível confirmar. Recupere a mesma tentativa.');
    } finally { running.current = false; setBusy(false); }
  };
  return { busy, uncertain, error, receipt, confirm,
    recover: () => intent.current ? confirm(intent.current.request) : Promise.resolve() };
}
