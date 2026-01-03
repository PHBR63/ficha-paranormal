/**
 * InfiltradorPanel.tsx
 * 
 * REFATORADO PARA CONSUMIR DADOS DO SUE (Sistema Unificado de Efeitos)
 * 
 * Painel de habilidades da trilha Infiltrador do Especialista.
 * Habilidades oficiais conforme Ordem Paranormal RPG:
 * - NEX 10%: Ataque Furtivo (+1d6/+2d6/+3d6/+4d6 dano extra)
 * - NEX 40%: Gatuno (+5 Atletismo/Crime, esconder sem penalidade)
 * - NEX 65%: Assassinar (dobra dados do Ataque Furtivo)
 * - NEX 99%: Sombra Fugaz (ignora penalidade de -20 Furtividade)
 * 
 * Integrado com useActivatedEffects para comunicar efeitos ao SUE.
 */

import { useState, useMemo, useCallback } from 'react';
import { Crosshair, Eye, Skull, Ghost, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { TRACK_EFFECT_IDS, type EffectDuration } from '@/hooks/useActivatedEffects';
import type { ComputedEffects } from '@/lib/unified-effects-engine';

// =====================================================
// Props do Componente
// =====================================================

interface InfiltradorPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  agility: number;
  onPEChange: (delta: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  /** Dados consolidados do SUE (opcional - se fornecido, usa dados do SUE) */
  computedEffects?: ComputedEffects;
  /** Callback para ativar efeito no SUE */
  onActivateEffect?: (id: string, name: string, duration: EffectDuration) => void;
  /** Verifica se um efeito está ativo */
  isEffectActive?: (id: string) => boolean;
}

// =====================================================
// Funções Auxiliares
// =====================================================

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

// =====================================================
// Componente Principal
// =====================================================

export function InfiltradorPanel({
  classTrack,
  nex,
  peCurrent,
  agility,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed,
  computedEffects,
  onActivateEffect,
  isEffectActive
}: InfiltradorPanelProps) {
  const [assassinarActive, setAssassinarActive] = useState(false);

  // Só renderiza se for trilha infiltrador
  if (classTrack !== 'infiltrador') return null;

  // ===== DADOS DO SUE (se disponível) =====
  
  // Dados de Ataque Furtivo do SUE
  const sueSneakAttack = computedEffects?.sneakAttack;
  
  // Bônus de furtividade do SUE
  const sueStealthBonuses = sueSneakAttack?.stealthBonuses;
  
  // ===== HABILIDADES DESBLOQUEADAS =====
  const hasAtaqueFurtivo = nex >= 10;
  const hasGatuno = nex >= 40;
  const hasAssassinar = nex >= 65;
  const hasSombraFugaz = nex >= 99;

  // Verificar se Ataque Furtivo já foi usado nesta rodada
  const ataqueFurtivoUsedThisRound = usedAbilitiesThisRound.includes('ataque-furtivo-trilha');

  // ===== DADOS DERIVADOS DO SUE =====
  
  // Dados de dano do Ataque Furtivo - usa SUE se disponível
  const sneakAttackDice = useMemo(() => {
    if (sueSneakAttack) {
      // Usa totalDice do SUE (já inclui progressão por NEX)
      const diceCount = sueSneakAttack.totalDice ?? sueSneakAttack.baseDice ?? 1;
      const dieType = sueSneakAttack.dieType ?? 'd6';
      return `+${diceCount}${dieType}`;
    }
    return getAtaqueFurtivoDice(nex);
  }, [sueSneakAttack, nex]);

  // Multiplicador do Assassinar (dobra os dados)
  const sneakAttackMultiplier = useMemo(() => {
    if (sueSneakAttack?.multiplier) {
      return sueSneakAttack.multiplier;
    }
    return assassinarActive ? 2 : 1;
  }, [sueSneakAttack, assassinarActive]);

  // Verifica se remove penalidade de movimento em furtividade
  const removesStealthMovementPenalty = useMemo(() => {
    return sueStealthBonuses?.removesMovementPenalty ?? (nex >= 40);
  }, [sueStealthBonuses, nex]);

  // Verifica se ignora penalidades de furtividade
  const ignoresStealthPenalties = useMemo(() => {
    return sueStealthBonuses?.ignoresAllPenalties ?? false;
  }, [sueStealthBonuses]);

  // ===== HANDLERS =====

  /**
   * Ativa o Ataque Furtivo (1 PE, 1x/rodada)
   */
  const handleAtaqueFurtivo = useCallback(() => {
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
    
    // Ativa efeito no SUE
    onActivateEffect?.(TRACK_EFFECT_IDS.ATAQUE_FURTIVO, 'Ataque Furtivo', 'instant');
    
    const diceBonus = sneakAttackDice;
    const multiplierText = sneakAttackMultiplier > 1 
      ? ` (x${sneakAttackMultiplier} = ${diceBonus.replace('+', '+')})`
      : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `${diceBonus} dano extra${multiplierText}. Custo: 1 PE.${sueSneakAttack ? ' (via SUE)' : ''}`
    });

    // Se Assassinar estava ativo, desativa após o uso
    if (assassinarActive) {
      setAssassinarActive(false);
    }
  }, [peCurrent, ataqueFurtivoUsedThisRound, onPEChange, onAbilityUsed, onActivateEffect, sneakAttackDice, sneakAttackMultiplier, assassinarActive, sueSneakAttack]);

  /**
   * Ativa Assassinar (3 PE + ação de movimento)
   */
  const handleAssassinar = useCallback(() => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Assassinar requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    setAssassinarActive(true);
    
    // Ativa efeito no SUE - dura até próximo ataque
    onActivateEffect?.(TRACK_EFFECT_IDS.ASSASSINAR, 'Assassinar', 'next-attack');
    
    toast.success('Assassinar ativado!', {
      description: `Próximo Ataque Furtivo terá dados dobrados. Alvo fica inconsciente/morrendo (Fort DT ${getAssassinarDT(agility)} evita).`
    });
  }, [peCurrent, onPEChange, onActivateEffect, agility]);

  /**
   * Ativa Sombra Fugaz (3 PE)
   */
  const handleSombraFugaz = useCallback(() => {
    if (peCurrent < 3) {
      toast.error('PE insuficiente', { description: 'Sombra Fugaz requer 3 PE.' });
      return;
    }

    onPEChange(-3);
    
    // Ativa efeito no SUE - efeito instantâneo
    onActivateEffect?.(TRACK_EFFECT_IDS.SOMBRA_FUGAZ, 'Sombra Fugaz', 'instant');
    
    toast.success('Sombra Fugaz ativado!', {
      description: 'Ignora penalidade de -20 no teste de Furtividade após ação chamativa.'
    });
  }, [peCurrent, onPEChange, onActivateEffect]);

  return (
    <Card className="border-purple-500/30 bg-purple-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5 text-purple-400" />
          Trilha do Infiltrador
          <Badge variant="outline" className="ml-auto text-xs">
            NEX {nex}%
          </Badge>
          {/* Indicador de dados do SUE */}
          {sueSneakAttack && (
            <Badge variant="secondary" className="text-[10px]">
              SUE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Indicador de bônus de furtividade do SUE */}
        {sueStealthBonuses && (removesStealthMovementPenalty || ignoresStealthPenalties) && (
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
            <p className="text-xs font-medium text-purple-300">Bônus de Furtividade (SUE)</p>
            <div className="flex gap-2 flex-wrap">
              {removesStealthMovementPenalty && (
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                  Sem penalidade de movimento
                </Badge>
              )}
              {ignoresStealthPenalties && (
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300">
                  Ignora todas as penalidades
                </Badge>
              )}
            </div>
          </div>
        )}
        
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
                        <p>1x/rodada. Contra alvo desprevenido (corpo a corpo, curto ou flanqueando), causa {sneakAttackDice} dano extra.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground">
                  {sneakAttackDice} dano • 1 PE • 1x/rodada
                  {(assassinarActive || sneakAttackMultiplier > 1) && (
                    <span className="text-red-400 ml-1">(x{sneakAttackMultiplier} dados!)</span>
                  )}
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
                {removesStealthMovementPenalty && sueSneakAttack && (
                  <span className="text-purple-400 ml-1">(via SUE)</span>
                )}
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
                  {ignoresStealthPenalties && (
                    <span className="text-purple-400 ml-1">(via SUE)</span>
                  )}
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
