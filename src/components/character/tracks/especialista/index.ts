/**
 * Trilhas do Especialista - Ordem Paranormal RPG
 * 
 * Painéis unificados responsivos para as 5 trilhas do Especialista:
 * - Atirador de Elite
 * - Infiltrador
 * - Médico de Campo
 * - Negociador
 * - Técnico
 * 
 * @module tracks/especialista
 */

// Hooks de lógica
export { useAtiradorDeEliteTrack } from './useAtiradorDeEliteTrack';
export { useInfiltradorTrack } from './useInfiltradorTrack';
export { useMedicoDeCampoTrack } from './useMedicoDeCampoTrack';
export { useNegociadorTrack } from './useNegociadorTrack';
export { useTecnicoTrack } from './useTecnicoTrack';

// Painéis unificados responsivos
export { AtiradorDeElitePanel } from './AtiradorDeElitePanel';
export { InfiltradorPanel } from './InfiltradorPanel';
export { MedicoDeCampoPanel } from './MedicoDeCampoPanel';
export { NegociadorPanel } from './NegociadorPanel';
export { TecnicoPanel } from './TecnicoPanel';

// Re-exports legados para compatibilidade (apontam para os novos componentes unificados)
export { AtiradorDeElitePanel as MobileAtiradorDeElitePanel } from './AtiradorDeElitePanel';
export { InfiltradorPanel as MobileInfiltradorPanel } from './InfiltradorPanel';
export { MedicoDeCampoPanel as MobileMedicoDeCampoPanel } from './MedicoDeCampoPanel';
export { NegociadorPanel as MobileNegociadorPanel } from './NegociadorPanel';
export { TecnicoPanel as MobileTecnicoPanel } from './TecnicoPanel';
