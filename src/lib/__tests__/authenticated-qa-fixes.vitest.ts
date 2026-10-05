import { describe, expect, it } from 'vitest';
import { SKILLS } from '../character-data';
import { getSkillAttribute } from '../constants/game-ids';
import { getSkillTrainingBonus, getSkillTrainingLevel } from '../skill-training';
import { rollSkillTest } from '../dice-roller';
import { validateCharacter } from '../rules-engine/validate-character';
import type { CharacterState } from '../rules-engine/types';

describe('Regressões da ficha autenticada', () => {
  it.each([[1, 5], [2, 10], [3, 15]])('grau %s vira bônus %s', (grade, bonus) => {
    expect(getSkillTrainingBonus({ investigacao: grade }, 'Investigação')).toBe(bonus);
  });
  it('lê nomes legados sem perder zero explícito no ID canônico', () => {
    expect(getSkillTrainingBonus({ 'Investigação': 1 }, 'investigacao')).toBe(5);
    expect(getSkillTrainingLevel({ investigacao: 0, 'Investigação': 2 }, 'Investigação')).toBe(0);
  });
  it.each([-1, 4, 5, NaN, 1.5])('grau inválido %s não gera bônus', grade => {
    expect(getSkillTrainingBonus({ vontade: grade }, 'vontade')).toBe(0);
  });
  it('Presença zero continua com dois dados e treinamento +5', () => {
    const roll = rollSkillTest({ attributeValue: 0, skillBonus: getSkillTrainingBonus({ vontade: 1 }, 'Vontade') });
    expect(roll.dice).toHaveLength(2);
    expect(roll.keptDice).toBe(Math.min(...roll.dice));
    expect(roll.total).toBe(roll.keptDice + 5);
  });
  it('todas as perícias do catálogo têm o mesmo atributo centralizado', () => {
    for (const skill of SKILLS) expect(getSkillAttribute(skill.id), skill.name).toBe(skill.attribute);
  });
  it('ficha criada com sete treinadas e nome Ataque Especial não gera os falsos avisos', () => {
    const state: CharacterState = {
      id: 'qa', name: 'QA', characterClass: 'Combatente', classTrack: 'operacoes-especiais', nex: 5, origin: 'Lutador',
      attributes: { strength: 3, agility: 2, intellect: 2, presence: 0, vigor: 2 },
      skills: { luta: 'treinado', reflexos: 'treinado', pontaria: 'treinado', fortitude: 'treinado', vontade: 'treinado', investigacao: 'treinado', iniciativa: 'treinado' },
      classPowers: ['Ataque Especial'], generalPowers: [], paranormalPowers: [], trackAbilities: [], rituals: [], sustainedRituals: [],
      equippedWeapons: [], inventory: [], activeConditions: [], hpCurrent: 22, peCurrent: 2, sanCurrent: 12,
    };
    expect(validateCharacter(state).issues.filter(issue => ['low-trained-skills', 'excess-trained-skills', 'unknown-power'].includes(issue.ruleId))).toEqual([]);
  });
});
