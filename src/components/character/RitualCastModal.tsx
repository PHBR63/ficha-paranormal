/**
 * RitualCastModal - Modal de confirmação para conjurar rituais
 * Permite escolher aprimoramentos e mostra custo total em PE
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  AlertTriangle, 
  Sparkles,
  Clock,
  Target,
  Timer,
  Shield,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Ritual, RitualEnhancement } from '@/lib/rituals-data';
import { getElementConfig } from '@/lib/element-config';

interface RitualCastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ritual: Ritual | null;
  peCurrent: number;
  peMax: number;
  isNonOccultist?: boolean;
  onConfirm: (ritual: Ritual, peCost: number, enhancements: string[]) => void;
}

export function RitualCastModal({
  open,
  onOpenChange,
  ritual,
  peCurrent,
  peMax,
  isNonOccultist = false,
  onConfirm,
}: RitualCastModalProps) {
  // Estado dos aprimoramentos selecionados
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);

  if (!ritual) return null;

  // Configuração visual do elemento
  const elementConfig = getElementConfig(ritual.element);
  const ElementIcon = elementConfig?.icon || Sparkles;

  // Multiplicador de custo para não-ocultistas
  const costMultiplier = isNonOccultist ? 2 : 1;

  // Calcula custo base
  const baseCost = ritual.cost * costMultiplier;

  // Calcula custo dos aprimoramentos
  const enhancementsCost = selectedEnhancements.reduce((total, enhName) => {
    const enh = ritual.enhancements?.find(e => e.name === enhName);
    return total + (enh ? enh.cost * costMultiplier : 0);
  }, 0);

  // Custo total
  const totalCost = baseCost + enhancementsCost;

  // Verifica se tem PE suficiente
  const canAfford = peCurrent >= totalCost;

  // Toggle de aprimoramento
  const toggleEnhancement = (enhName: string) => {
    setSelectedEnhancements(prev =>
      prev.includes(enhName)
        ? prev.filter(e => e !== enhName)
        : [...prev, enhName]
    );
  };

  // Handler de confirmação
  const handleConfirm = () => {
    if (canAfford) {
      onConfirm(ritual, totalCost, selectedEnhancements);
      setSelectedEnhancements([]);
      onOpenChange(false);
    }
  };

  // Reset ao fechar
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedEnhancements([]);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {/* Header com visual do elemento */}
        <div className={cn(
          "absolute inset-x-0 top-0 h-24 rounded-t-lg opacity-30",
          `bg-gradient-to-b ${elementConfig?.color || 'from-primary/20 to-transparent'}`
        )} />

        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            {/* Ícone do elemento */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              elementConfig?.bg || "bg-muted",
              elementConfig?.border || "border-border",
              "border"
            )}>
              <ElementIcon className={cn("w-6 h-6", elementConfig?.text || "text-muted-foreground")} />
            </div>

            <div>
              <DialogTitle className={cn(
                "font-display tracking-wider",
                elementConfig?.text || "text-foreground"
              )}>
                Conjurar {ritual.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", elementConfig?.badgeBg)}>
                  {ritual.circle}º Círculo
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {ritual.element}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-4">
            {/* Info do ritual */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{ritual.execution}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="w-3 h-3" />
                <span>{ritual.range}</span>
              </div>
              {ritual.duration && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  <span>{ritual.duration}</span>
                </div>
              )}
              {ritual.resistance && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>{ritual.resistance}</span>
                </div>
              )}
              {ritual.target && (
                <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                  <Users className="w-3 h-3" />
                  <span>{ritual.target}</span>
                </div>
              )}
            </div>

            {/* Descrição */}
            <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
              {ritual.description}
            </p>

            {/* Custo base */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
              <span className="text-sm font-medium">Custo Base</span>
              <div className="flex items-center gap-2">
                <Badge className="bg-pe/20 text-pe border-pe/50">
                  {baseCost} PE
                </Badge>
                {isNonOccultist && (
                  <span className="text-[10px] text-yellow-400">
                    (×2 não-ocultista)
                  </span>
                )}
              </div>
            </div>

            {/* Aprimoramentos */}
            {ritual.enhancements && ritual.enhancements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aprimoramentos (opcional)
                </p>
                {ritual.enhancements.map((enh, i) => {
                  const enhCost = enh.cost * costMultiplier;
                  const isSelected = selectedEnhancements.includes(enh.name);
                  
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: isSelected ? 1.02 : 1,
                        borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      }}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? "bg-primary/5" : "bg-card hover:bg-accent/5"
                      )}
                      onClick={() => toggleEnhancement(enh.name)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleEnhancement(enh.name)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "font-medium text-sm",
                              isSelected && elementConfig?.text
                            )}>
                              {enh.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              +{enhCost} PE
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {enh.description}
                          </p>
                          {enh.requirements && (
                            <p className="text-[10px] text-yellow-400/80 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {enh.requirements}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Resumo de custo */}
            <div className={cn(
              "p-4 rounded-lg border-2",
              canAfford 
                ? "bg-success/5 border-success/30" 
                : "bg-destructive/5 border-destructive/30"
            )}>
              <div className="flex items-center justify-between">
                <span className="font-display tracking-wider">Custo Total</span>
                <div className="text-right">
                  <span className={cn(
                    "text-2xl font-bold",
                    canAfford ? "text-pe" : "text-destructive"
                  )}>
                    {totalCost}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">PE</span>
                </div>
              </div>
              
              {/* Barra de PE */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>PE Atual</span>
                  <span>{peCurrent} / {peMax}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      canAfford ? "bg-pe" : "bg-destructive"
                    )}
                    style={{ width: `${(peCurrent / peMax) * 100}%` }}
                  />
                  {/* Indicador do custo */}
                  <div 
                    className="h-full bg-foreground/30 -mt-2"
                    style={{ 
                      width: `${(totalCost / peMax) * 100}%`,
                      marginLeft: `${((peCurrent - totalCost) / peMax) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Após conjurar: <span className={cn(
                    "font-medium",
                    peCurrent - totalCost < 0 ? "text-destructive" : "text-pe"
                  )}>
                    {Math.max(0, peCurrent - totalCost)} PE
                  </span>
                </p>
              </div>

              {!canAfford && (
                <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  PE insuficiente para conjurar este ritual
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canAfford}
            className={cn(
              "gap-2",
              canAfford && elementConfig?.bg,
              canAfford && elementConfig?.text,
              canAfford && "hover:opacity-90"
            )}
          >
            <Zap className="w-4 h-4" />
            Conjurar ({totalCost} PE)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
