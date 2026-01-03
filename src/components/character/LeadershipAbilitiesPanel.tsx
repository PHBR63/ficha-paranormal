/**
 * LeadershipAbilitiesPanel - Painel para habilidades de liderança (Comandante de Campo)
 * 
 * Exibe e permite ativar as habilidades da trilha Comandante de Campo:
 * - Inspirar Confiança (NEX 10%): Reação + 2 PE - aliado rerola teste
 * - Estrategista (NEX 40%): Padrão + 1 PE/aliado - aliados ganham ação de movimento
 * - Brecha na Guarda (NEX 65%): Reação + 2 PE (1x/rodada) - ataque extra
 * - Oficial Comandante (NEX 99%): Padrão + 5 PE - aliados ganham ação padrão
 */

import { useState, useMemo, useCallback } from 'react';
import { Users, Shield, Zap, Crown, ChevronDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Definição das habilidades de Comandante de Campo
interface LeadershipAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction' | 'standard';
  range: 'short' | 'medium';
  description: string;
  shortEffect: string;
  maxAllies?: number | 'intellect';
  perRound?: boolean;
  costPerTarget?: boolean;
}

const COMANDANTE_ABILITIES: LeadershipAbility[] = [
  {
    id: 'inspirar-confianca',
    name: 'Inspirar Confiança',
    minNex: 10,
    peCost: 2,
    actionType: 'reaction',
    range: 'short',
    description: 'Sua liderança inspira seus aliados. Você pode gastar uma reação e 2 PE para fazer um aliado em alcance curto rolar novamente um teste recém realizado.',
    shortEffect: 'Aliado rerola teste',
    maxAllies: 1,
  },
  {
    id: 'estrategista',
    name: 'Estrategista',
    minNex: 40,
    peCost: 1,
    actionType: 'standard',
    range: 'short',
    description: 'Você pode direcionar aliados em alcance curto. Gaste uma ação padrão e 1 PE por aliado que quiser direcionar (limitado pelo seu Intelecto). No próximo turno dos aliados afetados, eles ganham uma ação de movimento adicional.',
    shortEffect: '+1 ação de movimento',
    maxAllies: 'intellect',
    costPerTarget: true,
  },
  {
    id: 'brecha-na-guarda',
    name: 'Brecha na Guarda',
    minNex: 65,
    peCost: 2,
    actionType: 'reaction',
    range: 'medium',
    description: 'Uma vez por rodada, quando um aliado causar dano em um inimigo que esteja em seu alcance curto, você pode gastar uma reação e 2 PE para que você ou outro aliado em alcance curto faça um ataque adicional contra o mesmo inimigo. Além disso, o alcance de Inspirar Confiança e Estrategista aumenta para médio.',
    shortEffect: 'Ataque extra para aliado',
    maxAllies: 1,
    perRound: true,
  },
  {
    id: 'oficial-comandante',
    name: 'Oficial Comandante',
    minNex: 99,
    peCost: 5,
    actionType: 'standard',
    range: 'medium',
    description: 'Você pode gastar uma ação padrão e 5 PE para que cada aliado que você possa ver em alcance médio receba uma ação padrão adicional no próximo turno dele.',
    shortEffect: '+1 ação padrão',
  },
];

import type { EffectDuration, ComputedEffects } from '@/hooks';

interface LeadershipAbilitiesPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  // Tracking de uso por rodada
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
  /** Dados consolidados do SUE */
  computedEffects?: ComputedEffects;
}

