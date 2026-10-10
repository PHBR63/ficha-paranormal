import type { CharacterFormData } from "@/pages/CharacterCreate";
import {
  rebuildCharacterSheet,
  buildStateToFormData,
  validateAttributes,
} from "./character-builder-engine";
import {
  CORE_ORIGINS,
  SKILLS,
  getTrackById,
  getAbilityChoicesByNex,
  getOcultistRituals,
  PATENTS,
} from "./character-data";
import { getPowerById as getClassPower } from "./class-powers/power-registry";
import { checkPowerPrerequisites } from "./class-abilities-prerequisites";
import {
  getPowerById,
  canChoosePower,
  calculatePowerModifiers,
  type SavedParanormalPower,
  type ParanormalElement,
} from "./paranormal-powers";
import { ALL_RITUALS } from "./rituals/legacy-exports";
import {
  ALL_TRANSCENDER_IDS,
  ALL_SKILL_TRAINING_IDS,
} from "./constants/game-ids";
import { isBaseClassPower } from "./rules/base-class-catalog";
import { ALL_ITEMS } from "./catalogs/items-catalog";
import { BASE_CREATION_WEAPONS as ALL_WEAPONS } from "./rules/base-creation-equipment";
import { CATEGORY_REDUCTION_ABILITIES } from "./category-reduction";
import { PATENT_LIMITS } from "./inventory-system";
import { getMaxAttributeByNex } from "./character-builder-engine";

export interface CreationIssue {
  step: string;
  message: string;
}
export interface RitualSlot {
  source: string;
  label: string;
  count: number;
  maxCircle: number;
  ritualName?: string;
}
export const CREATION_STEPS = [
  { id: "concept", title: "CONCEITO" },
  { id: "nex", title: "NEX" },
  { id: "patent", title: "PATENTE" },
  { id: "attributes", title: "ATRIBUTOS" },
  { id: "origin", title: "ORIGEM" },
  { id: "class", title: "CLASSE" },
  { id: "track", title: "TRILHA" },
  { id: "skills", title: "PERÍCIAS" },
  { id: "abilities", title: "HABILIDADES" },
  { id: "review", title: "REVISÃO" },
];
export const creationSteps = (classId: string) => {
  const steps = [...CREATION_STEPS];
  if (classId === "Ocultista")
    steps.splice(7, 0, { id: "rituals", title: "RITUAIS" });
  return steps;
};
const validSkill = (id: string) => SKILLS.some((s) => s.id === id);
const distinct = (ids: string[]) => [...new Set(ids)];
export function creationPowerMilestones(form: CharacterFormData): number[] {
  return [
    15,
    30,
    45,
    ...(form.versatilityChoice?.type === "class_power" ? [50] : []),
    60,
    75,
    90,
  ].filter((nex) => nex <= form.nex);
}

/** Define aquisições extras por fonte; o grimório não consome os slots comuns. */
export function creationRitualSlots(form: CharacterFormData): RitualSlot[] {
  if (form.characterClass !== "Ocultista") return [];
  const slots: RitualSlot[] = [];
  const circle = getOcultistRituals(form.nex).maxCircle;
  if (form.classTrack === "lamina-paranormal" && form.nex >= 10)
    slots.push({
      source: "lamina",
      label: "Lâmina Paranormal — Amaldiçoar Arma",
      count: 1,
      maxCircle: 1,
      ritualName: "Amaldiçoar Arma",
    });
  if (form.classTrack === "graduado" && form.nex >= 10) {
    for (let c = 1; c <= circle; c++)
      slots.push({
        source: `saber-${c}`,
        label: `Saber Ampliado — ${c}º círculo`,
        count: 1,
        maxCircle: c,
      });
    if (form.nex >= 40) {
      slots.push({
        source: "grimorio-inicial",
        label: "Grimório — 1º ou 2º círculo",
        count: form.attributes.intellect,
        maxCircle: 2,
      });
      for (let c = 3; c <= circle; c++)
        slots.push({
          source: `grimorio-${c}`,
          label: `Grimório — ${c}º círculo`,
          count: 1,
          maxCircle: c,
        });
    }
  }
  return slots;
}

