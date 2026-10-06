import { describe, expect, it } from 'vitest';
import { CONDITIONS } from '@/lib/conditions/condition-definitions';
import { CONDITION_EFFECTS } from '@/lib/game-engine';
import { getConditionModifiersSummary } from '@/lib/effects/condition-effects-adapter';

describe('Condições críticas — Base v1.3 pp.88,310–311', () => {
  it.each(['morrendo', 'enlouquecendo'])('%s não impõe impedimentos antes das consequências da cena', id => {
    expect(CONDITION_EFFECTS[id]).toMatchObject({ canAct: true, canMove: true, testModifier: 0, defenseModifier: 0 });
    expect(getConditionModifiersSummary([id])).toMatchObject({ canAct: true, canReact: true, isHelpless: false, defenseMod: 0 });
    expect(CONDITIONS[id].effect).toContain('mesma cena');
  });
  it('Morrendo e Inconsciente são independentes; apenas Inconsciente impede as ações', () => {
    expect(getConditionModifiersSummary(['morrendo', 'inconsciente']))
      .toMatchObject({ canAct: false, canReact: false, canMove: false, isHelpless: true, defenseMod: -10 });
  });
  it('Indefeso substitui Desprevenido sem duplicar a penalidade de Defesa', () => {
    expect(getConditionModifiersSummary(['inconsciente', 'indefeso', 'desprevenido']).defenseMod).toBe(-10);
    expect(CONDITION_EFFECTS.indefeso.defenseModifier).toBe(-10);
    expect(CONDITIONS.indefeso.effect).toContain('golpes de misericórdia');
    expect(CONDITIONS.inconsciente.effect).not.toContain('Defesa 5');
  });
});
