import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Zap, AlertTriangle, Flame, Droplets, Wind, Mountain, Heart, Skull, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual, RitualEnhancement } from '@/lib/rituals-data';
import { useRitualValidation, TurnPEState } from '@/hooks/useRitualValidation';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionRitualPanelProps {
  rituals: Ritual[];
  nex: number;
  peCurrent: number;
  peMax: number;
  elementalAffinity?: string | null;
  turnPEState?: TurnPEState;
  isNonOccultist?: boolean;
  onCast: (ritual: Ritual, cost: number, enhancements: string[]) => void;
  onPESpend: (amount: number) => boolean;
}

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  'Sangue': <Droplets className="h-4 w-4" />,
  'Morte': <Skull className="h-4 w-4" />,
  'Energia': <Zap className="h-4 w-4" />,
  'Conhecimento': <Sun className="h-4 w-4" />,
  'Medo': <Moon className="h-4 w-4" />,
};

const ELEMENT_COLORS: Record<string, string> = {
  'Sangue': 'text-red-500 bg-red-500/10 border-red-500/30',
  'Morte': 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  'Energia': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  'Conhecimento': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  'Medo': 'text-gray-500 bg-gray-500/10 border-gray-500/30',
};

const CIRCLE_LABELS = ['', '1º', '2º', '3º', '4º'];

