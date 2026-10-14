import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SneakAttackSelector, createEmptySneakAttackConfig, type SneakAttackConfig } from '../SneakAttackSelector';

const rifle = { type: 'Disparo', weaponType: 'firearm', range: 'Longo', baseRange: 'Médio', appliedModifications: ['mira_telescopica'] };

describe.each(['default', 'compact'] as const)('Ataque Furtivo no layout %s', variant => {
  it('mostra alcance, condição e a exceção da Mira ao ativar', () => {
    const onConfigChange = vi.fn();
    const config: SneakAttackConfig = { ...createEmptySneakAttackConfig(), enabled: true };
    const { rerender } = render(<SneakAttackSelector weapon={rifle} nex={40} currentPE={3}
      config={config} onConfigChange={onConfigChange} variant={variant} />);
    expect(screen.getByText(/Mira Telescópica instalada/)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toMatch(/Declare o alcance/);
    fireEvent.change(screen.getByLabelText('Alcance do Ataque Furtivo'), { target: { value: 'long' } });
    expect(onConfigChange).toHaveBeenCalledWith({ enabled: true, declaration: { range: 'long' } });
    rerender(<SneakAttackSelector weapon={rifle} nex={40} currentPE={3}
      config={{ enabled: true, declaration: { range: 'long' } }} onConfigChange={onConfigChange} variant={variant} />);
    fireEvent.change(screen.getByLabelText('Condição do alvo para Ataque Furtivo'), { target: { value: 'flat_footed' } });
    expect(onConfigChange).toHaveBeenLastCalledWith({ enabled: true, declaration: { range: 'long', targetStatus: 'flat_footed' } });
  });
});
