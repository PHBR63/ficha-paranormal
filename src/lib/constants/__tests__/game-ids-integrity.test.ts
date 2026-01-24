/**
 * Testes de Integridade - IDs Centralizados vs Power Registry
 * 
 * Valida que todos os IDs de poderes especiais definidos em game-ids.ts
 * existem no power-registry unificado, garantindo consistência do sistema.
 * 
 * @module game-ids-integrity.test
 */

import { describe, it, expect } from 'vitest';
import {
  // IDs de Classes e Trilhas
  CLASS_IDS,
  VALID_CLASS_IDS,
  COMBATENTE_TRACK_IDS,
  ESPECIALISTA_TRACK_IDS,
  OCULTISTA_TRACK_IDS,
  ALL_TRACK_IDS,
  TRACKS_BY_CLASS,
  
  // IDs de Poderes Especiais
  TRANSCENDER_POWER_IDS,
  ALL_TRANSCENDER_IDS,
  SKILL_TRAINING_POWER_IDS,
  ALL_SKILL_TRAINING_IDS,
  VERSATILITY_POWER_IDS,
  ALL_VERSATILITY_IDS,
  
  // IDs de Grau de Treinamento
  TRAINING_GRADE_KEYS,
  getTrainingGradeKey,
  getTrainingGradeKeyForMilestone,
  
  // Funções de validação
  isValidTrackForClass,
  getTracksForClass,
} from '../game-ids';

import { getPowerById, ALL_CLASS_POWERS } from '@/lib/class-powers/power-registry';
import { getUnifiedPower } from '@/lib/class-abilities-prerequisites';

// ============================================
// TESTES DE INTEGRIDADE: PODERES ESPECIAIS
// ============================================

describe('IDs de Poderes Especiais - Integridade com Power Registry', () => {
  
  describe('Transcender', () => {
    it('deve ter 3 IDs definidos (um por classe)', () => {
      expect(ALL_TRANSCENDER_IDS).toHaveLength(3);
    });
    
    it('deve ter IDs correspondentes às classes corretas', () => {
      expect(TRANSCENDER_POWER_IDS.COMBATENTE).toBe('transcender-comb');
      expect(TRANSCENDER_POWER_IDS.ESPECIALISTA).toBe('transcender-esp');
      expect(TRANSCENDER_POWER_IDS.OCULTISTA).toBe('transcender-ocult');
    });
    
    it.each(ALL_TRANSCENDER_IDS)('ID "%s" deve existir no power-registry', (powerId) => {
      const power = getPowerById(powerId);
      expect(power).toBeDefined();
      expect(power?.id).toBe(powerId);
    });
    
    it.each(ALL_TRANSCENDER_IDS)('ID "%s" deve ser resolvido por getUnifiedPower', (powerId) => {
      const power = getUnifiedPower(powerId);
      expect(power).toBeDefined();
      expect(power?.id).toBe(powerId);
    });
    
    it('poderes Transcender devem existir e ter nome correto', () => {
      for (const powerId of ALL_TRANSCENDER_IDS) {
        const power = getPowerById(powerId);
        expect(power).toBeDefined();
        expect(power?.name).toBe('Transcender');
      }
    });
  });
  
  describe('Treinamento em Perícia', () => {
    // IDs específicos por classe (sem o legado)
    const classSpecificIds = [
      SKILL_TRAINING_POWER_IDS.COMBATENTE,
      SKILL_TRAINING_POWER_IDS.ESPECIALISTA,
      SKILL_TRAINING_POWER_IDS.OCULTISTA,
    ];
    
    it('deve ter 4 IDs definidos (3 por classe + 1 legado)', () => {
      expect(ALL_SKILL_TRAINING_IDS).toHaveLength(4);
    });
    
    it('deve ter IDs correspondentes às classes corretas', () => {
      expect(SKILL_TRAINING_POWER_IDS.COMBATENTE).toBe('treinamento-pericia-comb');
      expect(SKILL_TRAINING_POWER_IDS.ESPECIALISTA).toBe('treinamento-pericia-esp');
      expect(SKILL_TRAINING_POWER_IDS.OCULTISTA).toBe('treinamento-pericia-ocult');
      expect(SKILL_TRAINING_POWER_IDS.LEGACY).toBe('treinamento-pericia');
    });
    
    it.each(classSpecificIds)('ID "%s" deve existir no power-registry', (powerId) => {
      const power = getPowerById(powerId);
      expect(power).toBeDefined();
      expect(power?.id).toBe(powerId);
    });
    
    it('ID legado deve ser resolvido para um poder válido via getUnifiedPower', () => {
      const power = getUnifiedPower(SKILL_TRAINING_POWER_IDS.LEGACY);
      expect(power).toBeDefined();
      // O legado mapeia para o ID do Combatente
      expect(power?.id).toBe(SKILL_TRAINING_POWER_IDS.COMBATENTE);
    });
    
    it('poderes de Treinamento em Perícia devem ser repetíveis', () => {
      for (const powerId of classSpecificIds) {
        const power = getPowerById(powerId);
        expect(power?.isRepeatable).toBe(true);
      }
    });
  });
  
  describe('Versatilidade', () => {
    it('deve ter 2 IDs definidos (Combatente e Especialista)', () => {
      expect(ALL_VERSATILITY_IDS).toHaveLength(2);
    });
    
    it('deve ter IDs correspondentes às classes corretas', () => {
      expect(VERSATILITY_POWER_IDS.COMBATENTE).toBe('versatilidade-comb');
      expect(VERSATILITY_POWER_IDS.ESPECIALISTA).toBe('versatilidade-esp');
    });
    
    it.each(ALL_VERSATILITY_IDS)('ID "%s" deve existir no power-registry', (powerId) => {
      const power = getPowerById(powerId);
      expect(power).toBeDefined();
      expect(power?.id).toBe(powerId);
    });
    
    it('poderes de Versatilidade devem ter minNex 50', () => {
      for (const powerId of ALL_VERSATILITY_IDS) {
        const power = getPowerById(powerId);
        expect(power?.minNex).toBe(50);
      }
    });
  });
});

