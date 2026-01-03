/**
 * Trilhas do Combatente - Ordem Paranormal RPG
 * 
 * Componentes responsivos unificados para as 5 trilhas do Combatente:
 * - Aniquilador (UNIFICADO ✓)
 * - Guerreiro (UNIFICADO ✓)
 * - Comandante de Campo (UNIFICADO ✓)
 * - Operações Especiais (UNIFICADO ✓)
 * - Tropa de Choque (UNIFICADO ✓)
 * 
 * @module tracks/combatente
 */

// ==================== ANIQUILADOR (UNIFICADO) ====================
export { AniquiladorPanel, type AniquiladorPanelProps } from './AniquiladorPanel';
export { 
  useAniquiladorTrack,
  type UseAniquiladorTrackProps,
  type TechniqueEffect,
  type PassiveAbility as AniquiladorPassiveAbility,
  TECHNIQUE_EFFECTS,
  PASSIVE_ABILITIES as ANIQUILADOR_PASSIVES,
  ANIQUILADOR_EFFECT_IDS,
} from './useAniquiladorTrack';

// ==================== GUERREIRO (UNIFICADO) ====================
export { GuerreiroPanel, type GuerreiroPanelProps } from './GuerreiroPanel';
export {
  useGuerreiroTrack,
  type UseGuerreiroTrackProps,
  type GuerreiroAbility,
  type ManeuverType,
  GUERREIRO_ABILITIES,
  PASSIVE_ABILITIES as GUERREIRO_PASSIVES,
  GUERREIRO_EFFECT_IDS,
} from './useGuerreiroTrack';

// ==================== COMANDANTE DE CAMPO (UNIFICADO) ====================
export { ComandanteCampoPanel, type ComandanteCampoPanelProps } from './ComandanteCampoPanel';
export {
  useComandanteCampoTrack,
  type UseComandanteCampoTrackProps,
  type LeadershipAbility,
  COMANDANTE_ABILITIES,
  COMANDANTE_EFFECT_IDS,
} from './useComandanteCampoTrack';

// ==================== OPERAÇÕES ESPECIAIS (UNIFICADO) ====================
export { OperacoesEspeciaisPanel, type OperacoesEspeciaisPanelProps } from './OperacoesEspeciaisPanel';
export {
  useOperacoesEspeciaisTrack,
  type UseOperacoesEspeciaisTrackProps,
  type OperacoesAbility,
  type SurtoChoice,
  OPERACOES_ABILITIES,
  PASSIVE_ABILITIES as OPERACOES_PASSIVES,
  OPERACOES_EFFECT_IDS,
} from './useOperacoesEspeciaisTrack';

// ==================== TROPA DE CHOQUE (UNIFICADO) ====================
export { TropaDeChoquePanel, type TropaDeChoquePanelProps } from './TropaDeChoquePanel';
export {
  useTropaDeChoqueTrack,
  type UseTropaDeChoqueTrackProps,
  type TropaAbility,
  type PassiveAbility as TropaPassiveAbility,
  TROPA_ABILITIES,
  PASSIVE_ABILITIES as TROPA_PASSIVES,
  TROPA_EFFECT_IDS,
} from './useTropaDeChoqueTrack';

// ==================== ALIASES PARA RETROCOMPATIBILIDADE ====================
// Os novos componentes unificados substituem ambas as versões desktop e mobile
// Re-exports legados mantidos para compatibilidade com imports existentes

// Legados desktop (agora aliases para unificados)
export { GuerreiroPanel as GuerreiroAbilitiesPanel } from './GuerreiroPanel';
export { ComandanteCampoPanel as LeadershipAbilitiesPanel } from './ComandanteCampoPanel';
export { OperacoesEspeciaisPanel as OperacoesEspeciaisLegacyPanel } from './OperacoesEspeciaisPanel';
export { TropaDeChoquePanel as TropaDeChoqueLegacyPanel } from './TropaDeChoquePanel';

// Legados mobile (agora aliases para unificados)
export { GuerreiroPanel as MobileGuerreiroPanel } from './GuerreiroPanel';
export { ComandanteCampoPanel as MobileLeadershipPanel } from './ComandanteCampoPanel';
export { OperacoesEspeciaisPanel as MobileOperacoesEspeciaisPanel } from './OperacoesEspeciaisPanel';
export { TropaDeChoquePanel as MobileTropaDeChoquePanel } from './TropaDeChoquePanel';
export { AniquiladorPanel as MobileAniquiladorPanel } from './AniquiladorPanel';
