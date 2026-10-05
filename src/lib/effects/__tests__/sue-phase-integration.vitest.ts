/**
 * Testes de Integração - Sistema Unificado de Efeitos (SUE)
 * Fases 1-5 do Plano de Integração
 * 
 * Ordem Paranormal RPG v1.3
 * 
 * Cobertura:
 * - Fase 1: Bridge power-effects-engine → class-power-effects-adapter
 * - Fase 2: Integração UNIFIED_RITUALS → ritual-effects-adapter
 * - Fase 3: Track adapter modificadores de ritual (Ocultista)
 * - Fase 4: useUnifiedEffects hook integration
 * - Fase 5: Testes end-to-end
 */

import { describe, it, expect } from 'vitest';
import {
  getClassPowerEffects,
  getPowersRequiringChoice,
  hasPowerEffects,
  listAllClassPowerEffects,
  type ActiveClassPower,
} from '../class-power-effects-adapter';
import {
  getRitualEffects,
  calculateRitualBonusTotals,
  getSustainableRituals,
  getWeaponBuffRituals,
  getRitualEnhancements,
  type SustainedRitualInput,
} from '../ritual-effects-adapter';
import {
  getTrackEffects,
  getTrackBonusSummary,
  TRACK_EFFECT_MAPPINGS,
} from '../track-effects-adapter';
import type { AttributeType } from '../../unified-effects-engine';
import { getTrackAbilityById } from '../../class-powers/track-registry';

// =====================================================
// Helpers
// =====================================================

function createTestAttributes(): Record<AttributeType, number> {
  return {
    strength: 2,
    agility: 3,
    vigor: 2,
    intellect: 4,
    presence: 3,
  };
}

// =====================================================
// FASE 1: Bridge power-effects-engine → class-power-effects-adapter
// =====================================================

describe('SUE Fase 1: Power Registry Integration', () => {
  describe('Cobertura de Poderes de Classe', () => {
    it('deve ter pelo menos 15 poderes mapeados', () => {
      const powers = listAllClassPowerEffects();
      expect(powers.length).toBeGreaterThanOrEqual(15);
    });

    it('hasPowerEffects deve funcionar para poderes conhecidos', () => {
      // Combatente
      expect(hasPowerEffects('golpe-pesado')).toBe(true);
      expect(hasPowerEffects('golpe-brutal')).toBe(true);

      // Especialista
      expect(hasPowerEffects('mira-firme')).toBe(true);

      // Ocultista
      expect(hasPowerEffects('ritual-potente')).toBe(true);
      expect(hasPowerEffects('especialista-em-elemento')).toBe(true);
    });

    it('getPowersRequiringChoice deve listar poderes com escolhas', () => {
      const powers = getPowersRequiringChoice();

      expect(powers).toContain('especialista-em-elemento');
      expect(powers).toContain('mestre-em-elemento');
      expect(powers).toContain('ritual-predileto');
    });
  });

  describe('Conversão PowerMechanics → EffectMechanics', () => {
    it('damageBonus deve ser convertido corretamente', () => {
      const power: ActiveClassPower = {
        id: 'golpe-pesado',
        name: 'Golpe Pesado',
        classId: 'combatente',
        nex: 25,
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects.length).toBe(1);
      expect(effects[0].mechanics.extraDamageDice).toBeDefined();
    });

    it('criticalBonus deve ser convertido corretamente', () => {
      const power: ActiveClassPower = {
        id: 'golpe-brutal',
        name: 'Golpe Brutal',
        classId: 'combatente',
        nex: 25,
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects[0].mechanics.criticalMarginBonus).toBeDefined();
    });

    it('skillBonuses devem ser convertidos corretamente', () => {
      const power: ActiveClassPower = {
        id: 'envolto-em-misterio',
        name: 'Envolto em Mistério',
        classId: 'ocultista',
        nex: 25,
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects[0].mechanics.skillBonus?.enganacao).toBeDefined();
    });
  });

  describe('Poderes com Escolhas', () => {
    it('especialista-em-elemento deve aplicar DT bônus ao elemento escolhido', () => {
      const power: ActiveClassPower = {
        id: 'especialista-em-elemento',
        name: 'Especialista em Elemento',
        classId: 'ocultista',
        nex: 25,
        choices: { element: 'Sangue' },
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects.length).toBe(1);
      expect(effects[0].mechanics.ritualDTBonusByElement?.['sangue'] ||
        effects[0].mechanics.ritualDTBonusByElement?.['Sangue']).toBeDefined();
    });

    it('mestre-em-elemento deve reduzir PE do elemento escolhido', () => {
      const power: ActiveClassPower = {
        id: 'mestre-em-elemento',
        name: 'Mestre em Elemento',
        classId: 'ocultista',
        nex: 50,
        choices: { element: 'Morte' },
      };

      const effects = getClassPowerEffects([power], 50, createTestAttributes());

      expect(effects.length).toBe(1);
      expect(effects[0].mechanics.ritualPEReductionByElement?.['morte'] ||
        effects[0].mechanics.ritualPEReductionByElement?.['Morte']).toBeDefined();
    });

    it('poder sem escolha obrigatória não deve gerar efeito', () => {
      const power: ActiveClassPower = {
        id: 'especialista-em-elemento',
        name: 'Especialista em Elemento',
        classId: 'ocultista',
        nex: 25,
        // Sem choices
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects.length).toBe(0);
    });
  });

  describe('Progressão por NEX', () => {
    it('efeitos devem escalar corretamente com NEX', () => {
      const power: ActiveClassPower = {
        id: 'golpe-pesado',
        name: 'Golpe Pesado',
        classId: 'combatente',
        nex: 50,
      };

      const effectsNex25 = getClassPowerEffects([power], 25, createTestAttributes());
      const effectsNex75 = getClassPowerEffects([power], 75, createTestAttributes());

      // Ambos devem gerar efeitos
      expect(effectsNex25.length).toBeGreaterThan(0);
      expect(effectsNex75.length).toBeGreaterThan(0);
    });
  });
});

