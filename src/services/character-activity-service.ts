import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { ActivityCategory, ActivityContext, ActivityCursor, ActivityPayload, ActivitySession, CharacterActivityEvent } from '@/types/character-activity';

type Visibility = { user_id: string; character_id: string; hidden_before: string | null };
type ActivityRow = { [Key in keyof CharacterActivityEvent]: CharacterActivityEvent[Key] };
type ContextArgs = { p_campaign_id?: string; p_campaign_version?: 'v1' | 'v2' };
type ActivityDatabase = { public: {
  Tables: {
    character_activity_visibility: { Row: Visibility; Insert: never; Update: never; Relationships: [] };
    character_activity_events: { Row: ActivityRow; Insert: never; Update: never; Relationships: [] };
  }; Views: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never>;
  Functions: {
    list_character_activity: { Args: { p_character_id: string; p_limit: number; p_category?: ActivityCategory; p_before_created_at?: string; p_before_id?: string; p_include_hidden: boolean }; Returns: CharacterActivityEvent[] };
    list_character_activity_filtered: { Args: { p_character_id: string; p_limit: number; p_category?: ActivityCategory; p_before_created_at?: string; p_before_id?: string; p_include_hidden: boolean; p_after_created_at?: string; p_session_id?: string; p_session_campaign_id?: string; p_session_campaign_version?: 'v1' | 'v2' }; Returns: CharacterActivityEvent[] };
    list_character_activity_sessions: { Args: { p_character_id: string }; Returns: ActivitySession[] };
    record_character_activity: { Args: { p_operation_id: string; p_character_id: string; p_category: 'roll'; p_payload: Json } & ContextArgs; Returns: CharacterActivityEvent };
    cast_character_ritual: { Args: { p_operation_id: string; p_character_id: string; p_expected_pe: number; p_pe_cost: number; p_payload: Json } & ContextArgs; Returns: CharacterActivityEvent };
    apply_character_effect: { Args: { p_operation_id: string; p_character_id: string; p_kind: string; p_value: Json; p_expected: Json; p_cast_event_id?: string } & ContextArgs; Returns: CharacterActivityEvent };
    hide_character_activity: { Args: { p_character_id: string; p_hidden: boolean }; Returns: Visibility };
    change_character_resource: { Args: { p_operation_id: string; p_character_id: string; p_resource: 'hp' | 'pe' | 'san'; p_mode: 'delta' | 'set'; p_value: number; p_expected_current: number; p_expected_max: number }; Returns: CharacterActivityEvent };
    replace_character_conditions: { Args: { p_operation_id: string; p_character_id: string; p_conditions: Json; p_expected: Json }; Returns: CharacterActivityEvent };
    change_character_resources: { Args: { p_operation_id: string; p_character_id: string; p_values: Json; p_expected: Json; p_conditions: Json }; Returns: CharacterActivityEvent };
    resolve_character_condition_turn: { Args: { p_operation_id: string; p_character_id: string; p_values: Json; p_expected: Json; p_conditions: Json; p_resolution: Json }; Returns: CharacterActivityEvent };
  };
} };
/** Contrato local da migration; mantém o cliente autenticado e suas políticas. */
export const activityClient = supabase as unknown as SupabaseClient<ActivityDatabase>;
/** Libera a interface se a resposta não chegar; o pedido original pode continuar no servidor.
 * O chamador deve conservar UUID e payload para recuperar o recibo sem duplicar o efeito.
 */
