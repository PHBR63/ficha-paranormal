import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CombatStatsCard } from '../CombatStatsCard';
afterEach(cleanup);
const resources = { hpCurrent: 12, hpMax: 20, peCurrent: 3, peMax: 5, sanCurrent: 10, sanMax: 15 };

it('mantém o editor bloqueado até confirmar e envia os três recursos juntos', async () => {
  let resolve!: (value: boolean) => void;
  const save = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
  render(<CombatStatsCard {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar recursos' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PV atual' }), { target: { value: '11' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos' }));
  expect(save).toHaveBeenCalledOnce();
  expect(save).toHaveBeenCalledWith({ hp: 11, pe: 3, san: 10 });
  expect(screen.getByRole('spinbutton', { name: 'PV atual' })).toBeDisabled();
  await act(async () => resolve(true));
  expect(screen.queryByRole('spinbutton', { name: 'PV atual' })).not.toBeInTheDocument();
});

it.each(['false', 'exception'])('não fecha nem apaga a edição quando servidor retorna %s', async failure => {
  const save = failure === 'false' ? vi.fn().mockResolvedValue(false) : vi.fn().mockRejectedValue(new Error('Network error'));
  render(<CombatStatsCard {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar recursos' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PE atual' }), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível confirmar'));
  expect(screen.getByRole('spinbutton', { name: 'PE atual' })).toHaveValue(2);
  expect(screen.getByRole('button', { name: 'Salvar recursos' })).toBeEnabled();
});

it.each(['', '-1', '2.5', '6'])('rejeita PE inválido %s sem salvar nem truncar', invalid => {
  const save = vi.fn();
  render(<CombatStatsCard {...resources} onStatsChange={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Editar recursos' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'PE atual' }), { target: { value: invalid } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos' }));
  expect(screen.getByRole('alert')).toHaveTextContent('valores inteiros');
  expect(save).not.toHaveBeenCalled();
});
