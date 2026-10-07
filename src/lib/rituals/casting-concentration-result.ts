import type { Json } from '@/integrations/supabase/types';
/** Usa exclusivamente o resultado confirmado no recibo, inclusive em retry. */
export function getConcentrationFailureMessage(payload: Json): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || payload.castingOutcome !== 'failed_concentration') return null;
  return `${payload.peCost} PE consumidos. O ritual não funciona e seus efeitos estão bloqueados. Confira os testes de Vontade no histórico salvo.`;
}