/** Treinamentos de classe e do poder são aquisições distintas, conservadas no payload. */
export function creationSkillLevels(
  form: CharacterFormData,
  beforeNex?: number,
): Record<string, number> {
  return creationTrainingProgress(form, beforeNex).levels;
}

/** Resolve aquisições em ordem de NEX: um poder futuro não libera um grau anterior. */
function creationTrainingProgress(form: CharacterFormData, beforeNex?: number) {
  const levels = buildStateToFormData(form);
  const errors: string[] = [];
  const milestones = creationPowerMilestones(form);
  const counts: Record<string, number> = {};
  const events = form.abilities.flatMap((id, position) => {
    const index = counts[id] || 0;
    counts[id] = index + 1;
    return ALL_SKILL_TRAINING_IDS.includes(id as never) && milestones[position]
      ? [{ nex: milestones[position], key: `${id}-${index}` }]
      : [];
  });
  for (const nex of [35, 70])
    if (form.nex >= nex) events.push({ nex, key: `grade-${nex}` });
  for (const event of events.sort((a, b) => a.nex - b.nex)) {
    if (beforeNex !== undefined && event.nex >= beforeNex) continue;
    if (event.key.startsWith("grade-")) {
      const selected = form.trainingAdvances?.[event.nex] || [];
      const count =
        (form.characterClass === "Especialista"
          ? 5
          : form.characterClass === "Ocultista"
            ? 3
            : 2) + form.attributes.intellect;
      const from = event.nex === 35 ? 1 : 2;
      if (
        distinct(selected).length !== count ||
        selected.some((id) => (levels[id] || 0) < from)
      )
        errors.push(
          `NEX ${event.nex}%: escolha ${count} aumentos de grau em perícias ${from === 1 ? "treinadas" : "veteranas"}.`,
        );
      for (const id of selected)
        if (validSkill(id) && (levels[id] || 0) >= from)
          levels[id] = Math.max(levels[id], from + 1);
    } else {
      const choices = form.skillTrainingChoices[event.key] || [];
      const cap = event.nex >= 70 ? 3 : event.nex >= 35 ? 2 : 1;
      if (
        choices.length !== 2 ||
        distinct(choices.map((c) => c.skillId)).length !== 2 ||
        choices.some(
          (c) =>
            !validSkill(c.skillId) ||
            c.fromLevel !== (levels[c.skillId] || 0) ||
            c.toLevel !== c.fromLevel + 1 ||
            c.toLevel > cap,
        )
      )
        errors.push(
          `Treinamento em Perícia em NEX ${event.nex}%: defina dois avanços válidos a partir do grau atual.`,
        );
      for (const choice of choices)
        if (validSkill(choice.skillId))
          levels[choice.skillId] = Math.max(
            levels[choice.skillId] || 0,
            Math.min(cap, choice.toLevel),
          );
    }
  }
  return { levels, errors };
}

/** Materializa poderes completos e suas escolhas, usando o catálogo em vez do nome informado. */
export function creationParanormalPowers(
  form: CharacterFormData,
): SavedParanormalPower[] {
  const choices = [] as Array<{
    powerId: string;
    subchoices?: CharacterFormData["originParanormalChoices"];
  }>;
  if (form.origin === "cultista-arrependido" && form.originParanormalPower)
    choices.push({
      powerId: form.originParanormalPower,
      subchoices: form.originParanormalChoices,
    });
  const counts: Record<string, number> = {};
  for (const id of form.abilities || []) {
    const index = counts[id] || 0;
    counts[id] = index + 1;
    if (!ALL_TRANSCENDER_IDS.includes(id as never)) continue;
    const selected = form.transcenderChoices[`${id}-${index}`];
    if (selected) choices.push(selected);
  }
  return choices.flatMap((choice) => {
    const power = getPowerById(choice.powerId);
    if (!power) return [];
    const element =
      power.id === "aprender-ritual"
        ? ALL_RITUALS.find((r) => r.id === choice.subchoices?.ritualId)?.element
        : power.id === "resistir-a-elemento"
          ? choice.subchoices?.resistElement
          : power.element;
    return [
      {
        id: power.id,
        name: power.name,
        element: (element || power.element) as SavedParanormalPower["element"],
        description: power.description,
        choices: choice.subchoices
          ? {
              ...choice.subchoices,
              resistElement: choice.subchoices.resistElement as
                | ParanormalElement
                | undefined,
            }
          : undefined,
      },
    ];
  });
}

