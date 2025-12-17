import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Zap, AlertTriangle, Droplets, Skull, Moon, Sun, Clock, Target, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual } from '@/lib/rituals-data';
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

// Normaliza elemento para lowercase para comparação
const normalizeElement = (element: string): string => element.toLowerCase();

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  'sangue': <Droplets className="h-4 w-4" />,
  'morte': <Skull className="h-4 w-4" />,
  'energia': <Zap className="h-4 w-4" />,
  'conhecimento': <Sun className="h-4 w-4" />,
  'medo': <Moon className="h-4 w-4" />,
};

const ELEMENT_COLORS: Record<string, string> = {
  'sangue': 'text-red-500 bg-red-500/10 border-red-500/30',
  'morte': 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  'energia': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  'conhecimento': 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  'medo': 'text-gray-500 bg-gray-500/10 border-gray-500/30',
};

const ELEMENT_LABELS: Record<string, string> = {
  'sangue': 'Sangue',
  'morte': 'Morte',
  'energia': 'Energia',
  'conhecimento': 'Conhecimento',
  'medo': 'Medo',
};

const CIRCLE_LABELS = ['', '1º', '2º', '3º', '4º'];

// Tempo de execução com ícones
const EXECUTION_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  'Padrão': { label: 'Padrão', variant: 'secondary' },
  'Completa': { label: 'Completa', variant: 'outline' },
  'Reação': { label: 'Reação', variant: 'default' },
  'Livre': { label: 'Livre', variant: 'default' },
};

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
  const [lastCast, setLastCast] = useState<{ name: string; cost: number; element: string } | null>(null);

  const { canCastRitual, getAvailableEnhancements, maxCircle, peLimitPerTurn } = useRitualValidation(
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

  // Calcula custo base considerando não-ocultista (custo dobrado conforme regra oficial)
  const getBaseCost = (ritual: Ritual): number => {
    return isNonOccultist ? ritual.cost * 2 : ritual.cost;
  };

  // Calcula custo total com aprimoramentos
  const getTotalCost = (): number => {
    if (!selectedRitual) return 0;
    const baseCost = getBaseCost(selectedRitual);
    const enhancementCosts = selectedEnhancements.reduce((sum, name) => {
      const enh = selectedRitual.enhancements?.find(e => e.name === name);
      return sum + (enh?.cost || 0);
    }, 0);
    return baseCost + enhancementCosts;
  };

  const handleCast = () => {
    if (!selectedRitual) return;

    const totalCost = getTotalCost();

    // Validações antes de conjurar
    if (totalCost > peCurrent) {
      return; // PE insuficiente
    }

    const peSpentThisTurn = turnPEState?.peSpentThisTurn || 0;
    if (peSpentThisTurn + totalCost > peLimitPerTurn) {
      return; // Excede limite de PE por turno
    }

    const canSpend = onPESpend(totalCost);
    if (!canSpend) return;

    setLastCast({ 
      name: selectedRitual.name, 
      cost: totalCost,
      element: selectedRitual.element 
    });
    onCast(selectedRitual, totalCost, selectedEnhancements);
    setSelectedRitual(null);
    setSelectedEnhancements([]);
  };

  const peSpentThisTurn = turnPEState?.peSpentThisTurn || 0;
  const peRemainingThisTurn = Math.max(0, peLimitPerTurn - peSpentThisTurn);

  // Verifica se pode conjurar o ritual atual
  const canCastCurrentRitual = (): boolean => {
    if (!selectedRitual) return false;
    const totalCost = getTotalCost();
    
    // PE insuficiente
    if (totalCost > peCurrent) return false;
    
    // Excede limite de PE por turno
    if (peSpentThisTurn + totalCost > peLimitPerTurn) return false;
    
    return true;
  };

  // Razão pela qual não pode conjurar
  const getCantCastReason = (): string | null => {
    if (!selectedRitual) return null;
    const totalCost = getTotalCost();
    
    if (totalCost > peCurrent) {
      return `PE insuficiente (${peCurrent}/${totalCost})`;
    }
    
    if (peSpentThisTurn + totalCost > peLimitPerTurn) {
      return `Excede limite de PE/turno (${peSpentThisTurn + totalCost}/${peLimitPerTurn})`;
    }
    
    return null;
  };

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
            <p className="text-xs text-muted-foreground">Gasto/Limite Turno</p>
            <p className={cn(
              "font-mono text-lg font-bold",
              peRemainingThisTurn <= 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {peSpentThisTurn}/{peLimitPerTurn}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline">
            Círculo máx: {CIRCLE_LABELS[maxCircle] || maxCircle}
          </Badge>
          {isNonOccultist && (
            <Badge variant="secondary" className="text-xs">
              Custo 2x (não-ocultista)
            </Badge>
          )}
        </div>
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
            const baseCost = getBaseCost(ritual);
            const elementKey = normalizeElement(ritual.element);
            const elementColor = ELEMENT_COLORS[elementKey] || 'text-muted-foreground bg-muted/10';
            const executionBadge = EXECUTION_BADGES[ritual.execution] || EXECUTION_BADGES['Padrão'];
            
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
                      {ELEMENT_ICONS[elementKey] || <Sparkles className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ritual.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{CIRCLE_LABELS[ritual.circle]} Círculo</span>
                        <span>•</span>
                        <span>{ELEMENT_LABELS[elementKey] || ritual.element}</span>
                        <span>•</span>
                        <Badge variant={executionBadge.variant} className="text-[10px] h-4 px-1">
                          {executionBadge.label}
                        </Badge>
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
            className={cn(
              "p-3 rounded-lg border-2",
              ELEMENT_COLORS[normalizeElement(lastCast.element)]?.replace('bg-', 'border-').split(' ')[0] || "border-primary",
              "bg-primary/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ELEMENT_ICONS[normalizeElement(lastCast.element)] || <Sparkles className="h-4 w-4" />}
                <span className="font-medium">{lastCast.name}</span>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                -{lastCast.cost} PE
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhancement Selection Modal */}
      <Dialog open={!!selectedRitual} onOpenChange={() => setSelectedRitual(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {selectedRitual?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRitual && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Ritual Info */}
              <div className="p-3 rounded-lg bg-muted/30 text-sm space-y-2">
                <p className="text-muted-foreground line-clamp-3">
                  {selectedRitual.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{selectedRitual.execution}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{selectedRitual.range}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    <span>{selectedRitual.duration}</span>
                  </div>
                </div>
                {selectedRitual.resistance && (
                  <p className="text-xs text-warning">
                    Resistência: {selectedRitual.resistance}
                  </p>
                )}
              </div>

              {/* Enhancements */}
              {selectedRitual.enhancements && selectedRitual.enhancements.length > 0 && (
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                  <p className="text-sm font-medium">Aprimoramentos</p>
                  <ScrollArea className="flex-1">
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
                            {enhData.requirements && (
                              <p className={cn(
                                "text-xs mt-1",
                                enhData.validation.isValid ? "text-muted-foreground" : "text-destructive"
                              )}>
                                {enhData.requirements}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-medium">Custo Total</span>
                  <div className="text-right">
                    <span className={cn(
                      "font-mono text-lg font-bold",
                      !canCastCurrentRitual() && "text-destructive"
                    )}>
                      {getTotalCost()} PE
                    </span>
                    {isNonOccultist && (
                      <p className="text-xs text-muted-foreground">
                        (base {selectedRitual.cost} × 2)
                      </p>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {getCantCastReason() && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {getCantCastReason()}
                  </div>
                )}

                {/* Cast Button */}
                <Button
                  className="w-full gap-2"
                  onClick={handleCast}
                  disabled={!canCastCurrentRitual()}
                >
                  <Sparkles className="h-4 w-4" />
                  Conjurar Ritual
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionRitualPanel;
