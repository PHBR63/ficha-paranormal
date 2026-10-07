import type { CharacterActivityEvent } from '@/types/character-activity';
import type { Json } from '@/integrations/supabase/types';
import { resolveConditionId } from '@/lib/conditions/condition-identity';

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
  const nested = payload.entry ?? payload.result;
  const result = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : payload;
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
    return `${label}${total}${dice.length ? ` · dados [${dice.join(', ')}]` : ''}${breakdown}`;
  }
  if (event.category === 'ritual') return `${label}${typeof payload.peCost === 'number' ? ` · ${payload.peCost} PE` : ''}${typeof payload.peBefore === 'number' && typeof payload.peAfter === 'number' ? ` (${payload.peBefore} → ${payload.peAfter})` : ''}`;
  if (payload.kind === 'scene_expiry') return `Cena ${payload.sceneNumber} encerrada · ${payload.expiredEffectsCount} efeito(s) expirado(s)${describeConditionChanges((payload.before as { conditions?: Json })?.conditions, (payload.after as { conditions?: Json })?.conditions)}`;
  if (payload.kind === 'sustain_maintenance' || payload.kind === 'sustain_end') {
    const before = payload.before;
    const rituals = before && typeof before === 'object' && !Array.isArray(before) && Array.isArray(before.sustained_rituals)
      ? before.sustained_rituals : [];
    const names = rituals.map(ritual => ritual && typeof ritual === 'object' && !Array.isArray(ritual)
      ? String(ritual.ritual_name ?? ritual.ritual_id ?? 'Ritual') : 'Ritual').join(', ');
    return `${payload.kind === 'sustain_maintenance' ? 'Manutenção confirmada' : 'Sustentação encerrada'} · ${names} · Custo ${payload.peCost ?? 0} PE · PE ${payload.peBefore} → ${payload.peAfter}`;
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
    const turnDetails = [...tests, ...details].join(' · ');
    return `Início de turno confirmado${hp}${turnDetails ? ` · ${turnDetails}` : ''}${conditionChanges}`;
  }
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    if (payload.kind === 'resources') {
      const changes = [['hp_current', 'PV'], ['pe_current', 'PE'], ['san_current', 'SAN']]
        .filter(([key]) => typeof before[key] === 'number' && typeof after[key] === 'number')
        .map(([key, name]) => `${name} ${before[key]} → ${after[key]}`);
      return `${kind} · ${changes.join(' · ')}${conditionChanges}`;
    }
    if (typeof before.hp_current === 'number' && typeof after.hp_current === 'number') return `${kind} · PV ${before.hp_current} → ${after.hp_current}${typeof payload.value === 'number' ? ` · quantidade ${payload.value}` : ''}${conditionChanges}`;
    if (typeof before.current === 'number' && typeof after.current === 'number') return `${kind} · ${resource} ${before.current} → ${after.current}${conditionChanges}`;
    if (Array.isArray(before.conditions) && Array.isArray(after.conditions)) return `${kind} · ${before.conditions.length} → ${after.conditions.length} condição(ões)${conditionChanges}`;
  }
  return kind;
}
