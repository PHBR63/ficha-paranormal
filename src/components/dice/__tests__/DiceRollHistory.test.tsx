import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DiceRollHistoryDrawer } from '../DiceRollHistory';
import type { DiceRollResult } from '@/lib/dice-roller';

afterEach(cleanup);

describe('detalhamento do histórico', () => {
  it('explica o total com perícia e outros bônus, incluindo negativos', () => {
    const roll: DiceRollResult = { dice: [17], keptDice: 17, skillBonus: -5, otherBonuses: 10,
      extraDice: 0, total: 22, isDisadvantage: false, isCritical: false,
      timestamp: new Date(), type: 'skill', label: 'Iniciativa' };
    render(<DiceRollHistoryDrawer rolls={[roll]} />);
    fireEvent.click(screen.getByRole('button', { name: /HISTÓRICO DE ROLAGENS/ }));
    expect(screen.getByText('-5 perícia')).toBeTruthy();
    expect(screen.getByText('+10 outros modificadores')).toBeTruthy();
    expect(screen.getByText('= 22')).toBeTruthy();
  });
});
