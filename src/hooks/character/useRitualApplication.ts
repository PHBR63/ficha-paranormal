import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { applyCharacterEffect, castCharacterRitual, type CastCharacterRitualInput } from '@/services/ritual-application-service';
import type { ActivityContext, ActivityPayload, ApplyCharacterEffectInput, CharacterActivityEvent, EffectKind } from '@/types/character-activity';

/** Conserva os pedidos completos entre tentativas; nem saldo esperado nem sorteio mudam no retry. */
export function useRitualApplication(characterId: string, onRefetch?: () => void | Promise<unknown>) {
  const queryClient = useQueryClient();
  const castRef = useRef<CharacterActivityEvent | null>(null);
  const castRequest = useRef<CastCharacterRitualInput | null>(null);
  const operationRef = useRef<string | null>(null);
  const effectsRef = useRef(new Map<string, ApplyCharacterEffectInput>());
  const busyRef = useRef(false);
  const currentCharacter = useRef(characterId);
  currentCharacter.current = characterId;
  const [castEventId, setCastEventId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const beginCast = useCallback(() => {
    if (busyRef.current) { setError('Aguarde a confirmação da operação atual.'); return false; }
    castRef.current = null; castRequest.current = null; operationRef.current = crypto.randomUUID(); effectsRef.current.clear(); setCastEventId(undefined); setError(null); return true;
  }, []);
  useEffect(() => { castRef.current = null; castRequest.current = null; operationRef.current = null; effectsRef.current.clear(); setCastEventId(undefined); setError(null); }, [characterId]);
  const refresh = useCallback(async () => {
    try { await queryClient.invalidateQueries({ queryKey: ['character-activity'] }); const refreshed = await onRefetch?.(); if (refreshed === null) throw new Error('Ficha não atualizada.'); }
    catch { setError('Operação confirmada pelo servidor, mas a tela não atualizou. Recarregue a ficha.'); }
  }, [queryClient, onRefetch]);
  const cast = useCallback(async (expectedPE: number, peCost: number, payload: ActivityPayload, context: ActivityContext = {}, preparePayload?: () => ActivityPayload) => {
    if (busyRef.current) throw new Error('Aguarde a confirmação da operação atual.');
    busyRef.current = true; setBusy(true); setError(null);
    operationRef.current ??= crypto.randomUUID();
    try {
      castRequest.current ??= { characterId, operationId: operationRef.current, expectedPE, peCost, payload: JSON.parse(JSON.stringify({ ...payload, ...preparePayload?.() })) as ActivityPayload, ...context };
      const request = castRequest.current;
      const event = await castCharacterRitual(request);
      if (currentCharacter.current === characterId) { castRef.current = event; setCastEventId(event.id); }
      await refresh(); return event;
    } catch (cause) { if (currentCharacter.current === characterId) setError(cause instanceof Error ? cause.message : 'Conjuração não confirmada.'); throw cause; }
    finally { busyRef.current = false; setBusy(false); }
  }, [characterId, refresh]);
  const apply = useCallback(async (kind: EffectKind, value: Json, expected: ActivityPayload, targetCharacterId = characterId) => {
    if (!castRef.current) throw new Error('Confirme a conjuração antes de aplicar efeitos.');
    const castPayload = castRef.current.payload;
    if (castPayload && typeof castPayload === 'object' && !Array.isArray(castPayload) && castPayload.castingOutcome === 'failed_concentration') {
      throw new Error('A concentração falhou. Este ritual não pode aplicar efeitos.');
    }
    if (busyRef.current) throw new Error('Aguarde a confirmação da operação atual.');
    const key = `${castRef.current.id}:${targetCharacterId}:${kind}`;
    busyRef.current = true; setBusy(true); setError(null);
    try {
      let request = effectsRef.current.get(key);
      if (!request) {
        // Captura a ficha autorizada atual antes do primeiro pedido. Em retry,
        // conserva exatamente esse estado para reconhecer uma confirmação perdida.
        const { data, error: readError } = await supabase.from('characters').select('hp_current,hp_max,conditions,active_buffs').eq('id', targetCharacterId).single();
        if (readError || !data) throw new Error('Não foi possível consultar o estado atual do alvo. Recarregue a ficha.');
        const snapshot: ActivityPayload = kind === 'conditions' ? { conditions: data.conditions } : kind === 'heal' || kind === 'damage' ? { hp_current: data.hp_current, hp_max: data.hp_max } : kind === 'weapon_buff' ? { active_buffs: data.active_buffs } : expected;
        request = { characterId: targetCharacterId, operationId: crypto.randomUUID(), kind, value: JSON.parse(JSON.stringify(value)) as Json, expected: JSON.parse(JSON.stringify(snapshot)) as ActivityPayload, castEventId: castRef.current.id,
          campaignId: castRef.current.campaign_id ?? undefined, campaignVersion: castRef.current.campaign_version ?? undefined };
        effectsRef.current.set(key, request);
      }
      const event = await applyCharacterEffect(request); await refresh(); return event;
    }
    catch (cause) { if (currentCharacter.current === characterId) setError(cause instanceof Error ? cause.message : 'Efeito não confirmado.'); throw cause; }
    finally { busyRef.current = false; setBusy(false); }
  }, [characterId, refresh]);
  return { beginCast, cast, apply, castEventId, error, busy };
}
