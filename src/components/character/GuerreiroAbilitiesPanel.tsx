/**
 * GuerreiroAbilitiesPanel - Painel para habilidades ativas da trilha Guerreiro
 * 
 * Exibe e permite ativar as habilidades da trilha Guerreiro:
 * - Revidar (NEX 40%): Reação + 2 PE - contra-ataque após bloqueio
 * - Força Opressora (NEX 65%): Livre + 1 PE - derrubar ou empurrar
 * 
 * Técnica Letal e Potência Máxima são passivas e automatizadas no CombatRollModal
 */

import { useState, useMemo, useCallback } from 'react';
import { Sword, Shield, ArrowDownToLine, MoveHorizontal, ChevronDown, Check, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Definição das habilidades ativáveis do Guerreiro
interface GuerreiroAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  actionType: 'reaction' | 'free';
  description: string;
  shortEffect: string;
  trigger?: string;
  followUp?: {
    description: string;
    peCost: number;
  };
  options?: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const GUERREIRO_ABILITIES: GuerreiroAbility[] = [
  {
    id: 'revidar',
    name: 'Revidar',
    minNex: 40,
    peCost: 2,
    actionType: 'reaction',
    trigger: 'Após bloquear um ataque corpo a corpo',
    description: 'Quando você bloqueia um ataque corpo a corpo, pode gastar uma reação e 2 PE para fazer um ataque corpo a corpo contra o inimigo que o atacou.',
    shortEffect: 'Contra-ataque após bloquear',
  },
  {
    id: 'forca-opressora',
    name: 'Força Opressora',
    minNex: 65,
    peCost: 1,
    actionType: 'free',
    trigger: 'Após acertar ataque corpo a corpo',
    description: 'Quando você acerta um ataque corpo a corpo, pode gastar uma ação livre e 1 PE para realizar uma manobra derrubar ou empurrar contra o mesmo inimigo como parte do mesmo ataque.',
    shortEffect: 'Manobra grátis após acertar',
    followUp: {
      description: 'Se você escolheu derrubar e teve sucesso, pode gastar +1 PE para fazer um ataque corpo a corpo adicional contra o mesmo alvo.',
      peCost: 1,
    },
    options: [
      {
        id: 'derrubar',
        name: 'Derrubar',
        description: 'Teste de manobra. Se vencer, o inimigo fica caído. Pode gastar +1 PE para ataque adicional.',
        icon: <ArrowDownToLine className="w-4 h-4" />,
      },
      {
        id: 'empurrar',
        name: 'Empurrar',
        description: 'Teste de manobra com +5 para cada 10 pontos de dano causados. Empurra 1,5m por margem de 5.',
        icon: <MoveHorizontal className="w-4 h-4" />,
      },
    ],
  },
];

// Informações sobre habilidades passivas
const PASSIVE_INFO = {
  tecnicaLetal: {
    name: 'Técnica Letal',
    minNex: 10,
    description: '+2 na margem de ameaça com ataques corpo a corpo. Já automatizado no cálculo de crítico.',
  },
  potenciaMaxima: {
    name: 'Potência Máxima',
    minNex: 99,
    description: 'Dobra os bônus do Ataque Especial com ataques corpo a corpo. Selecione no modal de combate.',
  },
};

import type { EffectDuration } from '@/hooks/useActivatedEffects';

interface GuerreiroAbilitiesPanelProps {
  classTrack: string | null | undefined;
  nex: number;
  peCurrent: number;
  onPEChange: (newPE: number) => void;
  className?: string;
  // Callback para abrir o modal de combate (para fazer o ataque adicional)
  onRequestAttack?: () => void;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration, metadata?: Record<string, unknown>) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
}

export function GuerreiroAbilitiesPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  className,
  onRequestAttack,
}: GuerreiroAbilitiesPanelProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  
  // Modal para Força Opressora (escolha de manobra)
  const [forcaOpressoraModalOpen, setForcaOpressoraModalOpen] = useState(false);
  const [selectedManeuver, setSelectedManeuver] = useState<'derrubar' | 'empurrar' | null>(null);

  // Verifica se é trilha Guerreiro
  const isGuerreiro = useMemo(() => {
    if (!classTrack) return false;
    const trackNorm = classTrack.toLowerCase().replace(/\s+/g, '-');
    return trackNorm.includes('guerreiro');
  }, [classTrack]);

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => {
    if (!isGuerreiro) return [];
    return GUERREIRO_ABILITIES.filter(a => nex >= a.minNex);
  }, [isGuerreiro, nex]);

  // Habilidades passivas desbloqueadas
  const passiveAbilities = useMemo(() => {
    const passives: typeof PASSIVE_INFO[keyof typeof PASSIVE_INFO][] = [];
    if (nex >= PASSIVE_INFO.tecnicaLetal.minNex) passives.push(PASSIVE_INFO.tecnicaLetal);
    if (nex >= PASSIVE_INFO.potenciaMaxima.minNex) passives.push(PASSIVE_INFO.potenciaMaxima);
    return passives;
  }, [nex]);

  // Handler para usar Revidar
  const handleUseRevidar = useCallback(async () => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'revidar');
    if (!ability) return;

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newPE = peCurrent - ability.peCost;
    onPEChange(newPE);

    toast({
      title: `${ability.name} ativado!`,
      description: (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{ability.shortEffect}</span>
          <span className="text-xs text-muted-foreground">
            -{ability.peCost} PE (restam {newPE})
          </span>
          <span className="text-xs text-primary mt-1">
            Faça seu ataque corpo a corpo contra o inimigo.
          </span>
        </div>
      ),
    });

    setActivatingAbility(null);
    
    // Opcionalmente abrir o modal de ataque
    onRequestAttack?.();
  }, [peCurrent, onPEChange, toast, onRequestAttack]);

  // Handler para usar Força Opressora
  const handleUseForcaOpressora = useCallback(() => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora');
    if (!ability) return;

    if (peCurrent < ability.peCost) {
      toast({
        title: 'PE insuficiente',
        description: `${ability.name} requer ${ability.peCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setForcaOpressoraModalOpen(true);
  }, [peCurrent, toast]);

  // Confirmar manobra de Força Opressora
  const handleConfirmForcaOpressora = useCallback(async (withExtraAttack: boolean = false) => {
    const ability = GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora');
    if (!ability || !selectedManeuver) return;

    let totalCost = ability.peCost;
    if (withExtraAttack && selectedManeuver === 'derrubar' && ability.followUp) {
      totalCost += ability.followUp.peCost;
    }

    if (peCurrent < totalCost) {
      toast({
        title: 'PE insuficiente',
        description: `Esta ação requer ${totalCost} PE.`,
        variant: 'destructive',
      });
      return;
    }

    setActivatingAbility(ability.id);
    await new Promise(resolve => setTimeout(resolve, 300));

    const newPE = peCurrent - totalCost;
    onPEChange(newPE);

    const maneuverName = selectedManeuver === 'derrubar' ? 'Derrubar' : 'Empurrar';
    const extraInfo = selectedManeuver === 'empurrar' 
      ? 'Bônus: +5 para cada 10 de dano causado.'
      : withExtraAttack 
        ? 'Se derrubar, faça um ataque adicional!'
        : 'Role o teste de manobra contra o alvo.';

    toast({
      title: `${ability.name} - ${maneuverName}`,
      description: (
        <div className="flex flex-col gap-1">
          <span className="text-xs">{extraInfo}</span>
          <span className="text-xs text-muted-foreground">
            -{totalCost} PE (restam {newPE})
          </span>
        </div>
      ),
    });

    setActivatingAbility(null);
    setForcaOpressoraModalOpen(false);
    setSelectedManeuver(null);

    // Se escolheu ataque extra, abrir modal de ataque
    if (withExtraAttack && selectedManeuver === 'derrubar') {
      onRequestAttack?.();
    }
  }, [peCurrent, onPEChange, selectedManeuver, toast, onRequestAttack]);

  // Não renderiza se não for Guerreiro ou não tiver habilidades
  if (!isGuerreiro) {
    return null;
  }

  // Se não tem habilidades ativas mas tem passivas, mostrar info das passivas
  if (unlockedAbilities.length === 0 && passiveAbilities.length > 0) {
    return (
      <Card className={cn('border-orange-500/30 bg-orange-500/5', className)}>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sword className="w-4 h-4 text-orange-500" />
            <span className="font-display tracking-wider uppercase">
              Guerreiro
            </span>
            <Badge variant="outline" className="text-[10px] ml-1 border-orange-500/50 text-orange-500">
              Passivo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          {passiveAbilities.map((passive, idx) => (
            <div key={idx} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{passive.name}:</span>{' '}
              {passive.description}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (unlockedAbilities.length === 0) {
    return null;
  }

  return (
    <>
      <Card className={cn('border-orange-500/30 bg-orange-500/5', className)}>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-orange-500/10 transition-colors py-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-orange-500" />
                  <span className="font-display tracking-wider uppercase">
                    Guerreiro
                  </span>
                  <Badge variant="outline" className="text-[10px] ml-1 border-orange-500/50 text-orange-500">
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
              {/* Habilidades passivas info */}
              {passiveAbilities.length > 0 && (
                <div className="p-2 rounded-lg bg-muted/30 border border-border/30 mb-2">
                  <div className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-500" />
                    Passivas (automatizadas)
                  </div>
                  {passiveAbilities.map((passive, idx) => (
                    <div key={idx} className="text-[10px] text-muted-foreground">
                      <span className="text-foreground">{passive.name}</span>
                      {passive.minNex === 10 && ' — +2 margem crítico corpo a corpo'}
                      {passive.minNex === 99 && ' — 2x Ataque Especial corpo a corpo'}
                    </div>
                  ))}
                </div>
              )}

              {/* Habilidades ativáveis */}
              {unlockedAbilities.map((ability) => {
                const isActivating = activatingAbility === ability.id;
                const canAfford = peCurrent >= ability.peCost;
                const isDisabled = !canAfford || isActivating;

                return (
                  <div 
                    key={ability.id}
                    className={cn(
                      'p-3 rounded-lg border transition-all',
                      'bg-card/50 border-border/50 hover:border-orange-500/50'
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
                                : 'border-green-500/50 text-green-600'
                            )}
                          >
                            {ability.actionType === 'reaction' ? 'Reação' : 'Livre'}
                          </Badge>
                        </div>
                        {ability.trigger && (
                          <p className="text-[10px] text-orange-500 mt-0.5 italic">
                            ⚡ {ability.trigger}
                          </p>
                        )}
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
                          {ability.peCost} PE
                        </span>
                        {ability.followUp && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500">
                              +{ability.followUp.peCost} PE extra ataque
                            </span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1 bg-orange-600 hover:bg-orange-700"
                        disabled={isDisabled}
                        onClick={() => {
                          if (ability.id === 'revidar') {
                            handleUseRevidar();
                          } else if (ability.id === 'forca-opressora') {
                            handleUseForcaOpressora();
                          }
                        }}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
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
                Use essas habilidades após bloquear ou acertar um ataque corpo a corpo.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Modal de Força Opressora - Escolha de manobra */}
      <Dialog open={forcaOpressoraModalOpen} onOpenChange={setForcaOpressoraModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-orange-500" />
              Força Opressora
            </DialogTitle>
            <DialogDescription>
              Escolha a manobra que deseja realizar contra o inimigo.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {GUERREIRO_ABILITIES.find(a => a.id === 'forca-opressora')?.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedManeuver(option.id as 'derrubar' | 'empurrar')}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  selectedManeuver === option.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-border hover:border-orange-500/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {option.icon}
                  <span className="font-medium">{option.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </button>
            ))}
          </div>

          {selectedManeuver === 'derrubar' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-500">Ataque Adicional</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se derrubar o inimigo, você pode gastar +1 PE para fazer um ataque corpo a corpo adicional.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setForcaOpressoraModalOpen(false);
                setSelectedManeuver(null);
              }}
            >
              Cancelar
            </Button>
            
            {selectedManeuver === 'derrubar' ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={!selectedManeuver || peCurrent < 1}
                  onClick={() => handleConfirmForcaOpressora(false)}
                >
                  Apenas Derrubar (1 PE)
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={!selectedManeuver || peCurrent < 2}
                  onClick={() => handleConfirmForcaOpressora(true)}
                >
                  Derrubar + Atacar (2 PE)
                </Button>
              </div>
            ) : (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                disabled={!selectedManeuver || peCurrent < 1}
                onClick={() => handleConfirmForcaOpressora(false)}
              >
                Empurrar (1 PE)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
