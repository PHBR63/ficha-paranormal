/**
 * MasterMapPanel - Painel lateral colapsável do Mestre no mapa fullscreen
 * 
 * Reutiliza PlayerControlCard, MasterQuickActions e CombatTracker
 * em layout vertical compacto dentro de um drawer lateral direito.
 * 
 * @module components/campaign/v3/map/MasterMapPanel
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield as ShieldIcon,
  X as XIcon,
  Users as UsersIcon,
  Sword as SwordIcon,
  Lightning as LightningIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PlayerControlCard } from '@/components/campaign/v3/master/PlayerControlCard';
import { MasterQuickActions } from '@/components/campaign/v3/master/MasterQuickActions';
import { CombatTracker } from '@/components/campaign/v3/master/CombatTracker';
import { BulkDamageModal } from '@/components/campaign/v3/master/BulkDamageModal';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

/** Sub-aba ativa no painel do mestre */
type MasterPanelTab = 'players' | 'combat';

interface MasterMapPanelProps {
  /** Indica se o painel está aberto */
  open: boolean;
  /** Alterna aberto/fechado */
  onToggle: () => void;
  /** Membros da campanha */
  members: CampaignMemberV2[];
  /** Callbacks de ações do mestre */
  onModifyHP?: (characterId: string, delta: number) => Promise<boolean>;
  onModifySAN?: (characterId: string, delta: number) => Promise<boolean>;
  onModifyPE?: (characterId: string, delta: number) => Promise<boolean>;
  onApplyCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRemoveCondition?: (characterId: string, conditionName: string) => Promise<boolean>;
  onRestFull?: (characterId: string) => Promise<boolean>;
  onGroupRest?: () => Promise<void>;
  onClearAllConditions?: () => Promise<void>;
  onBulkDamage?: (characterIds: string[], damage: number) => Promise<void>;
  onSendMessage?: (content: string, type?: string, metadata?: Record<string, unknown>) => void;
  isUpdating?: boolean;
}

/** Botão flutuante para abrir o painel do mestre */
const MasterToggleButton = memo(function MasterToggleButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  if (open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed top-14 right-3 z-30"
    >
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-card/90 backdrop-blur-sm border-primary/30 shadow-lg hover:bg-primary/10"
        onClick={onToggle}
        title="Abrir painel do Mestre"
      >
        <ShieldIcon weight="duotone" className="h-5 w-5 text-primary" />
      </Button>
    </motion.div>
  );
});

export const MasterMapPanel = memo(function MasterMapPanel({
  open,
  onToggle,
  members,
  onModifyHP,
  onModifySAN,
  onModifyPE,
  onApplyCondition,
  onRemoveCondition,
  onRestFull,
  onGroupRest,
  onClearAllConditions,
  onBulkDamage,
  onSendMessage,
  isUpdating,
}: MasterMapPanelProps) {
  const [activeTab, setActiveTab] = useState<MasterPanelTab>('players');
  const [bulkDamageOpen, setBulkDamageOpen] = useState(false);

  // Filtra jogadores com personagem vinculado
  const playersWithCharacter = members.filter(m => m.characters && m.role !== 'master');

  // Handler para dano em área (fallback para ajuste individual)
  const handleBulkDamage = useCallback(async (characterIds: string[], damage: number) => {
    if (onBulkDamage) {
      await onBulkDamage(characterIds, damage);
    } else if (onModifyHP) {
      for (const charId of characterIds) {
        await onModifyHP(charId, -damage);
      }
    }
  }, [onBulkDamage, onModifyHP]);

  return (
    <>
      {/* Botão flutuante (visível quando painel fechado) */}
      <AnimatePresence>
        <MasterToggleButton open={open} onToggle={onToggle} />
      </AnimatePresence>

      {/* Painel lateral direito */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed top-10 right-0 bottom-0 z-20',
              'w-[340px] max-w-[90vw]',
              'bg-card/95 backdrop-blur-md',
              'border-l border-border/40',
              'flex flex-col',
              'shadow-2xl',
            )}
          >
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldIcon weight="duotone" className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold tracking-wide text-foreground">
                  PAINEL DO MESTRE
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggle}
                title="Fechar painel"
              >
                <XIcon weight="bold" className="h-4 w-4" />
              </Button>
            </div>

            {/* Ações rápidas (sempre visível) */}
            <div className="shrink-0 border-b border-border/30">
              <MasterQuickActions
                members={members}
                onSendMessage={onSendMessage}
                onGroupRest={onGroupRest}
                onClearAllConditions={onClearAllConditions}
                onOpenBulkDamage={() => setBulkDamageOpen(true)}
                isUpdating={isUpdating}
                compact
              />
            </div>

            {/* Sub-abas: Jogadores | Combate */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as MasterPanelTab)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="shrink-0 px-3 pt-1.5 pb-1">
                <TabsList className="bg-transparent h-8 w-full">
                  <TabsTrigger value="players" className="gap-1 text-[11px] flex-1">
                    <UsersIcon weight="duotone" className="h-3.5 w-3.5" />
                    Jogadores
                  </TabsTrigger>
                  <TabsTrigger value="combat" className="gap-1 text-[11px] flex-1">
                    <SwordIcon weight="duotone" className="h-3.5 w-3.5" />
                    Combate
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Lista de jogadores */}
              <TabsContent value="players" className="flex-1 m-0 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {playersWithCharacter.map((member) => (
                      <PlayerControlCard
                        key={member.id}
                        member={member}
                        onModifyHP={onModifyHP}
                        onModifySAN={onModifySAN}
                        onModifyPE={onModifyPE}
                        onApplyCondition={onApplyCondition}
                        onRemoveCondition={onRemoveCondition}
                        onRestFull={onRestFull}
                        isUpdating={isUpdating}
                      />
                    ))}

                    {playersWithCharacter.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        <UsersIcon weight="duotone" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nenhum jogador com personagem</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Tracker de combate */}
              <TabsContent value="combat" className="flex-1 m-0 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-3">
                    <CombatTracker members={members} />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Modal de dano em área */}
      <BulkDamageModal
        open={bulkDamageOpen}
        onOpenChange={setBulkDamageOpen}
        members={members}
        onApplyDamage={handleBulkDamage}
        isUpdating={isUpdating}
      />
    </>
  );
});

export default MasterMapPanel;
