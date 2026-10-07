import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activityJson, listCharacterActivity, recordCharacterRoll, hideCharacterActivity } from '../character-activity-service';
import { applyCharacterEffect, castCharacterRitual } from '../ritual-application-service';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import type { CharacterActivityEvent } from '@/types/character-activity';
const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const characterId = '00000000-0000-4000-8000-000000000001';
const operationId = '00000000-0000-4000-8000-000000000002';
const event: CharacterActivityEvent = { id: operationId, operation_id: operationId, character_id: characterId, author_id: characterId, category: 'roll', payload: {}, status: 'confirmed', created_at: '2026-10-06T12:00:00Z', campaign_id: null, campaign_version: null };
beforeEach(() => { vi.clearAllMocks(); fake.rpc.mockResolvedValue({ data: event, error: null }); });
describe('histórico por ficha confirmado no servidor', () => {
  it('recusa evento de outra ficha mesmo em resposta sem erro', async () => {
    fake.rpc.mockResolvedValue({ data: { ...event, character_id: operationId }, error: null });
    await expect(recordCharacterRoll(characterId, operationId, {})).rejects.toThrow('ficha correta');
  });
  it('recusa confirmação ausente e preserva operationId para repetição', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: null });
    await expect(recordCharacterRoll(characterId, operationId, {})).rejects.toThrow('não confirmou');
    expect(fake.rpc.mock.calls[0][1].p_operation_id).toBe(operationId);
  });
  it('passa cursor com desempate por id e filtro ao servidor', async () => {
    fake.rpc.mockResolvedValue({ data: [], error: null });
    await listCharacterActivity(characterId, { category: 'ritual', cursor: { id: operationId, createdAt: event.created_at } });
    expect(fake.rpc).toHaveBeenCalledWith('list_character_activity_filtered', expect.objectContaining({ p_character_id: characterId, p_category: 'ritual', p_before_id: operationId, p_before_created_at: event.created_at }));
  });
  it('oculta em vez de excluir e permite restaurar', async () => {
    fake.rpc.mockResolvedValue({ data: { character_id: characterId }, error: null });
    await hideCharacterActivity(characterId, false);
    expect(fake.rpc).toHaveBeenCalledWith('hide_character_activity', { p_character_id: characterId, p_hidden: false });
  });
  it('filtra período e sessão no servidor com campanha e versão explícitas', async () => {
    fake.rpc.mockResolvedValue({ data: [], error: null });
    await listCharacterActivity(characterId, { afterCreatedAt: '2026-10-01T00:00:00Z', session: { id: operationId, campaign_id: characterId, campaign_version: 'v2', session_number: 2, title: 'Teste', campaign_name: 'Campanha QA', session_date: event.created_at } });
    expect(fake.rpc).toHaveBeenCalledWith('list_character_activity_filtered', expect.objectContaining({ p_after_created_at: '2026-10-01T00:00:00Z', p_session_id: operationId, p_session_campaign_id: characterId, p_session_campaign_version: 'v2' }));
  });
  it('recusa período inválido antes de chamar o servidor', async () => {
    await expect(listCharacterActivity(characterId, { afterCreatedAt: 'data inválida' })).rejects.toThrow('Período inválido');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it('mantém data original em ISO no payload', () => {
    expect(activityJson({ timestamp: new Date('2026-10-06T12:00:00Z') })).toEqual({ timestamp: '2026-10-06T12:00:00.000Z' });
  });
  it('mostra penalidades e todos os bônus separados', () => {
    expect(describeCharacterActivity({ ...event, payload: { label: 'Teste', total: 14, keptDice: 17, skillBonus: 5, otherBonuses: -8, dice: [17, 3] } })).toContain('17 +5 perícia -8 outros bônus');
  });
  it('apresenta payload.entry das telas sem perder rótulo, dados e bônus', () => {
    const description = describeCharacterActivity({ ...event, payload: { source: 'desktop', entry: { label: 'Iniciativa', total: 27, keptDice: 17, skillBonus: 5, otherBonuses: 5, dice: [17, 3] } } });
    expect(description).toContain('Iniciativa: 27');
    expect(description).toContain('dados [17, 3]');
    expect(description).toContain('17 +5 perícia +5 outros bônus');
  });
});
describe('conjuração e aplicação atômicas', () => {
  it('custo gratuito continua explícito no servidor', async () => {
    await castCharacterRitual({ characterId, operationId, expectedPE: 0, peCost: 0, payload: {} });
    expect(fake.rpc.mock.calls[0][1].p_pe_cost).toBe(0);
  });
  it('rejeita custo fracionário antes de enviar ao servidor', async () => {
    await expect(castCharacterRitual({ characterId, operationId, expectedPE: 1, peCost: 2.5, payload: {} })).rejects.toThrow('inválido');
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it('delega saldo total ao servidor, pois PE temporários são separados', async () => {
    await castCharacterRitual({ characterId, operationId, expectedPE: 1, peCost: 2, payload: {} });
    expect(fake.rpc).toHaveBeenCalledWith('cast_character_ritual', expect.objectContaining({ p_expected_pe: 1, p_pe_cost: 2 }));
  });
  it('envia número JSON para dano e não afirma sucesso negado', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: { message: 'negado' } });
    await expect(applyCharacterEffect({ characterId, operationId, kind: 'damage', value: 5, expected: { hp_current: 20 } })).rejects.toThrow('não foi aplicado');
    expect(fake.rpc.mock.calls[0][1].p_value).toBe(5);
  });
});
