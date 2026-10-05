import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MobilePowersTab } from '../MobilePowersTab';

afterEach(cleanup);

it.each(['Combatente', 'Especialista', 'Ocultista'])('usa a descrição da classe %s na habilidade homônima', characterClass => {
  const onPowerClick = vi.fn();
  render(<MobilePowersTab abilities={['Habilidade de Trilha']} characterClass={characterClass}
    originPowers={[]} rituals={[]} powerLimits={{ total: 0, fromTranscender: 0, fromOrigin: 0 }}
    ritualLimits={null} hasExcessPowers={false} hasExcessRituals={false} onPowerClick={onPowerClick}
    onOpenExcessPowersModal={vi.fn()} onOpenExcessRitualsModal={vi.fn()} onOpenRemovedPowersHistory={vi.fn()} />);
  const ability = screen.getByRole('button', { name: /Habilidade de Trilha/ });
  expect(ability).toHaveTextContent(new RegExp(`trilhas de ${characterClass.toLowerCase()}`));
  fireEvent.click(ability);
  expect(onPowerClick).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Habilidade de Trilha', description: expect.stringMatching(new RegExp(`trilhas de ${characterClass.toLowerCase()}`)),
  }));
});
