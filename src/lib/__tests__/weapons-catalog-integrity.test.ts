/**
 * Testes de Integridade: Catálogo de Armas e Sistema de Combate
 * 
 * Valida a sincronização entre weapons-catalog.ts, weapon-type-inference.ts
 * e o sistema de combate do Ordem Paranormal RPG.
 * 
 * @see src/lib/weapons-catalog.ts
 * @see src/lib/weapon-type-inference.ts
 */

import { describe, it, expect } from 'vitest';
import {
  // Listas de armas
  SIMPLE_MELEE_WEAPONS,
  SIMPLE_RANGED_WEAPONS,
  SIMPLE_FIREARMS,
  TACTICAL_MELEE_WEAPONS,
  TACTICAL_RANGED_WEAPONS,
  TACTICAL_FIREARMS,
  HEAVY_WEAPONS,
  WEAPON_EXPLOSIVES as EXPLOSIVES,
  SPECIAL_WEAPONS,
  // Listas agregadas
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  FIREARMS,
  THROWN_WEAPONS,
  ALL_WEAPONS,
  // Modificações
  MELEE_WEAPON_MODIFICATIONS,
  FIREARM_MODIFICATIONS,
  ALL_WEAPON_MODIFICATIONS,
  // Funções
  getWeaponById,
  getWeaponsByCategory,
  getWeaponsByType,
  getWeaponsByProficiency,
  getWeaponModificationById,
  canApplyModification,
  getAvailableModifications,
  getModifiedCategory,
  calculateModifiedWeaponStats,
  // Tipos
  type CatalogWeapon,
  type WeaponModification,
} from '../catalogs';
import {
  inferWeaponType,
  isFirearm,
  isMeleeWeapon,
  isRangedWeapon,
} from '../weapon-type-inference';

// Falhar claramente se uma fixture desaparecer, em vez de não executar suas asserções.
function requireWeapon(id: string): CatalogWeapon {
  const weapon = getWeaponById(id);
  expect(weapon, `Arma de referência ausente: ${id}`).toBeDefined();
  return weapon!;
}

// Base 1.3, tabela 3.3, p. 57: duas armas de fogo pesadas não causam dano balístico.
function expectFirearmDamageType(weapon: CatalogWeapon): void {
  const expected = weapon.id === 'bazuca' ? 'Impacto'
    : weapon.id === 'lanca_chamas' ? 'Fogo' : 'Balístico';
  expect(weapon.damageType, weapon.id).toBe(expected);
}

// ========================================
// 1. TESTES DE ESTRUTURA DO CATÁLOGO
// ========================================

describe('weapons-catalog.ts - Estrutura do Catálogo', () => {
  describe('Composição de ALL_WEAPONS', () => {
    it('deve conter todas as armas de SIMPLE_MELEE_WEAPONS', () => {
      SIMPLE_MELEE_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de SIMPLE_RANGED_WEAPONS', () => {
      SIMPLE_RANGED_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de SIMPLE_FIREARMS', () => {
      SIMPLE_FIREARMS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de TACTICAL_MELEE_WEAPONS', () => {
      TACTICAL_MELEE_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de TACTICAL_RANGED_WEAPONS', () => {
      TACTICAL_RANGED_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de TACTICAL_FIREARMS', () => {
      TACTICAL_FIREARMS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de HEAVY_WEAPONS', () => {
      HEAVY_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de EXPLOSIVES', () => {
      EXPLOSIVES.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('deve conter todas as armas de SPECIAL_WEAPONS', () => {
      SPECIAL_WEAPONS.forEach(weapon => {
        expect(ALL_WEAPONS.find(w => w.id === weapon.id)).toBeDefined();
      });
    });

    it('ALL_WEAPONS deve ter o total correto de armas', () => {
      const expectedTotal = 
        SIMPLE_MELEE_WEAPONS.length +
        SIMPLE_RANGED_WEAPONS.length +
        SIMPLE_FIREARMS.length +
        TACTICAL_MELEE_WEAPONS.length +
        TACTICAL_RANGED_WEAPONS.length +
        TACTICAL_FIREARMS.length +
        HEAVY_WEAPONS.length +
        EXPLOSIVES.length +
        SPECIAL_WEAPONS.length;
      
      expect(ALL_WEAPONS.length).toBe(expectedTotal);
    });
  });

  describe('Unicidade de IDs', () => {
    it('todos os IDs em ALL_WEAPONS devem ser únicos', () => {
      const ids = ALL_WEAPONS.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('não deve haver IDs vazios ou undefined', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.id).toBeDefined();
        expect(weapon.id).not.toBe('');
      });
    });
  });

  describe('Campos Obrigatórios', () => {
    it('todas as armas devem ter campo id', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.id).toBeDefined();
        expect(typeof weapon.id).toBe('string');
      });
    });

    it('todas as armas devem ter campo name', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.name).toBeDefined();
        expect(typeof weapon.name).toBe('string');
        expect(weapon.name.length).toBeGreaterThan(0);
      });
    });

    it('todas as armas devem ter campo category', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.category).toBeDefined();
      });
    });

    it('todas as armas devem ter campo type', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.type).toBeDefined();
      });
    });

    it('todas as armas devem ter campo damage', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.damage).toBeDefined();
        expect(typeof weapon.damage).toBe('string');
      });
    });

    it('todas as armas devem ter campo damageType', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.damageType).toBeDefined();
        expect(typeof weapon.damageType).toBe('string');
      });
    });

    it('todas as armas devem ter campo critical', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.critical).toBeDefined();
        expect(typeof weapon.critical).toBe('number');
      });
    });

    it('todas as armas devem ter campo criticalMultiplier', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.criticalMultiplier).toBeDefined();
        expect(typeof weapon.criticalMultiplier).toBe('number');
      });
    });

    it('todas as armas devem ter campo spaces', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.spaces).toBeDefined();
        expect(typeof weapon.spaces).toBe('number');
      });
    });

    it('todas as armas devem ter campo proficiency', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.proficiency).toBeDefined();
      });
    });
  });
});

