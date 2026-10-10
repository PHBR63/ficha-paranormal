import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { WeaponModificationModal } from '../WeaponModificationModal';
import { ArmorModificationModal } from '../ArmorModificationModal';
import { AccessoryModificationModal } from '../AccessoryModificationModal';
import { AmmoModificationModal } from '../AmmoModificationModal';
import { ALL_WEAPONS } from '@/lib/catalogs/weapons-catalog';
import { BASE_ARMORS } from '@/lib/catalogs/armor-catalog';
vi.mock('framer-motion', async () => ({ ...await vi.importActual('framer-motion'), AnimatePresence: ({ children }: { children: ReactNode }) => children }));
afterEach(cleanup);
const weapon = ALL_WEAPONS.find(w => w.type === 'melee' && w.category !== 'especial')!;
const cases = [
  { kind: 'arma corpo a corpo', mod: 'certeira', make: (props: any) => <WeaponModificationModal weapon={weapon} {...props} /> },
  { kind: 'arma de fogo', mod: 'alongada', make: (props: any) => <WeaponModificationModal weapon={ALL_WEAPONS.find(w => w.type === 'firearm')!} {...props} /> },
  { kind: 'proteção', mod: 'reforcada', make: (props: any) => <ArmorModificationModal armor={BASE_ARMORS[0]} {...props} /> },
  { kind: 'equipamento', mod: 'discreto', make: (props: any) => <AccessoryModificationModal itemName="Equipamento" itemCategory="0" itemSpaces={2} {...props} /> },
  { kind: 'munição', mod: 'dum_dum', make: (props: any) => <AmmoModificationModal itemName="Munição" itemCategory="0" {...props} /> },
];
describe('Reabrir modificações', () => {
  it.each(cases)('$kind: melhoria persistida fica marcada, indisponível e não pode ser reaplicada', ({ make, mod }) => {
    const props = { open: false, currentModifications: [], onOpenChange: vi.fn(), onApplyModifications: vi.fn() };
    const view = render(make(props));
    view.rerender(make({ ...props, open: true, currentModifications: [mod] }));
    const locked = screen.getAllByRole('checkbox').filter(e => (e as HTMLButtonElement).disabled && e.getAttribute('data-state') === 'checked');
    expect(locked).toHaveLength(1);
    expect(locked[0]).toHaveAttribute('data-state', 'checked');
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
    fireEvent.click(locked[0]);
    expect(props.onApplyModifications).not.toHaveBeenCalled();
    view.rerender(make({ ...props, open: false, currentModifications: [mod] }));
    view.rerender(make({ ...props, open: true, currentModifications: [mod] }));
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
  });
  it.each([['reforcada', 1, 0, 'Reforçada'], ['discreta', 0, 1, 'Discreta']] as const)(
    '%s bloqueia a alternativa na seleção e após reabrir', (mod, selectedIndex, blockedIndex, label) => {
      const props = { open: true, currentModifications: [], onOpenChange: vi.fn(), onApplyModifications: vi.fn() };
      const view = render(<ArmorModificationModal armor={BASE_ARMORS[0]} {...props} />);
      fireEvent.click(screen.getAllByRole('checkbox')[selectedIndex]);
      expect(screen.getAllByRole('checkbox')[blockedIndex]).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent('Incompatível com ' + label);
      fireEvent.click(screen.getAllByRole('checkbox')[blockedIndex]);
      expect(screen.getAllByRole('checkbox')[blockedIndex]).toHaveAttribute('data-state', 'unchecked');
      fireEvent.click(screen.getAllByRole('checkbox')[selectedIndex]);
      expect(screen.getAllByRole('checkbox')[blockedIndex]).toBeEnabled();
      view.rerender(<ArmorModificationModal armor={BASE_ARMORS[0]} {...props} currentModifications={[mod]} />);
      expect(screen.getAllByRole('checkbox')[blockedIndex]).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
    }
  );
  it('bloqueia confirmação repetida enquanto aguarda o servidor', async () => {
    let resolve!: () => void;
    const save = vi.fn(() => new Promise<void>(done => { resolve = done; }));
    const close = vi.fn();
    render(<WeaponModificationModal open onOpenChange={close} weapon={weapon} currentModifications={[]} onApplyModifications={save} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    expect(save).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    resolve();
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
  });
  it('falha na gravação mantém o modal aberto e permite repetir sem fechar antes da confirmação', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    const close = vi.fn();
    render(<WeaponModificationModal open onOpenChange={close} weapon={weapon} currentModifications={[]} onApplyModifications={save} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeEnabled());
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(save.mock.calls[0][0]).toEqual(save.mock.calls[1][0]);
  });
});

// Exercita o requisito na tela real, inclusive a seleção simultânea de Ferrolho.
describe('Compensador visível com requisito', () => {
  const gun = ALL_WEAPONS.find(w => w.id === 'pistola')!;
  const checkbox = (name: string) => within(screen.getByText(name, { exact: true }).closest('.flex.items-start')!).getByRole('checkbox');
  const mount = (selected: any[] = [], automatic = false) => {
    const save = vi.fn();
    render(<WeaponModificationModal open weapon={automatic ? ALL_WEAPONS.find(w => w.id === 'fuzil_assalto')! : gun}
      currentModifications={selected} onOpenChange={vi.fn()} onApplyModifications={save} />);
    return save;
  };
  it('exibe Compensador bloqueado e explica a exigência de arma automática', () => {
    mount();
    expect(checkbox('Compensador')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Requer arma automática');
  });
  it('permite Ferrolho e Compensador juntos, mas bloqueia salvar ao retirar o requisito', async () => {
    const save = mount();
    fireEvent.click(checkbox('Ferrolho Automático'));
    expect(checkbox('Compensador')).toBeEnabled();
    fireEvent.click(checkbox('Compensador'));
    fireEvent.click(checkbox('Ferrolho Automático'));
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(checkbox('Ferrolho Automático'));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Modificações' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(['compensador', 'ferrolho_automatico']));
  });
  it('habilita em arma originalmente automática', () => {
    mount([], true);
    expect(checkbox('Compensador')).toBeEnabled();
  });
  it('mantém Compensador instalado bloqueado contra reaplicação', () => {
    mount(['ferrolho_automatico', 'compensador']);
    expect(checkbox('Compensador')).toBeDisabled();
    expect(checkbox('Compensador')).toHaveAttribute('data-state', 'checked');
  });
});
