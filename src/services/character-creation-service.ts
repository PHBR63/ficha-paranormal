import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { CharacterFormData } from "@/pages/CharacterCreate";
import {
  inspectCharacterCreation,
  creationInventory,
  creationPowerMilestones,
} from "@/lib/character-creation-rules";
import { ALL_TRANSCENDER_IDS } from "@/lib/constants/game-ids";

/** Converte o formulário validado para o contrato de gravação; sem File ou URL temporária. */
export function characterCreationPayload(
  form: CharacterFormData,
  photoUrl: string | null,
) {
  const checked = inspectCharacterCreation(form);
  if (checked.issues.length) throw new Error(checked.issues[0].message);
  const { build } = checked;
  return {
    name: form.name.trim(),
    player_name: form.playerName || null,
    origin: form.origin,
    class: form.characterClass,
    nex: form.nex,
    patent: form.patent,
    ...form.attributes,
    hp_max: build.derivedStats.hp,
    pe_max: build.derivedStats.pe,
    san_max: build.derivedStats.san,
    defense: build.defense,
    movement: build.movement,
    skills: checked.skills,
    powers: build.powers,
    abilities: build.abilities,
    proficiencies: build.proficiencies,
    rituals: checked.rituals,
    paranormal_powers: checked.paranormalPowers,
    inventory: creationInventory(form),
    class_track: form.nex >= 10 ? form.classTrack || null : null,
    background: form.background || null,
    concept: form.concept || null,
    age: form.age,
    gender: form.gender || null,
    appearance: form.appearance || null,
    personality: form.personality || null,
    photo_url: photoUrl,
    class_power_choices: form.classPowerChoices,
    skill_training_choices: form.skillTrainingChoices,
    training_grade_choices: Object.fromEntries(
      Object.entries(form.trainingAdvances || {})
        .filter(([nex]) => Number(nex) <= form.nex)
        .map(([nex, ids]) => [
          `nex${nex}`,
          ids.map((skillId) => ({
            skillId,
            fromLevel: Number(nex) === 35 ? 1 : 2,
            toLevel: Number(nex) === 35 ? 2 : 3,
          })),
        ]),
    ),
    versatility_track:
      form.versatilityChoice?.type === "track_ability"
        ? {
            trackId: form.versatilityChoice.trackId,
            trackName: form.versatilityChoice.trackName,
            abilityId: form.versatilityChoice.abilityId,
            abilityName: form.versatilityChoice.abilityName,
          }
        : null,
    elemental_affinity: form.nex >= 50 ? form.elementalAffinity || null : null,
    affinity_active:
      !!form.elementalAffinity &&
      form.abilities.some(
        (id, index) =>
          ALL_TRANSCENDER_IDS.includes(id as never) &&
          creationPowerMilestones(form)[index] >= 50,
      ),
    creation_data: { ...form, photoUrl, photoFile: null, version: 1 },
  };
}

/** Exige confirmação do servidor. A mesma chave recupera a criação após resposta incerta. */
export async function createCharacter(
  form: CharacterFormData,
  photoUrl: string | null,
  campaignId: string | null,
) {
  if (!form.creationOperationId)
    throw new Error("Reabra o rascunho para gerar a identificação da criação.");
  const payload = characterCreationPayload(form, photoUrl);
  const { data, error } = await supabase.rpc("create_character_base", {
    p_operation_id: form.creationOperationId,
    p_build: JSON.parse(JSON.stringify(payload)) as Json,
    p_campaign_id: campaignId,
  });
  if (error)
    throw new Error(
      error.message ||
        "O servidor não confirmou a criação. Tente novamente com este rascunho.",
    );
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.id !== "string" ||
    data.confirmed !== true ||
    (campaignId && data.campaign_id !== campaignId)
  ) {
    throw new Error(
      "A resposta não confirmou todos os dados da criação. Seu rascunho foi preservado; tente novamente.",
    );
  }
  return { id: data.id };
}
