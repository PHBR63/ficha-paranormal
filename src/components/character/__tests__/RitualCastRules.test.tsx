/** Exercita os consumidores reais das páginas 119/121 sem persistência ou rede. */
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import { RitualCastModal } from '../RitualCastModal';
import { MobileRitualCastModal } from '../mobile/MobileRitualCastModal';
import { useRitualBonusesFromSUE } from '@/hooks/useRitualBonusesFromSUE';
import { useUnifiedEffects } from '@/hooks/useUnifiedEffects';
import { unifiedToLegacy } from '@/lib/rituals/ritual-adapter';
import { RitualCard } from '../RitualCard';

// Isola somente a fachada de hooks, mantendo a validação real de regras.
vi.mock('@/hooks', async () => await import('@/hooks/useRitualValidation'));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Custo mostrado na ficha (Base v1.3 p.119)', () => {
  it.each([
    ['aprimorar-mente', 2, 3],
    ['alterar-memoria', 4, 6],
    ['ritual-da-mesa', 7, 7],
    ['inexistir', 0, 0],
  ] as const)('%s corrige o custo legado sem multiplicar por classe', (id, savedCost, cost) => {
    const ritual = { ...unifiedToLegacy(getRitualById(id) ?? getRitualById('arma-atroz')!), id, cost: savedCost };
    const onCast = vi.fn();
    render(<RitualCard ritual={ritual} isNonOccultist peCurrent={cost} onCast={onCast} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ritual.name) }));
    const cast = screen.getByRole('button', { name: `Conjurar (${cost} PE)` });
    expect(cast).toBeEnabled();
    expect(screen.queryByText('×2')).not.toBeInTheDocument();
    fireEvent.click(cast);
    expect(onCast).toHaveBeenCalledWith(ritual);
  });

  it('mostra o adicional do aprimoramento sem dobrar para não ocultista', () => {
    const ritual = unifiedToLegacy(getRitualById('arma-atroz')!);
    render(<RitualCard ritual={ritual} isNonOccultist peCurrent={10} onCast={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Arma Atroz/ }));
    expect(screen.getByText('+2 PE')).toBeInTheDocument();
    expect(screen.queryByText('+4 PE')).not.toBeInTheDocument();
  });
});

it('a caixa de aprimoramento desktop altera a seleção apenas uma vez', () => {
  const ritual = getRitualById('arma-atroz')!;
  render(<RitualCastModal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={50} peMax={50}
    nex={99} elementalAffinity={ritual.element} onConfirm={vi.fn()} />);
  const discente = screen.getByRole('checkbox', { name: 'Aprimoramento Discente' });
  const verdadeiro = screen.getByRole('checkbox', { name: 'Aprimoramento Verdadeiro' });
  fireEvent.click(discente);
  expect(discente).toBeChecked();
  fireEvent.click(verdadeiro);
  expect(verdadeiro).toBeChecked();
  expect(discente).not.toBeChecked();
});

