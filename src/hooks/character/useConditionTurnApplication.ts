import { useRef } from 'react';
import { toast } from 'sonner';
import { activityClient, activityFailure, activityJson, awaitActivityResponse, confirmActivity } from '@/services/character-activity-service';
import { conditionsAfterTurn, validateTurnResolution, type ConditionTurnResolution } from '@/lib/rules/condition-turn';
import { parseConditions, serializeConditions, type PersistedCondition } from '@/lib/conditions/condition-serialization';
import { useAutoConditions } from '@/hooks/useAutoConditions';
import type { CharacterActivityEvent } from '@/types/character-activity';

export interface TurnCharacterSnapshot {
  id: string; vigor: number; hp_current: number; hp_max: number; pe_current: number; pe_max: number;
  san_current: number; san_max: number; conditions: (string | PersistedCondition)[];
}

/** Prepara um pedido imutável; repetir após falha conserva UUID, dados e snapshot originais. */
export function useConditionTurnApplication(character: TurnCharacterSnapshot | null | undefined,
  onConfirmed: (receipt: CharacterActivityEvent) => void) {
  const scope = useRef(character?.id);
  scope.current = character?.id;
  const confirmedCallback = useRef(onConfirmed);
  confirmedCallback.current = onConfirmed;
  const { processResourceChange } = useAutoConditions();
  return (resolution: ConditionTurnResolution) => {
    if (!character) throw new Error('Reabra a ficha antes de resolver o turno.');
    const amount = validateTurnResolution(resolution);
    const hp = Math.max(0, character.hp_current - amount);
    const next = conditionsAfterTurn(parseConditions(character.conditions), resolution);
    // O snapshot anterior preserva estabilização/acalmamento, e hpLoss identifica
    // nova perda mesmo em zero PV. Machucado acompanha o saldo em ambos os casos.
    const newConditions = processResourceChange(hp, character.hp_max, character.san_current, character.san_max, next, false,
      { hp: character.hp_current, san: character.san_current, hpLoss: amount }).newConditions;
    const operationId = crypto.randomUUID();
    const characterId = character.id;
    const args = { p_operation_id: operationId, p_character_id: characterId,
      p_values: { hp, pe: character.pe_current, san: character.san_current },
      p_expected: activityJson({ vigor: character.vigor, hp_current: character.hp_current, hp_max: character.hp_max,
        pe_current: character.pe_current, pe_max: character.pe_max, san_current: character.san_current,
        san_max: character.san_max, conditions: character.conditions }),
      p_conditions: activityJson(serializeConditions(newConditions)), p_resolution: activityJson(resolution) };
    return async () => {
      const { data, error } = await awaitActivityResponse(activityClient.rpc('resolve_character_condition_turn', args));
      if (error) throw activityFailure('O início de turno não foi confirmado.', error);
      const receipt = confirmActivity(data, characterId, operationId);
      if (scope.current === characterId) {
        // O pedido já foi confirmado. Falha de atualização da tela não pode virar nova aplicação.
        try { confirmedCallback.current(receipt); }
        catch { toast.warning('Turno confirmado no servidor. Recarregue a ficha para atualizar a visualização.'); }
      }
    };
  };
}
