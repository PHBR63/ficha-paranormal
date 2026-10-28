import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { CharacterSheetHeader } from '../CharacterSheetHeader';
import { CombatStatsCard } from '../CombatStatsCard';
afterEach(cleanup);
const resources = { hpCurrent: 12, hpMax: 20, peCurrent: 3, peMax: 5, sanCurrent: 10, sanMax: 15 };

function DesktopResourceEditor(props: ComponentProps<typeof CombatStatsCard>) {
  return <CharacterSheetHeader {...props} name="Agente" characterClass="Combatente" origin="Militar"
    nex={5} patent="Recruta" defense={11} movement={9} />;
}

it('mostra dano não letal e o dano combinado junto dos PV', () => {
  render(<CharacterSheetHeader {...resources} nonlethalDamage={6} name="Agente"
    characterClass="Combatente" origin="Militar" nex={20} patent="Operador"
    defense={15} movement={9} />);
  expect(screen.getByText('Dano não letal 6 · combinado 14/20')).toBeInTheDocument();
});

describe.each([
  ['card mobile', CombatStatsCard, 'Editar recursos', 'Salvar recursos'],
  ['header desktop', DesktopResourceEditor, 'Editar recursos da ficha', 'Salvar recursos da ficha'],
] as const)('Confirmação de recursos: %s', (_name, Editor, editLabel, saveLabel) => {
it('mantém o editor bloqueado até confirmar e envia os três recursos juntos', async () => {
  let resolve!: (value: boolean) => void;
  const save = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
  render(<Editor {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: editLabel }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PV atual' }), { target: { value: '11' } });
  fireEvent.click(screen.getByRole('button', { name: saveLabel }));
  fireEvent.click(screen.getByRole('button', { name: saveLabel }));
  expect(save).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledWith({ hp: 11, pe: 3, san: 10 });
  expect(screen.getByRole('spinbutton', { name: 'PV atual' })).toBeDisabled();
  await act(async () => resolve(true));
  expect(screen.queryByRole('spinbutton', { name: 'PV atual' })).not.toBeInTheDocument();
});



it.each(['false', 'exception'])('não fecha nem apaga a edição quando servidor retorna %s', async failure => {
  const save = failure === 'false' ? vi.fn().mockResolvedValue(false) : vi.fn().mockRejectedValue(new Error('Network error'));
  render(<Editor {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: editLabel }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PE atual' }), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: saveLabel }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível confirmar'));
  expect(screen.getByRole('spinbutton', { name: 'PE atual' })).toHaveValue(2);
  expect(screen.getByRole('button', { name: saveLabel })).toBeEnabled();
});

it.each(['', '-1', '2.5', '6'])('rejeita PE inválido %s sem salvar nem truncar', invalid => {
  const save = vi.fn();
  render(<Editor {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: editLabel }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PE atual' }), { target: { value: invalid } });
  fireEvent.click(screen.getByRole('button', { name: saveLabel }));
  expect(screen.getByRole('alert')).toHaveTextContent('valores inteiros');
  expect(save).not.toHaveBeenCalled();
});

});

it('header conserva os limites com bônus já exibidos, sem truncar o valor antes do servidor', async () => {
  const save = vi.fn().mockResolvedValue(false);
  render(<CharacterSheetHeader {...resources} name="Agente" characterClass="Combatente" origin="Militar"
    nex={5} patent="Recruta" defense={11} movement={9} hpBonus={5} peBonus={2} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar recursos da ficha' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PV atual' }), { target: { value: '25' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PE atual' }), { target: { value: '7' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos da ficha' }));
  expect(save).toHaveBeenCalledWith({ hp: 25, pe: 7, san: 10 });
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível confirmar'));
  expect(screen.getByRole('spinbutton', { name: 'PV atual' })).toHaveValue(25);
});
