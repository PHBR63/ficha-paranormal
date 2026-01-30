/**
 * CampaignCombatTab - Aba de combate stateless para CampaignView
 * 
 * Recebe estado de combate e board via props (Singleton Pattern)
 * Integra CombatTracker com IntegratedCombatBoard
 * 
 * @module components/campaign/tabs/CampaignCombatTab
 */

import { CombatTracker } from '@/components/combat/CombatTracker';
import { IntegratedCombatBoard } from '@/components/combat/IntegratedCombatBoard';
import { type CombatState } from '@/lib/game-engine';
import { type TacticalBoardReturn } from '@/hooks/campaign/useTacticalBoard';

interface CampaignCombatTabProps {
  campaignId: string;
  isMaster: boolean;
  board: TacticalBoardReturn;
  combatState: CombatState;
  onCombatUpdate: (state: CombatState) => void;
  movementPerRound?: number;
}

export function CampaignCombatTab({
  campaignId,
  isMaster,
  board,
  combatState,
  onCombatUpdate,
  movementPerRound = 9,
}: CampaignCombatTabProps) {
  return (
    <div className="space-y-8 w-full">
      {/* CombatTracker principal */}
      <CombatTracker
        campaignId={campaignId}
        isMaster={isMaster}
        onCombatUpdate={onCombatUpdate}
      />
      
      {/* Integração com tabuleiro tático */}
      <IntegratedCombatBoard
        board={board}
        combatState={combatState}
        isMaster={isMaster}
        movementPerRound={movementPerRound}
      />
    </div>
  );
}
