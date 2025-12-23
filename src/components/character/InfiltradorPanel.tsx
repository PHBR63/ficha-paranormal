/**
 * InfiltradorPanel.tsx
 * 
 * Painel de habilidades da trilha Infiltrador do Especialista.
 * Habilidades oficiais conforme Ordem Paranormal RPG:
 * - NEX 10%: Ataque Furtivo (+1d6/+2d6/+3d6/+4d6 dano extra)
 * - NEX 40%: Gatuno (+5 Atletismo/Crime, esconder sem penalidade)
 * - NEX 65%: Assassinar (dobra dados do Ataque Furtivo)
 * - NEX 99%: Sombra Fugaz (ignora penalidade de -20 Furtividade)
 */

import { useState } from 'react';
import { Crosshair, Eye, Skull, Ghost, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface InfiltradorPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  agility: number;
  onPEChange: (delta: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
}

/**
 * Calcula os dados de dano extra do Ataque Furtivo baseado no NEX
 */
function getAtaqueFurtivoDice(nex: number): string {
  if (nex >= 99) return '+4d6';
  if (nex >= 65) return '+3d6';
  if (nex >= 40) return '+2d6';
  return '+1d6';
}

/**
 * Calcula a DT do teste de Fortitude para Assassinar
 * DT = Agilidade do personagem
 */
function getAssassinarDT(agility: number): number {
  return agility;
}

export function InfiltradorPanel({
  classTrack,
  nex,
  peCurrent,
  agility,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed
}: InfiltradorPanelProps) {
  const [assassinarActive, setAssassinarActive] = useState(false);

  // Só renderiza se for trilha infiltrador
  if (classTrack !== 'infiltrador') return null;

  // Verificações de NEX para cada habilidade
  const hasAtaqueFurtivo = nex >= 10;
  const hasGatuno = nex >= 40;
  const hasAssassinar = nex >= 65;
  const hasSombraFugaz = nex >= 99;

  // Verificar se Ataque Furtivo já foi usado nesta rodada
  const ataqueFurtivoUsedThisRound = usedAbilitiesThisRound.includes('ataque-furtivo-trilha');

  /**
   * Ativa o Ataque Furtivo (1 PE, 1x/rodada)
   */
  const handleAtaqueFurtivo = () => {
    if (peCurrent < 1) {
      toast.error('PE insuficiente', { description: 'Ataque Furtivo requer 1 PE.' });
      return;
    }
    if (ataqueFurtivoUsedThisRound) {
      toast.warning('Já usado nesta rodada', { description: 'Ataque Furtivo só pode ser usado 1x/rodada.' });
      return;
    }

    onPEChange(-1);
    onAbilityUsed?.('ataque-furtivo-trilha');
    
    const diceBonus = getAtaqueFurtivoDice(nex);
    const doubledDice = assassinarActive ? ` (dobrado: ${diceBonus.replace('+', '+').replace('d6', 'd6 x2')})` : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `${diceBonus} dano extra${doubledDice}. Custo: 1 PE.`
    });

    // Se Assassinar estava ativo, desativa após o uso
    if (assassinarActive) {
      setAssassinarActive(false);
    }
  };

  /**
   * Ativa Assassinar (3 PE + ação de movimento)
   */
  const handleAssassinar = () => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Assassinar requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    setAssassinarActive(true);
    
    toast.success('Assassinar ativado!', {
      description: `Próximo Ataque Furtivo terá dados dobrados. Alvo fica inconsciente/morrendo (Fort DT ${getAssassinarDT(agility)} evita).`
    });
  };

  /**
   * Ativa Sombra Fugaz (3 PE)
   */
  const handleSombraFugaz = () => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Sombra Fugaz requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    toast.success('Sombra Fugaz ativado!', {
      description: 'Ignora penalidade de -20 no teste de Furtividade após ação chamativa.'
    });
  };

  return (
    <Card className="border-purple-500/30 bg-purple-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-purple-400" />
          Trilha do Infiltrador
          <Badge variant="outline" className="ml-auto text-xs">
            NEX {nex}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* NEX 10% - Ataque Furtivo */}
        {hasAtaqueFurtivo && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Crosshair className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">Ataque Furtivo</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>1x/rodada. Contra alvo desprevenido (corpo a corpo, curto ou flanqueando), causa {getAtaqueFurtivoDice(nex)} dano extra.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getAtaqueFurtivoDice(nex)} dano • 1 PE • 1x/rodada
                  {assassinarActive && <span className="text-red-400 ml-1">(dados dobrados!)</span>}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={ataqueFurtivoUsedThisRound ? "outline" : "default"}
              disabled={peCurrent < 1 || ataqueFurtivoUsedThisRound}
              onClick={handleAtaqueFurtivo}
              className="shrink-0"
            >
              <Zap className="h-3 w-3 mr-1" />
              {ataqueFurtivoUsedThisRound ? 'Usado' : 'Ativar'}
            </Button>
          </div>
        )}

        {/* NEX 40% - Gatuno (Passivo) */}
        {hasGatuno && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-900/20 border border-purple-500/10">
            <Eye className="h-4 w-4 text-purple-300 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">Gatuno</span>
                <Badge variant="secondary" className="text-[10px] px-1">Passivo</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                +5 Atletismo e Crime. Esconder sem penalidade de movimento.
              </p>
            </div>
          </div>
        )}

        {/* NEX 65% - Assassinar */}
        {hasAssassinar && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Skull className="h-4 w-4 text-red-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">Assassinar</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Gaste ação de movimento + 3 PE. Próximo Ataque Furtivo dobra dados. Se causar dano, alvo fica inconsciente/morrendo (Fort DT {getAssassinarDT(agility)} evita).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  3 PE + movimento • Fort DT {getAssassinarDT(agility)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={assassinarActive ? "secondary" : "default"}
              disabled={peCurrent < 3 || assassinarActive}
              onClick={handleAssassinar}
              className="shrink-0"
            >
              {assassinarActive ? 'Ativo' : 'Preparar'}
            </Button>
          </div>
        )}

        {/* NEX 99% - Sombra Fugaz */}
        {hasSombraFugaz && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Ghost className="h-4 w-4 text-purple-300 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm truncate">Sombra Fugaz</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Após atacar ou ação chamativa, gaste 3 PE para ignorar a penalidade de -20 no teste de Furtividade.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  3 PE • Ignora -20 Furtividade
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              disabled={peCurrent < 3}
              onClick={handleSombraFugaz}
              className="shrink-0"
            >
              <Ghost className="h-3 w-3 mr-1" />
              Ativar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
