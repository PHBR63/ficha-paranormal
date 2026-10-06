import { describe, expect, it } from 'vitest';
import { parseCondition, serializeCondition } from '../condition-serialization';
import { getConditionPresentation, resolveConditionId } from '../condition-identity';
import { getConditionEffects } from '@/lib/effects/condition-effects-adapter';

describe('identidade e preservação de condições', () => {
  it('reconhece Vulnerável persistida com acento e aplica seu efeito real', () => {
    expect(parseCondition('Vulnerável').id).toBe('vulneravel');
    expect(getConditionEffects(['Vulnerável'])).toEqual(getConditionEffects(['vulneravel']));
    expect(getConditionEffects(['Vulnerável'])).not.toHaveLength(0);
  });

  it('preserva identidade externa, duração, parâmetros e contador ao salvar novamente', () => {
    const original = { id: 'Regra da Mesa #7', name: 'Marca externa', turnsRemaining: 4,
      addedAt: '2026-10-06T12:00:00.000Z', dyingCounter: 2,
      params: { customEffect: 'Conferir com o mestre', poisonDamage: '2d6', poisonDT: 20 } };
    expect(serializeCondition(parseCondition(original))).toEqual(original);
    expect(resolveConditionId(original.id)).toBe(original.id);
    expect(getConditionPresentation(original.id, original.name)).toMatchObject({ name: original.name });
    expect(getConditionPresentation(original.id, original.name).effect).toContain('manualmente');
    expect(getConditionEffects([original])).toHaveLength(0);
  });

  it('mantém parâmetros de condições conhecidas e duração nula', () => {
    const original = { id: 'Envenenado', name: 'Envenenado', turnsRemaining: null,
      addedAt: '2026-10-06T12:00:00.000Z', params: { poisonDamage: '1d6', poisonDT: 15 } };
    expect(serializeCondition(parseCondition(original))).toMatchObject({ ...original, id: 'envenenado' });
  });
  it('preserva metadados externos e data inválida legada sem falhar ao serializar', () => {
    const original = { id: 'mesa-42', name: 'Marca externa', turnsRemaining: 3,
      addedAt: 'data-legada-desconhecida', externalMetadata: { origin: 'mesa', version: 7 },
      params: { customEffect: 'Conferir antes de aplicar' } };
    expect(serializeCondition(parseCondition(original))).toMatchObject(original);
  });
  it('aceita formato legado só com nome sem inventar data de aplicação', () => {
    expect(parseCondition({ name: 'Vulnerável' })).toMatchObject({ id: 'vulneravel', name: 'Vulnerável', addedAt: '', turnsRemaining: null });
    expect(serializeCondition(parseCondition({ name: 'Marca da mesa' }))).toMatchObject({ id: 'Marca da mesa', name: 'Marca da mesa', addedAt: '' });
  });
});
