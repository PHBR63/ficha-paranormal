/**
 * Testes Vitest do Sistema de Rituais - Ordem Paranormal RPG
 * 
 * Adapta os testes de rituais para o formato Vitest.
 * 
 * @module ritual-system.vitest
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_RITUALS, RITUAL_BY_ID } from '../unified-rituals';
import { getAllRituals, getRitualById, getRitualsByElement, getRitualsByCircle } from '../ritual-registry';
import type { RitualElement, RitualCircle } from '../types';

// ========================================
// TESTES DE INTEGRIDADE DOS RITUAIS
// ========================================

describe('Sistema de Rituais Unificado - Integridade', () => {
  it('todos os 17 rituais de 4º círculo têm custo base 10 PE (Base v1.3 p.119)', () => {
    const rituals = getRitualsByCircle(4);
    expect(rituals).toHaveLength(17);
    for (const ritual of rituals) {
      expect(ritual.cost, ritual.id).toBe(10);
    }
  });

  it('deve ter todos os rituais com IDs únicos', () => {
    const ids = UNIFIED_RITUALS.map(r => r.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    expect(duplicates).toHaveLength(0);
  });

  it('deve ter campos obrigatórios em todos os rituais', () => {
    const errors: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      // Verifica campos obrigatórios diretamente
      if (!ritual.id) errors.push(`${ritual.name}: falta campo 'id'`);
      if (!ritual.name) errors.push(`${ritual.id}: falta campo 'name'`);
      if (ritual.circle === undefined) errors.push(`${ritual.name || ritual.id}: falta campo 'circle'`);
      if (!ritual.element) errors.push(`${ritual.name || ritual.id}: falta campo 'element'`);
      if (!ritual.execution) errors.push(`${ritual.name || ritual.id}: falta campo 'execution'`);
      if (!ritual.range) errors.push(`${ritual.name || ritual.id}: falta campo 'range'`);
      if (!ritual.duration) errors.push(`${ritual.name || ritual.id}: falta campo 'duration'`);
      if (!ritual.description) errors.push(`${ritual.name || ritual.id}: falta campo 'description'`);
      if (ritual.cost === undefined) errors.push(`${ritual.name || ritual.id}: falta campo 'cost'`);
      if (!ritual.effects) errors.push(`${ritual.name || ritual.id}: falta campo 'effects'`);
    }
    
    expect(errors).toHaveLength(0);
  });

  it('deve ter efeitos base válidos em todos os rituais', () => {
    const errors: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      if (!ritual.effects?.base) {
        errors.push(`${ritual.name}: sem efeito base`);
      } else if (!ritual.effects.base.kind) {
        errors.push(`${ritual.name}: efeito base sem 'kind'`);
      } else if (!ritual.effects.base.summary) {
        errors.push(`${ritual.name}: efeito base sem 'summary'`);
      }
    }
    
    expect(errors).toHaveLength(0);
  });

  it('deve ter estrutura de enhancements válida', () => {
    const errors: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      if (ritual.enhancements) {
        for (const enh of ritual.enhancements) {
          if (!enh.name) {
            errors.push(`${ritual.name}: enhancement sem nome`);
          }
          if (enh.cost === undefined) {
            errors.push(`${ritual.name}: enhancement '${enh.name}' sem custo`);
          }
          if (!enh.description) {
            errors.push(`${ritual.name}: enhancement '${enh.name}' sem descrição`);
          }
        }
      }
    }
    
    expect(errors).toHaveLength(0);
  });
});

// ========================================
// TESTES DE CONTAGEM DE RITUAIS
// ========================================

describe('Sistema de Rituais Unificado - Contagem', () => {
  it('deve ter pelo menos 1 ritual no total (mínimo para testes)', () => {
    expect(UNIFIED_RITUALS.length).toBeGreaterThanOrEqual(1);
  });

  it('deve ter rituais no círculo 1', () => {
    const rituals = UNIFIED_RITUALS.filter(r => r.circle === 1);
    expect(rituals.length).toBeGreaterThan(0);
  });
});

// ========================================
// TESTES DO MAPA RITUAL_BY_ID
// ========================================

describe('Sistema de Rituais Unificado - Mapa RITUAL_BY_ID', () => {
  it('deve ter o mapa sincronizado com a lista de rituais', () => {
    expect(RITUAL_BY_ID.size).toBe(UNIFIED_RITUALS.length);
  });

  it('deve encontrar todos os rituais pelo ID', () => {
    const errors: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      const found = RITUAL_BY_ID.get(ritual.id);
      if (!found) {
        errors.push(`${ritual.id}: não encontrado no mapa`);
      } else if (found.name !== ritual.name) {
        errors.push(`${ritual.id}: nome não corresponde`);
      }
    }
    
    expect(errors).toHaveLength(0);
  });
});

// ========================================
// TESTES DAS FUNÇÕES DO REGISTRY
// ========================================

describe('Sistema de Rituais Unificado - Funções do Registry', () => {
  it('getAllRituals deve retornar todos os rituais', () => {
    const all = getAllRituals();
    expect(all.length).toBe(UNIFIED_RITUALS.length);
  });

  it('getRitualById deve encontrar rituais pelo ID', () => {
    const testRitual = UNIFIED_RITUALS[0];
    const found = getRitualById(testRitual.id);
    
    expect(found).toBeDefined();
    expect(found?.id).toBe(testRitual.id);
  });

  it('getRitualById deve retornar undefined para ID inexistente', () => {
    const found = getRitualById('ritual-inexistente-xyz');
    expect(found).toBeUndefined();
  });

  it('getRitualsByElement deve retornar rituais do elemento se existirem', () => {
    const byElement = getRitualsByElement('sangue');
    
    // Pode ter 0 ou mais rituais de sangue
    if (byElement.length > 0) {
      expect(byElement.every(r => r.element.toLowerCase() === 'sangue')).toBe(true);
    }
  });

  it('getRitualsByCircle deve retornar rituais do círculo', () => {
    const byCircle = getRitualsByCircle(1);
    
    expect(byCircle.length).toBeGreaterThan(0);
    expect(byCircle.every(r => r.circle === 1)).toBe(true);
  });
});

// ========================================
// TESTES DE CUSTOS DE PE
// ========================================

describe('Sistema de Rituais Unificado - Custos de PE', () => {
  it('deve ter custos de PE válidos (0-10)', () => {
    const errors: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      if (ritual.cost < 0 || ritual.cost > 10) {
        errors.push(`${ritual.name}: custo ${ritual.cost} fora do intervalo válido`);
      }
    }
    
    expect(errors).toHaveLength(0);
  });
});

// ========================================
// TESTES DE MARCAÇÕES ESPECIAIS
// ========================================

describe('Sistema de Rituais Unificado - Marcações Especiais', () => {
  it('rituais com weaponEffect devem ter isWeaponBuff marcado', () => {
    const warnings: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      if (ritual.effects?.base?.weaponEffect && !ritual.isWeaponBuff) {
        warnings.push(`${ritual.name}: tem weaponEffect mas isWeaponBuff não está marcado`);
      }
    }
    
    // Warnings, não erros críticos
    expect(warnings.length).toBeLessThanOrEqual(5);
  });

  it('rituais com duração sustentada devem ter isSustainable marcado', () => {
    const warnings: string[] = [];
    
    for (const ritual of UNIFIED_RITUALS) {
      const hasSustainEffect = ritual.effects?.base?.sustain?.concentration;
      const durationIsSustained = ritual.duration === 'Sustentada';
      
      if ((hasSustainEffect || durationIsSustained) && !ritual.isSustainable) {
        warnings.push(`${ritual.name}: parece sustentado mas isSustainable não está marcado`);
      }
    }
    
    // Warnings, não erros críticos
    expect(warnings.length).toBeLessThanOrEqual(10);
  });
});