/** Reúne rituais normais e extras sem perder sua proveniência no formulário. */
export function creationRituals(form: CharacterFormData): string[] {
  const ids = [
    ...(form.characterClass === "Ocultista" ? form.rituals : []),
    ...creationRitualSlots(form).flatMap(
      (slot) => form.extraRituals?.[slot.source] || [],
    ),
  ];
  for (const power of creationParanormalPowers(form))
    if (power.choices?.ritualId) ids.push(power.choices.ritualId);
  if (form.characterClass === "Ocultista" && form.nex === 99) {
    const names: Record<string, string> = {
      conduite: "Canalizar o Medo",
      flagelador: "Medo Tangível",
      graduado: "Conhecendo o Medo",
      intuitivo: "Presença do Medo",
      "lamina-paranormal": "Lâmina do Medo",
    };
    const ritual = ALL_RITUALS.find((r) => r.name === names[form.classTrack]);
    if (ritual) ids.push(ritual.id);
  }
  return distinct(ids);
}

/** Contrato único de criação; devolve pendências com a etapa de correção. */
export function inspectCharacterCreation(form: CharacterFormData) {
  const build = rebuildCharacterSheet(form);
  const skills = creationSkillLevels(form);
  const issues: CreationIssue[] = [];
  const add = (step: string, message: string) => issues.push({ step, message });
  if (form.name.trim().length < 2 || form.name.length > 100)
    add("concept", "Informe um nome com 2 a 100 caracteres.");
  const attrs = validateAttributes(form.attributes, form.nex);
  if (!attrs.valid)
    add(
      "attributes",
      attrs.errors.join(" ") || "Complete a distribuição dos atributos.",
    );
  if (
    form.age !== null &&
    (!Number.isInteger(form.age) || form.age < 1 || form.age > 999)
  )
    add(
      "concept",
      "Informe uma idade inteira entre 1 e 999 anos ou deixe o campo vazio.",
    );
  if (
    !(
      form.nex === 99 ||
      (form.nex >= 5 && form.nex <= 95 && form.nex % 5 === 0)
    )
  )
    add("nex", "Escolha um NEX válido do Livro Base.");
  if (!PATENTS.some((p) => p.name === form.patent))
    add("patent", "Escolha uma patente válida.");
  if (!CORE_ORIGINS.some((o) => o.id === form.origin))
    add("origin", "Escolha uma origem do Livro Base.");
  if (
    form.origin === "amnesico" &&
    (distinct(form.originSkills).length !== 2 ||
      form.originSkills.some((id) => !validSkill(id)))
  )
    add("origin", "Defina as duas perícias do Amnésico com o mestre.");
  if (
    form.origin === "cultista-arrependido" &&
    !getPowerById(form.originParanormalPower || "")
  )
    add("origin", "Escolha o poder paranormal da origem.");
  const originPower = getPowerById(form.originParanormalPower || "");
  if (
    form.origin === "cultista-arrependido" &&
    originPower &&
    (!canChoosePower(originPower, []) ||
      (originPower.requiresChoice === "ritual" &&
        !ALL_RITUALS.some(
          (r) =>
            r.id === form.originParanormalChoices?.ritualId && r.circle === 1,
        )) ||
      (originPower.requiresChoice === "element_resistance" &&
        !["sangue", "morte", "conhecimento", "energia"].includes(
          form.originParanormalChoices?.resistElement || "",
        )))
  )
    add(
      "origin",
      "Complete uma escolha válida para o poder paranormal da origem.",
    );
  if (
    !["Combatente", "Especialista", "Ocultista"].includes(form.characterClass)
  )
    add("class", "Escolha uma classe do Livro Base.");
  const track = getTrackById(form.classTrack);
  if (form.nex >= 10 && (!track || track.classId !== form.characterClass))
    add("track", "Escolha uma trilha da sua classe.");
  for (const error of build.validationErrors || [])
    if (!issues.some((i) => i.message === error)) add("skills", error);
  const expectedTrained =
    (form.characterClass === "Especialista"
      ? 9
      : form.characterClass === "Combatente"
        ? 5
        : 7) + form.attributes.intellect;
  if (build.allTrainedSkills.length !== expectedTrained)
    add(
      "skills",
      `Os treinamentos iniciais precisam resultar em ${expectedTrained} perícias distintas, com as substituições por repetição.`,
    );
  for (const choice of build.pendingChoices)
    add("skills", `Complete: ${choice.label}.`);
  for (const id of build.pendingConflicts)
    add("skills", `Resolva o treinamento repetido: ${id}.`);
  for (const error of creationTrainingProgress(form).errors)
    add("skills", error);
  const perito =
    Object.values(form.classPowerChoices).find((c) => c.powerId === "perito")
      ?.chosenValues || [];
  if (
    form.characterClass === "Especialista" &&
    (distinct(perito).length !== 2 ||
      perito.some(
        (id) =>
          !build.allTrainedSkills.includes(id) ||
          ["luta", "pontaria"].includes(id),
      ))
  )
    add(
      "abilities",
      "Perito: escolha duas perícias treinadas, exceto Luta e Pontaria.",
    );
  const expected =
    getAbilityChoicesByNex(form.nex) +
    (form.nex >= 50 && form.versatilityChoice?.type === "class_power" ? 1 : 0);
  if (form.abilities.length !== expected)
    add(
      "abilities",
      `Escolha ${expected} poderes de classe para esse NEX e Versatilidade.`,
    );
  if (form.nex >= 50 && !form.versatilityChoice)
    add("abilities", "Defina Versatilidade em NEX 50%.");
  if (form.versatilityChoice?.type === "track_ability") {
    const second = getTrackById(form.versatilityChoice.trackId || "");
    if (
      form.nex < 50 ||
      !second ||
      second.classId !== form.characterClass ||
      second.id === form.classTrack ||
      second.abilities[0]?.id !== form.versatilityChoice.abilityId
    )
      add(
        "abilities",
        "Versatilidade: escolha o primeiro poder de outra trilha da sua classe.",
      );
  }
  const occurrences: Record<string, number> = {};
  const acquired: string[] = [];
  const grantedClassPowers = new Set<string>();
  const paranormal = creationParanormalPowers(form);
  if (form.origin === "cultista-arrependido" && form.originParanormalPower)
    acquired.push(form.originParanormalPower);
  const milestones = creationPowerMilestones(form);
  if (
    form.abilities.some(
      (id, index) =>
        ALL_TRANSCENDER_IDS.includes(id as never) && milestones[index] >= 50,
    ) &&
    !["sangue", "morte", "conhecimento", "energia"].includes(
      form.elementalAffinity || "",
    )
  )
    add(
      "abilities",
      "Ao Transcender a partir de NEX 50%, escolha o elemento de afinidade.",
    );
  for (const [position, id] of form.abilities.entries()) {
    const acquisition = milestones[position] || form.nex;
    const index = occurrences[id] || 0;
    occurrences[id] = index + 1;
    const power = getClassPower(id);
    if (
      !power ||
      power.isCore ||
      !isBaseClassPower(power.classId, power.name) ||
      power.classId !== form.characterClass ||
      power.minNex > form.nex ||
      (occurrences[id] > 1 && !power.isRepeatable)
    ) {
      add(
        "abilities",
        "Há um poder incompatível com a classe, NEX ou repetição.",
      );
      continue;
    }
    const prerequisite = checkPowerPrerequisites(id, {
      nex: acquisition,
      attributes: Object.fromEntries(
        Object.entries(form.attributes).map(([key, value]) => [
          key,
          Math.min(value, getMaxAttributeByNex(acquisition)),
        ]),
      ) as typeof form.attributes,
      trainedSkills: build.allTrainedSkills,
      skillLevels: creationSkillLevels({ ...form, nex: acquisition }),
      powers: form.abilities.slice(0, position),
      proficiencies: build.proficiencies,
    });
    if (power.minNex > acquisition)
      add(
        "abilities",
        `${power.name} não pode ser adquirido em NEX ${acquisition}%. Remova e selecione os poderes na ordem de aquisição.`,
      );
    if (!prerequisite.meets)
      add("abilities", `${power.name}: ${prerequisite.missing.join("; ")}.`);
    if (ALL_TRANSCENDER_IDS.includes(id as never)) {
      const choice = form.transcenderChoices[`${id}-${index}`];
      const selected = getPowerById(choice?.powerId || "");
      const prerequisiteCount = selected?.prerequisite?.count || 0;
      const elementCount = paranormal
        .slice(0, acquired.length)
        .filter((p) => p.element === selected?.prerequisite?.element).length;
      const repeats = acquired.filter((p) => p === selected?.id).length;
      if (
        !selected ||
        elementCount < prerequisiteCount ||
        (repeats > 0 &&
          selected.element !== "generic" &&
          !(
            repeats === 1 &&
            acquisition >= 50 &&
            form.elementalAffinity === selected.element
          ))
      ) {
        add(
          "abilities",
          "Transcender: escolha um poder paranormal que cumpra os requisitos na aquisição.",
        );
        continue;
      }
      acquired.push(selected.id);
      if (
        selected.requiresChoice === "element_resistance" &&
        !["sangue", "morte", "conhecimento", "energia"].includes(
          choice.subchoices?.resistElement || "",
        )
      )
        add("abilities", `${selected.name}: escolha o elemento.`);
      if (
        selected.requiresChoice === "ritual" &&
        !ALL_RITUALS.some(
          (r) =>
            r.id === choice.subchoices?.ritualId &&
            r.circle <= (acquisition >= 75 ? 3 : acquisition >= 45 ? 2 : 1),
        )
      )
        add(
          "abilities",
          `Aprender Ritual: escolha um ritual de círculo permitido em NEX ${acquisition}%.`,
        );
      if (selected.id === "expansao-de-conhecimento") {
        const foreign = getClassPower(
          choice.subchoices?.classPowerIds?.[0] || "",
        );
        if (
          !foreign ||
          foreign.isCore ||
          foreign.classId === form.characterClass ||
          isBaseClassPower(form.characterClass, foreign.name) ||
          !isBaseClassPower(foreign.classId, foreign.name)
        )
          add(
            "abilities",
            "Expansão de Conhecimento: escolha um poder exclusivo de outra classe do Base.",
          );
        else {
          if (grantedClassPowers.has(foreign.id) && !foreign.isRepeatable)
            add("abilities", `${foreign.name}: o poder concedido não permite repetição.`);
          grantedClassPowers.add(foreign.id);
          if (
            foreign.minNex > acquisition ||
            !checkPowerPrerequisites(foreign.id, {
              nex: acquisition,
              attributes: Object.fromEntries(
                Object.entries(form.attributes).map(([key, value]) => [
                  key,
                  Math.min(value, getMaxAttributeByNex(acquisition)),
                ]),
              ) as typeof form.attributes,
              trainedSkills: build.allTrainedSkills,
              skillLevels: creationSkillLevels(form, acquisition),
              powers: form.abilities.slice(0, position),
              proficiencies: build.proficiencies,
            }).meets
          )
            add(
              "abilities",
              "Expansão de Conhecimento: o poder escolhido não cumpre os pré-requisitos na aquisição.",
            );
          if (foreign.effects.base.requiresChoice) {
            const config = foreign.effects.base.requiresChoice;
            const values =
              Object.values(form.classPowerChoices).find(
                (c) => c.powerId === foreign.id,
              )?.chosenValues || [];
            if (
              values.length !== (config.count || 1) ||
              (config.options &&
                values.some((v) => !config.options!.includes(v)))
            )
              add(
                "abilities",
                `${foreign.name}: complete a subescolha do poder concedido.`,
              );
            if (
              config.type === "item" &&
              values.some((id) => !ALL_ITEMS.some((item) => item.id === id))
            )
              add("abilities", `${foreign.name}: escolha um item do catálogo.`);
            if (
              config.type === "ritual" &&
              values.some((id) => !creationRituals(form).includes(id))
            )
              add("abilities", `${foreign.name}: escolha um ritual conhecido.`);
          }
        }
      }
    } else if (ALL_SKILL_TRAINING_IDS.includes(id as never)) {
      const choices = form.skillTrainingChoices[`${id}-${index}`] || [];
      if (
        choices.length !== 2 ||
        distinct(choices.map((c) => c.skillId)).length !== 2 ||
        choices.some(
          (c) =>
            !validSkill(c.skillId) ||
            c.toLevel !== c.fromLevel + 1 ||
            c.toLevel > (form.nex >= 70 ? 3 : form.nex >= 35 ? 2 : 1),
        )
      )
        add(
          "abilities",
          "Treinamento em Perícia: defina dois avanços válidos.",
        );
    } else if (power.effects.base.requiresChoice) {
      const selected =
        Object.values(form.classPowerChoices).find(
          (c) => c.powerId === id && (c.instanceIndex || 0) === index,
        )?.chosenValues || [];
      const config = power.effects.base.requiresChoice;
      if (
        distinct(selected).length !== (config.count || 1) ||
        (config.options && selected.some((v) => !config.options?.includes(v)))
      )
        add("abilities", `${power.name}: complete a escolha adicional.`);
      if (id === "mestre-em-elemento") {
        const earlier =
          Object.values(form.classPowerChoices).find(
            (c) => c.powerId === "especialista-em-elemento",
          )?.chosenValues || [];
        if (selected.some((e) => !earlier.includes(e)))
          add(
            "abilities",
            "Mestre em Elemento exige Especialista no mesmo elemento.",
          );
      }
      if (
        id === "ritual-predileto" &&
        selected.some((r) => !creationRituals(form).includes(r))
      )
        add("abilities", "Ritual Predileto deve ser um ritual conhecido.");
      if (
        config.type === "item" &&
        selected.some((id) => !ALL_ITEMS.some((item) => item.id === id))
      )
        add("abilities", `${power.name}: escolha um item do catálogo.`);
    }
  }
  if (form.characterClass === "Ocultista") {
    const info = getOcultistRituals(form.nex);
    if (distinct(form.rituals).length !== info.count)
      add("rituals", `Escolha ${info.count} rituais da classe.`);
    // Emparelha os círculos mais baixos com as primeiras aquisições; não exige ordem de clique.
    const circles = form.rituals
      .map((id) => ALL_RITUALS.find((r) => r.id === id)?.circle || 99)
      .sort((a, b) => a - b);
    const levels = [
      5,
      5,
      5,
      ...Array.from({ length: Math.max(0, info.count - 3) }, (_, i) =>
        Math.min(99, (i + 2) * 5),
      ),
    ];
    if (
      circles.some(
        (circle, index) =>
          circle > getOcultistRituals(levels[index] || 5).maxCircle,
      )
    )
      add(
        "rituals",
        "Os círculos escolhidos não podem ser alcançados pela progressão do Ocultista.",
      );
    for (const slot of creationRitualSlots(form)) {
      const ids = form.extraRituals?.[slot.source] || [];
      if (
        distinct(ids).length !== slot.count ||
        ids.some((id) => {
          const r = ALL_RITUALS.find((r) => r.id === id);
          return (
            !r ||
            (slot.ritualName && r.name !== slot.ritualName) ||
            r.circle > slot.maxCircle ||
            (!slot.source.startsWith("grimorio-inicial") &&
              r.circle !== slot.maxCircle)
          );
        })
      )
        add("rituals", `Complete ${slot.label}: ${slot.count} ritual(is).`);
    }
    if (form.classTrack === "graduado") {
      const learned = [
        ...form.rituals,
        ...creationRitualSlots(form).flatMap(slot => form.extraRituals?.[slot.source] || []),
        ...paranormal.flatMap(power => power.choices?.ritualId ? [power.choices.ritualId] : []),
      ];
      if (distinct(learned).length !== learned.length)
        add("rituals", "Os rituais de Saber Ampliado e do Grimório precisam ser diferentes dos já aprendidos.");
    }
  }
  if (
    paranormal.filter((p) => p.id === "aprender-ritual").length >
    form.attributes.intellect
  )
    add(
      "abilities",
      "Aprender Ritual está limitado a um número de rituais igual ao Intelecto, separado dos rituais de classe.",
    );
  for (const source of creationEquipmentSources(form)) {
    const selected =
      form.creationItemChoices?.[source.id] ||
      (source.id === "mochila-utilidades"
        ? Object.values(form.classPowerChoices).find(
            (c) => c.powerId === source.id,
          )?.chosenValues[0]
        : "");
    const catalog = source.weapon ? ALL_WEAPONS : ALL_ITEMS;
    if (
      !catalog.some(
        (item) =>
          item.id === selected &&
          item.category !== "especial" &&
          (source.id !== "ferramenta-de-trabalho" ||
            ("proficiency" in item &&
              ["simples", "tatica"].includes(item.proficiency))),
      )
    )
      add(
        source.id === "ferramenta-favorita" ? "origin" : "abilities",
        `${source.name}: escolha o equipamento beneficiado.`,
      );
  }
  const inventory = creationInventory(form);
  const limits = PATENT_LIMITS[form.patent];
  for (const category of ["I", "II", "III", "IV"] as const) {
    const amount = inventory.filter(
      (item) => item.effectiveCategory === category,
    ).length;
    if (limits && amount > limits[category])
      add(
        "patent",
        `A patente permite ${limits[category]} item(ns) de categoria ${category}; os equipamentos escolhidos totalizam ${amount}.`,
      );
  }
  const foreignAbilities = paranormal
    .flatMap((p) => p.choices?.classPowerIds || [])
    .flatMap((id) => getClassPower(id)?.name || []);
  const secondary =
    form.versatilityChoice?.type === "track_ability"
      ? getTrackById(form.versatilityChoice.trackId || "")?.abilities[0]?.name
      : null;
  const derivedStats =
    secondary === "Casca Grossa" && !build.abilities.includes("Casca Grossa")
      ? {
          ...build.derivedStats,
          hp:
            build.derivedStats.hp +
            (form.nex === 99 ? 20 : Math.floor(form.nex / 5)),
        }
      : build.derivedStats;
  const proficiencies = [...build.proficiencies];
  for (const id of [
    ...form.abilities,
    ...paranormal.flatMap((p) => p.choices?.classPowerIds || []),
  ]) {
    const granted = getClassPower(id)?.effects.base.proficiencies;
    if (granted?.weapons?.includes("heavy"))
      proficiencies.push("Armas pesadas");
    if (granted?.weapons?.includes("tactical"))
      proficiencies.push("Armas táticas");
    if (granted?.weapons?.includes("tactical-ranged-nonfirearm"))
      proficiencies.push("Armas táticas de disparo");
    if (granted?.protections?.includes("heavy"))
      proficiencies.push("Proteções pesadas");
  }
  if (form.origin === "operario") {
    const weapon = ALL_WEAPONS.find(
      (w) => w.id === form.creationItemChoices?.["ferramenta-de-trabalho"],
    );
    if (weapon) proficiencies.push(`Arma: ${weapon.name}`);
  }
  const affinityActive =
    !!form.elementalAffinity &&
    form.abilities.some(
      (id, index) =>
        ALL_TRANSCENDER_IDS.includes(id as never) && milestones[index] >= 50,
    );
  const modifiers = calculatePowerModifiers(
    paranormal.map((p) => p.id),
    form.nex,
    affinityActive,
    form.elementalAffinity as ParanormalElement,
  );
  const displayStats = {
    ...derivedStats,
    hp: derivedStats.hp + (modifiers.pv_bonus || 0),
    pe: derivedStats.pe + (modifiers.pe_bonus || 0),
  };
  return {
    issues,
    build: {
      ...build,
      derivedStats,
      abilities: [
        ...build.abilities,
        ...foreignAbilities,
        ...(secondary ? [secondary] : []),
      ],
      proficiencies: distinct(proficiencies),
      canFinalize: issues.length === 0,
    },
    displayStats,
    displayDefense:
      build.defense +
      (modifiers.defense || 0) +
      (form.origin === "policial" ? 2 : 0),
    skills,
    paranormalPowers: paranormal,
    rituals: creationRituals(form),
  };
}

