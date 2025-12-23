/**
 * Teste de Integridade para game-ids.ts
 * 
 * Verifica se os IDs centralizados em game-ids.ts correspondem
 * aos IDs usados em character-data.ts e outros arquivos.
 * 
 * Execute com: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  CLASS_IDS,
  VALID_CLASS_IDS,
  COMBATENTE_TRACK_IDS,
  ESPECIALISTA_TRACK_IDS,
  OCULTISTA_TRACK_IDS,
  TRACKS_BY_CLASS,
  ALL_TRACK_IDS,
  CORE_ORIGIN_IDS,
  VALID_CORE_ORIGIN_IDS,
  SUPPLEMENT_ORIGIN_IDS,
  VALID_SUPPLEMENT_ORIGIN_IDS,
  ALL_ORIGIN_IDS,
  PATENT_IDS,
  VALID_PATENT_IDS,
  VALID_NEX_VALUES,
  SKILL_IDS,
  VALID_SKILL_IDS,
  SKILLS_BY_ATTRIBUTE,
  INTELLECT_SKILL_IDS,
  ELEMENT_IDS,
  VALID_ELEMENT_IDS,
  isValidClassId,
  isValidOriginId,
  isValidTrackId,
  isValidNexValue,
  isValidSkillId,
  isValidTrackForClass,
  getTracksForClass,
} from '../constants/game-ids';
import { ORIGINS, CLASSES, CLASS_TRACKS, SKILLS } from '../character-data';

describe('game-ids.ts - Integridade de IDs', () => {
  
  describe('Classes', () => {
    it('deve ter 3 classes válidas', () => {
      expect(VALID_CLASS_IDS).toHaveLength(3);
    });

    it('deve corresponder às classes em character-data', () => {
      const characterDataClasses = CLASSES.map(c => c.id);
      VALID_CLASS_IDS.forEach(classId => {
        expect(characterDataClasses).toContain(classId);
      });
    });

    it('isValidClassId deve validar corretamente', () => {
      expect(isValidClassId('Combatente')).toBe(true);
      expect(isValidClassId('Especialista')).toBe(true);
      expect(isValidClassId('Ocultista')).toBe(true);
      expect(isValidClassId('Invalido')).toBe(false);
    });
  });

  describe('Trilhas', () => {
    it('Combatente deve ter 5 trilhas', () => {
      expect(Object.values(COMBATENTE_TRACK_IDS)).toHaveLength(5);
    });

    it('Especialista deve ter 5 trilhas', () => {
      expect(Object.values(ESPECIALISTA_TRACK_IDS)).toHaveLength(5);
    });

    it('Ocultista deve ter 5 trilhas', () => {
      expect(Object.values(OCULTISTA_TRACK_IDS)).toHaveLength(5);
    });

    it('ALL_TRACK_IDS deve ter 15 trilhas', () => {
      expect(ALL_TRACK_IDS).toHaveLength(15);
    });

    it('trilhas devem corresponder a CLASS_TRACKS', () => {
      const classTracksIds = CLASS_TRACKS.map(t => t.id);
      ALL_TRACK_IDS.forEach(trackId => {
        expect(classTracksIds).toContain(trackId);
      });
    });

    it('isValidTrackForClass deve validar corretamente', () => {
      expect(isValidTrackForClass('aniquilador', 'Combatente')).toBe(true);
      expect(isValidTrackForClass('aniquilador', 'combatente')).toBe(true);
      expect(isValidTrackForClass('aniquilador', 'Especialista')).toBe(false);
      expect(isValidTrackForClass('condutor', 'Ocultista')).toBe(true);
    });

    it('getTracksForClass deve retornar trilhas corretas', () => {
      const combatenteTracks = getTracksForClass('Combatente');
      expect(combatenteTracks).toContain('aniquilador');
      expect(combatenteTracks).toContain('guerreiro');
      expect(combatenteTracks).not.toContain('condutor');
    });
  });

  describe('Origens', () => {
    it('deve ter 26 origens do livro base', () => {
      expect(VALID_CORE_ORIGIN_IDS).toHaveLength(26);
    });

    it('origens base devem corresponder a ORIGINS', () => {
      const originsIds = ORIGINS.map(o => o.id);
      VALID_CORE_ORIGIN_IDS.forEach(originId => {
        expect(originsIds).toContain(originId);
      });
    });

    it('isValidOriginId deve validar corretamente', () => {
      expect(isValidOriginId('academico')).toBe(true);
      expect(isValidOriginId('atleta')).toBe(true);
      expect(isValidOriginId('invalido')).toBe(false);
    });
  });

  describe('Patentes', () => {
    it('deve ter 5 patentes', () => {
      expect(VALID_PATENT_IDS).toHaveLength(5);
    });

    it('patentes devem ter nomes corretos', () => {
      expect(PATENT_IDS.RECRUTA).toBe('Recruta');
      expect(PATENT_IDS.OPERADOR).toBe('Operador');
      expect(PATENT_IDS.AGENTE_ESPECIAL).toBe('Agente Especial');
      expect(PATENT_IDS.OFICIAL_DE_OPERACOES).toBe('Oficial de Operações');
      expect(PATENT_IDS.AGENTE_DE_ELITE).toBe('Agente de Elite');
    });
  });

  describe('NEX', () => {
    it('deve ter 20 valores de NEX válidos', () => {
      expect(VALID_NEX_VALUES).toHaveLength(20);
    });

    it('valores devem ir de 5 a 99', () => {
      expect(VALID_NEX_VALUES[0]).toBe(5);
      expect(VALID_NEX_VALUES[VALID_NEX_VALUES.length - 1]).toBe(99);
    });

    it('isValidNexValue deve validar corretamente', () => {
      expect(isValidNexValue(5)).toBe(true);
      expect(isValidNexValue(50)).toBe(true);
      expect(isValidNexValue(99)).toBe(true);
      expect(isValidNexValue(100)).toBe(false);
      expect(isValidNexValue(0)).toBe(false);
    });
  });

  describe('Perícias', () => {
    it('deve ter todas as perícias do sistema', () => {
      expect(VALID_SKILL_IDS.length).toBeGreaterThanOrEqual(25);
    });

    it('perícias devem corresponder a SKILLS', () => {
      const skillsIds = SKILLS.map(s => s.id);
      VALID_SKILL_IDS.forEach(skillId => {
        expect(skillsIds).toContain(skillId);
      });
    });

    it('INTELLECT_SKILL_IDS deve conter apenas perícias de Intelecto', () => {
      expect(INTELLECT_SKILL_IDS).toContain('atualidades');
      expect(INTELLECT_SKILL_IDS).toContain('ciencias');
      expect(INTELLECT_SKILL_IDS).toContain('medicina');
      expect(INTELLECT_SKILL_IDS).not.toContain('atletismo');
      expect(INTELLECT_SKILL_IDS).not.toContain('luta');
    });

    it('isValidSkillId deve validar corretamente', () => {
      expect(isValidSkillId('acrobacia')).toBe(true);
      expect(isValidSkillId('luta')).toBe(true);
      expect(isValidSkillId('invalido')).toBe(false);
    });
  });

  describe('Elementos', () => {
    it('deve ter 5 elementos', () => {
      expect(VALID_ELEMENT_IDS).toHaveLength(5);
    });

    it('elementos devem ter nomes corretos', () => {
      expect(ELEMENT_IDS.SANGUE).toBe('Sangue');
      expect(ELEMENT_IDS.MORTE).toBe('Morte');
      expect(ELEMENT_IDS.CONHECIMENTO).toBe('Conhecimento');
      expect(ELEMENT_IDS.ENERGIA).toBe('Energia');
      expect(ELEMENT_IDS.MEDO).toBe('Medo');
    });
  });

  describe('SKILLS_BY_ATTRIBUTE', () => {
    it('deve ter mapeamento para todos os atributos', () => {
      expect(SKILLS_BY_ATTRIBUTE.agility).toBeDefined();
      expect(SKILLS_BY_ATTRIBUTE.strength).toBeDefined();
      expect(SKILLS_BY_ATTRIBUTE.intellect).toBeDefined();
      expect(SKILLS_BY_ATTRIBUTE.presence).toBeDefined();
      expect(SKILLS_BY_ATTRIBUTE.vigor).toBeDefined();
    });

    it('Agilidade deve ter perícias corretas', () => {
      expect(SKILLS_BY_ATTRIBUTE.agility).toContain('acrobacia');
      expect(SKILLS_BY_ATTRIBUTE.agility).toContain('furtividade');
      expect(SKILLS_BY_ATTRIBUTE.agility).toContain('pontaria');
    });

    it('Força deve ter atletismo e luta', () => {
      expect(SKILLS_BY_ATTRIBUTE.strength).toContain('atletismo');
      expect(SKILLS_BY_ATTRIBUTE.strength).toContain('luta');
    });

    it('Vigor deve ter fortitude', () => {
      expect(SKILLS_BY_ATTRIBUTE.vigor).toContain('fortitude');
    });
  });
});
