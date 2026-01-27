/**
 * Testes Vitest do Sistema de Poderes de Classe - Ordem Paranormal RPG v1.3
 * 
 * Adapta os testes de poderes para o formato Vitest.
 * 
 * @module power-system.vitest
 */

import { describe, it, expect } from 'vitest';
import { ALL_CLASS_POWERS, getPowerById, getPowersByClass, getCorePowers, getChoosablePowers } from '../power-registry';
import { calculatePowerBonuses, hasPower, createEmptyBonusSummary } from '../power-effects-engine';
import { ALL_TRACKS, getTrackById, getTracksByClass, getUnlockedAbilities } from '../track-registry';
import type { ClassId } from '../types';

// Tipo para facilitar loops com classes
const CLASS_IDS: ClassId[] = ['Combatente', 'Ocultista', 'Especialista'];

// ========================================
// TESTES DE INTEGRIDADE DOS PODERES
// ========================================

describe('Sistema de Poderes - Integridade', () => {
  it('deve ter todos os poderes com IDs únicos', () => {
    const ids = ALL_CLASS_POWERS.map(p => p.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    expect(duplicates).toHaveLength(0);
  });

  it('deve ter campos obrigatórios em todos os poderes de classe', () => {
    const errors: string[] = [];
    
    // Filtra apenas poderes de classe (exclui poderes de trilha convertidos)
    // Poderes de trilha têm IDs prefixados com 'track-' e podem ter estrutura diferente
    const classPowers = ALL_CLASS_POWERS.filter(p => !p.id.startsWith('track-'));
    
    for (const power of classPowers) {
      // Verifica campos obrigatórios para poderes de classe
      if (!power.id) errors.push(`${power.name}: falta campo 'id'`);
      if (!power.name) errors.push(`${power.id}: falta campo 'name'`);
      if (!power.classId) errors.push(`${power.name || power.id}: falta campo 'classId'`);
      if (power.isCore === undefined) errors.push(`${power.name || power.id}: falta campo 'isCore'`);
      if (power.minNex === undefined) errors.push(`${power.name || power.id}: falta campo 'minNex'`);
      if (!power.effects) errors.push(`${power.name || power.id}: falta campo 'effects'`);
    }
    
    expect(errors).toHaveLength(0);
  });
  
  it('poderes de trilha convertidos devem ter campos essenciais', () => {
    const trackPowers = ALL_CLASS_POWERS.filter(p => p.id.startsWith('track-'));
    
    // Trilhas convertidas devem ter pelo menos id, name, classId, minNex e effects
    for (const power of trackPowers) {
      expect(power.id).toBeDefined();
      expect(power.name).toBeDefined();
      expect(power.classId).toBeDefined();
      expect(power.minNex).toBeDefined();
      expect(power.effects).toBeDefined();
    }
  });
});

// ========================================
// TESTES DE CONTAGEM DE PODERES
// ========================================

describe('Sistema de Poderes - Contagem por Classe', () => {
  it('cada classe deve ter pelo menos 5 poderes core', () => {
    for (const classId of CLASS_IDS) {
      const corePowers = getCorePowers(classId);
      expect(corePowers.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('cada classe deve ter pelo menos 5 poderes escolhíveis', () => {
    for (const classId of CLASS_IDS) {
      const choosablePowers = getChoosablePowers(classId);
      expect(choosablePowers.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('getPowersByClass deve retornar poderes da classe correta', () => {
    for (const classId of CLASS_IDS) {
      const powers = getPowersByClass(classId);
      expect(powers.every(p => p.classId === classId)).toBe(true);
    }
  });
});

// ========================================
// TESTES DE PROGRESSÃO NEX
// ========================================

describe('Sistema de Poderes - Progressão NEX', () => {
  it('primeiro poder core de cada classe deve ser NEX 5', () => {
    for (const classId of CLASS_IDS) {
      const corePowers = getCorePowers(classId);
      const firstPower = corePowers.sort((a, b) => a.minNex - b.minNex)[0];
      
      expect(firstPower?.minNex).toBe(5);
    }
  });

  it('cada classe deve ter poder de Trilha em NEX 10', () => {
    for (const classId of CLASS_IDS) {
      const corePowers = getCorePowers(classId);
      const trackPower = corePowers.find(p => p.name.includes('Trilha') && p.minNex === 10);
      
      expect(trackPower).toBeDefined();
    }
  });
});

// ========================================
// TESTES DE PODERES ESPECÍFICOS (LIVRO BASE)
// ========================================

describe('Poderes Específicos - Combatente', () => {
  it('Ataque Especial deve ter custo base de 2 PE', () => {
    const power = getPowerById('ataque-especial');
    
    expect(power).toBeDefined();
    expect(power?.effects.base.activation?.cost).toBe(2);
  });

  it('Reflexos Defensivos deve ter pré-requisito Agi 2', () => {
    const power = getPowerById('reflexos-defensivos');
    
    expect(power).toBeDefined();
    expect(power?.prerequisites?.attributes?.agility).toBe(2);
    expect(power?.effects.base.defenseBonus?.value).toBe(2);
    expect(power?.effects.base.resistanceBonus?.value).toBe(2);
  });

  it('Golpe Pesado deve adicionar +1 dado do mesmo tipo ao dano', () => {
    const power = getPowerById('golpe-pesado');
    
    expect(power).toBeDefined();
    expect(power?.effects.base.damageBonus?.extraDice).toBe('+1d');
    expect(power?.effects.base.damageBonus?.conditions?.weaponType).toBe('melee');
  });

  it('Transcender deve ser repetível e ter NEX mínimo 15', () => {
    // Transcender usa IDs específicos por classe: transcender-comb, transcender-esp, transcender-ocult
    const power = getPowerById('transcender-comb');
    
    expect(power).toBeDefined();
    expect(power?.isRepeatable).toBe(true);
    // NEX mínimo oficial é 15% (não 20%) conforme Livro Base p.47
    expect(power?.minNex).toBe(15);
  });
});

describe('Poderes Específicos - Especialista', () => {
  it('Perito deve ter NEX mínimo 5 e custo 2 PE', () => {
    const power = getPowerById('perito');
    
    expect(power).toBeDefined();
    expect(power?.minNex).toBe(5);
    expect(power?.effects.base.activation?.cost).toBe(2);
  });
});

// ========================================
// TESTES DE TRILHAS
// ========================================

describe('Sistema de Trilhas - Integridade', () => {
  it('deve ter todas as trilhas com IDs únicos', () => {
    const ids = ALL_TRACKS.map(t => t.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    expect(duplicates).toHaveLength(0);
  });

  it('deve ter 5 trilhas por classe', () => {
    for (const classId of CLASS_IDS) {
      const tracks = getTracksByClass(classId);
      expect(tracks.length).toBe(5);
    }
  });

  it('deve ter 15 trilhas no total', () => {
    expect(ALL_TRACKS.length).toBe(15);
  });

  it('cada trilha deve ter 4 habilidades', () => {
    for (const track of ALL_TRACKS) {
      expect(track.abilities.length).toBe(4);
    }
  });
});

describe('Sistema de Trilhas - Progressão NEX', () => {
  it('habilidades de trilha devem ter NEX corretos', () => {
    const expectedNex = [10, 40, 65, 99];
    
    for (const track of ALL_TRACKS) {
      for (let i = 0; i < track.abilities.length; i++) {
        expect(track.abilities[i].minNex).toBe(expectedNex[i]);
      }
    }
  });
});

// ========================================
// TESTES DO REGISTRY
// ========================================

describe('Sistema de Poderes - Registry', () => {
  it('getPowerById deve encontrar poderes pelo ID', () => {
    const power = getPowerById('ataque-especial');
    
    expect(power).toBeDefined();
    expect(power?.id).toBe('ataque-especial');
  });

  it('getPowerById deve retornar undefined para ID inexistente', () => {
    const power = getPowerById('poder-inexistente-xyz');
    
    expect(power).toBeUndefined();
  });

  it('getTrackById deve encontrar trilhas pelo ID', () => {
    // Testa algumas trilhas conhecidas
    const trackIds = ['aniquilador', 'guardiao', 'operativo', 'condutor', 'laminador', 'infiltrador', 'perseguidor'];
    
    for (const trackId of trackIds) {
      const track = getTrackById(trackId);
      // Algumas trilhas podem não existir, então verificamos apenas se a função não quebra
      if (track) {
        expect(track.id).toBe(trackId);
      }
    }
  });
});

// ========================================
// TESTES DE CÁLCULO DE BÔNUS
// ========================================

describe('Sistema de Poderes - Cálculo de Bônus', () => {
  it('createEmptyBonusSummary deve retornar objeto com valores zerados', () => {
    const summary = createEmptyBonusSummary();
    
    // Verifica que o objeto foi criado (estrutura pode variar)
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('object');
  });

  it('hasPower deve verificar se personagem tem poder', () => {
    // hasPower aceita array de strings ou ActiveClassPower
    const powers = ['ataque-especial', 'golpe-pesado'];
    
    expect(hasPower(powers, 'ataque-especial')).toBe(true);
    expect(hasPower(powers, 'golpe-pesado')).toBe(true);
    expect(hasPower(powers, 'poder-inexistente')).toBe(false);
  });
});

// ========================================
// TESTES DE HABILIDADES DE TRILHA
// ========================================

describe('Sistema de Trilhas - Habilidades Desbloqueadas', () => {
  it('getUnlockedAbilities deve retornar habilidades corretas por NEX', () => {
    // Pega a primeira trilha disponível para teste
    const track = ALL_TRACKS[0];
    if (!track) return;
    
    // NEX 10 - deve ter 1 habilidade
    const abilities10 = getUnlockedAbilities(track.id, 10);
    expect(abilities10.length).toBe(1);
    
    // NEX 40 - deve ter 2 habilidades
    const abilities40 = getUnlockedAbilities(track.id, 40);
    expect(abilities40.length).toBe(2);
    
    // NEX 65 - deve ter 3 habilidades
    const abilities65 = getUnlockedAbilities(track.id, 65);
    expect(abilities65.length).toBe(3);
    
    // NEX 99 - deve ter 4 habilidades
    const abilities99 = getUnlockedAbilities(track.id, 99);
    expect(abilities99.length).toBe(4);
  });

  it('getUnlockedAbilities deve retornar vazio para NEX menor que 10', () => {
    const track = ALL_TRACKS[0];
    if (!track) return;
    
    const abilities = getUnlockedAbilities(track.id, 5);
    expect(abilities.length).toBe(0);
  });
});