export async function awaitActivityResponse<T>(request: PromiseLike<T>, timeoutMs = 30000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('O servidor ainda não confirmou. O pedido pode estar em processamento. Repita a mesma confirmação para recuperar o resultado.')), timeoutMs);
  });
  try { return await Promise.race([Promise.resolve(request), timeout]); }
  finally { clearTimeout(timer); }
}
/** Traduz falhas sem expor consultas, identificadores ou detalhes internos do banco. */
export function activityFailure(context: string, error: { code?: string }): Error {
  const detail = error.code === '40001' ? 'O estado da ficha mudou. Recarregue antes de uma nova ação.'
    : error.code === '55000' ? 'A cena da conjuração foi encerrada. O efeito continua pendente para conferência do mestre; PE não foi estornado.'
    : error.code === '42501' ? 'Sua conta não tem permissão para esta ação.'
    : error.code === '23505' ? 'A operação já existe com outros dados. Confira o histórico antes de continuar.'
    : error.code === '0A000' ? 'Este efeito exige conferência e aplicação manual.'
    : error.code === '22023' ? 'Os dados da operação são inválidos. Confira os valores.'
    : 'Confira a conexão e tente novamente usando a mesma operação.';
  return new Error(`${context} ${detail}`);
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateActivityId(id: string): void {
  if (!UUID.test(id)) throw new Error('Identificador inválido. Reabra a ficha.');
}
export function activityContextArgs(context: ActivityContext): ContextArgs {
  if (Boolean(context.campaignId) !== Boolean(context.campaignVersion)) throw new Error('Contexto da campanha incompleto.');
  if (context.campaignId) validateActivityId(context.campaignId);
  return { p_campaign_id: context.campaignId, p_campaign_version: context.campaignVersion };
}
/** Serializa apenas dados JSON; datas seguem ISO, sem alterar o resultado sorteado. */
export function activityJson(payload: unknown): Json {
  const serialized = JSON.stringify(payload);
  if (!serialized || serialized.length > 64000) throw new Error('Registro inválido ou muito grande.');
  return JSON.parse(serialized) as Json;
}
export function confirmActivity(data: CharacterActivityEvent | null, characterId: string, operationId: string): CharacterActivityEvent {
  if (!data || data.character_id !== characterId || data.operation_id !== operationId) throw new Error('O servidor não confirmou esta operação na ficha correta.');
  return data;
}
/** Paginação por cursor estável evita deslocamento quando chegam novos registros. */
export async function listCharacterActivity(characterId: string, options: { category?: ActivityCategory; cursor?: ActivityCursor; includeHidden?: boolean; limit?: number; afterCreatedAt?: string; session?: ActivitySession } = {}): Promise<CharacterActivityEvent[]> {
  validateActivityId(characterId);
  if (options.afterCreatedAt && !Number.isFinite(Date.parse(options.afterCreatedAt))) throw new Error('Período inválido.');
  if (options.session) { validateActivityId(options.session.id); validateActivityId(options.session.campaign_id); }
  const { data, error } = await activityClient.rpc('list_character_activity_filtered', {
    p_character_id: characterId, p_limit: options.limit ?? 30, p_category: options.category,
    p_before_created_at: options.cursor?.createdAt, p_before_id: options.cursor?.id, p_include_hidden: options.includeHidden ?? false,
    p_after_created_at: options.afterCreatedAt, p_session_id: options.session?.id,
    p_session_campaign_id: options.session?.campaign_id, p_session_campaign_version: options.session?.campaign_version,
  });
  if (error) throw activityFailure('Não foi possível carregar o histórico.', error);
  if (!data || data.some(event => event.character_id !== characterId)) throw new Error('O servidor retornou um histórico inválido.');
  return data;
}
/** Sessões presentes no histórico completo, sem depender da página ou período visível. */
export async function listCharacterActivitySessions(characterId: string): Promise<ActivitySession[]> {
  validateActivityId(characterId);
  const { data, error } = await activityClient.rpc('list_character_activity_sessions', { p_character_id: characterId });
  if (error) throw activityFailure('Não foi possível carregar as sessões do histórico.', error);
  return data ?? [];
}
/** O operationId deve ser reutilizado em tentativas do mesmo registro. */
export async function recordCharacterRoll(characterId: string, operationId: string, payload: ActivityPayload, context: ActivityContext = {}): Promise<CharacterActivityEvent> {
  validateActivityId(characterId); validateActivityId(operationId);
  const { data, error } = await activityClient.rpc('record_character_activity', {
    p_operation_id: operationId, p_character_id: characterId, p_category: 'roll', p_payload: activityJson(payload), ...activityContextArgs(context),
  });
  if (error) throw activityFailure('A rolagem ainda não foi salva.', error);
  return confirmActivity(data, characterId, operationId);
}
/** Limpar oculta somente para o usuário atual; nenhum evento é excluído. */
export async function hideCharacterActivity(characterId: string, hidden = true): Promise<void> {
  validateActivityId(characterId);
  const { data, error } = await activityClient.rpc('hide_character_activity', { p_character_id: characterId, p_hidden: hidden });
  if (error) throw activityFailure('Não foi possível atualizar a visualização.', error);
  if (!data || data.character_id !== characterId) throw new Error('A visualização não foi confirmada pelo servidor.');
}

/** Preferência do usuário autenticado; RLS impede ler a ocultação de outra conta. */
export async function getCharacterActivityHiddenBefore(characterId: string): Promise<string | null> {
  validateActivityId(characterId);
  const { data, error } = await activityClient.from('character_activity_visibility').select('hidden_before').eq('character_id', characterId).maybeSingle();
  if (error) throw new Error('Não foi possível carregar a preferência do histórico. Tente novamente.');
  return data?.hidden_before ?? null;
}

/** Feed autorizado da campanha; v1 e v2 nunca compartilham contexto implicitamente. */
export async function listCampaignRitualActivity(campaignId: string, version: 'v1' | 'v2'): Promise<CharacterActivityEvent[]> {
  const { data, error } = await activityClient.from('character_activity_events').select('*').eq('campaign_id', campaignId).eq('campaign_version', version).eq('category', 'ritual').order('created_at', { ascending: false }).limit(50);
  if (error) throw activityFailure('Não foi possível carregar as conjurações da campanha.', error);
  return data ?? [];
}

