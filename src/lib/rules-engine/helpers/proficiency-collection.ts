/**
 * proficiency-collection.ts
 * Ordem Paranormal RPG v1.3
 * 
 * Coleta todas as proficiências do personagem de múltiplas fontes:
 * - Classe base
 * - Trilhas de classe
 * - Poderes de classe (ex: Armamento Pesado, Treinamento em Armadura)
 * - Poderes gerais
 * - Origens (ex: Militar - armas de fogo)
 * - SUE (efeitos consolidados)
 */

import type { CharacterState } from '../types';
import type { SUEComputedForRulesEngine } from '../sue-bridge';

// =====================================================
// CONSTANTES - Proficiências Base por Classe
// =====================================================

const CLASS_PROFICIENCIES: Record<string, string[]> = {
  'Combatente': [
    'Armas simples',
    'Armas táticas',
    'Proteções leves',
  ],
  'Especialista': [
    'Armas simples',
    'Proteções leves',
  ],
  'Ocultista': [
    'Armas simples',
  ],
};

// =====================================================
// CONSTANTES - Proficiências por Trilha
// =====================================================

const TRACK_PROFICIENCIES: Record<string, string[]> = {
  // === Combatente ===
  'aniquilador': [],
  'comandante-de-campo': [],
  'guerreiro': [
    'Proteções pesadas',
  ],
  'operacoes-especiais': [],
  'tropa-de-choque': [
    'Proteções pesadas',
    'Escudos',
  ],
  
  // === Especialista ===
  'atirador-de-elite': [
    'Armas de fogo longas',
  ],
  'infiltrador': [],
  'medico-de-campo': [],
  'negociador': [],
  'tecnico': [],
  
  // === Ocultista ===
  'conduíte': [],
  'flagelador': [],
  'graduado': [],
  'intuitivo': [],
  'lâmina paranormal': [
    'Armas táticas corpo a corpo',
  ],
};

// =====================================================
// CONSTANTES - Poderes que Concedem Proficiências
// =====================================================

const POWER_PROFICIENCIES: Record<string, string[]> = {
  // === Poderes de Combatente ===
  'armamento-pesado': [
    'Armas pesadas',
  ],
  'treinamento-em-armadura': [
    'Proteções pesadas',
  ],
  
  // === Poderes de Especialista ===
  'mira-instintiva': [], // Ignora penalidades, não dá proficiência
  
  // === Poderes de Ocultista ===
  'arma-secreta': [
    'Armas simples corpo a corpo',
    'Armas táticas corpo a corpo',
    'Armas simples à distância',
  ],
  
  // === Poderes Gerais ===
  'proficiencia-armas-taticas': [
    'Armas táticas',
  ],
  'proficiencia-protecoes-pesadas': [
    'Proteções pesadas',
  ],
  'proficiencia-escudos': [
    'Escudos',
  ],
};

// =====================================================
// CONSTANTES - Origens que Concedem Proficiências
// =====================================================

const ORIGIN_PROFICIENCIES: Record<string, string[]> = {
  'militar': [
    'Armas de fogo',
  ],
  'policial': [
    'Armas de fogo curtas',
  ],
  'mercenario': [
    'Armas táticas',
  ],
  'lutador': [], // Apenas bônus de dano, não proficiência
  'agente-de-saude': [],
  'amnesico': [],
  'artista': [],
  'atleta': [],
  'chef': [],
  'colegial': [],
  'criminoso': [],
  'cultista-arrependido': [],
  'desgarrado': [],
  'diplomata': [],
  'engenheiro': [],
  'executivo': [],
  'investigador': [],
  'magnata': [],
  'motorista': [],
  'operario': [],
  'religioso': [],
  'servidor-publico': [],
  'teorico-da-conspiracao': [],
  'ti': [],
  'trabalhador-rural': [],
  'trambiqueiro': [],
  'universitario': [],
  'vitima': [],
  'academico': [],
};

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================

/**
 * Coleta todas as proficiências do personagem
 * 
 * @param state - Estado do personagem
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns Array de proficiências únicas
 */
