/**
 * Testes: Integração SUE com funções de rolagem
 * Ordem Paranormal RPG v1.3
 * 
 * Valida que as funções *WithContext integram corretamente
 * os bônus do Sistema Unificado de Efeitos (SUE).
 * 
 * @module roll-with-sue-integration.vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollAttackWithContext, type AttackRollContext } from '../rules-engine/helpers/attack-with-sue';
import { rollSkillCheckWithContext, type SkillCheckContext } from '../rules-engine/helpers/skill-check-with-sue';
import { rollInitiativeWithContext, type InitiativeRollContext } from '../rules-engine/helpers/initiative-with-sue';
import { rollResistanceCheckWithContext, type ResistanceCheckContext } from '../rules-engine/helpers/resistance-check-with-sue';
import { rollDamageWithContext, type DamageRollContext } from '../rules-engine/apply-and-roll';
import type { CharacterState } from '../rules-engine/types';

// =====================================================
// FIXTURES
// =====================================================

/**
 * Cria um estado de personagem base para testes
 */
function createTestCharacterState(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    id: 'test-char-1',
    name: 'Agente Teste',
    playerName: 'Jogador Teste',
    characterClass: 'Combatente',
    classTrack: 'aniquilador',
    nex: 50,
    origin: 'Militar',
    attributes: {
      strength: 3,
      agility: 2,
      vigor: 2,
      intellect: 1,
      presence: 0,
    },
    skills: {
      'luta': 'treinado',
      'pontaria': 'veterano',
      'atletismo': 'treinado',
      'percepcao': 'destreinado',
    },
    classPowers: ['ataque-especial'],
    generalPowers: [],
    paranormalPowers: [],
    trackAbilities: ['tecnica-letal'],
    rituals: [],
    sustainedRituals: [],
    equippedArmor: {
      id: 'armor-1',
      name: 'Colete Balístico',
      category: 'leve',
      defenseBonus: 5,
    },
    equippedWeapons: [
      {
        id: 'weapon-1',
        name: 'Espada Tática',
        category: 'tática',
        damage: '2d6',
        criticalMargin: 19,
        criticalMultiplier: 2,
        attackAttribute: 'strength',
        attackSkill: 'luta',
        isEquipped: true,
        properties: ['versátil'],
      },
      {
        id: 'weapon-2',
        name: 'Pistola .40',
        category: 'armas de fogo',
        damage: '2d6',
        criticalMargin: 20,
        criticalMultiplier: 3,
        range: 'curto',
        attackAttribute: 'agility',
        attackSkill: 'pontaria',
        isEquipped: true,
        temporaryBuffs: [
          {
            sourceId: 'ritual-1',
            sourceName: 'Amaldiçoar Arma',
            bonusDamage: '1d6',
            bonusAttack: 2,
            element: 'Morte',
          },
        ],
      },
    ],
    inventory: [],
    activeConditions: [],
    hpCurrent: 40,
    peCurrent: 15,
    sanCurrent: 30,
    ...overrides,
  };
}

// =====================================================
// TESTES: rollAttackWithContext
// =====================================================

describe('rollAttackWithContext', () => {
  describe('Integração com arma corpo a corpo', () => {
    it('deve calcular ataque com bônus de Força e Luta', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'weapon-1',
        targetDefense: 20,
      };
      
      const result = rollAttackWithContext(context);
      
      expect(result.success).toBeDefined();
      expect(result.roll).toBeDefined();
      expect(result.attackBreakdown).toBeDefined();
      expect(result.attackBreakdown.attribute.name).toBe('Força');
      expect(result.attackBreakdown.attribute.value).toBe(3);
      expect(result.attackBreakdown.skillBonus).toBe(5); // Treinado
    });
    
    it('deve retornar erro se arma não existir', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'arma-inexistente',
      };
      
      const result = rollAttackWithContext(context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Arma não encontrada');
    });
    
    it('deve incluir modificador manual no cálculo', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'weapon-1',
        manualModifiers: 5,
      };
      
      const result = rollAttackWithContext(context);
      
      expect(result.attackBreakdown.manualModifiers).toBe(5);
      // Total inclui o modificador
      expect(result.breakdown.components.some(c => c.label === 'Modificador' && c.value === 5)).toBe(true);
    });
  });
  
  describe('Integração com arma à distância', () => {
    it('deve calcular ataque com bônus de Agilidade e Pontaria', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'weapon-2',
        targetDefense: 15,
      };
      
      const result = rollAttackWithContext(context);
      
      expect(result.attackBreakdown.attribute.name).toBe('Agilidade');
      expect(result.attackBreakdown.attribute.value).toBe(2);
      expect(result.attackBreakdown.skillBonus).toBe(10); // Veterano
    });
    
    it('deve incluir bônus de buff de arma (ritual)', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'weapon-2',
      };
      
      const result = rollAttackWithContext(context);
      
      // Buff de Amaldiçoar Arma dá +2 ataque
      const buffSource = result.attackBreakdown.sueBonuses.find(
        s => s.name === 'Amaldiçoar Arma'
      );
      expect(buffSource).toBeDefined();
      expect(buffSource!.value).toBe(2);
    });
  });
  
  describe('Margem de crítico', () => {
    it('deve usar margem de crítico da arma', () => {
      const state = createTestCharacterState();
      const context: AttackRollContext = {
        characterState: state,
        weaponId: 'weapon-1',
      };
      
      const result = rollAttackWithContext(context);
      
      // Espada tem margem 19
      expect(result.attackBreakdown.criticalThreshold).toBeLessThanOrEqual(19);
    });
  });
});

