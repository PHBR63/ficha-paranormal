import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MedicoDeCampoPanel } from '../MedicoDeCampoPanel';

describe('Médico de Campo com PE atualizado', () => {
  it('bloqueia Paramédico quando o saldo cai abaixo do custo e libera após reposição', () => {
    const onPEChange = vi.fn();
    const props = { classTrack: 'medico-campo', nex: 10, onPEChange };
    const view = render(<MedicoDeCampoPanel {...props} peCurrent={2} />);

    expect(screen.getByRole('button', { name: 'Usar' })).toBeEnabled();
    view.rerender(<MedicoDeCampoPanel {...props} peCurrent={1} />);
    expect(screen.getByRole('button', { name: 'Usar' })).toBeDisabled();
    view.rerender(<MedicoDeCampoPanel {...props} peCurrent={2} />);
    expect(screen.getByRole('button', { name: 'Usar' })).toBeEnabled();
  });
});
