/**
 * Testes de Migração de Chaves Legadas - training_grade_choices
 * 
 * Verifica a lógica de detecção e migração de chaves legadas
 * ('35'/'70') para o formato atual ('nex35'/'nex70').
 */

import { describe, it, expect } from 'vitest';
import {
  hasLegacyTrainingGradeKeys,
  migrateTrainingGradeKeys,
  TrainingGradeChoicesAudit,
} from '../character-audit-engine';
import { TRAINING_GRADE_KEYS, LEGACY_TRAINING_GRADE_KEYS } from '../constants/game-ids';

describe('hasLegacyTrainingGradeKeys', () => {
  it('deve retornar false para objeto vazio', () => {
    expect(hasLegacyTrainingGradeKeys({})).toBe(false);
  });

  it('deve retornar false para null/undefined', () => {
    expect(hasLegacyTrainingGradeKeys(null)).toBe(false);
    expect(hasLegacyTrainingGradeKeys(undefined)).toBe(false);
  });

  it('deve retornar false quando usa apenas chaves atuais', () => {
    const choices: TrainingGradeChoicesAudit = {
      nex35: [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      nex70: [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(false);
  });

  it('deve retornar true quando usa apenas chaves legadas', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(true);
  });

  it('deve retornar true quando tem chave legada 35 sem correspondente nova', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      nex70: [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(true);
  });

  it('deve retornar true quando tem chave legada 70 sem correspondente nova', () => {
    const choices: TrainingGradeChoicesAudit = {
      nex35: [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(true);
  });

  it('deve retornar false se tem ambas as versões (já migrado parcialmente)', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      nex35: [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
      nex70: [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(false);
  });
});

describe('migrateTrainingGradeKeys', () => {
  it('deve retornar objeto vazio para null/undefined', () => {
    expect(migrateTrainingGradeKeys(null)).toEqual({});
    expect(migrateTrainingGradeKeys(undefined)).toEqual({});
  });

  it('deve preservar chaves atuais sem modificação', () => {
    const choices: TrainingGradeChoicesAudit = {
      nex35: [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      nex70: [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result.nex35).toEqual(choices.nex35);
    expect(result.nex70).toEqual(choices.nex70);
    expect(result['35']).toBeUndefined();
    expect(result['70']).toBeUndefined();
  });

  it('deve migrar chave legada 35 para nex35', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result.nex35).toEqual(choices['35']);
    expect(result['35']).toBeUndefined();
  });

  it('deve migrar chave legada 70 para nex70', () => {
    const choices: TrainingGradeChoicesAudit = {
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result.nex70).toEqual(choices['70']);
    expect(result['70']).toBeUndefined();
  });

  it('deve migrar ambas as chaves legadas', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result.nex35).toEqual(choices['35']);
    expect(result.nex70).toEqual(choices['70']);
    expect(result['35']).toBeUndefined();
    expect(result['70']).toBeUndefined();
  });

  it('deve priorizar chave atual sobre legada se ambas existem', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      nex35: [{ skillId: 'luta', fromLevel: 1, toLevel: 2 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    // Deve usar a chave atual (nex35), não a legada
    expect(result.nex35).toEqual(choices.nex35);
    expect(result.nex35?.[0].skillId).toBe('luta');
  });

  it('deve manter integridade dos dados durante migração', () => {
    const originalData = [
      { skillId: 'atletismo', fromLevel: 1, toLevel: 2 },
      { skillId: 'luta', fromLevel: 1, toLevel: 2 },
    ];
    const choices: TrainingGradeChoicesAudit = {
      '35': originalData,
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result.nex35).toHaveLength(2);
    expect(result.nex35?.[0]).toEqual(originalData[0]);
    expect(result.nex35?.[1]).toEqual(originalData[1]);
  });
});

describe('Integração com constantes centralizadas', () => {
  it('TRAINING_GRADE_KEYS deve corresponder às chaves migradas', () => {
    const choices: TrainingGradeChoicesAudit = {
      '35': [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      '70': [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    const result = migrateTrainingGradeKeys(choices);
    
    expect(result[TRAINING_GRADE_KEYS.NEX_35]).toBeDefined();
    expect(result[TRAINING_GRADE_KEYS.NEX_70]).toBeDefined();
  });

  it('chaves legadas devem corresponder a LEGACY_TRAINING_GRADE_KEYS', () => {
    const choices: TrainingGradeChoicesAudit = {
      [LEGACY_TRAINING_GRADE_KEYS.NEX_35]: [{ skillId: 'atletismo', fromLevel: 1, toLevel: 2 }],
      [LEGACY_TRAINING_GRADE_KEYS.NEX_70]: [{ skillId: 'fortitude', fromLevel: 2, toLevel: 3 }],
    };
    
    expect(hasLegacyTrainingGradeKeys(choices)).toBe(true);
    
    const result = migrateTrainingGradeKeys(choices);
    expect(result[TRAINING_GRADE_KEYS.NEX_35]).toBeDefined();
    expect(result[TRAINING_GRADE_KEYS.NEX_70]).toBeDefined();
  });
});
