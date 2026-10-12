import type { CharacterActivityEvent } from '@/types/character-activity';
import type { Json } from '@/integrations/supabase/types';
import { resolveConditionId } from '@/lib/conditions/condition-identity';
import { RITUAL_END_REASONS } from '@/lib/rituals/ritual-ending';
import { getRitualById } from '@/lib/rituals/ritual-registry';

/** Explica o orçamento salvo na operação, sem aplicar o estado atual a eventos antigos. */
function describePETurnBudget(value: Json | undefined): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  if (value.tracked === false) return ' · Sem controle de turnos ativo';
  if (value.tracked !== true || typeof value.spentAfter !== 'number') return '';
  const context = value.mode === 'manual' ? `Turno manual ${value.number}` : `Rodada ${value.round}`;
  return ` · ${context}: ${value.spentAfter} PE gastos${value.minimumCostException === true ? ' · Exceção do custo mínimo' : ''}`;
}

/** Compara instâncias por identidade; aceita strings antigas e não inventa dados ausentes. */
function describeConditionChanges(before: Json | undefined, after: Json | undefined): string {
  if (!Array.isArray(before) || !Array.isArray(after)) return '';
  const entries = (values: Json[]) => values.flatMap(value => {
    const id = typeof value === 'string' ? value
      : value && typeof value === 'object' && !Array.isArray(value) && typeof value.id === 'string' ? value.id : undefined;
    if (!id) return [];
    const name = value && typeof value === 'object' && !Array.isArray(value) && typeof value.name === 'string' ? value.name : id;
    return [{ id: resolveConditionId(id), name }];
  });
  const removed = entries(before);
  const added = entries(after).filter(condition => {
    const index = removed.findIndex(previous => previous.id === condition.id);
    if (index < 0) return true;
    removed.splice(index, 1);
    return false;
  });
  const changes = [...added.map(condition => `+${condition.name}`), ...removed.map(condition => `−${condition.name}`)];
  return changes.length ? ` · Condições: ${changes.join('; ')}` : '';
}

