/**
 * Hook de Renderização de Painel de Trilha
 * 
 * Mapeia IDs de trilha para seus respectivos componentes de painel,
 * tanto desktop quanto mobile.
 * 
 * @module hooks/character/useTrackPanel
 */

import { useMemo, ComponentType } from 'react';
import { 
  COMBATENTE_TRACK_IDS, 
  ESPECIALISTA_TRACK_IDS, 
  OCULTISTA_TRACK_IDS,
} from '@/lib/constants/game-ids';

// Tipos de props comuns dos painéis de trilha
export interface TrackPanelProps {
  characterId: string;
  nex: number;
  classId: string;
  trackId: string;
  onPEChange?: (delta: number) => void;
  onConditionApply?: (conditionId: string) => void;
}

/** Resultado do hook */
export interface TrackPanelInfo {
  /** ID da trilha */
  trackId: string;
  /** Nome da trilha */
  trackName: string;
  /** Classe da trilha (combatente, especialista, ocultista) */
  classType: 'combatente' | 'especialista' | 'ocultista';
  /** Componente desktop (lazy) */
  DesktopComponent: ComponentType<TrackPanelProps> | null;
  /** Componente mobile (lazy) */
  MobileComponent: ComponentType<TrackPanelProps> | null;
  /** Cor temática da trilha */
  themeColor: string;
  /** Ícone da trilha */
  iconName: string;
}

/**
 * Mapeamento de ID de trilha para metadados
 */
const TRACK_METADATA: Record<string, Omit<TrackPanelInfo, 'DesktopComponent' | 'MobileComponent'>> = {
  // Combatente
  [COMBATENTE_TRACK_IDS.COMANDANTE_CAMPO]: {
    trackId: COMBATENTE_TRACK_IDS.COMANDANTE_CAMPO,
    trackName: 'Comandante de Campo',
    classType: 'combatente',
    themeColor: 'hsl(var(--strength))',
    iconName: 'Shield',
  },
  [COMBATENTE_TRACK_IDS.GUERREIRO]: {
    trackId: COMBATENTE_TRACK_IDS.GUERREIRO,
    trackName: 'Guerreiro',
    classType: 'combatente',
    themeColor: 'hsl(var(--strength))',
    iconName: 'Sword',
  },
  [COMBATENTE_TRACK_IDS.OPERACOES_ESPECIAIS]: {
    trackId: COMBATENTE_TRACK_IDS.OPERACOES_ESPECIAIS,
    trackName: 'Operações Especiais',
    classType: 'combatente',
    themeColor: 'hsl(var(--strength))',
    iconName: 'Target',
  },
  [COMBATENTE_TRACK_IDS.TROPA_CHOQUE]: {
    trackId: COMBATENTE_TRACK_IDS.TROPA_CHOQUE,
    trackName: 'Tropa de Choque',
    classType: 'combatente',
    themeColor: 'hsl(var(--strength))',
    iconName: 'ShieldAlert',
  },
  [COMBATENTE_TRACK_IDS.ANIQUILADOR]: {
    trackId: COMBATENTE_TRACK_IDS.ANIQUILADOR,
    trackName: 'Aniquilador',
    classType: 'combatente',
    themeColor: 'hsl(var(--strength))',
    iconName: 'Skull',
  },
  
  // Especialista
  [ESPECIALISTA_TRACK_IDS.ATIRADOR_ELITE]: {
    trackId: ESPECIALISTA_TRACK_IDS.ATIRADOR_ELITE,
    trackName: 'Atirador de Elite',
    classType: 'especialista',
    themeColor: 'hsl(var(--agility))',
    iconName: 'Crosshair',
  },
  [ESPECIALISTA_TRACK_IDS.INFILTRADOR]: {
    trackId: ESPECIALISTA_TRACK_IDS.INFILTRADOR,
    trackName: 'Infiltrador',
    classType: 'especialista',
    themeColor: 'hsl(var(--agility))',
    iconName: 'Eye',
  },
  [ESPECIALISTA_TRACK_IDS.MEDICO_CAMPO]: {
    trackId: ESPECIALISTA_TRACK_IDS.MEDICO_CAMPO,
    trackName: 'Médico de Campo',
    classType: 'especialista',
    themeColor: 'hsl(var(--agility))',
    iconName: 'Heart',
  },
  [ESPECIALISTA_TRACK_IDS.NEGOCIADOR]: {
    trackId: ESPECIALISTA_TRACK_IDS.NEGOCIADOR,
    trackName: 'Negociador',
    classType: 'especialista',
    themeColor: 'hsl(var(--agility))',
    iconName: 'MessageCircle',
  },
  [ESPECIALISTA_TRACK_IDS.TECNICO]: {
    trackId: ESPECIALISTA_TRACK_IDS.TECNICO,
    trackName: 'Técnico',
    classType: 'especialista',
    themeColor: 'hsl(var(--agility))',
    iconName: 'Wrench',
  },
  
  // Ocultista
  [OCULTISTA_TRACK_IDS.CONDUTOR]: {
    trackId: OCULTISTA_TRACK_IDS.CONDUTOR,
    trackName: 'Conduíte',
    classType: 'ocultista',
    themeColor: 'hsl(var(--paranormal))',
    iconName: 'Zap',
  },
  [OCULTISTA_TRACK_IDS.FLAGELADOR]: {
    trackId: OCULTISTA_TRACK_IDS.FLAGELADOR,
    trackName: 'Flagelador',
    classType: 'ocultista',
    themeColor: 'hsl(var(--paranormal))',
    iconName: 'Flame',
  },
  [OCULTISTA_TRACK_IDS.GRADUADO]: {
    trackId: OCULTISTA_TRACK_IDS.GRADUADO,
    trackName: 'Graduado',
    classType: 'ocultista',
    themeColor: 'hsl(var(--paranormal))',
    iconName: 'GraduationCap',
  },
  [OCULTISTA_TRACK_IDS.INTUITIVO]: {
    trackId: OCULTISTA_TRACK_IDS.INTUITIVO,
    trackName: 'Intuitivo',
    classType: 'ocultista',
    themeColor: 'hsl(var(--paranormal))',
    iconName: 'Brain',
  },
  [OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL]: {
    trackId: OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL,
    trackName: 'Lâmina Paranormal',
    classType: 'ocultista',
    themeColor: 'hsl(var(--paranormal))',
    iconName: 'Swords',
  },
};

