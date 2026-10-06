import { getNexLevel } from '@/lib/rules/nex-progression';
/**
 * Helpers de cálculo de bônus de recursos
 * Ordem Paranormal RPG v1.3
 * 
 * INTEGRAÇÃO SUE: Consume dados consolidados do SUE quando disponíveis
 */

import type { CharacterState, BreakdownSource, CalculationContext } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

interface ResourceBonuses {
  hp: BreakdownSource[];
  pe: BreakdownSource[];
  san: BreakdownSource[];
}

/**
 * Calcula bônus de recursos (HP, PE, SAN) de todas as fontes
 * 
 * @param state - Estado do personagem
 * @param context - Contexto de cálculo
 * @param sueComputed - Dados do SUE (opcional, para integração)
 */
export function calculateResourceBonuses(
  state: CharacterState,
  context: CalculationContext,
  sueComputed?: SUEComputedForRulesEngine
): ResourceBonuses {
  const hp: BreakdownSource[] = [];
  const pe: BreakdownSource[] = [];
  const san: BreakdownSource[] = [];
  
  // === INTEGRAÇÃO SUE (prioridade) ===
  if (sueComputed) {
    // HP do SUE
    if (sueComputed.hpBonus > 0 || sueComputed.hpBreakdown.length > 0) {
      hp.push(...sueComputed.hpBreakdown);
      
      // Se não tem breakdown mas tem bônus, adicionar genérico
      if (sueComputed.hpBreakdown.length === 0 && sueComputed.hpBonus > 0) {
        hp.push({
          name: 'Bônus (SUE)',
          sourceType: 'power',
          value: sueComputed.hpBonus,
        });
      }
    }
    
    // PE do SUE
    if (sueComputed.peBonus > 0 || sueComputed.peBreakdown.length > 0) {
      pe.push(...sueComputed.peBreakdown);
      
      if (sueComputed.peBreakdown.length === 0 && sueComputed.peBonus > 0) {
        pe.push({
          name: 'Bônus (SUE)',
          sourceType: 'power',
          value: sueComputed.peBonus,
        });
      }
    }
    
    // SAN do SUE
    if (sueComputed.sanityBonus !== 0 || sueComputed.sanityBreakdown.length > 0) {
      san.push(...sueComputed.sanityBreakdown);
      
      if (sueComputed.sanityBreakdown.length === 0 && sueComputed.sanityBonus !== 0) {
        san.push({
          name: 'Bônus (SUE)',
          sourceType: 'power',
          value: sueComputed.sanityBonus,
        });
      }
    }
    
    return { hp, pe, san };
  }
  
  // === FALLBACK: Cálculo local de origens ===
  // Usado quando SUE não está disponível
  const originBonuses = getOriginResourceBonuses(state.origin, context);
  hp.push(...originBonuses.hp);
  pe.push(...originBonuses.pe);
  san.push(...originBonuses.san);
  
  return { hp, pe, san };
}

/**
 * Bônus de recursos específicos de origens
 * NOTA: Este é um fallback - preferir usar dados do SUE
 */
function getOriginResourceBonuses(
  origin: string,
  context: CalculationContext
): ResourceBonuses {
  const hp: BreakdownSource[] = [];
  const pe: BreakdownSource[] = [];
  const san: BreakdownSource[] = [];
  
  const normalizedOrigin = origin?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
  
  // Universitário: +1 PE base, +1 PE por NEX ímpar
  if (normalizedOrigin === 'universitario') {
    pe.push({
      name: 'Dedicação (Universitário)',
      sourceType: 'origin',
      value: 1,
      description: '+1 PE base',
    });
    
    // NEX ímpares: 5, 15, 25, 35, 45, 55, 65, 75, 85, 95
    const oddNexCount = Math.floor((context.nex - 5) / 10) + 1;
    if (oddNexCount > 0) {
      pe.push({
        name: 'Dedicação (Universitário)',
        sourceType: 'origin',
        value: oddNexCount,
        description: `+${oddNexCount} PE (NEX ímpar)`,
      });
    }
  }
  
  // Vítima: +1 SAN por 5% NEX
  if (normalizedOrigin === 'vitima') {
    const sanBonus = getNexLevel(context.nex);
    san.push({
      name: 'Cicatrizes Psicológicas (Vítima)',
      sourceType: 'origin',
      value: sanBonus,
      description: `+${sanBonus} SAN (+1 por 5% NEX)`,
    });
  }
  
  // Cultista Arrependido: -50 SAN máxima
  if (normalizedOrigin === 'cultista arrependido' || normalizedOrigin.includes('cultista')) {
    san.push({
      name: 'Traços do Outro Lado (Cultista)',
      sourceType: 'origin',
      value: -50,
      description: '-50 SAN máxima (custo paranormal)',
    });
  }
  
  // Desgarrado: +1 PV por 5% NEX
  if (normalizedOrigin === 'desgarrado') {
    const hpBonus = getNexLevel(context.nex);
    hp.push({
      name: 'Calejado (Desgarrado)',
      sourceType: 'origin',
      value: hpBonus,
      description: `+${hpBonus} PV (+1 por 5% NEX)`,
    });
  }
  
  return { hp, pe, san };
}
