/**
 * CampaignMasterTab - Aba do mestre stateless para CampaignView
 * 
 * Contém subabas para: Fichas, NPCs, Macros, Handouts, Áudio, Controles, Bônus
 * Recebe dados via props (Singleton Pattern)
 * 
 * @module components/campaign/tabs/CampaignMasterTab
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MasterSheetViewer } from '@/components/campaign/master/MasterSheetViewer';
import { NPCManager } from '@/components/campaign/master';
import { MacrosPanel } from '@/components/campaign/chat';
import { HandoutsManager } from '@/components/campaign/master/HandoutsManager';
import { AudioMasterPanel, SoundSceneManager } from '@/components/campaign/audio';
import { MemberBonusesPanel } from '@/components/campaign/MemberBonusesPanel';
import { type CampaignMemberV2, type CampaignV2 } from '@/hooks/campaign/useCampaignData';

interface CampaignMasterTabProps {
  campaignId: string;
  campaign: CampaignV2;
  members: CampaignMemberV2[];
  onMemberUpdate: () => void;
  sendSystemMessage?: (content: string) => Promise<void>;
}

export function CampaignMasterTab({
  campaignId,
  campaign,
  members,
  onMemberUpdate,
  sendSystemMessage,
}: CampaignMasterTabProps) {
  // Handler para ações rápidas que enviam mensagens de sistema
  const handleQuickAction = async (message: string) => {
    if (sendSystemMessage) {
      await sendSystemMessage(message);
    }
  };
  
  return (
    <Tabs defaultValue="sheets" className="space-y-4">
      <TabsList className="bg-card border border-border flex-wrap h-auto py-1">
        <TabsTrigger value="sheets" className="font-display text-xs">FICHAS</TabsTrigger>
        <TabsTrigger value="npcs" className="font-display text-xs">NPCs</TabsTrigger>
        <TabsTrigger value="macros" className="font-display text-xs">MACROS</TabsTrigger>
        <TabsTrigger value="handouts" className="font-display text-xs">HANDOUTS</TabsTrigger>
        <TabsTrigger value="audio" className="font-display text-xs">ÁUDIO</TabsTrigger>
        <TabsTrigger value="controls" className="font-display text-xs">CONTROLES</TabsTrigger>
        <TabsTrigger value="bonuses" className="font-display text-xs">BÔNUS</TabsTrigger>
      </TabsList>

      {/* Aba de Fichas */}
      <TabsContent value="sheets" className="mt-4">
        <MasterSheetViewer
          campaignId={campaignId}
          members={members as any}
          onMemberUpdate={onMemberUpdate}
        />
      </TabsContent>

      {/* Aba de NPCs/Bestiário */}
      <TabsContent value="npcs" className="mt-4">
        <NPCManager campaignId={campaignId} />
      </TabsContent>

      {/* Aba de Macros de Rolagem */}
      <TabsContent value="macros" className="mt-4">
        <div className="ordo-panel p-6">
          <MacrosPanel campaignId={campaignId} />
        </div>
      </TabsContent>

      {/* Aba de Handouts do Mestre */}
      <TabsContent value="handouts" className="mt-4">
        <div className="ordo-panel p-6">
          <HandoutsManager campaignId={campaignId} members={members as any} />
        </div>
      </TabsContent>

      {/* Aba de Áudio - Com Cenas de Som */}
      <TabsContent value="audio" className="mt-4 space-y-6">
        <AudioMasterPanel campaignId={campaignId} isMaster={true} />
        <SoundSceneManager campaignId={campaignId} isMaster={true} />
      </TabsContent>

      {/* Aba de Controles - Grid responsivo expandido */}
      <TabsContent value="controls" className="mt-4">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Controle de Sessão */}
          <div className="ordo-panel p-6">
            <h3 className="font-display text-lg tracking-wider mb-4 text-primary">
              CONTROLE DE SESSÃO
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Sessão Atual</label>
                <p className="font-display text-4xl">{campaign.current_session}</p>
              </div>
              <Button className="w-full font-display">
                INICIAR NOVA SESSÃO
              </Button>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="ordo-panel p-6">
            <h3 className="font-display text-lg tracking-wider mb-4 text-primary">
              AÇÕES RÁPIDAS
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('⚔️ O Mestre iniciou uma cena de combate!')}
              >
                Iniciar Combate
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('🔍 O Mestre pediu testes de Percepção.')}
              >
                Pedir Teste de Percepção
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleQuickAction('🧠 O Mestre pediu testes de Vontade.')}
              >
                Pedir Teste de Vontade
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Aba de Bônus */}
      <TabsContent value="bonuses" className="mt-4">
        <div className="ordo-panel p-6">
          <MemberBonusesPanel campaignId={campaignId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
