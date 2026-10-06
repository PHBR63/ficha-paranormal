/** Exercita cálculo e aplicação pelos wizards reais, sem serviço/banco. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import { unifiedToLegacy } from '@/lib/rituals/ritual-adapter';
import { RitualEffectWizard } from '../RitualEffectWizard';
import { MobileRitualEffectWizard } from '../mobile/MobileRitualEffectWizard';
import { RitualDamageModal } from '../RitualDamageModal';
import { MobileRitualCastModal } from '../mobile/MobileRitualCastModal';
import * as legacyEffects from '@/lib/rituals/legacy-exports';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Animação visual não participa das regras. Mantém elementos e eventos da tela.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const components = new Map();
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({}, { get: (_, tag: string) => {
      if (!components.has(tag)) {
        components.set(tag, React.forwardRef(({ children, initial, animate, exit, transition, layout, ...props }: any, ref) =>
          React.createElement(tag, { ...props, ref }, children)));
      }
      return components.get(tag);
    } }),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each([
  ['desktop', RitualEffectWizard],
  ['mobile', MobileRitualEffectWizard],
] as const)('Fórmula no wizard %s', (_name, Wizard) => {
  it.each(['anula', 'parcial'] as const)('sucesso %s evita condições sem chamar aplicação', async resistanceEffect => {
    vi.spyOn(legacyEffects, 'getActiveRitualEffect').mockReturnValue({
      resistance: { type: 'vontade', effect: resistanceEffect, dt: 20 },
      appliesConditions: [{ conditionId: 'vulneravel', duration: 'cena' }],
    });
    const ritual = unifiedToLegacy(getRitualById('perturbacao')!);
    const onApplyConditions = vi.fn();
    render(<Wizard open onOpenChange={vi.fn()} ritual={ritual} enhancements={[]} peCost={1}
      onApplyConditions={onApplyConditions} targetAttributes={{ vigor: 1, agility: 1, presence: 1 }}
      targetResistanceBonuses={{ fortitude: 0, reflexos: 0, vontade: 5 }} />);
    fireEvent.click(screen.getByRole('button', { name: /Processar Efeitos/ }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Dado selecionado do pool' }), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar' }));
    expect(screen.getByText('SUCESSO!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText(/anuladas!/)).toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Continuar' })); });
    expect(onApplyConditions).not.toHaveBeenCalled();
  });

  it.each([14, 35, 22])('usa DT %s recebida do conjurador e preserva ajuste manual', async (casterResistanceDT) => {
    vi.useFakeTimers();
    const ritual = unifiedToLegacy(getRitualById('deflagracao-de-energia')!);
    render(<Wizard open onOpenChange={vi.fn()} ritual={ritual} enhancements={[]} peCost={10}
      casterResistanceDT={casterResistanceDT} targetAttributes={{ vigor: 1, agility: 1, presence: 1 }} />);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: /Processar Efeitos/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    const dtInput = screen.getByRole('spinbutton', { name: 'Dificuldade da resistência' });
    expect(dtInput).toHaveValue(casterResistanceDT);
    fireEvent.change(dtInput, { target: { value: '0' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma DT inteira maior que zero.');
    expect(screen.getByRole('button', { name: _name === 'desktop' ? /Rolar Resistência/ : /^Rolar d20/ })).toBeDisabled();
    fireEvent.change(dtInput, { target: { value: '27' } });
    fireEvent.click(screen.getByRole('button', { name: _name === 'desktop' ? /Rolar Resistência/ : /^Rolar d20/ }));
    expect(dtInput).toHaveValue(27);
    expect(screen.getByText('FALHOU!')).toBeInTheDocument();
  });

  it.each([
    { passed: false, bonus: 0, expected: 160 },
    { passed: true, bonus: 4, expected: 82 },
  ])('aplica $expected após resistência (sucesso=$passed)', async ({ passed, bonus, expected }) => {
    vi.useFakeTimers();
    const ritual = unifiedToLegacy(getRitualById('deflagracao-de-energia')!);
    const onApplyDamage = vi.fn();
    render(<Wizard open onOpenChange={vi.fn()} ritual={ritual} enhancements={[]} peCost={10}
      onApplyDamage={onApplyDamage} ritualDamageBonus={bonus}
      targetAttributes={{ vigor: 1, agility: 1, presence: 1 }} />);
    expect(screen.getByText('3d10×10')).toBeInTheDocument();
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    random.mockReturnValueOnce(0).mockReturnValueOnce(0.4).mockReturnValueOnce(0.9);
    fireEvent.click(screen.getByRole('button', { name: /Processar Efeitos/ }));
    await act(async () => { await vi.advanceTimersByTimeAsync(600); });
    expect(screen.getByText(String(160 + bonus))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    random.mockReturnValue(passed ? 0.99 : 0);
    fireEvent.click(screen.getByRole('button', { name: _name === 'desktop' ? /Rolar Resistência/ : /^Rolar d20/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    expect(onApplyDamage).toHaveBeenCalledWith(expected, 'energia', false);
  });
});

it('a preparação mobile encaminha a Presença e o limite de PE ao wizard real', async () => {
  vi.useFakeTimers();
  render(<MobileRitualCastModal open onOpenChange={vi.fn()} ritual={getRitualById('deflagracao-de-energia')!}
    nex={99} casterPresence={5} peLimitBonus={1} peCurrent={50} peMax={50}
    onConfirm={vi.fn().mockResolvedValue(true)} />);
  vi.spyOn(Math, 'random').mockReturnValue(0);
  fireEvent.click(screen.getByRole('button', { name: /conjurar/i }));
  await act(async () => { await vi.advanceTimersByTimeAsync(350); });
  fireEvent.click(screen.getByRole('button', { name: /Processar Efeitos/ }));
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  expect(screen.getByRole('spinbutton', { name: 'Dificuldade da resistência' })).toHaveValue(36);
});

it('modal de dano legado preserva os três dados, multiplicador e bônus fixo', async () => {
  vi.useFakeTimers();
  const ritual = unifiedToLegacy(getRitualById('deflagracao-de-energia')!);
  const onApplyDamage = vi.fn();
  render(<RitualDamageModal open onOpenChange={vi.fn()} ritual={ritual} enhancements={[]}
    ritualDamageBonus={4} onApplyDamage={onApplyDamage} />);
  const random = vi.spyOn(Math, 'random').mockReturnValue(0);
  random.mockReturnValueOnce(0).mockReturnValueOnce(0.4).mockReturnValueOnce(0.9);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(screen.getByText('164')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Aplicar Dano/ }));
  expect(onApplyDamage).toHaveBeenCalledWith(expect.objectContaining({
    dice: [1, 5, 10], diceMultiplier: 10, total: 164, bonus: 4, formula: '3d10×10+4',
  }));
});
