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
  // Constantes de Grau de Treinamento
  TRAINING_GRADE_KEYS,
  LEGACY_TRAINING_GRADE_KEYS,
  // Funções de validação
  isValidClassId,
  isValidOriginId,
  isValidTrackId,
  isValidNexValue,
  isValidSkillId,
  isValidTrackForClass,
  getTracksForClass,
  // Novas funções de validação
  isValidPatentId,
  isValidElementId,
  isValidElementIdIgnoreCase,
  normalizeElementId,
  getPatentIdByName,
  isSkillOfAttribute,
  getSkillAttribute,
  // Funções de Grau de Treinamento
  getTrainingGradeKey,
  getTrainingGradeKeyForMilestone,
} from '../constants/game-ids';
import { ORIGINS, CLASSES, CLASS_TRACKS, SKILLS } from '../character-data';
import { SUPPLEMENT_ORIGINS } from '../origins';

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

  describe('Origens de Suplementos - Sincronização', () => {
    it('deve ter 18 origens de suplementos', () => {
      expect(VALID_SUPPLEMENT_ORIGIN_IDS).toHaveLength(18);
    });

    it('SUPPLEMENT_ORIGIN_IDS deve ter mesma quantidade que SUPPLEMENT_ORIGINS', () => {
      expect(VALID_SUPPLEMENT_ORIGIN_IDS.length).toBe(SUPPLEMENT_ORIGINS.length);
    });

    it('todos os IDs em game-ids.ts devem existir em supplement-origins.ts', () => {
      const supplementOriginsIds = SUPPLEMENT_ORIGINS.map(o => o.id);
      VALID_SUPPLEMENT_ORIGIN_IDS.forEach(originId => {
        expect(supplementOriginsIds).toContain(originId);
      });
    });

    it('todos os IDs em supplement-origins.ts devem existir em game-ids.ts', () => {
      SUPPLEMENT_ORIGINS.forEach(origin => {
        expect(VALID_SUPPLEMENT_ORIGIN_IDS).toContain(origin.id);
      });
    });

    it('IDs específicos devem corresponder', () => {
      // Expansões Oficiais
      expect(SUPPLEMENT_ORIGIN_IDS.AMIGO_DOS_ANIMAIS).toBe('amigo-dos-animais');
      expect(SUPPLEMENT_ORIGIN_IDS.ASTRONAUTA).toBe('astronauta');
      expect(SUPPLEMENT_ORIGIN_IDS.CHEF_DO_OUTRO_LADO).toBe('chef-do-outro-lado');
      
      // Comunidade
      expect(SUPPLEMENT_ORIGIN_IDS.COLEGIAL).toBe('colegial');
      expect(SUPPLEMENT_ORIGIN_IDS.COSPLAYER).toBe('cosplayer');
      expect(SUPPLEMENT_ORIGIN_IDS.DIPLOMATA).toBe('diplomata');
      expect(SUPPLEMENT_ORIGIN_IDS.EXPLORADOR).toBe('explorador');
      expect(SUPPLEMENT_ORIGIN_IDS.EXPERIMENTO).toBe('experimento');
      expect(SUPPLEMENT_ORIGIN_IDS.FANATICO_POR_CRIATURAS).toBe('fanatico-por-criaturas');
      expect(SUPPLEMENT_ORIGIN_IDS.FOTOGRAFO).toBe('fotografo');
      expect(SUPPLEMENT_ORIGIN_IDS.INVENTOR_PARANORMAL).toBe('inventor-paranormal');
      expect(SUPPLEMENT_ORIGIN_IDS.JOVEM_MISTICO).toBe('jovem-mistico');
      expect(SUPPLEMENT_ORIGIN_IDS.LEGISTA_TURNO_NOITE).toBe('legista-turno-noite');
      expect(SUPPLEMENT_ORIGIN_IDS.MOTORISTA).toBe('motorista');
      expect(SUPPLEMENT_ORIGIN_IDS.NERD_ENTUSIASTA).toBe('nerd-entusiasta');
      expect(SUPPLEMENT_ORIGIN_IDS.PSICOLOGO).toBe('psicologo');
      expect(SUPPLEMENT_ORIGIN_IDS.PROFETIZADO).toBe('profetizado');
      expect(SUPPLEMENT_ORIGIN_IDS.REPORTER_INVESTIGATIVO).toBe('reporter-investigativo');
    });

    it('ALL_ORIGIN_IDS deve conter origens base e suplementos', () => {
      // Deve ter 26 base + 18 suplementos = 44 total
      expect(ALL_ORIGIN_IDS.length).toBe(VALID_CORE_ORIGIN_IDS.length + VALID_SUPPLEMENT_ORIGIN_IDS.length);
      expect(ALL_ORIGIN_IDS.length).toBe(44);
    });

    it('isValidOriginId deve validar origens de suplementos', () => {
      // Testa algumas origens de suplementos
      expect(isValidOriginId('amigo-dos-animais')).toBe(true);
      expect(isValidOriginId('astronauta')).toBe(true);
      expect(isValidOriginId('colegial')).toBe(true);
      expect(isValidOriginId('inventor-paranormal')).toBe(true);
      expect(isValidOriginId('profetizado')).toBe(true);
      
      // IDs inválidos
      expect(isValidOriginId('origem-inventada')).toBe(false);
      expect(isValidOriginId('ASTRONAUTA')).toBe(false); // Case-sensitive
    });

    it('cada origem de suplemento deve ter um source definido', () => {
      SUPPLEMENT_ORIGINS.forEach(origin => {
        expect(origin.source).toBeDefined();
        expect(origin.source).not.toBe('');
      });
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

    it('isValidElementId deve validar corretamente', () => {
      expect(isValidElementId('Sangue')).toBe(true);
      expect(isValidElementId('Morte')).toBe(true);
      expect(isValidElementId('Conhecimento')).toBe(true);
      expect(isValidElementId('Energia')).toBe(true);
      expect(isValidElementId('Medo')).toBe(true);
      expect(isValidElementId('Invalido')).toBe(false);
      expect(isValidElementId('sangue')).toBe(false); // Case-sensitive
    });

    it('isValidElementIdIgnoreCase deve validar case-insensitive', () => {
      expect(isValidElementIdIgnoreCase('sangue')).toBe(true);
      expect(isValidElementIdIgnoreCase('SANGUE')).toBe(true);
      expect(isValidElementIdIgnoreCase('Sangue')).toBe(true);
      expect(isValidElementIdIgnoreCase('SaNgUe')).toBe(true);
      expect(isValidElementIdIgnoreCase('invalido')).toBe(false);
    });

    it('normalizeElementId deve normalizar corretamente', () => {
      expect(normalizeElementId('sangue')).toBe('Sangue');
      expect(normalizeElementId('MORTE')).toBe('Morte');
      expect(normalizeElementId('Conhecimento')).toBe('Conhecimento');
      expect(normalizeElementId('invalido')).toBeNull();
    });
  });

  describe('Patentes - Funções de Validação', () => {
    it('isValidPatentId deve validar corretamente', () => {
      expect(isValidPatentId('Recruta')).toBe(true);
      expect(isValidPatentId('Operador')).toBe(true);
      expect(isValidPatentId('Agente Especial')).toBe(true);
      expect(isValidPatentId('Oficial de Operações')).toBe(true);
      expect(isValidPatentId('Agente de Elite')).toBe(true);
      expect(isValidPatentId('Invalido')).toBe(false);
      expect(isValidPatentId('recruta')).toBe(false); // Case-sensitive
    });

    it('getPatentIdByName deve buscar case-insensitive', () => {
      expect(getPatentIdByName('recruta')).toBe('Recruta');
      expect(getPatentIdByName('OPERADOR')).toBe('Operador');
      expect(getPatentIdByName('agente especial')).toBe('Agente Especial');
      expect(getPatentIdByName('invalido')).toBeNull();
    });
  });

  describe('Perícias - Funções de Atributo', () => {
    it('isSkillOfAttribute deve verificar corretamente', () => {
      // Agilidade
      expect(isSkillOfAttribute('acrobacia', 'agility')).toBe(true);
      expect(isSkillOfAttribute('furtividade', 'agility')).toBe(true);
      expect(isSkillOfAttribute('luta', 'agility')).toBe(false);
      
      // Força
      expect(isSkillOfAttribute('atletismo', 'strength')).toBe(true);
      expect(isSkillOfAttribute('luta', 'strength')).toBe(true);
      expect(isSkillOfAttribute('acrobacia', 'strength')).toBe(false);
      
      // Intelecto
      expect(isSkillOfAttribute('medicina', 'intellect')).toBe(true);
      expect(isSkillOfAttribute('ocultismo', 'intellect')).toBe(true);
      expect(isSkillOfAttribute('diplomacia', 'intellect')).toBe(false);
      
      // Presença
      expect(isSkillOfAttribute('diplomacia', 'presence')).toBe(true);
      expect(isSkillOfAttribute('intimidacao', 'presence')).toBe(true);
      expect(isSkillOfAttribute('medicina', 'presence')).toBe(false);
      
      // Vigor
      expect(isSkillOfAttribute('fortitude', 'vigor')).toBe(true);
      expect(isSkillOfAttribute('atletismo', 'vigor')).toBe(false);
    });

    it('getSkillAttribute deve retornar atributo correto', () => {
      expect(getSkillAttribute('acrobacia')).toBe('agility');
      expect(getSkillAttribute('atletismo')).toBe('strength');
      expect(getSkillAttribute('medicina')).toBe('intellect');
      expect(getSkillAttribute('diplomacia')).toBe('presence');
      expect(getSkillAttribute('fortitude')).toBe('vigor');
      expect(getSkillAttribute('invalido')).toBeNull();
    });

    it('todas as perícias devem ter um atributo', () => {
      VALID_SKILL_IDS.forEach(skillId => {
        // Ignora 'iniciativa' que é especial
        if (skillId !== 'iniciativa') {
          const attr = getSkillAttribute(skillId);
          expect(attr).not.toBeNull();
        }
      });
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

    it('soma de perícias por atributo deve corresponder ao total', () => {
      const totalByAttribute = 
        SKILLS_BY_ATTRIBUTE.agility.length +
        SKILLS_BY_ATTRIBUTE.strength.length +
        SKILLS_BY_ATTRIBUTE.intellect.length +
        SKILLS_BY_ATTRIBUTE.presence.length +
        SKILLS_BY_ATTRIBUTE.vigor.length;
      
      // Iniciativa também usa Agilidade; nenhum ID fica fora do catálogo.
      expect(totalByAttribute).toBe(VALID_SKILL_IDS.length);
    });
  });

  // ============================================
  // TRAINING_GRADE_KEYS - Chaves de Grau de Treinamento
  // ============================================
  
  describe('TRAINING_GRADE_KEYS', () => {
    it('deve ter exatamente 2 chaves (NEX_35 e NEX_70)', () => {
      expect(Object.keys(TRAINING_GRADE_KEYS)).toHaveLength(2);
      expect(TRAINING_GRADE_KEYS.NEX_35).toBeDefined();
      expect(TRAINING_GRADE_KEYS.NEX_70).toBeDefined();
    });

    it('NEX_35 deve ser "nex35" (formato oficial do banco)', () => {
      expect(TRAINING_GRADE_KEYS.NEX_35).toBe('nex35');
    });

    it('NEX_70 deve ser "nex70" (formato oficial do banco)', () => {
      expect(TRAINING_GRADE_KEYS.NEX_70).toBe('nex70');
    });

    it('chaves devem seguir padrão kebab-case sem underscores', () => {
      expect(TRAINING_GRADE_KEYS.NEX_35).not.toContain('_');
      expect(TRAINING_GRADE_KEYS.NEX_70).not.toContain('_');
    });

    it('chaves devem ser strings não vazias', () => {
      expect(TRAINING_GRADE_KEYS.NEX_35.length).toBeGreaterThan(0);
      expect(TRAINING_GRADE_KEYS.NEX_70.length).toBeGreaterThan(0);
    });

    it('valores devem corresponder aos NEX válidos para Grau de Treinamento', () => {
      // NEX 35% e 70% são os únicos que concedem Grau de Treinamento
      expect(VALID_NEX_VALUES).toContain(35);
      expect(VALID_NEX_VALUES).toContain(70);
    });
  });

  describe('LEGACY_TRAINING_GRADE_KEYS', () => {
    it('deve ter exatamente 2 chaves legadas (NEX_35 e NEX_70)', () => {
      expect(Object.keys(LEGACY_TRAINING_GRADE_KEYS)).toHaveLength(2);
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_35).toBeDefined();
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_70).toBeDefined();
    });

    it('chaves legadas devem ser strings numéricas', () => {
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_35).toBe('35');
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_70).toBe('70');
    });

    it('chaves legadas devem ser diferentes das chaves atuais', () => {
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_35).not.toBe(TRAINING_GRADE_KEYS.NEX_35);
      expect(LEGACY_TRAINING_GRADE_KEYS.NEX_70).not.toBe(TRAINING_GRADE_KEYS.NEX_70);
    });
  });

  describe('Consistência entre TRAINING_GRADE_KEYS e estrutura do banco', () => {
    it('formato JSON esperado deve usar chaves nex35 e nex70', () => {
      // Simula estrutura esperada no banco
      const expectedDbStructure = {
        [TRAINING_GRADE_KEYS.NEX_35]: [],
        [TRAINING_GRADE_KEYS.NEX_70]: [],
      };
      
      expect(Object.keys(expectedDbStructure)).toContain('nex35');
      expect(Object.keys(expectedDbStructure)).toContain('nex70');
    });

    it('deve ser possível usar chaves como propriedades computadas', () => {
      const choices: Record<string, unknown[]> = {};
      
      // Testa atribuição dinâmica (como usado nos handlers)
      choices[TRAINING_GRADE_KEYS.NEX_35] = [{ skillId: 'teste', fromLevel: 1, toLevel: 2 }];
      choices[TRAINING_GRADE_KEYS.NEX_70] = [{ skillId: 'teste2', fromLevel: 2, toLevel: 3 }];
      
      expect(choices.nex35).toHaveLength(1);
      expect(choices.nex70).toHaveLength(1);
    });

    it('fallback para chaves legadas deve funcionar', () => {
      // Simula dados legados (antes da padronização)
      const legacyData: Record<string, unknown[]> = {
        '35': [{ skillId: 'atletismo' }],
        '70': [{ skillId: 'fortitude' }],
      };
      
      // Lógica de fallback usada no character-audit-engine.ts
      const grade35 = legacyData[TRAINING_GRADE_KEYS.NEX_35] || legacyData[LEGACY_TRAINING_GRADE_KEYS.NEX_35] || [];
      const grade70 = legacyData[TRAINING_GRADE_KEYS.NEX_70] || legacyData[LEGACY_TRAINING_GRADE_KEYS.NEX_70] || [];
      
      expect(grade35).toHaveLength(1);
      expect(grade70).toHaveLength(1);
    });

    it('novos dados devem usar apenas chaves atuais (não legadas)', () => {
      // Simula dados novos (após padronização)
      const newData: Record<string, unknown[]> = {
        nex35: [{ skillId: 'atletismo' }],
        nex70: [{ skillId: 'fortitude' }],
      };
      
      // Lógica de fallback - deve encontrar na primeira tentativa
      const grade35 = newData[TRAINING_GRADE_KEYS.NEX_35] || newData[LEGACY_TRAINING_GRADE_KEYS.NEX_35] || [];
      const grade70 = newData[TRAINING_GRADE_KEYS.NEX_70] || newData[LEGACY_TRAINING_GRADE_KEYS.NEX_70] || [];
      
      expect(grade35).toHaveLength(1);
      expect(grade70).toHaveLength(1);
      
      // Confirma que não usa chaves legadas
      expect(newData['35']).toBeUndefined();
      expect(newData['70']).toBeUndefined();
    });
  });

  // ============================================
  // getTrainingGradeKey - Função Helper
  // ============================================

  describe('getTrainingGradeKey', () => {
    it('deve retornar null para NEX abaixo de 35', () => {
      expect(getTrainingGradeKey(5)).toBeNull();
      expect(getTrainingGradeKey(10)).toBeNull();
      expect(getTrainingGradeKey(20)).toBeNull();
      expect(getTrainingGradeKey(30)).toBeNull();
      expect(getTrainingGradeKey(34)).toBeNull();
    });

    it('deve retornar "nex35" para NEX 35', () => {
      expect(getTrainingGradeKey(35)).toBe('nex35');
      expect(getTrainingGradeKey(35)).toBe(TRAINING_GRADE_KEYS.NEX_35);
    });

    it('deve retornar "nex35" para NEX entre 35 e 69', () => {
      expect(getTrainingGradeKey(40)).toBe('nex35');
      expect(getTrainingGradeKey(50)).toBe('nex35');
      expect(getTrainingGradeKey(65)).toBe('nex35');
      expect(getTrainingGradeKey(69)).toBe('nex35');
    });

    it('deve retornar "nex70" para NEX 70', () => {
      expect(getTrainingGradeKey(70)).toBe('nex70');
      expect(getTrainingGradeKey(70)).toBe(TRAINING_GRADE_KEYS.NEX_70);
    });

    it('deve retornar "nex70" para NEX acima de 70', () => {
      expect(getTrainingGradeKey(75)).toBe('nex70');
      expect(getTrainingGradeKey(85)).toBe('nex70');
      expect(getTrainingGradeKey(95)).toBe('nex70');
      expect(getTrainingGradeKey(99)).toBe('nex70');
    });

    it('deve funcionar com todos os valores de NEX válidos', () => {
      VALID_NEX_VALUES.forEach(nex => {
        const result = getTrainingGradeKey(nex);
        if (nex < 35) {
          expect(result).toBeNull();
        } else if (nex < 70) {
          expect(result).toBe('nex35');
        } else {
          expect(result).toBe('nex70');
        }
      });
    });
  });

  describe('getTrainingGradeKeyForMilestone', () => {
    it('deve retornar "nex35" para milestone 35', () => {
      expect(getTrainingGradeKeyForMilestone(35)).toBe('nex35');
      expect(getTrainingGradeKeyForMilestone(35)).toBe(TRAINING_GRADE_KEYS.NEX_35);
    });

    it('deve retornar "nex70" para milestone 70', () => {
      expect(getTrainingGradeKeyForMilestone(70)).toBe('nex70');
      expect(getTrainingGradeKeyForMilestone(70)).toBe(TRAINING_GRADE_KEYS.NEX_70);
    });

    it('deve ser usável em lógica de handler', () => {
      // Simula uso típico em handler
      const handleUpgrade = (milestone: 35 | 70) => {
        const key = getTrainingGradeKeyForMilestone(milestone);
        return { [key]: [{ skillId: 'teste' }] };
      };

      const result35 = handleUpgrade(35);
      const result70 = handleUpgrade(70);

      expect(result35).toHaveProperty('nex35');
      expect(result70).toHaveProperty('nex70');
    });
  });
});

// ============================================
// Testes de Migração de Chaves Legadas
// (Testados em character-audit-engine.test.ts)
// ============================================
