/**
 * Hooks de Campanha
 * 
 * Hooks responsáveis pela sincronização de dados entre
 * personagens e campanhas.
 * 
 * @module hooks/campaign
 */

// Hooks movidos da raiz
export * from '../useCampaignRitualSync';
export * from '../useConditionalBonusesSync';

// Hooks nativos da pasta campaign
export * from './useCampaignAudio';
export * from './useCampaignEvents';
export * from './useCombatBoardSync';

// useHandouts exporta Handout como tipo base
export { useHandouts } from './useHandouts';
export type { Handout } from './useHandouts';

export * from './useKeyboardShortcuts';
export * from './useMacros';

// useMasterActions exporta seu próprio Handout como MasterHandout para evitar conflito
export { 
  useMasterActions, 
  type Condition,
  type UseMasterActionsProps,
  type MasterActionsReturn,
  type Handout as MasterHandout 
} from './useMasterActions';

export * from './useOpportunityAttacks';
export * from './useTacticalBoard';
export * from './useWhispers';