export const SessionRitualPanel: React.FC<SessionRitualPanelProps> = ({
  rituals,
  nex,
  peCurrent,
  peMax,
  elementalAffinity,
  turnPEState,
  isNonOccultist = false,
  onCast,
  onPESpend,
}) => {
  const [selectedRitual, setSelectedRitual] = useState<Ritual | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [lastCast, setLastCast] = useState<{ name: string; cost: number } | null>(null);

  const { validatePECost, canCastRitual, getAvailableEnhancements, maxCircle, peLimitPerTurn } = useRitualValidation(
    nex,
    elementalAffinity,
    peCurrent,
    peMax,
    turnPEState
  );

  const handleOpenEnhancements = (ritual: Ritual) => {
    setSelectedRitual(ritual);
    setSelectedEnhancements([]);
  };

  const handleToggleEnhancement = (enhancementName: string) => {
    setSelectedEnhancements(prev =>
      prev.includes(enhancementName)
        ? prev.filter(e => e !== enhancementName)
        : [...prev, enhancementName]
    );
  };

  const handleCast = () => {
    if (!selectedRitual) return;

    const baseCost = isNonOccultist ? selectedRitual.cost * 2 : selectedRitual.cost;
    const enhancementCosts = selectedEnhancements.reduce((sum, name) => {
      const enh = selectedRitual.enhancements?.find(e => e.name === name);
      return sum + (enh?.cost || 0);
    }, 0);
    const totalCost = baseCost + enhancementCosts;

    const canSpend = onPESpend(totalCost);
    if (!canSpend) return;

    setLastCast({ name: selectedRitual.name, cost: totalCost });
    onCast(selectedRitual, totalCost, selectedEnhancements);
    setSelectedRitual(null);
    setSelectedEnhancements([]);
  };

  const getTotalCost = () => {
    if (!selectedRitual) return 0;
    const baseCost = isNonOccultist ? selectedRitual.cost * 2 : selectedRitual.cost;
    const enhancementCosts = selectedEnhancements.reduce((sum, name) => {
      const enh = selectedRitual.enhancements?.find(e => e.name === name);
      return sum + (enh?.cost || 0);
    }, 0);
    return baseCost + enhancementCosts;
  };

  const peSpentThisTurn = turnPEState?.peSpentThisTurn || 0;
  const peRemainingThisTurn = peLimitPerTurn - peSpentThisTurn;

  if (rituals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Nenhum ritual conhecido</p>
        <p className="text-xs mt-1">Adicione rituais na aba de rituais</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* PE Status */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">PE Atual</p>
            <p className="font-mono text-lg font-bold text-primary">{peCurrent}/{peMax}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-muted-foreground">Limite/Turno</p>
            <p className={cn(
              "font-mono text-lg font-bold",
              peRemainingThisTurn <= 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {peSpentThisTurn}/{peLimitPerTurn}
            </p>
          </div>
        </div>
        <Badge variant="outline">
          Círculo máx: {CIRCLE_LABELS[maxCircle] || maxCircle}
        </Badge>
      </div>

      {/* Warning if at limit */}
      {peRemainingThisTurn <= 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          Limite de PE por turno atingido
        </div>
      )}

      {/* Rituals List */}
      <ScrollArea className="h-[240px]">
        <div className="space-y-2 pr-2">
          {rituals.map((ritual) => {
            const canCast = canCastRitual(ritual);
            const baseCost = isNonOccultist ? ritual.cost * 2 : ritual.cost;
            const elementColor = ELEMENT_COLORS[ritual.element] || 'text-muted-foreground bg-muted/10';
            
            return (
              <motion.div
                key={ritual.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  canCast ? "bg-card/50 hover:bg-card/80" : "opacity-50 bg-muted/20"
                )}
                whileHover={canCast ? { scale: 1.01 } : {}}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn("p-1.5 rounded border", elementColor)}>
                      {ELEMENT_ICONS[ritual.element] || <Sparkles className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ritual.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{CIRCLE_LABELS[ritual.circle]} Círculo</span>
                        <span>•</span>
                        <span>{ritual.element}</span>
                        {ritual.enhancements && ritual.enhancements.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-primary">{ritual.enhancements.length} aprims.</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {baseCost} PE
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleOpenEnhancements(ritual)}
                      disabled={!canCast}
                      className="gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Conjurar
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Last Cast Display */}
      <AnimatePresence mode="wait">
        {lastCast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-lg border-2 border-primary bg-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{lastCast.name}</span>
              <Badge className="bg-primary text-primary-foreground">
                -{lastCast.cost} PE
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhancement Selection Modal */}
      <Dialog open={!!selectedRitual} onOpenChange={() => setSelectedRitual(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {selectedRitual?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRitual && (
            <div className="space-y-4">
              {/* Ritual Info */}
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                <p className="text-muted-foreground line-clamp-3">
                  {selectedRitual.description}
                </p>
              </div>

              {/* Enhancements */}
              {selectedRitual.enhancements && selectedRitual.enhancements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Aprimoramentos</p>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 pr-2">
                      {getAvailableEnhancements(selectedRitual).map((enhData) => (
                        <label
                          key={enhData.name}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                            selectedEnhancements.includes(enhData.name)
                              ? "bg-primary/10 border-primary"
                              : "bg-card/50 hover:bg-card/80",
                            !enhData.validation.isValid && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Checkbox
                            checked={selectedEnhancements.includes(enhData.name)}
                            onCheckedChange={() => handleToggleEnhancement(enhData.name)}
                            disabled={!enhData.validation.isValid}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{enhData.name}</span>
                              <Badge variant="outline" className="font-mono text-xs">
                                +{enhData.cost} PE
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {enhData.description}
                            </p>
                            {!enhData.validation.isValid && enhData.validation.reason && (
                              <p className="text-xs text-destructive mt-1">
                                {enhData.validation.reason}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Cost Summary */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="font-medium">Custo Total</span>
                <span className={cn(
                  "font-mono text-lg font-bold",
                  getTotalCost() > peCurrent && "text-destructive"
                )}>
                  {getTotalCost()} PE
                </span>
              </div>

              {/* Cast Button */}
              <Button
                className="w-full gap-2"
                onClick={handleCast}
                disabled={getTotalCost() > peCurrent || getTotalCost() > peRemainingThisTurn}
              >
                <Sparkles className="h-4 w-4" />
                Conjurar Ritual
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionRitualPanel;
