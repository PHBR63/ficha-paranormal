/**
 * Registro Central de Trilhas - Ordem Paranormal RPG v1.3
 * 
 * Centraliza todas as trilhas de classe e fornece funções de busca e filtragem.
 * Similar ao power-registry.ts, mas para trilhas.
 * 
 * @module track-registry
 */

import type { 
  UnifiedTrack, 
  UnifiedTrackAbility, 
  TrackAbilityNex 
} from './track-types';
import type { ClassId } from './types';
import { COMBATENTE_TRACKS } from './track-combatente';
import { ESPECIALISTA_TRACKS } from './track-especialista';
import { OCULTISTA_TRACKS } from './track-ocultista';

// =============================================================================
// AGREGAÇÃO DE TODAS AS TRILHAS
// =============================================================================

/**
 * Array contendo todas as trilhas de todas as classes
 */
export const ALL_TRACKS: UnifiedTrack[] = [
  ...COMBATENTE_TRACKS,
  ...ESPECIALISTA_TRACKS,
  ...OCULTISTA_TRACKS,
];

// =============================================================================
// ÍNDICES PARA BUSCA RÁPIDA
// =============================================================================

/**
 * Map de trilha por ID para acesso O(1)
 */
const TRACK_BY_ID: Map<string, UnifiedTrack> = new Map(
  ALL_TRACKS.map(track => [track.id, track])
);

/**
 * Map de trilhas por classe para acesso rápido
 */
const TRACKS_BY_CLASS: Map<ClassId, UnifiedTrack[]> = new Map([
  ['Combatente', COMBATENTE_TRACKS],
  ['Especialista', ESPECIALISTA_TRACKS],
  ['Ocultista', OCULTISTA_TRACKS],
]);

/**
 * Map de habilidade por ID para acesso O(1)
 */
const ABILITY_BY_ID: Map<string, UnifiedTrackAbility> = new Map(
  ALL_TRACKS.flatMap(track => 
    track.abilities.map(ability => [ability.id, ability])
  )
);

// =============================================================================
// FUNÇÕES DE BUSCA DE TRILHAS
// =============================================================================

/**
 * Busca uma trilha pelo ID
 * @param id - ID da trilha
 * @returns Trilha encontrada ou undefined
 */
export function getTrackById(id: string): UnifiedTrack | undefined {
  return TRACK_BY_ID.get(id);
}

/**
 * Retorna todas as trilhas de uma classe
 * @param classId - ID da classe
 * @returns Array de trilhas da classe
 */
export function getTracksByClass(classId: ClassId): UnifiedTrack[] {
  return TRACKS_BY_CLASS.get(classId) || [];
}

/**
 * Retorna os IDs de todas as trilhas de uma classe
 * @param classId - ID da classe
 * @returns Array de IDs de trilhas
 */
export function getTrackIdsByClass(classId: ClassId): string[] {
  return getTracksByClass(classId).map(track => track.id);
}

/**
 * Busca trilhas por nome (case insensitive, busca parcial)
 * @param searchTerm - Termo de busca
 * @param classId - Opcional: limita busca a uma classe
 * @returns Array de trilhas que correspondem
 */
export function searchTracks(searchTerm: string, classId?: ClassId): UnifiedTrack[] {
  const term = searchTerm.toLowerCase();
  const tracks = classId ? getTracksByClass(classId) : ALL_TRACKS;
  
  return tracks.filter(track => 
    track.name.toLowerCase().includes(term) ||
    track.description.toLowerCase().includes(term) ||
    track.id.toLowerCase().includes(term)
  );
}

/**
 * Retorna trilhas por tag
 * @param tag - Tag a buscar
 * @param classId - Opcional: limita busca a uma classe
 * @returns Array de trilhas com a tag
 */
export function getTracksByTag(tag: string, classId?: ClassId): UnifiedTrack[] {
  const tracks = classId ? getTracksByClass(classId) : ALL_TRACKS;
  return tracks.filter(track => track.tags?.includes(tag));
}

// =============================================================================
// FUNÇÕES DE BUSCA DE HABILIDADES
// =============================================================================

/**
 * Busca uma habilidade de trilha pelo ID
 * @param id - ID da habilidade
 * @returns Habilidade encontrada ou undefined
 */
export function getTrackAbilityById(id: string): UnifiedTrackAbility | undefined {
  return ABILITY_BY_ID.get(id);
}

/**
 * Retorna todas as habilidades de uma trilha
 * @param trackId - ID da trilha
 * @returns Array de habilidades
 */
export function getAbilitiesByTrack(trackId: string): UnifiedTrackAbility[] {
  const track = getTrackById(trackId);
  return track?.abilities || [];
}

/**
 * Retorna a habilidade inicial de uma trilha (NEX 10%)
 * @param trackId - ID da trilha
 * @returns Habilidade inicial ou undefined
 */
export function getInitialAbility(trackId: string): UnifiedTrackAbility | undefined {
  const track = getTrackById(trackId);
  return track?.abilities.find(ability => ability.minNex === 10);
}

/**
 * Retorna as habilidades desbloqueadas em um NEX específico
 * @param trackId - ID da trilha
 * @param nex - NEX do personagem
 * @returns Array de habilidades desbloqueadas
 */