// ============================================
// TESTES DE INTEGRIDADE: GRAU DE TREINAMENTO
// ============================================

describe('Chaves de Grau de Treinamento - Consistência', () => {
  
  it('deve ter chaves para NEX 35% e 70%', () => {
    expect(TRAINING_GRADE_KEYS.NEX_35).toBe('nex35');
    expect(TRAINING_GRADE_KEYS.NEX_70).toBe('nex70');
  });
  
  describe('getTrainingGradeKey', () => {
    it('deve retornar null para NEX < 35', () => {
      expect(getTrainingGradeKey(5)).toBeNull();
      expect(getTrainingGradeKey(20)).toBeNull();
      expect(getTrainingGradeKey(30)).toBeNull();
    });
    
    it('deve retornar "nex35" para NEX entre 35 e 69', () => {
      expect(getTrainingGradeKey(35)).toBe('nex35');
      expect(getTrainingGradeKey(50)).toBe('nex35');
      expect(getTrainingGradeKey(65)).toBe('nex35');
    });
    
    it('deve retornar "nex70" para NEX >= 70', () => {
      expect(getTrainingGradeKey(70)).toBe('nex70');
      expect(getTrainingGradeKey(85)).toBe('nex70');
      expect(getTrainingGradeKey(99)).toBe('nex70');
    });
  });
  
  describe('getTrainingGradeKeyForMilestone', () => {
    it('deve retornar a chave correta para marcos específicos', () => {
      expect(getTrainingGradeKeyForMilestone(35)).toBe('nex35');
      expect(getTrainingGradeKeyForMilestone(70)).toBe('nex70');
    });
  });
});

// ============================================
// TESTES DE INTEGRIDADE: CLASSES E TRILHAS
// ============================================