/** Apresenta o payload sem inventar dados ausentes em registros antigos. */
export function describeCharacterActivity(event: CharacterActivityEvent): string {
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Registro sem detalhes';
  const peBudgetDetails = describePETurnBudget(payload.peBudget);
  const nested = payload.entry ?? payload.result;
  const result = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : payload;
  // O saldo normal pode ficar igual quando a fonte temporária absorve todo o gasto.
  const temporaryUsage = (resource: 'PV' | 'PE', value: Json | undefined) =>
    typeof value === 'number' && value > 0 ? ` · ${value} ${resource} temporários consumidos` : '';
  const temporaryPE = temporaryUsage('PE', payload.temporaryPEUsed);
  const temporaryHP = temporaryUsage('PV', payload.temporaryHPUsed);
  const label = typeof result.label === 'string' ? result.label : typeof payload.ritualName === 'string' ? payload.ritualName : typeof payload.label === 'string' ? payload.label : event.category === 'roll' ? 'Rolagem' : event.category === 'ritual' ? 'Conjuração' : 'Efeito';
  if (event.category === 'roll') {
    const total = typeof result.total === 'number' ? `: ${result.total}` : '';
    const dice = Array.isArray(result.dice) ? result.dice : Array.isArray(result.results) ? result.results : [];
    const kept = typeof result.keptDice === 'number' ? result.keptDice : result.bestResult;
    const skill = typeof result.skillBonus === 'number' ? result.skillBonus : undefined;
    const other = typeof result.otherBonuses === 'number' ? result.otherBonuses : undefined;
    const bonus = typeof result.bonus === 'number' ? result.bonus : undefined;
    const signed = (value: number) => value >= 0 ? `+${value}` : `${value}`;
    const selected = typeof result.diceMultiplier === 'number' && result.diceMultiplier !== 1 && dice.every(die => typeof die === 'number') ? `(${dice.join(' + ')}) × ${result.diceMultiplier}` : String(kept);
    const breakdown = typeof kept === 'number' ? ` · ${selected}${skill !== undefined ? ` ${signed(skill)} perícia` : ''}${other !== undefined ? ` ${signed(other)} outros bônus` : ''}${skill === undefined && bonus !== undefined ? ` ${signed(bonus)} bônus` : ''}` : '';
    const attackCost = payload.kind === 'combat_attack' && typeof payload.peCost === 'number'
      ? ` · Custo ${payload.peCost} PE · PE ${payload.peBefore} → ${payload.peAfter}${temporaryPE}${peBudgetDetails}` : '';
    const itemDetails = payload.kind === 'item_action' ? ` · Ação ${payload.actionCost} · Maior bônus de equipamento +${result.equipmentBonus ?? 0} · Percepção oposta pendente; revista +10 ao observador · Requisitos declarados` : '';
    return `${label}${total}${dice.length ? ` · dados [${dice.join(', ')}]` : ''}${breakdown}${attackCost}${itemDetails}`;
  }
  if (event.category === 'ritual') {
    const preparation = payload.grimoirePreparation;
    const situationalDetails = payload.situationalResolution === 'server_checked'
      ? ` · Fonte: ${payload.castingSource === 'grimoire' ? 'Grimório Ritualístico' : 'memorizado'}${preparation && typeof preparation === 'object' && !Array.isArray(preparation) && preparation.readingConfirmed === true ? ' · Empunhar e consulta de ação completa declarados; consulta sem PE' : ''} · Execução: ${payload.execution}${payload.bladeExtraPE === 1 ? ' · Lâmina Maldita: +1 PE para movimento (incluído no total)' : ''}` : '';
    const cost = payload.paranormalCost;
    const costDetails = cost && typeof cost === 'object' && !Array.isArray(cost)
      ? ` · Custo do Paranormal: ${typeof cost.total === 'number' ? `Ocultismo ${cost.total} / DT ${cost.dt}` : cost.skipped ? 'não executado: concentração falhou' : 'Medo'} · SAN ${payload.sanBefore} → ${payload.sanAfter} · SAN máxima ${payload.sanMaxBefore} → ${payload.sanMaxAfter}` : '';
    const concentration = payload.concentration;
    const tests = concentration && typeof concentration === 'object' && !Array.isArray(concentration) && Array.isArray(concentration.tests)
      ? concentration.tests : [];
    const details = tests.map(test => test && typeof test === 'object' && !Array.isArray(test)
      ? `Vontade (${test.trigger}) · dados [${Array.isArray(test.dice) ? test.dice.join(', ') : 'conferir'}] · ${test.kept} + bônus ${test.bonus} = ${test.total} vs DT ${test.dt} · ${test.success ? 'sucesso' : 'falha'}${Array.isArray(test.bonuses) ? ` · Fontes: ${test.bonuses.map(source => source && typeof source === 'object' && !Array.isArray(source) ? `${source.name}: ${source.value}` : 'conferir').join('; ')}` : ''}` : 'Teste antigo: conferir').join('; ');
    return `${label}${typeof payload.peCost === 'number' ? ` · ${payload.peCost} PE` : ''}${typeof payload.peBefore === 'number' && typeof payload.peAfter === 'number' ? ` (${payload.peBefore} → ${payload.peAfter})` : ''}${temporaryPE}${situationalDetails}${details ? ` · ${details}` : ''}${payload.castingOutcome === 'failed_concentration' ? ' · Concentração falhou; efeitos bloqueados, sem estorno de PE' : ''}${costDetails}${peBudgetDetails}`;
  }
  if (payload.kind === 'ritual_knowledge') return `Conferência histórica do mestre · ${typeof payload.ritualId === 'string' ? getRitualById(payload.ritualId)?.name ?? 'Ritual legado' : 'Ritual'} · Fonte: ${payload.source === 'grimoire' ? 'Grimório Ritualístico' : 'memorizado'} · Conhecimento anterior à Lâmina Maldita: ${payload.knownBeforeBlade === true ? 'confirmado' : 'não confirmado'} · ${payload.note} · Sem gasto de PE ou SAN`;
  if (payload.kind === 'item_action') return `${payload.itemName} · ${payload.action === 'draw' ? 'Saque confirmado: arma equipada' : 'Guardar confirmado: arma desequipada'} · Ação ${payload.actionCost} · Requisitos declarados pela mesa · Sem gasto de PE`;
  if (payload.kind === 'accessory_review') return `${payload.itemName} · ${payload.action === 'review' ? (payload.enabled ? 'Benefício aprovado pelo mestre' : 'Aprovação revogada') : (payload.enabled ? 'Uso confirmado: empunhado / vestido' : 'Uso encerrado')} · ${payload.note || 'Sem gasto de PE ou SAN'}`;
  if (payload.kind === 'scene_expiry') return `Cena ${payload.sceneNumber} encerrada · ${payload.expiredEffectsCount} efeito(s) expirado(s)${describeConditionChanges((payload.before as { conditions?: Json })?.conditions, (payload.after as { conditions?: Json })?.conditions)}`;
  if (payload.kind === 'manual_turn') return `Turno manual confirmado: ${payload.turnBefore} → ${payload.turnAfter} · Sem gasto de PE`;
  if (payload.kind === 'manual_turn_pause') return `Controle manual pausado no turno ${payload.turnNumber} · Saldo e efeitos preservados`;
  if (payload.kind === 'temporary_resource' || payload.kind === 'temporary_end') {
    const before = payload.before as { current?: number } | undefined;
    const after = payload.after as { current?: number } | undefined;
    return `${payload.kind === 'temporary_end' ? 'Fonte encerrada' : 'Recurso temporário confirmado'} · ${payload.sourceName} · ${payload.resource === 'hp' ? 'PV' : 'PE'} ${before?.current} → ${after?.current}`;
  }
  if (payload.kind === 'sustain_maintenance' || payload.kind === 'sustain_end') {
    const before = payload.before;
    const rituals = before && typeof before === 'object' && !Array.isArray(before) && Array.isArray(before.sustained_rituals)
      ? before.sustained_rituals : [];
    const names = rituals.map(ritual => ritual && typeof ritual === 'object' && !Array.isArray(ritual)
      ? String(ritual.ritual_name ?? ritual.ritual_id ?? 'Ritual') : 'Ritual').join(', ');
    const reason = payload.endReason;
    const reasonDetails = payload.kind === 'sustain_end' && reason && typeof reason === 'object' && !Array.isArray(reason)
      ? ` · Motivo informado: ${RITUAL_END_REASONS.find(entry => entry.kind === reason.kind)?.label ?? 'Conferência manual'}${typeof reason.note === 'string' && reason.note ? ` — ${reason.note}` : ''}` : '';
    const turn = payload.turn;
    const turnDetails = turn && typeof turn === 'object' && !Array.isArray(turn)
      ? turn.mode === 'manual' ? ` · Turno manual ${turn.number}` : ` · Cena ${turn.scene} · Rodada ${turn.round}` : '';
    return `${payload.kind === 'sustain_maintenance' ? 'Manutenção confirmada' : 'Sustentação encerrada'} · ${names} · Custo ${payload.peCost ?? 0} PE · PE ${payload.peBefore} → ${payload.peAfter}${temporaryPE}${turnDetails}${reasonDetails}${peBudgetDetails}`;
  }
  const kinds: Record<string, string> = { heal: 'Cura', damage: 'Dano', conditions: 'Condições adicionadas', replace_conditions: 'Condições alteradas', resource: 'Recurso alterado', resources: 'Recursos alterados', weapon_buff: 'Bônus de arma aplicado à ficha', sustain: 'Sustentação ativada' };
  const kind = typeof payload.kind === 'string' ? kinds[payload.kind] ?? 'Efeito registrado' : 'Efeito registrado';
  const resource = payload.resource === 'hp' ? 'PV' : payload.resource === 'pe' ? 'PE' : payload.resource === 'san' ? 'SAN' : '';
  const before = payload.before;
  const after = payload.after;
  const conditionChanges = before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)
    ? describeConditionChanges(before.conditions, after.conditions) : '';
  if (payload.kind === 'condition_turn') {
    const resolution = payload.resolution;
    const effects = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.effects)
      ? resolution.effects.filter(effect => effect && typeof effect === 'object' && !Array.isArray(effect)) : [];
    const details = effects.map(effect => typeof effect === 'object' && effect && !Array.isArray(effect)
      ? `${effect.label ?? 'Condição'}: dados [${Array.isArray(effect.dice) ? effect.dice.join(', ') : ''}], resultado ${effect.rolled}, final ${effect.finalAmount}` : '');
    const hp = before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)
      ? ` · PV ${before.hp_current} → ${after.hp_current}` : '';
    const tests = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.bleedingTests)
      ? resolution.bleedingTests.map(test => test && typeof test === 'object' && !Array.isArray(test)
        ? `Vigor: ${test.total} contra DT ${test.dt} (${test.passed ? 'sucesso' : 'falha'})` : '').filter(Boolean) : [];
    const notices = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.notices)
      ? resolution.notices.filter((notice): notice is string => typeof notice === 'string') : [];
    const turnDetails = [...tests, ...details, ...notices].join(' · ');
    return `Início de turno confirmado${hp}${temporaryHP}${turnDetails ? ` · ${turnDetails}` : ''}${conditionChanges}`;
  }
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    if (payload.kind === 'resources') {
      const changes = [['hp_current', 'PV'], ['pe_current', 'PE'], ['san_current', 'SAN']]
        .filter(([key]) => typeof before[key] === 'number' && typeof after[key] === 'number')
        .map(([key, name]) => `${name} ${before[key]} → ${after[key]}`);
      return `${kind} · ${changes.join(' · ')}${conditionChanges}`;
    }
    if (typeof before.hp_current === 'number' && typeof after.hp_current === 'number') return `${kind} · PV ${before.hp_current} → ${after.hp_current}${temporaryHP}${typeof payload.value === 'number' ? ` · quantidade ${payload.value}` : ''}${typeof before.age === 'number' && typeof after.age === 'number' ? ` · Idade ${before.age} → ${after.age}` : ''}${conditionChanges}`;
    if (typeof before.current === 'number' && typeof after.current === 'number') return `${kind} · ${resource} ${before.current} → ${after.current}${temporaryUsage(payload.resource === 'pe' ? 'PE' : 'PV', payload.temporaryUsed)}${conditionChanges}`;
    if (Array.isArray(before.conditions) && Array.isArray(after.conditions)) return `${kind} · ${before.conditions.length} → ${after.conditions.length} condição(ões)${conditionChanges}`;
  }
  return kind;
}
