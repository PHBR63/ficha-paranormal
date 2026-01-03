/**
 * Trilhas do Combatente - Ordem Paranormal RPG
 * 
 * Componentes responsivos unificados para as 5 trilhas do Combatente:
 * - Aniquilador (UNIFICADO ✓)
 * - Comandante de Campo (Leadership) - pendente migração
 * - Guerreiro - pendente migração
 * - Operações Especiais - pendente migração
 * - Tropa de Choque - pendente migração
 * 
 * @module tracks/combatente
 */

// ==================== ANIQUILADOR (UNIFICADO) ====================
export { AniquiladorPanel, type AniquiladorPanelProps } from './AniquiladorPanel';
export { 
  useAniquiladorTrack,
  type UseAniquiladorTrackProps,
  type TechniqueEffect,
  type PassiveAbility,
  TECHNIQUE_EFFECTS,
  PASSIVE_ABILITIES,
  ANIQUILADOR_EFFECT_IDS,
} from './useAniquiladorTrack';

// ==================== TRILHAS LEGADAS (pendentes migração) ====================
// Re-exporta componentes desktop legados
export { GuerreiroAbilitiesPanel } from '../../GuerreiroAbilitiesPanel';
export { LeadershipAbilitiesPanel } from '../../LeadershipAbilitiesPanel';
export { OperacoesEspeciaisPanel } from '../../OperacoesEspeciaisPanel';
export { TropaDeChoquePanel } from '../../TropaDeChoquePanel';

// Re-exporta componentes mobile legados
export { MobileGuerreiroPanel } from '../../mobile';
export { MobileLeadershipPanel } from '../../mobile';
export { MobileOperacoesEspeciaisPanel } from '../../mobile';
export { MobileTropaDeChoquePanel } from '../../mobile';

// ==================== ALIASES PARA RETROCOMPATIBILIDADE ====================
// O novo AniquiladorPanel unificado substitui ambas as versões
// MobileAniquiladorPanel ainda exportado para compatibilidade
export { MobileAniquiladorPanel } from '../../mobile';
