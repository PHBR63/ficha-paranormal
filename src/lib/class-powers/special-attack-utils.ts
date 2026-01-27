/**
 * Utilitários para o Ataque Especial do Combatente
 * 
 * Regras oficiais:
 * - Custo base: 2 PE para +5 no ataque OU dano
 * - Escalonamento: +1 PE adicional para +5 extra conforme NEX
 * - Distribuição: cada +5 pode ser aplicado separadamente
 * - Força Bruta: +2 de dano por PE gasto (além do +5)
 * - Potência Máxima: dobra bônus em ataques corpo a corpo
 */

// Tabela oficial de progressão do Ataque Especial por NEX
export interface SpecialAttackOptions {
  maxPECost: number;   // Custo MÁXIMO em PE (limite do tier)
  totalBonus: number;  // Bônus total disponível (+5 por incremento)
  increments: number;  // Quantidade de incrementos de +5
  nexTier: string;     // Label do tier para UI
}

/**
 * Calcula o custo de PE baseado nos incrementos usados
 * Regra oficial (Livro Base v1.3): 2 PE para primeiro +5, +1 PE por +5 adicional
 * 
 * @param totalIncrements - Quantidade de incrementos de +5 usados
 * @returns Custo em PE (0 se nenhum incremento usado)
 */
export function calculateDynamicPECost(totalIncrements: number): number {
  if (totalIncrements <= 0) return 0;
  // 1 incremento = 2 PE, 2 incrementos = 3 PE, 3 incrementos = 4 PE, 4 incrementos = 5 PE
  return 1 + totalIncrements;
}

/**
 * Retorna as opções de Ataque Especial baseado no NEX do personagem
 * Conforme Tabela 1.3 do Livro Base
 * 
 * Nota: maxPECost representa o custo MÁXIMO possível no tier, não o custo fixo.
 * O custo real é calculado dinamicamente por calculateDynamicPECost().
 */
export function getSpecialAttackOptions(nex: number): SpecialAttackOptions {
  if (nex >= 85) {
    return { maxPECost: 5, totalBonus: 20, increments: 4, nexTier: 'NEX 85%+' };
  }
  if (nex >= 55) {
    return { maxPECost: 4, totalBonus: 15, increments: 3, nexTier: 'NEX 55%+' };
  }
  if (nex >= 25) {
    return { maxPECost: 3, totalBonus: 10, increments: 2, nexTier: 'NEX 25%+' };
  }
  return { maxPECost: 2, totalBonus: 5, increments: 1, nexTier: 'NEX 5%+' };
}

/**
 * Configuração do Ataque Especial escolhida pelo jogador
 */
export interface SpecialAttackConfig {
  enabled: boolean;
  attackIncrements: number;  // Quantos +5 vão para ataque
  damageIncrements: number;  // Quantos +5 vão para dano
}

/**
 * Resultado final do cálculo do Ataque Especial
 */
export interface SpecialAttackResult {
  attackBonus: number;
  damageBonus: number;
  peCost: number;
  breakdown: string[];  // Descrição de cada bônus aplicado
}

/**
 * Calcula o bônus final do Ataque Especial considerando:
 * - Incrementos escolhidos para ataque e dano
 * - Força Bruta (+2 de dano por PE gasto)
 * - Potência Máxima (dobra tudo se corpo a corpo)
 */
export function calculateSpecialAttackFinal(
  nex: number,
  config: SpecialAttackConfig,
  hasForcaBruta: boolean,
  hasPotenciaMaxima: boolean,
  isMelee: boolean
): SpecialAttackResult {
  const breakdown: string[] = [];
  
  if (!config.enabled) {
    return { attackBonus: 0, damageBonus: 0, peCost: 0, breakdown };
  }
  
  const options = getSpecialAttackOptions(nex);
  
  // Valida que não exceda os incrementos disponíveis
  const totalUsed = config.attackIncrements + config.damageIncrements;
  if (totalUsed > options.increments) {
    console.warn(`[SpecialAttack] Incrementos usados (${totalUsed}) excedem disponíveis (${options.increments})`);
  }
  
  // Calcula bônus base
  let attackBonus = config.attackIncrements * 5;
  let damageBonus = config.damageIncrements * 5;
  
  if (attackBonus > 0) {
    breakdown.push(`Ataque Especial: +${attackBonus} ataque (${config.attackIncrements}x +5)`);
  }
  if (damageBonus > 0) {
    breakdown.push(`Ataque Especial: +${damageBonus} dano (${config.damageIncrements}x +5)`);
  }
  
  // Calcula o custo dinâmico baseado nos incrementos usados
  const actualPECost = calculateDynamicPECost(totalUsed);
  
  // Força Bruta: +2 de dano por PE gasto (aplica apenas se houver dano)
  if (hasForcaBruta && config.damageIncrements > 0) {
    const forcaBrutaBonus = actualPECost * 2;
    damageBonus += forcaBrutaBonus;
    breakdown.push(`Força Bruta: +${forcaBrutaBonus} dano (${actualPECost} PE × +2)`);
  }
  
  // Potência Máxima: dobra os bônus se for ataque corpo a corpo
  if (hasPotenciaMaxima && isMelee) {
    const originalAttack = attackBonus;
    const originalDamage = damageBonus;
    attackBonus *= 2;
    damageBonus *= 2;
    if (originalAttack > 0) {
      breakdown.push(`Potência Máxima: +${originalAttack} ataque extra (dobrado)`);
    }
    if (originalDamage > 0) {
      breakdown.push(`Potência Máxima: +${originalDamage} dano extra (dobrado)`);
    }
  }
  
  return {
    attackBonus,
    damageBonus,
    peCost: actualPECost,
    breakdown
  };
}

/**
 * Verifica se o personagem possui a habilidade Ataque Especial
 */
export function hasSpecialAttack(abilities: string[]): boolean {
  return abilities.some(a => 
    a.toLowerCase().includes('ataque especial') ||
    a.toLowerCase() === 'ataques especiais'
  );
}

/**
 * Verifica se o personagem possui Força Bruta
 */
export function hasForcaBrutaAbility(abilities: string[]): boolean {
  return abilities.some(a => 
    a.toLowerCase().includes('força bruta')
  );
}

/**
 * Verifica se a arma é corpo a corpo para Potência Máxima
 */
export function isMeleeWeapon(weaponType: string | undefined): boolean {
  if (!weaponType) return false;
  const meleeTypes = ['corpo a corpo', 'briga', 'melee', 'cac'];
  return meleeTypes.some(t => weaponType.toLowerCase().includes(t));
}

/**
 * Cria uma configuração inicial desabilitada
 */
export function createEmptySpecialAttackConfig(): SpecialAttackConfig {
  return {
    enabled: false,
    attackIncrements: 0,
    damageIncrements: 0
  };
}
