import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SustainedRitualControl } from '../SustainedRitualControl';
import type { SustainedRitual } from '@/hooks/useSustainedRituals';
const fake = vi.hoisted(() => ({ confirm: vi.fn(), success: vi.fn() }));
vi.mock('@/services/sustained-ritual-service', () => ({ confirmSustainedAction: fake.confirm }));
vi.mock('sonner', () => ({ toast: { success: fake.success } }));
// Os cartões já possuem testes próprios; aqui testamos a comunicação e confirmação.
vi.mock('../SustainedRitualsPanel', () => ({ SustainedRitualsPanel: ({ onDeactivate }: { onDeactivate: (id: string) => void }) => <button onClick={() => onDeactivate('sustain')}>Encerrar ritual</button> }));
vi.mock('../mobile/MobileSustainedRitualsPanel', () => ({ MobileSustainedRitualsPanel: ({ onDeactivate }: { onDeactivate: (id: string) => void }) => <button onClick={() => onDeactivate('sustain')}>Encerrar ritual mobile</button> }));
const ritual: SustainedRitual = { id: 'sustain', characterId: 'caster', casterCharacterId: 'caster', ritualId: 'qa', ritualName: 'Armadura QA',
  circle: 1, element: 'Sangue', selectedEnhancements: [], sustainConfig: {}, turnsActive: 0, peSpentTotal: 0,
  isConcentrating: false, startedAt: new Date(), snapshot: { id: 'sustain', ritual_id: 'qa', turns_active: 0, pe_spent_total: 0, sustain_config: {}, is_concentrating: false } };
const reload = vi.fn(); const refetch = vi.fn();
beforeEach(() => { vi.clearAllMocks(); reload.mockResolvedValue(true); refetch.mockResolvedValue({}); fake.confirm.mockResolvedValue({}); });
function setup(mobile = false, rituals = [ritual], error: string | null = null) {
  return render(<SustainedRitualControl characterId="caster" peCurrent={10} mobile={mobile}
    state={{ rituals, loading: false, error, reload }} onRefetch={refetch} />);
}
describe('confirmação explícita da sustentação', () => {
  it('bloqueia encerramento sem motivo e permite cancelar sem alteração', () => {
    setup(); fireEvent.click(screen.getByText('Encerrar ritual'));
    expect((screen.getByText('Confirmar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(fake.confirm).not.toHaveBeenCalled();
  });
  it('exige confirmação de alcance e explicação para ajuste manual', () => {
    setup(); fireEvent.click(screen.getByText('Encerrar ritual'));
    fireEvent.change(screen.getByLabelText('Motivo do encerramento'), { target: { value: 'voluntario' } });
    expect((screen.getByText('Confirmar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Confirmo que o conjurador está dentro do alcance do ritual.'));
    expect((screen.getByText('Confirmar') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(screen.getByLabelText('Motivo do encerramento'), { target: { value: 'ajuste_manual' } });
    expect((screen.getByText('Confirmar') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Descrição do motivo (obrigatória)'), { target: { value: 'Conferência do legado' } });
    expect((screen.getByText('Confirmar') as HTMLButtonElement).disabled).toBe(false);
    expect(fake.confirm).not.toHaveBeenCalled();
  });
  it('conserva motivo e identidade ao recuperar um encerramento incerto', async () => {
    fake.confirm.mockRejectedValueOnce(new Error('Sem resposta')).mockResolvedValueOnce({});
    setup(); fireEvent.click(screen.getByText('Encerrar ritual'));
    fireEvent.change(screen.getByLabelText('Motivo do encerramento'), { target: { value: 'nao_mantido' } });
    fireEvent.click(screen.getByText('Confirmar'));
    await screen.findByText('Recuperar mesma confirmação');
    expect((screen.getByLabelText('Motivo do encerramento').closest('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Recuperar mesma confirmação'));
    await waitFor(() => expect(fake.success).toHaveBeenCalledOnce());
    expect(fake.confirm.mock.calls[1][0]).toEqual(fake.confirm.mock.calls[0][0]);
    expect(fake.confirm.mock.calls[0][0].endReason.kind).toBe('nao_mantido');
  });
  it('mostra saldo e custo, sem enviar cobrança na seleção nem ao cancelar', () => {
    setup(); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByText('Revisar manutenção'));
    expect(screen.getByText(/Saldo: 10 → 9 PE/)).toBeTruthy();
    expect(fake.confirm).not.toHaveBeenCalled(); fireEvent.click(screen.getByText('Cancelar'));
    expect(fake.confirm).not.toHaveBeenCalled();
  });
  it('não anuncia sucesso enquanto o servidor está pendente', async () => {
    let resolve!: (value: unknown) => void;
    fake.confirm.mockImplementation(() => new Promise(value => { resolve = value; }));
    setup(); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByText('Revisar manutenção'));
    fireEvent.click(screen.getByText('Confirmar'));
    expect(fake.success).not.toHaveBeenCalled(); expect(refetch).not.toHaveBeenCalled();
    resolve({}); await waitFor(() => expect(refetch).toHaveBeenCalledOnce());
    expect(fake.success).toHaveBeenCalledOnce();
  });
  it('recupera pedido incerto com o mesmo UUID e snapshot', async () => {
    fake.confirm.mockRejectedValueOnce(new Error('Sem resposta')).mockResolvedValueOnce({});
    setup(); fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByText('Revisar manutenção'));
    fireEvent.click(screen.getByText('Confirmar'));
    await screen.findByText('Recuperar mesma confirmação');
    expect(fake.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Recuperar mesma confirmação'));
    await waitFor(() => expect(fake.success).toHaveBeenCalledOnce());
    expect(fake.confirm.mock.calls[1][0]).toEqual(fake.confirm.mock.calls[0][0]);
  });
  it('encerramento mobile envia operação real somente após confirmar', async () => {
    setup(true); fireEvent.click(screen.getByText('Encerrar ritual mobile'));
    expect(fake.confirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Motivo do encerramento'), { target: { value: 'nao_mantido' } });
    fireEvent.click(screen.getByText('Confirmar'));
    await waitFor(() => expect(fake.confirm).toHaveBeenCalledOnce());
    expect(fake.confirm.mock.calls[0][0].action).toBe('end');
  });
  it('erro de leitura aparece mesmo com lista vazia', () => {
    setup(false, [], 'Falha na leitura'); expect(screen.getByRole('alert').textContent).toContain('Falha na leitura');
  });
  it('não cobra de um alvo nem atribui origem aos legados', () => {
    setup(false, [{ ...ritual, casterCharacterId: null }]);
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/origem antiga não comprovada/)).toBeTruthy();
  });
});