export function getUnlockedAbilities(trackId: string, nex: number): UnifiedTrackAbility[] {
  const track = getTrackById(trackId);
  if (!track) return [];
  
  return track.abilities.filter(ability => ability.minNex <= nex);
}

/**
 * Retorna a próxima habilidade a ser desbloqueada
 * @param trackId - ID da trilha
 * @param nex - NEX atual do personagem
 * @returns Próxima habilidade ou undefined se já desbloqueou todas
 */
export function getNextAbility(trackId: string, nex: number): UnifiedTrackAbility | undefined {
  const track = getTrackById(trackId);
  if (!track) return undefined;
  
  return track.abilities.find(ability => ability.minNex > nex);
}

/**
 * Retorna o NEX necessário para a próxima habilidade
 * @param trackId - ID da trilha
 * @param nex - NEX atual do personagem
 * @returns NEX necessário ou undefined
 */
export function getNextAbilityNex(trackId: string, nex: number): TrackAbilityNex | undefined {
  const nextAbility = getNextAbility(trackId, nex);
  return nextAbility?.minNex;
}

/**
 * Verifica se uma habilidade está desbloqueada para um NEX
 * @param abilityId - ID da habilidade
 * @param nex - NEX do personagem
 * @returns true se desbloqueada
 */
export function isAbilityUnlocked(abilityId: string, nex: number): boolean {
  const ability = getTrackAbilityById(abilityId);
  return ability ? ability.minNex <= nex : false;
}

/**
 * Busca habilidades por tag
 * @param tag - Tag a buscar
 * @param trackId - Opcional: limita a uma trilha
 * @returns Array de habilidades com a tag
 */
export function getAbilitiesByTag(tag: string, trackId?: string): UnifiedTrackAbility[] {
  const abilities = trackId 
    ? getAbilitiesByTrack(trackId)
    : Array.from(ABILITY_BY_ID.values());
    
  return abilities.filter(ability => ability.tags?.includes(tag));
}

// =============================================================================
// FUNÇÕES DE VALIDAÇÃO
// =============================================================================

/**
 * Verifica se um personagem pode escolher uma trilha
 * @param trackId - ID da trilha
 * @param classId - Classe do personagem
 * @param nex - NEX do personagem
 * @returns Objeto com validação
 */
export function canChooseTrack(
  trackId: string, 
  classId: ClassId, 
  nex: number
): { valid: boolean; reason?: string } {
  const track = getTrackById(trackId);
  
  if (!track) {
    return { valid: false, reason: `Trilha "${trackId}" não encontrada` };
  }
  
  if (track.classId !== classId) {
    return { 
      valid: false, 
      reason: `Trilha "${track.name}" é exclusiva de ${track.classId}` 
    };
  }
  
  if (nex < 10) {
    return { 
      valid: false, 
      reason: 'Trilhas só podem ser escolhidas a partir de NEX 10%' 
    };
  }
  
  return { valid: true };
}

/**
 * Retorna as trilhas disponíveis para um personagem
 * @param classId - Classe do personagem
 * @param excludeTrackId - Opcional: trilha já escolhida (para Versatilidade)
 * @returns Array de trilhas disponíveis
 */
export function getAvailableTracks(classId: ClassId, excludeTrackId?: string): UnifiedTrack[] {
  const tracks = getTracksByClass(classId);
  
  if (excludeTrackId) {
    return tracks.filter(track => track.id !== excludeTrackId);
  }
  
  return tracks;
}

// =============================================================================
// ESTATÍSTICAS
// =============================================================================

/**
 * Retorna estatísticas sobre as trilhas
 * @returns Objeto com estatísticas
 */
export function getTrackStats(): {
  totalTracks: number;
  totalAbilities: number;
  tracksByClass: Record<ClassId, number>;
  abilitiesByNex: Record<TrackAbilityNex, number>;
} {
  const abilitiesByNex: Record<TrackAbilityNex, number> = {
    10: 0,
    40: 0,
    65: 0,
    99: 0,
  };
  
  ALL_TRACKS.forEach(track => {
    track.abilities.forEach(ability => {
      abilitiesByNex[ability.minNex]++;
    });
  });
  
  return {
    totalTracks: ALL_TRACKS.length,
    totalAbilities: ABILITY_BY_ID.size,
    tracksByClass: {
      'Combatente': COMBATENTE_TRACKS.length,
      'Especialista': ESPECIALISTA_TRACKS.length,
      'Ocultista': OCULTISTA_TRACKS.length,
    },
    abilitiesByNex,
  };
}

/**
 * Lista os rituais concedidos por trilhas
 * @returns Array de { trackId, abilityId, ritualId }
 */
export function getGrantedRituals(): Array<{
  trackId: string;
  abilityId: string;
  abilityName: string;
  ritualId: string;
  minNex: TrackAbilityNex;
}> {
  const rituals: Array<{
    trackId: string;
    abilityId: string;
    abilityName: string;
    ritualId: string;
    minNex: TrackAbilityNex;
  }> = [];
  
  ALL_TRACKS.forEach(track => {
    track.abilities.forEach(ability => {
      if (ability.effects.base.grantsRitual) {
        rituals.push({
          trackId: track.id,
          abilityId: ability.id,
          abilityName: ability.name,
          ritualId: ability.effects.base.grantsRitual,
          minNex: ability.minNex,
        });
      }
    });
  });
  
  return rituals;
}
