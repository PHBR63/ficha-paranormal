import { getSkillBonus } from './character-data';

/** Normaliza nome/ID legado para comparar perícias sem alterar a ficha salva. */
export function normalizeSkillId(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_]+/g, '-');
}

/** Lê grau 0–3 por ID ou nome legado. Um zero explícito tem precedência. */
export function getSkillTrainingLevel(skills: Record<string, number>, skill: string): number {
  const id = normalizeSkillId(skill);
  const value = skills[id] ?? Object.entries(skills).find(([key]) => normalizeSkillId(key) === id)?.[1] ?? 0;
  return Number.isInteger(value) && value >= 0 && value <= 3 ? value : 0;
}

/** Converte o grau persistido em bônus numérico, sem somar o atributo. */
export function getSkillTrainingBonus(skills: Record<string, number>, skill: string): number {
  return getSkillBonus(getSkillTrainingLevel(skills, skill));
}
