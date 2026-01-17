/**
 * Registro Central de Trilhas
 * Ordem Paranormal RPG v1.3
 * 
 * Centraliza o acesso às trilhas de todas as classes e fornece
 * utilitários para consulta de habilidades desbloqueadas.
 */

import { COMBATENTE_TRACKS } from './track-combatente';
import { ESPECIALISTA_TRACKS } from './track-especialista';
import { OCULTISTA_TRACKS } from './track-ocultista';
import type { UnifiedTrack, UnifiedTrackAbility } from './track-types';
import type { ClassId } from './types';

/**
 * Array contendo todas as trilhas do sistema
 */
export const ALL_TRACKS: UnifiedTrack[] = [
  ...COMBATENTE_TRACKS,
  ...ESPECIALISTA_TRACKS,
  ...OCULTISTA_TRACKS
];

// Mapa para busca rápida por ID
const TRACK_BY_ID = new Map<string, UnifiedTrack>(
  ALL_TRACKS.map(t => [t.id, t])
);

// Mapa de habilidades por ID
const ABILITY_BY_ID = new Map<string, UnifiedTrackAbility>();
ALL_TRACKS.forEach(track => {
  track.abilities.forEach(ability => {
    ABILITY_BY_ID.set(ability.id, ability);
  });
});

/**
 * Busca uma trilha pelo ID
 */
export function getTrackById(id: string): UnifiedTrack | undefined {
  return TRACK_BY_ID.get(id);
}

/**
 * Busca uma habilidade de trilha pelo ID
 */
export function getTrackAbilityById(id: string): UnifiedTrackAbility | undefined {
  return ABILITY_BY_ID.get(id);
}

/**
 * Retorna as habilidades da trilha desbloqueadas no NEX informado
 */
export function getUnlockedAbilities(trackId: string, nex: number): UnifiedTrackAbility[] {
  const track = getTrackById(trackId);
  if (!track) return [];

  return track.abilities.filter(ability => ability.minNex <= nex);
}

/**
 * Retorna a habilidade inicial da trilha (NEX 10%)
 */
export function getInitialAbility(trackId: string): UnifiedTrackAbility | undefined {
  const abilities = getUnlockedAbilities(trackId, 10);
  return abilities.find(a => a.minNex === 10);
}

/**
 * Retorna todas as habilidades de uma trilha
 */
export function getAbilitiesByTrack(trackId: string): UnifiedTrackAbility[] {
  const track = getTrackById(trackId);
  return track?.abilities ?? [];
}

/**
 * Retorna a próxima habilidade a ser desbloqueada
 */
export function getNextAbility(trackId: string, currentNex: number): UnifiedTrackAbility | undefined {
  const track = getTrackById(trackId);
  if (!track) return undefined;
  
  return track.abilities
    .filter(a => a.minNex > currentNex)
    .sort((a, b) => a.minNex - b.minNex)[0];
}

/**
 * Retorna o NEX necessário para a próxima habilidade
 */
export function getNextAbilityNex(trackId: string, currentNex: number): number | undefined {
  const next = getNextAbility(trackId, currentNex);
  return next?.minNex;
}

/**
 * Verifica se uma habilidade está desbloqueada
 */
export function isAbilityUnlocked(abilityId: string, nex: number): boolean {
  const ability = getTrackAbilityById(abilityId);
  return ability ? ability.minNex <= nex : false;
}

/**
 * Valida se um ID de trilha é válido
 */
export function isValidTrackId(id: string): boolean {
  return TRACK_BY_ID.has(id);
}

/**
 * Retorna trilhas agrupadas por classe
 */
export function getTracksByClass(classId?: ClassId | string): UnifiedTrack[] {
  if (!classId) {
    return {
      'combatente': COMBATENTE_TRACKS,
      'especialista': ESPECIALISTA_TRACKS,
      'ocultista': OCULTISTA_TRACKS,
    } as unknown as UnifiedTrack[];
  }
  
  // Normaliza para minúsculas para garantir compatibilidade com ambos os formatos
  const normalizedId = classId.toLowerCase();
  
  switch (normalizedId) {
    case 'combatente': return COMBATENTE_TRACKS;
    case 'especialista': return ESPECIALISTA_TRACKS;
    case 'ocultista': return OCULTISTA_TRACKS;
    default: return [];
  }
}

/**
 * Retorna IDs das trilhas de uma classe
 */
export function getTrackIdsByClass(classId: ClassId): string[] {
  return getTracksByClass(classId).map(t => t.id);
}

/**
 * Busca trilhas por tag
 */
export function getTracksByTag(tag: string): UnifiedTrack[] {
  return ALL_TRACKS.filter(t => t.tags?.includes(tag));
}

/**
 * Busca habilidades por tag
 */
export function getAbilitiesByTag(tag: string): UnifiedTrackAbility[] {
  const abilities: UnifiedTrackAbility[] = [];
  ALL_TRACKS.forEach(track => {
    track.abilities.forEach(ability => {
      if (ability.tags?.includes(tag)) {
        abilities.push(ability);
      }
    });
  });
  return abilities;
}

/**
 * Pesquisa trilhas por texto
 */
export function searchTracks(query: string): UnifiedTrack[] {
  const lowerQuery = query.toLowerCase();
  return ALL_TRACKS.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Verifica se personagem pode escolher uma trilha
 */
export function canChooseTrack(trackId: string, classId: ClassId, currentTrackId?: string): boolean {
  const track = getTrackById(trackId);
  if (!track) return false;
  if (track.classId !== classId) return false;
  if (currentTrackId === trackId) return false;
  return true;
}

/**
 * Retorna trilhas disponíveis para escolha (exclui a trilha atual)
 */
export function getAvailableTracks(classId: ClassId, currentTrackId?: string): UnifiedTrack[] {
  return getTracksByClass(classId).filter(t => t.id !== currentTrackId);
}

/**
 * Retorna rituais concedidos por trilhas
 */
export function getGrantedRituals(trackId: string, nex: number): string[] {
  const abilities = getUnlockedAbilities(trackId, nex);
  const rituals: string[] = [];
  
  abilities.forEach(ability => {
    // Verifica em effects.base.grantsRitual
    const grantsRitual = ability.effects?.base?.grantsRitual;
    if (grantsRitual) {
      if (Array.isArray(grantsRitual)) {
        rituals.push(...grantsRitual);
      } else if (typeof grantsRitual === 'string') {
        rituals.push(grantsRitual);
      }
    }
  });
  
  return rituals;
}

/**
 * Retorna estatísticas do sistema de trilhas
 */
export function getTrackStats() {
  const totalTracks = ALL_TRACKS.length;
  const totalAbilities = ALL_TRACKS.reduce((sum, t) => sum + t.abilities.length, 0);
  
  return {
    totalTracks,
    totalAbilities,
    tracksByClass: {
      combatente: COMBATENTE_TRACKS.length,
      especialista: ESPECIALISTA_TRACKS.length,
      ocultista: OCULTISTA_TRACKS.length,
    },
    abilitiesPerTrack: totalAbilities / totalTracks,
  };
}
