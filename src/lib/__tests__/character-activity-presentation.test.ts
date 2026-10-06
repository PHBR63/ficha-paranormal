import { describe, expect, it } from 'vitest';
import { describeCharacterActivity } from '../character-activity-presentation';
import type { CharacterActivityEvent } from '@/types/character-activity';

const event = (payload: CharacterActivityEvent['payload']): CharacterActivityEvent => ({
  id: 'event', operation_id: 'operation', character_id: 'sheet', author_id: 'author',
  category: 'application', status: 'confirmed', created_at: '2026-10-06', campaign_id: null, campaign_version: null, payload,
});

describe('Histórico de alterações de condições', () => {
  it('mostra a condição adicionada junto da alteração de PV', () => {
    const text = describeCharacterActivity(event({ kind: 'resources',
      before: { hp_current: 11, pe_current: 10, san_current: 15, conditions: [] },
      after: { hp_current: 10, pe_current: 10, san_current: 15, conditions: [{ id: 'machucado', name: 'Machucado' }] },
    }));
    expect(text).toContain('PV 11 → 10');
    expect(text).toContain('Condições: +Machucado');
  });

  it('mostra substituição mesmo quando o número de condições é igual e conserva desconhecidas', () => {
    const text = describeCharacterActivity(event({ kind: 'replace_conditions',
      before: { conditions: ['Inconsciente', { id: 'externa', name: 'Externa' }] },
      after: { conditions: [{ id: 'machucado', name: 'Machucado' }, { id: 'externa', name: 'Externa' }] },
    }));
    expect(text).toContain('2 → 2');
    expect(text).toContain('+Machucado; −Inconsciente');
    expect(text).not.toContain('−Externa');
  });

  it('não inventa alteração na conversão de nome legado para ID e compara instâncias repetidas', () => {
    const text = describeCharacterActivity(event({ kind: 'replace_conditions',
      before: { conditions: ['Machucado', 'Sangrando', 'Sangrando'] },
      after: { conditions: [{ id: 'machucado', name: 'Machucado' }, 'Sangrando'] },
    }));
    expect(text).toContain('Condições: −Sangrando');
    expect(text).not.toContain('+Machucado');
  });

  it('mostra remoção após início de turno sem dano, sem separador vazio', () => {
    const text = describeCharacterActivity(event({ kind: 'condition_turn',
      before: { hp_current: 20, conditions: ['Sangrando'] }, after: { hp_current: 20, conditions: [] },
      resolution: { bleedingTests: [], effects: [] },
    }));
    expect(text).toBe('Início de turno confirmado · PV 20 → 20 · Condições: −Sangrando');
  });

  it('registros antigos sem snapshots de condições continuam legíveis', () => {
    expect(describeCharacterActivity(event({ kind: 'resources', before: { hp_current: 11 }, after: { hp_current: 10 } })))
      .toBe('Recursos alterados · PV 11 → 10');
  });
});
