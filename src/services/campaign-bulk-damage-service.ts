import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { awaitActivityResponse } from '@/services/character-activity-service';

export const CAMPAIGN_DAMAGE_TYPES = [
  'balístico', 'corte', 'impacto', 'perfuração', 'fogo', 'frio', 'eletricidade',
  'químico', 'sangue', 'morte', 'conhecimento', 'energia',
] as const;
export type CampaignDamageType = typeof CAMPAIGN_DAMAGE_TYPES[number];

export interface CampaignBulkDamageTarget {
  characterId: string;
  damage: number;
  damageType: CampaignDamageType;
  resistedDamage: number;
  damageReduction: number;
  immuneDamage: boolean;
  expectedHp: number;
}

export interface CampaignBulkDamageRequest {
  operationId: string;
  campaignId: string;
  source: string;
  targets: CampaignBulkDamageTarget[];
}

export interface CampaignBulkDamageReceipt {
  operationId: string;
  campaignId: string;
  source: string;
  targets: Array<{
    characterId: string;
    eventId: string;
    grossDamage: number;
    finalDamage: number;
    temporaryHPUsed: number;
    hpBefore: number;
    hpAfter: number;
  }>;
}

/** Erro rejeitado pelo servidor libera revisão; rede incerta exige repetir UUID e payload. */
export class CampaignBulkDamageError extends Error {
  constructor(message: string, readonly confirmedRejected: boolean) { super(message); }
}

type DamageDatabase = { public: {
  Tables: Record<string, never>;
  Views: Record<string, never>;
  Enums: Record<string, never>;
  CompositeTypes: Record<string, never>;
  Functions: {
    confirm_campaign_bulk_damage: { Args: {
      p_operation_id: string; p_campaign_id: string; p_source: string; p_targets: Json;
    }; Returns: Json };
  };
} };
const damageClient = supabase as unknown as SupabaseClient<DamageDatabase>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const pendingKey = (campaignId: string) => `ordem-roll:bulk-damage:${campaignId}`;

/** Valida dados da mesa antes de enviar; a RPC repete essas verificações sob bloqueio. */
function validateRequest(request: CampaignBulkDamageRequest): void {
  if (!UUID.test(request.operationId) || !UUID.test(request.campaignId)
    || request.source.trim().length < 1 || request.source.trim().length > 150
    || request.targets.length < 1 || request.targets.length > 30
    || new Set(request.targets.map(target => target.characterId)).size !== request.targets.length
    || request.targets.some(target => !UUID.test(target.characterId)
      || !CAMPAIGN_DAMAGE_TYPES.includes(target.damageType)
      || !Number.isSafeInteger(target.damage) || target.damage < 1 || target.damage > 1_000_000
      || !Number.isSafeInteger(target.resistedDamage) || target.resistedDamage < 0 || target.resistedDamage > target.damage
      || !Number.isSafeInteger(target.damageReduction) || target.damageReduction < 0 || target.damageReduction > 1_000_000
      || !Number.isSafeInteger(target.expectedHp) || target.expectedHp < 0 || target.expectedHp > 1_000_000
      || typeof target.immuneDamage !== 'boolean')) {
    throw new CampaignBulkDamageError('Confira a origem, o tipo de dano, os valores e os alvos vinculados.', true);
  }
}

/** Guarda o UUID e payload antes do envio para recuperar a mesma operação após reload. */
export function savePendingCampaignBulkDamage(request: CampaignBulkDamageRequest): void {
  validateRequest(request);
  try {
    sessionStorage.setItem(pendingKey(request.campaignId), JSON.stringify(request));
  } catch {
    throw new CampaignBulkDamageError('Não foi possível guardar a operação neste navegador. O dano não foi enviado.', true);
  }
}

/** Restaura somente um pedido válido da campanha corrente. */
export function restorePendingCampaignBulkDamage(campaignId: string): CampaignBulkDamageRequest | null {
  const raw = sessionStorage.getItem(pendingKey(campaignId));
  if (!raw) return null;
  try {
    const request = JSON.parse(raw) as CampaignBulkDamageRequest;
    if (request.campaignId !== campaignId) throw new Error('campanha');
    validateRequest(request);
    return request;
  } catch {
    throw new CampaignBulkDamageError('Há uma operação pendente inválida neste navegador. Confira o histórico antes de iniciar novo dano.', false);
  }
}

/** Limpa o pedido apenas após recibo válido ou rejeição definitiva. */
export function clearPendingCampaignBulkDamage(campaignId: string): void {
  sessionStorage.removeItem(pendingKey(campaignId));
}

/** Envia uma operação atômica de dano v2 e valida o recibo antes de informar sucesso. */
export async function confirmCampaignBulkDamage(request: CampaignBulkDamageRequest): Promise<CampaignBulkDamageReceipt> {
  validateRequest(request);
  let response: Awaited<ReturnType<typeof damageClient.rpc<'confirm_campaign_bulk_damage'>>>;
  try {
    response = await awaitActivityResponse(damageClient.rpc('confirm_campaign_bulk_damage', {
      p_operation_id: request.operationId,
      p_campaign_id: request.campaignId,
      p_source: request.source.trim(),
      p_targets: request.targets as unknown as Json,
    }));
  } catch {
    throw new CampaignBulkDamageError('O servidor ainda não confirmou o dano. Recupere a mesma operação antes de tentar outra.', false);
  }
  if (response.error) {
    const code = response.error.code;
    if (code === '40001') throw new CampaignBulkDamageError('PV de um alvo mudou. Atualize a campanha e confira todos os alvos antes de reenviar.', true);
    if (code === '42501') throw new CampaignBulkDamageError('Sua conta não tem permissão para aplicar dano nesta campanha.', true);
    if (code === '22023') throw new CampaignBulkDamageError('Dados do dano inválidos. Confira os valores declarados.', true);
    if (code === '23505') throw new CampaignBulkDamageError('Esta operação já foi usada com outros dados. Confira o histórico antes de continuar.', true);
    throw new CampaignBulkDamageError('A confirmação do servidor está incerta. Recupere a mesma operação; não envie dano novo.', false);
  }
  const receipt = response.data as unknown as CampaignBulkDamageReceipt | null;
  if (!receipt || receipt.operationId !== request.operationId || receipt.campaignId !== request.campaignId
    || receipt.source !== request.source.trim()
    || !Array.isArray(receipt.targets) || receipt.targets.length !== request.targets.length
    || request.targets.some(target => !receipt.targets.some(saved => saved.characterId === target.characterId
      && UUID.test(saved.eventId) && saved.grossDamage === target.damage
      && saved.hpBefore === target.expectedHp
      && Number.isSafeInteger(saved.finalDamage) && saved.finalDamage >= 0
      && Number.isSafeInteger(saved.temporaryHPUsed) && saved.temporaryHPUsed >= 0
      && saved.temporaryHPUsed <= saved.finalDamage
      && Number.isSafeInteger(saved.hpAfter) && saved.hpAfter >= 0
      && saved.hpAfter === Math.max(0, saved.hpBefore - saved.finalDamage + saved.temporaryHPUsed)))) {
    throw new CampaignBulkDamageError('O recibo está incompleto. Recupere esta operação antes de tentar outra.', false);
  }
  return receipt;
}
