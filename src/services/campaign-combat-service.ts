import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { campaignCombatSchema, emptyCampaignCombat, type CampaignCombatState } from '@/lib/campaign-combat';

type CombatRow = { campaign_id: string; revision: number; state: Json; updated_at: string; scene_number: number; last_scene_ended_at: string | null; turn_instance_id: string };
export type SceneEndReceipt = { operation_id: string; campaign_id: string; scene_number: number; ended_combat: boolean; created_at: string; expired_effects_count?: number | null };

// Contrato isolado da migration nova; evita alterar tipos gerados de outras tabelas.
type CombatDatabase = { public: {
  Tables: {
    campaign_combat_state_v2: { Row: CombatRow; Insert: never; Update: never; Relationships: [] };
    campaign_scene_events_v2: { Row: SceneEndReceipt; Insert: never; Update: never; Relationships: [] };
  };
  Functions: {
    save_campaign_combat_v2: { Args: { p_campaign_id: string; p_expected_revision: number; p_state: Json }; Returns: CombatRow[] };
    end_campaign_scene_v2: { Args: { p_operation_id: string; p_campaign_id: string; p_expected_revision: number; p_end_combat: boolean }; Returns: CombatRow[] };
  };
  Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
} };

const combatClient = supabase as unknown as SupabaseClient<CombatDatabase>;
export interface CombatSnapshot { revision: number; state: CampaignCombatState; sceneNumber?: number; lastSceneEndedAt?: string | null; turnInstanceId?: string }

/** Normaliza o contrato do servidor; não deriva a cena da rodada do combate. */
function snapshotFromRow(row: CombatRow): CombatSnapshot {
  return { revision: row.revision, state: campaignCombatSchema.parse(row.state), sceneNumber: row.scene_number, lastSceneEndedAt: row.last_scene_ended_at, turnInstanceId: row.turn_instance_id };
}

/** Consulta estado autorizado pelas políticas; registro ausente significa combate vazio. */
export async function loadCampaignCombat(campaignId: string): Promise<CombatSnapshot> {
  const { data, error } = await combatClient.from('campaign_combat_state_v2').select('*').eq('campaign_id', campaignId).maybeSingle();
  if (error) throw error;
  return data ? snapshotFromRow(data) : { revision: 0, state: emptyCampaignCombat(), sceneNumber: 1, lastSceneEndedAt: null };
}

/** Grava por revisão esperada. O servidor rejeita outra aba com estado desatualizado. */
export async function saveCampaignCombat(campaignId: string, expectedRevision: number, state: CampaignCombatState): Promise<CombatSnapshot> {
  const validState = campaignCombatSchema.parse(state);
  const { data, error } = await combatClient.rpc('save_campaign_combat_v2', {
    p_campaign_id: campaignId, p_expected_revision: expectedRevision, p_state: JSON.parse(JSON.stringify(validState)) as Json,
  });
  if (error) throw error;
  const saved = data?.[0];
  if (!saved) throw new Error('O servidor não confirmou o salvamento do combate.');
  return snapshotFromRow(saved);
}

/** Encerra uma cena com UUID reutilizável, revisão esperada e autorização do mestre no servidor. */
export async function endCampaignScene(campaignId: string, expectedRevision: number, endCombat: boolean, operationId: string): Promise<CombatSnapshot> {
  const { data, error } = await combatClient.rpc('end_campaign_scene_v2', {
    p_operation_id: operationId, p_campaign_id: campaignId, p_expected_revision: expectedRevision, p_end_combat: endCombat,
  });
  if (error) throw error;
  const saved = data?.[0];
  if (!saved) throw new Error('O servidor não confirmou o encerramento da cena.');
  return snapshotFromRow(saved);
}

/** Página de dez recibos por campanha, com cursor estável por número de cena. */
export async function loadCampaignSceneHistory(campaignId: string, beforeScene?: number) {
  let query = combatClient.from('campaign_scene_events_v2').select('operation_id,campaign_id,scene_number,ended_combat,created_at,expired_effects_count')
    .eq('campaign_id', campaignId).order('scene_number', { ascending: false }).limit(11);
  if (beforeScene !== undefined) query = query.lt('scene_number', beforeScene);
  const { data, error } = await query;
  if (error) throw error;
  const entries = (data ?? []).slice(0, 10);
  return { entries, nextCursor: (data?.length ?? 0) > 10 ? entries.at(-1)?.scene_number : undefined };
}
