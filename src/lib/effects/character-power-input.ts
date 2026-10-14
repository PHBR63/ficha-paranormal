import { CLASS_ONLY_POWERS } from "@/lib/class-powers/power-registry";
import type { ActiveClassPower } from "./class-power-effects-adapter";

type SavedChoice = {
  powerId: string;
  choiceType: string;
  chosenValues: string[];
};

/** Converte poderes de classe e escolhas para o motor; habilidades de trilha entram pelo adaptador de trilha. */
export function characterPowerInput(
  abilities: string[],
  classId: string,
  nex: number,
  choices: Record<string, SavedChoice> = {},
): ActiveClassPower[] {
  const result: ActiveClassPower[] = [];
  for (const ability of abilities) {
    const matches = CLASS_ONLY_POWERS.filter(
      (p) => p.id === ability || p.name === ability,
    );
    const power = matches.find((p) => p.classId === classId) || matches[0];
    if (!power || result.some((p) => p.id === power.id)) continue;
    const choice = Object.values(choices).find((c) => c.powerId === power.id);
    result.push({
      id: power.id,
      name: power.name,
      classId: power.classId,
      nex,
      choices: choice
        ? {
            element:
              choice.choiceType === "element"
                ? choice.chosenValues[0]
                : undefined,
            ritual:
              choice.choiceType === "ritual"
                ? choice.chosenValues[0]
                : undefined,
            skill:
              choice.choiceType === "skill"
                ? choice.chosenValues[0]
                : undefined,
          }
        : undefined,
    });
  }
  return result;
}
