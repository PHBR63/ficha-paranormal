/**
 * IntegratedCombatBoard - Combate integrado com tabuleiro tático
 * 
 * Combina CombatTracker com controle de tokens, movimento e alcance.
 */

"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { CombatBoardLinker } from './CombatBoardLinker';
import { MovementIndicator } from './MovementIndicator';
import { RangeCalculator } from './RangeCalculator';
import { useCombatBoardSync, type CombatBoardSyncReturn } from '@/hooks/campaign/useCombatBoardSync';
import type { TacticalBoardReturn, MapToken } from '@/hooks/campaign/useTacticalBoard';
import type { CombatantState, CombatState } from '@/lib/game-engine';
import {
  Link,
  Map,
  Footprints,
  Target,
  ChevronDown,
  ChevronUp,
  Eye,
  Crosshair,
  MapPin,
  Zap,
} from 'lucide-react';

interface IntegratedCombatBoardProps {
  board: TacticalBoardReturn | null;
  combatState: CombatState;
  isMaster: boolean;
  movementPerRound?: number;
  onTokenClick?: (token: MapToken) => void;
  onCellClick?: (x: number, y: number) => void;
}

export function IntegratedCombatBoard({
  board,
  combatState,
  isMaster,
  movementPerRound = 9,
  onTokenClick,
  onCellClick,
}: IntegratedCombatBoardProps) {
  const { toast } = useToast();
  const [linkerOpen, setLinkerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'movement' | 'range'>('movement');

  // Combatente atual
  const currentCombatant = combatState.combatants[combatState.currentTurnIndex];

  // Hook de sincronização combate <-> tabuleiro
  const sync = useCombatBoardSync({
    board,
    combatants: combatState.combatants,
    currentTurnCombatantId: currentCombatant?.id,
    isMaster,
    movementPerRound,
  });

  // Handler para clique em célula do mapa (preview de movimento)
  const handleCellClick = useCallback((x: number, y: number) => {
    if (!combatState.isActive || !currentCombatant) return;
    
    // Se é o turno do combatente atual, preview movimento
    sync.previewMovement(currentCombatant.id, x, y);
    
    // Callback externo
    onCellClick?.(x, y);
  }, [combatState.isActive, currentCombatant, sync, onCellClick]);

  // Handler para confirmar movimento
  const handleConfirmMovement = useCallback(async () => {
    const success = await sync.confirmMovement();
    if (success) {
      toast({
        title: 'Movimento realizado',
        description: `${currentCombatant?.name} moveu-se ${sync.pendingMovement?.distanceMeters.toFixed(1)}m`,
      });
    }
  }, [sync, currentCombatant, toast]);

  // Handler para cancelar movimento
  const handleCancelMovement = useCallback(() => {
    sync.cancelMovement();
  }, [sync]);

  // Handler para auto-link
  const handleAutoLink = useCallback(() => {
    const count = sync.autoLinkByCharacterId();
    if (count > 0) {
      toast({
        title: 'Vinculação automática',
        description: `${count} combatente(s) vinculado(s) aos tokens`,
      });
    } else {
      toast({
        title: 'Nenhuma vinculação encontrada',
        description: 'Vincule manualmente os combatentes aos tokens',
        variant: 'default',
      });
    }
    return count;
  }, [sync, toast]);

  // Handler para destacar turno atual
  const handleHighlightTurn = useCallback(() => {
    sync.highlightCurrentTurn();
  }, [sync]);

  // Se não houver board, mostra aviso
  if (!board) {
    return (
      <div className="p-4 text-center text-muted-foreground border border-dashed border-border rounded-lg">
        <Map className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>Tabuleiro tático não disponível</p>
        <p className="text-xs">Ative um mapa para usar a integração de combate</p>
      </div>
    );
  }

  // Se não houver combate ativo
  if (!combatState.isActive) {
    return (
      <div className="p-4 border border-border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <Link className="w-4 h-4" />
            Integração Tabuleiro
          </h4>
          <Badge variant="secondary">Combate inativo</Badge>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setLinkerOpen(true)}
          className="w-full gap-2"
        >
          <MapPin className="w-4 h-4" />
          Vincular Combatentes aos Tokens
        </Button>

        {/* Dialog de vinculação */}
        <CombatBoardLinker
          open={linkerOpen}
          onOpenChange={setLinkerOpen}
          combatants={combatState.combatants}
          tokens={board.tokens}
          linkedCombatants={sync.linkedCombatants}
          onLink={sync.linkCombatantToToken}
          onUnlink={sync.unlinkCombatant}
          onAutoLink={handleAutoLink}
        />
      </div>
    );
  }

  // Token do combatente atual
  const currentToken = sync.getTokenForCombatant(currentCombatant?.id || '');

  return (
    <div className="space-y-4">
      {/* Header colapsável */}
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-primary" />
            <div>
              <span className="font-medium">Integração Tabuleiro</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {sync.linkedCombatants.length}/{combatState.combatants.length} vinculados
                </span>
                {currentToken && (
                  <>
                    <span>•</span>
                    <span className="text-primary">
                      {currentCombatant?.name} em ({currentToken.x}, {currentToken.y})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleHighlightTurn}
              className="gap-1"
            >
              <Eye className="w-4 h-4" />
              Mostrar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkerOpen(true)}
              className="gap-1"
            >
              <Link className="w-4 h-4" />
              Vincular
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {panelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 border border-border rounded-lg"
          >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'movement' | 'range')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="movement" className="gap-2">
                  <Footprints className="w-4 h-4" />
                  Movimento
                </TabsTrigger>
                <TabsTrigger value="range" className="gap-2">
                  <Crosshair className="w-4 h-4" />
                  Alcance
                </TabsTrigger>
              </TabsList>

              {/* Tab de Movimento */}
              <TabsContent value="movement">
                {currentToken ? (
                  <MovementIndicator
                    movementRemaining={sync.movementRemaining}
                    movementMax={movementPerRound}
                    pendingMovement={sync.pendingMovement}
                    onConfirm={handleConfirmMovement}
                    onCancel={handleCancelMovement}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Footprints className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {currentCombatant?.name} não está vinculado a um token
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLinkerOpen(true)}
                      className="mt-2 gap-2"
                    >
                      <Link className="w-4 h-4" />
                      Vincular agora
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Tab de Alcance */}
              <TabsContent value="range">
                {currentCombatant ? (
                  <RangeCalculator
                    currentCombatantId={currentCombatant.id}
                    combatants={combatState.combatants}
                    onCalculateRange={sync.calculateRange}
                    onGetTargetsInRange={sync.getTargetsInRange}
                  />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum combatente ativo</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Células alcançáveis (movimento) */}
            {activeTab === 'movement' && currentToken && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Células alcançáveis:</span>
                  <Badge variant="outline">
                    {Math.floor(sync.movementRemaining / 1.5)} células
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em uma célula do mapa para planejar movimento
                </p>
              </div>
            )}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Avisos de combatentes não vinculados */}
      {sync.unlinkedCombatants.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-warning/10 border border-warning/30 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-warning">
              <Zap className="w-4 h-4" />
              <span>
                {sync.unlinkedCombatants.length} combatente(s) sem token vinculado
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkerOpen(true)}
              className="text-warning hover:text-warning/80"
            >
              Resolver
            </Button>
          </div>
        </motion.div>
      )}

      {/* Dialog de vinculação */}
      <CombatBoardLinker
        open={linkerOpen}
        onOpenChange={setLinkerOpen}
        combatants={combatState.combatants}
        tokens={board.tokens}
        linkedCombatants={sync.linkedCombatants}
        onLink={sync.linkCombatantToToken}
        onUnlink={sync.unlinkCombatant}
        onAutoLink={handleAutoLink}
      />
    </div>
  );
}

// Export do hook para uso externo
export { useCombatBoardSync } from '@/hooks/campaign/useCombatBoardSync';
export type { CombatBoardSyncReturn } from '@/hooks/campaign/useCombatBoardSync';