export function collectProficiencies(
  state: CharacterState,
  sueComputed?: SUEComputedForRulesEngine
): string[] {
  const proficiencies = new Set<string>();
  
  // 1. Proficiências base da classe
  const classProficiencies = getClassProficiencies(state.characterClass);
  classProficiencies.forEach(p => proficiencies.add(p));
  
  // 2. Proficiências da trilha (se houver)
  if (state.classTrack) {
    const trackProficiencies = getTrackProficiencies(state.classTrack);
    trackProficiencies.forEach(p => proficiencies.add(p));
  }
  
  // 3. Proficiências de poderes de classe
  for (const powerId of state.classPowers) {
    const powerProfs = getPowerProficiencies(powerId);
    powerProfs.forEach(p => proficiencies.add(p));
  }
  
  // 4. Proficiências de poderes gerais
  for (const powerId of state.generalPowers) {
    const powerProfs = getPowerProficiencies(powerId);
    powerProfs.forEach(p => proficiencies.add(p));
  }
  
  // 5. Proficiências de poderes paranormais
  for (const powerId of state.paranormalPowers) {
    const powerProfs = getPowerProficiencies(powerId);
    powerProfs.forEach(p => proficiencies.add(p));
  }
  
  // 6. Proficiências de origem
  const originProfs = getOriginProficiencies(state.origin);
  originProfs.forEach(p => proficiencies.add(p));
  
  // 7. Proficiências do SUE (consolidadas de todas as fontes)
  if (sueComputed?.proficiencies) {
    sueComputed.proficiencies.forEach(p => proficiencies.add(p));
  }
  
  return Array.from(proficiencies).sort();
}

// =====================================================
// GETTERS
// =====================================================

/**
 * Retorna proficiências base de uma classe
 */
export function getClassProficiencies(classId: string): string[] {
  return CLASS_PROFICIENCIES[classId] || [];
}

/**
 * Retorna proficiências de uma trilha
 */
export function getTrackProficiencies(trackId: string): string[] {
  // Normalizar ID da trilha
  const normalizedId = trackId.toLowerCase().replace(/\s+/g, '-');
  return TRACK_PROFICIENCIES[normalizedId] || [];
}

/**
 * Retorna proficiências de um poder
 */
export function getPowerProficiencies(powerId: string): string[] {
  // Normalizar ID do poder
  const normalizedId = powerId.toLowerCase().replace(/\s+/g, '-');
  return POWER_PROFICIENCIES[normalizedId] || [];
}

/**
 * Retorna proficiências de uma origem
 */
export function getOriginProficiencies(originId: string): string[] {
  // Normalizar ID da origem
  const normalizedId = originId.toLowerCase()
    .replace(/\s+/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return ORIGIN_PROFICIENCIES[normalizedId] || [];
}

// =====================================================
// VERIFICAÇÃO DE PROFICIÊNCIA
// =====================================================

/**
 * Verifica se o personagem tem proficiência em uma categoria de equipamento
 * 
 * @param state - Estado do personagem
 * @param category - Categoria do equipamento (ex: "Armas táticas", "Proteções pesadas")
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns true se tem proficiência
 */
export function hasProficiency(
  state: CharacterState,
  category: string,
  sueComputed?: SUEComputedForRulesEngine
): boolean {
  const proficiencies = collectProficiencies(state, sueComputed);
  const normalizedCategory = category.toLowerCase();
  
  return proficiencies.some(p => p.toLowerCase().includes(normalizedCategory));
}

/**
 * Verifica proficiência para uma arma específica
 * 
 * @param state - Estado do personagem
 * @param weaponCategory - Categoria da arma (ex: "simple-melee", "tactical-ranged")
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns true se tem proficiência
 */
export function hasWeaponProficiency(
  state: CharacterState,
  weaponCategory: string,
  sueComputed?: SUEComputedForRulesEngine
): boolean {
  const proficiencies = collectProficiencies(state, sueComputed);
  
  // Mapear categorias internas para nomes de proficiência
  const categoryMap: Record<string, string[]> = {
    'simple-melee': ['Armas simples'],
    'simple-ranged': ['Armas simples'],
    'tactical-melee': ['Armas táticas', 'Armas táticas corpo a corpo'],
    'tactical-ranged': ['Armas táticas', 'Armas de fogo'],
    'firearm-short': ['Armas de fogo', 'Armas de fogo curtas'],
    'firearm-long': ['Armas de fogo', 'Armas de fogo longas'],
    'heavy': ['Armas pesadas'],
  };
  
  const requiredProfs = categoryMap[weaponCategory] || [];
  
  return requiredProfs.some(req => 
    proficiencies.some(p => p.toLowerCase().includes(req.toLowerCase()))
  );
}

/**
 * Verifica proficiência para uma proteção específica
 * 
 * @param state - Estado do personagem
 * @param armorCategory - Categoria da armadura ('leve' ou 'pesada')
 * @param sueComputed - Efeitos consolidados do SUE (opcional)
 * @returns true se tem proficiência
 */
export function hasArmorProficiency(
  state: CharacterState,
  armorCategory: 'leve' | 'pesada',
  sueComputed?: SUEComputedForRulesEngine
): boolean {
  const proficiencies = collectProficiencies(state, sueComputed);
  
  const requiredProf = armorCategory === 'pesada' 
    ? 'Proteções pesadas' 
    : 'Proteções leves';
  
  return proficiencies.some(p => 
    p.toLowerCase().includes(requiredProf.toLowerCase())
  );
}
