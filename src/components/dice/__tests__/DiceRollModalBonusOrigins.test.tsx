import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiceRollModal, type BonusSource } from '../DiceRollModal';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.45); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

/** Exercita o modal montado e o motor real, incluindo sua animação de 12 quadros. */
async function roll(sources: BonusSource[], bonus: number, resistanceBonus = 0, extraDice = 0) {
  const onRollComplete = vi.fn();
  render(<DiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1}
    skillBonus={bonus} resistanceBonus={resistanceBonus} extraDice={extraDice}
    bonusSources={sources} onRollComplete={onRollComplete} />);
  fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
  await act(async () => { vi.advanceTimersByTime(1200); });
  expect(onRollComplete).toHaveBeenCalledTimes(1);
  return onRollComplete.mock.calls[0][0];
}

describe('origens numéricas da rolagem compartilhada', () => {
  it('registra treinamento e poder separadamente sem mudar o total', async () => {
    const result = await roll([
      { label: 'Treinamento', type: 'skill', value: 5 },
      { label: 'Reflexos Defensivos', type: 'power', value: 5 },
    ], 10);
    expect(result).toMatchObject({ skillBonus: 5, otherBonuses: 5, keptDice: 10, total: 20 });
    expect(screen.getByText('Cálculo: 10 + perícia (5) + outros bônus (5) = 20')).toBeTruthy();
  });
  it('mantém penalidade, resistência e dados extras fora do treinamento', async () => {
    const result = await roll([
      { label: 'Treinamento', type: 'skill', value: 5 },
      { label: 'Penalidade', type: 'other', value: -2 },
      { label: '+1d20', type: 'power', value: 1 },
    ], 3, 2, 1);
    expect(result).toMatchObject({ skillBonus: 5, otherBonuses: 0, extraDice: 1, total: 15 });
    expect(result.dice).toHaveLength(2);
  });
  it('preserva o agregado legado quando não há origem explícita de treinamento', async () => {
    const result = await roll([{ label: 'Poder', type: 'power', value: 5 }], 10, 2);
    expect(result).toMatchObject({ skillBonus: 10, otherBonuses: 2, total: 22 });
  });
  it.each(['Iniciativa', 'Luta'])('não oferece Ataque Especial nem consome seu PE no teste de %s', async label => {
    const onPEChange = vi.fn();
    const onRollComplete = vi.fn();
    render(<DiceRollModal open onClose={() => undefined} label={label} attributeValue={1}
      peCurrent={10} onPEChange={onPEChange} onRollComplete={onRollComplete}
      activatablePowers={[{ id: 'ataque-especial', name: 'Ataque Especial', description: 'Somente ataque/dano',
        peCost: 2, effect: '+5 ataque/dano', effectType: 'combat_bonus', icon: 'sword' }]} />);
    expect(screen.queryByText('Ataque Especial')).toBeNull();
    expect(screen.queryByText(/Poderes Ativáveis/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(1200); });
    expect(onPEChange).not.toHaveBeenCalled();
    expect(onRollComplete.mock.calls[0][0]).toMatchObject({ skillBonus: 0, otherBonuses: 0, total: 10 });
  });
  it.each([
    { name: 'treinamento 5 + poder 5', sources: [{ label: 'Treinamento', type: 'skill' as const, value: 5 }, { label: 'Poder', type: 'power' as const, value: 5 }], level: undefined, visible: true },
    { name: 'agregado legado 10 sem origem', sources: [], level: undefined, visible: false },
    { name: 'nível explícito Veterano', sources: [{ label: 'Treinamento', type: 'skill' as const, value: 5 }], level: 'veterano' as const, visible: false },
  ])('filtra requisito do Eclético com $name', ({ sources, level, visible }) => {
    render(<DiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={sources} currentSkillTrainingLevel={level} peCurrent={10}
      activatablePowers={[{ id: 'ecletico-veterano', name: 'Eclético (Veterano)', description: 'Treinamento temporário',
        peCost: 4, effect: '+10 veterano', effectType: 'skill_trained', icon: 'zap', skillBonus: 10 }]} />);
    expect(Boolean(screen.queryByText('Eclético (Veterano)'))).toBe(visible);
  });
  it('Eclético substitui treinamento, preserva bônus de poder e cobra o PE da opção escolhida', async () => {
    const onPEChange = vi.fn();
    const onRollComplete = vi.fn();
    render(<DiceRollModal open onClose={() => undefined} label="Iniciativa" attributeValue={1} skillBonus={10}
      bonusSources={[{ label: 'Treinamento', type: 'skill', value: 5 }, { label: 'Poder', type: 'power', value: 5 }]}
      peCurrent={10} onPEChange={onPEChange} onRollComplete={onRollComplete}
      activatablePowers={[{ id: 'ecletico-veterano', name: 'Eclético (Veterano)', description: 'Treinamento temporário',
        peCost: 4, effect: '+10 veterano', effectType: 'skill_trained', icon: 'zap', skillBonus: 10 }]} />);
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: /ROLAR DADOS/ }));
    await act(async () => { vi.advanceTimersByTime(1200); });
    expect(onRollComplete.mock.calls[0][0]).toMatchObject({ skillBonus: 10, otherBonuses: 5, total: 25 });
    expect(onPEChange).toHaveBeenCalledExactlyOnceWith(6);
    expect(screen.getByText('Treinamento (Eclético): +10')).toBeTruthy();
    expect(screen.queryByText('Treinamento: +5')).toBeNull();
  });
});
