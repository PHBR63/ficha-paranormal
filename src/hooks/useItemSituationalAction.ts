import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { activityClient, awaitActivityResponse, confirmActivity } from '@/services/character-activity-service';
import type { Json } from '@/integrations/supabase/types';
import type { CharacterActivityEvent } from '@/types/character-activity';

/** Conserva o mesmo pedido após resposta incerta: o servidor recupera o recibo sem rerrolar. */
export function useItemSituationalAction(characterId: string, onRefetch: () => unknown | Promise<unknown>,
  procedure: 'confirm_character_item_action' | 'confirm_character_fragmentation_throw' |
    'confirm_character_fragmentation_targets' | 'confirm_character_fragmentation_damage' |
    'confirm_character_explosive_action' | 'confirm_character_explosive_targets' |
    'confirm_character_explosive_effect' | 'confirm_character_explosive_control' |
    'confirm_character_post_attack_stealth' | 'confirm_character_estrategista' |
    'confirm_character_inspirar_confianca' | 'confirm_character_paramedico' |
    'confirm_character_equipe_trauma' | 'confirm_character_resgate_movement' |
    'confirm_character_reanimacao_death' | 'confirm_character_reanimacao' = 'confirm_character_item_action') {
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
      const response = await awaitActivityResponse(activityClient.rpc(procedure, {
        p_operation_id: command.id, p_character_id: command.characterId, p_request: command.request,
      }));
      if (response.error) {
        // Erros determinísticos do banco não executaram a transação. Rede/timeout exigem recuperação.
        if (['22023', '22P02', '40001', '42501', '23505', '55002', '55004'].includes(response.error.code)) { intent.current = undefined; setUncertain(false); }
        throw new Error(response.error.code === '42501' ? 'Você não tem permissão para esta ficha.'
          : response.error.code === '40001' ? 'O estado da ficha ou do turno mudou. Atualize a página antes de tentar novamente.'
          : ['55002', '55004', '22023'].includes(response.error.code) ? response.error.message
          : 'O servidor não confirmou. Recupere a mesma tentativa antes de iniciar outra.');
      }
      const event = confirmActivity(response.data, command.characterId, command.id);
      intent.current = undefined; setUncertain(false); setReceipt(event);
      if (['confirm_character_paramedico', 'confirm_character_equipe_trauma',
        'confirm_character_reanimacao_death', 'confirm_character_reanimacao'].includes(procedure)) {
        window.dispatchEvent(new Event('character-medico-support-updated'));
      }
      const targetId = command.request && typeof command.request === 'object' && !Array.isArray(command.request)
        && typeof command.request.targetId === 'string' ? command.request.targetId : command.characterId;
      // O recibo é definitivo; saldos são recarregados mesmo se o realtime estiver indisponível.
      const refreshes = await Promise.allSettled([...new Set([command.characterId, targetId])].flatMap(id => [
        // O histórico usa [família, usuário, ficha, filtros]; a ficha está na terceira posição.
        queries.invalidateQueries({ predicate: query => query.queryKey[0] === 'character-activity' && query.queryKey[2] === id }),
        queries.invalidateQueries({ queryKey: ['temporary-resources', id] }),
      ]).concat([
        // A cobrança pode esgotar o limite do turno mesmo sem evento realtime.
        queries.invalidateQueries({ predicate: query => query.queryKey[0] === 'pe-turn-budget'
          && query.queryKey[2] === command.characterId }),
      ]));
      if (refreshes.some(result => result.status === 'rejected')) setError('Ação confirmada. Recarregue para conferir os saldos; não repita a aplicação.');
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
