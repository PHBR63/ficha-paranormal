import { describe, expect, it } from 'vitest';
import { describeCharacterActivity } from '../character-activity-presentation';
import type { CharacterActivityEvent } from '@/types/character-activity';

const event = (payload: CharacterActivityEvent['payload']): CharacterActivityEvent => ({
  id: 'event', operation_id: 'operation', character_id: 'sheet', author_id: 'author',
  category: 'application', status: 'confirmed', created_at: '2026-10-06', campaign_id: null, campaign_version: null, payload,
});

describe('Histórico de alterações de condições', () => {
  it('preserva penalidade em dados e oposição pendente da furtividade', () => {
    const text = describeCharacterActivity(event({ kind: 'post_attack_stealth', itemName: 'Pistola', situationalDicePenalty: 1,
      silencerApplied: true, result: { dice: [13], keptDice: 13, skillBonus: 5, equipmentBonus: 0, declaredOtherBonuses: 2, total: 20 } }));
    expect(text).toContain('−1d20'); expect(text).toContain('Silenciador reduz dois dados');
    expect(text).toContain('Percepção oposta pendente'); expect(text).toContain('→ 20');
  });
  it('mostra fonte, consulta separada, ação e adicional incluído no custo', () => {
    const text = describeCharacterActivity({ ...event({ ritualName: 'Amaldiçoar Arma', peCost: 2, situationalResolution: 'server_checked', castingSource: 'grimoire', execution: 'Movimento', bladeExtraPE: 1, grimoirePreparation: { readingConfirmed: true } }), category: 'ritual' });
    expect(text).toContain('Fonte: Grimório Ritualístico');
    expect(text).toContain('consulta sem PE');
    expect(text).toContain('Execução: Movimento');
    expect(text).toContain('+1 PE para movimento (incluído no total)');
    expect(describeCharacterActivity({ ...event({ ritualName: 'Arma Atroz' }), category: 'ritual' })).not.toContain('Fonte:');
  });
  it('mostra a conferência do mestre como evento sem custo', () => {
    expect(describeCharacterActivity(event({ kind: 'ritual_knowledge', source: 'memorized', knownBeforeBlade: true, note: 'Histórico conferido' }))).toContain('confirmado · Histórico conferido · Sem gasto de PE ou SAN');
  });
  it('mostra custo, temporários e orçamento no mesmo recibo do ataque', () => {
    const text = describeCharacterActivity({ ...event({ kind: 'combat_attack', peCost: 2, peBefore: 8, peAfter: 7,
      temporaryPEUsed: 1, peBudget: { mode: 'manual', number: 3, tracked: true, spentAfter: 4 },
      entry: { label: 'Ataque: Faca', results: [12], bestResult: 12, skillBonus: 5, otherBonuses: 0, total: 17 } }), category: 'roll' });
    expect(text).toContain('Custo 2 PE · PE 8 → 7');
    expect(text).toContain('1 PE temporários consumidos');
    expect(text).toContain('Turno manual 3: 4 PE gastos');
  });
  it('mostra orçamento confirmado e pausa sem inventar dados em recibos antigos', () => {
    expect(describeCharacterActivity(event({ kind: 'manual_turn_pause', turnNumber: 2 }))).toContain('Saldo e efeitos preservados');
    const receipt = { ...event({ ritualName: 'Arma Atroz', peBudget: { tracked: true, mode: 'manual', number: 2, spentAfter: 4, minimumCostException: true } }), category: 'ritual' as const };
    expect(describeCharacterActivity(receipt)).toContain('Turno manual 2: 4 PE gastos · Exceção do custo mínimo');
    expect(describeCharacterActivity({ ...receipt, payload: { ritualName: 'Arma Atroz' } })).not.toContain('PE gastos');
  });
  it('mostra turno manual sem cobrança e identifica a manutenção correspondente', () => {
    expect(describeCharacterActivity(event({ kind: 'manual_turn', turnBefore: 3, turnAfter: 4, peCost: 0 })))
      .toBe('Turno manual confirmado: 3 → 4 · Sem gasto de PE');
    const text = describeCharacterActivity(event({ kind: 'sustain_maintenance', peCost: 1, peBefore: 10, peAfter: 10,
      temporaryPEUsed: 1, turn: { mode: 'manual', number: 4 } }));
    expect(text).toContain('Turno manual 4');
    expect(text).toContain('1 PE temporários consumidos');
  });
  it('explica dano absorvido quando os PV normais permanecem iguais', () => {
    const text = describeCharacterActivity(event({ kind: 'damage', value: 3, temporaryHPUsed: 3,
      before: { hp_current: 10 }, after: { hp_current: 10 } }));
    expect(text).toContain('PV 10 → 10');
    expect(text).toContain('3 PV temporários consumidos');
  });
  it('mostra motivo informado e preserva recibos antigos sem motivo', () => {
    const previous = describeCharacterActivity(event({ kind: 'sustain_end' }));
    expect(previous).not.toContain('Motivo informado');
    const current = describeCharacterActivity(event({ kind: 'sustain_end', endReason: { kind: 'ajuste_manual', note: 'Legado conferido' } }));
    expect(current).toContain('Motivo informado: Ajuste manual');
    expect(current).toContain('Legado conferido');
  });
  it('mostra o encerramento e a condição removida sem apagar o histórico anterior', () => {
    expect(describeCharacterActivity(event({ kind: 'scene_expiry', sceneNumber: 3, expiredEffectsCount: 2,
      before: { conditions: [{ id: 'lento', name: 'Lento' }, 'Legada'] }, after: { conditions: ['Legada'] },
    }))).toBe('Cena 3 encerrada · 2 efeito(s) expirado(s) · Condições: −Lento');
  });
  it('apresenta cura de ritual sem estabilização automática', () => {
    const text = describeCharacterActivity(event({ kind: 'heal', value: 1,
      before: { hp_current: 0, conditions: ['Inconsciente', 'Morrendo'] },
      after: { hp_current: 1, conditions: ['Morrendo'] },
    }));
    expect(text).toBe('Cura · PV 0 → 1 · quantidade 1 · Condições: −Inconsciente');
  });

  it('apresenta condições críticas junto ao dano de ritual', () => {
    const text = describeCharacterActivity(event({ kind: 'damage', value: 5,
      before: { hp_current: 5, conditions: ['Machucado'] },
      after: { hp_current: 0, conditions: ['Machucado', { id: 'inconsciente', name: 'Inconsciente' }, { id: 'morrendo', name: 'Morrendo' }] },
    }));
    expect(text).toBe('Dano · PV 5 → 0 · quantidade 5 · Condições: +Inconsciente; +Morrendo');
  });

  it('mostra a transição de SAN numa alteração individual de campanha', () => {
    const text = describeCharacterActivity(event({ kind: 'resource', resource: 'san',
      before: { current: 0, conditions: ['Enlouquecendo'] },
      after: { current: 1, conditions: [{ id: 'perturbado', name: 'Perturbado' }] },
    }));
    expect(text).toBe('Recurso alterado · SAN 0 → 1 · Condições: +Perturbado; −Enlouquecendo');
  });

  it('continua apresentando recibo antigo de PV sem inventar condições', () => {
    expect(describeCharacterActivity(event({ kind: 'heal', value: 2,
      before: { hp_current: 5 }, after: { hp_current: 7 },
    }))).toBe('Cura · PV 5 → 7 · quantidade 2');
  });

  it('mostra a condição adicionada junto da alteração de PV', () => {
    const text = describeCharacterActivity(event({ kind: 'resources',
      before: { hp_current: 11, pe_current: 10, san_current: 15, conditions: [] },
      after: { hp_current: 10, pe_current: 10, san_current: 15, conditions: [{ id: 'machucado', name: 'Machucado' }] },
    }));
    expect(text).toContain('PV 11 → 10');
    expect(text).toContain('Condições: +Machucado');
  });

  it('mostra substituição mesmo quando o número de condições é igual e conserva desconhecidas', () => {
    const text = describeCharacterActivity(event({ kind: 'replace_conditions',
      before: { conditions: ['Inconsciente', { id: 'externa', name: 'Externa' }] },
      after: { conditions: [{ id: 'machucado', name: 'Machucado' }, { id: 'externa', name: 'Externa' }] },
    }));
    expect(text).toContain('2 → 2');
    expect(text).toContain('+Machucado; −Inconsciente');
    expect(text).not.toContain('−Externa');
  });

  it('não inventa alteração na conversão de nome legado para ID e compara instâncias repetidas', () => {
    const text = describeCharacterActivity(event({ kind: 'replace_conditions',
      before: { conditions: ['Machucado', 'Sangrando', 'Sangrando'] },
      after: { conditions: [{ id: 'machucado', name: 'Machucado' }, 'Sangrando'] },
    }));
    expect(text).toContain('Condições: −Sangrando');
    expect(text).not.toContain('+Machucado');
  });

  it('mostra remoção após início de turno sem dano, sem separador vazio', () => {
    const text = describeCharacterActivity(event({ kind: 'condition_turn',
      before: { hp_current: 20, conditions: ['Sangrando'] }, after: { hp_current: 20, conditions: [] },
      resolution: { bleedingTests: [], effects: [] },
    }));
    expect(text).toBe('Início de turno confirmado · PV 20 → 20 · Condições: −Sangrando');
  });

  it('registros antigos sem snapshots de condições continuam legíveis', () => {
    expect(describeCharacterActivity(event({ kind: 'resources', before: { hp_current: 11 }, after: { hp_current: 10 } })))
      .toBe('Recursos alterados · PV 11 → 10');
  });
});


describe('Histórico de ocultação e saque', () => {
  it('distingue rolagem confirmada de ocultação ainda oposta', () => {
    const text = describeCharacterActivity({ ...event({ kind: 'item_action', actionCost: 'padrão', result: { label: 'Ocultar: Arma', dice: [12, 7], keptDice: 12, total: 17, skillBonus: 0, otherBonuses: 5, equipmentBonus: 5 } }), category: 'roll' });
    expect(text).toContain('Ocultar: Arma: 17'); expect(text).toContain('Percepção oposta pendente'); expect(text).toContain('revista +10');
  });
  it('explica saque/guardar e custos sem inventar gasto de PE', () => {
    expect(describeCharacterActivity(event({ kind: 'item_action', itemName: 'Arma', action: 'draw', actionCost: 'livre' }))).toContain('Saque confirmado: arma equipada · Ação livre');
    expect(describeCharacterActivity(event({ kind: 'item_action', itemName: 'Arma', action: 'stow', actionCost: 'movimento' }))).toContain('Guardar confirmado: arma desequipada · Ação movimento');
  });
});
