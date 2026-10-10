import type { CharacterFormData } from "@/pages/CharacterCreate";
import { getPowerById } from "@/lib/paranormal-powers";
import { ALL_RITUALS } from "@/lib/rituals/legacy-exports";
import { ALL_ITEMS } from "@/lib/catalogs/items-catalog";
import { BASE_CREATION_WEAPONS as ALL_WEAPONS } from "@/lib/rules/base-creation-equipment";
import { ALL_CLASS_POWERS } from "@/lib/class-powers/power-registry";
import { isBaseClassPower } from "@/lib/rules/base-class-catalog";
import { ALL_TRANSCENDER_IDS } from "@/lib/constants/game-ids";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClassPowerSubchoiceModal } from "./ClassPowerSubchoiceModal";
import {
  creationRituals,
  creationSkillLevels,
  creationPowerMilestones,
} from "@/lib/character-creation-rules";

interface Props {
  formData: CharacterFormData;
  updateFormData: (data: Partial<CharacterFormData>) => void;
  originOnly?: boolean;
}
/** Guarda a escolha por fonte; o catálogo fornece nome e efeito, nunca o texto digitado. */
export function CreationPowerChoices({
  formData: form,
  updateFormData,
  originOnly = false,
}: Props) {
  const [foreignChoice, setForeignChoice] = useState<string | null>(null);
  const counts: Record<string, number> = {};
  const sources = originOnly
    ? form.origin === "cultista-arrependido" && form.originParanormalPower
      ? [
          {
            key: "origin",
            powerId: form.originParanormalPower,
            choices: form.originParanormalChoices,
          },
        ]
      : []
    : form.abilities.flatMap((id) => {
        const index = counts[id] || 0;
        counts[id] = index + 1;
        const key = `${id}-${index}`;
        const choice = form.transcenderChoices[key];
        return ALL_TRANSCENDER_IDS.includes(id as never) && choice
          ? [{ key, powerId: choice.powerId, choices: choice.subchoices }]
          : [];
      });
  const updateChoice = (
    key: string,
    choices: NonNullable<CharacterFormData["originParanormalChoices"]>,
  ) => {
    if (key === "origin") updateFormData({ originParanormalChoices: choices });
    else
      updateFormData({
        transcenderChoices: {
          ...form.transcenderChoices,
          [key]: { ...form.transcenderChoices[key], subchoices: choices },
        },
      });
  };
  const fields = sources.flatMap((source) => {
    const power = getPowerById(source.powerId);
    if (!power) return [];
    if (power.requiresChoice === "ritual")
      return [
        <label key={source.key} className="block space-y-2">
          {power.name}: ritual aprendido
          <select
            className="w-full min-h-11 bg-background border rounded-md p-2"
            value={source.choices?.ritualId || ""}
            onChange={(e) =>
              updateChoice(source.key, { ritualId: e.target.value })
            }
          >
            <option value="">Escolha um ritual</option>
            {ALL_RITUALS.filter((r) => {
              const acquisition =
                source.key === "origin"
                  ? 5
                  : creationPowerMilestones(form)[
                      form.abilities.findIndex(
                        (id, index) =>
                          `${id}-${form.abilities.slice(0, index).filter((previous) => previous === id).length}` ===
                          source.key,
                      )
                    ] || 5;
              return (
                r.circle <= (acquisition >= 75 ? 3 : acquisition >= 45 ? 2 : 1)
              );
            }).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.circle}º círculo)
              </option>
            ))}
          </select>
        </label>,
      ];
    if (power.requiresChoice === "element_resistance")
      return [
        <label key={source.key} className="block space-y-2">
          {power.name}: elemento
          <select
            className="w-full min-h-11 bg-background border rounded-md p-2"
            value={source.choices?.resistElement || ""}
            onChange={(e) =>
              updateChoice(source.key, { resistElement: e.target.value })
            }
          >
            <option value="">Escolha um elemento</option>
            {["sangue", "morte", "conhecimento", "energia"].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>,
      ];
    if (power.id === "expansao-de-conhecimento")
      return [
        <label key={source.key} className="block space-y-2">
          Expansão de Conhecimento: poder de outra classe
          <select
            className="w-full min-h-11 bg-background border rounded-md p-2"
            value={source.choices?.classPowerIds?.[0] || ""}
            onChange={(e) =>
              updateChoice(source.key, { classPowerIds: [e.target.value] })
            }
          >
            <option value="">Escolha um poder</option>
            {ALL_CLASS_POWERS.filter(
              (p) =>
                !p.isCore &&
                p.classId !== form.characterClass &&
                !isBaseClassPower(form.characterClass, p.name) &&
                isBaseClassPower(p.classId, p.name),
            ).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.classId}
              </option>
            ))}
          </select>
          {source.choices?.classPowerIds?.[0] &&
            ALL_CLASS_POWERS.find(
              (p) => p.id === source.choices?.classPowerIds?.[0],
            )?.effects.base.requiresChoice && (
              <Button
                variant="outline"
                onClick={() =>
                  setForeignChoice(source.choices!.classPowerIds![0])
                }
              >
                Configurar poder concedido
              </Button>
            )}
        </label>,
      ];
    return [];
  });
  const itemSources = originOnly
    ? form.origin === "engenheiro"
      ? [
          {
            id: "ferramenta-favorita",
            name: "Ferramenta Favorita",
            weapons: false,
          },
        ]
      : form.origin === "operario"
        ? [
            {
              id: "ferramenta-de-trabalho",
              name: "Ferramenta de Trabalho (com aval do mestre)",
              weapons: true,
            },
          ]
        : []
    : form.classTrack === "aniquilador" && form.nex >= 10
      ? [{ id: "a-favorita", name: "A Favorita", weapons: true }]
      : [];
  return (
    <div className="space-y-4">
      {fields}
      {itemSources.map((source) => (
        <label key={source.id} className="block space-y-2">
          {source.name}: equipamento inicial
          <select
            className="w-full min-h-11 bg-background border rounded-md p-2"
            value={form.creationItemChoices?.[source.id] || ""}
            onChange={(e) =>
              updateFormData({
                creationItemChoices: {
                  ...form.creationItemChoices,
                  [source.id]: e.target.value,
                },
              })
            }
          >
            <option value="">Escolha no catálogo</option>
            {(source.weapons
              ? ALL_WEAPONS.filter(
                  (w) =>
                    (source.id !== "ferramenta-de-trabalho" ||
                      w.proficiency !== "pesada"),
                )
              : ALL_ITEMS
            ).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            A escolha será adicionada ao inventário e receberá o benefício desta
            fonte.
          </p>
        </label>
      ))}
      {!originOnly && form.nex >= 50 && (
        <label className="block space-y-2">
          Elemento de afinidade (ativo ao Transcender a partir de NEX 50%)
          <select
            className="w-full min-h-11 bg-background border rounded-md p-2"
            value={form.elementalAffinity || ""}
            onChange={(e) =>
              updateFormData({ elementalAffinity: e.target.value || null })
            }
          >
            <option value="">Escolha um elemento</option>
            {["sangue", "morte", "conhecimento", "energia"].map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      )}
      {foreignChoice && (
        <ClassPowerSubchoiceModal
          open
          power={ALL_CLASS_POWERS.find((p) => p.id === foreignChoice)!}
          knownRitualIds={creationRituals(form)}
          trainedSkillIds={Object.keys(creationSkillLevels(form)).filter(
            (id) => creationSkillLevels(form)[id] >= 1,
          )}
          onClose={() => setForeignChoice(null)}
          onConfirm={(choice) => {
            updateFormData({
              classPowerChoices: {
                ...form.classPowerChoices,
                [`expansao-${foreignChoice}`]: choice,
              },
            });
            setForeignChoice(null);
          }}
        />
      )}
    </div>
  );
}
