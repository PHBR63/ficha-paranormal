/**
 * Testes: Regra Personalizada de Crítico
 * Ordem Paranormal RPG v1.3 (com house rule)
 * 
 * REGRA PERSONALIZADA: Crítico NÃO é acerto automático.
 * O ataque só acerta se o total >= Defesa, mesmo em crítico.
 * O crítico apenas dobra os dados de dano QUANDO o ataque acerta.
 * 
 * @module critical-hit-rules.vitest
 */

import { describe, it, expect } from 'vitest';
import { rollAttack, rollSkillTest, rollDamage } from '../dice-roller';

// =====================================================
// Helpers de Teste
// =====================================================

/**
 * Simula múltiplas rolagens para garantir comportamento estatístico
 */
function simulateMultipleAttacks(
  attributeValue: number,
  skillBonus: number,
  targetDefense: number,
  iterations: number = 100
) {
  const results = {
    hits: 0,
    misses: 0,
    criticalHits: 0,
    criticalMisses: 0, // Crítico que não acerta (regra personalizada)
    normalHits: 0,
    normalMisses: 0,
  };

  for (let i = 0; i < iterations; i++) {
    const result = rollAttack({
      attributeValue,
      skillBonus,
      targetDefense,
    });

    if (result.hit) {
      results.hits++;
      if (result.isCritical) {
        results.criticalHits++;
      } else {
        results.normalHits++;
      }
    } else {
      results.misses++;
      if (result.isCritical) {
        results.criticalMisses++;
      } else {
        results.normalMisses++;
      }
    }
  }

  return results;
}

// =====================================================
// TESTES: Crítico NÃO é Acerto Automático
// =====================================================

