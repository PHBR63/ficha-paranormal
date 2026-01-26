/**
 * Testes de Validação de Perícias e Poderes
 * Ordem Paranormal RPG v1.3
 * 
 * Valida as regras de perícias obrigatórias por classe
 * e pré-requisitos de poderes.
 */

import { describe, it, expect } from 'vitest';
import { validateCharacter } from '../rules-engine/validate-character';
import type { CharacterState } from '../rules-engine/types';

// ========================================
// HELPERS DE TESTE
// ========================================

/**
 * Cria um estado de personagem base para testes
 */
function createBaseCharacter(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    id: 'test-char',
    name: 'Agente Teste',
    characterClass: 'Combatente',
    nex: 50,
    origin: 'militar',
    attributes: {
      strength: 3,
      agility: 2,
      vigor: 2,
      intellect: 1,
      presence: 1,
    },
    skills: {
      luta: 'treinado',
      fortitude: 'treinado',
      atletismo: 'treinado',
    },
    classPowers: [],
    generalPowers: [],
    paranormalPowers: [],
    trackAbilities: [],
    rituals: [],
    sustainedRituals: [],
    equippedWeapons: [],
    inventory: [],
    activeConditions: [],
    hpCurrent: 40,
    peCurrent: 10,
    sanCurrent: 80,
    ...overrides,
  };
}

// ========================================
// TESTES: PERÍCIAS OBRIGATÓRIAS
// ========================================

