/**
 * Utilitário para verificação de proficiência com armas
 * Aplica a regra oficial: -5 no ataque sem proficiência
 */

// Tipos de proficiência de armas do sistema Ordem Paranormal
export type WeaponProficiency = 'simple' | 'tactical' | 'heavy';

// Mapeamento de categorias de arma para proficiência exigida
const CATEGORY_TO_PROFICIENCY: Record<string, WeaponProficiency> = {
  '0': 'simple',    // Categoria 0 - Armas Simples
  'I': 'tactical',  // Categoria I - Armas Táticas
  'II': 'heavy',    // Categoria II - Armas Pesadas
};

// Nomes alternativos para proficiências (para compatibilidade)
const PROFICIENCY_ALIASES: Record<string, string[]> = {
  'heavy': ['heavy', 'pesada', 'pesadas', 'armas pesadas'],
  'tactical': ['tactical', 'tática', 'táticas', 'armas táticas'],
  'simple': ['simple', 'simples', 'armas simples'],
};

/**
 * Retorna a proficiência exigida para uma categoria de arma
 * @param weaponCategory - Categoria da arma ('0', 'I', 'II')
 * @returns Proficiência exigida ou null se categoria inválida
 */
export function getRequiredProficiency(weaponCategory: string): WeaponProficiency | null {
  return CATEGORY_TO_PROFICIENCY[weaponCategory] || null;
}

/**
 * Verifica se uma proficiência específica está na lista do personagem
 * @param proficiency - Proficiência a verificar
 * @param characterProficiencies - Lista de proficiências do personagem
 */
function hasProficiency(proficiency: WeaponProficiency, characterProficiencies: string[]): boolean {
  const aliases = PROFICIENCY_ALIASES[proficiency] || [proficiency];
  const normalizedList = characterProficiencies.map(p => p.toLowerCase().trim());
  
  return aliases.some(alias => normalizedList.includes(alias.toLowerCase()));
}

/**
 * Resultado da verificação de proficiência
 */
export interface ProficiencyCheckResult {
  hasProficiency: boolean;
  penalty: number;
  missingProficiency?: string;
}

/**
 * Verifica se o personagem tem proficiência para usar uma arma
 * e retorna a penalidade aplicável
 * 
 * Regra oficial: -5 no ataque sem proficiência adequada
 * 
 * @param weaponCategory - Categoria da arma ('0', 'I', 'II')
 * @param characterProficiencies - Lista de proficiências do personagem
 * @param characterClass - Classe do personagem
 * @returns Objeto com status de proficiência e penalidade
 */
export function checkWeaponProficiency(
  weaponCategory: string | undefined,
  characterProficiencies: string[],
  characterClass: string
): ProficiencyCheckResult {
  // Se não há categoria definida, assume arma simples (sem penalidade)
  if (!weaponCategory) {
    return { hasProficiency: true, penalty: 0 };
  }

  const required = getRequiredProficiency(weaponCategory);
  
  // Categoria inválida ou não mapeada - sem penalidade
  if (!required) {
    return { hasProficiency: true, penalty: 0 };
  }
  
  // Todas as classes têm proficiência com armas simples
  if (required === 'simple') {
    return { hasProficiency: true, penalty: 0 };
  }
  
  // Combatente tem proficiência com armas táticas por padrão (classe base)
  if (required === 'tactical' && characterClass === 'Combatente') {
    return { hasProficiency: true, penalty: 0 };
  }
  
  // Verifica se tem a proficiência específica na lista
  if (hasProficiency(required, characterProficiencies)) {
    return { hasProficiency: true, penalty: 0 };
  }
  
  // Não tem proficiência: aplica penalidade de -5
  const proficiencyName = required === 'heavy' ? 'Armas Pesadas' : 'Armas Táticas';
  
  return { 
    hasProficiency: false, 
    penalty: -5,
    missingProficiency: proficiencyName
  };
}

/**
 * Retorna o nome amigável de uma categoria de arma
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    '0': 'Simples',
    'I': 'Tática',
    'II': 'Pesada',
  };
  return names[category] || 'Desconhecida';
}
