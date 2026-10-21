/**
 * damage-formula-parser.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Parser unificado para fórmulas de dano:
 * - Suporta fórmulas simples: "1d8", "2d6+3", "1d10-2"
 * - Suporta dados múltiplos: "1d8+1d6", "2d6+1d4+3"
 * - Suporta tipos de dano: "1d8 fogo", "2d6+3 elétrico"
 * - Retorna estrutura parseada para uso no rollDamage
 */

// =====================================================
// TIPOS
// =====================================================

/**
 * Representa um grupo de dados na fórmula
 * Ex: "2d6" = { count: 2, sides: 6 }
 */
export interface DiceGroup {
  count: number;
  sides: number;
  element?: string;  // Elemento para dano elemental
  /** Somente dados que aumentam o dano da arma participam do crítico. */
  criticalAsWeapon?: boolean;
}

/**
 * Resultado do parsing de uma fórmula de dano
 */
export interface ParsedDamageFormula {
  /** Grupos de dados na fórmula (ex: [{count:1,sides:8}, {count:1,sides:6}] para "1d8+1d6") */
  diceGroups: DiceGroup[];
  
  /** Bônus/penalidade numérico fixo */
  flatBonus: number;
  
  /** Tipo de dano principal (se especificado) */
  damageType?: string;
  
  /** Fórmula original */
  originalFormula: string;
  
  /** Fórmula normalizada (sem espaços extras) */
  normalizedFormula: string;
  
  /** Indica se o parsing foi bem-sucedido */
  isValid: boolean;
  
  /** Mensagem de erro se inválido */
  error?: string;
}

/**
 * Opções para rolagem de dano
 */
export interface DamageRollOptions {
  /** Multiplicador de crítico (padrão: 2) */
  criticalMultiplier?: number;
  
  /** Se é um acerto crítico */
  isCritical?: boolean;
  
  /** Bônus adicional de dano (de poderes, etc.) */
  bonusDamage?: number;
  
  /** Dados extras a adicionar (ex: Ataque Furtivo) */
  extraDice?: DiceGroup[];
  
  /** Aplicar dano máximo nos dados (Atirar para Matar em crítico) */
  maximizeDice?: boolean;
  
  /** Dobrar bônus numéricos (Potência Máxima) */
  doubleBonuses?: boolean;
}

/**
 * Resultado de uma rolagem de dano
 */
export interface DamageRollResult {
  /** Resultados de cada grupo de dados */
  diceResults: {
    group: DiceGroup;
    rolls: number[];
    subtotal: number;
    isCritical: boolean;
  }[];
  
  /** Dados extras (buffs, poderes) */
  extraDiceResults: {
    source: string;
    group: DiceGroup;
    rolls: number[];
    subtotal: number;
  }[];
  
  /** Bônus numérico aplicado */
  flatBonus: number;
  
  /** Total de dano */
  total: number;
  
  /** Tipo de dano */
  damageType?: string;
  
  /** Se foi crítico */
  isCritical: boolean;
  
  /** Breakdown para exibição */
  breakdown: {
    formula: string;
    diceFormula: string;
    bonusFormula: string;
    result: string;
  };
}

// =====================================================
// CONSTANTES
// =====================================================

/** Regex para capturar grupos de dados: XdY */
const DICE_GROUP_REGEX = /(\d+)d(\d+)/gi;

/** Regex para capturar bônus/penalidade final: +N ou -N no fim */
const FLAT_BONUS_REGEX = /([+-]\d+)(?!\s*d)(?=\s*$|\s*[a-záéíóúâêîôûãõç])/i;

/** Tipos de dano reconhecidos */
const DAMAGE_TYPES = [
  'corte', 'perfuração', 'impacto', 'balístico',
  'fogo', 'frio', 'elétrico', 'químico', 'energia',
  'conhecimento', 'sangue', 'morte', 'medo',
  'físico', 'mental', 'paranormal',
];

// =====================================================
// FUNÇÕES PRINCIPAIS
// =====================================================

/**
 * Parseia uma fórmula de dano em componentes estruturados
 * 
 * @param formula - Fórmula de dano (ex: "2d6+3", "1d8+1d6 fogo")
 * @returns ParsedDamageFormula com componentes extraídos
 * 
 * @example
 * parseDamageFormula("2d6+3") 
 * // => { diceGroups: [{count:2, sides:6}], flatBonus: 3, isValid: true }
 * 
 * @example
 * parseDamageFormula("1d8+1d6 fogo")
 * // => { diceGroups: [{count:1,sides:8}, {count:1,sides:6}], damageType: "fogo", isValid: true }
 */
