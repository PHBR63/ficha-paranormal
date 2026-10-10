import type { CharacterFormData } from "@/pages/CharacterCreate";
import { SKILLS } from "@/lib/character-data";
import { creationSkillLevels } from "@/lib/character-creation-rules";
import { rebuildCharacterSheet } from "@/lib/character-builder-engine";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

/** Escolhas de progressão de classe, independentes do poder Treinamento em Perícia. */
export function CreationTrainingPanel({ formData, updateFormData }: Props) {
  const base =
    formData.characterClass === "Especialista"
      ? 5
      : formData.characterClass === "Ocultista"
        ? 3
        : 2;
  return (
    <div className="space-y-4">
      {[35, 70]
        .filter((n) => formData.nex >= n)
        .map((n) => {
          const levels = creationSkillLevels(formData, n);
          const selected = formData.trainingAdvances?.[n] || [];
          const count = base + formData.attributes.intellect;
          return (
            <section
              key={n}
              className="ordo-panel p-4 space-y-3"
              aria-label={`Grau de treinamento NEX ${n}%`}
            >
              <h3 className="font-display text-lg">
                NEX {n}% — {n === 35 ? "VETERANO" : "EXPERT"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Escolha {count} perícias para aumentar o grau. {selected.length}
                /{count} selecionadas. Livro Base, pp.26,30,34.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SKILLS.filter(
                  (s) => (levels[s.id] || 0) >= (n === 70 ? 2 : 1),
                ).map((skill) => (
                  <label
                    key={skill.id}
                    className="flex gap-3 items-center min-h-11 p-2 rounded border border-border"
                  >
                    <Checkbox
                      aria-label={`NEX ${n}%: ${skill.name}`}
                      checked={selected.includes(skill.id)}
                      disabled={
                        !selected.includes(skill.id) && selected.length >= count
                      }
                      onCheckedChange={(checked) =>
                        updateFormData({
                          trainingAdvances: {
                            ...formData.trainingAdvances,
                            [n]: checked
                              ? [...selected, skill.id]
                              : selected.filter((id) => id !== skill.id),
                          },
                        })
                      }
                    />
                    <span>{skill.name}</span>
                  </label>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

/** Perito exige duas perícias treinadas e não aceita Luta/Pontaria (Base p.28). */
export function CreationPeritoPanel({ formData, updateFormData }: Props) {
  if (formData.characterClass !== "Especialista") return null;
  const trained = rebuildCharacterSheet(formData).allTrainedSkills;
  const selected =
    Object.values(formData.classPowerChoices).find(
      (c) => c.powerId === "perito",
    )?.chosenValues || [];
  return (
    <section
      className="ordo-panel p-4 space-y-3"
      aria-label="Perícias do Perito"
    >
      <h3 className="font-display text-lg">PERITO — ESCOLHA DUAS PERÍCIAS</h3>
      <p className="text-sm text-muted-foreground">
        Perícias treinadas, exceto Luta e Pontaria. {selected.length}/2
        selecionadas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SKILLS.filter(
          (s) => trained.includes(s.id) && !["luta", "pontaria"].includes(s.id),
        ).map((skill) => (
          <label
            key={skill.id}
            className="flex items-center gap-3 min-h-11 p-2 rounded border border-border"
          >
            <Checkbox
              aria-label={`Perito: ${skill.name}`}
              checked={selected.includes(skill.id)}
              disabled={!selected.includes(skill.id) && selected.length >= 2}
              onCheckedChange={(checked) =>
                updateFormData({
                  classPowerChoices: {
                    ...formData.classPowerChoices,
                    "perito-0": {
                      powerId: "perito",
                      choiceType: "skill",
                      chosenValues: checked
                        ? [...selected, skill.id]
                        : selected.filter((id) => id !== skill.id),
                      instanceIndex: 0,
                    },
                  },
                })
              }
            />
            <span>{skill.name}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
