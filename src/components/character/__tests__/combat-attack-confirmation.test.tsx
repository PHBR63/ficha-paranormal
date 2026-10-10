import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CombatRollModal } from '../CombatRollModal';
import { MobileCombatRollModal } from '../mobile/MobileCombatRollModal';
import { rollSkillTest } from '@/lib/dice-roller';
import { CombatWeaponsTable } from '../CombatWeaponsTable';
import { getTrackEffects } from '@/lib/effects/track-effects-adapter';
import { consolidateEffects } from '@/lib/unified-effects-engine';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
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

describe.each([
  ['desktop', CombatRollModal], ['mobile', MobileCombatRollModal],
] as const)('Mira de Elite no dano: %s', (_name, Modal) => {
  it.each([
    ['balas_longas', true], ['balas_curtas', true],
    ['balas_longas', false], ['balas_curtas', false],
  ] as const)('aplica Intelecto uma vez com munição %s e SUE %s', async (ammoType, useSUE) => {
    const complete = vi.fn();
    const attributes = { ...props.attributes, intellect: 3 };
    const unifiedEffects = consolidateEffects(getTrackEffects('atirador-elite', 40, attributes), {
      attributes, nex: 40, hpCurrent: 20, hpMax: 20, peCurrent: 20, peMax: 20,
      inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
      activeConditions: [], activatedEffects: [],
    });
    render(<Modal {...props} attributes={attributes} characterClass="Especialista"
      classTrack="atirador-elite" nex={40} unifiedEffects={useSUE ? unifiedEffects : undefined}
      weapon={{ id: 'qa-rifle', name: 'Arma QA', type: 'Disparo', damage: '2d8',
        damageType: 'Balístico', critical: '20', ammoType }}
      onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()}
      onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    // A transição animada desktop pode ultrapassar 1 s durante a regressão completa.
    await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({
      type: 'damage', otherBonuses: ammoType === 'balas_longas' ? 3 : 0,
    })));
  });
});

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


describe.each([['desktop', CombatRollModal], ['mobile', MobileCombatRollModal]] as const)('Modificações e munição no combate: %s', (_name, Modal) => {
  it('inclui Alongada no ataque e o pacote escolhido no dano/histórico', async () => {
    const complete = vi.fn();
    render(<Modal {...props} weapon={{ ...props.weapon, type: 'Disparo', damage: '2d6', ammoType: 'balas_longas', modificationAttackBonus: 2 }}
      ammunition={[{ id: 'ammo', name: 'Balas modificadas', catalogType: 'municao', catalogId: 'municao_longa', appliedAmmoModifications: ['dum_dum', 'explosiva'] }]}
      onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
    fireEvent.change(screen.getByLabelText('Munição usada neste ataque'), { target: { value: 'ammo' } });
    expect(screen.getByText(/Dum dum: \+1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(rollSkillTest).toHaveBeenCalledWith(expect.objectContaining({ otherBonuses: expect.any(Number) })));
    // O teste valida o bônus sem depender do resultado aleatório do d20.
    const config = vi.mocked(rollSkillTest).mock.calls.at(-1)![0];
    expect(config.otherBonuses).toBe(7);
    await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ type: 'damage', label: expect.stringContaining('Balas modificadas'), extraDice: 2 })));
  });
  it('Calibre Grosso bloqueia ataque sem pacote compatível', () => {
    render(<Modal {...props} weapon={{ ...props.weapon, type: 'Disparo', ammoType: 'balas_longas', appliedModifications: ['calibre_grosso'] }}
      ammunition={[{ id: 'normal', name: 'Normais', catalogId: 'municao_longa', catalogType: 'municao' }]} onConfirmAttack={vi.fn()} onPEChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /rolar ataque/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Calibre Grosso exige');
  });
  it('Dum dum aumenta o crítico e Explosiva mantém apenas dois dados extras', async () => {
    vi.mocked(rollSkillTest).mockImplementationOnce(() => ({ dice: [20], total: 25, keptDice: 20, skillBonus: 5, otherBonuses: 0, extraDice: 0, isDisadvantage: false, timestamp: new Date(), type: 'attack', label: 'Ataque', isCritical: true }));
    const complete = vi.fn();
    render(<Modal {...props} weapon={{ ...props.weapon, type: 'Disparo', damage: '2d6', critical: '20', criticalMultiplier: '3', ammoType: 'balas_longas' }}
      ammunition={[{ id: 'crit-ammo', name: 'Pacote crítico', catalogType: 'municao', catalogId: 'municao_longa', appliedAmmoModifications: ['dum_dum', 'explosiva'] }]}
      onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Munição usada neste ataque' }), { target: { value: 'crit-ammo' } });
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
    if (_name === 'desktop') expect(screen.getByRole('button', { name: 'ROLAR DANO (x4)' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ type: 'damage', extraDice: 2, isCritical: true })));
    const damage = complete.mock.calls.map(([event]) => event).find(event => event.type === 'damage');
    expect(damage.dice).toHaveLength(10); // 2d6 ×4, mais 2d6 que não multiplicam.
  });
});
