/**
 * Testes Vitest do Adaptador de Efeitos de Poderes Paranormais - Ordem Paranormal RPG
 * 
 * Testa a conversão de poderes paranormais para efeitos unificados,
 * aplicação de bônus de afinidade, e cálculos baseados em NEX.
 * 
 * @module paranormal-powers-effects-adapter.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  PARANORMAL_POWER_EFFECTS,
  getParanormalPowerEffects,
  getParanormalPowersSummary,
  listAllParanormalPowerEffects,
} from '../paranormal-powers-effects-adapter';
import type { SavedParanormalPower } from '../../paranormal-powers';

// ========================================
// TESTES DO MAPEAMENTO DE PODERES
// ========================================

describe('Adaptador de Poderes Paranormais - Mapeamento', () => {
  it('deve ter 22 poderes mapeados', () => {
    const powerIds = Object.keys(PARANORMAL_POWER_EFFECTS);
    expect(powerIds.length).toBe(22);
  });

  it('deve ter todos os poderes de Sangue mapeados', () => {
    const sanguePowers = [
      'anatomia-insana',
      'arma-de-sangue',
      'sangue-de-ferro',
      'sangue-fervente',
      'sangue-vivo',
    ];

    for (const id of sanguePowers) {
      expect(PARANORMAL_POWER_EFFECTS[id]).toBeDefined();
      expect(PARANORMAL_POWER_EFFECTS[id].description).toBeDefined();
    }
  });

  it('deve ter todos os poderes de Morte mapeados', () => {
    const mortePowers = [
      'encarar-a-morte',
      'escapar-da-morte',
      'potencial-aprimorado',
      'potencial-reaproveitado',
      'surto-temporal',
    ];

    for (const id of mortePowers) {
      expect(PARANORMAL_POWER_EFFECTS[id]).toBeDefined();
    }
  });

  it('deve ter todos os poderes de Conhecimento mapeados', () => {
    const conhecimentoPowers = [
      'expansao-de-conhecimento',
      'percepcao-paranormal',
      'precognicao',
      'sensitivo',
      'visao-do-oculto',
    ];

    for (const id of conhecimentoPowers) {
      expect(PARANORMAL_POWER_EFFECTS[id]).toBeDefined();
    }
  });

  it('deve ter todos os poderes de Energia mapeados', () => {
    const energiaPowers = [
      'afortunado',
      'campo-protetor',
      'causalidade-fortuita',
      'golpe-de-sorte',
      'manipular-entropia',
    ];

    for (const id of energiaPowers) {
      expect(PARANORMAL_POWER_EFFECTS[id]).toBeDefined();
    }
  });

  it('deve ter poderes genéricos mapeados', () => {
    expect(PARANORMAL_POWER_EFFECTS['aprender-ritual']).toBeDefined();
    expect(PARANORMAL_POWER_EFFECTS['resistir-a-elemento']).toBeDefined();
  });
});

// ========================================
// TESTES DE MECÂNICAS ESPECÍFICAS
// ========================================

describe('Adaptador de Poderes Paranormais - Mecânicas', () => {
  it('Anatomia Insana não aplica Fortitude', () => {
    const power = PARANORMAL_POWER_EFFECTS['anatomia-insana'];
    
    expect(power.mechanics.fortitudeBonus).toBeUndefined();
    expect(power.affinityMechanics?.fortitudeBonus).toBeUndefined();
  });

  it('Sangue de Ferro deve ter bônus de HP por NEX', () => {
    const power = PARANORMAL_POWER_EFFECTS['sangue-de-ferro'];
    
    expect(power.mechanics.hpBonusPerNex).toBe(2);
    expect(power.affinityMechanics?.hpBonusPerNex).toBe(2);
  });

  it('Potencial Aprimorado deve ter bônus de PE por NEX', () => {
    const power = PARANORMAL_POWER_EFFECTS['potencial-aprimorado'];
    
    expect(power.mechanics.peBonusPerNex).toBe(1);
    expect(power.affinityMechanics?.peBonusPerNex).toBe(2);
  });

  it('Precognição deve ter bônus de defesa e resistências', () => {
    const power = PARANORMAL_POWER_EFFECTS['precognicao'];
    
    expect(power.mechanics.defenseBonus).toBe(2);
    expect(power.mechanics.fortitudeBonus).toBe(2);
    expect(power.mechanics.reflexosBonus).toBe(2);
    expect(power.mechanics.vontadeBonus).toBe(2);
    
    expect(power.affinityMechanics?.defenseBonus).toBe(2);
  });

  it('Sensitivo deve ter bônus de perícias', () => {
    const power = PARANORMAL_POWER_EFFECTS['sensitivo'];
    
    expect(power.mechanics.skillBonus?.diplomacia).toBe(5);
    expect(power.mechanics.skillBonus?.intimidacao).toBe(5);
    expect(power.mechanics.skillBonus?.intuicao).toBe(5);
    
    expect(power.affinityMechanics?.skillBonus?.diplomacia).toBe(5);
  });

  it('Golpe de Sorte deve ter bônus de margem crítica', () => {
    const power = PARANORMAL_POWER_EFFECTS['golpe-de-sorte'];
    
    expect(power.mechanics.criticalMarginBonus).toBe(1);
    expect(power.affinityMechanics?.criticalMarginBonus).toBe(1);
    expect(power.affinityMechanics?.criticalMultiplierBonus).toBe(1);
  });

  it('Surto Temporal descreve ação extra com custo sem concedê-la permanentemente', () => {
    const power = PARANORMAL_POWER_EFFECTS['surto-temporal'];
    
    expect(power.mechanics.extraAction).toBeUndefined();
    expect(power.mechanics.specialEffects?.join(' ')).toContain('3 PE');
  });
});

// ========================================
// TESTES DE CONVERSÃO PARA UNIFIED EFFECTS
// ========================================

describe('Adaptador de Poderes Paranormais - Conversão', () => {
  it('getParanormalPowerEffects deve retornar array vazio para lista vazia', () => {
    const effects = getParanormalPowerEffects([], 50, null, false);
    expect(effects).toHaveLength(0);
  });

  it('getParanormalPowerEffects deve retornar array vazio para null', () => {
    const effects = getParanormalPowerEffects(null, 50, null, false);
    expect(effects).toHaveLength(0);
  });

  it('getParanormalPowerEffects deve converter poder simples', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'anatomia-insana',
        name: 'Anatomia Insana',
        element: 'sangue',
        description: 'Seu corpo foi alterado pelo Outro Lado.',
      },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, null, false);
    
    expect(effects).toHaveLength(1);
    expect(effects[0].id).toBe('paranormal-anatomia-insana');
    expect(effects[0].name).toBe('Anatomia Insana');
    expect(effects[0].source).toBe('paranormal_power');
    expect(effects[0].mechanics.fortitudeBonus).toBeUndefined();
  });

  it('getParanormalPowerEffects deve aplicar bônus de afinidade', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'anatomia-insana',
        name: 'Anatomia Insana',
        element: 'sangue',
        description: 'Seu corpo foi alterado pelo Outro Lado.',
      },
    ];

    // Com afinidade de Sangue
    const effects = getParanormalPowerEffects([...savedPowers,...savedPowers], 50, 'sangue', true);
    
    expect(effects[0].mechanics.fortitudeBonus).toBeUndefined();
    expect(effects[0].description).toContain('Imunidade');
    expect(effects[0].sourceName).toContain('Afinidade');
  });

  it('getParanormalPowerEffects não deve aplicar afinidade de elemento diferente', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'anatomia-insana',
        name: 'Anatomia Insana',
        element: 'sangue',
        description: 'Seu corpo foi alterado pelo Outro Lado.',
      },
    ];

    // Afinidade de Energia, poder de Sangue
    const effects = getParanormalPowerEffects(savedPowers, 50, 'energia', true);
    
    expect(effects[0].mechanics.fortitudeBonus).toBeUndefined(); // Valor base
  });

  it('getParanormalPowerEffects deve calcular bônus baseado em NEX', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'sangue-de-ferro',
        name: 'Sangue de Ferro',
        element: 'sangue',
        description: 'Seu sangue é mais resistente.',
      },
    ];

    const effects50 = getParanormalPowerEffects(savedPowers, 50, null, false);
    const effects99 = getParanormalPowerEffects(savedPowers, 99, null, false);
    
    // NEX 50 = 10 steps × 2 = 20 HP bonus
    expect(effects50[0].mechanics.hpBonus).toBe(20);
    
    // NEX 99 = 20 patamares × 2 = 40 HP bonus
    expect(effects99[0].mechanics.hpBonus).toBe(40);
  });

  it('getParanormalPowerEffects deve converter múltiplos poderes', () => {
    const savedPowers: SavedParanormalPower[] = [
      { id: 'anatomia-insana', name: 'Anatomia Insana', element: 'sangue', description: '' },
      { id: 'afortunado', name: 'Afortunado', element: 'energia', description: '' },
      { id: 'precognicao', name: 'Precognição', element: 'conhecimento', description: '' },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, null, false);
    
    expect(effects).toHaveLength(3);
  });

  it('getParanormalPowerEffects deve ter prioridade maior com afinidade', () => {
    const savedPowers: SavedParanormalPower[] = [
      { id: 'anatomia-insana', name: 'Anatomia Insana', element: 'sangue', description: '' },
    ];

    const effectsNoAffinity = getParanormalPowerEffects(savedPowers, 50, null, false);
    const effectsWithAffinity = getParanormalPowerEffects([...savedPowers,...savedPowers], 50, 'sangue', true);
    
    expect(effectsNoAffinity[0].priority).toBe(50);
    expect(effectsWithAffinity[0].priority).toBe(60);
  });
});

// ========================================
// TESTES DE ESCOLHAS ESPECÍFICAS
// ========================================

describe('Adaptador de Poderes Paranormais - Escolhas', () => {
  it('Expansão de Conhecimento preserva escolha legada sem inventar bônus de perícia', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'expansao-de-conhecimento',
        name: 'Expansão de Conhecimento',
        element: 'conhecimento',
        description: '',
        choices: {
          skills: ['ciencias'],
        },
      },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, null, false);
    
    expect(effects[0].mechanics.skillBonus?.ciencias).toBeUndefined();
    expect(savedPowers[0].choices?.skills).toEqual(['ciencias']);
  });

  it('Expansão de Conhecimento com afinidade não inventa bônus de duas perícias', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'expansao-de-conhecimento',
        name: 'Expansão de Conhecimento',
        element: 'conhecimento',
        description: '',
        choices: {
          skills: ['ciencias', 'medicina'],
        },
      },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, 'conhecimento', true);
    
    expect(effects[0].mechanics.skillBonus?.ciencias).toBeUndefined();
    expect(effects[0].mechanics.skillBonus?.medicina).toBeUndefined();
  });

  it('Resistir a Elemento deve aplicar resistência ao elemento escolhido', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'resistir-a-elemento',
        name: 'Resistir a Elemento',
        element: 'generic',
        description: '',
        choices: {
          resistElement: 'sangue',
        },
      },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, null, false);
    
    expect(effects[0].mechanics.damageResistance?.sangue).toBe(10);
  });
});

// ========================================
// TESTES DE PODERES NÃO MAPEADOS
// ========================================

describe('Adaptador de Poderes Paranormais - Poderes Não Mapeados', () => {
  it('poder não mapeado deve ser convertido como efeito especial', () => {
    const savedPowers: SavedParanormalPower[] = [
      {
        id: 'poder-customizado-xyz',
        name: 'Poder Customizado',
        element: 'sangue',
        description: 'Um poder inventado para teste',
      },
    ];

    const effects = getParanormalPowerEffects(savedPowers, 50, null, false);
    
    expect(effects).toHaveLength(1);
    expect(effects[0].id).toBe('paranormal-poder-customizado-xyz');
    expect(effects[0].mechanics.specialEffects).toContain('Um poder inventado para teste');
  });
});

// ========================================
// TESTES DE RESUMO DE PODERES
// ========================================

describe('Adaptador de Poderes Paranormais - Resumo', () => {
  it('getParanormalPowersSummary deve retornar objeto vazio para lista vazia', () => {
    const summary = getParanormalPowersSummary([], 50, null, false);
    
    expect(summary.totalDefense).toBe(0);
    expect(summary.totalHP).toBe(0);
    expect(summary.totalPE).toBe(0);
  });

  it('getParanormalPowersSummary deve calcular bônus de defesa', () => {
    const savedPowers: SavedParanormalPower[] = [
      { id: 'precognicao', name: 'Precognição', element: 'conhecimento', description: '' },
    ];

    const summary = getParanormalPowersSummary(savedPowers, 50, null, false);
    
    expect(summary.totalDefense).toBe(2);
  });

  it('getParanormalPowersSummary deve calcular bônus de HP com afinidade', () => {
    const savedPowers: SavedParanormalPower[] = [
      { id: 'sangue-de-ferro', name: 'Sangue de Ferro', element: 'sangue', description: '' },
    ];

    const summary = getParanormalPowersSummary(savedPowers, 50, 'sangue', true);
    
    // NEX 50 = 10 patamares × 2 = 20 PV; afinidade não dobra PV
    expect(summary.totalHP).toBe(20);
  });

  it('getParanormalPowersSummary deve calcular bônus de PE', () => {
    const savedPowers: SavedParanormalPower[] = [
      { id: 'potencial-aprimorado', name: 'Potencial Aprimorado', element: 'morte', description: '' },
    ];

    const summary = getParanormalPowersSummary([...savedPowers,...savedPowers], 50, 'morte', true);
    
    // NEX 50 = 10 steps × 2 (com afinidade) = 20 PE bonus
    expect(summary.totalPE).toBe(20);
  });
});

// ========================================
// TESTES DE LISTAGEM
// ========================================

describe('Adaptador de Poderes Paranormais - Listagem', () => {
  it('listAllParanormalPowerEffects deve retornar todos os 22 poderes', () => {
    const list = listAllParanormalPowerEffects();
    expect(list).toHaveLength(22);
  });

  it('listAllParanormalPowerEffects deve ter estrutura correta', () => {
    const list = listAllParanormalPowerEffects();
    
    for (const item of list) {
      expect(item.id).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.hasAffinityBonus).toBeDefined();
    }
  });

  it('listAllParanormalPowerEffects deve identificar poderes com bônus de afinidade', () => {
    const list = listAllParanormalPowerEffects();
    
    const anatomia = list.find(p => p.id === 'anatomia-insana');
    expect(anatomia?.hasAffinityBonus).toBe(true);
    
    // Poderes genéricos não têm bônus de afinidade
    const aprender = list.find(p => p.id === 'aprender-ritual');
    expect(aprender?.hasAffinityBonus).toBe(false);
  });
});