export function LeadershipAbilitiesPanel({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
  className,
  usedAbilitiesThisRound = [],
  onAbilityUsed,
  computedEffects,
}: LeadershipAbilitiesPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  
  // Usa dados do SUE para exibir habilidades de liderança consolidadas se disponível
  const sueLeadershipData = useMemo(() => {
    if (!computedEffects) return null;
    
    return {
      // Habilidades de liderança disponíveis
      leadershipAbilities: computedEffects.leadership?.abilities ?? [],
      // Efeitos disponíveis (rerolar, ação extra, PV temp, etc.)
      availableEffects: computedEffects.leadership?.availableEffects,
    };
  }, [computedEffects]);
  // Verifica se é trilha Comandante de Campo
  const isComandanteCampo = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('comandante') || trackNorm === 'comandante-campo';
  }, [classTrack]);

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    if (!isComandanteCampo) return [];
    return COMANDANTE_ABILITIES.filter(a => nex >= a.minNex);
  }, [isComandanteCampo, nex]);

  // Calcula limite de aliados para Estrategista
  const maxAlliesForEstrategista = useMemo(() => {
    return Math.max(1, intellect);
  }, [intellect]);

  // Handler para usar habilidade
  const handleUseAbility = useCallback(async (ability: LeadershipAbility, targetCount: number = 1) => {
    // Valida uso por rodada
    if (ability.perRound && usedAbilitiesThisRound.includes(ability.id)) {
      toast({
        title: 'Já usada nesta rodada',
        description: `${ability.name} só pode ser usada uma vez por rodada.`,
        variant: 'destructive',
      });
      return;
    }

    // Calcula custo total
    const totalCost = ability.costPerTarget 
      ? ability.peCost * targetCount 
      : ability.peCost;

    // Valida PE
    if (peCurrent < totalCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${totalCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);

    // Simula delay de feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    // Deduz PE
    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    // Registra uso
    onAbilityUsed?.(ability.id);

    toast({
      title: `${ability.name} ativada!`,
      description: (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{ability.shortEffect}</span>
          <span className="text-xs text-muted-foreground">
            -{totalCost} PE (restam {newPE})
          </span>
        </div>
      ),
    });

    setActivatingAbility(null);
  }, [peCurrent, onPEChange, onAbilityUsed, usedAbilitiesThisRound, toast]);

  // Não renderiza se não for Comandante de Campo ou não tiver habilidades
  if (!isComandanteCampo || unlockedAbilities.length === 0) {
    return null;
  }

  return (
    <Card className={cn('border-primary/30 bg-primary/5', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors py-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="font-display tracking-wider uppercase">
                  Liderança
                </span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {unlockedAbilities.length} habilidades
                </Badge>
              </div>
              <ChevronDown 
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )} 
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-3 space-y-2">
            {unlockedAbilities.map((ability) => {
              const isUsedThisRound = ability.perRound && usedAbilitiesThisRound.includes(ability.id);
              const isActivating = activatingAbility === ability.id;
              const canAfford = peCurrent >= ability.peCost;
              const isDisabled = isUsedThisRound || !canAfford || isActivating;

              return (
                <div 
                  key={ability.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all',
                    isUsedThisRound 
                      ? 'bg-muted/50 border-muted opacity-60'
                      : 'bg-card/50 border-border/50 hover:border-primary/50'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ability.name}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-[9px] px-1.5',
                            ability.actionType === 'reaction' 
                              ? 'border-yellow-500/50 text-yellow-600' 
                              : 'border-blue-500/50 text-blue-600'
                          )}
                        >
                          {ability.actionType === 'reaction' ? 'Reação' : 'Padrão'}
                        </Badge>
                        {ability.perRound && (
                          <Badge variant="secondary" className="text-[9px] px-1.5">
                            1x/rodada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ability.description}
                      </p>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-paranormal" />
                        {ability.costPerTarget 
                          ? `${ability.peCost} PE/aliado`
                          : `${ability.peCost} PE`
                        }
                      </span>
                      <span>•</span>
                      <span>
                        Alcance {ability.range === 'short' ? 'curto' : 'médio'}
                      </span>
                      {ability.maxAllies && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {ability.maxAllies === 'intellect' 
                              ? `${maxAlliesForEstrategista} aliados`
                              : `${ability.maxAllies} aliado`
                            }
                          </span>
                        </>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isUsedThisRound ? 'ghost' : 'default'}
                      className="h-7 text-xs gap-1"
                      disabled={isDisabled}
                      onClick={() => handleUseAbility(ability)}
                    >
                      {isActivating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isUsedThisRound ? (
                        <>
                          <Check className="w-3 h-3" />
                          Usada
                        </>
                      ) : (
                        'Usar'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Dica de uso */}
            <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border/30">
              Habilidades de suporte afetam aliados. Comunique o efeito ao mestre.
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