describe.each([
  ['desktop', RitualCastModal],
  ['mobile', MobileRitualCastModal],
] as const)('Modal de conjuração %s', (_name, Modal) => {
  it.each([
    ['aprimorar-mente', 2, 3],
    ['alterar-memoria', 4, 6],
  ] as const)('%s envia o custo oficial apesar do objeto legado', async (id, savedCost, cost) => {
    vi.useFakeTimers();
    const ritual = { ...getRitualById(id)!, cost: savedCost };
    const onConfirm = vi.fn().mockResolvedValue(true);
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={cost} peMax={50}
      nex={99} isNonOccultist onConfirm={onConfirm} />);
    const confirm = screen.getByRole('button', { name: /conjurar/i });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledWith(ritual, cost, [], [], undefined);
  });

  it.each([
    ['aprimorar-mente', 2, 3],
    ['alterar-memoria', 4, 6],
  ] as const)('%s impede confirmar com saldo inferior ao custo oficial', (id, savedCost, cost) => {
    const ritual = { ...getRitualById(id)!, cost: savedCost };
    const onConfirm = vi.fn();
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={cost - 1} peMax={50}
      nex={99} isNonOccultist onConfirm={onConfirm} />);
    expect(screen.getByRole('button', { name: /conjurar/i })).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('mantém a preparação aberta quando o débito não é confirmado', async () => {
    vi.useFakeTimers();
    const onConfirm = vi.fn().mockResolvedValue(false);
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} ritual={getRitualById('perturbacao')!}
      peCurrent={10} peMax={10} nex={20} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /conjurar/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /conjurar/i })).toBeEnabled();
  });

  it('ignora clique duplicado enquanto aguarda o débito e só avança após sucesso', async () => {
    vi.useFakeTimers();
    let resolveCast: (value: boolean) => void = () => {};
    const onConfirm = vi.fn(() => new Promise<boolean>(resolve => { resolveCast = resolve; }));
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} ritual={getRitualById('perturbacao')!}
      peCurrent={10} peMax={10} nex={20} onConfirm={onConfirm} />);
    const confirm = screen.getByRole('button', { name: /conjurar/i });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => { resolveCast(true); await vi.advanceTimersByTimeAsync(350); });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(['condutor', 'Conduíte', 'conduite'])('oferece Ampliar inativo da trilha %s e confirma custo 3 uma vez', async classTrack => {
    vi.useFakeTimers();
    const attributes = { strength: 1, agility: 1, vigor: 2, intellect: 3, presence: 3 };
    const { result } = renderHook(() => {
      const effects = useUnifiedEffects({ origin: 'vitima', classId: 'Ocultista', classTrack,
        nex: 20, attributes, conditions: [], activeRituals: [], currentPE: 27 });
      return useRitualBonusesFromSUE(effects, attributes, [], 27);
    });
    const modifier = result.current.availableModifiers.find(mod => mod.id === 'ampliar-ritual-alcance');
    expect(modifier).toMatchObject({ isActive: false, canActivate: true, peCost: 2 });
    expect(result.current.peReduction).toBe(0);
    const ritual = getRitualById('perturbacao')!;
    expect(ritual).toBeDefined();
    const onConfirm = vi.fn();
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={27} peMax={28}
      nex={20} ritualBonuses={result.current} onConfirm={onConfirm} />);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(_name === 'desktop' ? screen.getAllByRole('switch')[0]
      : screen.getByRole('button', { name: /Ampliar Ritual \(Alcance\)/ }));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /conjurar/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(ritual, 3, [], [modifier!.id], undefined);
  });

  it('valida o custo depois do desconto, igual ao valor cobrado', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRitualBonusesFromSUE(null, { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 }));
    const ritualBonuses = { ...result.current, peReduction: 2, getPEReductionForRitual: () => 2 };
    const ritual = getRitualById('inexistir')!;
    const onConfirm = vi.fn();
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={8} peMax={50}
      nex={99} ritualBonuses={ritualBonuses} onConfirm={onConfirm} />);
    const confirm = screen.getByRole('button', { name: /conjurar/i });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledWith(ritual, 8, [], [], undefined);
  });

  it('inclui o custo do modificador na validação do saldo', () => {
    const { result } = renderHook(() => useRitualBonusesFromSUE(null, { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 }));
    const ritualBonuses = { ...result.current, hasAnyModifier: true, availableModifiers: [{
      id: 'track-ampliar-ritual', name: 'Ampliar Ritual', type: 'range' as const,
      effect: 'Aumenta alcance', peCost: 2, source: 'Conduíte', isActive: false, canActivate: true,
    }] };
    render(<Modal open onOpenChange={vi.fn()} ritual={getRitualById('arma-atroz')!}
      peCurrent={1} peMax={50} nex={99} ritualBonuses={ritualBonuses} onConfirm={vi.fn()} />);
    fireEvent.click(_name === 'desktop' ? screen.getByRole('switch') : screen.getByRole('button', { name: /Ampliar Ritual/i }));
    expect(screen.getByRole('button', { name: /conjurar/i })).toBeDisabled();
    expect(screen.getByText(/PE insuficiente \(1\/3 PE\)/)).toBeInTheDocument();
  });

  it.each([
    ['legado conhecido', 'inexistir', 6, 10],
    ['personalizado', 'ritual-da-mesa', 7, 7],
    ['gratuidade explícita', 'inexistir', 0, 0],
  ] as const)('mantém o custo correto do ritual %s', async (_case, id, savedCost, expectedCost) => {
    vi.useFakeTimers();
    const ritual = { ...getRitualById('inexistir')!, id, cost: savedCost };
    const onConfirm = vi.fn();
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={50} peMax={50}
      nex={99} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /conjurar/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    expect(onConfirm).toHaveBeenCalledWith(ritual, expectedCost, [], [], undefined);
  });

  it('valida o saldo usando o custo atual do catálogo para um objeto legado', () => {
    const ritual = { ...getRitualById('inexistir')!, cost: 6 };
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={6} peMax={50}
      nex={99} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /conjurar/i })).toBeDisabled();
    expect(screen.getByText(/PE insuficiente \(6\/10 PE\)/)).toBeInTheDocument();
  });

  it('substitui a forma avançada e confirma custo sem multiplicador por classe (p.119/121)', async () => {
    vi.useFakeTimers();
    const ritual = getRitualById('arma-atroz')!;
    const onConfirm = vi.fn();
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={50} peMax={50}
      nex={99} elementalAffinity={ritual.element} isNonOccultist onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Discente'));
    fireEvent.click(screen.getByText('Verdadeiro'));
    fireEvent.click(screen.getByRole('button', { name: /conjurar/i }));
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });

    const enhancement = ritual.enhancements!.find(item => item.name === 'Verdadeiro')!;
    expect(onConfirm).toHaveBeenCalledWith(ritual, ritual.cost + enhancement.cost, ['Verdadeiro'], [], undefined);
  });

  it('bloqueia um ritual acima da capacidade da classe (p.114)', () => {
    const ritual = getRitualById('controle-mental')!;
    render(<Modal open onOpenChange={vi.fn()} ritual={ritual} peCurrent={50} peMax={50}
      nex={99} isNonOccultist onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /conjurar/i })).toBeDisabled();
    expect(screen.getByText(/Requer 4º círculo \(seu máximo: 3º\)/)).toBeInTheDocument();
  });
});
