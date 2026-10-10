import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRitualSituationalContext, confirmRitualKnowledge } from '../ritual-situational-service';
import { castCharacterRitual } from '../ritual-application-service';
const fake = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: fake.rpc } }));
const characterId = '00000000-0000-4000-8000-000000000001';
const operationId = '00000000-0000-4000-8000-000000000002';
const context = { characterId, ritualId: 'arma-atroz', execution: 'Padrão', source: 'memorized', grimoireItems: [], bladeAvailable: false, bladeEligible: false, bladeKnowledge: 'absent', canReview: false };
const event = { id: operationId, operation_id: operationId, character_id: characterId, author_id: characterId, category: 'application', payload: {}, status: 'confirmed', created_at: '2026-10-10T12:00:00Z', campaign_id: null, campaign_version: null };
beforeEach(() => { vi.clearAllMocks(); fake.rpc.mockResolvedValue({ data: context, error: null }); });
describe('Contrato situacional autorizado', () => {
  it('consulta o ritual e a ficha explícitos', async () => {
    expect(await getRitualSituationalContext(characterId, 'arma-atroz')).toEqual(context);
    expect(fake.rpc).toHaveBeenCalledWith('get_character_ritual_situational', { p_character_id: characterId, p_ritual_id: 'arma-atroz' });
  });
  it.each([{ ...context, characterId: operationId }, { ...context, ritualId: 'perturbacao' }, { ...context, bladeAvailable: undefined }, null])('recusa contrato incompleto ou de outra seleção', async data => {
    fake.rpc.mockResolvedValue({ data, error: null });
    await expect(getRitualSituationalContext(characterId, 'arma-atroz')).rejects.toThrow('não confirmou');
  });
  it('não relata conferência sem recibo e envia a operação para recuperação', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: null });
    await expect(confirmRitualKnowledge(characterId, 'arma-atroz', operationId, { source: 'memorized', knownBeforeBlade: false, note: 'Fonte conferida pelo mestre.' })).rejects.toThrow('não confirmou');
    expect(fake.rpc.mock.calls[0][1].p_operation_id).toBe(operationId);
  });
  it('não aceita confirmação de conjuração sem requisitos verificados pelo servidor', async () => {
    fake.rpc.mockResolvedValue({ data: { ...event, category: 'ritual' }, error: null });
    await expect(castCharacterRitual({ characterId, operationId, expectedPE: 10, peCost: 1, payload: { situational: {} } })).rejects.toThrow('requisitos situacionais');
    fake.rpc.mockResolvedValue({ data: { ...event, category: 'ritual', payload: { situationalResolution: 'server_checked' } }, error: null });
    expect((await castCharacterRitual({ characterId, operationId, expectedPE: 10, peCost: 1, payload: { situational: {} } })).id).toBe(operationId);
  });
  it('apresenta falha de requisito sem afirmar débito ou liberar efeito', async () => {
    fake.rpc.mockResolvedValue({ data: null, error: { code: '55003', message: 'interno' } });
    await expect(castCharacterRitual({ characterId, operationId, expectedPE: 10, peCost: 2, payload: { situational: {} } })).rejects.toThrow('Nenhum PE ou SAN foi consumido');
  });
});