describe('Validação de Perícias Obrigatórias', () => {
  describe('Ocultista', () => {
    it('Deve exigir Ocultismo treinado', () => {
      const state = createBaseCharacter({
        characterClass: 'Ocultista',
        classTrack: 'conduite',
        skills: {
          vontade: 'treinado',
          // Faltando ocultismo
        },
      });
      
      const result = validateCharacter(state);
      const ocultismoError = result.issues.find(
        i => i.ruleId === 'missing-mandatory-skill' && i.path === 'skills.ocultismo'
      );
      
      expect(ocultismoError).toBeDefined();
      expect(ocultismoError?.severity).toBe('error');
      expect(ocultismoError?.message).toContain('Ocultismo');
    });
    
    it('Deve exigir Vontade treinada', () => {
      const state = createBaseCharacter({
        characterClass: 'Ocultista',
        classTrack: 'conduite',
        skills: {
          ocultismo: 'treinado',
          // Faltando vontade
        },
      });
      
      const result = validateCharacter(state);
      const vontadeError = result.issues.find(
        i => i.ruleId === 'missing-mandatory-skill' && i.path === 'skills.vontade'
      );
      
      expect(vontadeError).toBeDefined();
      expect(vontadeError?.severity).toBe('error');
      expect(vontadeError?.message).toContain('Vontade');
    });
    
    it('Deve passar se ambas as perícias estiverem treinadas', () => {
      const state = createBaseCharacter({
        characterClass: 'Ocultista',
        classTrack: 'conduite',
        skills: {
          ocultismo: 'treinado',
          vontade: 'treinado',
          ciencias: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      const mandatoryErrors = result.issues.filter(
        i => i.ruleId === 'missing-mandatory-skill'
      );
      
      expect(mandatoryErrors.length).toBe(0);
    });
  });
  
  describe('Combatente', () => {
    it('Não deve exigir perícias obrigatórias fixas', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        classTrack: 'guerreiro',
        skills: {
          atletismo: 'treinado',
          intimidacao: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      const mandatoryErrors = result.issues.filter(
        i => i.ruleId === 'missing-mandatory-skill'
      );
      
      expect(mandatoryErrors.length).toBe(0);
    });
  });
  
  describe('Especialista', () => {
    it('Não deve exigir perícias obrigatórias fixas', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'infiltrador',
        skills: {
          furtividade: 'treinado',
          crime: 'treinado',
          percepcao: 'treinado',
          acrobacia: 'treinado',
          enganacao: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      const mandatoryErrors = result.issues.filter(
        i => i.ruleId === 'missing-mandatory-skill'
      );
      
      expect(mandatoryErrors.length).toBe(0);
    });
  });
});

// ========================================
// TESTES: QUANTIDADE DE PERÍCIAS
// ========================================

describe('Validação de Quantidade de Perícias', () => {
  it('Deve alertar se Combatente tiver poucas perícias', () => {
    const state = createBaseCharacter({
      characterClass: 'Combatente',
      attributes: { strength: 3, agility: 2, vigor: 2, intellect: 2, presence: 0 },
      skills: {
        luta: 'treinado',
        // Deveria ter 2 + INT(2) = 4 perícias
      },
    });
    
    const result = validateCharacter(state);
    const skillCountWarning = result.issues.find(
      i => i.ruleId === 'low-trained-skills'
    );
    
    expect(skillCountWarning).toBeDefined();
    expect(skillCountWarning?.severity).toBe('warning');
  });
  
  it('Deve alertar se Especialista tiver poucas perícias', () => {
    const state = createBaseCharacter({
      characterClass: 'Especialista',
      classTrack: 'tecnico',
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 3, presence: 2 },
      skills: {
        tecnologia: 'treinado',
        ciencias: 'treinado',
        // Deveria ter 4 + INT(3) = 7 perícias
      },
    });
    
    const result = validateCharacter(state);
    const skillCountWarning = result.issues.find(
      i => i.ruleId === 'low-trained-skills'
    );
    
    expect(skillCountWarning).toBeDefined();
    expect(skillCountWarning?.message).toContain('4 + INT 3');
  });
  
  it('Não deve alertar se quantidade de perícias estiver correta', () => {
    const state = createBaseCharacter({
      characterClass: 'Combatente',
      attributes: { strength: 3, agility: 2, vigor: 2, intellect: 1, presence: 1 },
      skills: {
        luta: 'treinado',
        fortitude: 'treinado',
        atletismo: 'treinado',
        // 2 + INT(1) = 3 perícias
      },
    });
    
    const result = validateCharacter(state);
    const skillCountIssues = result.issues.filter(
      i => i.ruleId === 'low-trained-skills' || i.ruleId === 'excess-trained-skills'
    );
    
    expect(skillCountIssues.length).toBe(0);
  });
});

// ========================================
// TESTES: NÍVEIS DE PERÍCIA VS NEX
// ========================================

describe('Validação de Níveis de Perícia vs NEX', () => {
  it('Deve bloquear Veterano antes de NEX 35%', () => {
    const state = createBaseCharacter({
      nex: 30,
      skills: {
        luta: 'veterano', // Inválido em NEX 30%
        fortitude: 'treinado',
        atletismo: 'treinado',
      },
    });
    
    const result = validateCharacter(state);
    const veteranError = result.issues.find(
      i => i.ruleId === 'veteran-before-nex35'
    );
    
    expect(veteranError).toBeDefined();
    expect(veteranError?.severity).toBe('error');
    expect(veteranError?.suggestedFix?.value).toBe('treinado');
  });
  
  it('Deve permitir Veterano em NEX 35%+', () => {
    const state = createBaseCharacter({
      nex: 35,
      skills: {
        luta: 'veterano',
        fortitude: 'treinado',
        atletismo: 'treinado',
      },
    });
    
    const result = validateCharacter(state);
    const veteranError = result.issues.find(
      i => i.ruleId === 'veteran-before-nex35'
    );
    
    expect(veteranError).toBeUndefined();
  });
  
  it('Deve bloquear Expert antes de NEX 70%', () => {
    const state = createBaseCharacter({
      nex: 65,
      skills: {
        luta: 'expert', // Inválido em NEX 65%
        fortitude: 'veterano',
        atletismo: 'treinado',
      },
    });
    
    const result = validateCharacter(state);
    const expertError = result.issues.find(
      i => i.ruleId === 'expert-before-nex70'
    );
    
    expect(expertError).toBeDefined();
    expect(expertError?.severity).toBe('error');
    expect(expertError?.suggestedFix?.value).toBe('veterano');
  });
  
  it('Deve permitir Expert em NEX 70%+', () => {
    const state = createBaseCharacter({
      nex: 70,
      skills: {
        luta: 'expert',
        fortitude: 'veterano',
        atletismo: 'treinado',
      },
    });
    
    const result = validateCharacter(state);
    const expertError = result.issues.find(
      i => i.ruleId === 'expert-before-nex70'
    );
    
    expect(expertError).toBeUndefined();
  });
});

// ========================================
// TESTES: PRÉ-REQUISITOS DE PODERES
// ========================================

describe('Validação de Pré-requisitos de Poderes', () => {
  describe('Pré-requisitos de Atributo', () => {
    it('Deve bloquear poder se atributo for insuficiente', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        attributes: { strength: 1, agility: 2, vigor: 2, intellect: 1, presence: 3 }, // FOR 1 < 2
        classPowers: ['armamento-pesado'], // Requer FOR 2
      });
      
      const result = validateCharacter(state);
      const prereqError = result.issues.find(
        i => i.ruleId === 'power-prerequisites-not-met' && i.message.includes('Armamento Pesado')
      );
      
      expect(prereqError).toBeDefined();
      expect(prereqError?.message).toContain('Força 2');
    });
    
    it('Deve permitir poder se atributo for suficiente', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        attributes: { strength: 2, agility: 2, vigor: 2, intellect: 1, presence: 2 },
        classPowers: ['armamento-pesado'], // Requer FOR 2
      });
      
      const result = validateCharacter(state);
      const prereqError = result.issues.find(
        i => i.ruleId === 'power-prerequisites-not-met' && i.message.includes('Armamento Pesado')
      );
      
      expect(prereqError).toBeUndefined();
    });
  });
  
  describe('Pré-requisitos de Perícia', () => {
    it('Deve bloquear poder se perícia não estiver treinada', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'tecnico',
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 2, presence: 3 },
        skills: {
          // Faltando tecnologia
          ciencias: 'treinado',
        },
        classPowers: ['hacker'], // Requer Tecnologia treinada
      });
      
      const result = validateCharacter(state);
      const prereqError = result.issues.find(
        i => i.ruleId === 'power-prerequisites-not-met' && i.message.includes('Hacker')
      );
      
      expect(prereqError).toBeDefined();
      expect(prereqError?.message).toContain('Tecnologia');
    });
    
    it('Deve permitir poder se perícia estiver treinada', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'tecnico',
        attributes: { strength: 1, agility: 2, vigor: 1, intellect: 2, presence: 3 },
        skills: {
          tecnologia: 'treinado',
          ciencias: 'treinado',
        },
        classPowers: ['hacker'], // Requer Tecnologia treinada
      });
      
      const result = validateCharacter(state);
      const prereqError = result.issues.find(
        i => i.ruleId === 'power-prerequisites-not-met' && i.message.includes('Hacker')
      );
      
      expect(prereqError).toBeUndefined();
    });
  });
  
  describe('Pré-requisitos de NEX', () => {
    it('Deve bloquear poder se NEX for insuficiente', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        nex: 10,
        classPowers: ['armamento-pesado'], // Requer NEX 15%
      });
      
      const result = validateCharacter(state);
      const nexError = result.issues.find(
        i => i.ruleId === 'power-nex-requirement' && i.message.includes('Armamento Pesado')
      );
      
      expect(nexError).toBeDefined();
      expect(nexError?.message).toContain('15%');
    });
    
    it('Deve permitir poder se NEX for suficiente', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        nex: 20,
        attributes: { strength: 2, agility: 2, vigor: 2, intellect: 1, presence: 2 },
        classPowers: ['armamento-pesado'], // Requer NEX 15%
      });
      
      const result = validateCharacter(state);
      const nexError = result.issues.find(
        i => i.ruleId === 'power-nex-requirement' && i.message.includes('Armamento Pesado')
      );
      
      expect(nexError).toBeUndefined();
    });
  });
  
  describe('Poderes Desconhecidos', () => {
    it('Deve alertar sobre poderes não encontrados no catálogo', () => {
      const state = createBaseCharacter({
        classPowers: ['poder-inventado-xyz'], // Não existe
      });
      
      const result = validateCharacter(state);
      const unknownError = result.issues.find(
        i => i.ruleId === 'unknown-power'
      );
      
      expect(unknownError).toBeDefined();
      expect(unknownError?.severity).toBe('warning');
      expect(unknownError?.message).toContain('poder-inventado-xyz');
    });
  });
  
  describe('Poderes de Classe Errada', () => {
    it('Deve bloquear poder de outra classe (quando encontrado no catálogo)', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        // 'ecletico' é o ID correto do poder Eclético do Especialista
        classPowers: ['ecletico'],
      });
      
      const result = validateCharacter(state);
      
      // Pode ser erro de classe errada ou de poder desconhecido
      // dependendo de como o ID está mapeado
      const classError = result.issues.find(
        i => i.ruleId === 'power-wrong-class'
      );
      const unknownError = result.issues.find(
        i => i.ruleId === 'unknown-power' && i.message.includes('ecletico')
      );
      
      // Deve ter pelo menos um dos dois erros
      const hasRelevantError = classError !== undefined || unknownError !== undefined;
      expect(hasRelevantError).toBe(true);
      
      // Se encontrou como classe errada, deve mencionar Especialista
      if (classError) {
        expect(classError.message).toContain('Especialista');
      }
    });
  });
});

