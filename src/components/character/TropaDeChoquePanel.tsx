/**
 * TropaDeChoquePanel - Painel de habilidades da trilha Tropa de Choque
 * Exibe habilidades passivas/condicionais e ativadas com dedução automática de PE
 * 
 * Habilidades:
 * - Casca Grossa (NEX 10%): +1 PV por 5% NEX + Vigor em RD ao bloquear (passivo/condicional)
 * - Cai Dentro (NEX 40%): 1 PE (reação) para forçar inimigo a atacar você
 * - Duro de Matar (NEX 65%): 2 PE (reação) para reduzir dano à metade
 * - Inquebrável (NEX 99%): +5 Defesa e RD 5 quando machucado (condicional)
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldAlert, 
  Heart, 
  Skull,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Zap
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
import { toast } from '@/hooks/use-toast';

// Definição das habilidades ativadas (reações) da trilha Tropa de Choque
const TROPA_ABILITIES = [
  {
    id: 'cai-dentro',
    name: 'Cai Dentro',
    minNex: 40,
    peCost: 1,
    actionType: 'Reação',
    description: 'Sempre que um oponente em alcance curto ataca um de seus aliados, você pode gastar uma reação e 1 PE para fazer com que esse oponente faça um teste de Vontade (DT Vig). Se falhar, o oponente deve atacar você em vez de seu aliado.',
    shortEffect: 'Força inimigo a atacar você',
    icon: ShieldAlert,
    usesVigorDT: true,
    progressionNex: undefined as number | undefined,
    progressionText: undefined as string | undefined,
  },
  {
    id: 'duro-de-matar',
    name: 'Duro de Matar',
    minNex: 65,
    peCost: 2,
    actionType: 'Reação',
    description: 'Ao sofrer dano não paranormal, você pode gastar uma reação e 2 PE para reduzir esse dano à metade. Em NEX 85%, você pode usar esta habilidade para reduzir dano paranormal.',
    shortEffect: 'Reduz dano à metade',
    icon: Heart,
    usesVigorDT: false,
    progressionNex: 85,
    progressionText: 'Inclui dano paranormal',
  },
];

// Habilidades passivas/condicionais (informativas)
const PASSIVE_ABILITIES = [
  {
    id: 'casca-grossa',
    name: 'Casca Grossa',
    minNex: 10,
    description: 'Você recebe +1 PV para cada 5% de NEX e, quando faz um bloqueio, soma seu Vigor na resistência a dano recebida.',
    effect: '+1 PV por 5% NEX (automático)',
    conditionalEffect: '+Vigor em RD ao bloquear',
    icon: Shield,
    conditionalId: 'bloqueio-casca-grossa',
  },
  {
    id: 'inquebravel',
    name: 'Inquebrável',
    minNex: 99,
    description: 'Enquanto estiver machucado, você recebe +5 na Defesa e resistência a dano 5. Enquanto estiver morrendo, você não fica indefeso e ainda pode realizar ações.',
    effect: '+5 Defesa, RD 5 (quando machucado)',
    conditionalEffect: 'Ativa quando PV < 50%',
    icon: Skull,
    conditionalId: 'inquebravel',
  },
] as const;

interface TropaDeChoquePanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  vigor: number;
  hpCurrent: number;
  hpMax: number;
  onPEChange: (newPE: number) => void;
  className?: string;
}

export function TropaDeChoquePanel({
  classTrack,
  nex,
  peCurrent,
  vigor,
  hpCurrent,
  hpMax,
  onPEChange,
  className,
}: TropaDeChoquePanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Verifica se é trilha Tropa de Choque
  const isTropaDeChoque = useMemo(() => {
    if (!classTrack) return false;
    const normalized = classTrack.toLowerCase().replace(/[^a-z]/g, '');
    return normalized.includes('tropa') || normalized.includes('choque') || 
           classTrack === 'tropa-choque';
  }, [classTrack]);

  // Filtra habilidades desbloqueadas
  const unlockedActiveAbilities = useMemo(() => 
    TROPA_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  const unlockedPassiveAbilities = useMemo(() =>
    PASSIVE_ABILITIES.filter(a => nex >= a.minNex),
    [nex]
  );

  // Calcula DT baseada em Vigor (para Cai Dentro)
  const vigorDT = useMemo(() => 10 + vigor, [vigor]);

  // Verifica se está machucado (PV < 50%)
  const isWounded = useMemo(() => hpCurrent < (hpMax / 2), [hpCurrent, hpMax]);

  // Calcula bônus de PV da Casca Grossa
  const cascaGrossaHP = useMemo(() => Math.floor(nex / 5), [nex]);

  // Handler para usar habilidade ativada
  const handleUseAbility = useCallback((abilityId: string, peCost: number, abilityName: string) => {
    // Verifica PE
    if (peCurrent < peCost) {
      toast({
        title: "PE Insuficiente",
        description: `Você precisa de ${peCost} PE para usar ${abilityName}.`,
        variant: "destructive",
      });
      return;
    }

    // Deduz PE
    onPEChange(peCurrent - peCost);

    // Mensagem específica por habilidade
    if (abilityId === 'cai-dentro') {
      toast({
        title: "Cai Dentro!",
        description: `${peCost} PE consumido. O inimigo deve fazer teste de Vontade (DT ${vigorDT}).`,
      });
    } else if (abilityId === 'duro-de-matar') {
      const canReduceParanormal = nex >= 85;
      toast({
        title: "Duro de Matar!",
        description: `${peCost} PE consumidos. O dano ${canReduceParanormal ? '(físico ou paranormal)' : 'não paranormal'} é reduzido à metade.`,
      });
    }
  }, [peCurrent, onPEChange, vigorDT, nex]);

  // Não renderiza se não for Tropa de Choque ou não tiver habilidades
  if (!isTropaDeChoque || (unlockedActiveAbilities.length === 0 && unlockedPassiveAbilities.length === 0)) {
    return null;
  }

  return (
    <Card className={cn("border-primary/20 bg-card/50", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Tropa de Choque
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
            {/* Habilidades Passivas/Condicionais */}
            {unlockedPassiveAbilities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Passivos & Condicionais</p>
                {unlockedPassiveAbilities.map((ability) => {
                  const Icon = ability.icon;
                  const isInquebravel = ability.id === 'inquebravel';
                  
                  return (
                    <div
                      key={ability.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-md border border-border/50",
                        isInquebravel && isWounded 
                          ? "bg-destructive/10 border-destructive/30" 
                          : "bg-muted/30"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 mt-0.5 shrink-0",
                        isInquebravel && isWounded ? "text-destructive" : "text-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ability.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            NEX {ability.minNex}%
                          </Badge>
                          {ability.id === 'casca-grossa' && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                              +{cascaGrossaHP} PV
                            </Badge>
                          )}
                          {isInquebravel && isWounded && (
                            <Badge variant="destructive" className="text-[10px]">
                              ATIVO
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-primary mt-0.5">{ability.effect}</p>
                        {ability.conditionalEffect && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {ability.conditionalEffect}
                            {ability.id === 'casca-grossa' && ` (+${vigor} RD)`}
                          </p>
                        )}
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

            {/* Habilidades Ativadas (Reações) */}
            {unlockedActiveAbilities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Reações</p>
                {unlockedActiveAbilities.map((ability) => {
                  const Icon = ability.icon;
                  const canAfford = peCurrent >= ability.peCost;
                  const hasProgression = ability.progressionNex && nex >= ability.progressionNex;

                  return (
                    <motion.div
                      key={ability.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 p-2 rounded-md border border-border/50 bg-card hover:border-primary/30 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{ability.name}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {ability.peCost} PE
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {ability.actionType}
                          </Badge>
                          {hasProgression && (
                            <Badge variant="outline" className="text-[10px] text-energy border-energy/30">
                              <Zap className="w-2 h-2 mr-0.5" />
                              {ability.progressionText}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ability.shortEffect}</p>
                        
                        {/* DT para Cai Dentro */}
                        {ability.usesVigorDT && (
                          <p className="text-[10px] text-primary mt-0.5">
                            DT: 10 + Vigor ({vigor}) = <span className="font-bold">{vigorDT}</span>
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={!canAfford}
                            onClick={() => handleUseAbility(ability.id, ability.peCost, ability.name)}
                            className="h-7 text-xs"
                          >
                            Usar ({ability.peCost} PE)
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
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
