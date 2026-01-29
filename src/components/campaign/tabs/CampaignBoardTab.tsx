/**
 * CampaignBoardTab - Wrapper para TacticalBoard na CampaignView
 * 
 * Recebe board via props (Singleton Pattern)
 * O hook interno do TacticalBoard fica desativado quando recebe externalBoard
 * 
 * @module components/campaign/tabs/CampaignBoardTab
 */

import { TacticalBoard } from '@/components/campaign/tactical/TacticalBoard';
import { type TacticalBoardReturn } from '@/hooks/campaign/useTacticalBoard';
import { type CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface CampaignBoardTabProps {
  campaignId: string;
  isMaster: boolean;
  members: CampaignMemberV2[];
  board: TacticalBoardReturn;
}

export function CampaignBoardTab({
  campaignId,
  isMaster,
  members,
  board,
}: CampaignBoardTabProps) {
  return (
    <TacticalBoard
      campaignId={campaignId}
      isMaster={isMaster}
      members={members as any}
      externalBoard={board}
    />
  );
}
