import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CombatRollModal } from '../CombatRollModal';
import { MobileCombatRollModal } from '../mobile/MobileCombatRollModal';
import { rollSkillTest } from '@/lib/dice-roller';
import { CombatWeaponsTable } from '../CombatWeaponsTable';
vi.mock('@/hooks/useCombatFeedback', () => ({ useCombatFeedback: () => ({ triggerRoll: vi.fn(), triggerFumble: vi.fn(), triggerCriticalMiss: vi.fn(), triggerCritical: vi.fn(), triggerHit: vi.fn(), triggerMiss: vi.fn() }) }));

vi.mock('../SpecialAttackSelector', () => ({
  SpecialAttackSelector: () => null,
  useSpecialAttackState: () => ({
    config: { enabled: true, attackIncrements: 1, damageIncrements: 0 },
    setConfig: vi.fn(), reset: vi.fn(),
  }),
}));
vi.mock('@/lib/dice-roller', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/dice-roller')>(),
  rollSkillTest: vi.fn(() => ({
    dice: [12], total: 17, bonus: 5, keptDice: [12], discardedDice: [],
    formula: '1d20+5', label: 'Ataque', isCritical: false,
  })),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const props = {
  open: true, onClose: vi.fn(),
  weapon: { id: 'test', name: 'Faca', type: 'Corpo a Corpo' as const, damage: '1d4', critical: '19' },
  attributes: { agility: 1, strength: 1, presence: 1, intellect: 1, vigor: 1 },
  skills: { luta: 0 }, currentPE: 10, maxPE: 10,
  characterClass: 'Combatente', abilities: [], paranormalPowers: [], hasAffinity: false, nex: 5,
};

it('a tabela desktop repassa trilha, arma favorita e rejeição do servidor ao modal real', async () => {
  const save = vi.fn().mockResolvedValue(false);
  const complete = vi.fn();
  render(<CombatWeaponsTable weapons={[{ ...props.weapon, isFavoriteWeapon: true }]}
    attributes={props.attributes} skills={props.skills} characterClass="Combatente"
    classTrack="aniquilador" currentPE={10} maxPE={10} nex={40}
    onPEChange={save} onRollComplete={complete} />);
  fireEvent.click(screen.getByRole('cell', { name: 'Faca' }));
  expect(screen.getByRole('button', { name: 'Usar Técnica Secreta' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('não foi confirmado'));
  expect(complete).not.toHaveBeenCalled();
});

describe.each([
  ['desktop', CombatRollModal], ['mobile', MobileCombatRollModal],
] as const)('Ataque confirmado: %s', (_name, Modal) => {
  it('separa treinamento de perícia e bônus especial na rolagem enviada ao histórico', async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    render(<Modal {...props} skills={{ luta: 1 }} onPEChange={vi.fn()} onConfirmAttack={confirm} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(rollSkillTest).toHaveBeenCalledWith(expect.objectContaining({ skillBonus: 5, otherBonuses: 5 }));
  });
  it('avisa e bloqueia nova rolagem enquanto o turno não puder ser conferido', () => {
    render(<Modal {...props} onPEChange={vi.fn()} confirmationUnavailable="Carregando orçamento" />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando orçamento');
    expect(screen.getByRole('button', { name: /rolar ataque/i })).toBeDisabled();
    expect(rollSkillTest).not.toHaveBeenCalled();
  });
  it('permite fechar e corrigir a seleção após recusa definitiva do servidor', async () => {
    const close = vi.fn();
    const confirm = vi.fn().mockRejectedValue(Object.assign(new Error('Limite excedido'), { serverRejected: true }));
    render(<Modal {...props} onPEChange={vi.fn()} onClose={close} onConfirmAttack={confirm} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Limite excedido'));
    expect(screen.getByRole('button', { name: /rolar ataque/i })).toBeEnabled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalled();
  });
  it('aguarda o servidor e bloqueia cliques duplicados durante confirmação', async () => {
    let resolve!: (accepted: boolean) => void;
    const save = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
    const complete = vi.fn();
    const close = vi.fn();
    render(<Modal {...props} onClose={close} onPEChange={save} onRollComplete={complete} />);
    const button = screen.getByRole('button', { name: /rolar ataque/i });
    fireEvent.click(button); fireEvent.click(button);
    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(8);
    expect(rollSkillTest).toHaveBeenCalledOnce();
    expect(complete).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    await act(async () => resolve(true));
    expect(complete).toHaveBeenCalledOnce();
  });

  it('mantém o sorteio após falha e repete somente a confirmação do mesmo custo', async () => {
    const save = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const complete = vi.fn();
    render(<Modal {...props} onPEChange={save} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('não foi confirmado'));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /tentar confirmar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(rollSkillTest).toHaveBeenCalledOnce();
    expect(save.mock.calls).toEqual([[8], [8]]);
  });

  it('não inicia ataque com custo maior que os PE disponíveis', () => {
    const save = vi.fn();
    render(<Modal {...props} currentPE={0} onPEChange={save} />);
    const button = screen.getByRole('button', { name: /rolar ataque/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(save).not.toHaveBeenCalled();
    expect(rollSkillTest).not.toHaveBeenCalled();
  });

  it('prepara técnica sem debitar e inclui seu custo somente ao confirmar o ataque', async () => {
    const save = vi.fn().mockResolvedValue(true);
    const complete = vi.fn();
    render(<Modal {...props} classTrack="aniquilador" nex={40} isFavoriteWeapon
      onPEChange={save} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar Técnica Secreta' }));
    fireEvent.click(screen.getByText('Destruidor', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Técnica' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmar Técnica' })).not.toBeInTheDocument());
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    // Incremento selecionado de Ataque Especial custa 2 PE; técnica custa mais 2 PE.
    expect(save).toHaveBeenCalledWith(6);
    expect(save).toHaveBeenCalledOnce();
  });

  it('cancelar uma técnica preparada não cria estorno', async () => {
    const save = vi.fn();
    render(<Modal {...props} classTrack="aniquilador" nex={40} isFavoriteWeapon onPEChange={save} />);
    fireEvent.click(screen.getByRole('button', { name: 'Usar Técnica Secreta' }));
    fireEvent.click(screen.getByText('Destruidor', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Técnica' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmar Técnica' })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^cancelar( técnica)?$/i }));
    expect(save).not.toHaveBeenCalled();
  });

  it('usa confirmação atômica, inclui temporários e repete a mesma intenção após rejeição', async () => {
    const save = vi.fn();
    const confirm = vi.fn().mockRejectedValueOnce(new Error('Limite do turno excedido. Nenhuma cobrança.')).mockResolvedValueOnce(true);
    const complete = vi.fn();
    render(<Modal {...props} currentPE={0} temporaryPE={2} onPEChange={save}
      onConfirmAttack={confirm} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Limite do turno excedido'));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /tentar confirmar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(save).not.toHaveBeenCalled();
    expect(rollSkillTest).toHaveBeenCalledOnce();
    expect(confirm.mock.calls[0][0]).toBe(confirm.mock.calls[1][0]);
    expect(confirm.mock.calls[0][0]).toEqual(expect.objectContaining({ expectedPE: 0, expectedCost: 2,
      selection: expect.objectContaining({ weaponId: 'test', specialAttackIncrements: 1 }) }));
  });
});
