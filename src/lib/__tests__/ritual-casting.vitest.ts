/**
 * Testes para Motor de Conjuração de Rituais
 * Ordem Paranormal RPG v1.3
 * 
 * Valida as regras de conjuração conforme PDF p.129-132:
 * - Custo do Paranormal (Ocultismo DT 20 + custo)
 * - Regras especiais de Medo
 * - Teste de Concentração
 * - Validações de círculo, PE, mão livre, componentes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  castRitual,
  getOccultismDT,
  getConcentrationDT,
  getFearPermanentSanLoss,
  isFearElement,
  formatCastingResult,
} from '../rituals/ritual-casting-engine';
import type { CastRitualParams } from '../rituals/ritual-casting-engine';

// Mock do registro de rituais para testes controlados
vi.mock('../rituals/ritual-registry', () => ({
  getRitualById: vi.fn((id: string) => {
    const rituals: Record<string, unknown> = {
      'amaldicoar-arma': {
        id: 'amaldicoar-arma',
        name: 'Amaldiçoar Arma',
        element: 'sangue',
        circle: 1,
        cost: 1,
        enhancements: [
          { name: 'Discente', cost: 1, circleReq: 2 },
          { name: 'Verdadeiro', cost: 3, circleReq: 3, affinityReq: true },
        ],
        effects: { base: { attackBonus: 1 } },
      },
      'amedrontar': {
        id: 'amedrontar',
        name: 'Amedrontar',
        element: 'medo',
        circle: 1,
        cost: 1,
        enhancements: [
          { name: 'Discente', cost: 2 },
          { name: 'Verdadeiro', cost: 5 },
        ],
        effects: { base: { conditions: [{ id: 'amedrontado' }] } },
      },
      'conjurar-elemental': {
        id: 'conjurar-elemental',
        name: 'Conjurar Elemental',
        element: 'energia',
        circle: 3,
        cost: 6,
        effects: { base: { summary: 'Invoca um elemental' } },
      },
    };
    return rituals[id];
  }),
  calculateRitualCost: vi.fn((ritual, enhancements, isNonOccultist) => {
    const r = typeof ritual === 'string' ? { cost: 1 } : ritual;
    let total = r.cost ?? 1;
    
    if (enhancements?.includes('Discente')) total += 1;
    if (enhancements?.includes('Verdadeiro')) total += 3;
    
    return isNonOccultist ? total * 2 : total;
  }),
  getEffectiveLevel: vi.fn((enhancements: string[]) => {
    if (enhancements.some(e => e.toLowerCase() === 'verdadeiro')) return 'verdadeiro';
    if (enhancements.some(e => e.toLowerCase() === 'discente')) return 'discente';
    return 'base';
  }),
  getRitualEffect: vi.fn(() => ({ attackBonus: 1 })),
}));

// ========================================
// CONFIGURAÇÃO BASE PARA TESTES
// ========================================

function createBaseParams(overrides?: Partial<CastRitualParams>): CastRitualParams {
  return {
    ritualId: 'amaldicoar-arma',
    selectedEnhancements: [],
    characterState: {
      nex: 25,
      peCurrent: 10,
      peMax: 15,
      sanCurrent: 70,
      sanMax: 100,
      occultism: 10,
      willpower: 5,
      presence: 2,
      intellect: 3,
      isOccultist: true,
      maxCircle: 2,
      hasFreeHand: true,
      hasComponents: true,
      armorType: 'none',
    },
    ...overrides,
  };
}

// ========================================
// TESTES: FUNÇÕES UTILITÁRIAS
// ========================================

describe('Funções Utilitárias de Conjuração', () => {
  describe('getOccultismDT', () => {
    it('deve retornar DT 20 + custo PE', () => {
      expect(getOccultismDT(1)).toBe(21);
      expect(getOccultismDT(3)).toBe(23);
      expect(getOccultismDT(6)).toBe(26);
      expect(getOccultismDT(10)).toBe(30);
    });
  });

  describe('getConcentrationDT', () => {
    it('deve retornar DT 15 sem proteção', () => {
      expect(getConcentrationDT('none')).toBe(15);
    });

    it('deve retornar DT 15 com proteção leve', () => {
      expect(getConcentrationDT('leve')).toBe(15);
    });

    it('deve retornar DT 20 com proteção pesada', () => {
      expect(getConcentrationDT('pesada')).toBe(20);
    });
  });

  describe('getFearPermanentSanLoss', () => {
    it('deve retornar 1 para nível base', () => {
      expect(getFearPermanentSanLoss('base')).toBe(1);
    });

    it('deve retornar 2 para nível discente', () => {
      expect(getFearPermanentSanLoss('discente')).toBe(2);
    });

    it('deve retornar 3 para nível verdadeiro', () => {
      expect(getFearPermanentSanLoss('verdadeiro')).toBe(3);
    });
  });

  describe('isFearElement', () => {
    it('deve identificar elemento Medo', () => {
      expect(isFearElement('medo')).toBe(true);
      expect(isFearElement('Medo')).toBe(true);
      expect(isFearElement('MEDO')).toBe(true);
    });

    it('deve retornar false para outros elementos', () => {
      expect(isFearElement('sangue')).toBe(false);
      expect(isFearElement('morte')).toBe(false);
      expect(isFearElement('energia')).toBe(false);
      expect(isFearElement('conhecimento')).toBe(false);
    });
  });
});

// ========================================
// TESTES: CUSTO DO PARANORMAL (PDF p.132)
// ========================================

describe('Custo do Paranormal (PDF p.132)', () => {
  describe('Elementos não-Medo', () => {
    it('deve exigir teste de Ocultismo DT 20 + custo', () => {
      const params = createBaseParams({
        rollOptions: {
          preRolledOccultism: { diceResult: 10 }, // 10 + 10 (bônus) = 20
        },
      });

      const result = castRitual(params);

      expect(result.occultismTest).toBeDefined();
      expect(result.occultismTest?.dt).toBe(21); // 20 + 1 PE
    });

    it('deve aplicar perda de SAN igual ao custo em falha', () => {
      const params = createBaseParams({
        rollOptions: {
          preRolledOccultism: { diceResult: 5 }, // 5 + 10 = 15 < 21 = FALHA
        },
      });

      const result = castRitual(params);

      expect(result.occultismTest?.success).toBe(false);
      expect(result.sanityLost).toBe(1); // Custo do ritual = 1 PE
    });

    it('deve aplicar 1 SAN permanente em falha por 5+', () => {
      const params = createBaseParams({
        ritualId: 'conjurar-elemental', // Custo 6 PE, DT 26
        characterState: {
          ...createBaseParams().characterState,
          maxCircle: 3,
          peCurrent: 10,
        },
        rollOptions: {
          preRolledOccultism: { diceResult: 5 }, // 5 + 10 = 15, DT 26, falha por 11
        },
      });

      const result = castRitual(params);

      expect(result.occultismTest?.success).toBe(false);
      expect(result.occultismTest?.failedBy5OrMore).toBe(true);
      expect(result.permanentSanityLost).toBe(1);
    });

    it('não deve perder SAN se passar no teste', () => {
      const params = createBaseParams({
        rollOptions: {
          preRolledOccultism: { diceResult: 15 }, // 15 + 10 = 25 >= 21
        },
      });

      const result = castRitual(params);

      expect(result.occultismTest?.success).toBe(true);
      expect(result.sanityLost).toBe(0);
      expect(result.permanentSanityLost).toBe(0);
    });
  });

  describe('Elemento Medo', () => {
    it('deve sempre perder SAN igual ao custo', () => {
      const params = createBaseParams({
        ritualId: 'amedrontar',
        selectedEnhancements: [],
      });

      const result = castRitual(params);

      expect(result.occultismTest).toBeUndefined(); // Medo não faz teste
      expect(result.sanityLost).toBe(1); // Custo do ritual
    });

    it('deve perder 1 SAN permanente em nível base', () => {
      const params = createBaseParams({
        ritualId: 'amedrontar',
        selectedEnhancements: [],
      });

      const result = castRitual(params);

      expect(result.level).toBe('base');
      expect(result.permanentSanityLost).toBe(1);
    });

    it('deve perder 2 SAN permanentes em nível discente', () => {
      const params = createBaseParams({
        ritualId: 'amedrontar',
        selectedEnhancements: ['Discente'],
      });

      const result = castRitual(params);

      expect(result.level).toBe('discente');
      expect(result.permanentSanityLost).toBe(2);
    });

    it('deve perder 3 SAN permanentes em nível verdadeiro', () => {
      const params = createBaseParams({
        ritualId: 'amedrontar',
        selectedEnhancements: ['Verdadeiro'],
      });

      const result = castRitual(params);

      expect(result.level).toBe('verdadeiro');
      expect(result.permanentSanityLost).toBe(3);
    });
  });
});

// ========================================
// TESTES: CONCENTRAÇÃO (PDF p.129)
// ========================================

describe('Concentração em Rituais (PDF p.129)', () => {
  it('deve exigir teste de Vontade ao sofrer dano durante execução', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        damageTakenDuringCast: 5,
      },
      rollOptions: {
        preRolledWillpower: { diceResult: 15 }, // 15 + 5 = 20 >= 15
        preRolledOccultism: { diceResult: 15 },
      },
    });

    const result = castRitual(params);

    expect(result.concentrationTest).toBeDefined();
    expect(result.concentrationTest?.dt).toBe(15);
  });

  it('proteção pesada deve aumentar DT em +5', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        damageTakenDuringCast: 5,
        armorType: 'pesada',
      },
      rollOptions: {
        preRolledWillpower: { diceResult: 15 },
        preRolledOccultism: { diceResult: 15 },
      },
    });

    const result = castRitual(params);

    expect(result.concentrationTest?.dt).toBe(20); // 15 + 5
  });

  it('falha no teste deve cancelar ritual e perder PE', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        damageTakenDuringCast: 5,
      },
      rollOptions: {
        preRolledWillpower: { diceResult: 5 }, // 5 + 5 = 10 < 15 = FALHA
      },
    });

    const result = castRitual(params);

    expect(result.concentrationTest?.success).toBe(false);
    expect(result.success).toBe(false);
    expect(result.interrupted).toBe(true);
    expect(result.peSpent).toBe(1); // Perde PE mesmo falhando
  });

  it('sucesso no teste deve permitir conjuração', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        damageTakenDuringCast: 5,
      },
      rollOptions: {
        preRolledWillpower: { diceResult: 15 }, // 15 + 5 = 20 >= 15
        preRolledOccultism: { diceResult: 15 },
      },
    });

    const result = castRitual(params);

    expect(result.concentrationTest?.success).toBe(true);
    expect(result.success).toBe(true);
  });
});

// ========================================
// TESTES: VALIDAÇÕES
// ========================================

describe('Validações de Conjuração', () => {
  it('deve falhar se círculo insuficiente', () => {
    const params = createBaseParams({
      ritualId: 'conjurar-elemental', // 3º círculo
      characterState: {
        ...createBaseParams().characterState,
        maxCircle: 2,
      },
    });

    const result = castRitual(params);

    expect(result.success).toBe(false);
    expect(result.interrupted).toBe(true);
    expect(result.errors).toContain(expect.stringMatching(/círculo insuficiente/i));
  });

  it('deve falhar se PE insuficiente', () => {
    const params = createBaseParams({
      ritualId: 'conjurar-elemental',
      characterState: {
        ...createBaseParams().characterState,
        maxCircle: 3,
        peCurrent: 3, // Precisa de 6
      },
    });

    const result = castRitual(params);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/PE insuficiente/i));
  });

  it('deve falhar se não tiver mão livre (exceto Medo)', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        hasFreeHand: false,
      },
    });

    const result = castRitual(params);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/mão livre/i));
  });

  it('Medo não deve exigir mão livre', () => {
    const params = createBaseParams({
      ritualId: 'amedrontar',
      characterState: {
        ...createBaseParams().characterState,
        hasFreeHand: false,
        hasComponents: false, // Medo também não precisa de componentes
      },
    });

    const result = castRitual(params);

    expect(result.success).toBe(true);
  });

  it('deve falhar se não tiver componentes (exceto Medo)', () => {
    const params = createBaseParams({
      characterState: {
        ...createBaseParams().characterState,
        hasComponents: false,
      },
    });

    const result = castRitual(params);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(expect.stringMatching(/componentes/i));
  });
});

// ========================================
// TESTES: FORMATO DE RESULTADO
// ========================================

describe('Formatação de Resultado', () => {
  it('deve formatar resultado de sucesso', () => {
    const result = {
      success: true,
      interrupted: false,
      ritualId: 'amaldicoar-arma',
      ritualName: 'Amaldiçoar Arma',
      element: 'sangue',
      circle: 1,
      level: 'base' as const,
      peSpent: 1,
      sanityLost: 0,
      permanentSanityLost: 0,
      breakdown: [],
      errors: [],
    };

    const formatted = formatCastingResult(result);
    expect(formatted).toContain('Amaldiçoar Arma');
    expect(formatted).toContain('-1 PE');
  });

  it('deve incluir perda de SAN no formato', () => {
    const result = {
      success: true,
      interrupted: false,
      ritualId: 'amedrontar',
      ritualName: 'Amedrontar',
      element: 'medo',
      circle: 1,
      level: 'base' as const,
      peSpent: 1,
      sanityLost: 1,
      permanentSanityLost: 1,
      breakdown: [],
      errors: [],
    };

    const formatted = formatCastingResult(result);
    expect(formatted).toContain('-1 SAN');
    expect(formatted).toContain('-1 SAN permanente');
  });

  it('deve formatar falha com razão', () => {
    const result = {
      success: false,
      interrupted: true,
      ritualId: 'test',
      ritualName: 'Test Ritual',
      element: 'teste',
      circle: 1,
      level: 'base' as const,
      peSpent: 0,
      sanityLost: 0,
      permanentSanityLost: 0,
      breakdown: [],
      errors: ['PE insuficiente'],
    };

    const formatted = formatCastingResult(result);
    expect(formatted).toContain('PE insuficiente');
  });
});
