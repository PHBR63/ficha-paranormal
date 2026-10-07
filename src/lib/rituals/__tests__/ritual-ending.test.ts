import { describe, expect, it } from 'vitest';
import { validateRitualEndReason } from '../ritual-ending';

describe('declaração do motivo de encerramento', () => {
  it('exige motivo e confirmação de alcance para encerramento voluntário', () => {
    expect(validateRitualEndReason(undefined)).toContain('Selecione');
    expect(validateRitualEndReason({ kind: 'voluntario' })).toContain('alcance');
    expect(validateRitualEndReason({ kind: 'voluntario', rangeConfirmed: true })).toBeNull();
  });
  it.each(['efeito_especifico', 'ajuste_manual'] as const)('exige explicação para %s', kind => {
    expect(validateRitualEndReason({ kind, note: '   ' })).toContain('Descreva');
    expect(validateRitualEndReason({ kind, note: 'Evento confirmado na mesa.' })).toBeNull();
  });
  it('limita observação sem exigir gasto adicional de PE', () => {
    expect(validateRitualEndReason({ kind: 'nao_mantido', note: 'a'.repeat(501) })).toContain('500');
    expect(validateRitualEndReason({ kind: 'pe_indisponivel' })).toBeNull();
  });
});
