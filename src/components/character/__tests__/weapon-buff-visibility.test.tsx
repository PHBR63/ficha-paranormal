import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CombatWeaponsTable } from '../CombatWeaponsTable';
import { MobileCombatPanel } from '../mobile/MobileCombatPanel';
import type { WeaponBuff } from '@/hooks/useWeaponBuffs';
import type { ReactNode } from 'react';
vi.mock('../CombatRollModal', () => ({ CombatRollModal: () => null }));
// A animação de entrada não participa da visibilidade estrutural dos bônus.
vi.mock('framer-motion', () => ({ AnimatePresence: ({children}: {children: ReactNode}) => children,
  motion: { div: ({children,className}: {children: ReactNode;className?: string}) => <div className={className}>{children}</div> },
}));
const buffs: WeaponBuff[] = [{ id: 'application', ritualId: 'ritual', ritualName: 'Amaldiçoar Arma', element: 'conhecimento',
  appliedAt: '', duration: 'cena', enhancements: [], bonusDamage: { diceCount: 1, diceType: 6, damageType: 'conhecimento' },
  attackBonus: 2, effectOrigin: { applicationId: 'application',castEventId: 'cast',ritualId: 'ritual',ritualName: 'Amaldiçoar Arma',
    campaignId: 'campaign',campaignVersion: 'v2',sceneNumber: 5,expiresAtSceneEnd: true },
}];
describe('Bônus persistidos sem arma equipada', () => {
  it.each(['desktop','mobile'])('%s mostra bônus, origem e duração sem precisar equipar arma', mode => {
    render(mode === 'desktop' ? <CombatWeaponsTable weapons={[]} weaponBuffs={buffs} />
      : <MobileCombatPanel weapons={[]} weaponBuffs={buffs} agility={1} onWeaponClick={vi.fn()} />);
    expect(screen.getByText('Amaldiçoar Arma')).toBeVisible();
    expect(screen.getByText(/Até encerrar a cena 5 da campanha de origem/)).toBeVisible();
    expect(screen.getByText(/1d6/)).toBeVisible();
    expect(screen.getByText(/\+2 ataque/)).toBeVisible();
  });
});
