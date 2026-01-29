/**
 * CombatBoardLinker - Componente para vincular combatentes a tokens
 * 
 * Permite associar combatentes do tracker a tokens no tabuleiro tático.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// ScrollArea removido - usando overflow nativo para evitar bug #185 com React 19
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Link,
  Unlink,
  User,
  Bot,
  MapPin,
  Check,
  Wand2,
  Target,
} from 'lucide-react';
import type { CombatantState } from '@/lib/game-engine';
import type { MapToken } from '@/hooks/campaign/useTacticalBoard';
import type { LinkedCombatant } from '@/hooks/campaign/useCombatBoardSync';

interface CombatBoardLinkerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combatants: CombatantState[];
  tokens: MapToken[];
  linkedCombatants: LinkedCombatant[];
  onLink: (combatantId: string, tokenId: string) => void;
  onUnlink: (combatantId: string) => void;
  onAutoLink: () => number;
}

export function CombatBoardLinker({
  open,
  onOpenChange,
  combatants,
  tokens,
  linkedCombatants,
  onLink,
  onUnlink,
  onAutoLink,
}: CombatBoardLinkerProps) {
  // Função auxiliar para verificar se um combatente está vinculado
  const getLinkedToken = (combatantId: string): MapToken | undefined => {
    const link = linkedCombatants.find(l => l.combatantId === combatantId);
    if (!link) return undefined;
    return tokens.find(t => t.id === link.tokenId);
  };

  // Função auxiliar para verificar se um token está vinculado
  const isTokenLinked = (tokenId: string): boolean => {
    return linkedCombatants.some(l => l.tokenId === tokenId);
  };

  // Tokens disponíveis (não vinculados e do tipo apropriado)
  const availableTokens = tokens.filter(t => 
    !isTokenLinked(t.id) && 
    (t.token_type === 'pc' || t.token_type === 'npc' || t.token_type === 'creature')
  );

  // Handler para auto-link
  const handleAutoLink = () => {
    const count = onAutoLink();
    // O toast será tratado pelo componente pai se necessário
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Vincular Combatentes aos Tokens
          </DialogTitle>
          <DialogDescription>
            Associe cada combatente a um token no mapa para controle de movimento e posição.
          </DialogDescription>
        </DialogHeader>

        {/* Botão de auto-link */}
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAutoLink}
            className="gap-2"
          >
            <Wand2 className="w-4 h-4" />
            Vincular Automaticamente
          </Button>
        </div>

        <div className="h-[50vh] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pr-4">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {combatants.map((combatant) => {
                const linkedToken = getLinkedToken(combatant.id);
                const isLinked = !!linkedToken;

                return (
                  <motion.div
                    key={combatant.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isLinked 
                        ? "bg-success/10 border-success/30" 
                        : "bg-secondary/30 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Info do combatente */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          combatant.isNPC ? "bg-destructive/20" : "bg-primary/20"
                        )}>
                          {combatant.isNPC ? (
                            <Bot className="w-5 h-5 text-destructive" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        
                        <div>
                          <span className="font-medium">{combatant.name}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Iniciativa: {combatant.initiative}</span>
                            {combatant.isNPC && <Badge variant="outline" className="text-xs">NPC</Badge>}
                          </div>
                        </div>
                      </div>

                      {/* Status de vinculação */}
                      <div className="flex items-center gap-3">
                        {isLinked ? (
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 rounded-lg">
                              <Check className="w-4 h-4 text-success" />
                              <span className="text-sm text-success">{linkedToken?.name}</span>
                              <Badge variant="outline" className="text-xs">
                                ({linkedToken?.x}, {linkedToken?.y})
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onUnlink(combatant.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Unlink className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Selecionar token:
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {availableTokens.slice(0, 5).map(token => (
                                <Button
                                  key={token.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onLink(combatant.id, token.id)}
                                  className="gap-1"
                                >
                                  <MapPin className="w-3 h-3" />
                                  {token.name}
                                </Button>
                              ))}
                              {availableTokens.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">
                                  Nenhum token disponível
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Resumo */}
        <div className="pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <strong className="text-success">{linkedCombatants.length}</strong> vinculados
            </span>
            <span>
              <strong className="text-warning">{combatants.length - linkedCombatants.length}</strong> pendentes
            </span>
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
