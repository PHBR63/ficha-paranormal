/**
 * MobileNegociadorPanel - Versão mobile do painel Negociador
 * 
 * Habilidades:
 * - NEX 10%: Eloquência - Fascina alvos (1 PE, concentração)
 * - NEX 40%: Discurso Motivador - +2 em perícias (4/8 PE)
 * - NEX 65%: Eu Conheço um Cara - Rede de contatos (1x/missão)
 * - NEX 99%: Truque de Mestre - Copia habilidade (5 PE)
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileButtonGroup } from '@/components/ui/mobile-button-group';
import { 
  MessageCircle, 
  Users, 
  Handshake, 
  Sparkles, 
  Mic2
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileCollapsibleSection } from './MobileCollapsibleSection';

type EffectDuration = 'instant' | 'next-turn' | 'round' | 'scene' | 'concentration';

interface MobileNegociadorPanelProps {
  classTrack?: string | null;
  nex: number;
  peCurrent: number;
  onPEChange: (delta: number) => void;
  eloquenciaActive?: boolean;
  onEloquenciaToggle?: (active: boolean) => void;
  conhecoCaraUsedThisMission?: boolean;
  onConhecoCaraUsed?: () => void;
  onActivateEffect?: (id: string, name: string, duration?: EffectDuration, metadata?: Record<string, unknown>) => void;
  isEffectActive?: (id: string) => boolean;
  /** Dados consolidados do SUE (opcional - se fornecido, usa dados do SUE) */
  computedEffects?: import('@/lib/unified-effects-engine').ComputedEffects;
}

// IDs de efeitos do Negociador
const NEGOCIADOR_EFFECT_IDS = {
  ELOQUENCIA: 'track-eloquencia',
  DISCURSO_MOTIVADOR: 'track-discurso-motivador',
  EU_CONHECO_UM_CARA: 'track-eu-conheco-um-cara',
  TRUQUE_MESTRE: 'track-truque-mestre',
} as const;