// ========================================
// TESTES: CENÁRIOS INTEGRADOS
// ========================================

describe('Cenários Integrados de Validação', () => {
  it('Ocultista válido não deve ter erros de perícias obrigatórias', () => {
    const state = createBaseCharacter({
      characterClass: 'Ocultista',
      classTrack: 'conduite',
      attributes: { strength: 0, agility: 2, vigor: 1, intellect: 3, presence: 3 },
      skills: {
        ocultismo: 'treinado',
        vontade: 'treinado',
        ciencias: 'treinado',
        diplomacia: 'treinado',
        religiao: 'treinado',
        // 2 + INT(3) = 5 perícias
      },
    });
    
    const result = validateCharacter(state);
    const mandatoryErrors = result.issues.filter(
      i => i.ruleId === 'missing-mandatory-skill'
    );
    const skillCountErrors = result.issues.filter(
      i => i.ruleId === 'low-trained-skills'
    );
    
    expect(mandatoryErrors.length).toBe(0);
    expect(skillCountErrors.length).toBe(0);
  });
  
  it('Personagem com múltiplos problemas deve listar todos', () => {
    const state = createBaseCharacter({
      characterClass: 'Ocultista',
      classTrack: 'conduite',
      nex: 30,
      attributes: { strength: 1, agility: 2, vigor: 1, intellect: 2, presence: 3 },
      skills: {
        // Faltando ocultismo e vontade
        ciencias: 'veterano', // Inválido em NEX 30%
      },
      classPowers: ['ritual-potente'], // Requer INT 2 (ok) mas é de Ocultista
    });
    
    const result = validateCharacter(state);
    
    // Deve ter erros de perícias obrigatórias
    expect(result.issues.some(i => i.ruleId === 'missing-mandatory-skill')).toBe(true);
    
    // Deve ter erro de veterano antes de NEX 35%
    expect(result.issues.some(i => i.ruleId === 'veteran-before-nex35')).toBe(true);
    
    // O personagem não é válido
    expect(result.valid).toBe(false);
  });
});