// ========================================
// 2. TESTES DE TIPOS E VALORES VÁLIDOS
// ========================================

describe('weapons-catalog.ts - Tipos e Valores Válidos', () => {
  const VALID_CATEGORIES = ['0', 'I', 'II', 'III', 'IV', 'especial'] as const;
  const VALID_TYPES = ['melee', 'ranged', 'firearm', 'thrown'] as const;
  const VALID_PROFICIENCIES = ['simples', 'tatica', 'pesada'] as const;

  describe('Categorias', () => {
    it('todas as categorias devem ser válidas', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(VALID_CATEGORIES).toContain(weapon.category);
      });
    });

    it('categoria I deve existir', () => {
      const cat1 = ALL_WEAPONS.filter(w => w.category === 'I');
      expect(cat1.length).toBeGreaterThan(0);
    });

    it('categoria II deve existir', () => {
      const cat2 = ALL_WEAPONS.filter(w => w.category === 'II');
      expect(cat2.length).toBeGreaterThan(0);
    });
  });

  describe('Tipos de Arma', () => {
    it('todos os tipos devem ser válidos', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(VALID_TYPES).toContain(weapon.type);
      });
    });

    it('deve haver armas melee', () => {
      const meleeCount = ALL_WEAPONS.filter(w => w.type === 'melee').length;
      expect(meleeCount).toBeGreaterThan(0);
    });

    it('deve haver armas ranged', () => {
      const rangedCount = ALL_WEAPONS.filter(w => w.type === 'ranged').length;
      expect(rangedCount).toBeGreaterThan(0);
    });

    it('deve haver armas firearm', () => {
      const firearmCount = ALL_WEAPONS.filter(w => w.type === 'firearm').length;
      expect(firearmCount).toBeGreaterThan(0);
    });
  });

  describe('Proficiências', () => {
    it('todas as proficiências devem ser válidas', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(VALID_PROFICIENCIES).toContain(weapon.proficiency);
      });
    });

    it('deve haver armas simples', () => {
      const simplesCount = ALL_WEAPONS.filter(w => w.proficiency === 'simples').length;
      expect(simplesCount).toBeGreaterThan(0);
    });

    it('deve haver armas táticas', () => {
      const taticaCount = ALL_WEAPONS.filter(w => w.proficiency === 'tatica').length;
      expect(taticaCount).toBeGreaterThan(0);
    });

    it('deve haver armas pesadas', () => {
      const pesadaCount = ALL_WEAPONS.filter(w => w.proficiency === 'pesada').length;
      expect(pesadaCount).toBeGreaterThan(0);
    });
  });

  describe('Valores de Crítico', () => {
    it('critical deve estar entre 1 e 20', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.critical).toBeGreaterThanOrEqual(1);
        expect(weapon.critical).toBeLessThanOrEqual(20);
      });
    });

    it('criticalMultiplier deve estar entre 2 e 4', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.criticalMultiplier).toBeGreaterThanOrEqual(2);
        expect(weapon.criticalMultiplier).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Espaços de Inventário', () => {
    it('spaces deve ser maior ou igual a 0', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.spaces).toBeGreaterThanOrEqual(0);
      });
    });

    it('spaces não deve exceder 4 (armas ocupam no máximo 4 espaços)', () => {
      ALL_WEAPONS.forEach(weapon => {
        expect(weapon.spaces).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Formato de Dano', () => {
    it('damage deve seguir padrão de dados (ex: 1d6, 2d8)', () => {
      const dicePattern = /^\d+d\d+(\+\d+)?(\/\d+d\d+)?$/;
      ALL_WEAPONS.forEach(weapon => {
        // Contrato personalizado já existente: munição soma dano à arma que a dispara.
        if (weapon.id === 'municao_consagrada') {
          expect(weapon.damage).toBe('+1d6');
        } else {
          expect(weapon.damage, weapon.id).toMatch(dicePattern);
        }
      });
    });
  });
});

// ========================================
// 3. TESTES DE CONSISTÊNCIA DE DADOS
// ========================================

