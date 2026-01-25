/**
 * Testes para Origens Ativáveis
 * Ordem Paranormal RPG v1.3
 * 
 * Valida que todas as origens com poderes ativáveis
 * estão corretamente implementadas no bridge.
 */

import { describe, it, expect } from 'vitest';
import { getActivatablePowersForCharacter } from '../class-powers/activatable-powers-bridge';

// =====================================================
// CONTEXTO BASE PARA TESTES
// =====================================================

const baseContext = {
  powers: [],
  abilities: [],
  nex: 20,
  peCurrent: 10,
  intellect: 3,
  trainedSkills: [],
  peritoSkills: [],
};

// =====================================================
// ORIGENS JÁ IMPLEMENTADAS (validação de regressão)
// =====================================================

describe('Origens Ativáveis - Regressão', () => {
  
  it('Acadêmico: Saber é Poder (+5 INT)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Acadêmico',
      testedAttribute: 'intellect',
    });
    
    const saberEPoder = powers.find(p => p.id === 'saber-e-poder');
    expect(saberEPoder).toBeDefined();
    expect(saberEPoder?.peCost).toBe(2);
    expect(saberEPoder?.skillBonus).toBe(5);
  });
  
  it('Atleta: 110% (+5 FOR/AGI)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Atleta',
      testedAttribute: 'strength',
    });
    
    const poder110 = powers.find(p => p.id === '110-porcento');
    expect(poder110).toBeDefined();
    expect(poder110?.peCost).toBe(2);
    expect(poder110?.skillBonus).toBe(5);
    expect(poder110?.excludedSkills).toContain('luta');
    expect(poder110?.excludedSkills).toContain('pontaria');
  });
  
  it('Executivo: Processo Otimizado (+5 teste estendido)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Executivo',
    });
    
    const processo = powers.find(p => p.id === 'processo-otimizado');
    expect(processo).toBeDefined();
    expect(processo?.peCost).toBe(2);
    expect(processo?.skillBonus).toBe(5);
  });
  
  it('T.I.: Motor de Busca (swap para Tecnologia)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'T.I.',
    });
    
    const motor = powers.find(p => p.id === 'motor-de-busca');
    expect(motor).toBeDefined();
    expect(motor?.peCost).toBe(2);
    expect(motor?.swapToSkill).toBe('tecnologia');
  });
  
  it('Religioso: Acalentar (+10 aliado, 1x/cena)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Religioso',
    });
    
    const acalentar = powers.find(p => p.id === 'acalentar-aliado');
    expect(acalentar).toBeDefined();
    expect(acalentar?.peCost).toBe(0);
    expect(acalentar?.allyBonus).toBe(10);
    expect(acalentar?.usageLimit).toBe('scene');
  });
  
  it('Trambiqueiro: Impostor (swap para Enganação, 1x/cena)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Trambiqueiro',
    });
    
    const impostor = powers.find(p => p.id === 'impostor');
    expect(impostor).toBeDefined();
    expect(impostor?.peCost).toBe(2);
    expect(impostor?.swapToSkill).toBe('enganacao');
    expect(impostor?.usageLimit).toBe('scene');
  });
  
  it('Trabalhador Rural: Desbravador (+5 Adestramento/Sobrevivência)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Trabalhador Rural',
    });
    
    const desbravador = powers.find(p => p.id === 'desbravador');
    expect(desbravador).toBeDefined();
    expect(desbravador?.peCost).toBe(2);
    expect(desbravador?.skillBonus).toBe(5);
    expect(desbravador?.applicableSkills).toContain('adestramento');
    expect(desbravador?.applicableSkills).toContain('sobrevivencia');
  });
});

// =====================================================
// NOVAS ORIGENS IMPLEMENTADAS (Fase 3)
// =====================================================