export function MobileNegociadorPanel({
  classTrack,
  nex,
  peCurrent,
  onPEChange,
  eloquenciaActive = false,
  onEloquenciaToggle,
  conhecoCaraUsedThisMission = false,
  onConhecoCaraUsed,
  onActivateEffect,
  isEffectActive,
}: MobileNegociadorPanelProps) {
  const [isConcentrating, setIsConcentrating] = useState(eloquenciaActive);
  
  const isNegociador = classTrack === 'Negociador' || classTrack === 'negociador';
  
  const hasEloquencia = nex >= 10;
  const hasDiscursoMotivador = nex >= 40;
  const hasConhecoCara = nex >= 65;
  const hasTruqueMestre = nex >= 99;
  const canUseEnhancedDiscurso = nex >= 65;

  const handleEloquencia = useCallback(() => {
    if (isConcentrating) {
      setIsConcentrating(false);
      onEloquenciaToggle?.(false);
      toast.info('Eloquência encerrada');
      return;
    }
    
    if (peCurrent < 1) {
      toast.error('PE insuficiente');
      return;
    }

    onPEChange(-1);
    setIsConcentrating(true);
    onEloquenciaToggle?.(true);
    
    // Registra no SUE
    onActivateEffect?.(NEGOCIADOR_EFFECT_IDS.ELOQUENCIA, 'Eloquência', 'concentration');
    
    toast.success('Eloquência ativada!');
  }, [peCurrent, isConcentrating, onPEChange, onEloquenciaToggle, onActivateEffect]);

  const handleDiscursoMotivador = useCallback((enhanced: boolean) => {
    const cost = enhanced ? 8 : 4;
    if (peCurrent < cost) {
      toast.error('PE insuficiente');
      return;
    }
    onPEChange(-cost);
    
    // Registra no SUE
    onActivateEffect?.(NEGOCIADOR_EFFECT_IDS.DISCURSO_MOTIVADOR, 'Discurso Motivador', 'scene', { enhanced, bonus: 2 });
    
    toast.success(`Discurso Motivador: +2 perícias (${cost} PE)`);
  }, [peCurrent, onPEChange, onActivateEffect]);

  const handleConhecoCara = useCallback(() => {
    if (conhecoCaraUsedThisMission) {
      toast.warning('Já usado nesta missão');
      return;
    }
    onConhecoCaraUsed?.();
    
    // Registra no SUE
    onActivateEffect?.(NEGOCIADOR_EFFECT_IDS.EU_CONHECO_UM_CARA, 'Eu Conheço um Cara', 'scene');
    
    toast.success('Eu Conheço um Cara ativado!');
  }, [conhecoCaraUsedThisMission, onConhecoCaraUsed, onActivateEffect]);

  const handleTruqueMestre = useCallback(() => {
    if (peCurrent < 5) {
      toast.error('PE insuficiente');
      return;
    }
    onPEChange(-5);
    
    // Registra no SUE
    onActivateEffect?.(NEGOCIADOR_EFFECT_IDS.TRUQUE_MESTRE, 'Truque de Mestre', 'scene');
    
    toast.success('Truque de Mestre: copie uma habilidade!');
  }, [peCurrent, onPEChange, onActivateEffect]);

  if (!isNegociador) return null;

  return (
    <MobileCollapsibleSection
      title="Negociador"
      icon={<MessageCircle className="h-4 w-4 text-pink-400" />}
      badge={`NEX ${nex}%`}
    >
      <div className="space-y-3">
        {/* Eloquência */}
        {hasEloquencia && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-pink-900/30 border border-pink-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Mic2 className="h-4 w-4 text-pink-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">Eloquência</span>
                  {isConcentrating && (
                    <Badge variant="default" className="text-[10px] bg-pink-600 px-1">
                      Ativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fascina alvos • 1 PE
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isConcentrating ? "secondary" : peCurrent >= 1 ? "default" : "outline"}
              disabled={!isConcentrating && peCurrent < 1}
              onClick={handleEloquencia}
              className="shrink-0"
            >
              {isConcentrating ? 'Parar' : 'Usar'}
            </Button>
          </div>
        )}

        {/* Discurso Motivador */}
        {hasDiscursoMotivador && (
          <div className="p-2 rounded-lg bg-blue-900/30 border border-blue-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-sm">Discurso Motivador</span>
            </div>
            <p className="text-xs text-muted-foreground">
              +2 perícias para você e aliados
            </p>
            <MobileButtonGroup
              buttons={[
                {
                  id: 'discurso-4pe',
                  label: '4 PE',
                  onClick: () => handleDiscursoMotivador(false),
                  variant: peCurrent >= 4 ? 'default' : 'outline',
                  type: 'secondary',
                  disabled: peCurrent < 4,
                },
                ...(canUseEnhancedDiscurso ? [{
                  id: 'discurso-8pe',
                  label: '8 PE',
                  onClick: () => handleDiscursoMotivador(true),
                  variant: (peCurrent >= 8 ? 'default' : 'outline') as 'default' | 'outline',
                  type: 'secondary' as const,
                  disabled: peCurrent < 8,
                }] : []),
              ]}
              layout="row"
              gap="sm"
            />
          </div>
        )}

        {/* Eu Conheço um Cara */}
        {hasConhecoCara && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-green-900/30 border border-green-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Handshake className="h-4 w-4 text-green-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-sm">Eu Conheço um Cara</span>
                <p className="text-xs text-muted-foreground">
                  Rede de contatos • 1x/missão
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={conhecoCaraUsedThisMission ? "outline" : "default"}
              disabled={conhecoCaraUsedThisMission}
              onClick={handleConhecoCara}
              className="shrink-0"
            >
              {conhecoCaraUsedThisMission ? 'Usado' : 'Usar'}
            </Button>
          </div>
        )}

        {/* Truque de Mestre */}
        {hasTruqueMestre && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-yellow-900/30 border border-yellow-500/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-sm">Truque de Mestre</span>
                <p className="text-xs text-muted-foreground">
                  Copia habilidade • 5 PE
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={peCurrent >= 5 ? "default" : "outline"}
              disabled={peCurrent < 5}
              onClick={handleTruqueMestre}
              className="shrink-0"
            >
              Usar
            </Button>
          </div>
        )}
      </div>
    </MobileCollapsibleSection>
  );
}