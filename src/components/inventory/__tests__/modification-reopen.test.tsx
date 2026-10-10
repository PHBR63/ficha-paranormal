import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    const locked = screen.getAllByRole('checkbox').filter(e => (e as HTMLButtonElement).disabled);
    expect(locked).toHaveLength(1);
    expect(locked[0]).toHaveAttribute('data-state', 'checked');
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
    fireEvent.click(locked[0]);
    expect(props.onApplyModifications).not.toHaveBeenCalled();
    view.rerender(make({ ...props, open: false, currentModifications: [mod] }));
    view.rerender(make({ ...props, open: true, currentModifications: [mod] }));
    expect(screen.getByRole('button', { name: 'Aplicar Modificações' })).toBeDisabled();
  });
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
