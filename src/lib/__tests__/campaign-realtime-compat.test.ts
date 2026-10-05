import { describe, expect, it } from 'vitest';
import { getCampaignRows, mergeCampaignMessages, mergeCampaignRows, normalizeCampaignSession } from '../campaign-realtime-compat';

describe('compatibilidade de campanhas v1/v2', () => {
  it('preserva v1 mesmo quando v2 retorna uma lista vazia', () => {
    expect(mergeCampaignRows([{ id: 'legacy' }], [])).toEqual([{ id: 'legacy' }]);
  });

  it('preserva registros exclusivos e prefere a cópia v1 modificada após a migração', () => {
    const legacy = [{ id: 'same', status: 'completed' }];
    const migrated = [{ id: 'same', status: 'active' }, { id: 'only-v2', status: 'scheduled' }];
    expect(mergeCampaignRows(legacy, migrated)).toEqual([
      { id: 'same', status: 'completed' }, { id: 'only-v2', status: 'scheduled' },
    ]);
    expect(migrated[0].status).toBe('active');
  });

  it('traduz in_progress sem alterar o registro persistido', () => {
    const persisted = { id: 'session', status: 'in_progress' };
    expect(normalizeCampaignSession(persisted).status).toBe('active');
    expect(persisted.status).toBe('in_progress');
    expect(normalizeCampaignSession({ status: 'completed' }).status).toBe('completed');
  });

  it('retorna somente as últimas 100 mensagens, ordenadas e sem duplicatas', () => {
    const messages = Array.from({ length: 110 }, (_, index) => ({
      id: `${index}`, created_at: new Date(index * 1000).toISOString(),
    }));
    const merged = mergeCampaignMessages(messages, [messages[109]]);
    expect(merged).toEqual(messages.slice(10));
    expect(messages).toHaveLength(110);
  });

  it.each(['42P01', 'PGRST205'])('tolera apenas ausência de tabela: %s', code => {
    expect(getCampaignRows({ data: null, error: { code, message: 'missing table' } })).toEqual([]);
  });

  it.each(['42501', 'PGRST301', ''])('não esconde falha de permissão, autenticação ou conexão: %s', code => {
    const error = { code, message: 'query failed' };
    expect(() => getCampaignRows({ data: null, error })).toThrow();
    expect(getCampaignRows({ data: [], error: null })).toEqual([]);
  });
});
