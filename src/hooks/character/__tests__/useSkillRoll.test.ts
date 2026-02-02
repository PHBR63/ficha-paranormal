/**
 * Testes de Integração - useSkillRoll
 * 
 * Verifica cálculo de bônus de perícia, integração com SUE
 * e preparação de rolagens para o modal.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSkillRoll, getSkillBaseAttribute } from '../useSkillRoll';
import type { SkillRollCharacterContext } from '../useSkillRoll';

// Contexto de personagem Especialista para testes
const mockEspecialistaContext: SkillRollCharacterContext = {
  characterId: 'test-char-1',
  characterName: 'Agente Teste',
  origin: 'Universitario',
  characterClass: 'Especialista',
  classTrack: 'Negociador',
  nex: 50,
  skills: {
    'acrobacia': 0,
    'atletismo': 5,
    'atualidades': 10,
    'ciencias': 15,
    'crime': 5,
    'diplomacia': 10,
    'enganacao': 5,
    'fortitude': 0,
    'furtividade': 5,
    'intimidacao': 0,
    'intuicao': 10,
    'investigacao': 15,
    'luta': 0,
    'medicina': 10,
    'ocultismo': 15,
    'percepcao': 10,
    'pilotagem': 0,
    'pontaria': 5,
    'profissao': 10,
    'reflexos': 5,
    'resistencia': 0,
    'sobrevivencia': 5,
    'tatica': 10,
    'tecnologia': 15,
    'vontade': 10,
  },
  classPowers: ['conhecimento-aplicado', 'eclético'],
  generalPowers: [],
  paranormalPowers: [],
  activeConditions: [],
  strength: 1,
  agility: 2,
  vigor: 1,
  intellect: 4,
  presence: 3,
};

// Contexto de personagem Combatente
const mockCombalenteContext: SkillRollCharacterContext = {
  ...mockEspecialistaContext,
  characterName: 'Soldado Teste',
  characterClass: 'Combatente',
  classTrack: 'Operacoes Especiais',
  classPowers: ['ataque-especial'],
  skills: {
    'acrobacia': 5,
    'atletismo': 10,
    'fortitude': 10,
    'luta': 15,
    'pontaria': 15,
    'reflexos': 10,
    'resistencia': 5,
    'tatica': 10,
  },
  strength: 3,
  agility: 3,
  vigor: 2,
  intellect: 1,
  presence: 1,
};

describe('useSkillRoll', () => {
  describe('getSkillBreakdown', () => {
    it('deve retornar breakdown correto para perícia treinada (+5)', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const breakdown = result.current.getSkillBreakdown('atletismo');
      
      expect(breakdown.total).toBe(5);
      expect(breakdown.sources).toContainEqual(
        expect.objectContaining({
          source: 'Treinamento',
          value: 5,
        })
      );
    });

    it('deve retornar breakdown correto para perícia veterano (+10)', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const breakdown = result.current.getSkillBreakdown('diplomacia');
      
      expect(breakdown.total).toBe(10);
    });

    it('deve retornar breakdown correto para perícia expert (+15)', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const breakdown = result.current.getSkillBreakdown('ciencias');
      
      expect(breakdown.total).toBe(15);
    });

    it('deve retornar breakdown para perícia destreinada (0)', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const breakdown = result.current.getSkillBreakdown('fortitude');
      
      expect(breakdown.total).toBe(0);
    });

    it('deve lidar com perícia inexistente', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const breakdown = result.current.getSkillBreakdown('pericia-inventada');
      
      expect(breakdown.total).toBe(0);
    });
  });

  describe('prepareRoll', () => {
    it('deve preparar rolagem com pool baseado no atributo', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const prepared = result.current.prepareRoll({
        skillId: 'investigacao',
        skillName: 'Investigação',
        trainingLevel: 3,
        attribute: 'intellect',
        attributeValue: 4,
      });
      
      expect(prepared.pool).toBe(4); // Intelecto = 4
      expect(prepared.label).toBe('Teste de Investigação');
      expect(prepared.skillId).toBe('investigacao');
      expect(prepared.testedAttribute).toBe('intellect');
    });

    it('deve incluir bônus de treinamento nas fontes', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const prepared = result.current.prepareRoll({
        skillId: 'investigacao',
        skillName: 'Investigação',
        trainingLevel: 3,
        attribute: 'intellect',
        attributeValue: 4,
      });
      
      expect(prepared.bonusSources.length).toBeGreaterThan(0);
      expect(prepared.bonus).toBe(15); // Expert
    });

    it('deve somar bônus adicionais fornecidos', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const prepared = result.current.prepareRoll({
        skillId: 'investigacao',
        skillName: 'Investigação',
        trainingLevel: 3,
        attribute: 'intellect',
        attributeValue: 4,
        additionalBonuses: [
          { label: 'Bônus Situacional', value: 2, type: 'other', description: 'Pista óbvia' },
        ],
      });
      
      // 15 (expert) + 2 (situacional) = 17
      expect(prepared.bonus).toBe(17);
      expect(prepared.bonusSources.length).toBe(2);
    });

    it('deve incluir dados extras quando fornecidos', () => {
      const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
      
      const prepared = result.current.prepareRoll({
        skillId: 'diplomacia',
        skillName: 'Diplomacia',
        trainingLevel: 2,
        attribute: 'presence',
        attributeValue: 3,
        extraDice: 2, // Ex: Discurso Motivador
      });
      
      expect(prepared.extraDice).toBe(2);
    });

    it('deve funcionar para Combatente com perícias de combate', () => {
      const { result } = renderHook(() => useSkillRoll(mockCombalenteContext));
      
      const prepared = result.current.prepareRoll({
        skillId: 'luta',
        skillName: 'Luta',
        trainingLevel: 3,
        attribute: 'agility',
        attributeValue: 3,
      });
      
      expect(prepared.pool).toBe(3);
      expect(prepared.bonus).toBe(15); // Expert em Luta
    });
  });

  describe('getSkillBaseAttribute', () => {
    it('deve mapear perícias de Agilidade corretamente', () => {
      expect(getSkillBaseAttribute('acrobacia')).toBe('agility');
      expect(getSkillBaseAttribute('atletismo')).toBe('agility');
      expect(getSkillBaseAttribute('furtividade')).toBe('agility');
      expect(getSkillBaseAttribute('luta')).toBe('agility');
      expect(getSkillBaseAttribute('pilotagem')).toBe('agility');
      expect(getSkillBaseAttribute('pontaria')).toBe('agility');
      expect(getSkillBaseAttribute('reflexos')).toBe('agility');
    });

    it('deve mapear perícias de Vigor corretamente', () => {
      expect(getSkillBaseAttribute('fortitude')).toBe('vigor');
      expect(getSkillBaseAttribute('resistencia')).toBe('vigor');
    });

    it('deve mapear perícias de Intelecto corretamente', () => {
      expect(getSkillBaseAttribute('atualidades')).toBe('intellect');
      expect(getSkillBaseAttribute('ciencias')).toBe('intellect');
      expect(getSkillBaseAttribute('crime')).toBe('intellect');
      expect(getSkillBaseAttribute('investigacao')).toBe('intellect');
      expect(getSkillBaseAttribute('medicina')).toBe('intellect');
      expect(getSkillBaseAttribute('ocultismo')).toBe('intellect');
      expect(getSkillBaseAttribute('profissao')).toBe('intellect');
      expect(getSkillBaseAttribute('sobrevivencia')).toBe('intellect');
      expect(getSkillBaseAttribute('tatica')).toBe('intellect');
      expect(getSkillBaseAttribute('tecnologia')).toBe('intellect');
    });

    it('deve mapear perícias de Presença corretamente', () => {
      expect(getSkillBaseAttribute('artes')).toBe('presence');
      expect(getSkillBaseAttribute('diplomacia')).toBe('presence');
      expect(getSkillBaseAttribute('enganacao')).toBe('presence');
      expect(getSkillBaseAttribute('intimidacao')).toBe('presence');
      expect(getSkillBaseAttribute('intuicao')).toBe('presence');
      expect(getSkillBaseAttribute('percepcao')).toBe('presence');
      expect(getSkillBaseAttribute('vontade')).toBe('presence');
    });

    it('deve normalizar acentos no ID da perícia', () => {
      expect(getSkillBaseAttribute('investigação')).toBe('intellect');
      expect(getSkillBaseAttribute('enganação')).toBe('presence');
      expect(getSkillBaseAttribute('ciências')).toBe('intellect');
    });

    it('deve retornar intellect como fallback para perícia desconhecida', () => {
      expect(getSkillBaseAttribute('pericia-inventada')).toBe('intellect');
    });
  });
});

describe('Integração SUE', () => {
  it('deve criar configuração SUE válida a partir do contexto', () => {
    const { result } = renderHook(() => useSkillRoll(mockEspecialistaContext));
    
    // Hook deve estar funcional
    expect(result.current.prepareRoll).toBeDefined();
    expect(result.current.getSkillBreakdown).toBeDefined();
  });

  it('deve manter estabilidade de referência entre renders', () => {
    const { result, rerender } = renderHook(() => useSkillRoll(mockEspecialistaContext));
    
    const firstPrepare = result.current.prepareRoll;
    const firstBreakdown = result.current.getSkillBreakdown;
    
    rerender();
    
    // Funções devem ser memoizadas
    expect(result.current.prepareRoll).toBe(firstPrepare);
    expect(result.current.getSkillBreakdown).toBe(firstBreakdown);
  });
});
