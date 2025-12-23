/**
 * Testes unitários para as funções utilitárias de atributos
 * src/lib/constants/attributes.ts
 */

import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_ORDER,
  ATTRIBUTE_NAMES,
  ATTRIBUTE_ABBR,
  ATTRIBUTE_COLORS,
  ATTRIBUTE_DISPLAY,
  ABBR_TO_KEY,
  NAME_TO_KEY,
  getAttributeName,
  getAttributeAbbr,
  getAttributeColor,
  getAttributeDisplay,
  DEFAULT_ATTRIBUTES,
  type AttributeKey,
} from '../attributes';

describe('Constantes de Atributos', () => {
  describe('ATTRIBUTE_ORDER', () => {
    it('deve conter exatamente 5 atributos', () => {
      expect(ATTRIBUTE_ORDER).toHaveLength(5);
    });

    it('deve conter todos os atributos na ordem correta', () => {
      expect(ATTRIBUTE_ORDER).toEqual([
        'agility',
        'strength',
        'intellect',
        'presence',
        'vigor',
      ]);
    });
  });

  describe('ATTRIBUTE_NAMES', () => {
    it('deve mapear todos os atributos para nomes em português', () => {
      expect(ATTRIBUTE_NAMES.agility).toBe('Agilidade');
      expect(ATTRIBUTE_NAMES.strength).toBe('Força');
      expect(ATTRIBUTE_NAMES.intellect).toBe('Intelecto');
      expect(ATTRIBUTE_NAMES.presence).toBe('Presença');
      expect(ATTRIBUTE_NAMES.vigor).toBe('Vigor');
    });

    it('deve ter entrada para cada atributo em ATTRIBUTE_ORDER', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        expect(ATTRIBUTE_NAMES[key]).toBeDefined();
        expect(typeof ATTRIBUTE_NAMES[key]).toBe('string');
      });
    });
  });

  describe('ATTRIBUTE_ABBR', () => {
    it('deve mapear todos os atributos para abreviações de 3 letras', () => {
      expect(ATTRIBUTE_ABBR.agility).toBe('AGI');
      expect(ATTRIBUTE_ABBR.strength).toBe('FOR');
      expect(ATTRIBUTE_ABBR.intellect).toBe('INT');
      expect(ATTRIBUTE_ABBR.presence).toBe('PRE');
      expect(ATTRIBUTE_ABBR.vigor).toBe('VIG');
    });

    it('todas as abreviações devem ter exatamente 3 caracteres', () => {
      Object.values(ATTRIBUTE_ABBR).forEach((abbr) => {
        expect(abbr).toHaveLength(3);
      });
    });
  });

  describe('ATTRIBUTE_COLORS', () => {
    it('deve usar variáveis CSS do design system', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        expect(ATTRIBUTE_COLORS[key]).toMatch(/^hsl\(var\(--attr-/);
      });
    });
  });

  describe('ATTRIBUTE_DISPLAY', () => {
    it('deve conter dados completos para cada atributo', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        const display = ATTRIBUTE_DISPLAY[key];
        expect(display).toBeDefined();
        expect(display.name).toBe(ATTRIBUTE_NAMES[key]);
        expect(display.abbr).toBe(ATTRIBUTE_ABBR[key]);
        expect(display.color).toBeDefined();
        expect(display.bgColor).toBeDefined();
        expect(display.borderColor).toBeDefined();
        expect(display.textColor).toBeDefined();
      });
    });
  });

  describe('Mapeamentos reversos', () => {
    it('ABBR_TO_KEY deve mapear abreviações para chaves', () => {
      expect(ABBR_TO_KEY['AGI']).toBe('agility');
      expect(ABBR_TO_KEY['FOR']).toBe('strength');
      expect(ABBR_TO_KEY['INT']).toBe('intellect');
      expect(ABBR_TO_KEY['PRE']).toBe('presence');
      expect(ABBR_TO_KEY['VIG']).toBe('vigor');
    });

    it('NAME_TO_KEY deve mapear nomes completos para chaves', () => {
      expect(NAME_TO_KEY['Agilidade']).toBe('agility');
      expect(NAME_TO_KEY['Força']).toBe('strength');
      expect(NAME_TO_KEY['Intelecto']).toBe('intellect');
      expect(NAME_TO_KEY['Presença']).toBe('presence');
      expect(NAME_TO_KEY['Vigor']).toBe('vigor');
    });

    it('mapeamentos reversos devem ser consistentes com mapeamentos diretos', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        const abbr = ATTRIBUTE_ABBR[key];
        const name = ATTRIBUTE_NAMES[key];
        expect(ABBR_TO_KEY[abbr]).toBe(key);
        expect(NAME_TO_KEY[name]).toBe(key);
      });
    });
  });

  describe('DEFAULT_ATTRIBUTES', () => {
    it('deve ter valor 1 para todos os atributos', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        expect(DEFAULT_ATTRIBUTES[key]).toBe(1);
      });
    });
  });
});

