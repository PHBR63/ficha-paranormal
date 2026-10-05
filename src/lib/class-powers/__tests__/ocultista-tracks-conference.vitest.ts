/**
 * Contratos conferidos no Livro Base v1.3, páginas impressas 34–35.
 * Verifica progressão, recursos e restrições sem depender de frases de interface.
 */
import { describe, expect, it } from 'vitest';
import {
  getGrantedRituals,
  getTrackAbilityById,
  getTrackById,
  getUnlockedAbilities,
} from '../track-registry';

/** Localiza pelo nome oficial e retorna mecânicas para comparar com a fonte. */
function mechanics(trackId: string, abilityName: string) {
  const ability = getTrackById(trackId)?.abilities.find(item => item.name === abilityName);
  if (!ability) throw new Error(`Habilidade não cadastrada: ${trackId}/${abilityName}`);
  return ability.effects.base;
}

const progression = [
  ['condutor', ['Ampliar Ritual', 'Acelerar Ritual', 'Anular Ritual', 'Canalizar o Medo']],
  ['flagelador', ['Poder do Flagelo', 'Abraçar a Dor', 'Absorver Agonia', 'Medo Tangível']],
  ['graduado', ['Saber Ampliado', 'Grimório Ritualístico', 'Rituais Eficientes', 'Conhecendo o Medo']],
  ['intuitivo', ['Mente Sã', 'Presença Poderosa', 'Inabalável', 'Presença do Medo']],
  ['lamina-paranormal', ['Lâmina Maldita', 'Gladiador Paranormal', 'Conjuração Marcial', 'Lâmina do Medo']],
] as const;
const thresholds = [10, 40, 65, 99] as const;

describe('Trilhas de Ocultista — progressão oficial', () => {
  for (const [trackId, abilityNames] of progression) {
    for (const [index, nex] of thresholds.entries()) {
      it(`${trackId}: habilita ${abilityNames[index]} em NEX ${nex}`, () => {
        expect(getUnlockedAbilities(trackId, nex).map(ability => ability.name))
          .toEqual(abilityNames.slice(0, index + 1));
        expect(getUnlockedAbilities(trackId, nex - 1).map(ability => ability.name))
          .not.toContain(abilityNames[index]);
      });
    }
  }

  it.each([
    ['condutor', 'canalizar-o-medo'],
    ['flagelador', 'medo-tangivel'],
    ['graduado', 'conhecendo-o-medo'],
    ['intuitivo', 'presenca-do-medo'],
    ['lamina-paranormal', 'lamina-do-medo'],
  ])('%s concede seu ritual específico de Medo em NEX 99', (trackId, ritualId) => {
    expect(getGrantedRituals(trackId, 98)).not.toContain(ritualId);
    expect(getGrantedRituals(trackId, 99)).toContain(ritualId);
    const finalAbility = getTrackById(trackId)?.abilities.find(ability => ability.minNex === 99);
    expect(finalAbility?.effects.base.ritualPowerBonus).toBeUndefined();
    expect(finalAbility?.effects.base.hpPerNexPercent).toBeUndefined();
    expect(finalAbility?.effects.base.maximumDamageOnCritical).toBeUndefined();
    expect(finalAbility?.effects.base.grimoire).toBeUndefined();
  });
});

describe('Graduado — rituais e grimório nos NEX corretos', () => {
  it('Saber Ampliado não antecipa o grimório nem aumenta DT', () => {
    const initial = mechanics('graduado', 'Saber Ampliado');
    expect(initial.bonusRituals).toEqual({ perCircle: 1, ignoresLimit: true });
    expect(initial.grimoire).toBeUndefined();
    expect(initial.ritualDTBonus).toBeUndefined();
  });

  it('grimório é a capacidade de NEX 40, com preparação separada da execução', () => {
    const grimoire = mechanics('graduado', 'Grimório Ritualístico');
    expect(grimoire.grimoire).toMatchObject({
      maxRituals: 'intellect',
      allowedCircles: [1, 2],
      bonusPerNewCircle: 1,
      ignoresLimit: true,
      preparationAction: 'complete',
      requiresWielding: true,
      inventorySlots: 1,
      recreationCost: 'two-interlude-actions',
    });
    expect(grimoire.ritualDTBonus).toBeUndefined();
  });

  it('Rituais Eficientes aumenta DT sem inventar redução de custo', () => {
    const efficient = mechanics('graduado', 'Rituais Eficientes');
    expect(efficient.ritualDTBonus).toBe(5);
    expect(efficient.peModifiers).toBeUndefined();
  });
});

