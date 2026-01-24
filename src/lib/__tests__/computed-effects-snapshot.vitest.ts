/**
 * =====================================================
 * Testes de Snapshot para ComputedEffects
 * Ordem Paranormal RPG v1.3 - SUE
 * =====================================================
 * 
 * Estes testes garantem a estabilidade da estrutura de dados
 * ComputedEffects, detectando mudanças não-intencionais
 * na interface do motor de efeitos.
 */

import { describe, it, expect } from 'vitest';
import {
  consolidateEffects,
  ComputedEffects,
  UnifiedEffect,
  EffectCalculationContext
} from '../unified-effects-engine';

// === Contexto base para testes ===
const createBaseContext = (overrides: Partial<EffectCalculationContext> = {}): EffectCalculationContext => ({
  attributes: { strength: 2, agility: 2, vigor: 2, intellect: 2, presence: 2 },
  nex: 50,
  hpCurrent: 30,
  hpMax: 30,
  peCurrent: 20,
  peMax: 20,
  inCombat: false,
  isFirstRound: false,
  currentRound: 0,
  hasShield: false,
  activeConditions: [],
  activatedEffects: [],
  ...overrides
});

// === Efeito de teste base ===
const createTestEffect = (overrides: Partial<UnifiedEffect> = {}): UnifiedEffect => ({
  id: 'test-effect',
  name: 'Efeito de Teste',
  source: 'class_power',
  sourceId: 'test-power',
  sourceName: 'Poder de Teste',
  mechanics: {},
  isActive: true,
  isToggleable: false,
  ...overrides
});

