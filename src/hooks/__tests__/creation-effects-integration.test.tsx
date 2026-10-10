import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBonusSummaryFromSUE } from "../useBonusSummaryFromSUE";
import { characterPowerInput } from "@/lib/effects/character-power-input";

const base = {
  origin: "academico",
  classId: "Combatente",
  abilities: [] as string[],
  nex: 50,
  intellect: 2,
};
describe("Escolhas da criação chegam aos efeitos da ficha", () => {
  it("Patrulha soma Defesa uma única vez", () => {
    const { result } = renderHook(() =>
      useBonusSummaryFromSUE({ ...base, origin: "policial" }),
    );
    expect(result.current.defense.total).toBe(2);
  });
  it("Precognição e Sensitivo chegam a resistências e perícias sem duplicar Defesa", () => {
    const { result } = renderHook(() =>
      useBonusSummaryFromSUE({
        ...base,
        paranormalPowers: [
          {
            id: "precognicao",
            name: "Precognição",
            element: "conhecimento",
            description: "Teste",
          },
          {
            id: "sensitivo",
            name: "Sensitivo",
            element: "conhecimento",
            description: "Teste",
          },
        ],
      }),
    );
    expect(result.current.defense.total).toBe(2);
    expect(result.current.resistances.vontade.total).toBe(2);
    expect(result.current.skills.diplomacia.total).toBe(5);
  });
  it("o poder de classe concedido funciona com a classe original preservada", () => {
    const powers = characterPowerInput(["Ritual Potente"], "Combatente", 50);
    expect(powers[0].classId).toBe("Ocultista");
    const { result } = renderHook(() =>
      useBonusSummaryFromSUE({ ...base, abilities: ["Ritual Potente"] }),
    );
    expect(
      result.current.unifiedEffects.allEffects.some(
        (e) => e.sourceId === "ritual-potente",
      ),
    ).toBe(true);
  });
  it("Reflexos Defensivos soma uma vez Defesa e os três testes de resistência (Base p.25)", () => {
    const { result } = renderHook(() =>
      useBonusSummaryFromSUE({ ...base, abilities: ["Reflexos Defensivos"] }),
    );
    expect(result.current.defense.total).toBe(2);
    expect(result.current.resistances.reflexos.total).toBe(2);
    expect(result.current.resistances.fortitude.total).toBe(2);
    expect(result.current.resistances.vontade.total).toBe(2);
  });
});