export function parseDamageFormula(formula: string): ParsedDamageFormula {
  if (!formula || typeof formula !== 'string') {
    return {
      diceGroups: [],
      flatBonus: 0,
      originalFormula: formula || '',
      normalizedFormula: '',
      isValid: false,
      error: 'Fórmula vazia ou inválida',
    };
  }
  
  const originalFormula = formula;
  let normalized = formula.trim().toLowerCase();
  
  // 1. Extrair tipo de dano (se presente)
  let damageType: string | undefined;
  for (const type of DAMAGE_TYPES) {
    if (normalized.includes(type)) {
      damageType = type;
      normalized = normalized.replace(type, '').trim();
      break;
    }
  }
  
  // 2. Extrair grupos de dados
  const diceGroups: DiceGroup[] = [];
  let match: RegExpExecArray | null;
  const diceRegex = new RegExp(DICE_GROUP_REGEX.source, 'gi');
  
  while ((match = diceRegex.exec(normalized)) !== null) {
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    
    if (count > 0 && sides > 0 && count <= 100 && sides <= 100) {
      diceGroups.push({ count, sides, element: damageType });
    }
  }
  
  // 3. Extrair bônus/penalidade fixo
  let flatBonus = 0;
  
  // Remove os grupos de dados para analisar o resto
  let remainder = normalized.replace(DICE_GROUP_REGEX, '').trim();
  
  // Procura por +N ou -N (pode haver múltiplos: +2+3 = +5)
  const bonusMatches = remainder.match(/[+-]\d+/g);
  if (bonusMatches) {
    flatBonus = bonusMatches.reduce((sum, b) => sum + parseInt(b, 10), 0);
  }
  
  // 4. Validar resultado
  if (diceGroups.length === 0) {
    // Talvez seja apenas um número fixo
    const pureNumber = parseInt(normalized, 10);
    if (!isNaN(pureNumber)) {
      return {
        diceGroups: [],
        flatBonus: pureNumber,
        damageType,
        originalFormula,
        normalizedFormula: pureNumber.toString(),
        isValid: true,
      };
    }
    
    return {
      diceGroups: [],
      flatBonus: 0,
      originalFormula,
      normalizedFormula: normalized,
      isValid: false,
      error: 'Nenhum grupo de dados encontrado',
    };
  }
  
  // 5. Reconstruir fórmula normalizada
  const normalizedFormula = buildFormulaString(diceGroups, flatBonus, damageType);
  
  return {
    diceGroups,
    flatBonus,
    damageType,
    originalFormula,
    normalizedFormula,
    isValid: true,
  };
}

/**
 * Executa uma rolagem de dano a partir de uma fórmula parseada
 * 
 * @param parsed - Fórmula parseada ou string
 * @param options - Opções de rolagem (crítico, bônus, etc.)
 * @returns DamageRollResult com todos os detalhes
 */
export function rollDamageFromFormula(
  parsed: ParsedDamageFormula | string,
  options: DamageRollOptions = {}
): DamageRollResult {
  // Se for string, parsear primeiro
  const formula = typeof parsed === 'string' ? parseDamageFormula(parsed) : parsed;
  
  const {
    criticalMultiplier = 2,
    isCritical = false,
    bonusDamage = 0,
    extraDice = [],
    maximizeDice = false,
    doubleBonuses = false,
  } = options;
  
  // 1. Rolar dados da fórmula base
  const diceResults = formula.diceGroups.map(group => {
    // Em crítico, multiplica quantidade de dados
    const actualCount = isCritical ? group.count * criticalMultiplier : group.count;
    
    const rolls = maximizeDice
      ? Array(actualCount).fill(group.sides) // Dano máximo
      : Array.from({ length: actualCount }, () => rollDie(group.sides));
    
    return {
      group: { ...group, count: actualCount },
      rolls,
      subtotal: rolls.reduce((a, b) => a + b, 0),
      isCritical,
    };
  });
  
  // 2. Rolar dados extras (buffs, poderes)
  const extraDiceResults = extraDice.map(group => {
    // Dano adicional (ritual, poder ou elemento) não é dado da arma.
    const actualCount = isCritical && group.criticalAsWeapon
      ? group.count * criticalMultiplier : group.count;
    
    const rolls = maximizeDice
      ? Array(actualCount).fill(group.sides)
      : Array.from({ length: actualCount }, () => rollDie(group.sides));
    
    return {
      source: group.element || 'Extra',
      group: { ...group, count: actualCount },
      rolls,
      subtotal: rolls.reduce((a, b) => a + b, 0),
    };
  });
  
  // 3. Calcular bônus numérico
  const baseFlat = formula.flatBonus + bonusDamage;
  const flatBonus = doubleBonuses ? baseFlat * 2 : baseFlat;
  
  // 4. Calcular total
  const diceTotal = diceResults.reduce((sum, r) => sum + r.subtotal, 0);
  const extraTotal = extraDiceResults.reduce((sum, r) => sum + r.subtotal, 0);
  const total = Math.max(0, diceTotal + extraTotal + flatBonus);
  
  // 5. Construir breakdown
  const diceFormula = diceResults
    .map(r => `${r.group.count}d${r.group.sides}[${r.rolls.join(',')}]`)
    .join(' + ');
  
  const extraFormula = extraDiceResults.length > 0
    ? ' + ' + extraDiceResults.map(r => `${r.group.count}d${r.group.sides}[${r.rolls.join(',')}]`).join(' + ')
    : '';
  
  const bonusFormula = flatBonus !== 0 
    ? ` ${flatBonus >= 0 ? '+' : ''}${flatBonus}`
    : '';
  
  return {
    diceResults,
    extraDiceResults,
    flatBonus,
    total,
    damageType: formula.damageType,
    isCritical,
    breakdown: {
      formula: formula.normalizedFormula,
      diceFormula: diceFormula + extraFormula,
      bonusFormula,
      result: `${total} ${formula.damageType || ''}`.trim(),
    },
  };
}

