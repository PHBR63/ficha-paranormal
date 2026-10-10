import {
  CORE_ORIGINS,
  CLASSES,
  SKILLS,
  CLASS_TRACKS,
  PATENTS,
} from "../src/lib/character-data";
import {
  CLASS_SKILL_RULES,
  CLASS_PROFICIENCIES,
} from "../src/lib/character-builder-engine";
import { ALL_CLASS_POWERS } from "../src/lib/class-powers/power-registry";
import { isBaseClassPower } from "../src/lib/rules/base-class-catalog";
import { PARANORMAL_POWERS } from "../src/lib/paranormal-powers";
import { ALL_RITUALS } from "../src/lib/rituals/legacy-exports";
import { ALL_ITEMS } from "../src/lib/catalogs/items-catalog";
import { BASE_CREATION_WEAPONS as ALL_WEAPONS } from "../src/lib/rules/base-creation-equipment";
import { getCoreAbilities } from "../src/lib/class-abilities";
import { BASE_PARANORMAL_POWER_RULES } from "../src/lib/rules/base-paranormal-powers";
import { PATENT_LIMITS } from "../src/lib/inventory-system";
const keyed = (items: Array<{ id: string }>) =>
  Object.fromEntries(items.map((i) => [i.id, i]));
export const catalog = {
  origins: keyed(
    CORE_ORIGINS.map((o) => ({
      id: o.id,
      name: o.name,
      skills: o.skills,
      powers: o.powers,
      powerDescription: o.powerDescription,
    })),
  ),
  classes: Object.fromEntries(
    CLASSES.map((c) => [
      c.id,
      {
        hp: c.pvBase,
        hpGain: c.pvPerNex,
        pe: c.peBase,
        peGain: c.pePerNex,
        san: c.sanBase,
        sanGain: c.sanPerNex,
        mandatory: CLASS_SKILL_RULES[c.id].mandatory,
        choices: CLASS_SKILL_RULES[c.id].choices,
        free: CLASS_SKILL_RULES[c.id].freeFormula(0),
        proficiencies: CLASS_PROFICIENCIES[c.id],
        core: Object.fromEntries(
          [...Array.from({ length: 19 }, (_, i) => (i + 1) * 5), 99].map(
            (nex) => [nex, getCoreAbilities(c.id, nex).map((p) => p.name)],
          ),
        ),
      },
    ]),
  ),
  patentLimits: PATENT_LIMITS,
  skills: SKILLS.map((s) => s.id),
  patents: PATENTS.map((p) => p.name),
  tracks: keyed(CLASS_TRACKS),
  powers: keyed(
    ALL_CLASS_POWERS.filter(
      (p) => !p.isCore && isBaseClassPower(p.classId, p.name),
    ).map((p) => ({
      id: p.id,
      name: p.name,
      classId: p.classId,
      minNex: p.minNex,
      repeatable: !!p.isRepeatable,
      prerequisites: p.prerequisites || {},
      choice: p.effects.base.requiresChoice,
      proficiencies: p.effects.base.proficiencies,
    })),
  ),
  paranormal: keyed(
    PARANORMAL_POWERS.map((p) => ({
      id: p.id,
      name: p.name,
      element: p.element,
      description: p.description,
      prerequisite: p.prerequisite,
      choice: p.requiresChoice,
      mechanics: BASE_PARANORMAL_POWER_RULES.find((r) => r.id === p.id)
        ?.mechanics,
      affinityMechanics: BASE_PARANORMAL_POWER_RULES.find((r) => r.id === p.id)
        ?.affinityMechanics,
    })),
  ),
  rituals: keyed(
    ALL_RITUALS.map((r) => ({
      id: r.id,
      name: r.name,
      circle: r.circle,
      element: r.element,
    })),
  ),
  items: keyed(ALL_ITEMS),
  weapons: keyed(ALL_WEAPONS),
};