/**
 * Hook para obter informações e componentes de uma trilha
 * 
 * @example
 * ```tsx
 * const { trackInfo, renderDesktop, renderMobile } = useTrackPanel('guerreiro');
 * 
 * // No desktop
 * {renderDesktop && renderDesktop({ characterId, nex, ... })}
 * 
 * // No mobile
 * {renderMobile && renderMobile({ characterId, nex, ... })}
 * ```
 */
export function useTrackPanel(trackId: string | null | undefined) {
  const trackInfo = useMemo((): TrackPanelInfo | null => {
    if (!trackId) return null;
    
    const metadata = TRACK_METADATA[trackId];
    if (!metadata) {
      console.warn(`[useTrackPanel] Trilha não encontrada: ${trackId}`);
      return null;
    }
    
    return {
      ...metadata,
      DesktopComponent: null, // Componentes são importados no componente pai
      MobileComponent: null,
    };
  }, [trackId]);

  /**
   * Verifica se a trilha existe
   */
  const hasTrack = useMemo(() => {
    return trackId != null && TRACK_METADATA[trackId] != null;
  }, [trackId]);

  /**
   * Retorna a cor temática da trilha para estilização
   */
  const getTrackColor = useMemo(() => {
    if (!trackInfo) return 'hsl(var(--muted))';
    return trackInfo.themeColor;
  }, [trackInfo]);

  /**
   * Retorna o tipo de classe da trilha
   */
  const classType = useMemo(() => {
    return trackInfo?.classType || null;
  }, [trackInfo]);

  return {
    trackInfo,
    hasTrack,
    getTrackColor,
    classType,
    trackId,
  };
}

/**
 * Hook auxiliar para obter todas as trilhas de uma classe
 */
export function useClassTracks(classId: string) {
  return useMemo(() => {
    const classMap: Record<string, string[]> = {
      combatente: [
        COMBATENTE_TRACK_IDS.COMANDANTE_CAMPO,
        COMBATENTE_TRACK_IDS.GUERREIRO,
        COMBATENTE_TRACK_IDS.OPERACOES_ESPECIAIS,
        COMBATENTE_TRACK_IDS.TROPA_CHOQUE,
        COMBATENTE_TRACK_IDS.ANIQUILADOR,
      ],
      especialista: [
        ESPECIALISTA_TRACK_IDS.ATIRADOR_ELITE,
        ESPECIALISTA_TRACK_IDS.INFILTRADOR,
        ESPECIALISTA_TRACK_IDS.MEDICO_CAMPO,
        ESPECIALISTA_TRACK_IDS.NEGOCIADOR,
        ESPECIALISTA_TRACK_IDS.TECNICO,
      ],
      ocultista: [
        OCULTISTA_TRACK_IDS.CONDUTOR,
        OCULTISTA_TRACK_IDS.FLAGELADOR,
        OCULTISTA_TRACK_IDS.GRADUADO,
        OCULTISTA_TRACK_IDS.INTUITIVO,
        OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL,
      ],
    };
    
    const normalizedClass = classId.toLowerCase();
    return classMap[normalizedClass] || [];
  }, [classId]);
}
