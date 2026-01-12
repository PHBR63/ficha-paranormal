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

/**
 * Array contendo todas as trilhas do sistema
 */
export const ALL_TRACKS: UnifiedTrack[] = [
    ...COMBATENTE_TRACKS,
    ...ESPECIALISTA_TRACKS,
    ...OCULTISTA_TRACKS
];

/**
 * Busca uma trilha pelo ID
 */
export function getTrackById(id: string): UnifiedTrack | undefined {
    return ALL_TRACKS.find(t => t.id === id);
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
    // Assume que só existe uma habilidade inicial ou pega a primeira
    return abilities.find(a => a.minNex === 10);
}

/**
 * Valida se um ID de trilha é válido
 */
export function isValidTrackId(id: string): boolean {
    return ALL_TRACKS.some(t => t.id === id);
}

/**
 * Agrupa trilhas por classe
 */
export function getTracksByClass(): Record<string, UnifiedTrack[]> {
    return {
        'combatente': COMBATENTE_TRACKS,
        'especialista': ESPECIALISTA_TRACKS,
        'ocultista': OCULTISTA_TRACKS,
    };
}
