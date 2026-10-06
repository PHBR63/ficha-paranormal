/**
 * Testes Vitest do Sistema de Poderes Paranormais - Ordem Paranormal RPG
 * 
 * Testa a estrutura, pré-requisitos, cálculo de modificadores e 
 * funcionalidades do sistema de poderes paranormais.
 * 
 * @module paranormal-powers.vitest
 */

import { describe, it, expect } from 'vitest';
import {
  PARANORMAL_POWERS,
  getPowerById,
  getPowersByElement,
  getElementPowerCount,
  canChoosePower,
  getPowerEffect,
  calculatePowerModifiers,
  hasRerollOne,
  getRerollRange,
  getActivePowerEffects,
  type ParanormalPower,
  type ParanormalElement,
} from '../paranormal-powers';

// ========================================
// TESTES DE INTEGRIDADE DOS PODERES
// ========================================

describe('Poderes Paranormais - Integridade', () => {
  it('deve ter exatamente 22 poderes oficiais', () => {
    expect(PARANORMAL_POWERS).toHaveLength(22);
  });

  it('deve ter todos os poderes com IDs únicos', () => {
    const ids = PARANORMAL_POWERS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('deve ter campos obrigatórios em todos os poderes', () => {
    const errors: string[] = [];
    
    for (const power of PARANORMAL_POWERS) {
      if (!power.id) errors.push(`${power.name}: falta campo 'id'`);
      if (!power.name) errors.push(`${power.id}: falta campo 'name'`);
      if (!power.element) errors.push(`${power.name}: falta campo 'element'`);
      if (!power.description) errors.push(`${power.name}: falta campo 'description'`);
      if (!power.effect) errors.push(`${power.name}: falta campo 'effect'`);
    }
    
    expect(errors).toHaveLength(0);
  });

  it('deve ter 5 poderes por elemento + 2 genéricos', () => {
    const elements: (ParanormalElement | 'generic')[] = ['sangue', 'morte', 'conhecimento', 'energia', 'generic'];
    
    const counts = elements.map(el => ({
      element: el,
      count: PARANORMAL_POWERS.filter(p => p.element === el).length,
    }));
    
    expect(counts.find(c => c.element === 'sangue')?.count).toBe(5);
    expect(counts.find(c => c.element === 'morte')?.count).toBe(5);
    expect(counts.find(c => c.element === 'conhecimento')?.count).toBe(5);
    expect(counts.find(c => c.element === 'energia')?.count).toBe(5);
    expect(counts.find(c => c.element === 'generic')?.count).toBe(2);
  });

  it('deve ter efeitos com tipos válidos', () => {
    const validTypes = ['stat_bonus', 'reroll', 'immunity', 'resistance', 'damage_bonus', 'special', 'skill_bonus'];
    
    for (const power of PARANORMAL_POWERS) {
      expect(validTypes).toContain(power.effect.type);
    }
  });
});

// ========================================
// TESTES DE BUSCA DE PODERES
// ========================================

describe('Poderes Paranormais - Busca', () => {
  it('getPowerById deve encontrar poder existente', () => {
    const power = getPowerById('anatomia-insana');
    
    expect(power).toBeDefined();
    expect(power?.name).toBe('Anatomia Insana');
    expect(power?.element).toBe('sangue');
  });

  it('getPowerById deve retornar undefined para ID inexistente', () => {
    const power = getPowerById('poder-inexistente-xyz');
    expect(power).toBeUndefined();
  });

  it('getPowersByElement deve retornar poderes do elemento correto', () => {
    const sanguePowers = getPowersByElement('sangue');
    
    expect(sanguePowers).toHaveLength(5);
    expect(sanguePowers.every(p => p.element === 'sangue')).toBe(true);
  });

  it('getPowersByElement deve retornar poderes genéricos', () => {
    const genericPowers = getPowersByElement('generic');
    
    expect(genericPowers).toHaveLength(2);
    expect(genericPowers.some(p => p.id === 'aprender-ritual')).toBe(true);
    expect(genericPowers.some(p => p.id === 'resistir-a-elemento')).toBe(true);
  });
});

// ========================================
// TESTES DE PRÉ-REQUISITOS
// ========================================

describe('Poderes Paranormais - Pré-requisitos', () => {
  it('poder sem pré-requisito pode ser escolhido livremente', () => {
    const anatomia = getPowerById('arma-de-sangue');
    expect(anatomia?.prerequisite).toBeUndefined();
    
    const canChoose = canChoosePower(anatomia!, []);
    expect(canChoose).toBe(true);
  });

  it('poder com pré-requisito "elemento: 1" requer 1 poder do elemento', () => {
    const sangueFervente = getPowerById('sangue-vivo');
    expect(sangueFervente?.prerequisite).toEqual({ element: 'sangue', count: 1 });
    
    // Sem poderes de sangue: não pode escolher
    expect(canChoosePower(sangueFervente!, [])).toBe(false);
    
    // Com 1 poder de sangue: pode escolher
    expect(canChoosePower(sangueFervente!, ['anatomia-insana'])).toBe(true);
  });

  it('poder com pré-requisito "elemento: 2" requer 2 poderes do elemento', () => {
    const sangueVivo = getPowerById('sangue-fervente');
    expect(sangueVivo?.prerequisite).toEqual({ element: 'sangue', count: 2 });
    
    // Com 1 poder de sangue: não pode escolher
    expect(canChoosePower(sangueVivo!, ['anatomia-insana'])).toBe(false);
    
    // Com 2 poderes de sangue: pode escolher
    expect(canChoosePower(sangueVivo!, ['anatomia-insana', 'arma-de-sangue'])).toBe(true);
  });

  it('poder genérico com isGeneric pode ser escolhido múltiplas vezes', () => {
    const aprenderRitual = getPowerById('aprender-ritual');
    expect(aprenderRitual?.isGeneric).toBe(true);
    
    // Mesmo já tendo, pode escolher novamente
    expect(canChoosePower(aprenderRitual!, ['aprender-ritual'])).toBe(true);
  });

  it('poder normal não pode ser escolhido duas vezes', () => {
    const anatomia = getPowerById('anatomia-insana');
    
    // Já tem: não pode escolher novamente
    expect(canChoosePower(anatomia!, ['anatomia-insana'])).toBe(false);
  });
});

// ========================================
// TESTES DE CONTAGEM DE ELEMENTOS
// ========================================

describe('Poderes Paranormais - Contagem de Elementos', () => {
  it('getElementPowerCount deve contar corretamente poderes de sangue', () => {
    const powerIds = ['anatomia-insana', 'arma-de-sangue', 'afortunado'];
    
    expect(getElementPowerCount('sangue', powerIds)).toBe(2);
    expect(getElementPowerCount('energia', powerIds)).toBe(1);
    expect(getElementPowerCount('morte', powerIds)).toBe(0);
  });

  it('getElementPowerCount deve ignorar IDs inválidos', () => {
    const powerIds = ['anatomia-insana', 'poder-inexistente'];
    
    expect(getElementPowerCount('sangue', powerIds)).toBe(1);
  });
});

// ========================================
// TESTES DE EFEITOS COM AFINIDADE
// ========================================

describe('Poderes Paranormais - Efeitos com Afinidade', () => {
  it('getPowerEffect deve retornar descrição base sem afinidade', () => {
    const power = getPowerById('anatomia-insana')!;
    
    const effect = getPowerEffect(power, false, undefined);
    expect(effect).toBe(power.description);
  });

  it('getPowerEffect deve retornar efeito de afinidade quando aplicável', () => {
    const power = getPowerById('anatomia-insana')!;
    
    const effect = getPowerEffect(power, true, 'sangue');
    expect(effect).toBe(power.affinityEffect);
    expect(effect).toContain('Imunidade');
  });

  it('getPowerEffect deve retornar descrição base se afinidade não corresponde', () => {
    const power = getPowerById('anatomia-insana')!;
    
    // Afinidade de energia, poder de sangue
    const effect = getPowerEffect(power, true, 'energia');
    expect(effect).toBe(power.description);
  });
});

// ========================================
// TESTES DE CÁLCULO DE MODIFICADORES
// ========================================

describe('Poderes Paranormais - Cálculo de Modificadores', () => {
  it('Sangue de Ferro deve dar +2 PV por NEX (sem afinidade)', () => {
    const modifiers = calculatePowerModifiers(['sangue-de-ferro'], 50, false);
    
    // 50 NEX = 10 incrementos de 5% = 20 PV
    expect(modifiers['pv_bonus']).toBe(20);
  });

  it('Sangue de Ferro deve dar +2 PV e +5 Fortitude por NEX (com afinidade)', () => {
    const modifiers = calculatePowerModifiers(['sangue-de-ferro','sangue-de-ferro'], 50, true, 'sangue');
    
    // Duas aquisições: +2 PV por patamar, sem dobrar PV.
    expect(modifiers['pv_bonus']).toBe(20);
  });

  it('Potencial Aprimorado deve dar +1 PE por NEX (sem afinidade)', () => {
    const modifiers = calculatePowerModifiers(['potencial-aprimorado'], 50, false);
    
    // 50 NEX = 10 incrementos = 10 PE
    expect(modifiers['pe_bonus']).toBe(10);
  });

  it('Potencial Aprimorado deve dar +2 PE por NEX (com afinidade)', () => {
    const modifiers = calculatePowerModifiers(['potencial-aprimorado','potencial-aprimorado'], 50, true, 'morte');
    
    // 50 NEX = 10 incrementos = 20 PE
    expect(modifiers['pe_bonus']).toBe(20);
  });

  it('Anatomia Insana não dá bônus de Fortitude (sem afinidade)', () => {
    const modifiers = calculatePowerModifiers(['anatomia-insana'], 50, false);
    expect(modifiers['fortitude']).toBeUndefined();
  });

  it('Anatomia Insana não dá Fortitude com afinidade (com afinidade)', () => {
    const modifiers = calculatePowerModifiers(['anatomia-insana','anatomia-insana'], 50, true, 'sangue');
    expect(modifiers['fortitude']).toBeUndefined();
  });

  it('Precognição deve dar +2 Defesa e resistências (sem afinidade)', () => {
    const modifiers = calculatePowerModifiers(['precognicao'], 50, false);
    
    expect(modifiers['defense']).toBe(2);
    expect(modifiers['resistance']).toBe(2);
  });

  it('Precognição deve dar +2 Defesa e resistências (com afinidade)', () => {
    const modifiers = calculatePowerModifiers(['precognicao','precognicao'], 50, true, 'conhecimento');
    
    expect(modifiers['defense']).toBe(2);
    expect(modifiers['resistance']).toBe(2);
  });

  it('Sensitivo deve dar bônus em perícias sociais', () => {
    const modifiers = calculatePowerModifiers(['sensitivo'], 50, false);
    
    expect(modifiers['diplomacia']).toBe(5);
    expect(modifiers['intimidacao']).toBe(5);
    expect(modifiers['intuicao']).toBe(5);
  });

  it('Sensitivo com afinidade deve dar +5 em perícias sociais', () => {
    const modifiers = calculatePowerModifiers(['sensitivo','sensitivo'], 50, true, 'conhecimento');
    
    expect(modifiers['diplomacia']).toBe(5);
    expect(modifiers['intimidacao']).toBe(5);
    expect(modifiers['intuicao']).toBe(5);
  });

  it('Golpe de Sorte deve dar +1 margem de ameaça', () => {
    const modifiers = calculatePowerModifiers(['golpe-de-sorte'], 50, false);
    expect(modifiers['threat_margin']).toBe(1);
  });

  it('Golpe de Sorte com afinidade mantém margem +1 e aumenta multiplicador', () => {
    const modifiers = calculatePowerModifiers(['golpe-de-sorte','golpe-de-sorte'], 50, true, 'energia');
    expect(modifiers['threat_margin']).toBe(1);
    expect(modifiers['critical_multiplier']).toBe(1);
  });

  it('múltiplos poderes devem acumular modificadores', () => {
    const modifiers = calculatePowerModifiers(
      ['sangue-de-ferro','sangue-de-ferro','anatomia-insana'],
      50,
      true,
      'sangue'
    );
    
    expect(modifiers['pv_bonus']).toBe(20);
    expect(modifiers['fortitude']).toBe(5);
  });
});

// ========================================
// TESTES DE AFORTUNADO (REROLL)
// ========================================

describe('Poderes Paranormais - Afortunado', () => {
  it('hasRerollOne deve retornar true se tem Afortunado', () => {
    expect(hasRerollOne(['afortunado'])).toBe(true);
    expect(hasRerollOne(['anatomia-insana', 'afortunado'])).toBe(true);
  });

  it('hasRerollOne deve retornar false se não tem Afortunado', () => {
    expect(hasRerollOne([])).toBe(false);
    expect(hasRerollOne(['anatomia-insana'])).toBe(false);
  });

  it('getRerollRange deve retornar 1 para Afortunado sem afinidade', () => {
    expect(getRerollRange(['afortunado'], false)).toBe(1);
    expect(getRerollRange(['afortunado'], true, 'sangue')).toBe(1); // Afinidade errada
  });

  it('getRerollRange deve continuar rerrolando apenas resultado 1 para Afortunado com afinidade de Energia', () => {
    expect(getRerollRange(['afortunado'], true, 'energia')).toBe(1);
  });

  it('getRerollRange deve retornar 0 sem Afortunado', () => {
    expect(getRerollRange([], false)).toBe(0);
    expect(getRerollRange(['anatomia-insana'], true, 'energia')).toBe(0);
  });
});

// ========================================
// TESTES DE PODERES ESPECÍFICOS
// ========================================

describe('Poderes Paranormais - Poderes Específicos do Livro Base', () => {
  it('Arma de Sangue deve ter efeito especial', () => {
    const power = getPowerById('arma-de-sangue');
    
    expect(power?.effect.type).toBe('special');
    expect(power?.description).toContain('1d6');
    expect(power?.description).toContain('2 PE');
  });

  it('Sangue Vivo deve ter pré-requisito Sangue 1', () => {
    const power = getPowerById('sangue-vivo');
    
    expect(power?.prerequisite?.element).toBe('sangue');
    expect(power?.prerequisite?.count).toBe(1);
  });

  it('Surto Temporal deve ter pré-requisito Morte 2', () => {
    const power = getPowerById('surto-temporal');
    
    expect(power?.prerequisite?.element).toBe('morte');
    expect(power?.prerequisite?.count).toBe(2);
  });

  it('Expansão de Conhecimento deve orientar escolha de poder de outra classe', () => {
    const power = getPowerById('expansao-de-conhecimento');
    
    expect(power?.requiresChoice).toBeUndefined();
    expect(power?.description).toContain('outra classe');
  });

  it('Aprender Ritual deve requerer escolha de ritual', () => {
    const power = getPowerById('aprender-ritual');
    
    expect(power?.requiresChoice).toBe('ritual');
  });

  it('Resistir a Elemento deve requerer escolha de elemento', () => {
    const power = getPowerById('resistir-a-elemento');
    
    expect(power?.requiresChoice).toBe('element_resistance');
  });

  it('Manipular Entropia deve ter pré-requisito Energia 1', () => {
    const power = getPowerById('manipular-entropia');
    
    expect(power?.prerequisite?.element).toBe('energia');
    expect(power?.prerequisite?.count).toBe(1);
  });

  it('Visão do Oculto não possui pré-requisito de quantidade', () => {
    const power = getPowerById('visao-do-oculto');
    
    expect(power?.prerequisite).toBeUndefined();
    expect(power?.description).toContain('visão no escuro');
  });
});
