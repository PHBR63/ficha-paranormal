import { describe, expect, it } from 'vitest';
import { describeCharacterActivity } from '../character-activity-presentation';
import type { CharacterActivityEvent } from '@/types/character-activity';

const event = (payload: CharacterActivityEvent['payload']): CharacterActivityEvent => ({
  id: 'event', operation_id: 'operation', character_id: 'sheet', author_id: 'author',
  category: 'application', status: 'confirmed', created_at: '2026-10-06', campaign_id: null, campaign_version: null, payload,
});

describe('Histórico de alterações de condições', () => {
  it('distingue ação de combate reservada e dano em área aplicado pelo mestre', () => {
    const attack = describeCharacterActivity({ ...event({ kind: 'combat_attack',
      entry: { label: 'Ataque', total: 18, results: [13] },
      combatAction: { tracked: true, kind: 'standard' } }), category: 'roll' });
    expect(attack).toContain('Ação padrão registrada no turno pelo servidor');
    const damage = describeCharacterActivity(event({ kind: 'campaign_bulk_damage', source: 'Granada',
      grossDamage: 20, damageType: 'fogo', declaredResistedDamage: 10,
      declaredDamageReduction: 2, immuneDamage: false, finalDamage: 8,
      temporaryHPUsed: 3, hpBefore: 15, hpAfter: 10 }));
    expect(damage).toContain('dano após reduções 8');
    expect(damage).toContain('PV 15 → 10');
  });
  it('explica as condições derivadas pelo dano sem inventar alterações em registros antigos', () => {
    const damaged = describeCharacterActivity(event({ kind: 'campaign_bulk_damage', source: 'Granada',
      grossDamage: 12, damageType: 'impacto', declaredResistedDamage: 0,
      declaredDamageReduction: 0, immuneDamage: false, finalDamage: 12,
      temporaryHPUsed: 0, hpBefore: 12, hpAfter: 0,
      conditionsBefore: [], conditionsAfter: [{ id: 'inconsciente', name: 'Inconsciente' }] }));
    expect(damaged).toContain('Condições: +Inconsciente');
    const legacy = describeCharacterActivity(event({ kind: 'campaign_bulk_damage', source: 'Granada',
      grossDamage: 12, damageType: 'impacto', declaredResistedDamage: 0,
      declaredDamageReduction: 0, immuneDamage: false, finalDamage: 12,
      temporaryHPUsed: 0, hpBefore: 12, hpAfter: 0 }));
    expect(legacy).not.toContain('Condições:');
  });
  it('mostra defesa especial como pendente de resolução pela mesa', () => {
    const defense = describeCharacterActivity(event({ kind: 'special_defense', defenseType: 'esquiva', round: 2 }));
    expect(defense).toContain('Esquiva');
    expect(defense).toContain('aplicação no ataque pendente');
  });
  it('mostra resolução de ataque em ambas as fichas sem atribuir timing automático à defesa', () => {
    const payload = { kind: 'attack_target_received', attackTotal: 17, defenseTotal: 16, hit: true,
      grossDamage: 15, damageType: 'corte', declaredResistedDamage: 2,
      declaredDamageReduction: 3, immuneDamage: false, finalDamage: 10,
      temporaryHPUsed: 4, hpBefore: 20, hpAfter: 14, specialDefenseEventId: 'defense' };
    const defender = describeCharacterActivity(event(payload));
    const attacker = describeCharacterActivity(event({ ...payload, kind: 'attack_target_resolved' }));
    expect(defender).toContain('PV 20 → 14');
    expect(attacker).toContain('teste 17 / Defesa 16');
    expect(attacker).toContain('sem comprovação do momento da declaração');
    expect(describeCharacterActivity(event({ kind: 'special_defense', defenseType: 'bloqueio', round: 2,
      resolution: 'mestre_confirmou_resultado' }))).toContain('revisado retrospectivamente');
  });
  it('distingue dano não letal, seu acumulado e a ausência de dano massivo', () => {
    const described = describeCharacterActivity(event({ kind: 'attack_target_received',
      attackTotal: 17, defenseTotal: 16, hit: true, grossDamage: 9, damageType: 'impacto',
      declaredResistedDamage: 0, declaredDamageReduction: 2, immuneDamage: false,
      finalDamage: 7, temporaryHPUsed: 2, hpBefore: 20, hpAfter: 20,
      damageMode: 'nonlethal', nonlethalBefore: 1, nonlethalApplied: 5,
      nonlethalAfter: 6, massiveDamageRequired: false }));
    expect(described).toContain('dano não letal 1 → 6');
    expect(described).toContain('5 aplicado');
    expect(described).not.toContain('dano massivo:');
  });
  it('identifica a defesa declarada antes da rolagem quando o servidor comprova a ordem', () => {
    const attack = describeCharacterActivity(event({ kind: 'attack_target_received',
      attackTotal: 17, defenseTotal: 16, hit: true, grossDamage: 15, damageType: 'corte',
      declaredResistedDamage: 0, declaredDamageReduction: 0, immuneDamage: false,
      finalDamage: 15, temporaryHPUsed: 0, hpBefore: 20, hpAfter: 5,
      specialDefenseEventId: 'defense', timingVerifiedByServer: true }));
    expect(attack).toContain('declarada antes da rolagem');
    expect(attack).not.toContain('retrospectivamente');

    const defense = describeCharacterActivity(event({ kind: 'special_defense',
      defenseType: 'esquiva', round: 2, resolution: 'mestre_confirmou_resultado',
      timingVerifiedByServer: true }));
    expect(defense).toContain('declarada antes da rolagem');
  });
  it('explica Mirar pago conforme o modo, sem atribuir prazo manual ao combate', () => {
    const untracked = describeCharacterActivity(event({ kind: 'mirar', mode: 'untracked',
      weaponName: 'Fuzil', peCost: 1, lethalShotPrepaid: true, consumedByAttackId: 'attack' }));
    expect(untracked).toContain('registrada sem controle de turnos');
    expect(untracked).toContain('alvo, alcance e prazo conferidos pela mesa');
    const combat = describeCharacterActivity(event({ kind: 'mirar', mode: 'combat', round: 2,
      weaponName: 'Fuzil', peCost: 1, lethalShotPrepaid: true }));
    expect(combat).toContain('registrada na rodada 2');
    expect(combat).not.toContain('prazo conferidos pela mesa');
  });
  it('explica a cobrança na fonte e a nova rolagem no aliado', () => {
    const source = describeCharacterActivity(event({ kind: 'inspirar_confianca', targetName: 'Aliado',
      testLabel: 'Vontade', originalTotal: 12, rerollTotal: 19, range: 'curto',
      peCost: 2, peBefore: 8, peAfter: 6 }));
    expect(source).toContain('Vontade 12 → 19');
    expect(source).toContain('2 PE (8 → 6)');
    const target = describeCharacterActivity({ ...event({ kind: 'inspirar_confianca_reroll',
      sourceName: 'Comandante', originalTotal: 12, requiresReview: true,
      entry: { label: 'Repetição: Ataque', results: [14], bestResult: 14, total: 19, bonus: 5 } }), category: 'roll' });
    expect(target).toContain('resultado anterior 12 → 19');
    expect(target).toContain('efeitos dependem de revisão da mesa');
  });
  it('explica o custo por aliado e a ação adicional do Estrategista', () => {
    const text = describeCharacterActivity(event({ kind: 'estrategista', targetCount: 2, targetNames: ['Aliado A', 'Aliado B'],
      range: 'curto', peCost: 2, peBefore: 10, peAfter: 8,
      peBudget: { tracked: true, mode: 'manual', number: 2, spentAfter: 2 } }));
    expect(text).toContain('2 aliado(s): Aliado A, Aliado B');
    expect(text).toContain('2 PE (10 → 8)');
    expect(text).toContain('próximo turno de cada alvo');
    expect(describeCharacterActivity(event({ kind: 'estrategista_movement' }))).toContain('Sem gasto de PE');
    expect(describeCharacterActivity(event({ kind: 'estrategista_turn_review' }))).toContain('mestre confirmou');
  });
  it('mostra dados, bônus, PV e PE nas duas fichas após Paramédico', () => {
    const source = describeCharacterActivity(event({ kind: 'paramedico', targetName: 'Aliado', diceCount: 3,
      dice: [4, 7, 2], originBonus: 2, totalHealing: 15, effectiveHealing: 9,
      hpBefore: 11, hpAfter: 16, nonlethalHealed: 4,
      adjacencyConfirmed: true, peCost: 3, peBefore: 8, peAfter: 5 }));
    expect(source).toContain('3d10 [4 + 7 + 2] + 2 de Agente de Saúde = 15 PV');
    expect(source).toContain('Cura efetiva 9 (11 → 16 PV)');
    expect(source).toContain('4 de dano não letal removidos');
    expect(source).toContain('3 PE (8 → 5)');
    const target = describeCharacterActivity(event({ kind: 'paramedico_healing_received', sourceName: 'Médica',
      healed: 9, hpBefore: 11, hpAfter: 16, nonlethalHealed: 4 }));
    expect(target).toContain('Paramédico de Médica · Cura efetiva 9 (11 → 16 PV)');
    expect(target).toContain('4 de dano não letal removidos');
  });
  it('explica chance, d10 e benefício a partir do recibo confirmado', () => {
    const text=describeCharacterActivity({...event({kind:'combat_attack',entry:{label:'Ataque',total:20,results:[20]},concealmentResult:{level:'total',attackerBlind:false,heatVisionApplied:false,chance:50,die:4,failed:true,targetDefense:10}}),category:'roll'});
    expect(text).toContain('chance 50%'); expect(text).toContain('d10 4'); expect(text).toContain('falha por camuflagem; dano bloqueado');
  });
  it('mostra alcance, situação declarada, Mira e possibilidade de revisão', () => {
    const text = describeCharacterActivity({ ...event({ kind: 'combat_attack', entry: { label: 'Ataque', total: 19, results: [14] },
      sneakAttackResult: { range: 'long', targetStatus: 'flat_footed', telescopicSightApplied: true,
        weaponMaximumRange: 3, declaredBy: 'player', masterReview: 'available', applied: true, roundLimitChecked: true } }), category: 'roll' });
    expect(text).toContain('alvo desprevenido em alcance longo');
    expect(text).toContain('Mira Telescópica verificada');
    expect(text).toContain('mestre pode revisar');
    expect(text).toContain('1 PE da habilidade cobrado');
  });
  it('preserva penalidade em dados e oposição pendente da furtividade', () => {
    const text = describeCharacterActivity(event({ kind: 'post_attack_stealth', itemName: 'Pistola', situationalDicePenalty: 1, turnContext: 'attack_receipt',
      silencerApplied: true, result: { dice: [13], keptDice: 13, skillBonus: 5, equipmentBonus: 0, declaredOtherBonuses: 2, total: 20 } }));
    expect(text).toContain('−1d20'); expect(text).toContain('Silenciador reduz dois dados');
    expect(text).toContain('Ataque com esta arma confirmado no turno pelo servidor');
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
