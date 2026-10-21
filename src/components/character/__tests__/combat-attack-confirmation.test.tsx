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

describe.each([['desktop', CombatRollModal], ['mobile', MobileCombatRollModal]] as const)(
  'Crítico com bônus situacionais: %s', (_name, Modal) => {
    it('preserva o tamanho de cada dado extra quando há bônus diferentes', async () => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(0.999);
      try {
        const attributes = props.attributes;
        const baseEffects = consolidateEffects([], {
          attributes, nex: 5, hpCurrent: 20, hpMax: 20, peCurrent: 10, peMax: 10,
          inCombat: false, isFirstRound: false, currentRound: 0, hasShield: false,
          activeConditions: [], activatedEffects: [],
        });
        const complete = vi.fn();
        render(<Modal {...props} unifiedEffects={{ ...baseEffects,
          damage: { ...baseEffects.damage, extraDice: ['1d6', '1d8'] },
        }} onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
        fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
        await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
        fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
        await waitFor(() => expect(complete.mock.calls.some(([event]) => event.type === 'damage')).toBe(true), { timeout: 5000 });
        const damage = complete.mock.calls.map(([event]) => event).find(event => event.type === 'damage');
        expect(damage.extraDice).toBe(2);
        expect(damage.total).toBe(19); // Faca d4 + 1d6 + 1d8 + Força 1.
      } finally {
        random.mockRestore();
      }
    });

    it('multiplica apenas a arma e mantém Amaldiçoar Arma em um dado', async () => {
      vi.mocked(rollSkillTest).mockReturnValueOnce({ type: 'attack', dice: [20], keptDice: 20,
        total: 25, skillBonus: 5, otherBonuses: 0, extraDice: 0, isCritical: true,
        isDisadvantage: false, timestamp: new Date(), label: 'Ataque QA' });
      const complete = vi.fn();
      render(<Modal {...props} weapon={{ ...props.weapon, damage: '1d8', critical: '20', criticalMultiplier: 'x3' }}
        weaponBuffs={[{ id: 'qa-buff', ritualId: 'qa-ritual', ritualName: 'Amaldiçoar Arma',
          element: 'conhecimento', appliedAt: '', duration: 'cena', enhancements: [],
          bonusDamage: { diceCount: 1, diceType: 6, damageType: 'conhecimento' }, attackBonus: 0 }]}
        onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
      fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
      await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
      fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
      await waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({
        type: 'damage', isCritical: true, extraDice: 1,
      })), { timeout: 5000 });
      const damage = complete.mock.calls.map(([event]) => event).find(event => event.type === 'damage');
      expect(damage.dice).toHaveLength(4);
    });

    it.each([false, true])('aplica Máquina de Matar uma vez somente na arma favorita=%s', async favorite => {
      vi.mocked(rollSkillTest).mockReturnValueOnce({ type: 'attack', dice: [20], keptDice: 20,
        total: 25, skillBonus: 5, otherBonuses: 0, extraDice: 0, isCritical: true,
        isDisadvantage: false, timestamp: new Date(), label: 'Ataque QA' });
      const complete = vi.fn();
      const attributes = props.attributes;
      const unifiedEffects = consolidateEffects(getTrackEffects('aniquilador', 99, attributes), {
        attributes, nex: 99, hpCurrent: 20, hpMax: 20, peCurrent: 20, peMax: 20,
        inCombat: true, isFirstRound: false, currentRound: 2, hasShield: false,
        activeConditions: [], activatedEffects: [],
      });
      render(<Modal {...props} classTrack="aniquilador" nex={99} isFavoriteWeapon={favorite}
        unifiedEffects={unifiedEffects} weapon={{ ...props.weapon, type: 'Disparo', damage: '2d10',
          critical: '20', criticalMultiplier: 'x3' }}
        onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
      expect(screen.getByText(/(?:Crítico|Crit): (?:18|20)\+ x3/)).toHaveTextContent(favorite ? '18+' : '20+');
      fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
      await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
      fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
      await waitFor(() => expect(complete.mock.calls.some(([event]) => event.type === 'damage')).toBe(true), { timeout: 5000 });
      const damage = complete.mock.calls.map(([event]) => event).find(event => event.type === 'damage');
      expect(damage.dice).toHaveLength(favorite ? 9 : 6);
    });
  },
);

