import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MobileOverviewTab } from '../MobileOverviewTab';

// Painéis independentes não participam do cálculo nem da apresentação da Defesa.
vi.mock('../MobileCombatPanel', () => ({ MobileCombatPanel: () => null }));
vi.mock('../MobileRollHistory', () => ({ MobileRollHistory: () => null }));
vi.mock('../MobileConditionManager', () => ({ MobileConditionManager: () => null }));
vi.mock('../MobileClassPowersPanel', () => ({ MobileClassPowersPanel: () => null }));
vi.mock('../MobileParanormalPowersActivationPanel', () => ({ MobileParanormalPowersActivationPanel: () => null }));
vi.mock('../../BonusSummaryCard', () => ({ BonusSummaryCard: () => null }));
afterEach(cleanup);

function renderOverview(onResourcesChange?: (stats: { hp: number; pe: number; san: number }) => Promise<boolean>) {
  render(<MobileOverviewTab
    character={{ id: 'ficha', name: 'Agente', class: 'Combatente', origin: 'militar', nex: 5, patent: 'Recruta',
      hp_current: 20, hp_max: 20, pe_current: 2, pe_max: 2, san_current: 12, san_max: 12,
      defense: 11, movement: 9, agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1 }}
    conditions={[]} bonusSummary={{ defense: { total: 0, breakdown: [
      { source: 'Condição: Vulnerável', type: 'ability', bonus: -2, active: true },
      { source: 'Patrulha', type: 'origin', bonus: 2, active: true },
      { source: 'Armadura ritual', type: 'ritual', bonus: 5, active: true, excluded: true, excludedReason: 'Outra proteção maior' },
      { source: 'Proteção inativa', type: 'ritual', bonus: 3, active: false },
    ] } }} totalDefense={11} defenseBonuses={{ resistances: { fortitude: 0, reflexos: 0, vontade: 0 } }}
    equippedWeapons={[]} weaponBuffs={[]} rollHistory={[]}
    attributeValidation={{ isValid: true, normalized: { agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1 } }}
    onOpenDiceRoller={vi.fn()} onOpenRest={vi.fn()} onLevelUp={vi.fn()} onEditStats={vi.fn()}
    onOpenCombat={vi.fn()} onRollInitiative={vi.fn()} onClearHistory={vi.fn()} onRemoveRoll={vi.fn()}
    onConditionsChange={vi.fn()} onPEChange={vi.fn()} onResourcesChange={onResourcesChange}
  />);
}

it('abre detalhes por toque e mostra penalidade, bônus ativo e bônus excluído com seus valores reais', () => {
  renderOverview();
  fireEvent.click(screen.getByRole('button', { name: 'Detalhes da Defesa' }));
  expect(screen.getByText('Condição: Vulnerável: -2')).toBeVisible();
  expect(screen.getByText('Patrulha: +2')).toBeVisible();
  expect(screen.getByText('Armadura ritual: +5 (não acumula: Outra proteção maior)')).toBeVisible();
  expect(screen.getByText('Proteção inativa: +3 (inativo)')).toBeVisible();
});

it('abre edição de recursos na visão geral e envia PV, PE e SAN ao gravador de recursos', async () => {
  const save = vi.fn().mockResolvedValue(true);
  renderOverview(save);
  fireEvent.click(screen.getByRole('button', { name: 'Editar recursos' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'SAN atual' }), { target: { value: '11' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar recursos' }));
  expect(save).toHaveBeenCalledWith({ hp: 20, pe: 2, san: 11 });
  await waitFor(() => expect(screen.queryByRole('spinbutton', { name: 'SAN atual' })).not.toBeInTheDocument());
});
