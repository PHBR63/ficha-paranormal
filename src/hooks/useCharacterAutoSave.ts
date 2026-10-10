import { useEffect, useCallback, useState } from "react";
import type { CharacterFormData } from "@/pages/CharacterCreate";
import { z } from "zod";

export interface DraftScope {
  userId: string;
  campaignId?: string | null;
}
interface AutoSaveData {
  version: 2;
  formData: CharacterFormData;
  currentStep: number;
  savedAt: number;
  photoNeedsReselect?: boolean;
}
const strings = z.array(z.string());
const subchoices = z.object({
  skills: strings.optional(),
  ritualId: z.string().optional(),
  resistElement: z.string().optional(),
  classPowerIds: strings.optional(),
});
const draftForm = z
  .object({
    name: z.string(),
    playerName: z.string(),
    concept: z.string(),
    background: z.string(),
    gender: z.string(),
    appearance: z.string(),
    personality: z.string(),
    age: z.number().int().nullable(),
    photoUrl: z.string().nullable(),
    photoFile: z.null(),
    origin: z.string(),
    characterClass: z.string(),
    patent: z.string(),
    nex: z.number().int(),
    attributes: z.object({
      agility: z.number().int(),
      strength: z.number().int(),
      intellect: z.number().int(),
      presence: z.number().int(),
      vigor: z.number().int(),
    }),
    originSkills: strings,
    freeSkills: strings,
    abilities: strings,
    rituals: strings,
    trackAbilities: strings,
    proficiencies: strings,
    classTrack: z.string(),
    originParanormalPower: z.string().nullable(),
    powers: z.array(z.object({ name: z.string(), description: z.string() })),
    skills: z.record(z.number()),
    classSkillChoices: z.record(z.string()),
    conflictResolutions: z.record(z.string()),
    classPowerChoices: z.record(
      z.object({
        powerId: z.string(),
        choiceType: z.enum([
          "weaponGroup",
          "skill",
          "attribute",
          "power",
          "element",
          "ritual",
          "item",
        ]),
        chosenValues: strings,
        instanceIndex: z.number().int().optional(),
      }),
    ),
    skillTrainingChoices: z.record(
      z.array(
        z.object({
          skillId: z.string(),
          fromLevel: z.number().int(),
          toLevel: z.number().int(),
        }),
      ),
    ),
    transcenderChoices: z.record(
      z.object({
        powerId: z.string(),
        powerName: z.string(),
        powerElement: z.string(),
        subchoices: subchoices.optional(),
      }),
    ),
    trainingAdvances: z.record(strings).optional(),
    extraRituals: z.record(strings).optional(),
    creationItemChoices: z.record(z.string()).optional(),
    originParanormalChoices: subchoices.optional(),
    elementalAffinity: z.string().nullable().optional(),
    creationOperationId: z.string().uuid().optional(),
    versatilityChoice: z
      .object({
        type: z.enum(["class_power", "track_ability"]),
        trackId: z.string().optional(),
        trackName: z.string().optional(),
        abilityId: z.string().optional(),
        abilityName: z.string().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();
const storageKey = (scope?: DraftScope) =>
  scope?.userId
    ? `character-creation-draft:v2:${scope.userId}:${scope.campaignId || "personal"}`
    : null;

/** Isola rascunhos por proprietário e campanha; nunca importa o rascunho global sem autoria. */
export function useCharacterAutoSave(
  formData: CharacterFormData,
  currentStep: number,
  enabled = true,
  scope?: DraftScope,
) {
  const [error, setError] = useState<string | null>(null);
  const key = storageKey(scope);
  const save = useCallback(() => {
    if (!enabled || !key) return;
    const data: AutoSaveData = {
      version: 2,
      formData: {
        ...formData,
        photoFile: null,
        photoUrl: formData.photoUrl?.startsWith("blob:")
          ? null
          : formData.photoUrl,
      },
      currentStep,
      savedAt: Date.now(),
      photoNeedsReselect: !!formData.photoFile,
    };
    try {
      const json = JSON.stringify(data);
      if (json.length > 500000) throw new Error("size");
      localStorage.setItem(key, json);
      setError(null);
    } catch {
      // Preserva o último rascunho legível, inclusive quando acaba o espaço do navegador.
      setError(
        "O navegador não conseguiu guardar o rascunho. Mantenha esta página aberta até concluir a ficha.",
      );
    }
  }, [formData, currentStep, enabled, key]);
  useEffect(() => {
    if (!enabled || !key) return;
    const timer = setTimeout(save, 1000);
    return () => clearTimeout(timer);
  }, [save, enabled, key]);
  return { save, error };
}

/** Aceita somente um envelope v2 com os campos estruturais necessários, antes de renderizar. */
export function loadCharacterDraft(scope?: DraftScope): AutoSaveData | null {
  const key = storageKey(scope);
  if (!key) return null;
  try {
    const data = JSON.parse(
      localStorage.getItem(key) || "null",
    ) as AutoSaveData | null;
    if (
      !data ||
      data.version !== 2 ||
      !Number.isFinite(data.savedAt) ||
      Date.now() - data.savedAt > 7 * 86400000
    )
      return null;
    if (
      data.savedAt > Date.now() + 60000 ||
      !draftForm.safeParse(data.formData).success
    )
      return null;
    return {
      ...data,
      currentStep: Number.isInteger(data.currentStep)
        ? Math.max(0, Math.min(10, data.currentStep))
        : 0,
    };
  } catch {
    return null;
  }
}
export function clearCharacterDraft(scope?: DraftScope): boolean {
  const key = storageKey(scope);
  try {
    if (key) localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
export function hasCharacterDraft(scope?: DraftScope): boolean {
  return loadCharacterDraft(scope) !== null;
}