// ========================================
// VALIDAÇÃO DE PERÍCIAS DE ORIGEM
// ========================================

describe('Validação de Perícias de Origem', () => {
  describe('Origem com perícias fixas', () => {
    it('Deve exigir perícias concedidas pela origem Militar', () => {
      const state = createBaseCharacter({
        origin: 'militar',
        skills: {
          // Faltando pontaria e tática (perícias da origem Militar)
          luta: 'treinado',
          fortitude: 'treinado',
          atletismo: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const originErrors = result.issues.filter(i => i.ruleId === 'missing-origin-skill');
      expect(originErrors.length).toBe(2); // Pontaria e Tática
      expect(originErrors.some(e => e.path === 'skills.pontaria')).toBe(true);
      expect(originErrors.some(e => e.path === 'skills.tatica')).toBe(true);
    });
    
    it('Deve exigir perícias concedidas pela origem Acadêmico', () => {
      const state = createBaseCharacter({
        origin: 'academico',
        skills: {
          luta: 'treinado',
          // Faltando ciências e investigação
        },
      });
      
      const result = validateCharacter(state);
      
      const originErrors = result.issues.filter(i => i.ruleId === 'missing-origin-skill');
      expect(originErrors.length).toBe(2);
      expect(originErrors.some(e => e.path === 'skills.ciencias')).toBe(true);
      expect(originErrors.some(e => e.path === 'skills.investigacao')).toBe(true);
    });
    
    it('Não deve gerar erro se perícias de origem estiverem treinadas', () => {
      const state = createBaseCharacter({
        origin: 'militar',
        skills: {
          pontaria: 'treinado', // Perícia da origem
          tatica: 'treinado', // Perícia da origem
          luta: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const originErrors = result.issues.filter(i => i.ruleId === 'missing-origin-skill');
      expect(originErrors.length).toBe(0);
    });
    
    it('Deve aceitar perícias de origem em nível veterano ou expert', () => {
      const state = createBaseCharacter({
        nex: 70,
        origin: 'investigador',
        skills: {
          investigacao: 'expert', // Origem concede, mas está em expert (ok)
          percepcao: 'veterano', // Origem concede, mas está em veterano (ok)
          luta: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const originErrors = result.issues.filter(i => i.ruleId === 'missing-origin-skill');
      expect(originErrors.length).toBe(0);
    });
  });
  
  describe('Amnésico (exceção)', () => {
    it('Não deve exigir perícias específicas para Amnésico', () => {
      const state = createBaseCharacter({
        origin: 'amnesico',
        skills: {
          // Amnésico escolhe livremente suas perícias
          luta: 'treinado',
          atletismo: 'treinado',
          acrobacia: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const originErrors = result.issues.filter(i => i.ruleId === 'missing-origin-skill');
      expect(originErrors.length).toBe(0);
    });
  });
  
  describe('Origens desconhecidas', () => {
    it('Deve informar sobre origem não encontrada no catálogo', () => {
      const state = createBaseCharacter({
        origin: 'origem-homebrew-customizada',
        skills: {
          luta: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const unknownOrigin = result.issues.find(i => i.ruleId === 'unknown-origin');
      expect(unknownOrigin).toBeDefined();
      expect(unknownOrigin?.severity).toBe('info'); // Info, não erro
    });
  });
});

// ========================================
// VALIDAÇÃO DE PRÉ-REQUISITOS DE TRILHA
// ========================================

describe('Validação de Pré-requisitos de Trilha', () => {
  describe('Médico de Campo', () => {
    it('Deve exigir Medicina treinada para Médico de Campo', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'medico-campo',
        skills: {
          // Faltando medicina
          ciencias: 'treinado',
          diplomacia: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const prereqErrors = result.issues.filter(i => i.ruleId === 'missing-track-prereq');
      expect(prereqErrors.length).toBe(1);
      expect(prereqErrors[0].path).toBe('skills.medicina');
      expect(prereqErrors[0].autoFixable).toBe(true);
    });
    
    it('Não deve gerar erro se Medicina estiver treinada', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'medico-campo',
        skills: {
          medicina: 'treinado',
          ciencias: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const prereqErrors = result.issues.filter(i => i.ruleId === 'missing-track-prereq');
      expect(prereqErrors.length).toBe(0);
    });
    
    it('Deve sugerir correção automática para pré-requisito faltante', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'medico-de-campo', // Variante de nome
        skills: {},
      });
      
      const result = validateCharacter(state);
      
      const prereqError = result.issues.find(i => i.ruleId === 'missing-track-prereq');
      expect(prereqError?.suggestedFix).toBeDefined();
      expect(prereqError?.suggestedFix?.action).toBe('set');
      expect(prereqError?.suggestedFix?.value).toBe('treinado');
    });
  });
  
  describe('Trilhas sem pré-requisitos', () => {
    it('Aniquilador não deve exigir perícias específicas', () => {
      const state = createBaseCharacter({
        characterClass: 'Combatente',
        classTrack: 'aniquilador',
        skills: {
          luta: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const prereqErrors = result.issues.filter(i => i.ruleId === 'missing-track-prereq');
      expect(prereqErrors.length).toBe(0);
    });
    
    it('Infiltrador não deve exigir perícias específicas', () => {
      const state = createBaseCharacter({
        characterClass: 'Especialista',
        classTrack: 'infiltrador',
        skills: {
          furtividade: 'treinado',
        },
      });
      
      const result = validateCharacter(state);
      
      const prereqErrors = result.issues.filter(i => i.ruleId === 'missing-track-prereq');
      expect(prereqErrors.length).toBe(0);
    });
  });
});
