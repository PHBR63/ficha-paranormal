/**
 * OperacoesEspeciaisPanel - Painel de habilidades da trilha Operações Especiais
 * Exibe habilidades passivas e ativadas com dedução automática de PE
 * 
 * Habilidades:
 * - Iniciativa Aprimorada (NEX 10%): +5 Iniciativa, movimento extra na 1ª rodada (passivo)
 * - Ataque Extra (NEX 40%): 2 PE para ataque adicional (1x/rodada)
 * - Surto de Adrenalina (NEX 65%): 5 PE para ação padrão ou movimento (1x/rodada)
 * - Sempre Alerta (NEX 99%): Ação padrão extra no início do combate (passivo)
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Swords, 
  Wind, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Footprints,
  Hand
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

// Definição das habilidades da trilha Operações Especiais
const OPERACOES_ABILITIES = [
  {
    id: 'ataque-extra',
    name: 'Ataque Extra',
    minNex: 40,
    peCost: 2,
    actionType: 'Ação Livre',
    description: 'Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.',
    shortEffect: '+1 ataque adicional',
    perRound: true,
    icon: Swords,
  },
  {
    id: 'surto-de-adrenalina',
    name: 'Surto de Adrenalina',
    minNex: 65,
    peCost: 5,
    actionType: 'Ação Livre',
    description: 'Uma vez por rodada, você pode gastar 5 PE para realizar uma ação padrão ou de movimento adicional.',
    shortEffect: '+1 ação padrão OU movimento',
    perRound: true,
    requiresChoice: true,
    icon: Wind,
  },
] as const;

// Habilidades passivas (informativas)
const PASSIVE_ABILITIES = [
  {
    id: 'iniciativa-aprimorada',
    name: 'Iniciativa Aprimorada',
    minNex: 10,
    description: 'Você recebe +5 em Iniciativa e uma ação de movimento adicional na primeira rodada.',
    effect: '+5 Iniciativa + movimento extra (1ª rodada)',
    icon: Zap,
  },
  {
    id: 'sempre-alerta',
    name: 'Sempre Alerta',
    minNex: 99,
    description: 'Você recebe uma ação padrão adicional no início de cada cena de combate.',
    effect: '+1 ação padrão (início do combate)',
    icon: AlertTriangle,
  },
] as const;

import type { EffectDuration } from '@/hooks/useActivatedEffects';

interface OperacoesEspeciaisPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  // Tracking centralizado de uso por rodada
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
}

export function OperacoesEspeciaisPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  usedAbilitiesThisRound: externalUsedAbilities,
  onAbilityUsed,
}: OperacoesEspeciaisPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  // Usa tracking externo se fornecido, senão usa estado local
  const [localUsedAbilities, setLocalUsedAbilities] = useState<Set<string>>(new Set());
  const [showSurtoDialog, setShowSurtoDialog] = useState(false);
  
  // Determina qual fonte de tracking usar
  const usedAbilitiesSet = useMemo(() => {
    if (externalUsedAbilities) {
      return new Set(externalUsedAbilities);
    }
    return localUsedAbilities;
  }, [externalUsedAbilities, localUsedAbilities]);

  // Verifica se é trilha Operações Especiais
  const isOperacoesEspeciais = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('operacoes') || normalized.includes('especiais') || 
           classTrack === 'operacoes-especiais';
  }, [classTrack]);

  // Filtra habilidades desbloqueadas
  const unlockedActiveAbilities = useMemo(() => 
    OPERACOES_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  const unlockedPassiveAbilities = useMemo(() =>
    PASSIVE_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  // Marca habilidade como usada (centralizado ou local)
  const markAbilityAsUsed = useCallback((abilityId: string) => {
    if (onAbilityUsed) {
      onAbilityUsed(abilityId);
    } else {
      setLocalUsedAbilities(prev => new Set(prev).add(abilityId));
    }
  }, [onAbilityUsed]);

  // Handler para usar habilidade ativada
  const handleUseAbility = useCallback((abilityId: string, peCost: number, abilityName: string) => {
    // Verifica uso por rodada
    if (usedAbilitiesSet.has(abilityId)) {
      toast({
        title: "Limite por rodada",
        description: `${abilityName} já foi usada nesta rodada.`,
        variant: "destructive",
      });
      return;
    }

    // Verifica PE
    if (peCurrent < peCost) {
      toast({
        title: "PE Insuficiente",
        description: `Você precisa de ${peCost} PE para usar ${abilityName}.`,
        variant: "destructive",
      });
      return;
    }

    // Para Surto de Adrenalina, abre diálogo de escolha
    if (abilityId === 'surto-de-adrenalina') {
      setShowSurtoDialog(true);
      return;
    }

    // Deduz PE e marca como usada
    onPEChange(peCurrent - peCost);
    markAbilityAsUsed(abilityId);

    toast({
      title: `${abilityName} Ativada!`,
      description: `${peCost} PE consumidos. Você pode fazer um ataque adicional.`,
    });
  }, [peCurrent, onPEChange, usedAbilitiesSet, markAbilityAsUsed]);

  // Handler para escolha do Surto de Adrenalina
  const handleSurtoChoice = useCallback((choice: 'standard' | 'movement') => {
    const ability = OPERACOES_ABILITIES.find(a => a.id === 'surto-de-adrenalina')!;
    
    onPEChange(peCurrent - ability.peCost);
    markAbilityAsUsed('surto-de-adrenalina');
    setShowSurtoDialog(false);

    const choiceText = choice === 'standard' ? 'ação padrão' : 'ação de movimento';
    toast({
      title: "Surto de Adrenalina!",
      description: `${ability.peCost} PE consumidos. Você ganha uma ${choiceText} adicional.`,
    });
  }, [peCurrent, onPEChange, markAbilityAsUsed]);

  // Reset de usos por rodada (só usado se não tiver tracking externo)
  const resetRoundUsage = useCallback(() => {
    if (!externalUsedAbilities) {
      setLocalUsedAbilities(new Set());
    }
  }, [externalUsedAbilities]);

  // Não renderiza se não for Operações Especiais ou não tiver habilidades
  if (!isOperacoesEspeciais || (unlockedActiveAbilities.length === 0 && unlockedPassiveAbilities.length === 0)) {
    return null;
  }

  return (
    <>
      <Card className={cn("border-primary/20 bg-card/50", className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Operações Especiais
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {unlockedActiveAbilities.length + unlockedPassiveAbilities.length} habilidades
                  </Badge>
                </CardTitle>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* Habilidades Passivas */}
              {unlockedPassiveAbilities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Passivos</p>
                  {unlockedPassiveAbilities.map((ability) => {
                    const Icon = ability.icon;
                    return (
                      <div
                        key={ability.id}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/50"
                      >
                        <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{ability.name}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              NEX {ability.minNex}%
                            </Badge>
                          </div>
                          <p className="text-xs text-primary mt-0.5">{ability.effect}</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="text-[10px] text-muted-foreground underline mt-1 flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  Ver descrição completa
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <p className="text-xs">{ability.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Habilidades Ativadas */}
              {unlockedActiveAbilities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Ativadas</p>
                  {unlockedActiveAbilities.map((ability) => {
                    const Icon = ability.icon;
                    const isUsed = usedAbilitiesSet.has(ability.id);
                    const canAfford = peCurrent >= ability.peCost;

                    return (
                      <motion.div
                        key={ability.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-md border transition-colors",
                          isUsed 
                            ? "bg-muted/50 border-muted opacity-60" 
                            : "bg-card border-border/50 hover:border-primary/30"
                        )}
                      >
                        <Icon className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          isUsed ? "text-muted-foreground" : "text-primary"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{ability.name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {ability.peCost} PE
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              {ability.actionType}
                            </Badge>
                            {ability.perRound && (
                              <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                                1x/rodada
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ability.shortEffect}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={isUsed ? "outline" : "default"}
                              disabled={isUsed || !canAfford}
                              onClick={() => handleUseAbility(ability.id, ability.peCost, ability.name)}
                              className="h-7 text-xs"
                            >
                              {isUsed ? "Usada" : `Usar (${ability.peCost} PE)`}
                            </Button>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Info className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                  <p className="text-xs">{ability.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Botão de Reset de Rodada */}
              {usedAbilitiesSet.size > 0 && !externalUsedAbilities && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRoundUsage}
                  className="w-full text-xs h-7"
                >
                  Nova Rodada (Resetar Usos)
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Dialog de escolha para Surto de Adrenalina */}
      <Dialog open={showSurtoDialog} onOpenChange={setShowSurtoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" />
              Surto de Adrenalina
            </DialogTitle>
            <DialogDescription>
              Escolha qual tipo de ação adicional você deseja realizar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => handleSurtoChoice('standard')}
            >
              <Hand className="w-8 h-8 text-primary" />
              <span className="font-medium">Ação Padrão</span>
              <span className="text-xs text-muted-foreground">
                Atacar, usar poder, etc.
              </span>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => handleSurtoChoice('movement')}
            >
              <Footprints className="w-8 h-8 text-primary" />
              <span className="font-medium">Movimento</span>
              <span className="text-xs text-muted-foreground">
                Mover-se no combate
              </span>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Custo: 5 PE • Limite: 1x por rodada
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
