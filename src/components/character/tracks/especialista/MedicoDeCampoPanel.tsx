/**
 * MedicoDeCampoPanel - Painel unificado responsivo da trilha Médico de Campo
 * 
 * Componente responsivo que adapta a UI para desktop e mobile usando useIsMobile().
 * Usa o hook useMedicoDeCampoTrack para lógica compartilhada.
 * 
 * @module tracks/especialista/MedicoDeCampoPanel
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  ShieldPlus, 
  Info,
  CheckCircle2
} from '@/components/icons/ordem-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMedicalStandardAction } from '@/hooks/character/useMedicalStandardAction';
import { MobileCollapsibleSection } from '../../mobile/MobileCollapsibleSection';
import { 
  useMedicoDeCampoTrack,
  type UseMedicoDeCampoTrackProps 
} from './useMedicoDeCampoTrack';
import { ParamedicoAction } from './ParamedicoAction';
import { EquipeTraumaAction } from './EquipeTraumaAction';
import { ResgateAction } from './ResgateAction';
import { ReanimacaoAction } from './ReanimacaoAction';
import type { CampaignAlly } from './EquipeTraumaModal';
import type { ActiveCondition } from '@/hooks/character/useConditions';

// =====================================================
// Props do Componente
// =====================================================

export interface MedicoDeCampoPanelProps extends UseMedicoDeCampoTrackProps {
  /** Trilha de Versatilidade do personagem (NEX 50%) */
  versatilityTrack?: { trackId: string; abilityId: string } | null;
  /** ID do personagem */
  characterId?: string;
  /** Nome do personagem */
  characterName?: string;
  /** Recarrega os saldos confirmados após uma cura. */
  onRefetch?: () => unknown | Promise<unknown>;
  /** Condições ativas do personagem */
  characterConditions?: ActiveCondition[];
  /** Aliados de campanha (modo campanha) */
  campaignAllies?: CampaignAlly[];
  /** Callback para remover condição */
  onRemoveCondition?: (conditionId: string) => Promise<boolean>;
}

// =====================================================
// Componente Principal
// =====================================================

import React from 'react';

function MedicoDeCampoPanelComponent(props: MedicoDeCampoPanelProps) {
  const isMobile = useIsMobile();
  const track = useMedicoDeCampoTrack(props);
  const medicalAction = useMedicalStandardAction(props.characterId ?? '');

  // Não renderiza se não for Médico de Campo
  if (!track.isMedicoCampo) return null;

  // ===== COMPONENTE DE CONTEÚDO =====
  
  const TrackContent = () => (
    <div className="space-y-3">
      {(track.hasParamedico || track.hasEquipeTrauma) && medicalAction.data && (
        <p role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-2 text-xs text-emerald-100">
          {medicalAction.data.tracked
            ? `Ações padrão médicas neste turno: ${medicalAction.data.spent} usadas de ${1 + medicalAction.data.extra} disponíveis.`
            : 'Sem controle de turnos ativo: a mesa confirma a ação padrão; nenhuma rodada é criada automaticamente.'}
          {' '}Ataques, rituais e outros poderes ainda exigem conferência da mesa.
        </p>
      )}
      {/* Indicador de bônus de suporte do SUE (desktop only) */}
      {!isMobile && track.hasResgate && track.sueSupport && (
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <p className="text-xs font-medium text-emerald-300">Bônus de Suporte (SUE)</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
              +{track.targetDefenseBonus} Defesa após curar ou remover condição do aliado
            </Badge>
          </div>
        </div>
      )}
      
      {/* O servidor confirma requisitos, custo, alvo, cura e histórico. */}
      {track.hasParamedico && (props.characterId ? <ParamedicoAction
        characterId={props.characterId} characterName={props.characterName ?? 'Você'}
        currentHp={track.pvCurrent} maxHp={track.pvMax} nex={props.nex}
        peCurrent={props.peCurrent} onRefetch={props.onRefetch}
      /> : <p role="alert" className="text-sm text-destructive">Ficha indisponível para confirmar Paramédico.</p>)}

      {/* NEX 40% - Equipe de Trauma */}
      {track.hasEquipeTrauma && (props.characterId ? <EquipeTraumaAction
        characterId={props.characterId} nex={props.nex} peCurrent={props.peCurrent}
        onRefetch={props.onRefetch}
      /> : <p role="alert" className="text-sm text-destructive">Ficha indisponível para confirmar Equipe de Trauma.</p>)}

      {/* NEX 65% - Resgate (Passivo) */}
      {track.hasResgate && (
        <div className={`p-2 rounded-lg bg-emerald-900/20 border border-emerald-500/10 ${isMobile ? '' : 'space-y-2'}`}>
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-4 w-4 text-emerald-300" />
            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>Resgate</span>
            <Badge variant="secondary" className="text-[10px]">Passivo</Badge>
            {!isMobile && <Badge variant="outline" className="text-[10px]">NEX 65%</Badge>}
          </div>
          <p className={`${isMobile ? 'text-xs mt-1' : 'text-xs'} text-muted-foreground`}>
            {isMobile 
              ? 'Ação livre para aliado machucado ou morrendo. +5 Defesa ao cuidar do aliado.'
              : '1x/rodada: ação livre para se aproximar de aliado machucado/morrendo. Ao curar PV ou remover condição do aliado: +5 Defesa para ambos até seu próximo turno.'
            }
          </p>
          {!isMobile && (
            <div className="flex items-center gap-2 mt-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-300">
                +{track.targetDefenseBonus} Defesa após cuidar do aliado (ambos)
              </span>
            </div>
          )}
          {props.characterId && <ResgateAction characterId={props.characterId} nex={props.nex}
            onRefetch={props.onRefetch} />}
        </div>
      )}

      {/* NEX 99% - Reanimação */}
      {track.hasReanimacao && (props.characterId ? <ReanimacaoAction
        characterId={props.characterId} nex={props.nex} peCurrent={props.peCurrent}
        onRefetch={props.onRefetch}
      /> : <p role="alert" className="text-sm text-destructive">Ficha indisponível para confirmar Reanimação.</p>)}
    </div>
  );

  // ===== RENDERIZAÇÃO MOBILE =====
  
  if (isMobile) {
    return (
      <>
        <MobileCollapsibleSection
          title="Médico de Campo"
          icon={<Stethoscope className="h-4 w-4 text-emerald-400" />}
          badge={`NEX ${props.nex}%`}
        >
          {TrackContent()}
        </MobileCollapsibleSection>

      </>
    );
  }

  // ===== RENDERIZAÇÃO DESKTOP =====
  
  return (
    <>
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-emerald-400" />
            Médico de Campo
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>Requisito:</strong> Treinado em Medicina e possuir kit de medicina.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {track.hasSueData && (
              <Badge variant="secondary" className="text-[10px] ml-auto">
                SUE
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {TrackContent()}
        </CardContent>
      </Card>

    </>
  );
}

/** A comparação superficial considera o PE e os alvos atuais antes de oferecer uma habilidade. */
export const MedicoDeCampoPanel = React.memo(MedicoDeCampoPanelComponent);
