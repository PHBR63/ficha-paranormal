/**
 * AtiradorDeElitePanel - Painel de habilidades da trilha Atirador de Elite (Especialista)
 * 
 * Habilidades:
 * - NEX 10%: Mira de Elite (passiva) - Proficiência com balas longas + INT em dano
 * - NEX 40%: Disparo Letal (1 PE) - +2 margem de ameaça ao mirar
 * - NEX 65%: Disparo Impactante (2 PE) - Manobra ao invés de dano
 * - NEX 99%: Atirar para Matar (passiva) - Crítico = dano máximo
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crosshair, Target, Zap, Skull, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

// Tipos de manobras disponíveis para Disparo Impactante
const MANOBRAS_IMPACTANTE = [
  { id: 'derrubar', name: 'Derrubar', description: 'Derruba o alvo' },
  { id: 'desarmar', name: 'Desarmar', description: 'Desarma o alvo' },
  { id: 'empurrar', name: 'Empurrar', description: 'Empurra o alvo' },
  { id: 'quebrar', name: 'Quebrar', description: 'Quebra item do alvo' },
];

// Interface para habilidades da trilha
interface AtiradorAbility {
  id: string;
  name: string;
  minNex: number;
  peCost: number;
  isPassive: boolean;
  description: string;
  shortEffect: string;
}

// Definição das habilidades do Atirador de Elite
const ATIRADOR_ABILITIES: AtiradorAbility[] = [
  {
    id: 'mira-de-elite',
    name: 'Mira de Elite',
    minNex: 10,
    peCost: 0,
    isPassive: true,
    description: 'Proficiência com armas de fogo que usam balas longas e soma Intelecto em rolagens de dano com essas armas.',
    shortEffect: 'Proficiência balas longas + INT em dano',
  },
  {
    id: 'disparo-letal',
    name: 'Disparo Letal',
    minNex: 40,
    peCost: 1,
    isPassive: false,
    description: 'Quando faz a ação mirar, você pode gastar 1 PE para aumentar em +2 a margem de ameaça do próximo ataque que fizer até o final de seu próximo turno.',
    shortEffect: '+2 margem de ameaça (ao mirar)',
  },
  {
    id: 'disparo-impactante',
    name: 'Disparo Impactante',
    minNex: 65,
    peCost: 2,
    isPassive: false,
    description: 'Quando ataca com uma arma de fogo, você pode gastar 2 PE e, em vez de causar dano, fazer uma manobra entre derrubar, desarmar, empurrar ou quebrar.',
    shortEffect: 'Manobra ao invés de dano',
  },
  {
    id: 'atirar-para-matar',
    name: 'Atirar para Matar',
    minNex: 99,
    peCost: 0,
    isPassive: true,
    description: 'Quando faz um acerto crítico com uma arma de fogo, você causa dano máximo, sem precisar rolar dados.',
    shortEffect: 'Crítico = dano máximo',
  },
];

interface AtiradorDeElitePanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  intellect: number;
  onPEChange: (newPE: number) => void;
}

export function AtiradorDeElitePanel({
  classTrack,
  nex,
  peCurrent,
  intellect,
  onPEChange,
}: AtiradorDeElitePanelProps) {
  const [activatingAbility, setActivatingAbility] = useState<string | null>(null);
  const [showManeuverDrawer, setShowManeuverDrawer] = useState(false);

  // Verifica se é Atirador de Elite
  const isAtiradorElite = classTrack === 'Atirador de Elite';

  // Filtra habilidades desbloqueadas pelo NEX
  const unlockedAbilities = useMemo(() => 
    ATIRADOR_ABILITIES.filter(ability => nex >= ability.minNex),
    [nex]
  );

  // Handler para usar habilidade ativa
  const handleUseAbility = useCallback(async (ability: AtiradorAbility) => {
    if (ability.isPassive) return;
    
    // Verifica PE suficiente
    if (peCurrent < ability.peCost) {
      toast.error(`PE insuficiente para ${ability.name}`, {
        description: `Necessário: ${ability.peCost} PE | Atual: ${peCurrent} PE`,
      });
      return;
    }

    // Disparo Impactante abre drawer de escolha de manobra
    if (ability.id === 'disparo-impactante') {
      setShowManeuverDrawer(true);
      return;
    }

    setActivatingAbility(ability.id);

    try {
      // Deduz PE
      onPEChange(peCurrent - ability.peCost);

      toast.success(`${ability.name} ativado!`, {
        description: ability.shortEffect,
      });
    } finally {
      setTimeout(() => setActivatingAbility(null), 300);
    }
  }, [peCurrent, onPEChange]);

  // Handler para escolher manobra do Disparo Impactante
  const handleManeuverChoice = useCallback((manobra: typeof MANOBRAS_IMPACTANTE[0]) => {
    const ability = ATIRADOR_ABILITIES.find(a => a.id === 'disparo-impactante')!;
    
    if (peCurrent < ability.peCost) {
      toast.error(`PE insuficiente`, {
        description: `Necessário: ${ability.peCost} PE`,
      });
      setShowManeuverDrawer(false);
      return;
    }

    // Deduz PE
    onPEChange(peCurrent - ability.peCost);

    toast.success(`Disparo Impactante: ${manobra.name}`, {
      description: `Você executa a manobra ${manobra.name} com seu disparo!`,
    });

    setShowManeuverDrawer(false);
  }, [peCurrent, onPEChange]);

  // Não renderiza se não for Atirador de Elite ou não tiver habilidades
  if (!isAtiradorElite || unlockedAbilities.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-amber-400" />
            Atirador de Elite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unlockedAbilities.map((ability) => {
            const isActivating = activatingAbility === ability.id;
            const canAfford = peCurrent >= ability.peCost;

            return (
              <div 
                key={ability.id}
                className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ability.id === 'mira-de-elite' && <Target className="h-4 w-4 text-amber-400" />}
                    {ability.id === 'disparo-letal' && <Zap className="h-4 w-4 text-red-400" />}
                    {ability.id === 'disparo-impactante' && <Target className="h-4 w-4 text-orange-400" />}
                    {ability.id === 'atirar-para-matar' && <Skull className="h-4 w-4 text-red-500" />}
                    <span className="font-medium text-sm">{ability.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      NEX {ability.minNex}%
                    </Badge>
                  </div>
                  
                  {ability.isPassive ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Passiva
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {ability.peCost} PE
                      </Badge>
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        disabled={!canAfford || isActivating}
                        onClick={() => handleUseAbility(ability)}
                        className="h-7 text-xs"
                      >
                        {isActivating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Usar'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {ability.shortEffect}
                </p>

                {/* Info extra para Mira de Elite - mostra bônus de INT */}
                {ability.id === 'mira-de-elite' && (
                  <div className="flex items-center gap-2 mt-1 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <CheckCircle2 className="h-3 w-3 text-amber-400" />
                    <span className="text-xs text-amber-300">
                      +{intellect} dano (Intelecto) com balas longas
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Drawer para escolha de manobra - Disparo Impactante */}
      <Drawer open={showManeuverDrawer} onOpenChange={setShowManeuverDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Disparo Impactante</DrawerTitle>
            <DrawerDescription>
              Escolha a manobra que deseja executar (2 PE)
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-2 gap-3">
            {MANOBRAS_IMPACTANTE.map((manobra) => (
              <Button
                key={manobra.id}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
                onClick={() => handleManeuverChoice(manobra)}
              >
                <span className="font-medium">{manobra.name}</span>
                <span className="text-xs text-muted-foreground">{manobra.description}</span>
              </Button>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