describe('weapons-catalog.ts - Consistência de Dados', () => {
  describe('Armas de Fogo', () => {
    it('armas de fogo devem ter ammoType definido', () => {
      const firearms = ALL_WEAPONS.filter(w => w.type === 'firearm');
      firearms.forEach(weapon => {
        expect(weapon.ammoType).toBeDefined();
        expect(weapon.ammoType).not.toBe('');
      });
    });

    it('armas de fogo devem ter range diferente de "Corpo a corpo"', () => {
      const firearms = ALL_WEAPONS.filter(w => w.type === 'firearm');
      firearms.forEach(weapon => {
        expect(weapon.range).not.toBe('Corpo a corpo');
      });
    });

    it('armas de fogo devem preservar dano balístico e as exceções pesadas da tabela 3.3', () => {
      const firearms = ALL_WEAPONS.filter(w => w.type === 'firearm');
      firearms.forEach(weapon => {
        expectFirearmDamageType(weapon);
      });
    });
  });

  describe('Armas Corpo a Corpo', () => {
    it('armas melee devem ter range "Corpo a corpo" ou alcance curto se arremessável', () => {
      const meleeWeapons = ALL_WEAPONS.filter(w => w.type === 'melee');
      meleeWeapons.forEach(weapon => {
        if (weapon.range && !weapon.properties?.includes('Arremessável')) {
          expect(weapon.range).toBe('Corpo a corpo');
        }
      });
    });

    it('armas melee não usam munição, preservando combustível personalizado da motosserra', () => {
      const meleeWeapons = ALL_WEAPONS.filter(w => w.type === 'melee');
      meleeWeapons.forEach(weapon => {
        // Consumo de combustível é configuração local; não é regra afirmada pelo livro.
        expect(weapon.ammoType, weapon.id).toBe(weapon.id === 'motosserra' ? 'combustivel' : undefined);
      });
    });
  });

  describe('Armas de Arremesso', () => {
    it('armas thrown devem ter range definido', () => {
      const thrownWeapons = ALL_WEAPONS.filter(w => w.type === 'thrown');
      thrownWeapons.forEach(weapon => {
        expect(weapon.range).toBeDefined();
      });
    });
  });

  describe('Armas Ranged', () => {
    it('armas ranged têm alcance próprio, exceto munição consagrada personalizada', () => {
      const rangedWeapons = ALL_WEAPONS.filter(w => w.type === 'ranged');
      rangedWeapons.forEach(weapon => {
        if (weapon.id === 'municao_consagrada') {
          expect(weapon.range).toBeUndefined();
          expect(weapon.properties).toContain('Consumível');
          expect(weapon.damage).toBe('+1d6');
        } else {
          expect(weapon.range, weapon.id).toBeDefined();
        }
      });
    });
  });

  describe('Listas Agregadas', () => {
    it('MELEE_WEAPONS deve conter apenas armas melee', () => {
      MELEE_WEAPONS.forEach(weapon => {
        expect(weapon.type).toBe('melee');
      });
    });

    it('RANGED_WEAPONS deve conter apenas armas ranged', () => {
      RANGED_WEAPONS.forEach(weapon => {
        expect(weapon.type).toBe('ranged');
      });
    });

    it('FIREARMS deve conter apenas armas firearm', () => {
      FIREARMS.forEach(weapon => {
        expect(weapon.type).toBe('firearm');
      });
    });

    it('THROWN_WEAPONS deve conter apenas armas thrown', () => {
      THROWN_WEAPONS.forEach(weapon => {
        expect(weapon.type).toBe('thrown');
      });
    });
  });
});

// ========================================
// 4. TESTES DO SISTEMA DE MODIFICAÇÕES
// ========================================

