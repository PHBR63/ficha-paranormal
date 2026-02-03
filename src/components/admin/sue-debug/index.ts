/**
 * SUEDebugPanel - Sistema Unificado de Efeitos - Módulo de Debug
 * 
 * Exporta todos os componentes do painel de debug do SUE
 * para visualização em tempo real dos efeitos computados.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

export { SUEDebugPanel } from './SUEDebugPanel';
export { ComputedEffectsView } from './ComputedEffectsView';
export { RawEffectsView } from './RawEffectsView';
export { BreakdownView } from './BreakdownView';
export { EffectCategorySection } from './EffectCategorySection';
export { EffectSourceBadge } from './EffectSourceBadge';

// Re-exporta tipos e constantes
export { SOURCE_CONFIG, CATEGORY_CONFIG } from './sue-debug-constants';
export type { SUEDebugPanelProps, BreakdownItem, SourceType } from './sue-debug-types';
