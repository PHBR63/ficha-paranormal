import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CampaignVersion = 'v1' | 'v2';
type InviteRow = Database['public']['Tables']['campaign_invites']['Row'];
export interface CampaignJoinReceipt { campaign_id: string; campaign_version: CampaignVersion; campaign_name: string; already_member: boolean }
type InviteDatabase = { public: {
  Tables: { campaign_invites_v2: { Row: InviteRow; Insert: never; Update: never; Relationships: [] } };
  Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  Functions: {
    create_campaign_invite_v2: { Args: { p_campaign_id: string; p_max_uses?: number; p_expires_at?: string }; Returns: InviteRow };
    join_campaign_with_invite: { Args: { p_code: string; p_character_id?: string }; Returns: CampaignJoinReceipt[] };
  };
} };
const inviteClient = supabase as unknown as SupabaseClient<InviteDatabase>;
// Só mensagens de validação controladas pelo servidor podem chegar à interface.
const failure = (error: { message: string; code?: string } | null, message: string) =>
  new Error(error && ['22023', '42501', '23505'].includes(error.code ?? '') && !/constraint|relation|column|schema|duplicate key/i.test(error.message) ? error.message : message);

/** Entrada atômica valida convite, propriedade da ficha e consumo no servidor para v1/v2. */
export async function joinCampaignInvite(code: string, characterId?: string): Promise<CampaignJoinReceipt> {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length > 80) throw new Error('Informe um código de convite válido.');
  const { data, error } = await inviteClient.rpc('join_campaign_with_invite', { p_code: normalized, ...(characterId ? { p_character_id: characterId } : {}) });
  const receipt = data?.[0];
  if (error || !receipt || !receipt.campaign_id || !['v1', 'v2'].includes(receipt.campaign_version)) throw failure(error, 'A entrada na campanha não foi confirmada pelo servidor.');
  return receipt;
}

/** Exibe apenas códigos ainda utilizáveis; falha de consulta não significa ausência de convite. */
export async function loadCampaignInvite(campaignId: string, version: CampaignVersion): Promise<string | null> {
  const query = version === 'v2' ? inviteClient.from('campaign_invites_v2') : supabase.from('campaign_invites');
  const { data, error } = await query.select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false }).limit(20);
  if (error) throw failure(error, 'Não foi possível carregar o convite.');
  const active = data?.find(invite => (invite.max_uses === null || invite.uses < invite.max_uses) && (!invite.expires_at || new Date(invite.expires_at).getTime() > Date.now()));
  return active?.invite_code ?? null;
}

/** v2 usa criação autorizada por RPC; v1 preserva sua tabela e confirma a linha retornada. */
export async function createCampaignInvite(campaignId: string, userId: string, version: CampaignVersion): Promise<string> {
  if (version === 'v2') {
    const { data, error } = await inviteClient.rpc('create_campaign_invite_v2', { p_campaign_id: campaignId, p_max_uses: 10 });
    if (error || !data || data.campaign_id !== campaignId || !data.invite_code) throw failure(error, 'O convite não foi confirmado pelo servidor.');
    return data.invite_code;
  }
  const code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const { data, error } = await supabase.from('campaign_invites').insert({ campaign_id: campaignId, invite_code: code, created_by: userId, max_uses: 10 }).select('campaign_id, invite_code').single();
  if (error || !data || data.campaign_id !== campaignId) throw failure(error, 'O convite não foi confirmado pelo servidor.');
  return data.invite_code;
}

/** Atualização exige a linha autorizada, evitando sucesso falso quando RLS impede a operação. */
export async function saveCampaignSettings(campaignId: string, version: CampaignVersion, name: string, description: string): Promise<void> {
  if (!name.trim()) throw new Error('Nome da campanha é obrigatório.');
  const { data, error } = await supabase.from(version === 'v2' ? 'campaigns_v2' : 'campaigns').update({ name: name.trim(), description: description.trim() || null }).eq('id', campaignId).select('id').single();
  if (error || data?.id !== campaignId) throw failure(error, 'As configurações não foram confirmadas pelo servidor.');
}

/** Remove somente o membro da campanha selecionada e exige confirmação do servidor. */
export async function removeCampaignMember(campaignId: string, version: CampaignVersion, memberId: string): Promise<void> {
  const { data, error } = await supabase.from(version === 'v2' ? 'campaign_members_v2' : 'campaign_members').delete().eq('id', memberId).eq('campaign_id', campaignId).select('id').single();
  if (error || data?.id !== memberId) throw failure(error, 'A remoção não foi confirmada pelo servidor.');
}
