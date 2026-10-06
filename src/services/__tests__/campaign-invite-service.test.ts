import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCampaignInvite, joinCampaignInvite, loadCampaignInvite, removeCampaignMember, saveCampaignSettings } from '../campaign-invite-service';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), eq: vi.fn(), update: vi.fn(), remove: vi.fn(), insert: vi.fn(), single: vi.fn(), limit: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => {
  const builder = { select: vi.fn(), eq: mocks.eq, order: vi.fn(), limit: mocks.limit, single: mocks.single, update: mocks.update, delete: mocks.remove, insert: mocks.insert };
  for (const key of ['select', 'eq', 'order', 'update', 'delete', 'insert'] as const) builder[key].mockReturnValue(builder);
  mocks.from.mockReturnValue(builder);
  return { supabase: { from: mocks.from, rpc: mocks.rpc } };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.single.mockResolvedValue({ data: { id: 'member', campaign_id: 'campaign', invite_code: 'CODE' }, error: null });
  mocks.rpc.mockResolvedValue({ data: [{ campaign_id: 'campaign', campaign_version: 'v2', campaign_name: 'Mesa', already_member: false }], error: null });
});

describe('convites e configuração com confirmação do servidor', () => {
  it('normaliza código longo e envia somente ficha selecionada para entrada atômica', async () => {
    await expect(joinCampaignInvite('  v2-12345678901234567890123456789012 ', 'own-character')).resolves.toMatchObject({ campaign_version: 'v2' });
    expect(mocks.rpc).toHaveBeenCalledWith('join_campaign_with_invite', { p_code: 'V2-12345678901234567890123456789012', p_character_id: 'own-character' });
    await joinCampaignInvite('LEGACY');
    expect(mocks.rpc).toHaveBeenLastCalledWith('join_campaign_with_invite', { p_code: 'LEGACY' });
  });
  it('não confirma entrada quando RPC retorna vazio ou erro interno', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    await expect(joinCampaignInvite('CODE')).rejects.toThrow('não foi confirmada');
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'secret relation name' } });
    await expect(joinCampaignInvite('CODE')).rejects.toThrow('A entrada na campanha não foi confirmada');
  });
  it('mostra validação controlada e rejeita entrada inválida antes de consultar', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'Convite expirado.' } });
    await expect(joinCampaignInvite('CODE')).rejects.toThrow('Convite expirado');
    mocks.rpc.mockClear();
    await expect(joinCampaignInvite(' '.repeat(5))).rejects.toThrow('válido');
    await expect(joinCampaignInvite('x'.repeat(81))).rejects.toThrow('válido');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('cria convite v2 por RPC e rejeita comprovante de outra campanha', async () => {
    mocks.rpc.mockResolvedValue({ data: { campaign_id: 'campaign', invite_code: 'V2-CODE' }, error: null });
    await expect(createCampaignInvite('campaign', 'master', 'v2')).resolves.toBe('V2-CODE');
    expect(mocks.rpc).toHaveBeenCalledWith('create_campaign_invite_v2', { p_campaign_id: 'campaign', p_max_uses: 10 });
    mocks.rpc.mockResolvedValue({ data: { campaign_id: 'other', invite_code: 'V2-CODE' }, error: null });
    await expect(createCampaignInvite('campaign', 'master', 'v2')).rejects.toThrow('não foi confirmado');
  });
  it('usa tabela correspondente e não confunde erro de leitura com ausência de convite', async () => {
    mocks.limit.mockResolvedValue({ data: [{ invite_code: 'EXHAUSTED', max_uses: 1, uses: 1, expires_at: null }, { invite_code: 'ACTIVE', max_uses: null, uses: 99, expires_at: null }], error: null });
    await expect(loadCampaignInvite('campaign', 'v2')).resolves.toBe('ACTIVE');
    expect(mocks.from).toHaveBeenCalledWith('campaign_invites_v2');
    mocks.limit.mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied for relation campaign_invites' } });
    await expect(loadCampaignInvite('campaign', 'v1')).rejects.toThrow('Não foi possível carregar');
    expect(mocks.from).toHaveBeenCalledWith('campaign_invites');
  });
  it('salva/remover no schema correto e exige linha confirmada para evitar falso sucesso', async () => {
    mocks.single.mockResolvedValue({ data: { id: 'campaign' }, error: null });
    await saveCampaignSettings('campaign', 'v2', ' Mesa ', ' ');
    expect(mocks.from).toHaveBeenCalledWith('campaigns_v2');
    expect(mocks.update).toHaveBeenCalledWith({ name: 'Mesa', description: null });
    mocks.single.mockResolvedValue({ data: { id: 'member' }, error: null });
    await removeCampaignMember('campaign', 'v1', 'member');
    expect(mocks.from).toHaveBeenCalledWith('campaign_members');
    expect(mocks.eq).toHaveBeenCalledWith('campaign_id', 'campaign');
    mocks.single.mockResolvedValue({ data: null, error: null });
    await expect(saveCampaignSettings('campaign', 'v1', 'Mesa', '')).rejects.toThrow('não foram confirmadas');
    await expect(removeCampaignMember('campaign', 'v2', 'member')).rejects.toThrow('não foi confirmada');
  });
});
