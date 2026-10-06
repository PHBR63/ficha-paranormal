import type { CharacterActivityEvent } from '@/types/character-activity';

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
  const kinds: Record<string, string> = { heal: 'Cura', damage: 'Dano', conditions: 'Condições adicionadas', replace_conditions: 'Condições alteradas', resource: 'Recurso alterado', resources: 'Recursos alterados', weapon_buff: 'Bônus de arma aplicado à ficha', sustain: 'Sustentação ativada' };
  const kind = typeof payload.kind === 'string' ? kinds[payload.kind] ?? 'Efeito registrado' : 'Efeito registrado';
  const resource = payload.resource === 'hp' ? 'PV' : payload.resource === 'pe' ? 'PE' : payload.resource === 'san' ? 'SAN' : '';
  const before = payload.before;
  const after = payload.after;
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    if (payload.kind === 'resources') {
      const changes = [['hp_current', 'PV'], ['pe_current', 'PE'], ['san_current', 'SAN']]
        .filter(([key]) => typeof before[key] === 'number' && typeof after[key] === 'number')
        .map(([key, name]) => `${name} ${before[key]} → ${after[key]}`);
      return `${kind} · ${changes.join(' · ')}`;
    }
    if (typeof before.hp_current === 'number' && typeof after.hp_current === 'number') return `${kind} · PV ${before.hp_current} → ${after.hp_current}${typeof payload.value === 'number' ? ` · quantidade ${payload.value}` : ''}`;
    if (typeof before.current === 'number' && typeof after.current === 'number') return `${kind} · ${resource} ${before.current} → ${after.current}`;
    if (Array.isArray(before.conditions) && Array.isArray(after.conditions)) return `${kind} · ${before.conditions.length} → ${after.conditions.length} condição(ões)`;
  }
  return kind;
}