// =====================================================
// TESTES: rollSkillCheckWithContext
// =====================================================

describe('rollSkillCheckWithContext', () => {
  describe('Cálculo básico', () => {
    it('deve calcular teste de perícia treinada', () => {
      const state = createTestCharacterState();
      const context: SkillCheckContext = {
        characterState: state,
        skill: 'atletismo',
        dt: 15,
      };
      
      const result = rollSkillCheckWithContext(context);
      
      expect(result.skillCheckBreakdown).toBeDefined();
      expect(result.skillCheckBreakdown.skillName).toBe('atletismo');
      expect(result.skillCheckBreakdown.attribute.key).toBe('strength');
      expect(result.skillCheckBreakdown.trainingBonus).toBe(5); // Treinado
    });
    
    it('deve usar atributo correto para cada perícia', () => {
      const state = createTestCharacterState();
      
      // Teste de perícia de Intelecto
      const result = rollSkillCheckWithContext({
        characterState: state,
        skill: 'investigacao',
      });
      
      expect(result.skillCheckBreakdown.attribute.key).toBe('intellect');
      expect(result.skillCheckBreakdown.attribute.value).toBe(1);
    });
    
    it('deve permitir override de atributo', () => {
      const state = createTestCharacterState();
      const context: SkillCheckContext = {
        characterState: state,
        skill: 'intimidacao',
        attributeOverride: 'strength', // Conhecimento Aplicado ou situação especial
      };
      
      const result = rollSkillCheckWithContext(context);
      
      expect(result.skillCheckBreakdown.attribute.key).toBe('strength');
      expect(result.skillCheckBreakdown.attribute.value).toBe(3);
    });
  });
  
  describe('Níveis de treinamento', () => {
    it('deve aplicar bônus correto para Veterano (+10)', () => {
      const state = createTestCharacterState();
      const context: SkillCheckContext = {
        characterState: state,
        skill: 'pontaria',
      };
      
      const result = rollSkillCheckWithContext(context);
      
      expect(result.skillCheckBreakdown.trainingLevel).toBe('veterano');
      expect(result.skillCheckBreakdown.trainingBonus).toBe(10);
    });
    
    it('deve aplicar 0 para Destreinado', () => {
      const state = createTestCharacterState();
      const context: SkillCheckContext = {
        characterState: state,
        skill: 'percepcao',
      };
      
      const result = rollSkillCheckWithContext(context);
      
      expect(result.skillCheckBreakdown.trainingBonus).toBe(0);
    });
  });
  
  describe('DT e resultado', () => {
    it('deve comparar com DT quando fornecida', () => {
      const state = createTestCharacterState();
      const context: SkillCheckContext = {
        characterState: state,
        skill: 'atletismo',
        dt: 10,
      };
      
      const result = rollSkillCheckWithContext(context);
      
      expect(result.skillCheckBreakdown.dt).toBe(10);
      expect(result.breakdown.result).toContain('DT 10');
    });
  });
});

// =====================================================
// TESTES: rollInitiativeWithContext
// =====================================================

describe('rollInitiativeWithContext', () => {
  describe('Cálculo básico', () => {
    it('deve usar Agilidade como base', () => {
      const state = createTestCharacterState();
      const context: InitiativeRollContext = {
        characterState: state,
      };
      
      const result = rollInitiativeWithContext(context);
      
      expect(result.initiativeBreakdown.agilityBonus).toBe(2); // AGI do personagem
    });
    
    it('deve incluir modificador manual', () => {
      const state = createTestCharacterState();
      const context: InitiativeRollContext = {
        characterState: state,
        manualModifiers: 3,
      };
      
      const result = rollInitiativeWithContext(context);
      
      expect(result.initiativeBreakdown.manualModifiers).toBe(3);
    });
  });
  
  describe('Bônus de trilha', () => {
    it('deve aplicar bônus de Operações Especiais', () => {
      const state = createTestCharacterState({
        classTrack: 'operacoes-especiais',
      });
      const context: InitiativeRollContext = {
        characterState: state,
      };
      
      const result = rollInitiativeWithContext(context);
      
      // Operações Especiais dá bônus de iniciativa
      const trackBonus = result.initiativeBreakdown.sueBonuses.find(
        s => s.name === 'Operações Especiais'
      );
      expect(trackBonus).toBeDefined();
      expect(trackBonus!.value).toBeGreaterThan(0);
    });
  });
});

// =====================================================
// TESTES: rollResistanceCheckWithContext
// =====================================================