describe('Funções Utilitárias', () => {
  describe('getAttributeName', () => {
    it('deve retornar nome completo quando recebe chave', () => {
      expect(getAttributeName('agility')).toBe('Agilidade');
      expect(getAttributeName('strength')).toBe('Força');
      expect(getAttributeName('intellect')).toBe('Intelecto');
      expect(getAttributeName('presence')).toBe('Presença');
      expect(getAttributeName('vigor')).toBe('Vigor');
    });

    it('deve retornar nome completo quando recebe abreviação', () => {
      expect(getAttributeName('AGI')).toBe('Agilidade');
      expect(getAttributeName('FOR')).toBe('Força');
      expect(getAttributeName('INT')).toBe('Intelecto');
      expect(getAttributeName('PRE')).toBe('Presença');
      expect(getAttributeName('VIG')).toBe('Vigor');
    });

    it('deve retornar o próprio valor quando não encontra mapeamento', () => {
      expect(getAttributeName('unknown')).toBe('unknown');
      expect(getAttributeName('XYZ')).toBe('XYZ');
    });
  });

  describe('getAttributeAbbr', () => {
    it('deve retornar abreviação quando recebe chave', () => {
      expect(getAttributeAbbr('agility')).toBe('AGI');
      expect(getAttributeAbbr('strength')).toBe('FOR');
      expect(getAttributeAbbr('intellect')).toBe('INT');
      expect(getAttributeAbbr('presence')).toBe('PRE');
      expect(getAttributeAbbr('vigor')).toBe('VIG');
    });

    it('deve retornar abreviação quando recebe nome completo', () => {
      expect(getAttributeAbbr('Agilidade')).toBe('AGI');
      expect(getAttributeAbbr('Força')).toBe('FOR');
      expect(getAttributeAbbr('Intelecto')).toBe('INT');
      expect(getAttributeAbbr('Presença')).toBe('PRE');
      expect(getAttributeAbbr('Vigor')).toBe('VIG');
    });

    it('deve retornar o próprio valor quando não encontra mapeamento', () => {
      expect(getAttributeAbbr('unknown')).toBe('unknown');
      expect(getAttributeAbbr('XYZ')).toBe('XYZ');
    });
  });

  describe('getAttributeColor', () => {
    it('deve retornar cor CSS para cada atributo', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        const color = getAttributeColor(key);
        expect(color).toMatch(/^hsl\(var\(--attr-/);
      });
    });

    it('deve retornar cor padrão para atributo desconhecido', () => {
      const color = getAttributeColor('unknown' as AttributeKey);
      expect(color).toBe('hsl(var(--foreground))');
    });
  });

  describe('getAttributeDisplay', () => {
    it('deve retornar objeto completo de exibição para cada atributo', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        const display = getAttributeDisplay(key);
        
        expect(display).toHaveProperty('name');
        expect(display).toHaveProperty('abbr');
        expect(display).toHaveProperty('color');
        expect(display).toHaveProperty('bgColor');
        expect(display).toHaveProperty('borderColor');
        expect(display).toHaveProperty('textColor');
      });
    });

    it('dados de exibição devem ser consistentes com outras constantes', () => {
      ATTRIBUTE_ORDER.forEach((key) => {
        const display = getAttributeDisplay(key);
        
        expect(display.name).toBe(ATTRIBUTE_NAMES[key]);
        expect(display.abbr).toBe(ATTRIBUTE_ABBR[key]);
        expect(display.color).toBe(ATTRIBUTE_COLORS[key]);
      });
    });
  });
});

describe('Integridade do Sistema de Atributos', () => {
  it('todas as constantes devem ter o mesmo número de entradas', () => {
    const count = ATTRIBUTE_ORDER.length;
    
    expect(Object.keys(ATTRIBUTE_NAMES)).toHaveLength(count);
    expect(Object.keys(ATTRIBUTE_ABBR)).toHaveLength(count);
    expect(Object.keys(ATTRIBUTE_COLORS)).toHaveLength(count);
    expect(Object.keys(ATTRIBUTE_DISPLAY)).toHaveLength(count);
    expect(Object.keys(ABBR_TO_KEY)).toHaveLength(count);
    expect(Object.keys(NAME_TO_KEY)).toHaveLength(count);
    expect(Object.keys(DEFAULT_ATTRIBUTES)).toHaveLength(count);
  });

  it('conversões entre formatos devem ser reversíveis', () => {
    ATTRIBUTE_ORDER.forEach((key) => {
      // key -> abbr -> key
      const abbr = ATTRIBUTE_ABBR[key];
      expect(ABBR_TO_KEY[abbr]).toBe(key);
      
      // key -> name -> key
      const name = ATTRIBUTE_NAMES[key];
      expect(NAME_TO_KEY[name]).toBe(key);
    });
  });

  it('nomes e abreviações devem ser únicos', () => {
    const names = Object.values(ATTRIBUTE_NAMES);
    const abbrs = Object.values(ATTRIBUTE_ABBR);
    
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(abbrs).size).toBe(abbrs.length);
  });
});