// =====================================================
// FASE 2: Integração UNIFIED_RITUALS → ritual-effects-adapter
// =====================================================

describe('SUE Fase 2: Ritual Integration', () => {
  describe('getRitualEffects', () => {
    it('deve retornar efeitos para rituais sustentados', () => {
      const sustained: SustainedRitualInput = {
        ritualId: 'amaldicoar-arma',
        ritualName: 'Amaldiçoar Arma',
        element: 'Sangue',
        circle: 1,
        selectedEnhancements: [],
      };

      const effects = getRitualEffects([sustained]);

      // Deve processar sem erro
      expect(Array.isArray(effects)).toBe(true);
    });

    it('efeitos devem ter source = "ritual"', () => {
      const sustained: SustainedRitualInput = {
        ritualId: 'armadura-arcana',
        ritualName: 'Armadura Arcana',
        element: 'Energia',
        circle: 1,
      };

      const effects = getRitualEffects([sustained]);

      if (effects.length > 0) {
        expect(effects[0].source).toBe('ritual');
      }
    });

    it('deve processar múltiplos rituais', () => {
      const rituals: SustainedRitualInput[] = [
        {
          ritualId: 'ritual-1',
          ritualName: 'Ritual 1',
          element: 'Sangue',
          circle: 1,
        },
        {
          ritualId: 'ritual-2',
          ritualName: 'Ritual 2',
          element: 'Morte',
          circle: 2,
        },
      ];

      expect(() => getRitualEffects(rituals)).not.toThrow();
    });
  });

  describe('calculateRitualBonusTotals', () => {
    it('deve retornar estrutura correta', () => {
      const totals = calculateRitualBonusTotals([]);

      expect(totals).toHaveProperty('attackBonus');
      expect(totals).toHaveProperty('damageBonus');
      expect(totals).toHaveProperty('defenseBonus');
      expect(totals).toHaveProperty('damageReduction');
      expect(totals).toHaveProperty('tempHP');
      expect(totals).toHaveProperty('skillBonuses');
      expect(totals).toHaveProperty('specialEffects');
    });

    it('valores devem ser zerados para array vazio', () => {
      const totals = calculateRitualBonusTotals([]);

      expect(totals.attackBonus).toBe(0);
      expect(totals.damageBonus).toBe(0);
      expect(totals.defenseBonus).toBe(0);
    });
  });

  describe('getSustainableRituals', () => {
    it('deve retornar lista de rituais sustentáveis', () => {
      const rituais = getSustainableRituals();

      expect(Array.isArray(rituais)).toBe(true);
    });

    it('rituais devem ter estrutura correta', () => {
      const rituais = getSustainableRituals();

      if (rituais.length > 0) {
        expect(rituais[0]).toHaveProperty('id');
        expect(rituais[0]).toHaveProperty('name');
        expect(rituais[0]).toHaveProperty('circle');
        expect(rituais[0]).toHaveProperty('element');
        expect(rituais[0]).toHaveProperty('hasCombatEffects');
      }
    });
  });

  describe('getWeaponBuffRituals', () => {
    it('deve retornar lista de rituais de buff de arma', () => {
      const rituais = getWeaponBuffRituals();

      expect(Array.isArray(rituais)).toBe(true);
    });
  });

  describe('getRitualEnhancements', () => {
    it('deve retornar objeto com aprimoramentos disponíveis', () => {
      const result = getRitualEnhancements('amaldicoar-arma');

      expect(result).toHaveProperty('hasEnhancements');
      expect(result).toHaveProperty('enhancements');
      expect(Array.isArray(result.enhancements)).toBe(true);
    });
  });
});

