/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * 
 * NOTA: Este arquivo foi esvaziado.
 * As trilhas e classes do suplemento foram removidas por não serem oficiais.
 * Apenas o conteúdo do livro base (Combatente, Especialista, Ocultista) está disponível.
 * 
 * Para adicionar conteúdo oficial do suplemento no futuro, use este arquivo.
 */

import { ClassTrack } from './character-data';

// Array vazio - sem trilhas do suplemento implementadas
export const SUPPLEMENT_TRACKS: ClassTrack[] = [];

/**
 * Retorna as trilhas do suplemento para uma classe específica
 */
export function getSupplementTracksByClass(classId: string): ClassTrack[] {
  return SUPPLEMENT_TRACKS.filter(track => track.classId === classId);
}

/**
 * Retorna uma trilha do suplemento pelo ID
 */
export function getSupplementTrackById(id: string): ClassTrack | undefined {
  return SUPPLEMENT_TRACKS.find(track => track.id === id);
}
