/**
 * Sistema de Trilhas - Ordem Paranormal RPG
 * 
 * Barrel exports para todos os componentes de trilhas organizados por classe.
 * 
 * Estrutura:
 * - combatente/: Trilhas do Combatente (5 trilhas)
 * - especialista/: Trilhas do Especialista (5 trilhas)
 * - ocultista/: Trilhas do Ocultista (5 trilhas)
 * - shared/: Componentes compartilhados
 * 
 * @module tracks
 */

// Trilhas por classe
export * from './combatente';
export * from './especialista';
export * from './ocultista';

// Componentes compartilhados
export * from './shared';

// =====================================================
// FACTORY - Renderiza painel baseado no trackId
// =====================================================

import { COMBATENTE_TRACK_IDS, ESPECIALISTA_TRACK_IDS, OCULTISTA_TRACK_IDS } from '@/lib/constants';

/**
 * Mapeamento de trackId para nome do componente
 * Útil para renderização dinâmica baseada no trackId
 */
export const TRACK_COMPONENT_MAP = {
  // Combatente
  [COMBATENTE_TRACK_IDS.ANIQUILADOR]: 'AniquiladorPanel',
  [COMBATENTE_TRACK_IDS.COMANDANTE_CAMPO]: 'LeadershipAbilitiesPanel',
  [COMBATENTE_TRACK_IDS.GUERREIRO]: 'GuerreiroAbilitiesPanel',
  [COMBATENTE_TRACK_IDS.OPERACOES_ESPECIAIS]: 'OperacoesEspeciaisPanel',
  [COMBATENTE_TRACK_IDS.TROPA_CHOQUE]: 'TropaDeChoquePanel',
  
  // Especialista
  [ESPECIALISTA_TRACK_IDS.ATIRADOR_ELITE]: 'AtiradorDeElitePanel',
  [ESPECIALISTA_TRACK_IDS.INFILTRADOR]: 'InfiltradorPanel',
  [ESPECIALISTA_TRACK_IDS.MEDICO_CAMPO]: 'MedicoDeCampoPanel',
  [ESPECIALISTA_TRACK_IDS.NEGOCIADOR]: 'NegociadorPanel',
  [ESPECIALISTA_TRACK_IDS.TECNICO]: 'TecnicoPanel',
  
  // Ocultista
  [OCULTISTA_TRACK_IDS.CONDUTOR]: 'ConduitePanel',
  [OCULTISTA_TRACK_IDS.FLAGELADOR]: 'FlageladorPanel',
  [OCULTISTA_TRACK_IDS.GRADUADO]: 'GraduadoPanel',
  [OCULTISTA_TRACK_IDS.INTUITIVO]: 'IntuitivoPanel',
  [OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL]: 'LaminaParanormalPanel',
} as const;

/**
 * Mapeamento de trackId para nome do componente mobile
 */
export const MOBILE_TRACK_COMPONENT_MAP = {
  // Combatente
  [COMBATENTE_TRACK_IDS.ANIQUILADOR]: 'MobileAniquiladorPanel',
  [COMBATENTE_TRACK_IDS.COMANDANTE_CAMPO]: 'MobileLeadershipPanel',
  [COMBATENTE_TRACK_IDS.GUERREIRO]: 'MobileGuerreiroPanel',
  [COMBATENTE_TRACK_IDS.OPERACOES_ESPECIAIS]: 'MobileOperacoesEspeciaisPanel',
  [COMBATENTE_TRACK_IDS.TROPA_CHOQUE]: 'MobileTropaDeChoquePanel',
  
  // Especialista
  [ESPECIALISTA_TRACK_IDS.ATIRADOR_ELITE]: 'MobileAtiradorDeElitePanel',
  [ESPECIALISTA_TRACK_IDS.INFILTRADOR]: 'MobileInfiltradorPanel',
  [ESPECIALISTA_TRACK_IDS.MEDICO_CAMPO]: 'MobileMedicoDeCampoPanel',
  [ESPECIALISTA_TRACK_IDS.NEGOCIADOR]: 'MobileNegociadorPanel',
  [ESPECIALISTA_TRACK_IDS.TECNICO]: 'MobileTecnicoPanel',
  
  // Ocultista
  [OCULTISTA_TRACK_IDS.CONDUTOR]: 'MobileConduitePanel',
  [OCULTISTA_TRACK_IDS.FLAGELADOR]: 'MobileFlageladorPanel',
  [OCULTISTA_TRACK_IDS.GRADUADO]: 'MobileGraduadoPanel',
  [OCULTISTA_TRACK_IDS.INTUITIVO]: 'MobileIntuitivoPanel',
  [OCULTISTA_TRACK_IDS.LAMINA_PARANORMAL]: 'MobileLaminaParanormalPanel',
} as const;

/**
 * Verifica se uma trilha tem componente implementado
 */
export function hasTrackComponent(trackId: string): boolean {
  return trackId in TRACK_COMPONENT_MAP;
}

/**
 * Verifica se uma trilha tem componente mobile implementado
 */
export function hasMobileTrackComponent(trackId: string): boolean {
  return trackId in MOBILE_TRACK_COMPONENT_MAP;
}
