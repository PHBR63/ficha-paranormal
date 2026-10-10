import { SKILLS } from './character-data';
import { getSkillTrainingLevel, normalizeSkillId } from './skill-training';

/** Confere treino real ou Eclético selecionado, sem confundir bônus com grau.
 * Rótulos de atributos não são perícias e permanecem livres. Retorna aviso ou null.
 */
export function getSkillTrainingRequirement(
  skill: string,
  training: Record<string, number>,
  temporaryTrainingBonus?: number,
): string | null {
  const entry = SKILLS.find(item => normalizeSkillId(item.id) === normalizeSkillId(skill));
  if (!entry?.requiresTraining || getSkillTrainingLevel(training, entry.id) > 0) return null;
  if (temporaryTrainingBonus !== undefined && Number.isFinite(temporaryTrainingBonus) && temporaryTrainingBonus >= 5) return null;
  return `${entry.name} exige treinamento. Selecione Eclético, se disponível, ou confira o treinamento da ficha. Bônus de itens e poderes não substituem esse requisito.`;
}
