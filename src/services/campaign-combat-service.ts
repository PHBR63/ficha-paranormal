import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { campaignCombatSchema, emptyCampaignCombat, type CampaignCombatState } from '@/lib/campaign-combat';

type CombatRow = { campaign_id: string; revision: number; state: Json; updated_at: string };

// Contrato isolado da migration nova; evita alterar tipos gerados de outras tabelas.
type CombatDatabase = { public: {
  Tables: { campaign_combat_state_v2: { Row: CombatRow; Insert: never; Update: never; Relationships: [] } };
  Functions: { save_campaign_combat_v2: { Args: { p_campaign_id: string; p_expected_revision: number; p_state: Json }; Returns: CombatRow[] } };
  Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
} };

const combatClient = supabase as unknown as SupabaseClient<CombatDatabase>;
export interface CombatSnapshot { revision: number; state: CampaignCombatState }

/** Consulta estado autorizado pelas políticas; registro ausente significa combate vazio. */
export async function loadCampaignCombat(campaignId: string): Promise<CombatSnapshot> {
  const { data, error } = await combatClient.from('campaign_combat_state_v2').select('*').eq('campaign_id', campaignId).maybeSingle();
  if (error) throw error;
  return data ? { revision: data.revision, state: campaignCombatSchema.parse(data.state) } : { revision: 0, state: emptyCampaignCombat() };
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
  return { revision: saved.revision, state: campaignCombatSchema.parse(saved.state) };
}
