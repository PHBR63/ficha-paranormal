import { describe, expect, it } from 'vitest';
import { getCampaignConditionLabels } from '../campaign-condition-presentation';
describe('condições estruturadas na campanha', () => {
  it('mostra nomes conhecidos/desconhecidos sem destruir duração e parâmetros', () => {
    const persisted = ['Vulnerável', { id: 'externa', name: 'Marca externa', turnsRemaining: 4, addedAt: '2026-10-06', params: { customEffect: 'Manual' } }];
    const original = JSON.stringify(persisted);
    expect(getCampaignConditionLabels(persisted)).toEqual(['Vulnerável', 'Marca externa']);
    expect(JSON.stringify(persisted)).toBe(original);
  });
  it('não passa objetos para o texto da tela e mantém registros incompletos visíveis', () => {
    expect(getCampaignConditionLabels([{ id: 'condição-personalizada' }, { turnsRemaining: 3 }])).toEqual(['condição-personalizada', 'Condição externa (conferir manualmente)']);
  });
});