describe('weapons-catalog.ts - Sistema de Modificações', () => {
  describe('Listas de Modificações', () => {
    it('MELEE_WEAPON_MODIFICATIONS deve ter 5 modificações', () => {
      expect(MELEE_WEAPON_MODIFICATIONS.length).toBe(5);
    });

    it('FIREARM_MODIFICATIONS deve ter 10 modificações', () => {
      expect(FIREARM_MODIFICATIONS.length).toBe(10);
    });

    it('ALL_WEAPON_MODIFICATIONS deve ser a soma das três listas', () => {
      expect(ALL_WEAPON_MODIFICATIONS.length).toBe(
        MELEE_WEAPON_MODIFICATIONS.length + FIREARM_MODIFICATIONS.length + 2 // +2 para munições
      );
    });
  });

  describe('Campos de Modificações', () => {
    it('todas as modificações devem ter id', () => {
      ALL_WEAPON_MODIFICATIONS.forEach(mod => {
        expect(mod.id).toBeDefined();
        expect(typeof mod.id).toBe('string');
      });
    });

    it('todas as modificações devem ter name', () => {
      ALL_WEAPON_MODIFICATIONS.forEach(mod => {
        expect(mod.name).toBeDefined();
        expect(mod.name.length).toBeGreaterThan(0);
      });
    });

    it('todas as modificações devem ter description', () => {
      ALL_WEAPON_MODIFICATIONS.forEach(mod => {
        expect(mod.description).toBeDefined();
        expect(mod.description.length).toBeGreaterThan(0);
      });
    });

    it('todas as modificações devem ter applicableTo', () => {
      ALL_WEAPON_MODIFICATIONS.forEach(mod => {
        expect(mod.applicableTo).toBeDefined();
        expect(Array.isArray(mod.applicableTo)).toBe(true);
        expect(mod.applicableTo.length).toBeGreaterThan(0);
      });
    });

    it('todas as modificações devem ter categoryIncrease', () => {
      ALL_WEAPON_MODIFICATIONS.forEach(mod => {
        expect(mod.categoryIncrease).toBeDefined();
        expect(typeof mod.categoryIncrease).toBe('number');
        expect(mod.categoryIncrease).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('IDs de Modificações', () => {
    it('IDs de modificações devem ser únicos', () => {
      const ids = ALL_WEAPON_MODIFICATIONS.map(m => m.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('modificações melee específicas devem existir', () => {
      const meleeIds = MELEE_WEAPON_MODIFICATIONS.map(m => m.id);
      expect(meleeIds).toContain('certeira');
      expect(meleeIds).toContain('perigosa');
      expect(meleeIds).toContain('cruel');
      expect(meleeIds).toContain('discreta_melee');
      expect(meleeIds).toContain('tatica_melee');
    });

    it('modificações firearm específicas devem existir', () => {
      const firearmIds = FIREARM_MODIFICATIONS.map(m => m.id);
      expect(firearmIds).toContain('calibre_grosso');
      expect(firearmIds).toContain('mira_laser');
      expect(firearmIds).toContain('compensador');
      expect(firearmIds).toContain('alongada');
      expect(firearmIds).toContain('discreta_firearm');
      expect(firearmIds).toContain('ferrolho_automatico');
      expect(firearmIds).toContain('mira_telescopica');
      expect(firearmIds).toContain('silenciador');
      expect(firearmIds).toContain('tatica_firearm');
      expect(firearmIds).toContain('visao_de_calor');
    });
  });

  describe('getWeaponModificationById', () => {
    it('deve retornar modificação correta por ID', () => {
      const certeira = getWeaponModificationById('certeira');
      expect(certeira).toBeDefined();
      expect(certeira?.name).toBe('Certeira');
    });

    it('deve retornar undefined para ID inválido', () => {
      const invalid = getWeaponModificationById('inexistente' as WeaponModification);
      expect(invalid).toBeUndefined();
    });
  });
});

// ========================================
// 5. TESTES DE APLICAÇÃO DE MODIFICAÇÕES
// ========================================

describe('weapons-catalog.ts - Aplicação de Modificações', () => {
  describe('canApplyModification', () => {
    it('deve bloquear modificações em explosivos', () => {
      const explosive = EXPLOSIVES[0];
      if (explosive) {
        expect(canApplyModification(explosive, 'certeira')).toBe(false);
      }
    });

    it('deve bloquear modificações em categoria especial (coronhada)', () => {
      const special = requireWeapon('coronhada');
      expect(special.category).toBe('especial');
      expect(canApplyModification(special, 'certeira')).toBe(false);
    });

    it('modificações melee não devem aplicar a firearms', () => {
      const firearm = FIREARMS[0];
      if (firearm) {
        expect(canApplyModification(firearm, 'certeira')).toBe(false);
        expect(canApplyModification(firearm, 'tatica_melee')).toBe(false);
      }
    });

    it('modificações firearm não devem aplicar a melee', () => {
      const melee = MELEE_WEAPONS[0];
      if (melee) {
        expect(canApplyModification(melee, 'calibre_grosso')).toBe(false);
        expect(canApplyModification(melee, 'compensador')).toBe(false);
      }
    });

    it('modificações melee devem aplicar a armas melee', () => {
      const melee = requireWeapon('faca');
      expect(canApplyModification(melee, 'certeira')).toBe(true);
    });

    it('modificações firearm devem aplicar a armas firearm', () => {
      const firearm = FIREARMS[0];
      if (firearm) {
        expect(canApplyModification(firearm, 'calibre_grosso')).toBe(true);
      }
    });

    it('compensador exige arma automática (Base 1.3, p. 60)', () => {
      expect(canApplyModification(requireWeapon('pistola'), 'compensador')).toBe(false);
      expect(canApplyModification(requireWeapon('submetralhadora'), 'compensador')).toBe(true);
    });
  });

  describe('getAvailableModifications', () => {
    it('deve retornar modificações melee para armas melee', () => {
      const melee = requireWeapon('faca');
      const available = getAvailableModifications(melee);
      expect(available.length).toBeGreaterThan(0);
      // Todas as modificações disponíveis devem aplicar a melee
      available.forEach(mod => {
        expect(mod.applicableTo).toContain('melee');
      });
    });

    it('deve retornar modificações firearm para armas de fogo', () => {
      const firearm = FIREARMS[0];
      if (firearm) {
        const available = getAvailableModifications(firearm);
        expect(available.length).toBeGreaterThan(0);
        // Todas as modificações disponíveis devem aplicar a firearm
        available.forEach(mod => {
          expect(mod.applicableTo).toContain('firearm');
        });
      }
    });

    it('deve retornar lista vazia para explosivos', () => {
      const explosive = EXPLOSIVES[0];
      if (explosive) {
        const available = getAvailableModifications(explosive);
        expect(available.length).toBe(0);
      }
    });

    it('ferrolho automático instalado habilita compensador sem oferecer novamente o ferrolho', () => {
      const available = getAvailableModifications(requireWeapon('pistola'), ['ferrolho_automatico']);
      expect(available.map(mod => mod.id)).toContain('compensador');
      expect(available.map(mod => mod.id)).not.toContain('ferrolho_automatico');
      expect(canApplyModification({
        ...requireWeapon('pistola'), appliedModifications: ['ferrolho_automatico'],
      }, 'compensador')).toBe(true);
    });
  });
});

// ========================================
// 6. TESTES DE CÁLCULO DE ESTATÍSTICAS
// ========================================

describe('weapons-catalog.ts - Cálculo de Estatísticas Modificadas', () => {
  describe('getModifiedCategory', () => {
    it('categoria I + 1 aumento = categoria II', () => {
      const result = getModifiedCategory('I', ['certeira']);
      expect(result).toBe('II');
    });

    it('categoria II + 2 aumentos = categoria IV', () => {
      const result = getModifiedCategory('II', ['certeira', 'perigosa']);
      expect(result).toBe('IV');
    });

    it('categoria não deve exceder IV', () => {
      const result = getModifiedCategory('III', ['certeira', 'perigosa', 'cruel']);
      expect(result).toBe('IV');
    });

    it('categoria 0 + aumentos deve funcionar', () => {
      const result = getModifiedCategory('0', ['certeira']);
      expect(result).toBe('I');
    });
  });

  describe('calculateModifiedWeaponStats', () => {
    it('certeira deve adicionar +2 ao ataque (attackBonus)', () => {
      const melee = MELEE_WEAPONS.find(w => w.id === 'faca');
      if (melee) {
        const modified = calculateModifiedWeaponStats(melee, ['certeira']);
        expect(modified.attackBonus).toBe(2);
      }
    });

    // Efeitos conferidos na Base 1.3, p. 60–61, tabela 3.5.
    it('cruel deve adicionar +2 ao dano e preservar margem de crítico', () => {
      const melee = requireWeapon('martelo');
      const modified = calculateModifiedWeaponStats(melee, ['cruel']);
      expect(modified.damage).toBe('1d6+2');
      expect(modified.criticalMargin).toBe(melee.critical);
    });

    it('perigosa deve aumentar margem de ameaça em 2 e preservar dado de dano', () => {
      const melee = requireWeapon('faca');
      const modified = calculateModifiedWeaponStats(melee, ['perigosa']);
      expect(modified.damage).toBe('1d4');
      expect(modified.criticalMargin).toBe(17);
    });

    it('calibre_grosso deve adicionar um dado do mesmo tipo à pistola', () => {
      const firearm = requireWeapon('pistola');
      const modified = calculateModifiedWeaponStats(firearm, ['calibre_grosso']);
      expect(modified.damage).toBe('2d12');
    });

    it('compensador deve anular penalidade de rajada sem bônus fixo de ataque', () => {
      const firearm = requireWeapon('submetralhadora');
      const modified = calculateModifiedWeaponStats(firearm, ['compensador']);
      expect(modified.attackBonus).toBe(0);
      expect(modified.specialEffects).toContain('Anula penalidade por rajadas');
    });

    it('compensador inválido informa incompatibilidade e preserva lista/categoria legadas', () => {
      const modified = calculateModifiedWeaponStats(requireWeapon('pistola'), ['compensador']);
      expect(modified.specialEffects).toContain('Compensador exige uma arma automática; seu efeito não foi aplicado.');
      expect(modified.specialEffects).not.toContain('Anula penalidade por rajadas');
      expect(modified.modifications).toEqual(['compensador']);
      expect(modified.finalCategory).toBe('II');
      expect(modified.attackBonus).toBe(0);
    });

    it.each([
      ['compensador', 'ferrolho_automatico'],
      ['ferrolho_automatico', 'compensador'],
    ] as WeaponModification[][])('ferrolho e compensador funcionam na ordem %s, %s', (...modifications) => {
      const modified = calculateModifiedWeaponStats(requireWeapon('pistola'), modifications);
      expect(modified.addedProperties).toContain('Automática');
      expect(modified.specialEffects).toContain('Anula penalidade por rajadas');
      expect(modified.attackBonus).toBe(0);
      expect(modified.finalCategory).toBe('III');
    });

    it('múltiplas modificações devem acumular', () => {
      const melee = MELEE_WEAPONS.find(w => w.id === 'faca');
      if (melee) {
        const modified = calculateModifiedWeaponStats(melee, ['certeira', 'cruel']);
        expect(modified.attackBonus).toBe(2);
        expect(modified.damage).toBe('1d4+2');
        expect(modified.criticalMargin).toBe(melee.critical);
      }
    });

    it('categoria deve aumentar com modificações (finalCategory)', () => {
      const melee = MELEE_WEAPONS.find(w => w.category === 'I');
      if (melee) {
        const modified = calculateModifiedWeaponStats(melee, ['certeira']);
        expect(modified.finalCategory).toBe('II');
      }
    });
  });
});

// ========================================
// 7. TESTES DE FUNÇÕES DE BUSCA
// ========================================

describe('weapons-catalog.ts - Funções de Busca', () => {
  describe('getWeaponById', () => {
    it('deve encontrar armas existentes', () => {
      const faca = getWeaponById('faca');
      expect(faca).toBeDefined();
      expect(faca?.name).toBe('Faca');
    });

    it('deve encontrar armas de diferentes categorias', () => {
      const pistola = getWeaponById('pistola');
      expect(pistola).toBeDefined();
      expect(pistola?.type).toBe('firearm');
    });

    it('deve retornar undefined para IDs inválidos', () => {
      const invalid = getWeaponById('arma-inexistente');
      expect(invalid).toBeUndefined();
    });

    it('deve retornar undefined para string vazia', () => {
      const empty = getWeaponById('');
      expect(empty).toBeUndefined();
    });
  });

  describe('getWeaponsByCategory', () => {
    it('deve retornar armas da categoria I', () => {
      const cat1 = getWeaponsByCategory('I');
      expect(cat1.length).toBeGreaterThan(0);
      cat1.forEach(w => expect(w.category).toBe('I'));
    });

    it('deve retornar armas da categoria II', () => {
      const cat2 = getWeaponsByCategory('II');
      expect(cat2.length).toBeGreaterThan(0);
      cat2.forEach(w => expect(w.category).toBe('II'));
    });

    it('deve retornar lista vazia para categoria inexistente', () => {
      // @ts-expect-error - teste de categoria inválida
      const invalid = getWeaponsByCategory('X');
      expect(invalid.length).toBe(0);
    });
  });

  describe('getWeaponsByType', () => {
    it('deve retornar armas melee', () => {
      const melee = getWeaponsByType('melee');
      expect(melee.length).toBeGreaterThan(0);
      melee.forEach(w => expect(w.type).toBe('melee'));
    });

    it('deve retornar armas firearm', () => {
      const firearms = getWeaponsByType('firearm');
      expect(firearms.length).toBeGreaterThan(0);
      firearms.forEach(w => expect(w.type).toBe('firearm'));
    });

    it('deve retornar armas ranged', () => {
      const ranged = getWeaponsByType('ranged');
      expect(ranged.length).toBeGreaterThan(0);
      ranged.forEach(w => expect(w.type).toBe('ranged'));
    });
  });

  describe('getWeaponsByProficiency', () => {
    it('deve retornar armas simples', () => {
      const simples = getWeaponsByProficiency('simples');
      expect(simples.length).toBeGreaterThan(0);
      simples.forEach(w => expect(w.proficiency).toBe('simples'));
    });

    it('deve retornar armas táticas', () => {
      const tatica = getWeaponsByProficiency('tatica');
      expect(tatica.length).toBeGreaterThan(0);
      tatica.forEach(w => expect(w.proficiency).toBe('tatica'));
    });

    it('deve retornar armas pesadas', () => {
      const pesada = getWeaponsByProficiency('pesada');
      expect(pesada.length).toBeGreaterThan(0);
      pesada.forEach(w => expect(w.proficiency).toBe('pesada'));
    });
  });
});

// ========================================
// 8. TESTES DE INFERÊNCIA DE TIPO
// ========================================

describe('weapon-type-inference.ts - Inferência de Tipo de Arma', () => {
  describe('inferWeaponType', () => {
    it('preserva type do catálogo, incluindo arma melee arremessável e explosivo', () => {
      expect(inferWeaponType(requireWeapon('faca'))).toBe('melee');
      expect(inferWeaponType({ type: 'thrown', range: 'Curto' })).toBe('thrown');
      expect(inferWeaponType({ type: 'melee', ammoType: 'combustivel' })).toBe('melee');
    });

    it('weaponType do inventário tem prioridade sobre type e heurísticas', () => {
      expect(inferWeaponType({ weaponType: 'ranged', type: 'firearm', ammoType: 'balas_longas' })).toBe('ranged');
    });

    it('itens legados com flechas ou virotes são armas de disparo, mesmo com recarga', () => {
      expect(inferWeaponType({ ammoType: 'flechas', properties: ['Recarga'] })).toBe('ranged');
      expect(inferWeaponType({ ammoType: 'virotes' })).toBe('ranged');
    });

    it('combustível preserva tipo melee legado quando o alcance é corpo a corpo', () => {
      expect(inferWeaponType({ ammoType: 'combustivel', range: 'Corpo a corpo' })).toBe('melee');
      expect(inferWeaponType({ ammoType: 'combustivel', range: 'Curto' })).toBe('firearm');
    });
    it('deve retornar weaponType se já definido', () => {
      expect(inferWeaponType({ weaponType: 'melee' })).toBe('melee');
      expect(inferWeaponType({ weaponType: 'firearm' })).toBe('firearm');
      expect(inferWeaponType({ weaponType: 'ranged' })).toBe('ranged');
    });

    it('armas com ammoType devem ser firearm', () => {
      expect(inferWeaponType({ ammoType: 'Curta' })).toBe('firearm');
      expect(inferWeaponType({ ammoType: 'Longa' })).toBe('firearm');
      expect(inferWeaponType({ ammoType: 'Pesada' })).toBe('firearm');
    });

    it('armas com dano Balístico devem ser firearm', () => {
      expect(inferWeaponType({ damageType: 'Balístico' })).toBe('firearm');
      expect(inferWeaponType({ damageType: 'balistico' })).toBe('firearm');
    });

    it('armas com range "Corpo a corpo" devem ser melee', () => {
      expect(inferWeaponType({ range: 'Corpo a corpo' })).toBe('melee');
      expect(inferWeaponType({ range: 'corpo a corpo' })).toBe('melee');
    });

    it('armas com propriedade Arremessável devem ser ranged', () => {
      expect(inferWeaponType({ properties: ['Arremessável'] })).toBe('ranged');
      expect(inferWeaponType({ properties: ['arremessavel'] })).toBe('ranged');
    });

    it('armas com propriedades de fogo devem ser firearm', () => {
      expect(inferWeaponType({ properties: ['Automática'] })).toBe('firearm');
      expect(inferWeaponType({ properties: ['Recarga livre'] })).toBe('firearm');
      expect(inferWeaponType({ properties: ['Rajada'] })).toBe('firearm');
    });

    it('armas com alcance definido devem ser ranged', () => {
      expect(inferWeaponType({ range: 'Curto' })).toBe('ranged');
      expect(inferWeaponType({ range: 'Médio' })).toBe('ranged');
      expect(inferWeaponType({ range: 'Longo' })).toBe('ranged');
    });

    it('fallback deve ser melee', () => {
      expect(inferWeaponType({})).toBe('melee');
      expect(inferWeaponType({ damageType: 'Corte' })).toBe('melee');
    });
  });

  describe('isFirearm', () => {
    it('deve retornar true para armas de fogo', () => {
      expect(isFirearm({ ammoType: 'Curta' })).toBe(true);
      expect(isFirearm({ damageType: 'Balístico' })).toBe(true);
      expect(isFirearm({ weaponType: 'firearm' })).toBe(true);
    });

    it('deve retornar false para armas melee', () => {
      expect(isFirearm({ weaponType: 'melee' })).toBe(false);
      expect(isFirearm({ range: 'Corpo a corpo' })).toBe(false);
    });
  });

  describe('isMeleeWeapon', () => {
    it('deve retornar true para armas corpo a corpo', () => {
      expect(isMeleeWeapon({ weaponType: 'melee' })).toBe(true);
      expect(isMeleeWeapon({ range: 'Corpo a corpo' })).toBe(true);
    });

    it('deve retornar false para armas de fogo', () => {
      expect(isMeleeWeapon({ ammoType: 'Curta' })).toBe(false);
      expect(isMeleeWeapon({ weaponType: 'firearm' })).toBe(false);
    });
  });

  describe('isRangedWeapon', () => {
    it('deve retornar true para armas ranged', () => {
      expect(isRangedWeapon({ weaponType: 'ranged' })).toBe(true);
      expect(isRangedWeapon({ properties: ['Arremessável'] })).toBe(true);
    });

    it('deve retornar false para armas melee', () => {
      expect(isRangedWeapon({ weaponType: 'melee' })).toBe(false);
    });
  });
});

// ========================================
// 9. TESTES DE SINCRONIZAÇÃO COM SISTEMA DE COMBATE
// ========================================

describe('Sincronização Catálogo ↔ Sistema de Combate', () => {
  describe('Tipos do Catálogo', () => {
    it('tipos de arma devem ser consistentes com sistema de combate', () => {
      const validTypes = ['melee', 'ranged', 'firearm', 'thrown'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validTypes).toContain(weapon.type);
      });
    });
  });

  describe('Categorias do Catálogo', () => {
    it('categorias devem ser válidas para inventário', () => {
      const validCategories = ['0', 'I', 'II', 'III', 'IV', 'especial'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validCategories).toContain(weapon.category);
      });
    });
  });

  describe('Proficiências', () => {
    it('proficiências devem ser consistentes com sistema de classes', () => {
      const validProficiencies = ['simples', 'tatica', 'pesada'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validProficiencies).toContain(weapon.proficiency);
      });
    });
  });

  describe('Inferência de Tipo em Armas do Catálogo', () => {
    it('armas de fogo do catálogo devem ser identificadas corretamente', () => {
      FIREARMS.forEach(weapon => {
        expect(isFirearm(weapon)).toBe(true);
      });
    });

    it('armas melee do catálogo devem ser identificadas corretamente', () => {
      MELEE_WEAPONS.forEach(weapon => {
        expect(isMeleeWeapon(weapon)).toBe(true);
      });
    });

    it('armas ranged do catálogo devem ser identificadas corretamente', () => {
      RANGED_WEAPONS.forEach(weapon => {
        expect(isRangedWeapon(weapon)).toBe(true);
      });
    });
  });

  describe('Consistência Damage/DamageType', () => {
    it('armas de fogo devem ter dano da tabela 3.3, incluindo bazuca e lança-chamas', () => {
      FIREARMS.forEach(expectFirearmDamageType);
    });

    it('armas melee devem ter dano físico', () => {
      const physicalDamageTypes = ['Corte', 'Impacto', 'Perfuração'];
      MELEE_WEAPONS.forEach(weapon => {
        expect(physicalDamageTypes).toContain(weapon.damageType);
      });
    });
  });

  describe('Integridade de Referências', () => {
    it('todas as armas em sublistas por tipo devem estar em ALL_WEAPONS', () => {
      [...MELEE_WEAPONS, ...RANGED_WEAPONS, ...FIREARMS, ...THROWN_WEAPONS].forEach(weapon => {
        const found = ALL_WEAPONS.find(w => w.id === weapon.id);
        expect(found).toBeDefined();
      });
    });

    it('getWeaponById deve encontrar todas as armas', () => {
      ALL_WEAPONS.forEach(weapon => {
        const found = getWeaponById(weapon.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(weapon.id);
      });
    });
  });
});

// ========================================
// 9. TESTES DE SINCRONIZAÇÃO COM SISTEMA DE COMBATE
// ========================================

describe('Sincronização Catálogo ↔ Sistema de Combate', () => {
  describe('Tipos do Catálogo', () => {
    it('tipos de arma devem ser consistentes com sistema de combate', () => {
      const validTypes = ['melee', 'ranged', 'firearm', 'thrown'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validTypes).toContain(weapon.type);
      });
    });
  });

  describe('Categorias do Catálogo', () => {
    it('categorias devem ser válidas para inventário', () => {
      const validCategories = ['0', 'I', 'II', 'III', 'IV', 'especial'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validCategories).toContain(weapon.category);
      });
    });
  });

  describe('Proficiências', () => {
    it('proficiências devem ser consistentes com sistema de classes', () => {
      const validProficiencies = ['simples', 'tatica', 'pesada'];
      ALL_WEAPONS.forEach(weapon => {
        expect(validProficiencies).toContain(weapon.proficiency);
      });
    });
  });

  describe('Inferência de Tipo em Armas do Catálogo', () => {
    it('armas de fogo do catálogo devem ser identificadas corretamente', () => {
      FIREARMS.forEach(weapon => {
        expect(isFirearm(weapon)).toBe(true);
      });
    });

    it('armas melee do catálogo devem ser identificadas corretamente', () => {
      MELEE_WEAPONS.forEach(weapon => {
        expect(isMeleeWeapon(weapon)).toBe(true);
      });
    });

    it('armas ranged do catálogo devem ser identificadas corretamente', () => {
      RANGED_WEAPONS.forEach(weapon => {
        expect(isRangedWeapon(weapon)).toBe(true);
      });
    });
  });

  describe('Consistência Damage/DamageType', () => {
    it('armas de fogo devem ter dano da tabela 3.3, incluindo bazuca e lança-chamas', () => {
      FIREARMS.forEach(expectFirearmDamageType);
    });

    it('armas melee devem ter dano físico', () => {
      const physicalDamageTypes = ['Corte', 'Impacto', 'Perfuração'];
      MELEE_WEAPONS.forEach(weapon => {
        expect(physicalDamageTypes).toContain(weapon.damageType);
      });
    });
  });

  describe('Integridade de Referências', () => {
    it('todas as armas em sublistas por tipo devem estar em ALL_WEAPONS', () => {
      [...MELEE_WEAPONS, ...RANGED_WEAPONS, ...FIREARMS, ...THROWN_WEAPONS].forEach(weapon => {
        const found = ALL_WEAPONS.find(w => w.id === weapon.id);
        expect(found).toBeDefined();
      });
    });

    it('getWeaponById deve encontrar todas as armas', () => {
      ALL_WEAPONS.forEach(weapon => {
        const found = getWeaponById(weapon.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(weapon.id);
      });
    });
  });
});

it('Dum dum e Explosiva não são modificações aplicáveis à arma', () => {
  const weapon = requireWeapon('fuzil_assalto');
  expect(canApplyModification(weapon, 'dum_dum')).toBe(false);
  expect(canApplyModification(weapon, 'explosiva')).toBe(false);
  expect(getAvailableModifications(weapon).map(mod => mod.id)).not.toContain('explosiva');
});
