import type { CharacterFormData } from "@/pages/CharacterCreate";
import { creationRitualSlots } from "@/lib/character-creation-rules";
import { ALL_RITUALS } from "@/lib/rituals/legacy-exports";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/** Seletores por fonte evitam consumir rituais de classe com aquisições do Graduado. */
export function CreationRitualExtras({
  formData,
  updateFormData,
}: {
  formData: CharacterFormData;
  updateFormData: (data: Partial<CharacterFormData>) => void;
}) {
  const [search, setSearch] = useState("");
  const slots = creationRitualSlots(formData);
  if (!slots.length) return null;
  return (
    <div className="space-y-4">
      <Input
        aria-label="Pesquisar rituais adicionais"
        placeholder="Pesquisar rituais adicionais"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {slots.map((slot) => {
        const selected = formData.extraRituals?.[slot.source] || [];
        const other = new Set([
          ...formData.rituals,
          ...Object.entries(formData.extraRituals || {})
            .filter(([key]) => key !== slot.source)
            .flatMap(([, ids]) => ids),
        ]);
        return (
          <section
            className="ordo-panel p-4 space-y-3"
            key={slot.source}
            aria-label={slot.label}
          >
            <h3 className="font-display text-lg">{slot.label}</h3>
            <p className="text-sm text-muted-foreground">
              {selected.length}/{slot.count} escolhidos; aquisição separada da
              classe.{" "}
              {slot.source.startsWith("grimorio")
                ? "Para usar: empunhar o grimório e folheá-lo com uma ação completa; ocupa 1 espaço."
                : ""}
            </p>
            <div className="max-h-80 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_RITUALS.filter(
                (r) =>
                  (!slot.ritualName || r.name === slot.ritualName) &&
                  r.circle <= slot.maxCircle &&
                  (slot.source === "grimorio-inicial" ||
                    r.circle === slot.maxCircle) &&
                  r.name
                    .toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase()),
              ).map((ritual) => (
                <label
                  key={ritual.id}
                  className="min-h-11 flex items-center gap-3 p-2 border border-border rounded"
                >
                  <Checkbox
                    aria-label={`${slot.label}: ${ritual.name} (${ritual.element}, ${ritual.circle}º círculo)`}
                    checked={selected.includes(ritual.id)}
                    disabled={
                      !selected.includes(ritual.id) &&
                      (selected.length >= slot.count ||
                        (slot.source !== "lamina" && other.has(ritual.id)))
                    }
                    onCheckedChange={(checked) =>
                      updateFormData({
                        extraRituals: {
                          ...formData.extraRituals,
                          [slot.source]: checked
                            ? [...selected, ritual.id]
                            : selected.filter((id) => id !== ritual.id),
                        },
                      })
                    }
                  />
                  <span>
                    {ritual.name} <small>({ritual.element} · {ritual.circle}º círculo)</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