it('resumo legado não entrega a margem de Máquina de Matar a outra arma', () => {
  render(<CombatRollModal {...props} classTrack="aniquilador" nex={99} isFavoriteWeapon={false}
    classPowerBonuses={{ attackBonus: 0, damageBonus: 0, criticalMarginBonus: 2, extraDamageDice: ['+1d'] }}
    weapon={{ ...props.weapon, critical: '20' }} onPEChange={vi.fn()} />);
  expect(screen.getByText('Crítico: 20+ x2')).toBeVisible();
});

describe.each([['desktop',CombatRollModal],['mobile',MobileCombatRollModal]] as const)('Camuflagem: %s', (_name,Modal) => {
  it('requer contexto confirmado e cobertura total bloqueia antes da rolagem', () => {
    render(<Modal {...props} onPEChange={vi.fn()} onConfirmAttack={vi.fn().mockResolvedValue(true)} />);
    fireEvent.change(screen.getByRole('combobox',{name:'Camuflagem do alvo'}),{target:{value:'total'}});
    expect(screen.getByRole('button',{name:/rolar ataque/i})).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Conferi a camuflagem, a situação de visão e a possibilidade de atacar este alvo com a mesa.'));
    expect(screen.getByRole('button',{name:/rolar ataque/i})).toBeEnabled();
    fireEvent.click(screen.getByLabelText('Alvo tem cobertura total — não pode ser atacado.'));
    expect(screen.getByRole('button',{name:/rolar ataque/i})).toBeDisabled();
    expect(rollSkillTest).not.toHaveBeenCalled();
  });
  it('recibo de falha por camuflagem bloqueia o dano sem Defesa, inclusive crítico', async () => {
    const confirm=vi.fn(async request => {
      request.result.isCritical=true;
      request.result.concealmentResult={level:'total',attackerBlind:false,heatVisionApplied:false,chance:50,die:1,failed:true,targetDefense:null};
      return true;
    });
    render(<Modal {...props} onPEChange={vi.fn()} onConfirmAttack={confirm} />);
    fireEvent.change(screen.getByRole('combobox',{name:'Camuflagem do alvo'}),{target:{value:'total'}});
    fireEvent.click(screen.getByLabelText('Conferi a camuflagem, a situação de visão e a possibilidade de atacar este alvo com a mesa.'));
    fireEvent.click(screen.getByRole('button',{name:/rolar ataque/i}));
    await waitFor(()=>expect(screen.getByText(/falha por camuflagem; dano bloqueado/)).toBeInTheDocument(),{timeout:5000});
    expect(screen.queryByRole('button',{name:/rolar dano/i})).not.toBeInTheDocument();
    expect(confirm.mock.calls[0][0].selection.concealment).toBe('total');
  });
});

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

