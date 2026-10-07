import { useState } from 'react';
import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileCombatPanel, type WeaponEntry } from '../MobileCombatPanel';
import { MobileCombatRollModal } from '../MobileCombatRollModal';
import { toMobileWeaponEntry } from '../weapon-entry';

// Isola somente a fachada e feedback audiovisual; cálculos, painel e modal são reais.
vi.mock('@/hooks', async () => ({
  ...await import('@/hooks/useRitualCombatBonuses'),
  ELEMENT_BUFF_COLORS: {},
  useCombatFeedback: () => ({
    triggerRoll: vi.fn(), triggerFumble: vi.fn(), triggerCriticalMiss: vi.fn(),
    triggerCritical: vi.fn(), triggerHit: vi.fn(), triggerMiss: vi.fn(), triggerDamage: vi.fn(),
  }),
}));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
// JSDOM não conclui a transição de saída; preserva os componentes e elimina só a espera visual.
vi.mock('framer-motion', async () => ({
  ...await vi.importActual<typeof import('framer-motion')>('framer-motion'),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

const attributes = { strength: 3, agility: 2, intellect: 2, presence: 0, vigor: 2 };
const knife = { id: 'qa-faca', name: 'Faca', damage: '1d4', damageType: 'Corte',
  weaponType: 'melee' as const, critical: 19, criticalMultiplier: 2 };

/** Exercita a conversão usada na ficha e a seleção real do painel para o modal. */
function WeaponFlow({ onRollComplete = vi.fn() }) {
  const [selected, setSelected] = useState<WeaponEntry | null>(null);
  return <>
    <MobileCombatPanel weapons={[toMobileWeaponEntry(knife)]} agility={2} strength={3}
      onWeaponClick={setSelected} />
    <MobileCombatRollModal open={selected !== null} onClose={() => setSelected(null)} weapon={selected}
      attributes={attributes} skills={{ luta: 1 }} currentPE={4} maxPE={4} onPEChange={vi.fn()}
      characterClass="Combatente" abilities={[]} nex={10} onRollComplete={onRollComplete} />
  </>;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('Inventário → combate móvel', () => {
  it.each(['a-favorita', 'tecnica-secreta', 'maquina-de-matar'])('preserva a arma favorita do Aniquilador: %s', favoriteAbilityId => {
    expect(toMobileWeaponEntry({ ...knife, favoriteAbilityId }).isFavoriteWeapon).toBe(true);
  });

  it.each([undefined, 'ferramenta-favorita', 'ferramenta-de-trabalho', 'desconhecida'])('não confunde outras reduções com A Favorita: %s', favoriteAbilityId => {
    expect(toMobileWeaponEntry({ ...knife, favoriteAbilityId }).isFavoriteWeapon).toBe(false);
  });

  it('mantém a margem 19 da faca no painel e ao abrir o modal real', () => {
    render(<WeaponFlow />);
    expect(screen.getByText('19', { exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
    expect(within(screen.getByRole('dialog', { name: 'Faca' })).getByText('Crit: 19+ x2')).toBeInTheDocument();
  });

  it.each([[0.85, 18, false], [0.9, 19, true]] as const)(
    'd20 %s respeita o limiar da arma sem alterar a rolagem real', async (random, keptDice, isCritical) => {
      vi.useFakeTimers();
      vi.spyOn(Math, 'random').mockReturnValue(random);
      const onRollComplete = vi.fn();
      render(<WeaponFlow onRollComplete={onRollComplete} />);
      fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
      fireEvent.click(screen.getByRole('button', { name: 'Rolar Ataque' }));
      await act(async () => { await vi.advanceTimersByTimeAsync(600); });
      expect(onRollComplete).toHaveBeenCalledTimes(1);
      expect(onRollComplete).toHaveBeenCalledWith(expect.objectContaining({ keptDice, isCritical, criticalThreshold: 19 }));
    },
  );

  it('mantém a regra personalizada de erro mesmo com 20 natural', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    render(<WeaponFlow />);
    fireEvent.click(screen.getByRole('button', { name: 'ATACAR' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rolar Ataque' }));
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(screen.getByText('CRÍTICO, mas Errou')).toBeInTheDocument();
    expect(screen.queryByText(/Acertou!/)).not.toBeInTheDocument();
  });

  it('preserva munição para a UI bloquear ataque com carregador vazio', () => {
    const firearm = toMobileWeaponEntry({ ...knife, weaponType: 'firearm', ammoCurrent: 0, ammoMax: 6 });
    render(<MobileCombatPanel weapons={[firearm]} agility={2} onWeaponClick={vi.fn()} />);
    expect(screen.getByText('0/6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ATACAR' })).toBeDisabled();
  });

  it.each([
    [{ critical: undefined, criticalRange: 18 }, '18'],
    [{ critical: undefined }, '20'],
    [{ critical: 19, criticalRange: 18 }, '19'],
  ])('aceita o formato legado e prioriza a margem salva %j', (fields, expected) => {
    const original = { ...knife, ...fields };
    const before = { ...original };
    expect(toMobileWeaponEntry(original).critical).toBe(expected);
    expect(original).toEqual(before);
  });
});