// =====================================================
// FASE 3: Track Adapter Modificadores de Ritual (Ocultista)
// =====================================================

describe('SUE Fase 3: Ocultist Track Ritual Modifiers', () => {
  describe('Conduíte', () => {
    it('Ampliar Ritual deve ter ritualModifiers', () => {
      const effects = getTrackEffects('condutor', 10, createTestAttributes());

      const ampliar = effects.find(e => e.sourceId === 'ampliar-ritual');

      expect(ampliar).toBeDefined();
      expect(ampliar?.mechanics.ritualModifiers).toBeDefined();
      expect(ampliar?.mechanics.ritualModifiers?.length).toBeGreaterThan(0);
    });

    it('Acelerar Ritual deve ter ritualModifiers com action type', () => {
      const effects = getTrackEffects('condutor', 40, createTestAttributes());
      const acelerar = effects.find(e => e.sourceId === 'acelerar-ritual');

      expect(acelerar).toBeDefined();
      if (acelerar) {
        const acelerarMod = acelerar.mechanics.ritualModifiers?.find(m => m.type === 'action');
        expect(acelerarMod).toBeDefined();
      }
    });

    it('Anular Ritual deve ter ritualModifiers com counter type', () => {
      const effects = getTrackEffects('condutor', 65, createTestAttributes());
      const anular = effects.find(e => e.sourceId === 'anular-ritual');

      expect(anular).toBeDefined();
      if (anular) {
        const anularMod = anular.mechanics.ritualModifiers?.find(m => m.type === 'counter');
        expect(anularMod).toBeDefined();
        expect(anularMod?.variableCost).toBe(true);
      }
    });

    it('TRACK_EFFECT_MAPPINGS deve ter conduíte registrado', () => {
      expect(TRACK_EFFECT_MAPPINGS.condutor).toBeDefined();
      expect(TRACK_EFFECT_MAPPINGS.condutor.effects['track-ampliar-ritual']).toBeDefined();
      expect(TRACK_EFFECT_MAPPINGS.condutor.effects['track-acelerar-ritual']).toBeDefined();
      expect(TRACK_EFFECT_MAPPINGS.condutor.effects['track-anular-ritual']).toBeDefined();
    });
  });

  describe('Flagelador', () => {
    it('Poder do Flagelo deve ter specialEffect de PV como PE', () => {
      const effects = getTrackEffects('flagelador', 10, createTestAttributes());
      const poder = effects.find(e => e.sourceId === 'poder-do-sangue');

      expect(poder).toBeDefined();
      const hasPvAsPe = poder?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('pv') && s.toLowerCase().includes('pe')
      );
      expect(hasPvAsPe).toBe(true);
    });

    it('Absorver Agonia concede PE temporário ao reduzir inimigo a zero com ritual', () => {
      const effects = getTrackEffects('flagelador', 65, createTestAttributes());
      const absorver = effects.find(e => e.sourceId === 'absorver-angustia');

      expect(absorver).toBeDefined();
      // Livro Base v1.3, p.34–35: o gatilho não é sofrer dano; o valor segue o círculo.
      expect(getTrackAbilityById('absorver-angustia')?.effects.base.temporaryPE)
        .toMatchObject({ trigger: 'on-kill-with-ritual', amount: 'ritual-circle' });
      expect(absorver?.name).toBe('Absorver Agonia');
    });
  });

  describe('Graduado', () => {
    it('Grimório prepara rituais em NEX 40; Rituais Eficientes aumenta DT apenas em NEX 65', () => {
      const effectsAt40 = getTrackEffects('graduado', 40, createTestAttributes());
      const effects = getTrackEffects('graduado', 65, createTestAttributes());
      const grimorio = effects.find(e => e.sourceId === 'grimorio-ritualistico');
      const eficientes = effects.find(e => e.sourceId === 'rituais-eficientes');

      // Livro Base v1.3, p.35: grimório e bônus de DT são habilidades distintas.
      expect(effectsAt40.some(e => e.sourceId === 'grimorio-ritualistico')).toBe(true);
      expect(effectsAt40.some(e => e.sourceId === 'rituais-eficientes')).toBe(false);
      expect(grimorio).toBeDefined();
      expect(grimorio?.mechanics.grimoire?.preparationAction).toBe('full');
      expect(grimorio?.mechanics.ritualDTBonus ?? 0).toBe(0);
      expect(eficientes?.mechanics.ritualDTBonus).toBe(5);
    });

    it('Saber Ampliado deve ter specialEffect de rituais extras', () => {
      const effects = getTrackEffects('graduado', 10, createTestAttributes());
      const saber = effects.find(e => e.sourceId === 'saber-ampliado');

      expect(saber).toBeDefined();
      const hasRitualBonus = saber?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('ritual') && s.toLowerCase().includes('extra')
      );
      expect(hasRitualBonus).toBe(true);
    });
  });

  describe('Intuitivo', () => {
    it('Mente Sã concede bônus contextual de resistência, sem redução de dano', () => {
      const effects = getTrackEffects('intuitivo', 10, createTestAttributes());
      const menteSa = effects.find(e => e.sourceId === 'mente-sa');

      expect(menteSa).toBeDefined();
      // Livro Base v1.3, p.35: +5 nos testes contra efeitos paranormais, sem RD geral.
      expect(menteSa?.mechanics.paranormalResistanceTestBonus).toBe(5);
      expect(menteSa?.mechanics.mentalDamageResistance ?? 0).toBe(0);
      expect(menteSa?.mechanics.damageReduction ?? 0).toBe(0);
    });

    it('Presença Poderosa deve ter specialEffect de PE por turno', () => {
      const effects = getTrackEffects('intuitivo', 40, createTestAttributes());
      const presenca = effects.find(e => e.sourceId === 'presenca-poderosa');

      expect(presenca).toBeDefined();
      const hasPEBonus = presenca?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('pe') && s.toLowerCase().includes('turno')
      );
      expect(hasPEBonus).toBe(true);
    });
  });

  describe('Lâmina Paranormal', () => {
    it('Lâmina Maldita deve ter ritual concedido', () => {
      const effects = getTrackEffects('lamina-paranormal', 10, createTestAttributes());
      const lamina = effects.find(e => e.sourceId === 'lamina-maldita');

      expect(lamina).toBeDefined();
      const hasRitual = lamina?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('ritual concedido') ||
        s.toLowerCase().includes('amaldiçoar arma')
      );
      expect(hasRitual).toBe(true);
    });

    it('Lâmina Maldita deve ter Ocultismo como ataque', () => {
      const effects = getTrackEffects('lamina-paranormal', 10, createTestAttributes());
      const lamina = effects.find(e => e.sourceId === 'lamina-maldita');

      expect(lamina).toBeDefined();
      const hasOcultismoAttack = lamina?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('ocultismo') && s.toLowerCase().includes('ataque')
      );
      expect(hasOcultismoAttack).toBe(true);
    });

    it('Gladiador Paranormal deve ter PE temporário', () => {
      const effects = getTrackEffects('lamina-paranormal', 40, createTestAttributes());
      const gladiador = effects.find(e => e.sourceId === 'gladiador-paranormal');

      expect(gladiador).toBeDefined();
      const hasTemporaryPE = gladiador?.mechanics.specialEffects?.some(s =>
        s.toLowerCase().includes('pe temporário')
      );
      expect(hasTemporaryPE).toBe(true);
    });
  });
});