describe('Origens Ativáveis - Fase 3', () => {
  
  it('Investigador: Faro para Pistas (+5 Investigação/Percepção)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Investigador',
    });
    
    const faro = powers.find(p => p.id === 'faro-para-pistas');
    expect(faro).toBeDefined();
    expect(faro?.name).toBe('Faro para Pistas');
    expect(faro?.peCost).toBe(1);
    expect(faro?.skillBonus).toBe(5);
    expect(faro?.applicableSkills).toContain('investigacao');
    expect(faro?.applicableSkills).toContain('percepcao');
  });
  
  it('Artista: Magnum Opus (PRE×2 +5, 1x/missão)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Artista',
    });
    
    const magnum = powers.find(p => p.id === 'magnum-opus');
    expect(magnum).toBeDefined();
    expect(magnum?.name).toBe('Magnum Opus');
    expect(magnum?.peCost).toBe(0);
    expect(magnum?.skillBonus).toBe(5);
    expect(magnum?.applicableSkills).toContain('artes');
    expect(magnum?.applicableSkills).toContain('atuacao');
    expect(magnum?.usageLimit).toBe('scene'); // Tratamos missão como cena
  });
  
  it('Chef: Ingrediente Secreto (2 pratos em interlúdio)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Chef',
    });
    
    const ingrediente = powers.find(p => p.id === 'ingrediente-secreto');
    expect(ingrediente).toBeDefined();
    expect(ingrediente?.name).toBe('Ingrediente Secreto');
    expect(ingrediente?.peCost).toBe(0);
    expect(ingrediente?.specialNote).toContain('Narrativo');
  });
  
  it('Mercenário: Posição de Combate (+1 ação movimento, 1º turno)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Mercenário',
    });
    
    const posicao = powers.find(p => p.id === 'posicao-de-combate');
    expect(posicao).toBeDefined();
    expect(posicao?.name).toBe('Posição de Combate');
    expect(posicao?.peCost).toBe(2);
    expect(posicao?.effectType).toBe('movement_bonus');
    expect(posicao?.usageLimit).toBe('scene');
    expect(posicao?.specialNote).toContain('1º turno');
  });
  
  it('Servidor Público: Espírito Cívico (+2 ao ajudar)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Servidor Público',
    });
    
    const espirito = powers.find(p => p.id === 'espirito-civico');
    expect(espirito).toBeDefined();
    expect(espirito?.name).toBe('Espírito Cívico');
    expect(espirito?.peCost).toBe(1);
    expect(espirito?.allyBonus).toBe(2);
  });
  
  it('Policial: Patrulha (usar Percepção em Iniciativa)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Policial',
    });
    
    const patrulha = powers.find(p => p.id === 'patrulha-iniciativa');
    expect(patrulha).toBeDefined();
    expect(patrulha?.name).toBe('Patrulha (Iniciativa)');
    expect(patrulha?.peCost).toBe(0);
    expect(patrulha?.newAttribute).toBe('presence');
    expect(patrulha?.applicableSkills).toContain('iniciativa');
  });
  
  it('Criminoso: O Crime Compensa (item extra fim de missão)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Criminoso',
    });
    
    const crime = powers.find(p => p.id === 'o-crime-compensa');
    expect(crime).toBeDefined();
    expect(crime?.name).toBe('O Crime Compensa');
    expect(crime?.peCost).toBe(0);
    expect(crime?.applicableSkills).toContain('crime');
    expect(crime?.specialNote).toContain('DT 20');
  });
  
  it('Cultista Arrependido: Traços do Outro Lado (lembrete passivo)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Cultista Arrependido',
    });
    
    const tracos = powers.find(p => p.id === 'tracos-do-outro-lado');
    expect(tracos).toBeDefined();
    expect(tracos?.name).toBe('Traços do Outro Lado');
    expect(tracos?.peCost).toBe(0);
    expect(tracos?.effectType).toBe('passive_reminder');
    expect(tracos?.specialNote).toContain('+1 limite PE/turno');
  });
  
  it('Amnésico: Vislumbres do Passado (1x/cena em INT)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Amnésico',
      testedAttribute: 'intellect',
    });
    
    const vislumbres = powers.find(p => p.id === 'vislumbres-do-passado');
    expect(vislumbres).toBeDefined();
    expect(vislumbres?.name).toBe('Vislumbres do Passado');
    expect(vislumbres?.peCost).toBe(0);
    expect(vislumbres?.usageLimit).toBe('scene');
    expect(vislumbres?.description).toContain('1d4 PE'); // O 1d4 PE está na description
  });
  
  it('Vítima: Cicatrizes (usar Vontade, 1x/cena)', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Vítima',
    });
    
    const cicatrizes = powers.find(p => p.id === 'cicatrizes-vontade');
    expect(cicatrizes).toBeDefined();
    expect(cicatrizes?.name).toBe('Cicatrizes (Vontade)');
    expect(cicatrizes?.peCost).toBe(0);
    expect(cicatrizes?.swapToSkill).toBe('vontade');
    expect(cicatrizes?.usageLimit).toBe('scene');
  });
});

// =====================================================
// TESTES DE FILTRAGEM POR ATRIBUTO
// =====================================================

describe('Origens Ativáveis - Filtragem por Atributo', () => {
  
  it('Acadêmico: Saber é Poder NÃO aparece em teste de Força', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Acadêmico',
      testedAttribute: 'strength',
    });
    
    const saberEPoder = powers.find(p => p.id === 'saber-e-poder');
    expect(saberEPoder).toBeUndefined();
  });
  
  it('Atleta: 110% NÃO aparece em teste de Intelecto', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Atleta',
      testedAttribute: 'intellect',
    });
    
    const poder110 = powers.find(p => p.id === '110-porcento');
    expect(poder110).toBeUndefined();
  });
  
  it('Amnésico: Vislumbres NÃO aparece em teste de Presença', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Amnésico',
      testedAttribute: 'presence',
    });
    
    const vislumbres = powers.find(p => p.id === 'vislumbres-do-passado');
    expect(vislumbres).toBeUndefined();
  });
});

// =====================================================
// TESTES DE NORMALIZAÇÃO DE NOMES
// =====================================================

describe('Origens Ativáveis - Normalização de Nomes', () => {
  
  it('deve reconhecer origens com acentos', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'Mercenário', // com acento
    });
    
    const posicao = powers.find(p => p.id === 'posicao-de-combate');
    expect(posicao).toBeDefined();
  });
  
  it('deve reconhecer origens sem acentos', () => {
    const powers = getActivatablePowersForCharacter({
      ...baseContext,
      origin: 'mercenario', // sem acento, minúsculo
    });
    
    const posicao = powers.find(p => p.id === 'posicao-de-combate');
    expect(posicao).toBeDefined();
  });
  
  it('deve reconhecer variações de Servidor Público', () => {
    const variations = ['Servidor Público', 'servidor publico', 'Servidor'];
    
    for (const origin of variations) {
      const powers = getActivatablePowersForCharacter({
        ...baseContext,
        origin,
      });
      
      const espirito = powers.find(p => p.id === 'espirito-civico');
      expect(espirito).toBeDefined();
    }
  });
});
