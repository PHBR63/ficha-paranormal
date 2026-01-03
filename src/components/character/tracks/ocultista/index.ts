/**
 * Trilhas do Ocultista - Ordem Paranormal RPG
 * 
 * Painéis unificados responsivos para as 5 trilhas do Ocultista:
 * - Conduíte
 * - Flagelador
 * - Graduado
 * - Intuitivo
 * - Lâmina Paranormal
 * 
 * @module tracks/ocultista
 */

// Hooks de lógica
export { useConduiteTrack, CONDUITE_EFFECT_IDS, CONDUITE_ABILITIES, CONDUITE_PASSIVES } from './useConduiteTrack';
export { useFlageladorTrack, FLAGELADOR_EFFECT_IDS, FLAGELADOR_ABILITIES, FLAGELADOR_PASSIVES } from './useFlageladorTrack';
export { useGraduadoTrack, GRADUADO_ABILITIES } from './useGraduadoTrack';
export { useIntuitivoTrack, INTUITIVO_ABILITIES } from './useIntuitivoTrack';
export { useLaminaParanormalTrack, LAMINA_EFFECT_IDS, LAMINA_ABILITIES, LAMINA_PASSIVES } from './useLaminaParanormalTrack';

// Tipos
export type { ConduiteAbility, ConduitePassive, UseConduiteTrackProps } from './useConduiteTrack';
export type { FlageladorAbility, FlageladorPassive, UseFlageladorTrackProps } from './useFlageladorTrack';
export type { GraduadoAbility, UseGraduadoTrackProps } from './useGraduadoTrack';
export type { IntuitivoAbility, UseIntuitivoTrackProps } from './useIntuitivoTrack';
export type { LaminaAbility, LaminaPassive, UseLaminaParanormalTrackProps } from './useLaminaParanormalTrack';

// Painéis unificados responsivos
export { ConduitePanel } from './ConduitePanel';
export { FlageladorPanel } from './FlageladorPanel';
export { GraduadoPanel } from './GraduadoPanel';
export { IntuitivoPanel } from './IntuitivoPanel';
export { LaminaParanormalPanel } from './LaminaParanormalPanel';

// Re-exports legados para compatibilidade (apontam para os novos componentes unificados)
export { ConduitePanel as MobileConduitePanel } from './ConduitePanel';
export { FlageladorPanel as MobileFlageladorPanel } from './FlageladorPanel';
export { GraduadoPanel as MobileGraduadoPanel } from './GraduadoPanel';
export { IntuitivoPanel as MobileIntuitivoPanel } from './IntuitivoPanel';
export { LaminaParanormalPanel as MobileLaminaParanormalPanel } from './LaminaParanormalPanel';
