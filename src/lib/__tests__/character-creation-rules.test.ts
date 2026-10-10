import { describe, it, expect } from "vitest";
import {
  inspectCharacterCreation,
  creationSteps,
  creationParanormalPowers,
  creationInventory,
} from "../character-creation-rules";
import { calculateDerivedStats } from "../character-data";
import {
  getMaxAttributeByNex,
  rebuildCharacterSheet,
} from "../character-builder-engine";
import type { CharacterFormData } from "@/pages/CharacterCreate";
import { characterCreationPayload } from "@/services/character-creation-service";

import { validCreation } from "@/test/fixtures/characterCreation";
import { ALL_RITUALS } from "@/lib/rituals/legacy-exports";
describe("Contrato de criação Base", () => {
  it.each(["Combatente", "Especialista"])(
    "aceita uma criação completa de %s em NEX 5",
    (id) =>
      expect(inspectCharacterCreation(validCreation(id)).issues).toEqual([]),
  );
  it("bloqueia Perito ausente e não grava uma ficha aparentemente pronta", () => {
    const form = { ...validCreation("Especialista"), classPowerChoices: {} };
    expect(inspectCharacterCreation(form).issues).toContainEqual(
      expect.objectContaining({ step: "abilities" }),
    );
    expect(() => characterCreationPayload(form, null)).toThrow("Perito");
  });
  it("preserva perícias do Amnésico e exige duas escolhas", () => {
    const form = {
      ...validCreation(),
      origin: "amnesico",
      originSkills: ["ciencias", "investigacao"],
    };
    expect(rebuildCharacterSheet(form).originSkills).toEqual([
      "ciencias",
      "investigacao",
    ]);
    expect(
      inspectCharacterCreation({ ...form, originSkills: [] }).issues.some(
        (i) => i.step === "origin",
      ),
    ).toBe(true);
  });
  it("não permite atributo 5 em 40/45 e aceita teto 5 a partir de 50", () => {
    expect([40, 45, 50].map(getMaxAttributeByNex)).toEqual([4, 4, 5]);
  });
  it("Universitário ganha PE inicial e somente nos marcos ímpares posteriores", () => {
    expect(
      [5, 10, 15, 20, 25, 99].map(
        (n) =>
          calculateDerivedStats("Combatente", 1, 1, n, "universitario").pe -
          calculateDerivedStats("Combatente", 1, 1, n).pe,
      ),
    ).toEqual([1, 1, 2, 2, 3, 10]);
  });
  it("Casca Grossa vem da trilha e Atleta não aumenta deslocamento", () => {
    const form = {
      ...validCreation(),
      origin: "atleta",
      nex: 10,
      classTrack: "tropa-choque",
    };
    expect(rebuildCharacterSheet(form).derivedStats.hp).toBe(28);
    expect(rebuildCharacterSheet(form).movement).toBe(9);
  });
  it("leva poderes paranormais completos, escolhas e patente para a gravação", () => {
    const form = {
      ...validCreation(),
      nex: 15,
      classTrack: "guerreiro",
      origin: "cultista-arrependido",
      originParanormalPower: "resistir-a-elemento",
      originParanormalChoices: { resistElement: "morte" },
      freeSkills: ["ciencias", "atletismo", "percepcao"],
      abilities: ["transcender-comb"],
      transcenderChoices: {
        "transcender-comb-0": {
          powerId: "sangue-de-ferro",
          powerName: "Sangue de Ferro",
          powerElement: "sangue",
        },
      },
    };
    const powers = creationParanormalPowers(form);
    expect(powers.map((p) => p.id)).toEqual([
      "resistir-a-elemento",
      "sangue-de-ferro",
    ]);
    expect(powers[0].choices?.resistElement).toBe("morte");
    expect(powers.every((p) => p.name && p.description)).toBe(true);
  });
  it("usa a mesma ordem de etapas em revisão e navegação", () => {
    expect(creationSteps("Ocultista").map((s) => s.id)).toEqual([
      "concept",
      "nex",
      "patent",
      "attributes",
      "origin",
      "class",
      "track",
      "rituals",
      "skills",
      "abilities",
      "review",
    ]);
  });
  it("bloqueia origens fora do Base, NEX contínuo e poderes de outra classe", () => {
    expect(
      inspectCharacterCreation({
        ...validCreation(),
        origin: "inexistente",
        nex: 6,
        abilities: ["hacker"],
      }).issues.map((i) => i.step),
    ).toEqual(expect.arrayContaining(["origin", "nex", "abilities"]));
  });
  it("mantém a foto referenciada e as subescolhas na projeção", () => {
    const payload = characterCreationPayload(
      validCreation("Especialista"),
      "https://example.com/avatar.png",
    );
    expect(payload.photo_url).toBe("https://example.com/avatar.png");
    expect(payload.class_power_choices["perito-0"].chosenValues).toEqual([
      "medicina",
      "tecnologia",
    ]);
    expect(payload.patent).toBe("Recruta");
  });
  it("materializa somente o equipamento escolhido com a fonte da redução", () => {
    const form = {
      ...validCreation(),
      origin: "engenheiro",
      creationItemChoices: { "ferramenta-favorita": "kit_pericia" },
    };
    const items = creationInventory(form);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      catalogId: "kit_pericia",
      favoriteAbilityId: "ferramenta-favorita",
      quantity: 1,
    });
  });
  it("a revisão inclui o bônus paranormal sem duplicá-lo no máximo base salvo", () => {
    const f = {
      ...validCreation(),
      nex: 15,
      classTrack: "guerreiro",
      abilities: ["transcender-comb"],
      transcenderChoices: {
        "transcender-comb-0": {
          powerId: "sangue-de-ferro",
          powerName: "Sangue de Ferro",
          powerElement: "sangue",
        },
      },
    };
    const checked = inspectCharacterCreation(f);
    expect(checked.issues).toEqual([]);
    expect(checked.displayStats.hp).toBe(checked.build.derivedStats.hp + 6);
    expect(characterCreationPayload(f, null).hp_max).toBe(
      checked.build.derivedStats.hp,
    );
  });
  it("um treinamento futuro não pode liberar um grau anterior", () => {
    const f = {
      ...validCreation(),
      nex: 45,
      classTrack: "guerreiro",
      attributes: { ...validCreation().attributes, vigor: 2 },
      abilities: [
        "golpe-pesado",
        "artista-marcial",
        "treinamento-pericia-comb",
      ],
      trainingAdvances: {
        35: ["adestramento", "luta", "fortitude", "ciencias"],
      },
      skillTrainingChoices: {
        "treinamento-pericia-comb-0": [
          { skillId: "adestramento", fromLevel: 0, toLevel: 1 },
          { skillId: "crime", fromLevel: 0, toLevel: 1 },
        ],
      },
    };
    expect(
      inspectCharacterCreation(f).issues.some((i) =>
        i.message.includes("NEX 35%"),
      ),
    ).toBe(true);
  });
  it("bloqueia ritual adicional do Graduado já aprendido na classe", () => {
    const f = validCreation("Ocultista");
    f.nex = 10;
    f.classTrack = "graduado";
    f.rituals = ALL_RITUALS.filter(ritual => ritual.circle === 1).slice(0, 4).map(ritual => ritual.id);
    f.extraRituals = { "saber-1": [f.rituals[0]] };
    expect(inspectCharacterCreation(f).issues).toContainEqual(
      expect.objectContaining({
        step: "rituals",
        message: expect.stringContaining("diferentes dos já aprendidos"),
      }),
    );
  });
});
