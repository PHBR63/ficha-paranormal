import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConditionManager } from '../ConditionManager';

afterEach(cleanup);

describe('condições externas na interface desktop', () => {
  it('mantém o nome e a descrição da condição desconhecida ao expandir a lista', () => {
    render(<ConditionManager conditions={[{ id: 'mesa-42', name: 'Marca da mesa', turnsRemaining: 4,
      addedAt: new Date(), params: { customEffect: 'Conferir com o mestre' } }]} onConditionsChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /CONDIÇÕES/ }));
    expect(screen.getByText('Marca da mesa')).toBeTruthy();
    expect(screen.getByText(/Condição não reconhecida/)).toBeTruthy();
    expect(screen.getByText('Conferir com o mestre')).toBeTruthy();
  });
});