// =====================================================
// FASE 4: useUnifiedEffects Hook Integration
// =====================================================

describe('SUE Fase 4: Hook Dependencies', () => {
  // Nota: useUnifiedEffects é um hook React, então testamos as funções
  // de coleta de efeitos que ele usa internamente

  describe('Coleta de Efeitos de Classe', () => {
    it('deve processar múltiplos poderes de classes diferentes', () => {
      const powers: ActiveClassPower[] = [
        { id: 'golpe-pesado', name: 'Golpe Pesado', classId: 'combatente', nex: 25 },
        { id: 'mira-firme', name: 'Mira Firme', classId: 'especialista', nex: 25 },
        { id: 'ritual-potente', name: 'Ritual Potente', classId: 'ocultista', nex: 25 },
      ];

      const effects = getClassPowerEffects(powers, 50, createTestAttributes());

      expect(effects.length).toBe(3);
    });

    it('deve manter source e sourceId corretos', () => {
      const power: ActiveClassPower = {
        id: 'golpe-pesado',
        name: 'Golpe Pesado',
        classId: 'combatente',
        nex: 25,
      };

      const effects = getClassPowerEffects([power], 25, createTestAttributes());

      expect(effects[0].source).toBe('class_power');
      expect(effects[0].sourceId).toBe('golpe-pesado');
    });
  });

  describe('Coleta de Efeitos de Trilha', () => {
    it('deve processar trilhas de todas as classes', () => {
      const tracks = [
        'aniquilador', 'guerreiro', 'operacoes-especiais',
        'atirador-elite', 'infiltrador',
        'conduite', 'flagelador', 'graduado', 'intuitivo', 'lamina-paranormal',
      ];

      for (const trackId of tracks) {
        const effects = getTrackEffects(trackId, 50, createTestAttributes());
        expect(Array.isArray(effects)).toBe(true);
        expect(effects.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Coleta de Efeitos de Ritual', () => {
    it('deve processar rituais de todos os elementos', () => {
      const elementos = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'];

      for (const elemento of elementos) {
        const ritual: SustainedRitualInput = {
          ritualId: `ritual-${elemento.toLowerCase()}`,
          ritualName: `Ritual de ${elemento}`,
          element: elemento,
          circle: 1,
        };

        expect(() => getRitualEffects([ritual])).not.toThrow();
      }
    });

    it('deve processar rituais de todos os círculos', () => {
      for (let circle = 1; circle <= 4; circle++) {
        const ritual: SustainedRitualInput = {
          ritualId: `ritual-circulo-${circle}`,
          ritualName: `Ritual ${circle}º Círculo`,
          element: 'Energia',
          circle,
        };

        expect(() => getRitualEffects([ritual])).not.toThrow();
      }
    });
  });
});

// =====================================================
// FASE 5: End-to-End Integration
// =====================================================

describe('SUE Fase 5: End-to-End Integration', () => {
  describe('Cenário: Combatente com Trilha Guerreiro', () => {
    it('deve consolidar efeitos de poderes e trilha', () => {
      const powers: ActiveClassPower[] = [
        { id: 'golpe-pesado', name: 'Golpe Pesado', classId: 'combatente', nex: 50 },
        { id: 'golpe-brutal', name: 'Golpe Brutal', classId: 'combatente', nex: 50 },
      ];

      const classPowerEffects = getClassPowerEffects(powers, 50, createTestAttributes());
      const trackEffects = getTrackEffects('guerreiro', 50, createTestAttributes());

      // Todos devem ter efeitos
      expect(classPowerEffects.length).toBeGreaterThan(0);
      expect(trackEffects.length).toBeGreaterThan(0);

      // Deve haver bônus de dano corpo a corpo
      const hasMeleeDamage = classPowerEffects.some(e =>
        e.mechanics.meleeDamageBonus ||
        e.mechanics.damageBonus ||
        e.mechanics.extraDamageDice
      );
      expect(hasMeleeDamage).toBe(true);

      // Deve haver margem de crítico
      const hasCritical = classPowerEffects.some(e => e.mechanics.criticalMarginBonus) ||
        trackEffects.some(e => e.mechanics.criticalMarginBonus);
      expect(hasCritical).toBe(true);
    });
  });

  describe('Cenário: Ocultista com Trilha Conduíte e Rituais', () => {
    it('deve consolidar efeitos de poderes, trilha e rituais', () => {
      const powers: ActiveClassPower[] = [
        {
          id: 'especialista-em-elemento',
          name: 'Especialista em Elemento',
          classId: 'ocultista',
          nex: 50,
          choices: { element: 'Sangue' },
        },
        {
          id: 'ritual-potente',
          name: 'Ritual Potente',
          classId: 'ocultista',
          nex: 50,
        },
      ];

      const rituals: SustainedRitualInput[] = [
        {
          ritualId: 'amaldicoar-arma',
          ritualName: 'Amaldiçoar Arma',
          element: 'Sangue',
          circle: 1,
        },
      ];

      const classPowerEffects = getClassPowerEffects(powers, 50, createTestAttributes());
      const trackEffects = getTrackEffects('conduite', 50, createTestAttributes());
      const ritualEffects = getRitualEffects(rituals);

      // Verificações
      expect(classPowerEffects.length).toBeGreaterThan(0);
      expect(trackEffects.length).toBeGreaterThan(0);

      // Deve haver DT bonus por elemento
      const hasDTBonus = classPowerEffects.some(e =>
        e.mechanics.ritualDTBonusByElement
      );
      expect(hasDTBonus).toBe(true);

      // Deve haver modificadores de ritual
      const hasRitualModifiers = trackEffects.some(e =>
        e.mechanics.ritualModifiers && e.mechanics.ritualModifiers.length > 0
      );
      expect(hasRitualModifiers).toBe(true);
    });
  });

  describe('Cenário: Especialista com Trilha Atirador de Elite', () => {
    it('deve consolidar efeitos de dano à distância', () => {
      const powers: ActiveClassPower[] = [
        { id: 'mira-firme', name: 'Mira Firme', classId: 'especialista', nex: 50 },
        { id: 'balistica-avancada', name: 'Balística Avançada', classId: 'especialista', nex: 50 },
      ];

      const classPowerEffects = getClassPowerEffects(powers, 50, createTestAttributes());
      const trackSummary = getTrackBonusSummary('atirador-elite', 50, createTestAttributes());

      // Verificações
      expect(classPowerEffects.length).toBeGreaterThan(0);
      expect(trackSummary.trackName).toBe('Atirador de Elite');

      // Deve haver bônus de dano à distância
      const hasRangedDamage = classPowerEffects.some(e => e.mechanics.rangedDamageBonus);
      expect(hasRangedDamage).toBe(true);
    });
  });

  describe('Validação de Estrutura UnifiedEffect', () => {
    it('todos os efeitos devem ter campos obrigatórios', () => {
      const powers: ActiveClassPower[] = [
        { id: 'golpe-pesado', name: 'Golpe Pesado', classId: 'combatente', nex: 25 },
      ];

      const classPowerEffects = getClassPowerEffects(powers, 25, createTestAttributes());
      const trackEffects = getTrackEffects('guerreiro', 25, createTestAttributes());

      for (const effect of [...classPowerEffects, ...trackEffects]) {
        expect(effect.id).toBeDefined();
        expect(effect.name).toBeDefined();
        expect(effect.source).toBeDefined();
        expect(effect.sourceId).toBeDefined();
        expect(effect.mechanics).toBeDefined();
        expect(typeof effect.isActive).toBe('boolean');
        expect(typeof effect.isToggleable).toBe('boolean');
      }
    });
  });

  describe('Robustez com Entradas Inválidas', () => {
    it('deve lidar com array vazio de poderes', () => {
      expect(() => getClassPowerEffects([], 50, createTestAttributes())).not.toThrow();
    });

    it('deve lidar com NEX inválido', () => {
      const power: ActiveClassPower = {
        id: 'golpe-pesado',
        name: 'Golpe Pesado',
        classId: 'combatente',
        nex: 25,
      };

      expect(() => getClassPowerEffects([power], 0, createTestAttributes())).not.toThrow();
      expect(() => getClassPowerEffects([power], -1, createTestAttributes())).not.toThrow();
      expect(() => getClassPowerEffects([power], 999, createTestAttributes())).not.toThrow();
    });

    it('deve lidar com trilha inexistente', () => {
      const effects = getTrackEffects('trilha-que-nao-existe', 50, createTestAttributes());
      expect(effects).toEqual([]);
    });
  });
});