describe('ComputedEffects - Snapshot de Estrutura', () => {

  describe('Estrutura Base Vazia', () => {
    it('retorna estrutura completa mesmo sem efeitos', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      // Verifica que todas as propriedades principais existem
      expect(result).toHaveProperty('attack');
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('defense');
      expect(result).toHaveProperty('resistances');
      expect(result).toHaveProperty('damageReduction');
      expect(result).toHaveProperty('damageResistance');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('resources');
      expect(result).toHaveProperty('movement');
      expect(result).toHaveProperty('initiative');
      expect(result).toHaveProperty('specialEffects');
      expect(result).toHaveProperty('proficiencies');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('toggleableEffects');
      expect(result).toHaveProperty('rituals');
    });

    it('estrutura de attack tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.attack).toEqual({
        general: 0,
        melee: 0,
        ranged: 0,
        breakdown: []
      });
    });

    it('estrutura de damage tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.damage).toEqual({
        general: 0,
        melee: 0,
        ranged: 0,
        firearm: 0,
        extraDice: [],
        breakdown: []
      });
    });

    it('estrutura de defense tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.defense).toEqual({
        general: 0,
        vsMelee: 0,
        vsRanged: 0,
        breakdown: []
      });
    });

    it('estrutura de resistances tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.resistances).toEqual({
        fortitude: 0,
        reflexos: 0,
        vontade: 0,
        breakdown: []
      });
    });

    it('estrutura de flags tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.flags).toEqual({
        cannotAct: false,
        cannotReact: false,
        cannotMove: false,
        isHelpless: false,
        isUnconscious: false
      });
    });

    it('estrutura de rituals tem formato correto', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(result.rituals).toEqual({
        dtBonus: 0,
        dtBonusByElement: {},
        damageBonus: 0,
        damageAttributeBonus: null,
        peReduction: 0,
        peReductionByElement: {},
        peReductionByRange: {},
        availableModifiers: [],
        breakdown: []
      });
    });
  });

  describe('Snapshot com Efeitos Aplicados', () => {
    it('snapshot de combatente com golpe pesado', () => {
      const context = createBaseContext({ inCombat: true });
      const effect = createTestEffect({
        id: 'golpe-pesado',
        name: 'Golpe Pesado',
        sourceName: 'Golpe Pesado',
        source: 'class_power',
        mechanics: {
          meleeDamageBonus: 2
        }
      });

      const result = consolidateEffects([effect], context);

      expect(result.damage.melee).toBe(2);
      expect(result.damage.breakdown).toContainEqual(
        expect.objectContaining({
          source: 'Golpe Pesado',
          value: 2
        })
      );
    });

    it('snapshot de ocultista com ritual potente', () => {
      const context = createBaseContext({
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 4, presence: 2 }
      });
      const effect = createTestEffect({
        id: 'ritual-potente',
        name: 'Ritual Potente',
        sourceName: 'Ritual Potente',
        source: 'class_power',
        mechanics: {
          ritualDamageAttributeBonus: 'intellect'
        }
      });

      const result = consolidateEffects([effect], context);

      expect(result.rituals.damageAttributeBonus).toBe('intellect');
      expect(result.rituals.breakdown).toContainEqual(
        expect.objectContaining({
          source: 'Ritual Potente'
        })
      );
    });

    it('snapshot de condição desprevenido', () => {
      const context = createBaseContext({
        activeConditions: ['desprevenido']
      });
      const effect = createTestEffect({
        id: 'condition-desprevenido',
        name: 'Desprevenido',
        sourceName: 'Desprevenido',
        source: 'condition',
        mechanics: {
          defenseBonus: -5
        }
      });

      const result = consolidateEffects([effect], context);

      expect(result.defense.general).toBe(-5);
      expect(result.defense.breakdown).toContainEqual(
        expect.objectContaining({
          source: 'Desprevenido',
          value: -5
        })
      );
    });

    it('snapshot de múltiplas fontes consolidadas', () => {
      const context = createBaseContext({ inCombat: true });
      const effects: UnifiedEffect[] = [
        createTestEffect({
          id: 'poder-1',
          name: 'Golpe Pesado',
          source: 'class_power',
          mechanics: { meleeDamageBonus: 2 }
        }),
        createTestEffect({
          id: 'trilha-1',
          name: 'Guerreiro - Ataque Especial',
          source: 'track',
          mechanics: { attackBonus: 2, meleeDamageBonus: 3 }
        }),
        createTestEffect({
          id: 'condition-1',
          name: 'Abençoado',
          source: 'condition',
          mechanics: { attackBonus: 1 }
        })
      ];

      const result = consolidateEffects(effects, context);

      // Verifica consolidação correta
      expect(result.attack.general).toBe(3); // 2 + 1
      expect(result.damage.melee).toBe(5); // 2 + 3
      expect(result.attack.breakdown).toHaveLength(2);
      expect(result.damage.breakdown).toHaveLength(2);
    });
  });

  describe('Snapshot de Tipos de Dados', () => {
    it('breakdown sempre é array', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(Array.isArray(result.attack.breakdown)).toBe(true);
      expect(Array.isArray(result.damage.breakdown)).toBe(true);
      expect(Array.isArray(result.defense.breakdown)).toBe(true);
      expect(Array.isArray(result.resistances.breakdown)).toBe(true);
      expect(Array.isArray(result.resources.breakdown)).toBe(true);
      expect(Array.isArray(result.movement.breakdown)).toBe(true);
      expect(Array.isArray(result.initiative.breakdown)).toBe(true);
      expect(Array.isArray(result.rituals.breakdown)).toBe(true);
    });

    it('valores numéricos são números', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(typeof result.attack.general).toBe('number');
      expect(typeof result.damage.melee).toBe('number');
      expect(typeof result.defense.general).toBe('number');
      expect(typeof result.resistances.fortitude).toBe('number');
      expect(typeof result.resources.hpBonus).toBe('number');
      expect(typeof result.movement.bonus).toBe('number');
      expect(typeof result.initiative.bonus).toBe('number');
      expect(typeof result.rituals.dtBonus).toBe('number');
    });

    it('flags são booleanos', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(typeof result.flags.cannotAct).toBe('boolean');
      expect(typeof result.flags.cannotReact).toBe('boolean');
      expect(typeof result.flags.cannotMove).toBe('boolean');
      expect(typeof result.flags.isHelpless).toBe('boolean');
      expect(typeof result.flags.isUnconscious).toBe('boolean');
    });

    it('objetos de bônus por tipo são objetos', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      expect(typeof result.damageReduction.byType).toBe('object');
      expect(typeof result.damageResistance).toBe('object');
      expect(typeof result.skills).toBe('object');
      expect(typeof result.rituals.dtBonusByElement).toBe('object');
      expect(typeof result.rituals.peReductionByElement).toBe('object');
    });
  });

  describe('Regressão de Interface', () => {
    it('não adiciona propriedades inesperadas', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      // Lista de propriedades esperadas de primeiro nível
      const expectedKeys = [
        'attack', 'damage', 'critical', 'defense',
        'resistances', 'damageReduction', 'damageResistance',
        'skills', 'resources', 'movement', 'initiative',
        'specialEffects', 'proficiencies', 'flags',
        'toggleableEffects', 'rituals',
        'combatAdvanced', 'inventory', 'counterSpellAbilities',
        'sneakAttack', 'healing', 'leadership', 'allyBuff',
        'socialEffect', 'contacts', 'copyAbility', 'technician',
        'support', 'occultist'
      ];

      const actualKeys = Object.keys(result);

      // Verifica que não há chaves extras
      for (const key of actualKeys) {
        expect(expectedKeys).toContain(key);
      }

      // Verifica que todas as chaves esperadas existem
      for (const key of expectedKeys) {
        expect(actualKeys).toContain(key);
      }
    });

    it('estrutura de attack não muda', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      const attackKeys = Object.keys(result.attack);
      expect(attackKeys).toEqual(['general', 'melee', 'ranged', 'breakdown']);
    });

    it('estrutura de rituals não muda', () => {
      const context = createBaseContext();
      const result = consolidateEffects([], context);

      const ritualKeys = Object.keys(result.rituals).sort();
      const expectedKeys = [
        'availableModifiers', 'breakdown', 'damageAttributeBonus',
        'damageBonus', 'dtBonus', 'dtBonusByElement',
        'peReduction', 'peReductionByElement', 'peReductionByRange'
      ].sort();

      expect(ritualKeys).toEqual(expectedKeys);
    });
  });
});