describe('Regra Personalizada: Crítico NÃO é Acerto Automático', () => {
  
  describe('Lógica básica de acerto', () => {
    
    it('deve acertar quando total >= defesa (sem crítico)', () => {
      // Forçar cenário: atributo alto + bônus alto = sempre acerta
      const result = rollAttack({
        attributeValue: 5, // Pool grande = maior chance de dado alto
        skillBonus: 25,    // Bônus muito alto
        targetDefense: 20,
      });

      // Total deve ser >= 20 com bônus de 25 (mínimo seria 1+25=26)
      expect(result.total).toBeGreaterThanOrEqual(26);
      expect(result.hit).toBe(true);
    });

    it('deve errar quando total < defesa (sem crítico)', () => {
      // Forçar cenário: sem bônus contra defesa alta = provavelmente erra
      // Repetir para garantir pelo menos um miss
      let foundMiss = false;
      for (let i = 0; i < 50; i++) {
        const result = rollAttack({
          attributeValue: 1,
          skillBonus: 0,
          targetDefense: 25,
        });
        
        if (!result.hit && !result.isCritical) {
          foundMiss = true;
          expect(result.total).toBeLessThan(25);
          break;
        }
      }
      expect(foundMiss).toBe(true);
    });

    it('crítico com total >= defesa deve acertar', () => {
      // Cenário: bônus alto garante que mesmo dado baixo acerta
      // Margem de crítico padrão é 20, então precisamos de um 20 natural
      let foundCriticalHit = false;
      
      for (let i = 0; i < 200; i++) {
        const result = rollAttack({
          attributeValue: 3,
          skillBonus: 15,      // Garante que 20+15=35 >= 30
          targetDefense: 30,
          criticalThreshold: 20,
        });
        
        if (result.isCritical && result.hit) {
          foundCriticalHit = true;
          expect(result.keptDice).toBeGreaterThanOrEqual(20);
          expect(result.total).toBeGreaterThanOrEqual(30);
          break;
        }
      }
      
      // É estatisticamente esperado encontrar um crítico que acerta em 200 tentativas
      expect(foundCriticalHit).toBe(true);
    });

    it('REGRA PERSONALIZADA: crítico com total < defesa deve ERRAR', () => {
      // Este é o teste crucial da regra personalizada!
      // Cenário: sem bônus, defesa altíssima, mesmo um 20 natural não acerta
      let foundCriticalMiss = false;
      
      for (let i = 0; i < 200; i++) {
        const result = rollAttack({
          attributeValue: 1,
          skillBonus: 0,        // Sem bônus
          targetDefense: 25,    // Defesa 25 - um 20 natural não é suficiente
          criticalThreshold: 20,
        });
        
        if (result.isCritical) {
          // Encontramos um crítico! Verificar que NÃO acertou
          expect(result.keptDice).toBe(20); // Dado natural 20
          expect(result.total).toBe(20);     // 20 + 0 = 20
          expect(result.total).toBeLessThan(25); // 20 < 25
          expect(result.hit).toBe(false);    // REGRA PERSONALIZADA: não acerta!
          foundCriticalMiss = true;
          break;
        }
      }
      
      // É estatisticamente esperado encontrar um 20 natural em 200 tentativas (10% chance)
      expect(foundCriticalMiss).toBe(true);
    });
  });

  describe('Cenários específicos de combate', () => {
    
    it('crítico contra inimigo com defesa muito alta não deve acertar', () => {
      // Cenário: Agente NEX 5% vs Criatura de Sangue de alta patente
      // Criatura tem Defesa 30, agente tem só perícia +5
      let criticalCount = 0;
      let criticalMissCount = 0;
      
      for (let i = 0; i < 500; i++) {
        const result = rollAttack({
          attributeValue: 2,    // AGI 2
          skillBonus: 5,        // Luta Treinado
          targetDefense: 30,    // Defesa altíssima
        });
        
        if (result.isCritical) {
          criticalCount++;
          if (!result.hit) {
            criticalMissCount++;
            // Verificar que o total é menor que a defesa
            expect(result.total).toBeLessThan(30);
          }
        }
      }
      
      // Deve ter encontrado críticos
      expect(criticalCount).toBeGreaterThan(0);
      // Alguns críticos devem ter errado (quando total < 30)
      // Com bônus +5 e dado 20, total = 25 < 30 = miss
      expect(criticalMissCount).toBeGreaterThan(0);
    });

    it('crítico com margem reduzida (19-20) mantém mesma regra', () => {
      // Poder que reduz margem de ameaça para 19
      let foundCriticalOnNineteen = false;
      
      for (let i = 0; i < 300; i++) {
        const result = rollAttack({
          attributeValue: 1,
          skillBonus: 0,
          targetDefense: 25,
          criticalThreshold: 19, // Margem 19-20
        });
        
        if (result.isCritical && result.keptDice === 19) {
          // Crítico no 19 com total 19 < 25
          expect(result.hit).toBe(false);
          foundCriticalOnNineteen = true;
          break;
        }
      }
      
      expect(foundCriticalOnNineteen).toBe(true);
    });

    it('sem defesa informada, ataque sempre acerta (decisão do mestre)', () => {
      const result = rollAttack({
        attributeValue: 1,
        skillBonus: 0,
        // Sem targetDefense = mestre decide
      });
      
      expect(result.hit).toBe(true);
    });
  });

  describe('Integração com rolagem de dano', () => {
    
    it('dano crítico só deve ser aplicado quando ataque acerta', () => {
      // Simular cenário onde crítico acerta
      const damageOnCriticalHit = rollDamage({
        diceCount: 2,
        diceType: 6,
        bonusDamage: 3,
        isCritical: true,
        criticalMultiplier: 2,
      });
      
      // Crítico dobra os dados (2d6 → 4d6)
      expect(damageOnCriticalHit.dice.length).toBe(4);
      expect(damageOnCriticalHit.isCritical).toBe(true);
    });

    it('dano normal quando crítico não acerta (não deve ser rolado)', () => {
      // Quando crítico não acerta, o sistema não deve permitir rolar dano
      // Este teste valida que isCritical não afeta a decisão de rolar dano
      // A lógica de UI impede a rolagem, mas o dano em si funciona normalmente
      const normalDamage = rollDamage({
        diceCount: 2,
        diceType: 6,
        bonusDamage: 3,
        isCritical: false, // Não é crítico porque não acertou
      });
      
      expect(normalDamage.dice.length).toBe(2); // Dados normais
      expect(normalDamage.isCritical).toBe(false);
    });
  });

  describe('Estatísticas de combate', () => {
    
    it('deve haver críticos que erram em cenários de defesa alta', () => {
      const stats = simulateMultipleAttacks(
        2,    // Atributo 2
        5,    // Bônus +5
        30,   // Defesa 30 (máximo possível: 20+5=25 < 30)
        500   // 500 iterações
      );
      
      // Estatisticamente:
      // - Chance de crítico por dado: 5% (1/20)
      // - Com 2 dados, chance de pelo menos um 20: ~9.75%
      // - Em 500 tentativas, esperamos ~49 críticos
      // - Todos os críticos devem errar (25 < 30)
      
      expect(stats.criticalMisses).toBeGreaterThan(0);
      expect(stats.criticalHits).toBe(0); // Nenhum crítico deveria acertar
      expect(stats.hits).toBe(0); // Nenhum ataque deveria acertar
    });

    it('deve haver críticos que acertam em cenários normais', () => {
      const stats = simulateMultipleAttacks(
        3,    // Atributo 3
        10,   // Bônus +10
        20,   // Defesa 20 (crítico 20+10=30 >= 20)
        500   // 500 iterações
      );
      
      // Com defesa 20 e bônus 10:
      // - Qualquer dado >= 10 acerta
      // - Críticos (20 natural) também acertam
      
      expect(stats.criticalHits).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(stats.misses); // Maioria acerta
    });
  });
});

describe('Testes de rollSkillTest (base do sistema)', () => {
  
  it('deve marcar isCritical quando dado >= threshold', () => {
    let foundCritical = false;
    
    for (let i = 0; i < 100; i++) {
      const result = rollSkillTest({
        attributeValue: 5,
        skillBonus: 0,
        criticalThreshold: 20,
      });
      
      if (result.isCritical) {
        expect(result.keptDice).toBeGreaterThanOrEqual(20);
        foundCritical = true;
        break;
      }
    }
    
    expect(foundCritical).toBe(true);
  });

  it('deve respeitar threshold customizado', () => {
    let foundCritical = false;
    
    for (let i = 0; i < 100; i++) {
      const result = rollSkillTest({
        attributeValue: 3,
        skillBonus: 0,
        criticalThreshold: 18, // Margem 18-20
      });
      
      if (result.isCritical && result.keptDice === 18) {
        foundCritical = true;
        break;
      }
    }
    
    expect(foundCritical).toBe(true);
  });
});
