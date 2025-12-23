/**
 * MobileInfiltradorPanel.tsx
 * 
 * Versão mobile do painel de habilidades da trilha Infiltrador.
 * Habilidades oficiais conforme Ordem Paranormal RPG.
 */

import { useState } from 'react';
import { Crosshair, Eye, Skull, Ghost, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';
import { toast } from 'sonner';

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration';

interface MobileInfiltradorPanelProps {
  classTrack: string | null;
  nex: number;
  peCurrent: number;
  agility: number;
  onPEChange: (delta: number) => void;
  usedAbilitiesThisRound?: string[];
  onAbilityUsed?: (abilityId: string) => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
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
 */
function getAssassinarDT(agility: number): number {
  return agility;
}

export function MobileInfiltradorPanel({
  classTrack,
  nex,
  peCurrent,
  agility,
  onPEChange,
  usedAbilitiesThisRound = [],
  onAbilityUsed
}: MobileInfiltradorPanelProps) {
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
    const doubledDice = assassinarActive ? ' (DOBRADO!)' : '';
    
    toast.success('Ataque Furtivo ativado!', {
      description: `${diceBonus} dano extra${doubledDice}. Custo: 1 PE.`
    });

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
      description: `Dados do Ataque Furtivo dobrados. Alvo inconsciente/morrendo (Fort DT ${getAssassinarDT(agility)}).`
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
      description: 'Ignora penalidade de -20 no teste de Furtividade.'
    });
  };

  return (
    <MobileCollapsibleSection
      title="Trilha do Infiltrador"
      icon={<Eye className="h-4 w-4 text-purple-400" />}
      badge={`NEX ${nex}%`}
      defaultOpen={true}
    >
      <div className="space-y-2">
        {/* NEX 10% - Ataque Furtivo */}
        {hasAtaqueFurtivo && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Crosshair className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-xs block">Ataque Furtivo</span>
                <p className="text-[10px] text-muted-foreground">
                  {getAtaqueFurtivoDice(nex)} • 1 PE • 1x/rodada
                  {assassinarActive && <span className="text-red-400 ml-1">(2x!)</span>}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={ataqueFurtivoUsedThisRound ? "outline" : "default"}
              disabled={peCurrent < 1 || ataqueFurtivoUsedThisRound}
              onClick={handleAtaqueFurtivo}
              className="h-7 px-2 text-xs"
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
                <span className="font-medium text-xs">Gatuno</span>
                <Badge variant="secondary" className="text-[8px] px-1 h-4">Passivo</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                +5 Atletismo/Crime. Esconder sem penalidade.
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
                <span className="font-medium text-xs block">Assassinar</span>
                <p className="text-[10px] text-muted-foreground">
                  3 PE • Fort DT {getAssassinarDT(agility)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={assassinarActive ? "secondary" : "default"}
              disabled={peCurrent < 3 || assassinarActive}
              onClick={handleAssassinar}
              className="h-7 px-2 text-xs"
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
                <span className="font-medium text-xs block">Sombra Fugaz</span>
                <p className="text-[10px] text-muted-foreground">
                  3 PE • Ignora -20 Furtividade
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="default"
              disabled={peCurrent < 3}
              onClick={handleSombraFugaz}
              className="h-7 px-2 text-xs"
            >
              <Ghost className="h-3 w-3 mr-1" />
              Usar
            </Button>
          </div>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}
