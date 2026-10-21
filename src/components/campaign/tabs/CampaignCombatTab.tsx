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
    <div className="flex-1 flex flex-col min-h-0 gap-8 w-full overflow-y-auto">
      <aside aria-label="Controle manual do combate" className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
        <p className="font-semibold">Combate manual da campanha antiga</p>
        <p className="mt-1 text-muted-foreground">
          Iniciativa, turnos e PV deste painel ficam apenas nesta aba e se perdem ao recarregar.
          Para registrar mudanças definitivas, use a ficha do personagem. Campanhas da versão atual têm combate sincronizado.
        </p>
      </aside>
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
