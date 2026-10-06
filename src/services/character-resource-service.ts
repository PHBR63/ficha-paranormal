import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { activityClient, activityFailure, confirmActivity, validateActivityId } from './character-activity-service';
import type { CharacterActivityEvent, ActivityPayload } from '@/types/character-activity';

export type CharacterResource = 'hp' | 'pe' | 'san';
export type ResourceMode = 'delta' | 'set';
export type ConfirmResourceOperation = () => Promise<CharacterActivityEvent>;

function resourceFailure(context: string, cause: { code?: string } | null) {
  return Object.assign(activityFailure(context, cause ?? {}), { code: cause?.code });
}

/** Prepara uma requisição estável: retries conservam UUID e valores esperados. */
export async function prepareResourceChange(characterId: string, resource: CharacterResource, mode: ResourceMode, value: number): Promise<ConfirmResourceOperation> {
  validateActivityId(characterId);
  if (!Number.isSafeInteger(value) || Math.abs(value) > 1000000) throw new Error('Quantidade inválida.');
  const { data, error } = await supabase.from('characters').select('hp_current,hp_max,pe_current,pe_max,san_current,san_max').eq('id', characterId).single();
  if (error || !data) throw activityFailure('Não foi possível ler os recursos da ficha.', error ?? {});
  const operationId = crypto.randomUUID();
  const args = { p_operation_id: operationId, p_character_id: characterId, p_resource: resource, p_mode: mode,
    p_value: value, p_expected_current: data[`${resource}_current`], p_expected_max: data[`${resource}_max`] };
  return async () => {
    const { data: event, error: failure } = await activityClient.rpc('change_character_resource', args);
    if (failure) throw resourceFailure('Alteração de recurso não confirmada.', failure);
    return confirmActivity(event, characterId, operationId);
  };
}

/** Nome/ID serve apenas para a ação escolhida; outras entradas são preservadas. */
function matchesCondition(value: Json, name: string): boolean {
  if (typeof value === 'string') return value === name;
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && (value.name === name || value.id === name));
}

export async function prepareConditionChange(characterId: string, action: 'add' | 'remove' | 'clear', name?: string): Promise<ConfirmResourceOperation> {
  validateActivityId(characterId);
  if (action !== 'clear' && (!name?.trim() || name.length > 150)) throw new Error('Condição inválida.');
  const { data, error } = await supabase.from('characters').select('conditions').eq('id', characterId).single();
  if (error || !data) throw activityFailure('Não foi possível ler as condições da ficha.', error ?? {});
  if (!Array.isArray(data.conditions)) throw new Error('Condições existentes exigem revisão manual.');
  const expected = data.conditions;
  const next = action === 'clear' ? [] : action === 'remove' ? expected.filter(item => !matchesCondition(item, name!))
    : expected.some(item => matchesCondition(item, name!)) ? expected : [...expected, name!];
  const operationId = crypto.randomUUID();
  return async () => {
    const { data: event, error: failure } = await activityClient.rpc('replace_character_conditions', {
      p_operation_id: operationId, p_character_id: characterId, p_conditions: next, p_expected: expected,
    });
    if (failure) throw resourceFailure('Alteração de condições não confirmada.', failure);
    return confirmActivity(event, characterId, operationId);
  };
}

/** Salva a edição explícita do gerenciador sem sobrescrever condições mudadas em outra aba. */
export async function confirmConditionReplacement(characterId: string, conditions: Json[], expected: Json[], operationId: string): Promise<CharacterActivityEvent> {
  validateActivityId(characterId); validateActivityId(operationId);
  const { data, error } = await activityClient.rpc('replace_character_conditions', {
    p_operation_id: operationId, p_character_id: characterId, p_conditions: conditions, p_expected: expected,
  });
  if (error) throw resourceFailure('As condições não foram confirmadas.', error);
  return confirmActivity(data, characterId, operationId);
}

export interface ResourceBundleInput {
  characterId: string;
  operationId: string;
  values: { hp: number; pe: number; san: number };
  expected: ActivityPayload;
  conditions: Json[];
}

/** Confirma recursos/condições juntos, conservando o snapshot esperado do pedido. */
export async function confirmResourceBundle(input: ResourceBundleInput): Promise<CharacterActivityEvent> {
  validateActivityId(input.characterId); validateActivityId(input.operationId);
  if (Object.values(input.values).some(value => !Number.isSafeInteger(value) || Math.abs(value) > 1000000)) throw new Error('Quantidade de recurso inválida.');
  const { data, error } = await activityClient.rpc('change_character_resources', {
    p_operation_id: input.operationId, p_character_id: input.characterId,
    p_values: input.values, p_expected: input.expected, p_conditions: input.conditions,
  });
  if (error) throw resourceFailure('Os recursos não foram confirmados.', error);
  return confirmActivity(data, input.characterId, input.operationId);
}