export function creationEquipmentSources(form: CharacterFormData) {
  return [
    ...(form.origin === "engenheiro"
      ? [
          {
            id: "ferramenta-favorita",
            name: "Ferramenta Favorita",
            weapon: false,
          },
        ]
      : []),
    ...(form.origin === "operario"
      ? [
          {
            id: "ferramenta-de-trabalho",
            name: "Ferramenta de Trabalho (aval do mestre)",
            weapon: true,
          },
        ]
      : []),
    ...(form.classTrack === "aniquilador" && form.nex >= 10
      ? [{ id: "a-favorita", name: "A Favorita", weapon: true }]
      : []),
    ...(form.abilities.includes("mochila-utilidades") ||
    creationParanormalPowers(form).some((p) =>
      p.choices?.classPowerIds?.includes("mochila-utilidades"),
    )
      ? [
          {
            id: "mochila-utilidades",
            name: "Mochila de Utilidades",
            weapon: false,
          },
        ]
      : []),
  ];
}

/** Materializa os itens escolhidos com o formato já consumido pelo inventário. */
export function creationInventory(form: CharacterFormData) {
  const items = creationEquipmentSources(form).flatMap((source) => {
    const id =
      form.creationItemChoices?.[source.id] ||
      Object.values(form.classPowerChoices).find((c) => c.powerId === source.id)
        ?.chosenValues[0];
    const item = (source.weapon ? ALL_WEAPONS : ALL_ITEMS).find(
      (item) => item.id === id,
    );
    if (!item) return [];
    const abilityId =
      source.id === "a-favorita"
        ? form.nex === 99
          ? "maquina-de-matar"
          : form.nex >= 40
            ? "tecnica-secreta"
            : "a-favorita"
        : source.id;
    const config = CATEGORY_REDUCTION_ABILITIES.find(
      (a) => a.abilityId === abilityId,
    );
    const order = ["0", "I", "II", "III", "IV"];
    const reduction = config?.reductionAmount || 0;
    return [
      {
        ...item,
        id: `${form.creationOperationId}:${source.id}`,
        catalogId: item.id,
        itemType: source.weapon ? "weapon" : "item",
        weaponType: source.weapon && "type" in item ? item.type : undefined,
        slots: typeof item.spaces === "number" ? item.spaces : 0,
        quantity: 1,
        favoriteAbilityId:
          config || source.id === "ferramenta-de-trabalho"
            ? abilityId
            : undefined,
        creationSource: source.id,
        spaceReduction: config?.spaceReduction || 0,
        effectiveCategory:
          order[Math.max(0, order.indexOf(item.category) - reduction)],
      },
    ];
  });
  if (form.classTrack === "graduado" && form.nex >= 40)
    items.push({
      id: `${form.creationOperationId}:grimorio`,
      name: "Grimório",
      category: "0",
      effectiveCategory: "0",
      slots: 1,
      quantity: 1,
      itemType: "item",
      creationSource: "grimorio",
      spaceReduction: 0,
    } as (typeof items)[number]);
  return items;
}
