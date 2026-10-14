import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBonusSummaryFromSUE } from '../useBonusSummaryFromSUE';
import { getTrackEffects } from '@/lib/effects/track-effects-adapter';
import { useOperacoesEspeciaisTrack, OPERACOES_ABILITIES } from '@/components/character/tracks/combatente/useOperacoesEspeciaisTrack';
import { TestQueryClientProvider } from '@/test/TestQueryClientProvider';

const attributes = { strength: 2, agility: 2, intellect: 2, presence: 2, vigor: 3 };

describe('Habilidades ativadas no resumo da ficha', () => {
  it('Surto confirmado ativa a habilidade reconhecida pelo catálogo', async () => {
    let activatedId = '';
    const { result } = renderHook(() => useOperacoesEspeciaisTrack({
      classTrack: 'operacoes-especiais', nex: 75, peCurrent: 60,
      onPEChange: () => Promise.resolve(true),
      onActivateEffect: id => { activatedId = id; },
    }));
    act(() => { result.current.handleUseAbility(OPERACOES_ABILITIES[1]); });
    await act(async () => { await result.current.handleSurtoChoice('movement'); });
    const effect = getTrackEffects('operacoes-especiais', 75, attributes, [activatedId])
      .find(entry => entry.name === 'Surto de Adrenalina');
    expect(effect?.isActive).toBe(true);
    expect(effect?.mechanics.extraActionsTrack?.type).toBe('standard-or-movement');
  });

  it('reconhece o identificador legado de Surto sem alterar registros', () => {
    const effect = getTrackEffects('operacoes-especiais', 75, attributes, ['track-surto-adrenalina'])
      .find(entry => entry.name === 'Surto de Adrenalina');
    expect(effect?.isActive).toBe(true);
  });

  it('resumo reúne ativações e alternâncias sem duplicar, atualizando ao encerrar', () => {
    const { result, rerender } = renderHook(({ activatedEffectIds }) => useBonusSummaryFromSUE({
      origin: 'lutador', abilities: [], classId: 'Combatente', classTrack: 'operacoes-especiais',
      nex: 75, ...attributes, activeConditionalBonuses: ['track-ataque-extra'], activatedEffectIds,
    }), { initialProps: { activatedEffectIds: ['track-ataque-extra', 'track-surto-de-adrenalina'] }, wrapper: TestQueryClientProvider });
    const active = () => result.current.unifiedEffects.allEffects.filter(effect =>
      effect.isActive && ['Ataque Extra', 'Surto de Adrenalina'].includes(effect.name));
    expect(active().map(effect => effect.name).sort()).toEqual(['Ataque Extra', 'Surto de Adrenalina']);
    rerender({ activatedEffectIds: [] });
    expect(active().map(effect => effect.name)).toEqual(['Ataque Extra']);
  });
});
