/**
 * Helpers de cálculo de bônus de recursos
 * Ordem Paranormal RPG v1.3
 */

import type { CharacterState, BreakdownSource, CalculationContext } from '../types';

interface ResourceBonuses {
  hp: BreakdownSource[];
  pe: BreakdownSource[];
  san: BreakdownSource[];
}

/**
 * Calcula bônus de recursos (HP, PE, SAN) de todas as fontes
 */
export function calculateResourceBonuses(
  state: CharacterState,
  context: CalculationContext
): ResourceBonuses {
  const hp: BreakdownSource[] = [];
  const pe: BreakdownSource[] = [];
  const san: BreakdownSource[] = [];
  
  // Bônus de origem
  const originBonuses = getOriginResourceBonuses(state.origin, context);
  hp.push(...originBonuses.hp);
  pe.push(...originBonuses.pe);
  san.push(...originBonuses.san);
  
  // TODO: Bônus de poderes de classe
  // TODO: Bônus de trilha
  // TODO: Bônus de poderes gerais
  // TODO: Bônus de equipamentos
  // TODO: Bônus de condições (ex: PV temporário)
  
  return { hp, pe, san };
}

/**
 * Bônus de recursos específicos de origens
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
    const sanBonus = Math.floor(context.nex / 5);
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
    const hpBonus = Math.floor(context.nex / 5);
    hp.push({
      name: 'Calejado (Desgarrado)',
      sourceType: 'origin',
      value: hpBonus,
      description: `+${hpBonus} PV (+1 por 5% NEX)`,
    });
  }
  
  return { hp, pe, san };
}
