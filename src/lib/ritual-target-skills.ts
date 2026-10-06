import type { Json } from '@/integrations/supabase/types';
import { getSkillBonus } from '@/lib/character-data';
import type { RitualResistanceBonuses } from '@/lib/rituals/ritual-resistance';

/** Extrai a graduação conhecida; ajustes situacionais continuam visíveis e editáveis no teste. */
export function ritualTargetSkillBonuses(skills: Json): RitualResistanceBonuses {
  const record = skills && typeof skills === 'object' && !Array.isArray(skills) ? skills : {};
  const bonus = (name: string) => {
    const grade = record[name] ?? record[name.toLowerCase()];
    return typeof grade === 'number' && Number.isInteger(grade) && grade >= 0 && grade <= 3 ? getSkillBonus(grade) : 0;
  };
  return { fortitude: bonus('Fortitude'), reflexos: bonus('Reflexos'), vontade: bonus('Vontade') };
}
