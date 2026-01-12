/**
 * Registro Unificado de Rituais
 * Ordem Paranormal RPG v1.3
 * 
 * Este arquivo combina todos os rituais de todos os círculos
 * para uso no sistema de fichas e campanhas.
 */

import type { UnifiedRitual } from './types';

// Importar rituais de 1º Círculo
import { FIRST_CIRCLE_RITUALS } from './first-circle';

// Importar rituais de 2º Círculo
import {
  BLOOD_SECOND_CIRCLE,
  KNOWLEDGE_SECOND_CIRCLE,
  ENERGY_SECOND_CIRCLE,
  FEAR_SECOND_CIRCLE,
  DEATH_SECOND_CIRCLE,
} from './second-circle';

// Importar rituais de 3º Círculo
import {
  BLOOD_THIRD_CIRCLE,
  DEATH_THIRD_CIRCLE,
  KNOWLEDGE_THIRD_CIRCLE,
  ENERGY_THIRD_CIRCLE,
  FEAR_THIRD_CIRCLE,
} from './third-circle';

// Importar rituais de 4º Círculo
import {
  BLOOD_FOURTH_CIRCLE,
  DEATH_FOURTH_CIRCLE,
  KNOWLEDGE_FOURTH_CIRCLE,
  ENERGY_FOURTH_CIRCLE,
  FEAR_FOURTH_CIRCLE,
} from './fourth-circle';

// =====================================================
// RITUAIS UNIFICADOS - TODOS OS CÍRCULOS
// =====================================================

export const UNIFIED_RITUALS: UnifiedRitual[] = [
  // 1º Círculo (29 rituais)
  ...FIRST_CIRCLE_RITUALS,
  
  // 2º Círculo
  ...BLOOD_SECOND_CIRCLE,
  ...KNOWLEDGE_SECOND_CIRCLE,
  ...ENERGY_SECOND_CIRCLE,
  ...FEAR_SECOND_CIRCLE,
  ...DEATH_SECOND_CIRCLE,
  
  // 3º Círculo
  ...BLOOD_THIRD_CIRCLE,
  ...DEATH_THIRD_CIRCLE,
  ...KNOWLEDGE_THIRD_CIRCLE,
  ...ENERGY_THIRD_CIRCLE,
  ...FEAR_THIRD_CIRCLE,
  
  // 4º Círculo
  ...BLOOD_FOURTH_CIRCLE,
  ...DEATH_FOURTH_CIRCLE,
  ...KNOWLEDGE_FOURTH_CIRCLE,
  ...ENERGY_FOURTH_CIRCLE,
  ...FEAR_FOURTH_CIRCLE,
];

// Mapa para busca rápida por ID (exportado para testes e consultas)
export const RITUAL_BY_ID = new Map<string, UnifiedRitual>(
  UNIFIED_RITUALS.map(r => [r.id, r])
);

// Estatísticas para debug
export const RITUAL_STATS = {
  total: UNIFIED_RITUALS.length,
  byCircle: {
    1: FIRST_CIRCLE_RITUALS.length,
    2: BLOOD_SECOND_CIRCLE.length + KNOWLEDGE_SECOND_CIRCLE.length + ENERGY_SECOND_CIRCLE.length + FEAR_SECOND_CIRCLE.length + DEATH_SECOND_CIRCLE.length,
    3: BLOOD_THIRD_CIRCLE.length + DEATH_THIRD_CIRCLE.length + KNOWLEDGE_THIRD_CIRCLE.length + ENERGY_THIRD_CIRCLE.length + FEAR_THIRD_CIRCLE.length,
    4: BLOOD_FOURTH_CIRCLE.length + DEATH_FOURTH_CIRCLE.length + KNOWLEDGE_FOURTH_CIRCLE.length + ENERGY_FOURTH_CIRCLE.length + FEAR_FOURTH_CIRCLE.length,
  },
};
