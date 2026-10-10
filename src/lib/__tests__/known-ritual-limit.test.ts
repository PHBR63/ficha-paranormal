import { describe, expect, it } from 'vitest';
import { getKnownRitualLimit } from '../rituals/known-ritual-limit';
import { auditRitualsCount, type CharacterForAudit } from '../character-audit-engine';

const character = {
  class: 'Ocultista', class_track: 'graduado', nex: 50, intellect: 2,
  rituals: ['luz', 'aprimorar-fisico', 'polarizacao-caotica', 'cineraria'],
  creation_data: { rituals: [], extraRituals: { 'saber-1': ['luz'], 'saber-2': ['aprimorar-fisico'], 'grimorio-inicial': ['polarizacao-caotica', 'cineraria'] } },
};

describe('Cota visual dos extras preservados do Graduado', () => {
  it('mantém o limite comum e acrescenta apenas aquisições registradas', () => {
    expect(getKnownRitualLimit(character)).toMatchObject({ count: 16, baseCount: 12, extraCount: 4 });
  });
  it('não presume extras em fichas antigas sem fonte', () => {
    expect(getKnownRitualLimit({ ...character, creation_data: null }).extraCount).toBe(0);
  });
  it('não concede a cota sem trilha ou NEX apropriado', () => {
    expect(getKnownRitualLimit({ ...character, class_track: 'intuitivo' }).extraCount).toBe(0);
    expect(getKnownRitualLimit({ ...character, nex: 10 }).extraCount).toBe(1);
  });
  it('não conta ritual removido, fonte desconhecida, círculo indevido ou repetição', () => {
    const malformed = { ...character, rituals: ['luz', 'aprimorar-fisico'], creation_data: { rituals: ['luz'], extraRituals: { 'saber-1': ['luz'], 'saber-2': ['luz', 'aprimorar-fisico', 'aprimorar-fisico'], 'grimorio-3': ['aprimorar-fisico'], estranho: ['luz'] } } };
    expect(getKnownRitualLimit(malformed).extraCount).toBe(1);
  });
  it('respeita a capacidade do grimório e trata formatos inválidos', () => {
    expect(getKnownRitualLimit({ ...character, intellect: 1 }).extraCount).toBe(3);
    expect(getKnownRitualLimit({ ...character, intellect: Number.NaN }).extraCount).toBe(2);
    expect(getKnownRitualLimit({ ...character, creation_data: { extraRituals: [] } }).extraCount).toBe(0);
  });
  it('auditoria não pede remoção de extras legítimos e ainda detecta excesso real', () => {
    const audit = { ...character, id: 'qa', name: 'QA', origin: 'academico', vigor: 2, presence: 3, agility: 2, hp_max: 50, pe_max: 70, san_max: 65, defense: 12, rituals: [...character.rituals, ...Array.from({ length: 12 }, (_, i) => `ordinary-${i}`)] } satisfies CharacterForAudit;
    expect(auditRitualsCount(audit).issues).toHaveLength(0);
    expect(auditRitualsCount({ ...audit, rituals: [...audit.rituals, 'ordinary-extra'] }).issues).toHaveLength(1);
  });
});