describe('Flagelador — custo, recuperação e trigger oficiais', () => {
  it('Poder do Flagelo custa 2 PV por PE e só permite descanso para recuperar', () => {
    const sacrifice = mechanics('flagelador', 'Poder do Flagelo');
    expect(sacrifice.hpAsPE).toBe(true);
    expect(sacrifice.hpCostPerPE).toBe(2);
    expect(sacrifice.hpRecoveryRestriction).toBe('rest-only');
  });

  it('Abraçar a Dor inclui dano não paranormal além do físico', () => {
    const pain = mechanics('flagelador', 'Abraçar a Dor');
    expect(pain.activation).toMatchObject({ cost: 2, action: 'reaction' });
    expect(pain.damageReduction).toMatchObject({ type: 'half', damageTypes: ['non-paranormal'] });
  });

  it('Absorver Agonia reage a ritual reduzindo inimigo a 0 PV, não a dano recebido', () => {
    const agony = mechanics('flagelador', 'Absorver Agonia');
    expect(agony.temporaryPE).toEqual({ trigger: 'on-kill-with-ritual', amount: 'ritual-circle' });
    expect(agony.temporaryPE?.trigger).not.toBe('on-damage');
  });
});

describe('Intuitivo — resistência contextual não vira bônus geral', () => {
  it('Mente Sã registra +5 contra paranormal sem RD mental ou Vontade genérica', () => {
    const sane = mechanics('intuitivo', 'Mente Sã');
    expect(sane.paranormalResistanceTestBonus).toBe(5);
    expect(sane.paranormalResistance).toBeUndefined();
    expect(sane.mentalDamageResistance).toBeUndefined();
    expect(sane.skillBonus).toBeUndefined();
  });

  it('Presença Poderosa não aumenta DT', () => {
    const presence = mechanics('intuitivo', 'Presença Poderosa');
    expect(presence.addAttributeToPELimit).toBe('presence');
    expect(presence.ritualDTBonus).toBeUndefined();
    expect(presence.ritualPowerBonus).toBeUndefined();
  });

  it('Inabalável aplica RD 10 e só modifica um teste de meio dano já existente', () => {
    const unshaken = mechanics('intuitivo', 'Inabalável');
    expect(unshaken.mentalDamageResistance).toBe(10);
    expect(unshaken.paranormalResistance).toBe(10);
    expect(unshaken.paranormalDamageTest).toMatchObject({
      testSkill: 'vontade',
      onSuccess: 'negate',
      onFailure: 'full',
      dtType: 'existing-test',
      requiresExistingHalfDamageSave: true,
    });
    expect(unshaken.paranormalDamageTest?.fixedDT).toBeUndefined();
  });
});

describe('Conduíte e Lâmina — capacidades condicionais', () => {
  it('Anular Ritual não cobra um custo fixo inventado de 2 PE', () => {
    const counter = mechanics('condutor', 'Anular Ritual');
    expect(counter.counterSpell?.costMatchesTarget).toBe(true);
    expect(counter.counterSpell?.testSkill).toBe('ocultismo');
    expect(counter.activation?.cost).toBe(0);
  });

  it('Gladiador conserva trigger corpo a corpo e teto de PE por cena', () => {
    const gladiator = mechanics('lamina-paranormal', 'Gladiador Paranormal');
    expect(gladiator.temporaryPE).toEqual({ trigger: 'on-melee-hit', amount: 2, maxPerScene: 'pe-limit' });
  });

  it('Conjuração Marcial preserva custo e limite por rodada', () => {
    const martial = mechanics('lamina-paranormal', 'Conjuração Marcial');
    expect(martial.activation).toMatchObject({ cost: 2, action: 'free', perRound: true });
  });

  it('preserva IDs históricos quando corrige nomes oficiais', () => {
    expect(getTrackAbilityById('poder-do-sangue')?.name).toBe('Poder do Flagelo');
    expect(getTrackAbilityById('absorver-angustia')?.name).toBe('Absorver Agonia');
    expect(getTrackAbilityById('condutor-maximo')?.name).toBe('Canalizar o Medo');
    expect(getTrackAbilityById('flagelo-maximo')?.name).toBe('Medo Tangível');
    expect(getTrackAbilityById('graduado-maximo')?.name).toBe('Conhecendo o Medo');
    expect(getTrackAbilityById('intuitivo-maximo')?.name).toBe('Presença do Medo');
    expect(getTrackAbilityById('lamina-maxima')?.name).toBe('Lâmina do Medo');
  });
});
