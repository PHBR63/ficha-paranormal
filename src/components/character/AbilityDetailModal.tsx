/**
 * AbilityDetailModal.tsx
 * Modal para exibição expandida de habilidades de classe
 * com descrição completa, progressão de NEX e opção de seleção
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Check, X, Zap } from "lucide-react";

// Interface para habilidade de classe
interface ClassAbility {
  id: string;
  name: string;
  description: string;
  minNex: number;
  classId: string;
}

// Dados de evolução de habilidades por NEX
const EVOLVING_ABILITIES: Record<string, { nexMarkers: number[]; descriptions: string[] }> = {
  "ataque-especial": {
    nexMarkers: [5, 20, 40, 60, 80],
    descriptions: [
      "Gasta 2 PE para +5 no ataque ou dano",
      "Pode gastar 4 PE para +10 no ataque ou dano",
      "Pode gastar 6 PE para +15 no ataque ou dano",
      "Pode gastar 8 PE para +20 no ataque ou dano",
      "Pode gastar 10 PE para +25 no ataque ou dano"
    ]
  },
  "golpe-pesado": {
    nexMarkers: [5, 40, 80],
    descriptions: [
      "Converte até 2 PM em +1d8 de dano por PM",
      "Converte até 4 PM em +1d8 de dano por PM",
      "Converte até 6 PM em +1d8 de dano por PM"
    ]
  },
  "poder-paranormal": {
    nexMarkers: [5, 30, 60, 90],
    descriptions: [
      "Escolhe 1 poder paranormal de 1º círculo",
      "Pode escolher poderes de até 2º círculo",
      "Pode escolher poderes de até 3º círculo",
      "Pode escolher poderes de até 4º círculo"
    ]
  }
};

interface AbilityDetailModalProps {
  ability: ClassAbility | null;
  isOpen: boolean;
  onClose: () => void;
  nex: number;
  isSelected?: boolean;
  isCore?: boolean;
  onToggle?: () => void;
  canSelect?: boolean;
}

export function AbilityDetailModal({
  ability,
  isOpen,
  onClose,
  nex,
  isSelected = false,
  isCore = false,
  onToggle,
  canSelect = true
}: AbilityDetailModalProps) {
  if (!ability) return null;

  // Verifica se a habilidade evolui com NEX
  const evolutionData = EVOLVING_ABILITIES[ability.id];
  const hasEvolution = !!evolutionData;

  // Calcula o estágio atual de evolução
  const getCurrentEvolutionStage = () => {
    if (!evolutionData) return -1;
    let stage = -1;
    for (let i = 0; i < evolutionData.nexMarkers.length; i++) {
      if (nex >= evolutionData.nexMarkers[i]) {
        stage = i;
      }
    }
    return stage;
  };

  const currentStage = getCurrentEvolutionStage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Ícone da habilidade */}
              <div className={`p-2 rounded-lg ${isCore ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                <Sparkles className={`w-5 h-5 ${isCore ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              
              <div>
                <DialogTitle className="text-xl font-bold">
                  {ability.name}
                </DialogTitle>
                
                <div className="flex items-center gap-2 mt-1">
                  {/* Badge de NEX mínimo */}
                  <Badge variant="outline" className="text-xs">
                    NEX {ability.minNex}%
                  </Badge>
                  
                  {/* Badge de tipo */}
                  {isCore ? (
                    <Badge className="bg-primary/20 text-primary text-xs">
                      Automática
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Opcional
                    </Badge>
                  )}
                  
                  {/* Badge de evolução */}
                  {hasEvolution && (
                    <Badge className="bg-amber-500/20 text-amber-600 text-xs flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Evolui
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-6">
            {/* Descrição completa */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Descrição
              </h4>
              <p className="text-base leading-relaxed whitespace-pre-line">
                {ability.description}
              </p>
            </div>

            {/* Seção de progressão de NEX (se aplicável) */}
            {hasEvolution && evolutionData && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Progressão por NEX
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    <AnimatePresence>
                      {evolutionData.nexMarkers.map((nexMarker, index) => {
                        const isUnlocked = nex >= nexMarker;
                        const isCurrent = index === currentStage;
                        
                        return (
                          <motion.div
                            key={nexMarker}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                              isCurrent 
                                ? 'bg-primary/10 border border-primary/30' 
                                : isUnlocked 
                                  ? 'bg-secondary/30' 
                                  : 'bg-muted/30 opacity-60'
                            }`}
                          >
                            {/* Indicador de status */}
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                              isUnlocked 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted border-2 border-muted-foreground/30'
                            }`}>
                              {isUnlocked ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <span className="text-xs text-muted-foreground">{index + 1}</span>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={isUnlocked ? "default" : "outline"} 
                                  className="text-xs"
                                >
                                  NEX {nexMarker}%
                                </Badge>
                                {isCurrent && (
                                  <Badge className="bg-amber-500/20 text-amber-600 text-xs">
                                    Atual
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm mt-1 ${isUnlocked ? '' : 'text-muted-foreground'}`}>
                                {evolutionData.descriptions[index]}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Rodapé com ação de seleção (apenas para habilidades opcionais) */}
        {!isCore && onToggle && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                {isSelected ? (
                  <span className="text-primary">Habilidade selecionada</span>
                ) : canSelect ? (
                  <span>Clique para selecionar esta habilidade</span>
                ) : (
                  <span>Limite de escolhas atingido</span>
                )}
              </div>
              
              <Button
                variant={isSelected ? "default" : "outline"}
                onClick={() => {
                  onToggle();
                  if (!isSelected) onClose();
                }}
                disabled={!canSelect && !isSelected}
                className="gap-2"
              >
                <Checkbox 
                  checked={isSelected} 
                  className="pointer-events-none"
                />
                {isSelected ? "Selecionada" : "Selecionar"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
