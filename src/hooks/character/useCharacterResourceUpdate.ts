import { useCallback, useEffect, useRef, useState } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { confirmResourceBundle, type ResourceBundleInput } from '@/services/character-resource-service';
import { activityJson } from '@/services/character-activity-service';
import type { ActivityPayload, CharacterActivityEvent } from '@/types/character-activity';

/** Confirma a edição conjunta; uma resposta perdida conserva UUID e snapshot para retry. */
export function useCharacterResourceUpdate(characterId: string) {
  const requests = useRef(new Map<string, ResourceBundleInput>());
  const busyRef = useRef(false);
  const scope = useRef(characterId);
  scope.current = characterId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { requests.current.clear(); setError(null); }, [characterId]);

  const execute = useCallback(async (
    values: ResourceBundleInput['values'], conditions: Json[], expected: ActivityPayload,
  ): Promise<CharacterActivityEvent | false> => {
    if (busyRef.current) {
      setError('Aguarde a confirmação da alteração atual.');
      return false;
    }
    busyRef.current = true;
    setBusy(true);
    setError(null);
    let key: string | undefined;
    try {
      // O estado esperado não integra a chave: a mesma edição após falha de rede
      // deve repetir o primeiro pedido, mesmo que a tela tenha recebido novo saldo.
      const nextValues = { hp: values.hp, pe: values.pe, san: values.san };
      key = JSON.stringify([characterId, nextValues]);
      let request = requests.current.get(key);
      if (!request) {
        request = {
          characterId, operationId: crypto.randomUUID(), values: nextValues,
          conditions: activityJson(conditions) as Json[],
          expected: activityJson(expected) as ActivityPayload,
        };
        requests.current.set(key, request);
      }
      const event = await confirmResourceBundle(request);
      requests.current.delete(key);
      // Não entrega o recibo da ficha anterior para quem atualiza o estado da tela.
      return scope.current === characterId ? event : false;
    } catch (cause) {
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
      if (key && ['40001', '42501', '22023'].includes(String(code))) requests.current.delete(key);
      if (scope.current === characterId) setError(cause instanceof Error ? cause.message : 'A alteração não foi confirmada pelo servidor.');
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [characterId]);

  return { execute, busy, error };
}

