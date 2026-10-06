import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RitualResistanceStep } from '../RitualResistanceStep';
import type { RitualEffect } from '@/lib/rituals/legacy-exports';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const effect: RitualEffect = { damage: { diceCount: 1, diceType: 6, damageType: 'energia' },
  resistance: { type: 'fortitude', effect: 'reduz_metade' } };
const targetAttributes = { vigor: 3, agility: 0, presence: -1 };
const targetResistanceBonuses = { fortitude: 5, reflexos: 0, vontade: 0 };

describe('resistência e dano final no wizard', () => {
  it('bloqueia resistência sem alvo e mantém DT recebida', () => {
    render(<RitualResistanceStep effect={effect} damage={12} casterResistanceDT={31} onResult={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Selecione um alvo');
    expect(screen.getByRole('button', { name: /Rolar Resistência/ })).toBeDisabled();
    expect(screen.getByRole('spinbutton', { name: 'Dificuldade da resistência' })).toHaveValue(31);
  });
  it('preserva DT explícita e entrega dano manual conferido depois da resistência', () => {
    const onResult = vi.fn();
    const explicit: RitualEffect = { ...effect, resistance: { ...effect.resistance!, dt: 25 } };
    render(<RitualResistanceStep effect={explicit} damage={12} casterResistanceDT={40} targetAttributes={targetAttributes}
      targetResistanceBonuses={targetResistanceBonuses} onResult={onResult} />);
    expect(screen.getByRole('spinbutton', { name: 'Dificuldade da resistência' })).toHaveValue(25);
    expect(screen.getByRole('spinbutton', { name: 'Bônus numérico da resistência' })).toHaveValue(5);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    fireEvent.click(screen.getByRole('button', { name: /Rolar Resistência/ }));
    expect(screen.getByText('20 + 5 = 25 vs DT 25')).toBeInTheDocument();
    const finalDamage = screen.getByRole('spinbutton', { name: 'Dano final para aplicação' });
    expect(finalDamage).toHaveValue(6);
    fireEvent.change(finalDamage, { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    fireEvent.change(finalDamage, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(onResult).toHaveBeenCalledWith(true, 2);
  });
});
