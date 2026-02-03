/**
 * Tipos e interfaces para o SUEDebugPanel
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import type { UnifiedEffectsResult } from '@/hooks';

/**
 * Props do componente principal SUEDebugPanel
 */
export interface SUEDebugPanelProps {
  /** Resultado do hook useUnifiedEffects */
  effectsResult: UnifiedEffectsResult;
  /** Nome do personagem (para export) */
  characterName?: string;
  /** Modo compacto para mobile */
  compact?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Item de breakdown com fonte e valor
 */
export interface BreakdownItem {
  source: string;
  value: number | string | boolean;
  conditional?: string;
}

/**
 * Tipos de fonte de efeitos no SUE
 */
export type SourceType = 
  | 'origin' 
  | 'track' 
  | 'condition' 
  | 'ritual' 
  | 'paranormal_power' 
  | 'class_power';