describe('IDs de Classes e Trilhas - Consistência', () => {
  
  describe('Classes', () => {
    it('deve ter 3 classes definidas', () => {
      expect(VALID_CLASS_IDS).toHaveLength(3);
    });
    
    it('deve ter IDs com inicial maiúscula', () => {
      expect(CLASS_IDS.COMBATENTE).toBe('Combatente');
      expect(CLASS_IDS.ESPECIALISTA).toBe('Especialista');
      expect(CLASS_IDS.OCULTISTA).toBe('Ocultista');
    });
    
    it.each(VALID_CLASS_IDS)('classe "%s" deve ter trilhas definidas', (classId) => {
      const tracks = getTracksForClass(classId);
      expect(tracks.length).toBeGreaterThanOrEqual(5);
    });
  });
  
  describe('Trilhas', () => {
    it('deve ter 5 trilhas por classe', () => {
      expect(Object.values(COMBATENTE_TRACK_IDS)).toHaveLength(5);
      expect(Object.values(ESPECIALISTA_TRACK_IDS)).toHaveLength(5);
      expect(Object.values(OCULTISTA_TRACK_IDS)).toHaveLength(5);
    });
    
    it('deve ter 15 trilhas no total', () => {
      expect(ALL_TRACK_IDS).toHaveLength(15);
    });
    
    it.each(ALL_TRACK_IDS)('trilha "%s" deve ser válida para sua classe', (trackId) => {
      // Encontrar a classe da trilha
      let foundClass: string | null = null;
      for (const [classKey, tracks] of Object.entries(TRACKS_BY_CLASS)) {
        if ((tracks as readonly string[]).includes(trackId)) {
          foundClass = classKey;
          break;
        }
      }
      
      expect(foundClass).not.toBeNull();
      expect(isValidTrackForClass(trackId, foundClass!)).toBe(true);
    });
  });
});

// ============================================
// TESTES DE CONSISTÊNCIA: IDs NO POWER REGISTRY
// ============================================

describe('Consistência Global - Power Registry', () => {
  
  it('não deve haver IDs duplicados no power-registry', () => {
    const ids = ALL_CLASS_POWERS.map(p => p.id);
    const uniqueIds = new Set(ids);
    
    // Se houver duplicatas, mostrar quais são
    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.error('IDs duplicados encontrados:', [...new Set(duplicates)]);
    }
    
    expect(ids.length).toBe(uniqueIds.size);
  });
  
  it('todos os poderes devem ter classId válido', () => {
    for (const power of ALL_CLASS_POWERS) {
      expect(VALID_CLASS_IDS).toContain(power.classId);
    }
  });
  
  // PADRONIZADO: Todos os IDs agora usam 'condutor' conforme game-ids.ts
  it('poderes com trackId devem ter trackId válido', () => {
    for (const power of ALL_CLASS_POWERS) {
      if (power.trackId) {
        expect(ALL_TRACK_IDS).toContain(power.trackId);
      }
    }
  });
  
  // PADRONIZADO: Todas as trilhas devem ter poderes cadastrados
  it('poderes de trilha devem ter trackId definido', () => {
    const trackPowers = ALL_CLASS_POWERS.filter(p => p.trackId);
    
    for (const trackId of ALL_TRACK_IDS) {
      const powersForTrack = trackPowers.filter(p => p.trackId === trackId);
      expect(powersForTrack.length).toBeGreaterThan(0);
    }
  });
});

// ============================================
// TESTES DE COBERTURA: PODERES POR CLASSE
// ============================================

describe('Cobertura de Poderes por Classe', () => {
  
  it.each(VALID_CLASS_IDS)('classe "%s" deve ter ao menos 10 poderes de classe', (classId) => {
    // Poderes de classe são aqueles SEM trackId
    const powers = ALL_CLASS_POWERS.filter(
      p => p.classId === classId && !p.trackId
    );
    expect(powers.length).toBeGreaterThanOrEqual(10);
  });
  
  it.each(VALID_CLASS_IDS)('classe "%s" deve ter poderes de trilha', (classId) => {
    // Poderes de trilha são aqueles COM trackId
    const trackPowers = ALL_CLASS_POWERS.filter(
      p => p.classId === classId && p.trackId
    );
    expect(trackPowers.length).toBeGreaterThan(0);
  });
  
  // PADRONIZADO: Agora todas as trilhas têm ao menos 4 poderes
  it('todas as trilhas devem ter ao menos 4 poderes', () => {
    for (const trackId of ALL_TRACK_IDS) {
      const powers = ALL_CLASS_POWERS.filter(p => p.trackId === trackId);
      
      if (powers.length < 4) {
        console.warn(`Trilha "${trackId}" tem apenas ${powers.length} poderes`);
      }
      
      expect(powers.length).toBeGreaterThanOrEqual(4);
    }
  });
});