it('a tabela desktop reabre a arma pendente mesmo após selecionar outra', async () => {
  const confirm = vi.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce(true);
  const complete = vi.fn();
  render(<CombatWeaponsTable weapons={[props.weapon, { ...props.weapon, id: 'other', name: 'Machado' }]}
    attributes={props.attributes} skills={props.skills} characterClass="Combatente"
    currentPE={10} maxPE={10} nex={5} onPEChange={vi.fn()}
    onConfirmAttack={confirm} onRollComplete={complete} />);
  fireEvent.click(screen.getByRole('cell', { name: 'Faca' }));
  fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sem conexão'));
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('cell', { name: 'Machado' }));
  expect(screen.getByRole('button', { name: /tentar confirmar ataque/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /tentar confirmar ataque/i }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(confirm.mock.calls[1][0]).toBe(confirm.mock.calls[0][0]);
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
  it('permite sair após falha de rede e retoma a mesma confirmação ao reabrir', async () => {
    const close = vi.fn();
    const confirm = vi.fn().mockRejectedValueOnce(new Error('Conexão interrompida')).mockResolvedValueOnce(true);
    const complete = vi.fn();
    const { rerender } = render(<Modal {...props} onClose={close} onPEChange={vi.fn()}
      onConfirmAttack={confirm} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Conexão interrompida'));
    expect(screen.getByRole('alert')).toHaveTextContent('reabrir a arma');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledWith(true);
    rerender(<Modal {...props} open={false} onClose={close} onPEChange={vi.fn()}
      onConfirmAttack={confirm} onRollComplete={complete} />);
    rerender(<Modal {...props} onClose={close} onPEChange={vi.fn()}
      onConfirmAttack={confirm} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: /tentar confirmar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(rollSkillTest).toHaveBeenCalledOnce();
    expect(confirm.mock.calls[1][0]).toBe(confirm.mock.calls[0][0]);
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


describe.each([['desktop', CombatRollModal], ['mobile', MobileCombatRollModal]] as const)('Rajada no ataque e dano: %s', (_name, Modal) => {
  it.each([false, true])('aplica penalidade e dado da arma antes do crítico=%s', async critical => {
    vi.mocked(rollSkillTest).mockReturnValueOnce({ type: 'attack', dice: [18, 20], keptDice: 20, total: 25,
      skillBonus: 5, otherBonuses: 0, extraDice: 0, isCritical: critical, isDisadvantage: false, timestamp: new Date(), label: 'Ataque QA' });
    const confirm = vi.fn().mockResolvedValue(true); const complete = vi.fn();
    render(<Modal {...props} attributes={{ ...props.attributes, agility: 3 }} skills={{ pontaria: 1 }}
      weapon={{ id: 'qa-burst', name: 'Fuzil QA', type: 'Disparo', damage: '2d10', critical: '19', criticalMultiplier: 'x3', catalogId: 'fuzil_assalto' }}
      onConfirmAttack={confirm} onPEChange={vi.fn()} onRollComplete={complete} />);
    const toggle = screen.getByRole('checkbox', { name: 'Disparar em rajada' });
    expect(toggle).not.toBeChecked(); fireEvent.click(toggle);
    expect(screen.getByText(/Dados da arma em rajada: 3d10; no crítico ×3: 9d10/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(rollSkillTest).toHaveBeenCalledWith(expect.objectContaining({ attributeValue: 3, dicePenalty: 1 }));
    expect(confirm.mock.calls[0][0].selection.burst).toBe(true);
    expect(confirm.mock.calls[0][0].result.weaponBurst.extraWeaponDice).toBe(1);
    await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
    expect(screen.getByRole('checkbox', { name: 'Disparar em rajada' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ type: 'damage',
      dice: expect.any(Array), label: expect.stringContaining('Rajada') })), { timeout: 5000 });
    const damage = complete.mock.calls.map(call => call[0]).find(roll => roll.type === 'damage');
    expect(damage.dice).toHaveLength(critical ? 9 : 3);
    await waitFor(() => expect(screen.getByText(_name === 'desktop' ? `(${critical ? 9 : 3}d10)` : `Dados de Dano — arma ${critical ? 9 : 3}d10`)).toBeVisible(), { timeout: 5000 });
    await waitFor(() => expect(screen.getByRole('button', { name: /novo ataque/i })).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /novo ataque/i }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Disparar em rajada' })).not.toBeChecked());
  });
  it('Compensador cancela penalidade de rajada, não condições', async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    render(<Modal {...props} attributes={{ ...props.attributes, agility: 3 }} activeConditions={['fraco']}
      weapon={{ id: 'qa-burst', name: 'Fuzil QA', type: 'Disparo', damage: '2d10', catalogId: 'fuzil_assalto', appliedModifications: ['compensador'] }}
      onConfirmAttack={confirm} onPEChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Disparar em rajada' }));
    expect(screen.getByText(/Compensador anula o −1d20/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    expect(confirm.mock.calls[0][0].result.weaponBurst.dicePenalty).toBe(0);
    expect(rollSkillTest).toHaveBeenCalledWith(expect.objectContaining({ dicePenalty: 1 }));
  });
  it('não oferece rajada para pistola semiautomática e habilita com Ferrolho', () => {
    const weapon = { id: 'qa-pistol', name: 'Pistola', type: 'Disparo' as const, damage: '1d12', special: 'Semiautomática' };
    const view = render(<Modal {...props} weapon={weapon} onConfirmAttack={vi.fn()} onPEChange={vi.fn()} />);
    expect(screen.queryByRole('checkbox', { name: 'Disparar em rajada' })).toBeNull();
    view.rerender(<Modal {...props} weapon={{ ...weapon, appliedModifications: ['ferrolho_automatico'] }} onConfirmAttack={vi.fn()} onPEChange={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Disparar em rajada' })).toBeInTheDocument();
  });
});


describe.each([['desktop', CombatRollModal], ['mobile', MobileCombatRollModal]] as const)('Interações da rajada: %s', (name, Modal) => {
  it.each([false, true])('preserva Dum dum/Explosiva e dano máximo=%s', async maximum => {
    vi.mocked(rollSkillTest).mockReturnValueOnce({ type: 'attack', dice: [20], keptDice: 20, total: 25,
      skillBonus: 5, otherBonuses: 0, extraDice: 0, isCritical: true, isDisadvantage: false, timestamp: new Date(), label: 'Ataque QA' });
    const complete = vi.fn();
    render(<Modal {...props} weapon={{ id: 'qa-burst-ammo', name: 'Fuzil QA', type: 'Disparo', damage: '2d10', critical: '19', criticalMultiplier: 'x2', catalogId: 'fuzil_assalto', ammoType: 'balas_longas' }}
      advancedBonuses={{ atirarParaMatar: maximum }}
      ammunition={[{ id: 'qa-ammo', name: 'Pacote QA', catalogType: 'municao', catalogId: 'municao_longa', appliedAmmoModifications: ['dum_dum', 'explosiva'] }]}
      onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Munição usada neste ataque' }), { target: { value: 'qa-ammo' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Disparar em rajada' }));
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /rolar dano/i })).toBeEnabled(), { timeout: 5000 });
    fireEvent.click(screen.getByRole('button', { name: /rolar dano/i }));
    await waitFor(() => expect(complete.mock.calls.some(([roll]) => roll.type === 'damage')).toBe(true), { timeout: 5000 });
    const damage = complete.mock.calls.map(([roll]) => roll).find(roll => roll.type === 'damage');
    expect(damage.dice).toHaveLength(11); // (2+1)d10 ×3 de crítico, mais 2d6 Explosiva.
    expect(damage.extraDice).toBe(2);
    if (maximum) expect(damage.dice.slice(0, 9)).toEqual(Array(9).fill(10));
  });
  it('crítico com total insuficiente não libera dano de rajada', async () => {
    vi.mocked(rollSkillTest).mockReturnValueOnce({ type: 'attack', dice: [20], keptDice: 20, total: 25,
      skillBonus: 5, otherBonuses: 0, extraDice: 0, isCritical: true, isDisadvantage: false, timestamp: new Date(), label: 'Ataque QA' });
    const complete = vi.fn();
    render(<Modal {...props} weapon={{ id: 'qa-burst-miss', name: 'Fuzil QA', type: 'Disparo', damage: '2d10', catalogId: 'fuzil_assalto' }}
      onConfirmAttack={vi.fn().mockResolvedValue(true)} onPEChange={vi.fn()} onRollComplete={complete} />);
    fireEvent.change(screen.getByPlaceholderText(name === 'desktop' ? 'DT' : '--'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Disparar em rajada' }));
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce(), { timeout: 5000 });
    const damageButton = screen.queryByRole('button', { name: /rolar dano/i });
    if (damageButton) { expect(damageButton).toBeDisabled(); fireEvent.click(damageButton); }
    expect(complete.mock.calls.some(([roll]) => roll.type === 'damage')).toBe(false);
  });
});


describe.each([['desktop', CombatRollModal], ['mobile', MobileCombatRollModal]] as const)('Reenvio de rajada: %s', (_name, Modal) => {
  it('conserva escolha e dados na resposta incerta mesmo após pedir para fechar', async () => {
    const confirm = vi.fn().mockRejectedValueOnce(new Error('Resposta incerta')).mockResolvedValueOnce(true);
    const close = vi.fn(); const complete = vi.fn();
    render(<Modal {...props} onClose={close} weapon={{ id: 'qa-burst-retry', name: 'Fuzil QA', type: 'Disparo', damage: '2d10', catalogId: 'fuzil_assalto' }}
      onConfirmAttack={confirm} onPEChange={vi.fn()} onRollComplete={complete} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Disparar em rajada' }));
    fireEvent.click(screen.getByRole('button', { name: /rolar ataque/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Resposta incerta'));
    expect(screen.getByRole('checkbox', { name: 'Disparar em rajada' })).toBeDisabled();
    fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalledWith(true);
    const request = confirm.mock.calls[0][0];
    fireEvent.click(screen.getByRole('button', { name: /tentar confirmar ataque/i }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(confirm.mock.calls[1][0]).toBe(request);
    expect(rollSkillTest).toHaveBeenCalledOnce();
  });
});