// =====================================================
// FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Rola um único dado
 */
function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Reconstrói a string da fórmula a partir dos componentes
 */
function buildFormulaString(
  diceGroups: DiceGroup[],
  flatBonus: number,
  damageType?: string
): string {
  const parts: string[] = [];
  
  for (const group of diceGroups) {
    parts.push(`${group.count}d${group.sides}`);
  }
  
  if (flatBonus !== 0) {
    parts.push(flatBonus > 0 ? `+${flatBonus}` : `${flatBonus}`);
  }
  
  let formula = parts.join('+').replace(/\+\+/g, '+').replace(/\+-/g, '-');
  
  if (damageType) {
    formula += ` ${damageType}`;
  }
  
  return formula;
}

/**
 * Combina múltiplas fórmulas de dano em uma única
 * Útil para somar dano de arma + buff + poder
 */
export function combineDamageFormulas(
  ...formulas: (ParsedDamageFormula | string)[]
): ParsedDamageFormula {
  const allGroups: DiceGroup[] = [];
  let totalFlat = 0;
  let primaryDamageType: string | undefined;
  const originalParts: string[] = [];
  
  for (const f of formulas) {
    const parsed = typeof f === 'string' ? parseDamageFormula(f) : f;
    
    if (!parsed.isValid) continue;
    
    allGroups.push(...parsed.diceGroups);
    totalFlat += parsed.flatBonus;
    
    if (!primaryDamageType && parsed.damageType) {
      primaryDamageType = parsed.damageType;
    }
    
    originalParts.push(parsed.originalFormula);
  }
  
  return {
    diceGroups: allGroups,
    flatBonus: totalFlat,
    damageType: primaryDamageType,
    originalFormula: originalParts.join(' + '),
    normalizedFormula: buildFormulaString(allGroups, totalFlat, primaryDamageType),
    isValid: allGroups.length > 0 || totalFlat !== 0,
  };
}

/**
 * Calcula o dano médio esperado de uma fórmula
 */
export function calculateAverageDamage(formula: ParsedDamageFormula | string): number {
  const parsed = typeof formula === 'string' ? parseDamageFormula(formula) : formula;
  
  if (!parsed.isValid) return 0;
  
  const diceAverage = parsed.diceGroups.reduce(
    (sum, g) => sum + g.count * (g.sides + 1) / 2,
    0
  );
  
  return diceAverage + parsed.flatBonus;
}

/**
 * Calcula o dano máximo possível de uma fórmula
 */
export function calculateMaxDamage(formula: ParsedDamageFormula | string): number {
  const parsed = typeof formula === 'string' ? parseDamageFormula(formula) : formula;
  
  if (!parsed.isValid) return 0;
  
  const diceMax = parsed.diceGroups.reduce(
    (sum, g) => sum + g.count * g.sides,
    0
  );
  
  return diceMax + parsed.flatBonus;
}

/**
 * Calcula o dano mínimo possível de uma fórmula
 */
export function calculateMinDamage(formula: ParsedDamageFormula | string): number {
  const parsed = typeof formula === 'string' ? parseDamageFormula(formula) : formula;
  
  if (!parsed.isValid) return 0;
  
  const diceMin = parsed.diceGroups.reduce(
    (sum, g) => sum + g.count, // Cada dado rola no mínimo 1
    0
  );
  
  return Math.max(0, diceMin + parsed.flatBonus);
}

/**
 * Converte uma fórmula parseada para o formato legado DamageParams
 * Compatibilidade com src/lib/dice-roller.ts
 */
export function toLegacyDamageParams(
  formula: ParsedDamageFormula,
  options?: { isCritical?: boolean; criticalMultiplier?: number; damageType?: string }
): { diceCount: number; diceType: number; bonusDamage: number; isCritical: boolean; criticalMultiplier: number; damageType?: string } {
  // Pega o primeiro grupo de dados como principal
  const primaryGroup = formula.diceGroups[0] || { count: 1, sides: 6 };
  
  // Soma dados adicionais ao bônus fixo (simplificação para compatibilidade)
  let extraDiceBonus = 0;
  for (let i = 1; i < formula.diceGroups.length; i++) {
    const g = formula.diceGroups[i];
    // Usa média do dado como aproximação
    extraDiceBonus += g.count * Math.floor((g.sides + 1) / 2);
  }
  
  return {
    diceCount: primaryGroup.count,
    diceType: primaryGroup.sides,
    bonusDamage: formula.flatBonus + extraDiceBonus,
    isCritical: options?.isCritical ?? false,
    criticalMultiplier: options?.criticalMultiplier ?? 2,
    damageType: options?.damageType ?? formula.damageType,
  };
}