describe('rollResistanceCheckWithContext', () => {
  describe('Cálculo por tipo de resistência', () => {
    it('Fortitude deve usar Vigor', () => {
      const state = createTestCharacterState();
      const context: ResistanceCheckContext = {
        characterState: state,
        resistance: 'fortitude',
        dt: 15,
      };
      
      const result = rollResistanceCheckWithContext(context);
      
      expect(result.resistanceBreakdown.resistanceName).toBe('Fortitude');
      expect(result.resistanceBreakdown.attribute.name).toBe('Vigor');
      expect(result.resistanceBreakdown.attribute.value).toBe(2);
    });
    
    it('Reflexos deve usar Agilidade', () => {
      const state = createTestCharacterState();
      const context: ResistanceCheckContext = {
        characterState: state,
        resistance: 'reflexos',
        dt: 15,
      };
      
      const result = rollResistanceCheckWithContext(context);
      
      expect(result.resistanceBreakdown.resistanceName).toBe('Reflexos');
      expect(result.resistanceBreakdown.attribute.name).toBe('Agilidade');
      expect(result.resistanceBreakdown.attribute.value).toBe(2);
    });
    
    it('Vontade deve usar Presença', () => {
      const state = createTestCharacterState();
      const context: ResistanceCheckContext = {
        characterState: state,
        resistance: 'vontade',
        dt: 15,
      };
      
      const result = rollResistanceCheckWithContext(context);
      
      expect(result.resistanceBreakdown.resistanceName).toBe('Vontade');
      expect(result.resistanceBreakdown.attribute.name).toBe('Presença');
      expect(result.resistanceBreakdown.attribute.value).toBe(0);
    });
  });
  
  describe('Comparação com DT', () => {
    it('deve retornar passed=true quando total >= DT', () => {
      // Rodar múltiplas vezes para ter certeza estatística
      let foundPass = false;
      const state = createTestCharacterState({
        attributes: { strength: 3, agility: 5, vigor: 5, intellect: 1, presence: 0 },
      });
      
      for (let i = 0; i < 50; i++) {
        const result = rollResistanceCheckWithContext({
          characterState: state,
          resistance: 'fortitude',
          dt: 5, // DT baixa
        });
        
        if (result.resistanceBreakdown.passed && result.resistanceBreakdown.total >= 5) {
          foundPass = true;
          break;
        }
      }
      
      expect(foundPass).toBe(true);
    });
  });
});

// =====================================================
// TESTES: rollDamageWithContext
// =====================================================

describe('rollDamageWithContext', () => {
  describe('Cálculo básico de dano', () => {
    it('deve calcular dano de arma corpo a corpo com Força', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'weapon-1',
        isCritical: false,
      };
      
      const result = rollDamageWithContext(context);
      
      expect(result.success).toBe(true);
      expect(result.damageBreakdown).toBeDefined();
      expect(result.damageBreakdown.weaponDamage.formula).toBe('2d6');
      
      // Deve incluir bônus de Força
      const strengthBonus = result.damageBreakdown.bonuses.find(b => b.source === 'Força');
      expect(strengthBonus).toBeDefined();
      expect(strengthBonus!.value).toBe(3);
    });
    
    it('deve retornar erro se arma não existir', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'arma-inexistente',
        isCritical: false,
      };
      
      const result = rollDamageWithContext(context);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
  
  describe('Dano crítico', () => {
    it('deve aplicar multiplicador de crítico', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'weapon-1',
        isCritical: true,
      };
      
      const result = rollDamageWithContext(context);
      
      expect(result.damageBreakdown.criticalMultiplier).toBe(2); // x2 da espada
    });
    
    it('deve usar multiplicador x3 para arma de fogo', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'weapon-2',
        isCritical: true,
      };
      
      const result = rollDamageWithContext(context);
      
      expect(result.damageBreakdown.criticalMultiplier).toBe(3); // x3 da pistola
    });
  });
  
  describe('Buffs de arma', () => {
    it('deve incluir dano extra de ritual', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'weapon-2',
        isCritical: false,
      };
      
      const result = rollDamageWithContext(context);
      
      // Amaldiçoar Arma adiciona 1d6 Morte
      expect(result.damageBreakdown.buffDamage.length).toBeGreaterThan(0);
      
      const buffDamage = result.damageBreakdown.buffDamage[0];
      expect(buffDamage.formula).toContain('d6');
      expect(buffDamage.element).toBe('Morte');
    });
  });
  
  describe('Poderes especiais', () => {
    it('deve maximizar dados com Atirar para Matar em crítico', () => {
      const state = createTestCharacterState();
      const context: DamageRollContext = {
        characterState: state,
        weaponId: 'weapon-2',
        isCritical: true,
        activatedPowers: ['atirar-para-matar'],
      };
      
      const result = rollDamageWithContext(context);
      
      // Com atirar-para-matar, todos os dados devem ser maximizados
      // 2d6 maximizado = 12 por dado (antes do multiplicador)
      expect(result.damageBreakdown.weaponDamage.rolls.every(r => r === 6)).toBe(true);
    });
  });
});
